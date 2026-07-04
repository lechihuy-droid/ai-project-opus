const app = document.getElementById("app");
const hubShell = document.getElementById("hub-shell");
const sidebarToggle = document.getElementById("hub-sidebar-toggle");
const sidebarBackdrop = document.getElementById("hub-sidebar-backdrop");
const usageFilters = { source: "", model: "", since: "" };
const toolFilters = { source: "", model: "", since: "" };
const CHAT_STORAGE_KEY = "harness-hub-chat";
const CHAT_SCROLL_THRESHOLD = 72;
const CHAT_COPY_NOTICE_MS = 1600;
const CHAT_MODEL_CATEGORIES = ["All", "Primary", "Fast", "Judge", "Cheap", "Fallback", "Multimodal"];
const CHAT_EMPTY_PROMPTS = [
  "Summarize this failure and suggest next checks.",
  "Draft a short test plan for this change.",
  "List risks before shipping this update.",
];
const chatState = {
  models: [],
  modelCatalog: [],
  defaultModel: "",
  model: "",
  selectedCategory: "All",
  searchQuery: "",
  modelPickerOpen: false,
  modelPickerActiveIndex: 0,
  modelCopyNotice: "",
  messages: [],
  sending: false,
  userNearBottom: true,
  copiedMessageIndex: null,
};
let autoRefreshTimer = null;
let jobEventSource = null;
let chatAbortController = null;
let shellChromeReady = false;
let shellStatusTimer = null;

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  initShellChrome();
  route();
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return text;
}

function safeMarkdownLanguage(value) {
  const first = String(value || "").trim().split(/\s+/)[0] || "";
  return /^[A-Za-z0-9_+.#-]{1,32}$/.test(first) ? first : "";
}

function renderMarkdownCodeBlock(escapedCode, language) {
  const safeLanguage = safeMarkdownLanguage(language);
  const label = safeLanguage ? `<span class="md-code-label">${escapeHtml(safeLanguage)}</span>` : "";
  return `<pre class="md-pre">${label}<button class="md-code-copy" type="button" data-md-code-copy>Copy</button><code>${escapedCode}</code></pre>`;
}

async function copyMarkdownCodeBlock(button) {
  const code = button.closest(".md-pre")?.querySelector("code");
  const text = code?.textContent || "";
  try {
    const copied = await copyTextToClipboard(text);
    if (!copied) showCopyFallback(text);
  } catch (_error) {
    showCopyFallback(text);
  }
  const previousLabel = button.textContent || "Copy";
  button.textContent = "Copied";
  button.classList.add("is-copied");
  window.setTimeout(() => {
    button.textContent = previousLabel;
    button.classList.remove("is-copied");
  }, CHAT_COPY_NOTICE_MS);
}

function extractMarkdownCodeBlocks(escapedSource) {
  const blocks = [];
  const output = [];
  const lines = String(escapedSource || "").replace(/\r\n?/g, "\n").split("\n");
  let inCode = false;
  let code = [];
  let language = "";

  const pushCodeBlock = () => {
    const index = blocks.length;
    blocks.push(renderMarkdownCodeBlock(code.join("\n"), language));
    output.push(`\x00MD_CODE_BLOCK_${index}\x00`);
    code = [];
    language = "";
  };

  lines.forEach((line) => {
    if (!inCode) {
      const openingFence = line.match(/^```(.*)$/);
      if (openingFence) {
        inCode = true;
        language = openingFence[1] || "";
        code = [];
        return;
      }
      output.push(line);
      return;
    }
    if (/^```\s*$/.test(line)) {
      inCode = false;
      pushCodeBlock();
      return;
    }
    code.push(line);
  });

  if (inCode) pushCodeBlock();
  return { text: output.join("\n"), blocks };
}

function restoreInlineMarkdownTokens(text, tokens) {
  return String(text || "").replace(/\x00MD_INLINE_(\d+)\x00/g, (_match, index) => tokens[Number(index)] || "");
}

function restoreLinkMarkdownTokens(text, tokens) {
  return String(text || "").replace(/\x00MD_LINK_(\d+)\x00/g, (_match, index) => tokens[Number(index)] || "");
}

function isSafeMarkdownHref(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function renderMarkdownInlineEscaped(value) {
  const tokens = [];
  const linkTokens = [];
  let text = String(value || "").replace(/`([^`\n]+)`/g, (_match, code) => {
    const index = tokens.length;
    tokens.push(`<code>${code}</code>`);
    return `\x00MD_INLINE_${index}\x00`;
  });

  text = text.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
    const safeHref = String(href || "").trim();
    if (!isSafeMarkdownHref(safeHref)) return match;
    const index = linkTokens.length;
    linkTokens.push(`<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    return `\x00MD_LINK_${index}\x00`;
  });
  text = text.replace(/\*\*([^*\n]+(?:\*(?!\*)[^*\n]*)*)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[\s([{>])\*([^*\s][^*\n]*?[^*\s]|\S)\*(?=$|[\s)\]},.!?:;<])/g, "$1<em>$2</em>");
  text = text.replace(/(^|[\s([{>])_([^_\s][^_\n]*?[^_\s]|\S)_(?=$|[\s)\]},.!?:;<])/g, "$1<em>$2</em>");
  return restoreInlineMarkdownTokens(restoreLinkMarkdownTokens(text, linkTokens), tokens);
}

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function getText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const raw = await response.text();
    let message = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.detail) message = Array.isArray(parsed.detail) ? parsed.detail.join("; ") : String(parsed.detail);
    } catch (_error) {
      /* keep raw response text */
    }
    throw new Error(`${response.status} ${response.statusText}: ${message}`);
  }
  return response.json();
}

function setSidebarOpen(open) {
  if (!hubShell || !sidebarToggle) return;
  hubShell.classList.toggle("sidebar-open", open);
  sidebarToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function closeSidebarOnMobile() {
  if (window.matchMedia("(max-width: 900px)").matches) {
    setSidebarOpen(false);
  }
}

function statusChip(id) {
  return document.getElementById(id);
}

function setStatusChip(id, status, label, ariaLabel) {
  const chip = statusChip(id);
  if (!chip) return;
  chip.dataset.status = status;
  chip.setAttribute("aria-label", ariaLabel || label);
  const labelNode = chip.querySelector(".hub-status-label");
  if (labelNode) labelNode.textContent = label;
}

const LIVE_RUN_STATES = new Set(["running", "in-progress", "in_progress", "in progress"]);

function countLiveRuns(runs) {
  if (!Array.isArray(runs)) return 0;
  return runs.filter((run) => {
    const state = String(run?.state || run?.status || "").toLowerCase();
    return LIVE_RUN_STATES.has(state);
  }).length;
}

async function updateShellStatus() {
  setStatusChip("hub-status-server", "ok", "server", "Server online");
  const [governanceResult, runsResult] = await Promise.allSettled([
    getJson("/api/governance"),
    getJson("/api/runs"),
  ]);

  if (governanceResult.status === "fulfilled") {
    const governance = governanceResult.value || {};
    const level = Number(governance.degradation || 0);
    const blocked = Array.isArray(governance.blocked_tiers) ? governance.blocked_tiers.length : 0;
    setStatusChip(
      "hub-status-degradation",
      level > 0 ? "warn" : "ok",
      `deg L${formatNumber(level)}`,
      `Degradation L${formatNumber(level)}, ${formatNumber(blocked)} blocked tiers`,
    );
  } else {
    setStatusChip("hub-status-degradation", "unknown", "deg L?", "Degradation unknown");
  }

  if (runsResult.status === "fulfilled") {
    const liveRuns = countLiveRuns(runsResult.value);
    setStatusChip("hub-status-runs", "ok", `${formatNumber(liveRuns)} runs`, `${formatNumber(liveRuns)} live runs`);
  } else {
    setStatusChip("hub-status-runs", "unknown", "? runs", "Live runs unknown");
  }
}

function initShellChrome() {
  if (shellChromeReady) return;
  shellChromeReady = true;
  sidebarToggle?.addEventListener("click", () => {
    setSidebarOpen(!hubShell?.classList.contains("sidebar-open"));
  });
  sidebarBackdrop?.addEventListener("click", () => setSidebarOpen(false));
  app?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const codeCopyButton = target.closest("[data-md-code-copy]");
    if (!(codeCopyButton instanceof HTMLButtonElement)) return;
    event.preventDefault();
    event.stopPropagation();
    await copyMarkdownCodeBlock(codeCopyButton);
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".chat-export-menu")) closeChatExportMenu();
    if (!target.closest(".chat-model-picker")) closeChatModelPicker();
  });
  document.querySelectorAll(".hub-sidebar .hub-nav a[data-route]").forEach((link) => {
    link.addEventListener("click", closeSidebarOnMobile);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebarOpen(false);
      closeChatExportMenu();
      closeChatModelPicker();
    }
  });
  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width: 900px)").matches) {
      setSidebarOpen(false);
    }
  });
  updateShellStatus();
  shellStatusTimer = window.setInterval(updateShellStatus, 15000);
}

function parseSseBlock(block) {
  const dataLines = [];
  let eventName = "message";
  block.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  });
  return { eventName, data: dataLines.join("\n") };
}

function renderMultilineText(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatLatency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  const seconds = Number(value);
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
}

function usageTokenBreakdown(totals) {
  const input = Number(totals?.input_tokens || 0);
  const output = Number(totals?.output_tokens || 0);
  const total = Number(totals?.total_tokens || 0);
  const nonCache = totals && totals.non_cache_tokens !== undefined
    ? Number(totals.non_cache_tokens || 0)
    : input + output;
  const cache = totals && totals.cache_tokens !== undefined
    ? Number(totals.cache_tokens || 0)
    : Math.max(0, total - nonCache);
  return { input, output, total, nonCache, cache };
}

function renderCacheLine(totals) {
  const breakdown = usageTokenBreakdown(totals);
  return `non-cache: ${formatNumber(breakdown.nonCache)} &middot; cache: ${formatNumber(breakdown.cache)}`;
}

function clearAutoRefresh() {
  if (autoRefreshTimer) {
    window.clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

function clearJobStream() {
  if (jobEventSource) {
    jobEventSource.close();
    jobEventSource = null;
  }
}

function clearChatStream() {
  if (chatAbortController) {
    chatAbortController.abort();
    chatAbortController = null;
  }
}

function setAutoRefresh(callback) {
  clearAutoRefresh();
  autoRefreshTimer = window.setInterval(callback, 10000);
}

let lastRunsSignature = null;
let dashboardRenderToken = 0;

function runsSignature(runs) {
  if (!Array.isArray(runs) || !runs.length) return "0:";
  return `${runs.length}:${runs[0].run_id || ""}`;
}

// Poll /api/runs only; when a new run appears, hand the fresh runs to a patch
// callback that updates just the run-related nodes in place - no full DOM
// rebuild, no usage/board re-fetch, so the view never visibly jumps.
function autoRefreshOnNewRuns(hash, patch) {
  setAutoRefresh(async () => {
    if ((location.hash || "#/") !== hash) return;
    try {
      const runs = await getJson("/api/runs");
      const sig = runsSignature(runs);
      if (sig === lastRunsSignature) return;
      lastRunsSignature = sig;
      patch(runs);
    } catch (_error) {
      /* ignore transient poll errors */
    }
  });
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function dashRunsCardInner(runs) {
  const latest = runs[0];
  return `
    <span class="badge navy">Runs</span>
    <div class="metric">${escapeHtml(runs.length)}</div>
    <p class="muted">Latest: ${latest ? runLink(latest) : "None"}</p>`;
}

function dashLatestCardInner(runs) {
  const latest = runs[0];
  return `
    <span class="badge ${latest && latest.status === "pass" ? "green" : "red"}">Latest</span>
    <div class="metric">${latest ? escapeHtml(latest.status) : "n/a"}</div>
    <p class="muted">${latest ? escapeHtml(latest.suite_name || latest.suite) : "No run data"}</p>`;
}

function dashUsageCardInner(usageRollup) {
  const usageTotals = usageRollup ? usageRollup.totals : { total_tokens: 0, calls: 0 };
  const topModel = usageRollup && usageRollup.by_model.length ? usageRollup.by_model[0].model : "n/a";
  return `
    <span class="badge navy">Usage 7d</span>
    <div class="metric">${formatNumber(usageTotals.total_tokens)} <span class="metric-label">incl. cache</span></div>
    <p class="muted">${renderCacheLine(usageTotals)}</p>
    <p class="muted">${formatNumber(usageTotals.calls)} calls &middot; ${escapeHtml(topModel)}</p>`;
}

function dashUsageLoadingCardInner() {
  return `
    <span class="badge navy">Usage 7d</span>
    <div class="skeleton-line" aria-hidden="true"></div>
    <p class="muted">Loading...</p>`;
}

function dashEntropyCardInner(entropy) {
  const flaggedEntropy = (entropy || []).filter((item) => item.flagged).length;
  return `
    <span class="badge ${flaggedEntropy ? "red" : "green"}">High Entropy</span>
    <div class="metric">${formatNumber(flaggedEntropy)}</div>
    <p class="muted">flagged sessions</p>
    <a class="link-button" href="#/violations">Open</a>`;
}

function dashEntropyLoadingCardInner() {
  return `
    <span class="badge navy">High Entropy</span>
    <div class="skeleton-line" aria-hidden="true"></div>
    <p class="muted">Loading...</p>
    <a class="link-button" href="#/violations">Open</a>`;
}

function patchDashboardSlowCard(renderToken, id, html) {
  if (renderToken !== dashboardRenderToken || (location.hash || "#/") !== "#/") return;
  setHtml(id, html);
}

function patchDashboardRuns(runs) {
  setHtml("dash-runs-card", dashRunsCardInner(runs));
  setHtml("dash-latest-card", dashLatestCardInner(runs));
  setHtml("dash-recent-runs", renderRunsTable(runs.slice(0, 8)));
}

function patchRunsTable(runs) {
  setHtml("runs-table-container", renderRunsTable(runs));
}

function usageQuery(filters) {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.model) params.set("model", filters.model);
  if (filters.since) params.set("since", filters.since);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function setActiveNav(path) {
  document.querySelectorAll(".hub-sidebar .hub-nav a[data-route]").forEach((link) => {
    const active = link.dataset.route === path;
    link.classList.toggle("active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setLoading(title) {
  app.innerHTML = `
    <div class="card loading-card" aria-busy="true">
      <div class="loading-heading">
        <span class="spinner" aria-hidden="true"></span>
        <h2>Loading ${escapeHtml(title)}</h2>
      </div>
      <div class="skeleton-grid" aria-hidden="true">
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
      </div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  `;
}

function setError(error) {
  app.innerHTML = `<div class="card error-card"><h2>Error</h2><p>${escapeHtml(error.message || error)}</p></div>`;
}

function statusBadge(status) {
  const normalized = String(status || "unknown").toLowerCase();
  const green = new Set(["pass", "accepted"]);
  const red = new Set(["fail", "failed", "rolledback", "rejected"]);
  const navy = new Set(["running", "awaiting-review"]);
  const color = green.has(normalized) ? "green" : red.has(normalized) ? "red" : navy.has(normalized) ? "navy" : "gray";
  return `<span class="badge ${color}">${escapeHtml(normalized)}</span>`;
}

function tierBadge(tier) {
  const normalized = String(tier || "unknown").toLowerCase();
  const css = normalized.replace(/_/g, "-");
  return `<span class="badge tier-badge tier-${escapeHtml(css)}">${escapeHtml(normalized)}</span>`;
}

function tierBadges(tiers) {
  const rows = Array.isArray(tiers) ? tiers : [];
  return rows.length ? rows.map(tierBadge).join(" ") : '<span class="badge gray">none</span>';
}

function decisionBadge(decision) {
  const normalized = String(decision || "not run").toLowerCase();
  const color = normalized === "deny" ? "red" : normalized === "warn" ? "gray" : normalized === "allow" ? "green" : "gray";
  return `<span class="badge ${color}">${escapeHtml(normalized)}</span>`;
}

function renderTextList(rows, emptyText) {
  const source = Array.isArray(rows) ? rows : rows ? [rows] : [];
  const items = source.filter(Boolean);
  if (!items.length) return `<p class="muted">${escapeHtml(emptyText)}</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function provenanceBadge(row) {
  const role = String(row?.provenance_role || row?.role || "unknown").toLowerCase();
  const trust = String(row?.trust || "trusted").toLowerCase();
  const color = trust === "untrusted" ? "red" : role === "model" ? "navy" : "gray";
  return `<span class="badge ${color} provenance-badge">${escapeHtml(role)}:${escapeHtml(trust)}</span>`;
}

function violationTotal(run) {
  return Number(run?.violations?.total || 0);
}

function violationBadge(total) {
  const count = Number(total || 0);
  return `<span class="badge ${count ? "red" : "green"}">${formatNumber(count)} violations</span>`;
}

function violationTrendLine(runs) {
  const points = (runs || []).slice(0, 8).reverse().map((run) => `${escapeHtml(run.run_id || "")}: ${formatNumber(violationTotal(run))}`);
  return points.length ? points.join(" / ") : "No runs";
}

function renderViolationSummary(violations) {
  const data = violations || {};
  return `
    <div class="card">
      ${violationBadge(data.total)}
      <div class="metric">${formatNumber(data.total)}</div>
      <p class="muted">Boundary failed: ${formatNumber(data.failed_boundary_checks)} &middot; dangerous: ${formatNumber(data.dangerous_command_checks)} &middot; tier&gt;=execute: ${formatNumber(data.evidence_commands_tier_execute_or_above)}</p>
    </div>
  `;
}

function boardLatestLine(board) {
  const latest = board?.progress?.latest_run;
  if (!latest) return "latest: n/a";
  return `latest: ${escapeHtml(latest.suite || latest.run_id || "n/a")} ${statusBadge(latest.status)}`;
}

function renderBudget(data) {
  if (!data) return "";
  const total = Number(data.steps_total || 0);
  const done = Number(data.steps_done || 0);
  const cap = Number(data.step_cap || 0);
  const denom = total > 0 ? total : cap || 1;
  const pct = Math.max(0, Math.min(100, Math.round((done / denom) * 100)));
  const unitLabel = data.kind === "time" ? "Elapsed" : "Checks";
  const capLabel = data.kind === "time" ? "Time cap" : "Step cap";
  const value = data.kind === "time" ? `${done}s/${total || "n/a"}s` : `${done}/${total || "n/a"}`;
  const tokenPart = data.tokens_used === null || data.token_cap === null
    ? ""
    : `<span class="muted">Tokens ${formatNumber(data.tokens_used)}/${formatNumber(data.token_cap)}</span>`;
  return `
    <div class="budget ${data.warn ? "warn" : ""}">
      <div class="budget-header">
        <span>${escapeHtml(unitLabel)} ${escapeHtml(value)}</span>
        <span class="muted">${escapeHtml(capLabel)} ${escapeHtml(cap || "n/a")}</span>
        ${tokenPart}
      </div>
      <div class="budget-track"><div class="budget-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function updateBudgetView(data) {
  const target = document.getElementById("budget-view");
  if (target) target.innerHTML = renderBudget(data);
}

function runLink(run) {
  return `<a href="#/runs/${encodeURIComponent(run.run_id)}">${escapeHtml(run.run_id)}</a>`;
}

function suiteLink(suite) {
  return `<a href="#/suites/${encodeURIComponent(suite.id)}">${escapeHtml(suite.id)}</a>`;
}

function jobLink(job) {
  return `<a href="#/jobs/${encodeURIComponent(job.id)}">${escapeHtml(job.id)}</a>`;
}

function formatDiffstat(stat) {
  const files = Number(stat?.files || 0);
  const insertions = Number(stat?.insertions || 0);
  const deletions = Number(stat?.deletions || 0);
  return `${files} files, +${insertions}/-${deletions}`;
}

function formatJobRuns(job) {
  const count = Number(job?.run_count || 0);
  const cap = Number(job?.run_cap || 0);
  return `runs: ${formatNumber(count)}/${cap ? formatNumber(cap) : "n/a"}`;
}

function jobArtifactSource(job) {
  return String(job?.provenance?.source || job?.source || "unknown");
}

function isHighRiskJob(job) {
  const tier = String(job?.max_tier || "").toLowerCase();
  return tier === "network" || tier === "destructive";
}

function renderJobRiskBanner(job) {
  if (!isHighRiskJob(job)) return "";
  return `
    <div class="job-risk-banner">
      <strong>High-risk diff</strong>
      ${tierBadge(job.max_tier)}
      <span>Review network or destructive changes before accepting.</span>
    </div>
  `;
}

function renderGovernanceCard(governance) {
  const data = governance || { degradation: 0, blocked_tiers: [] };
  const level = Number(data.degradation || 0);
  return `
    <div class="card governance-card ${level > 0 ? "alert" : ""}">
      <span class="badge ${level > 0 ? "red" : "green"}">Governance</span>
      <div class="metric">${formatNumber(level)}</div>
      <p class="muted">blocked: ${tierBadges(data.blocked_tiers || [])}</p>
      <a class="link-button" href="#/governance">Open</a>
    </div>
  `;
}

function renderInformFindings(findings) {
  const rows = Array.isArray(findings) ? findings : [];
  if (!rows.length) return '<p class="muted">No L1 findings.</p>';
  return `
    <ul class="finding-list">
      ${rows.map((item) => `
        <li>
          <span class="badge ${item.type === "injection_pattern" ? "red" : "gray"}">${escapeHtml(item.type || "finding")}</span>
          <code>${escapeHtml(item.pattern || "")}</code>
          <span class="muted">offset ${escapeHtml(item.offset ?? "")}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderJobPolicy(job) {
  const reasons = job.l2_decision === "warn" ? (job.l2_warnings || []) : (job.l2_reasons || []);
  return `
    <div class="policy-panel">
      <div>
        <h3>L1 Inform</h3>
        ${renderInformFindings(job.inform_findings || [])}
      </div>
      <div>
        <h3>L2 Verify</h3>
        <div>${decisionBadge(job.l2_decision)}</div>
        ${renderTextList(reasons, "No L2 reasons.")}
      </div>
      ${(job.approval_block_reasons || []).length ? `
        <div class="approval-block">
          <h3>Approve Blocked</h3>
          ${renderTextList(job.approval_block_reasons, "No block reasons.")}
        </div>
      ` : ""}
      ${(job.flag_reasons || []).length ? `
        <div class="approval-block">
          <h3>Finished Flagged</h3>
          ${renderTextList(job.flag_reasons, "No flag reasons.")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderJobsTable(jobs) {
  if (!jobs.length) {
    return '<p class="muted">No jobs found.</p>';
  }
  const rows = jobs.map((job) => `
    <tr>
      <td>${jobLink(job)}</td>
      <td>${statusBadge(job.status)}</td>
      <td>${escapeHtml(job.agent || "")}</td>
      <td>${tierBadge(job.max_tier)}</td>
      <td class="nowrap">${escapeHtml(formatJobRuns(job))}</td>
      <td>${escapeHtml(formatDiffstat(job.diffstat))}</td>
      <td class="nowrap">${escapeHtml(job.created_at || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Job</th><th>Status</th><th>Agent</th><th>Tier</th><th>Runs</th><th>Diffstat</th><th>Created</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderJobCreateForm() {
  return `
    <form id="job-create-form" class="job-form">
      <label>
        Brief
        <textarea name="brief" rows="5" required placeholder="Describe the isolated worktree job"></textarea>
      </label>
      <label>
        Agent
        <select name="agent">
          <option value="codex" selected>codex</option>
        </select>
      </label>
      <label class="job-check">
        <input name="allow_override" type="checkbox">
        Allow blocked tier override
      </label>
      <button class="link-button" type="submit">Create job</button>
      <span id="job-create-error" class="error-text"></span>
    </form>
  `;
}

function renderJobActions(job) {
  if (job.status === "awaiting-approval") {
    return `
      <div class="hub-actions">
        <button class="link-button" type="button" data-job-action="approve">Approve</button>
        <button class="link-button" type="button" data-job-action="reject">Reject</button>
      </div>
    `;
  }
  if (job.status === "awaiting-review") {
    return `
      <div class="hub-actions">
        <button class="link-button" type="button" data-job-action="accept">Accept</button>
        <button class="link-button" type="button" data-job-action="rollback">Rollback</button>
      </div>
    `;
  }
  return "";
}

function renderJobDiff(diffText) {
  if (!diffText) {
    return '<p class="muted">No diff available.</p>';
  }
  const lines = String(diffText).split(/\r?\n/).map((line) => {
    let cls = "diff-ctx";
    if (line.startsWith("+") && !line.startsWith("+++")) cls = "diff-add";
    if (line.startsWith("-") && !line.startsWith("---")) cls = "diff-del";
    return `<span class="${cls}">${escapeHtml(line || " ")}</span>`;
  }).join("");
  return `<div class="diff-code">${lines}</div>`;
}

function renderJobStreamPanel(job) {
  return `
    <div id="job-stream" class="card stream-card">
      <div class="hub-actions stream-header">
        <span class="badge navy">Job Stream</span>
        <span id="job-stream-status" class="muted">Streaming ${escapeHtml(job.id)}</span>
      </div>
      <div id="job-budget-view"></div>
      <pre><code id="job-stream-lines"></code></pre>
      <div id="job-stream-result" class="muted"></div>
    </div>
  `;
}

function updateJobBudgetView(data) {
  const target = document.getElementById("job-budget-view");
  if (target) target.innerHTML = renderBudget(data);
}

function appendJobStreamLine(line) {
  const output = document.getElementById("job-stream-lines");
  if (!output) return;
  output.textContent += `${line}\n`;
  output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

function streamJob(jobId) {
  clearJobStream();
  const status = document.getElementById("job-stream-status");
  jobEventSource = new EventSource(`/api/jobs/${encodeURIComponent(jobId)}/stream`);
  jobEventSource.addEventListener("line", (event) => {
    const payload = JSON.parse(event.data);
    appendJobStreamLine(payload.data);
  });
  jobEventSource.addEventListener("budget", (event) => {
    const payload = JSON.parse(event.data);
    updateJobBudgetView(payload.data);
  });
  jobEventSource.addEventListener("exit", async (event) => {
    const payload = JSON.parse(event.data);
    const data = payload.data || {};
    if (status) status.textContent = `Exited ${data.code}`;
    appendJobStreamLine(`exit ${data.code}`);
    clearJobStream();
    await renderJob(jobId);
  });
  jobEventSource.onerror = () => {
    if (status) status.textContent = "Stream error";
    clearJobStream();
  };
}

async function runJobAction(jobId, action) {
  await postJson(`/api/jobs/${encodeURIComponent(jobId)}/${action}`, {});
  await renderJob(jobId);
}

function wireJobActions(jobId) {
  document.querySelectorAll("[data-job-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.jobAction;
      button.disabled = true;
      try {
        await runJobAction(jobId, action);
      } catch (error) {
        const message = error.message || String(error);
        await renderJob(jobId);
        const result = document.getElementById("job-action-result");
        if (result) result.innerHTML = `<span class="error-text">${escapeHtml(message)}</span>`;
      }
    });
  });
}

function wireJobCreateForm() {
  const form = document.getElementById("job-create-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const errorTarget = document.getElementById("job-create-error");
    if (errorTarget) errorTarget.textContent = "";
    try {
      const job = await postJson("/api/jobs", {
        brief: String(data.get("brief") || ""),
        agent: String(data.get("agent") || "codex"),
        allow_override: data.get("allow_override") === "on",
      });
      location.hash = `#/jobs/${encodeURIComponent(job.id)}`;
    } catch (error) {
      if (errorTarget) errorTarget.textContent = error.message || String(error);
    }
  });
}

function renderRunsTable(runs) {
  if (!runs.length) {
    return '<p class="muted">No runs found.</p>';
  }
  const rows = runs.map((run) => `
    <tr>
      <td>${runLink(run)}</td>
      <td>${escapeHtml(run.suite_name || run.suite)}</td>
      <td>${statusBadge(run.status)}</td>
      <td class="nowrap">${escapeHtml(`${run.passed}/${run.total}`)}</td>
      <td class="nowrap">${violationBadge(violationTotal(run))}</td>
      <td class="nowrap">${escapeHtml(run.duration_seconds)}s</td>
      <td class="nowrap">${escapeHtml(run.finished_at || run.started_at || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Run</th><th>Suite</th><th>Status</th><th>Checks</th><th>Violations</th><th>Duration</th><th>Finished</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderComparePanel(runs) {
  if (runs.length < 2) {
    return '<div class="card"><span class="badge gray">Compare</span><p class="muted">Need at least two runs.</p></div>';
  }
  const options = runs.map((run) => `<option value="${escapeHtml(run.run_id)}">${escapeHtml(run.run_id)} (${escapeHtml(run.status)})</option>`).join("");
  return `
    <div class="card compare-card">
      <span class="badge navy">Compare Runs</span>
      <div class="compare-form">
        <label>Base<select id="compare-a">${options}</select></label>
        <label>Target<select id="compare-b">${options}</select></label>
        <button class="link-button" type="button" id="compare-run">Compare</button>
      </div>
      <div id="compare-view" class="compare-view"></div>
    </div>
  `;
}

function renderCompareResult(diff) {
  const changed = diff.changed || [];
  const added = diff.added || [];
  const removed = diff.removed || [];
  const changedRows = changed.map((item) => `
    <tr>
      <td><code>${escapeHtml(item.id)}</code></td>
      <td>${escapeHtml(item.type || "")}</td>
      <td>${statusBadge(item.from_status)} &rarr; ${statusBadge(item.to_status)}</td>
      <td>${escapeHtml(item.to_message || item.from_message || "")}</td>
    </tr>
  `).join("");
  const addedRows = added.map((item) => `
    <tr><td><code>${escapeHtml(item.id)}</code></td><td>${escapeHtml(item.type || "")}</td><td>${statusBadge(item.status)}</td><td>${escapeHtml(item.message || "")}</td></tr>
  `).join("");
  const removedRows = removed.map((item) => `
    <tr><td><code>${escapeHtml(item.id)}</code></td><td>${escapeHtml(item.type || "")}</td><td>${statusBadge(item.status)}</td><td>${escapeHtml(item.message || "")}</td></tr>
  `).join("");
  if (!changed.length && !added.length && !removed.length) {
    return '<p class="muted">No check status differences.</p>';
  }
  return `
    <div class="diff-summary">
      <span class="badge navy">${escapeHtml(changed.length)} changed</span>
      <span class="badge green">${escapeHtml(added.length)} added</span>
      <span class="badge gray">${escapeHtml(removed.length)} removed</span>
    </div>
    ${changed.length ? `<h3>Status Changes</h3><div class="table-scroll"><table><thead><tr><th>Check</th><th>Type</th><th>Status</th><th>Message</th></tr></thead><tbody>${changedRows}</tbody></table></div>` : ""}
    ${added.length ? `<h3>Added</h3><div class="table-scroll"><table><tbody>${addedRows}</tbody></table></div>` : ""}
    ${removed.length ? `<h3>Removed</h3><div class="table-scroll"><table><tbody>${removedRows}</tbody></table></div>` : ""}
  `;
}

function wireRunCompare(runs) {
  const aSelect = document.getElementById("compare-a");
  const bSelect = document.getElementById("compare-b");
  const button = document.getElementById("compare-run");
  const target = document.getElementById("compare-view");
  if (!aSelect || !bSelect || !button || !target) return;
  if (runs[1]) aSelect.value = runs[1].run_id;
  if (runs[0]) bSelect.value = runs[0].run_id;
  button.addEventListener("click", async () => {
    target.innerHTML = '<p class="muted">Comparing...</p>';
    try {
      const diff = await getJson(`/api/runs/compare?a=${encodeURIComponent(aSelect.value)}&b=${encodeURIComponent(bSelect.value)}`);
      target.innerHTML = renderCompareResult(diff);
    } catch (error) {
      target.innerHTML = `<div class="error-text">${escapeHtml(error.message || error)}</div>`;
    }
  });
}

function renderIntegrityPanel(integrity) {
  const suites = integrity?.suites || [];
  const failing = suites.filter((item) => !item.ok);
  const rows = suites.map((item) => `
    <tr>
      <td><code>${escapeHtml(item.suite)}</code></td>
      <td>${item.ok ? '<span class="badge green">ok</span>' : '<span class="badge red">mismatch</span>'}</td>
      <td><code>${escapeHtml(String(item.actual || "").slice(0, 16))}</code></td>
    </tr>
  `).join("");
  return `
    <div class="card integrity-card ${failing.length ? "integrity-fail" : ""}">
      <span class="badge ${failing.length ? "red" : "green"}">Suite Integrity</span>
      <div class="metric">${formatNumber(failing.length)}</div>
      <p class="muted">${formatNumber(suites.length)} signed suite manifests checked.</p>
      ${rows ? `<details><summary>Manifest signatures</summary><div class="table-scroll"><table><thead><tr><th>Suite</th><th>Status</th><th>Actual</th></tr></thead><tbody>${rows}</tbody></table></div></details>` : ""}
    </div>
  `;
}

function renderSuitesTable(suites) {
  if (!suites.length) {
    return '<p class="muted">No suites found.</p>';
  }
  const rows = suites.map((suite) => `
    <tr>
      <td>${suiteLink(suite)}</td>
      <td>${escapeHtml(suite.name)}</td>
      <td>${escapeHtml(suite.check_count)}</td>
      <td>${escapeHtml(suite.path)}</td>
      <td><button class="link-button" type="button" data-suite-run="${escapeHtml(suite.id)}">Run</button></td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Checks</th><th>Path</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderChecksTable(checks, withLogs) {
  if (!checks.length) {
    return '<p class="muted">No checks found.</p>';
  }
  const rows = checks.map((check) => {
    const logs = withLogs && check.logs && check.logs.length
      ? check.logs.map((rel) => `<button class="link-button" type="button" data-artifact="${escapeHtml(rel)}">${escapeHtml(rel)}</button>`).join(" ")
      : withLogs ? '<span class="placeholder-text">&mdash;</span>' : "";
    return `
      <tr>
        <td><code>${escapeHtml(check.id)}</code></td>
        <td>${escapeHtml(check.type)}</td>
        <td>${check.status ? statusBadge(check.status) : ""}</td>
        <td>${check.command_tier ? tierBadge(check.command_tier) : ""}</td>
        <td>${escapeHtml(check.message || check.hint || "")}</td>
        <td class="nowrap">${check.duration_seconds === undefined ? "" : `${escapeHtml(check.duration_seconds)}s`}</td>
        <td>${logs}</td>
      </tr>
    `;
  }).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Check</th><th>Type</th><th>Status</th><th>Tier</th><th>Message</th><th>Duration</th><th>Logs</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function flushMarkdownList(state, output) {
  if (!state.items.length) {
    return;
  }
  output.push(`<${state.type}>${state.items.map((item) => `<li>${renderMarkdownInlineEscaped(item)}</li>`).join("")}</${state.type}>`);
  state.items = [];
  state.type = "";
}

function flushMarkdownParagraph(buffer, output) {
  if (!buffer.length) {
    return;
  }
  output.push(`<p>${buffer.map(renderMarkdownInlineEscaped).join("<br>")}</p>`);
  buffer.length = 0;
}

function flushMarkdownTable(buffer, output) {
  if (!buffer.length) return;
  const rows = buffer
    .filter((line) => !/^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
  if (!rows.length) {
    buffer.length = 0;
    return;
  }
  const [head, ...body] = rows;
  output.push(`
    <div class="table-scroll">
      <table>
        <thead><tr>${head.map((cell) => `<th>${renderMarkdownInlineEscaped(cell)}</th>`).join("")}</tr></thead>
        <tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${renderMarkdownInlineEscaped(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `);
  buffer.length = 0;
}

function renderMarkdown(markdown) {
  const escaped = escapeHtml(markdown);
  const extracted = extractMarkdownCodeBlocks(escaped);
  const output = [];
  const tableBuffer = [];
  const paragraphBuffer = [];
  const listState = { type: "", items: [] };
  const lines = extracted.text.split("\n");

  for (const line of lines) {
    const codeToken = line.match(/^\x00MD_CODE_BLOCK_(\d+)\x00$/);
    if (codeToken) {
      flushMarkdownTable(tableBuffer, output);
      flushMarkdownList(listState, output);
      flushMarkdownParagraph(paragraphBuffer, output);
      output.push(extracted.blocks[Number(codeToken[1])] || "");
      continue;
    }

    if (!line.trim()) {
      flushMarkdownTable(tableBuffer, output);
      flushMarkdownList(listState, output);
      flushMarkdownParagraph(paragraphBuffer, output);
      continue;
    }

    if (line.trim().startsWith("|")) {
      flushMarkdownList(listState, output);
      flushMarkdownParagraph(paragraphBuffer, output);
      tableBuffer.push(line);
      continue;
    }

    flushMarkdownTable(tableBuffer, output);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushMarkdownParagraph(paragraphBuffer, output);
      const nextType = ordered ? "ol" : "ul";
      if (listState.type && listState.type !== nextType) flushMarkdownList(listState, output);
      listState.type = nextType;
      listState.items.push((ordered || unordered)[1]);
      continue;
    }

    flushMarkdownList(listState, output);
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushMarkdownParagraph(paragraphBuffer, output);
      output.push(`<h4 class="md-heading md-heading-${heading[1].length}">${renderMarkdownInlineEscaped(heading[2])}</h4>`);
      continue;
    }
    paragraphBuffer.push(line);
  }

  flushMarkdownTable(tableBuffer, output);
  flushMarkdownList(listState, output);
  flushMarkdownParagraph(paragraphBuffer, output);
  return output.join("");
}

function ensureStreamPanel() {
  let panel = document.getElementById("run-stream");
  if (!panel) {
    app.insertAdjacentHTML("afterbegin", `
      <div id="run-stream" class="card stream-card">
        <div class="hub-actions stream-header">
          <span class="badge navy">Run Stream</span>
          <span id="run-stream-status" class="muted"></span>
        </div>
        <div id="budget-view"></div>
        <pre><code id="run-stream-lines"></code></pre>
        <div id="run-stream-result" class="muted"></div>
      </div>
    `);
    panel = document.getElementById("run-stream");
  }
  return panel;
}

function appendStreamLine(line) {
  const output = document.getElementById("run-stream-lines");
  if (!output) return;
  output.textContent += `${line}\n`;
  output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

async function refreshRunSummary() {
  const result = document.getElementById("run-stream-result");
  if (!result) return;
  const runs = await getJson("/api/runs");
  const latest = runs[0];
  result.innerHTML = latest ? `Latest run: ${runLink(latest)} ${statusBadge(latest.status)}` : "No runs found.";
}

async function triggerSuiteRun(suiteId, checkId) {
  ensureStreamPanel();
  const status = document.getElementById("run-stream-status");
  const output = document.getElementById("run-stream-lines");
  const result = document.getElementById("run-stream-result");
  status.textContent = `Starting ${suiteId}...`;
  output.textContent = "";
  result.textContent = "";

  try {
    const body = checkId ? { suite: suiteId, check: checkId } : { suite: suiteId };
    const started = await postJson("/api/runs/trigger", body);
    status.textContent = `Streaming ${suiteId}`;
    updateBudgetView(await getJson(`/api/runs/budget/${encodeURIComponent(started.stream_id)}`));
    const source = new EventSource(`/api/runs/stream/${encodeURIComponent(started.stream_id)}`);
    source.addEventListener("line", (event) => {
      const payload = JSON.parse(event.data);
      appendStreamLine(payload.data);
    });
    source.addEventListener("budget", (event) => {
      const payload = JSON.parse(event.data);
      updateBudgetView(payload.data);
    });
    source.addEventListener("exit", async (event) => {
      const payload = JSON.parse(event.data);
      const data = payload.data || {};
      status.textContent = `Exited ${data.code}`;
      appendStreamLine(`exit ${data.code}${data.run_id ? ` run_id=${data.run_id}` : ""}`);
      source.close();
      await refreshRunSummary();
    });
    source.onerror = () => {
      status.textContent = "Stream error";
      source.close();
    };
  } catch (error) {
    status.textContent = "Run failed to start";
    result.innerHTML = `<span class="error-text">${escapeHtml(error.message || error)}</span>`;
  }
}

function wireSuiteRunButtons() {
  document.querySelectorAll("[data-suite-run]").forEach((button) => {
    button.addEventListener("click", () => {
      triggerSuiteRun(button.dataset.suiteRun);
    });
  });
}

async function renderDashboard() {
  setActiveNav("/");
  setLoading("Dashboard");
  const renderToken = ++dashboardRenderToken;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [runs, suites, board, governance] = await Promise.all([
    getJson("/api/runs"),
    getJson("/api/suites"),
    getJson("/api/board").catch(() => null),
    getJson("/api/governance").catch(() => null),
  ]);
  if (renderToken !== dashboardRenderToken || (location.hash || "#/") !== "#/") return;
  const recentViolations = runs.slice(0, 8).reduce((sum, run) => sum + violationTotal(run), 0);
  app.innerHTML = `
    <div class="page-hero">
      <h1>Dashboard</h1>
      <p class="lead">Local control plane for suite runs, reports, suite definitions, and AI usage.</p>
    </div>
    <div class="hub-actions"><button class="link-button" type="button" id="dashboard-refresh">Refresh</button></div>
    <div class="card-grid dashboard-grid">
      <div class="card" id="dash-runs-card">${dashRunsCardInner(runs)}</div>
      <div class="card">
        <span class="badge navy">Suites</span>
        <div class="metric">${escapeHtml(suites.length)}</div>
        <p class="muted">Checks: ${escapeHtml(suites.reduce((sum, suite) => sum + suite.check_count, 0))}</p>
      </div>
      <div class="card" id="dash-latest-card">${dashLatestCardInner(runs)}</div>
      <div class="card" id="dash-usage-card">${dashUsageLoadingCardInner()}</div>
      <div class="card" id="dash-entropy-card">${dashEntropyLoadingCardInner()}</div>
      <div class="card">
        <span class="badge ${recentViolations ? "red" : "green"}">Violations</span>
        <div class="metric">${formatNumber(recentViolations)}</div>
        <p class="muted">${violationTrendLine(runs)}</p>
      </div>
      ${renderGovernanceCard(governance)}
      <div class="card task-board-card">
        <span class="badge navy">Task Board</span>
        <div class="metric">${escapeHtml(board && board.owner ? board.owner : "n/a")}</div>
        <p class="muted">${escapeHtml(board && board.objective ? board.objective.split("\\n")[0].slice(0, 110) : "No board data")}</p>
        <p class="muted">${boardLatestLine(board)}</p>
        <a class="link-button" href="#/board">Open</a>
      </div>
    </div>
    <h2>Recent Runs</h2>
    <div id="dash-recent-runs">${renderRunsTable(runs.slice(0, 8))}</div>
    <h2>Suites</h2>
    ${renderSuitesTable(suites)}
  `;
  document.getElementById("dashboard-refresh")?.addEventListener("click", renderDashboard);
  wireSuiteRunButtons();
  lastRunsSignature = runsSignature(runs);
  autoRefreshOnNewRuns("#/", patchDashboardRuns);
  getJson(`/api/usage/rollup${usageQuery({ since: sevenDaysAgo })}`)
    .catch(() => null)
    .then((usageRollup) => {
      patchDashboardSlowCard(renderToken, "dash-usage-card", dashUsageCardInner(usageRollup));
    });
  getJson("/api/sessions/entropy")
    .catch(() => [])
    .then((entropy) => {
      patchDashboardSlowCard(renderToken, "dash-entropy-card", dashEntropyCardInner(entropy));
    });
}

async function renderRuns() {
  setActiveNav("/runs");
  setLoading("Runs");
  const runs = await getJson("/api/runs");
  app.innerHTML = `
    <div class="hub-actions"><button class="link-button" type="button" id="runs-refresh">Refresh</button></div>
    <h2>Runs</h2>
    ${renderComparePanel(runs)}
    <div id="runs-table-container">${renderRunsTable(runs)}</div>
  `;
  document.getElementById("runs-refresh")?.addEventListener("click", renderRuns);
  wireRunCompare(runs);
  lastRunsSignature = runsSignature(runs);
  autoRefreshOnNewRuns("#/runs", patchRunsTable);
}

async function renderRun(runId) {
  setActiveNav("/runs");
  setLoading(runId);
  const detail = await getJson(`/api/runs/${encodeURIComponent(runId)}`);
  const summary = detail.summary;
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/runs">Back to runs</a></div>
    <div class="card">
      ${statusBadge(summary.status)}
      <h2>${escapeHtml(summary.run_id)}</h2>
      <p class="muted">${escapeHtml(summary.suite_name || summary.suite)} &middot; ${escapeHtml(summary.passed)}/${escapeHtml(summary.total)} checks &middot; ${escapeHtml(summary.duration_seconds)}s</p>
    </div>
    ${renderViolationSummary(detail.violations || summary.violations)}
    <h2>Checks</h2>
    ${renderChecksTable(detail.checks, true)}
    <h2>Artifacts</h2>
    <div class="hub-actions">
      ${detail.artifacts.map((rel) => `<button class="link-button" type="button" data-artifact="${escapeHtml(rel)}">${escapeHtml(rel)}</button>`).join("")}
    </div>
    <div id="artifact-view" class="artifact-view"></div>
    <div class="report-view">
      ${renderMarkdown(detail.report_md)}
    </div>
  `;
  wireArtifactButtons(runId);
}

async function renderJobs() {
  setActiveNav("/jobs");
  setLoading("Jobs");
  const jobs = await getJson("/api/jobs");
  app.innerHTML = `
    <div class="hub-actions"><button class="link-button" type="button" id="jobs-refresh">Refresh</button></div>
    <div class="page-hero">
      <h1>Jobs</h1>
      <p class="lead">Git worktree jobs with approval and review gates.</p>
    </div>
    <div class="card">
      <span class="badge navy">Create</span>
      ${renderJobCreateForm()}
    </div>
    <h2>Job List</h2>
    <div id="jobs-table-container">${renderJobsTable(jobs)}</div>
  `;
  document.getElementById("jobs-refresh")?.addEventListener("click", renderJobs);
  wireJobCreateForm();
}

async function renderJob(jobId) {
  setActiveNav("/jobs");
  setLoading(jobId);
  const job = await getJson(`/api/jobs/${encodeURIComponent(jobId)}`);
  const showDiff = ["awaiting-review", "accepted", "rolledback"].includes(job.status);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/jobs">Back to jobs</a></div>
    <div class="card">
      ${statusBadge(job.status)}
      ${tierBadge(job.max_tier)}
      <h2>${escapeHtml(job.id)}</h2>
      <p class="muted job-meta-line">
        <span>${escapeHtml(job.agent || "")} &middot; ${escapeHtml(formatDiffstat(job.diffstat))}</span>
        <span class="badge gray">${escapeHtml(formatJobRuns(job))}</span>
        <span class="badge gray">source: ${escapeHtml(jobArtifactSource(job))}</span>
        <span class="badge ${job.brief_ok ? "green" : "red"}">brief ${job.brief_ok ? "ok" : "changed"}</span>
      </p>
      <p>${escapeHtml(job.brief || "")}</p>
      <p class="muted"><code>${escapeHtml(job.branch || "")}</code></p>
      <p class="muted">Base <code>${escapeHtml(job.base_sha || "")}</code></p>
      <p class="muted">Created ${escapeHtml(job.created_at || "")}${job.started_at ? ` &middot; started ${escapeHtml(job.started_at)}` : ""}${job.finished_at ? ` &middot; finished ${escapeHtml(job.finished_at)}` : ""}</p>
      ${renderJobPolicy(job)}
      ${renderJobActions(job)}
      <div id="job-action-result" class="muted"></div>
    </div>
    ${job.status === "running" ? renderJobStreamPanel(job) : ""}
    ${showDiff ? `<h2>Diff</h2>${renderJobRiskBanner(job)}${renderJobDiff(job.diff || "")}` : ""}
  `;
  wireJobActions(job.id);
  if (job.status === "running") {
    streamJob(job.id);
  }
}

async function renderSuites() {
  setActiveNav("/suites");
  setLoading("Suites");
  const [suites, integrity] = await Promise.all([
    getJson("/api/suites"),
    getJson("/api/integrity").catch(() => null),
  ]);
  app.innerHTML = `<h2>Suites</h2>${integrity ? renderIntegrityPanel(integrity) : ""}${renderSuitesTable(suites)}`;
  wireSuiteRunButtons();
}

async function renderSuite(suiteId) {
  setActiveNav("/suites");
  setLoading(suiteId);
  const suite = await getJson(`/api/suites/${encodeURIComponent(suiteId)}`);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/suites">Back to suites</a></div>
    <div class="card">
      <span class="badge navy">${escapeHtml(suite.id)}</span>
      <h2>${escapeHtml(suite.name)}</h2>
      <p>${escapeHtml(suite.description || "")}</p>
      <p class="muted">${escapeHtml(suite.check_count)} checks &middot; ${escapeHtml(suite.path)}</p>
      <div class="hub-actions">
        <button class="link-button" type="button" data-suite-run="${escapeHtml(suite.id)}">Run</button>
      </div>
    </div>
    <h2>Checks</h2>
    ${renderChecksTable(suite.checks, false)}
  `;
  wireSuiteRunButtons();
}

function renderUsageFilters() {
  const sinceDate = usageFilters.since ? usageFilters.since.slice(0, 10) : "";
  return `
    <form id="usage-filter" class="usage-filter">
      <label>
        Source
        <select name="source">
          <option value="" ${usageFilters.source ? "" : "selected"}>All</option>
          <option value="claude" ${usageFilters.source === "claude" ? "selected" : ""}>Claude</option>
          <option value="codex" ${usageFilters.source === "codex" ? "selected" : ""}>Codex</option>
          <option value="inspect" ${usageFilters.source === "inspect" ? "selected" : ""}>Inspect</option>
        </select>
      </label>
      <label>
        Model
        <input name="model" value="${escapeHtml(usageFilters.model)}" placeholder="exact model">
      </label>
      <label>
        Since
        <input name="since" type="date" value="${escapeHtml(sinceDate)}">
      </label>
      <button class="link-button" type="submit">Apply</button>
      <button class="link-button" type="button" id="usage-reset">Reset</button>
    </form>
  `;
}

function renderUsageTable(events) {
  if (!events.length) {
    return '<p class="muted">No usage events found.</p>';
  }
  const rows = events.slice(0, 200).map((item) => `
    <tr>
      <td class="nowrap">${escapeHtml(item.ts)}</td>
      <td>${escapeHtml(item.source)}</td>
      <td>${escapeHtml(item.model)}</td>
      <td class="nowrap">${formatNumber(item.total_tokens)}</td>
      <td class="nowrap">${formatNumber(item.calls)}</td>
      <td>${escapeHtml(item.session)}</td>
      <td>${escapeHtml(item.command || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Time</th><th>Source</th><th>Model</th><th>Tokens</th><th>Calls</th><th>Session</th><th>Command</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function wireUsageFilters() {
  const form = document.getElementById("usage-filter");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      usageFilters.source = String(data.get("source") || "");
      usageFilters.model = String(data.get("model") || "").trim();
      const since = String(data.get("since") || "");
      usageFilters.since = since ? `${since}T00:00:00+00:00` : "";
      renderUsage();
    });
  }
  const reset = document.getElementById("usage-reset");
  if (reset) {
    reset.addEventListener("click", () => {
      usageFilters.source = "";
      usageFilters.model = "";
      usageFilters.since = "";
      renderUsage();
    });
  }
}

async function renderUsage() {
  setActiveNav("/usage");
  setLoading("Usage");
  const query = usageQuery(usageFilters);
  const [events, rollup] = await Promise.all([
    getJson(`/api/usage${query}`),
    getJson(`/api/usage/rollup${query}`),
  ]);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <h2>AI Usage</h2>
    ${renderUsageFilters()}
    <div class="card-grid usage-metrics">
      <div class="card">
        <span class="badge navy">Tokens</span>
        <div class="metric">${formatNumber(rollup.totals.total_tokens)} <span class="metric-label">incl. cache</span></div>
        <p class="muted">${formatNumber(rollup.totals.input_tokens)} input &middot; ${formatNumber(rollup.totals.output_tokens)} output</p>
        <p class="muted">${renderCacheLine(rollup.totals)}</p>
      </div>
      <div class="card">
        <span class="badge navy">Calls</span>
        <div class="metric">${formatNumber(rollup.totals.calls)}</div>
        <p class="muted">${rollup.by_source.map((item) => `${escapeHtml(item.source)} ${formatNumber(item.calls)}`).join(" &middot; ") || "No calls"}</p>
      </div>
    </div>
    <div class="usage-charts">
      <section>
        <h3>Tokens by Model</h3>
        <div id="usage-model-chart"></div>
      </section>
      <section>
        <h3>Tokens by Day</h3>
        <p class="muted chart-note">Most recent 30 days</p>
        <div class="chart-scroll"><div id="usage-day-chart"></div></div>
        ${rollup.by_day.length > 30 ? '<details class="usage-chart-details"><summary>All days</summary><div class="chart-scroll"><div id="usage-day-chart-all"></div></div></details>' : ""}
      </section>
    </div>
    <h3>Events</h3>
    ${renderUsageTable(events)}
  `;
  wireUsageFilters();
  window.HubCharts.barChart(document.getElementById("usage-model-chart"), rollup.by_model.slice(0, 12), "model", "total_tokens");
  window.HubCharts.barChart(document.getElementById("usage-day-chart"), rollup.by_day.slice(-30), "day", "total_tokens");
  window.HubCharts.barChart(document.getElementById("usage-day-chart-all"), rollup.by_day, "day", "total_tokens");
}

function normalizeChatModelCatalog(catalog, models) {
  const allowed = new Set(models);
  const rows = Array.isArray(catalog) ? catalog : [];
  const normalized = rows.map((row, index) => {
    const id = String(row?.id || "");
    if (!id || (allowed.size && !allowed.has(id))) return null;
    return {
      rank: Number(row?.rank || index + 1),
      id,
      shortName: String(row?.shortName || id),
      label: String(row?.label || id),
      category: String(row?.category || "Fallback"),
      bestFor: String(row?.bestFor || ""),
      strengths: Array.isArray(row?.strengths) ? row.strengths.map((item) => String(item)) : [],
      weaknesses: Array.isArray(row?.weaknesses) ? row.weaknesses.map((item) => String(item)) : [],
      recommendedUse: String(row?.recommendedUse || ""),
      avoidWhen: String(row?.avoidWhen || ""),
      unavailable: Boolean(row?.unavailable),
    };
  }).filter(Boolean);
  if (normalized.length) return normalized;
  return models.map((id, index) => ({
    rank: index + 1,
    id,
    shortName: id,
    label: id,
    category: "Fallback",
    bestFor: "",
    strengths: [],
    weaknesses: [],
    recommendedUse: "",
    avoidWhen: "",
    unavailable: false,
  }));
}

function getChatModelCatalog() {
  return chatState.modelCatalog.length ? chatState.modelCatalog : normalizeChatModelCatalog([], chatState.models);
}

function getChatModelById(modelId) {
  return getChatModelCatalog().find((row) => row.id === modelId) || null;
}

function getSelectedChatModelRow() {
  return getChatModelById(getCurrentChatModel()) || getChatModelCatalog()[0] || null;
}

function isChatModelSelectable(row) {
  return Boolean(row && !row.unavailable);
}

function chatModelDisplayLabel(row) {
  if (!row) return "No model available";
  return `${row.label}${row.unavailable ? " (unavailable)" : ""}`;
}

function chatModelCategoryClass(category) {
  return String(category || "fallback").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "fallback";
}

function getFilteredChatModels() {
  const query = chatState.searchQuery.trim().toLowerCase();
  return getChatModelCatalog().filter((row) => {
    const categoryMatch = chatState.selectedCategory === "All" || row.category === chatState.selectedCategory;
    if (!categoryMatch) return false;
    if (!query) return true;
    return [row.shortName, row.id, row.category].some((value) => String(value).toLowerCase().includes(query));
  });
}

function clampChatModelActiveIndex(models) {
  if (!models.length) {
    chatState.modelPickerActiveIndex = 0;
    return;
  }
  chatState.modelPickerActiveIndex = Math.max(0, Math.min(chatState.modelPickerActiveIndex, models.length - 1));
  if (isChatModelSelectable(models[chatState.modelPickerActiveIndex])) return;
  const selectableIndex = models.findIndex(isChatModelSelectable);
  chatState.modelPickerActiveIndex = selectableIndex >= 0 ? selectableIndex : 0;
}

function renderChatModelCategoryChips() {
  return CHAT_MODEL_CATEGORIES.map((category) => {
    const active = chatState.selectedCategory === category;
    return `
      <button class="chat-model-chip chat-model-control${active ? " is-active" : ""}" type="button" data-chat-model-category="${escapeHtml(category)}" aria-pressed="${active ? "true" : "false"}">
        ${escapeHtml(category)}
      </button>
    `;
  }).join("");
}

function renderChatModelList() {
  const rows = getFilteredChatModels();
  clampChatModelActiveIndex(rows);
  if (!rows.length) {
    return '<div class="chat-model-empty" role="status">No matching models.</div>';
  }
  return rows.map((row, index) => {
    const selected = row.id === chatState.model;
    const active = index === chatState.modelPickerActiveIndex;
    const unavailable = Boolean(row.unavailable);
    return `
      <button class="chat-model-option chat-model-control${selected ? " is-selected" : ""}${active ? " is-active" : ""}${unavailable ? " is-unavailable" : ""}" id="chat-model-option-${index}" type="button" role="option" aria-selected="${selected ? "true" : "false"}" aria-disabled="${unavailable ? "true" : "false"}" data-chat-model-id="${escapeHtml(row.id)}" data-chat-model-unavailable="${unavailable ? "true" : "false"}" ${unavailable ? "disabled" : ""}>
        ${escapeHtml(chatModelDisplayLabel(row))}
      </button>
    `;
  }).join("");
}

function renderChatModelBullets(items) {
  if (!items.length) return '<li class="muted">None listed.</li>';
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderChatModelDetail() {
  const row = getSelectedChatModelRow();
  if (!row) {
    return '<section class="chat-model-detail" aria-label="Selected model details"><p class="muted">No model selected.</p></section>';
  }
  const categoryClass = chatModelCategoryClass(row.category);
  const copied = chatState.modelCopyNotice === "Copied";
  const unavailableNote = row.unavailable
    ? '<p class="muted chat-model-unavailable-note">Unavailable for this session.</p>'
    : "";
  return `
    <section class="chat-model-detail" aria-label="Selected model details">
      <div class="chat-model-detail-header">
        <h2>${escapeHtml(row.shortName)}</h2>
        <span class="chat-model-badge chat-model-badge-${categoryClass}">${escapeHtml(row.category)}</span>
      </div>
      <div class="chat-model-id-row">
        <code class="chat-model-full-id">${escapeHtml(row.id)}</code>
        <button class="chat-model-id-copy" type="button" data-chat-copy-model-id>Copy</button>
      </div>
      ${unavailableNote}
      <div class="chat-model-detail-grid">
        <div class="chat-model-detail-item">
          <span class="chat-model-detail-label">Best for</span>
          <p>${escapeHtml(row.bestFor)}</p>
        </div>
        <div class="chat-model-detail-item">
          <span class="chat-model-detail-label">Recommended use</span>
          <p>${escapeHtml(row.recommendedUse)}</p>
        </div>
        <div class="chat-model-detail-item">
          <span class="chat-model-detail-label">Strengths</span>
          <ul>${renderChatModelBullets(row.strengths)}</ul>
        </div>
        <div class="chat-model-detail-item">
          <span class="chat-model-detail-label">Weaknesses</span>
          <ul>${renderChatModelBullets(row.weaknesses)}</ul>
        </div>
        <div class="chat-model-detail-item chat-model-detail-wide">
          <span class="chat-model-detail-label">Avoid when</span>
          <p>${escapeHtml(row.avoidWhen)}</p>
        </div>
      </div>
      <div class="chat-model-detail-footer">
        <button class="link-button" type="button" data-chat-copy-model-id>${copied ? "Copied" : "Copy model ID"}</button>
        <span class="chat-model-copy-status" id="chat-model-copy-status" aria-live="polite">${escapeHtml(chatState.modelCopyNotice)}</span>
      </div>
    </section>
  `;
}

function renderChatModelPickerContent() {
  const selected = getSelectedChatModelRow();
  const label = chatModelDisplayLabel(selected);
  const filteredRows = getFilteredChatModels();
  clampChatModelActiveIndex(filteredRows);
  const activeDescendant = chatState.modelPickerOpen && filteredRows.length ? `chat-model-option-${chatState.modelPickerActiveIndex}` : "";
  return `
    <div class="chat-model-categories" aria-label="Model categories">
      ${renderChatModelCategoryChips()}
    </div>
    <div class="chat-model-select">
      <button class="chat-model-toggle chat-model-control" id="chat-model-toggle" type="button" aria-haspopup="listbox" aria-expanded="${chatState.modelPickerOpen ? "true" : "false"}" aria-controls="chat-model-menu">
        <span class="chat-model-toggle-label">${escapeHtml(label)}</span>
        <span class="chat-model-toggle-icon">${chatIconSvg("chevron")}</span>
      </button>
      <div class="chat-model-menu" id="chat-model-menu" ${chatState.modelPickerOpen ? "" : "hidden"}>
        <label class="chat-model-search-wrap">
          <span class="sr-only">Search models</span>
          <input class="chat-model-search chat-model-control" id="chat-model-search" type="search" value="${escapeHtml(chatState.searchQuery)}" placeholder="Search model, id, category" autocomplete="off" aria-controls="chat-model-list" aria-activedescendant="${escapeHtml(activeDescendant)}">
        </label>
        <div class="chat-model-list" id="chat-model-list" role="listbox" aria-label="Models">
          ${renderChatModelList()}
        </div>
      </div>
    </div>
    ${renderChatModelDetail()}
  `;
}

function renderChatModelPicker() {
  return `
    <div class="chat-model-picker" id="chat-model-picker">
      ${renderChatModelPickerContent()}
    </div>
  `;
}

function refreshChatModelPicker(options = {}) {
  const picker = document.getElementById("chat-model-picker");
  if (!picker) return;
  picker.innerHTML = renderChatModelPickerContent();
  updateChatControls();
  if (options.focusSearch && chatState.modelPickerOpen) {
    const search = document.getElementById("chat-model-search");
    if (search instanceof HTMLInputElement) {
      search.focus();
      search.setSelectionRange(search.value.length, search.value.length);
    }
  }
  if (options.scrollActive) {
    window.requestAnimationFrame(() => {
      document.getElementById(`chat-model-option-${chatState.modelPickerActiveIndex}`)?.scrollIntoView({ block: "nearest" });
    });
  }
}

function setChatModelPickerOpen(open, options = {}) {
  chatState.modelPickerOpen = Boolean(open && !chatState.sending);
  if (chatState.modelPickerOpen && !chatState.searchQuery) {
    const rows = getFilteredChatModels();
    const selectedIndex = rows.findIndex((row) => row.id === chatState.model);
    chatState.modelPickerActiveIndex = selectedIndex >= 0 ? selectedIndex : 0;
  }
  refreshChatModelPicker({ focusSearch: options.focusSearch, scrollActive: chatState.modelPickerOpen });
}

function closeChatModelPicker() {
  if (!chatState.modelPickerOpen) return;
  setChatModelPickerOpen(false);
}

function firstAvailableChatModelId() {
  const defaultRow = getChatModelById(chatState.defaultModel);
  if (isChatModelSelectable(defaultRow)) return defaultRow.id;
  const firstAvailable = getChatModelCatalog().find(isChatModelSelectable);
  return firstAvailable ? firstAvailable.id : "";
}

function markChatModelUnavailable(modelId) {
  if (!modelId) return;
  const row = chatState.modelCatalog.find((item) => item.id === modelId);
  if (!row) return;
  row.unavailable = true;
  if (chatState.model === modelId) {
    const nextModel = firstAvailableChatModelId();
    if (nextModel && nextModel !== modelId) chatState.model = nextModel;
  }
  chatState.modelPickerOpen = false;
  chatState.modelPickerActiveIndex = 0;
  chatState.modelCopyNotice = "";
  refreshChatModelPicker();
}

function selectChatModel(modelId) {
  const row = getChatModelById(modelId);
  if (chatState.sending || !chatState.models.includes(modelId) || !isChatModelSelectable(row)) return;
  chatState.model = modelId;
  chatState.searchQuery = "";
  chatState.modelPickerOpen = false;
  chatState.modelCopyNotice = "";
  saveChatPersistence();
  refreshChatModelPicker();
  updateChatControls();
}

function setChatModelCategory(category) {
  if (chatState.sending || !CHAT_MODEL_CATEGORIES.includes(category)) return;
  chatState.selectedCategory = category;
  chatState.modelPickerActiveIndex = 0;
  refreshChatModelPicker();
}

function moveChatModelActive(delta) {
  const rows = getFilteredChatModels();
  const selectableIndexes = rows
    .map((row, index) => isChatModelSelectable(row) ? index : -1)
    .filter((index) => index >= 0);
  if (!selectableIndexes.length) return;
  const currentPosition = selectableIndexes.indexOf(chatState.modelPickerActiveIndex);
  if (currentPosition < 0) {
    chatState.modelPickerActiveIndex = delta > 0 ? selectableIndexes[0] : selectableIndexes[selectableIndexes.length - 1];
  } else {
    const nextPosition = (currentPosition + delta + selectableIndexes.length) % selectableIndexes.length;
    chatState.modelPickerActiveIndex = selectableIndexes[nextPosition];
  }
  refreshChatModelPicker({ focusSearch: true, scrollActive: true });
}

function selectActiveChatModel() {
  const row = getFilteredChatModels()[chatState.modelPickerActiveIndex];
  if (isChatModelSelectable(row)) selectChatModel(row.id);
}

function setChatModelCopyNotice(message) {
  chatState.modelCopyNotice = message;
  refreshChatModelPicker();
  window.setTimeout(() => {
    if (chatState.modelCopyNotice === message) {
      chatState.modelCopyNotice = "";
      refreshChatModelPicker();
    }
  }, CHAT_COPY_NOTICE_MS);
}

async function copySelectedChatModelId() {
  const modelId = getCurrentChatModel();
  if (!modelId) return;
  try {
    const copied = await copyTextToClipboard(modelId);
    if (copied) {
      setChatModelCopyNotice("Copied");
    } else {
      showCopyFallback(modelId);
      setChatModelCopyNotice("Clipboard unavailable; text selected.");
    }
  } catch (_error) {
    showCopyFallback(modelId);
    setChatModelCopyNotice("Clipboard unavailable; text selected.");
  }
}

function getCurrentChatModel() {
  return chatState.model || chatState.defaultModel || chatState.models[0] || "";
}

function normalizeStoredChatMessage(message) {
  const role = message?.role === "user" ? "user" : message?.role === "assistant" ? "assistant" : "";
  if (!role) return null;
  const normalized = {
    role,
    content: String(message.content || ""),
  };
  if (role === "assistant") {
    if (message.reasoning) normalized.reasoning = String(message.reasoning);
    if (message.model) normalized.model = String(message.model);
    if (message.usage && typeof message.usage === "object") normalized.usage = message.usage;
    if (message.error) normalized.error = String(message.error);
    if (message.done === true || message.usage || (message.model && !message.error)) normalized.done = true;
  }
  return normalized;
}

function loadChatPersistence() {
  let raw = "";
  try {
    raw = window.localStorage ? window.localStorage.getItem(CHAT_STORAGE_KEY) : "";
  } catch (_error) {
    raw = "";
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      chatState.model = parsed.selectedModelId
        ? String(parsed.selectedModelId)
        : parsed.model
          ? String(parsed.model)
          : chatState.model;
      chatState.messages = Array.isArray(parsed.messages)
        ? parsed.messages.map(normalizeStoredChatMessage).filter(Boolean)
        : [];
    }
  } catch (_error) {
    try {
      window.localStorage?.removeItem(CHAT_STORAGE_KEY);
    } catch (_storageError) {
      /* ignore storage cleanup failures */
    }
    chatState.messages = [];
  }
}

function saveChatPersistence() {
  try {
    if (!window.localStorage) return;
    const messages = chatState.messages.map(normalizeStoredChatMessage).filter(Boolean);
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
      model: chatState.model,
      selectedModelId: chatState.model,
      messages,
    }));
  } catch (_error) {
    /* localStorage can be unavailable in private or locked-down contexts */
  }
}

function clearChatPersistence() {
  try {
    window.localStorage?.removeItem(CHAT_STORAGE_KEY);
  } catch (_error) {
    /* ignore storage cleanup failures */
  }
}

function chatHasMessages() {
  return chatState.messages.length > 0;
}

function chatUsageTokens(usage) {
  return {
    input: Number(usage?.input_tokens || 0),
    output: Number(usage?.output_tokens || 0),
  };
}

function renderChatUsage(usage) {
  if (!usage) return "";
  const tokens = chatUsageTokens(usage);
  return `
    <p class="muted chat-usage">
      in ${formatNumber(tokens.input)} / out ${formatNumber(tokens.output)} tok
    </p>
  `;
}

function renderChatError(message) {
  if (!message) return "";
  const keyHelp = String(message).startsWith("NVIDIA_API_KEY")
    ? "<br><span>Set NVIDIA_API_KEY in .env and restart Hub.</span>"
    : "";
  return `<div class="chat-error error-text">${escapeHtml(message)}${keyHelp}</div>`;
}

function chatIconSvg(name) {
  const attrs = 'class="chat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  if (name === "copy") {
    return `<svg ${attrs}><path d="M8 8h10v10H8z"></path><path d="M6 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"></path></svg>`;
  }
  if (name === "refresh") {
    return `<svg ${attrs}><path d="M20 12a8 8 0 1 1-2.34-5.66"></path><path d="M20 4v6h-6"></path></svg>`;
  }
  if (name === "chevron") {
    return `<svg ${attrs}><path d="M6 9l6 6 6-6"></path></svg>`;
  }
  return `<svg ${attrs}><path d="M12 3l1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5L12 3z"></path><path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z"></path></svg>`;
}

function renderChatPromptChips() {
  return CHAT_EMPTY_PROMPTS.map((prompt) => `
    <button class="chat-prompt-chip" type="button" data-chat-prompt="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>
  `).join("");
}

function renderChatRoleMeta(role, message) {
  const isUser = role === "user";
  const label = isUser ? "You" : "Assistant";
  const avatar = isUser ? '<span class="chat-role-initial">U</span>' : chatIconSvg("spark");
  return `
    <div class="chat-bubble-meta">
      <span class="chat-role-avatar chat-role-avatar-${role}" aria-hidden="true">${avatar}</span>
      <span class="chat-role-label">${label}</span>
      ${message.streaming ? '<span class="chat-state-pill">streaming</span>' : ""}
    </div>
  `;
}

function renderChatReasoning(message) {
  const reasoning = String(message.reasoning || "");
  if (!reasoning) return "";
  const lineCount = reasoning.trim() ? reasoning.trim().split(/\r?\n/).length : 0;
  const lineLabel = `${formatNumber(lineCount)} line${lineCount === 1 ? "" : "s"}`;
  return `
    <details class="chat-reasoning">
      <summary>
        <span class="chat-reasoning-title">
          ${chatIconSvg("spark")}
          <span class="chat-reasoning-show">Show thinking</span>
          <span class="chat-reasoning-hide">Hide thinking</span>
        </span>
        <span class="chat-reasoning-size">${lineLabel}</span>
        <span class="chat-reasoning-chevron">${chatIconSvg("chevron")}</span>
      </summary>
      <div class="chat-reasoning-text">${renderMultilineText(reasoning)}</div>
    </details>
  `;
}

function isLastAssistantMessage(index) {
  for (let i = chatState.messages.length - 1; i >= 0; i -= 1) {
    if (chatState.messages[i]?.role === "assistant") return i === index;
  }
  return false;
}

function renderChatMessageActions(message, index) {
  if (message.role !== "assistant") return "";
  const didCopy = chatState.copiedMessageIndex === index;
  const canRegenerate = isLastAssistantMessage(index);
  return `
    <div class="chat-message-actions" aria-label="Assistant message actions">
      <button class="chat-action chat-action-icon${didCopy ? " is-copied" : ""}" type="button" title="Copy" aria-label="${didCopy ? "Copied" : "Copy"}" data-chat-copy-index="${index}" ${message.content ? "" : "disabled"}>${chatIconSvg("copy")}</button>
      ${didCopy ? '<span class="chat-action-feedback" aria-live="polite">Copied</span>' : ""}
      ${canRegenerate ? `<button class="chat-action chat-action-icon" type="button" title="Regenerate" aria-label="Regenerate" data-chat-regenerate-index="${index}" ${chatState.sending ? "disabled" : ""}>${chatIconSvg("refresh")}</button>` : ""}
    </div>
  `;
}

function renderChatMessageContent(message, role) {
  if (!message.content) {
    return message.streaming ? '<span class="muted">...</span>' : "";
  }
  if (role === "assistant" && message.done === true && !message.streaming) {
    return renderMarkdown(message.content);
  }
  return renderMultilineText(message.content);
}

function renderChatStreamingIndicator(message) {
  if (!message.streaming) return "";
  if (message.content) return '<span class="chat-stream-caret" aria-hidden="true"></span><span class="sr-only">streaming</span>';
  return '<span class="chat-stream-dot" aria-label="streaming"></span>';
}

function renderChatMessagesHtml() {
  if (!chatState.messages.length) {
    return `
      <div class="chat-empty">
        <div class="chat-empty-copy">
          <strong>Ready.</strong>
          <span>Choose a model and send a message.</span>
        </div>
        <div class="chat-empty-prompts" aria-label="Example prompts">
          ${renderChatPromptChips()}
        </div>
      </div>
    `;
  }
  return chatState.messages.map((message, index) => {
    const role = message.role === "user" ? "user" : "assistant";
    const content = renderChatMessageContent(message, role);
    const actions = renderChatMessageActions(message, index);
    return `
      <div class="chat-row chat-row-${role}">
        <div class="chat-bubble chat-bubble-${role}">
          ${renderChatRoleMeta(role, message)}
          ${role === "assistant" ? renderChatReasoning(message) : ""}
          <div class="chat-text">${content}${renderChatStreamingIndicator(message)}</div>
          ${renderChatError(message.error)}
          ${role === "assistant" ? renderChatUsage(message.usage) : ""}
          ${actions}
        </div>
      </div>
    `;
  }).join("");
}

function isChatNearBottom(target) {
  return target.scrollHeight - target.scrollTop - target.clientHeight <= CHAT_SCROLL_THRESHOLD;
}

function setChatJumpVisible(visible) {
  const jump = document.getElementById("chat-jump-latest");
  if (jump) jump.hidden = !visible;
}

function scrollChatToBottom() {
  const target = document.getElementById("chat-messages");
  if (!target) return;
  target.scrollTop = target.scrollHeight;
  chatState.userNearBottom = true;
  setChatJumpVisible(false);
}

function updateChatJumpButton() {
  const target = document.getElementById("chat-messages");
  if (!target) return;
  chatState.userNearBottom = isChatNearBottom(target);
  setChatJumpVisible(chatHasMessages() && !chatState.userNearBottom);
}

function updateChatMessages(options = {}) {
  const target = document.getElementById("chat-messages");
  if (!target) return;
  const forceScroll = Boolean(options.forceScroll);
  const previousScrollTop = target.scrollTop;
  const shouldScroll = forceScroll || isChatNearBottom(target);
  target.innerHTML = renderChatMessagesHtml();
  if (shouldScroll) {
    scrollChatToBottom();
  } else {
    target.scrollTop = previousScrollTop;
    chatState.userNearBottom = false;
    setChatJumpVisible(chatHasMessages());
  }
}

function updateChatComposerMeta() {
  const input = document.getElementById("chat-input");
  const counter = document.getElementById("chat-char-count");
  if (counter) counter.textContent = formatNumber(String(input?.value || "").length);
  if (input) {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }
}

function setChatNotice(message) {
  const notice = document.getElementById("chat-copy-status");
  if (!notice) return;
  notice.textContent = message || "";
}

function showChatNotice(message) {
  setChatNotice(message);
  window.setTimeout(() => {
    const notice = document.getElementById("chat-copy-status");
    if (notice && notice.textContent === message) notice.textContent = "";
  }, CHAT_COPY_NOTICE_MS);
}

function setChatExportOpen(open) {
  const exportToggle = document.getElementById("chat-export-toggle");
  const exportOptions = document.getElementById("chat-export-options");
  const exportMenu = document.querySelector(".chat-export-menu");
  const toolbar = document.querySelector(".chat-toolbar");
  const isOpen = Boolean(open && exportToggle && !exportToggle.disabled && exportOptions);
  if (exportOptions) exportOptions.hidden = !isOpen;
  if (exportToggle) exportToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  exportMenu?.classList.toggle("is-open", isOpen);
  toolbar?.classList.toggle("is-export-open", isOpen);
}

function closeChatExportMenu() {
  setChatExportOpen(false);
}

function updateChatControls() {
  const input = document.getElementById("chat-input");
  const send = document.getElementById("chat-send");
  const modelMenu = document.getElementById("chat-model-menu");
  const modelToggle = document.getElementById("chat-model-toggle");
  const newChat = document.getElementById("chat-new");
  const exportToggle = document.getElementById("chat-export-toggle");
  const exportMarkdown = document.getElementById("chat-export-md");
  const exportJson = document.getElementById("chat-export-json");
  const copyTranscript = document.getElementById("chat-copy-transcript");
  const hasMessages = chatHasMessages();
  if (chatState.sending && chatState.modelPickerOpen) {
    chatState.modelPickerOpen = false;
    if (modelMenu) modelMenu.hidden = true;
    if (modelToggle) modelToggle.setAttribute("aria-expanded", "false");
  }
  if (input) input.disabled = chatState.sending;
  if (send) {
    send.textContent = chatState.sending ? "Stop" : "Send";
    send.disabled = !chatState.sending && !chatState.model;
  }
  document.querySelectorAll(".chat-model-control").forEach((control) => {
    if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
      control.disabled = chatState.sending || control.getAttribute("data-chat-model-unavailable") === "true";
    }
  });
  if (newChat) newChat.disabled = chatState.sending;
  if (exportToggle) exportToggle.disabled = chatState.sending || !hasMessages;
  if (exportMarkdown) exportMarkdown.disabled = chatState.sending || !hasMessages;
  if (exportJson) exportJson.disabled = chatState.sending || !hasMessages;
  if (copyTranscript) copyTranscript.disabled = chatState.sending || !hasMessages;
  if (!hasMessages || chatState.sending) {
    closeChatExportMenu();
  }
  updateChatComposerMeta();
}

function handleChatSseBlock(block, assistantIndex, requestModel) {
  if (!block.trim()) return;
  const parsed = parseSseBlock(block);
  const payload = parsed.data ? JSON.parse(parsed.data) : {};
  const message = chatState.messages[assistantIndex];
  if (!message) return;

  if (parsed.eventName === "delta") {
    message.content = String(message.content || "") + String(payload.text || "");
  } else if (parsed.eventName === "reasoning") {
    message.reasoning = String(message.reasoning || "") + String(payload.text || "");
  } else if (parsed.eventName === "done") {
    message.streaming = false;
    message.done = true;
    message.usage = payload.usage || null;
    message.model = payload.model || chatState.model;
  } else if (parsed.eventName === "error") {
    message.streaming = false;
    message.done = false;
    message.error = String(payload.message || "Chat stream error");
    if (Number(payload.code) === 410) {
      markChatModelUnavailable(requestModel || chatState.model);
    }
  }
  saveChatPersistence();
  updateChatMessages();
}

async function streamChatResponse(requestMessages, assistantIndex) {
  chatAbortController = new AbortController();
  const requestModel = chatState.model;
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: requestMessages, model: requestModel }),
      signal: chatAbortController.signal,
    });
    if (!response.ok) {
      const raw = await response.text();
      let message = `${response.status} ${response.statusText}`;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.detail) message = String(parsed.detail);
      } catch (_error) {
        if (raw) message = raw;
      }
      throw new Error(message);
    }
    if (!response.body) throw new Error("Empty chat stream");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || "";
      parts.forEach((part) => handleChatSseBlock(part, assistantIndex, requestModel));
    }
    buffer += decoder.decode();
    handleChatSseBlock(buffer, assistantIndex, requestModel);
  } catch (error) {
    if (error.name !== "AbortError") {
      const message = chatState.messages[assistantIndex];
      if (message) {
        message.error = error.message || String(error);
        message.streaming = false;
        message.done = false;
      }
    }
  } finally {
    const message = chatState.messages[assistantIndex];
    if (message) message.streaming = false;
    chatState.sending = false;
    chatAbortController = null;
    saveChatPersistence();
    updateChatMessages();
    updateChatControls();
  }
}

function chatRequestMessages() {
  return chatState.messages
    .filter((message) => (message.role === "user" || message.role === "assistant") && message.content)
    .map((message) => ({ role: message.role, content: message.content }));
}

async function sendChatMessage(text) {
  const priorMessages = chatRequestMessages();
  const userMessage = { role: "user", content: text };
  const requestMessages = [...priorMessages, userMessage];
  chatState.messages.push(userMessage);
  const assistantIndex = chatState.messages.push({ role: "assistant", content: "", reasoning: "", streaming: true, done: false }) - 1;
  chatState.sending = true;
  saveChatPersistence();
  updateChatMessages({ forceScroll: true });
  updateChatControls();
  await streamChatResponse(requestMessages, assistantIndex);
}

async function regenerateChatResponse(assistantIndex) {
  if (chatState.sending || !isLastAssistantMessage(assistantIndex)) return;
  let userIndex = -1;
  for (let i = assistantIndex - 1; i >= 0; i -= 1) {
    if (chatState.messages[i]?.role === "user") {
      userIndex = i;
      break;
    }
  }
  if (userIndex < 0) return;
  chatState.messages = chatState.messages.slice(0, assistantIndex);
  const requestMessages = chatRequestMessages();
  const newAssistantIndex = chatState.messages.push({ role: "assistant", content: "", reasoning: "", streaming: true, done: false }) - 1;
  chatState.sending = true;
  saveChatPersistence();
  updateChatMessages({ forceScroll: true });
  updateChatControls();
  await streamChatResponse(requestMessages, newAssistantIndex);
}

function formatChatFileTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("") + "-" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function appendMarkdownReasoning(lines, reasoning) {
  const text = String(reasoning || "");
  if (!text) return;
  const parts = text.split(/\r?\n/);
  lines.push(`> Reasoning (collapsed): ${parts[0]}`);
  parts.slice(1).forEach((line) => {
    lines.push(`> ${line}`);
  });
  lines.push("");
}

function buildChatMarkdown(exportedAt = new Date().toISOString()) {
  const model = getCurrentChatModel();
  const lines = [`# Harness Hub Chat - ${model} - ${exportedAt}`, ""];
  chatState.messages.forEach((message) => {
    if (message.role === "user") {
      lines.push(`**You:** ${String(message.content || "")}`, "");
      return;
    }
    if (message.role === "assistant") {
      const tokens = chatUsageTokens(message.usage);
      lines.push(`**Assistant** (${message.model || model}, in ${tokens.input} / out ${tokens.output} tok):`, "");
      appendMarkdownReasoning(lines, message.reasoning);
      lines.push(String(message.content || ""), "");
    }
  });
  return lines.join("\n").trimEnd() + "\n";
}

function buildChatJson(exportedAt = new Date().toISOString()) {
  const turns = chatState.messages.map((message) => {
    const turn = {
      role: message.role === "user" ? "user" : "assistant",
      content: String(message.content || ""),
    };
    if (message.reasoning) turn.reasoning = String(message.reasoning);
    if (message.model) turn.model = String(message.model);
    if (message.usage) turn.usage = message.usage;
    return turn;
  });
  return JSON.stringify({ exported_at: exportedAt, model: getCurrentChatModel(), turns }, null, 2) + "\n";
}

function downloadChatFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportChat(format) {
  if (!chatHasMessages()) return;
  const now = new Date();
  const exportedAt = now.toISOString();
  const stamp = formatChatFileTimestamp(now);
  if (format === "json") {
    downloadChatFile(buildChatJson(exportedAt), `chat-${stamp}.json`, "application/json");
  } else {
    downloadChatFile(buildChatMarkdown(exportedAt), `chat-${stamp}.md`, "text/markdown");
  }
}

function showCopyFallback(text) {
  const fallback = document.getElementById("chat-copy-fallback");
  if (!fallback) return;
  fallback.hidden = false;
  fallback.value = text;
  fallback.focus();
  fallback.select();
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const fallback = document.getElementById("chat-copy-fallback");
  if (!fallback) return false;
  fallback.hidden = false;
  fallback.value = text;
  fallback.focus();
  fallback.select();
  try {
    const copied = document.execCommand("copy");
    if (copied) fallback.hidden = true;
    return copied;
  } catch (_error) {
    return false;
  }
}

async function copyChatText(text, copiedMessageIndex = null) {
  try {
    const copied = await copyTextToClipboard(text);
    if (copied) {
      showChatNotice("Copied");
    } else {
      showCopyFallback(text);
      showChatNotice("Clipboard unavailable; text selected.");
    }
  } catch (_error) {
    showCopyFallback(text);
    showChatNotice("Clipboard unavailable; text selected.");
  }
  if (copiedMessageIndex !== null) {
    chatState.copiedMessageIndex = copiedMessageIndex;
    updateChatMessages();
    window.setTimeout(() => {
      if (chatState.copiedMessageIndex === copiedMessageIndex) {
        chatState.copiedMessageIndex = null;
        updateChatMessages();
      }
    }, CHAT_COPY_NOTICE_MS);
  }
}

function wireChat() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const modelPicker = document.getElementById("chat-model-picker");
  const messages = document.getElementById("chat-messages");
  const newChat = document.getElementById("chat-new");
  const exportToggle = document.getElementById("chat-export-toggle");
  const exportOptions = document.getElementById("chat-export-options");
  const copyTranscript = document.getElementById("chat-copy-transcript");
  const jump = document.getElementById("chat-jump-latest");

  modelPicker?.addEventListener("click", async (event) => {
    event.stopPropagation();
    closeChatExportMenu();
    const target = event.target;
    if (!(target instanceof Element)) return;
    const categoryButton = target.closest("[data-chat-model-category]");
    if (categoryButton instanceof HTMLButtonElement) {
      setChatModelCategory(categoryButton.getAttribute("data-chat-model-category") || "All");
      return;
    }
    const toggle = target.closest("#chat-model-toggle");
    if (toggle instanceof HTMLButtonElement) {
      setChatModelPickerOpen(!chatState.modelPickerOpen, { focusSearch: true });
      return;
    }
    const option = target.closest("[data-chat-model-id]");
    if (option instanceof HTMLButtonElement) {
      selectChatModel(option.getAttribute("data-chat-model-id") || "");
      return;
    }
    const copyModel = target.closest("[data-chat-copy-model-id]");
    if (copyModel instanceof HTMLButtonElement) {
      await copySelectedChatModelId();
    }
  });
  modelPicker?.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "chat-model-search") return;
    chatState.searchQuery = target.value;
    chatState.modelPickerActiveIndex = 0;
    refreshChatModelPicker({ focusSearch: true });
  });
  modelPicker?.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (event.key === "Escape") {
      closeChatModelPicker();
      document.getElementById("chat-model-toggle")?.focus();
      return;
    }
    if (!chatState.modelPickerOpen && target.closest("#chat-model-toggle") && event.key === "ArrowDown") {
      event.preventDefault();
      setChatModelPickerOpen(true, { focusSearch: true });
      return;
    }
    if (!chatState.modelPickerOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveChatModelActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveChatModelActive(-1);
    } else if (event.key === "Enter" && target.closest("#chat-model-search")) {
      event.preventDefault();
      selectActiveChatModel();
    }
  });
  newChat?.addEventListener("click", () => {
    if (chatState.sending) return;
    clearChatStream();
    chatState.messages = [];
    chatState.sending = false;
    chatState.userNearBottom = true;
    clearChatPersistence();
    setChatNotice("");
    updateChatMessages({ forceScroll: true });
    updateChatControls();
  });
  exportToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    if (exportToggle.disabled || !exportOptions) return;
    setChatExportOpen(exportOptions.hidden);
  });
  document.getElementById("chat-export-md")?.addEventListener("click", () => {
    exportChat("md");
    closeChatExportMenu();
  });
  document.getElementById("chat-export-json")?.addEventListener("click", () => {
    exportChat("json");
    closeChatExportMenu();
  });
  copyTranscript?.addEventListener("click", async () => {
    if (copyTranscript.disabled || !chatHasMessages()) return;
    await copyChatText(buildChatMarkdown());
  });
  jump?.addEventListener("click", scrollChatToBottom);
  messages?.addEventListener("scroll", updateChatJumpButton);
  messages?.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const promptButton = target.closest("[data-chat-prompt]");
    if (promptButton instanceof HTMLButtonElement) {
      const prompt = promptButton.getAttribute("data-chat-prompt") || "";
      if (input && !input.disabled) {
        input.value = prompt;
        updateChatComposerMeta();
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
      return;
    }
    const copyButton = target.closest("[data-chat-copy-index]");
    if (copyButton) {
      const index = Number(copyButton.getAttribute("data-chat-copy-index"));
      const message = chatState.messages[index];
      if (message?.role === "assistant") {
        await copyChatText(String(message.content || ""), index);
      }
      return;
    }
    const regenerateButton = target.closest("[data-chat-regenerate-index]");
    if (regenerateButton) {
      const index = Number(regenerateButton.getAttribute("data-chat-regenerate-index"));
      await regenerateChatResponse(index);
    }
  });
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form?.requestSubmit();
    }
  });
  input?.addEventListener("input", updateChatComposerMeta);
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (chatState.sending) {
      clearChatStream();
      updateChatControls();
      return;
    }
    const text = String(input?.value || "").trim();
    if (!text) return;
    if (input) input.value = "";
    updateChatComposerMeta();
    await sendChatMessage(text);
  });
}

async function renderChat() {
  setActiveNav("/chat");
  setLoading("Chat");
  loadChatPersistence();
  const data = await getJson("/api/chat/models");
  chatState.models = Array.isArray(data.models) ? data.models : [];
  chatState.modelCatalog = normalizeChatModelCatalog(data.catalog, chatState.models);
  chatState.defaultModel = String(data.default || "");
  if (!CHAT_MODEL_CATEGORIES.includes(chatState.selectedCategory)) chatState.selectedCategory = "All";
  chatState.modelPickerOpen = false;
  chatState.searchQuery = "";
  chatState.modelPickerActiveIndex = 0;
  chatState.modelCopyNotice = "";
  if (!chatState.model || !chatState.models.includes(chatState.model)) {
    chatState.model = chatState.defaultModel || chatState.models[0] || "";
  }
  app.innerHTML = `
    <div class="chat-page">
      <div class="page-hero chat-page-hero">
        <h1>Chat</h1>
        <p class="lead">NVIDIA OpenAI-compatible chat stream for Harness Hub.</p>
      </div>
      <section class="card chat-panel">
        <div class="chat-toolbar">
          <div class="chat-model-field">
            <span class="sr-only">Model</span>
            ${renderChatModelPicker()}
          </div>
          <div class="chat-toolbar-actions">
            <button class="link-button" type="button" id="chat-new">+ New chat</button>
            <div class="chat-export-menu">
              <button class="link-button" type="button" id="chat-export-toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="chat-export-options">Export v</button>
              <div class="chat-export-options" id="chat-export-options" role="menu" hidden>
                <button type="button" id="chat-export-md" role="menuitem">Markdown (.md)</button>
                <button type="button" id="chat-export-json" role="menuitem">JSON (.json)</button>
              </div>
            </div>
            <button class="link-button" type="button" id="chat-copy-transcript">Copy transcript</button>
            <span class="chat-copy-status" id="chat-copy-status" aria-live="polite"></span>
          </div>
        </div>
        <div class="chat-messages-wrap">
          <div id="chat-messages" class="chat-messages" aria-live="polite"></div>
          <button id="chat-jump-latest" class="chat-jump-latest" type="button" hidden>Jump to latest</button>
        </div>
        <form id="chat-form" class="chat-form">
          <div class="chat-input-wrap">
            <textarea id="chat-input" rows="3" placeholder="Message the selected model"></textarea>
            <div class="chat-composer-meta">
              <span>Enter to send - Shift+Enter for newline</span>
              <span><span id="chat-char-count">0</span> chars</span>
            </div>
          </div>
          <button id="chat-send" class="link-button" type="submit">Send</button>
        </form>
        <textarea id="chat-copy-fallback" class="chat-copy-fallback" aria-label="Copy fallback text" readonly hidden></textarea>
      </section>
    </div>
  `;
  updateChatMessages({ forceScroll: true });
  updateChatControls();
  wireChat();
}

function renderToolFilters() {
  const sinceDate = toolFilters.since ? toolFilters.since.slice(0, 10) : "";
  return `
    <form id="tool-filter" class="usage-filter">
      <label>
        Source
        <select name="source">
          <option value="" ${toolFilters.source ? "" : "selected"}>All</option>
          <option value="claude" ${toolFilters.source === "claude" ? "selected" : ""}>Claude</option>
          <option value="codex" ${toolFilters.source === "codex" ? "selected" : ""}>Codex</option>
        </select>
      </label>
      <label>
        Model
        <input name="model" value="${escapeHtml(toolFilters.model)}" placeholder="exact model">
      </label>
      <label>
        Since
        <input name="since" type="date" value="${escapeHtml(sinceDate)}">
      </label>
      <button class="link-button" type="submit">Apply</button>
      <button class="link-button" type="button" id="tool-reset">Reset</button>
    </form>
  `;
}

function renderToolsTable(rows) {
  if (!rows.length) {
    return '<p class="muted">No tool calls found.</p>';
  }
  const body = rows.map((item) => `
    <tr>
      <td><code>${escapeHtml(item.tool)}</code></td>
      <td>${tierBadge(item.tier)}</td>
      <td class="nowrap">${formatNumber(item.count)}</td>
      <td class="nowrap">${formatNumber(item.sessions)}</td>
      <td>${(item.models || []).map(escapeHtml).join(", ")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Tool</th><th>Tier</th><th>Calls</th><th>Sessions</th><th>Models</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function wireToolFilters() {
  const form = document.getElementById("tool-filter");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      toolFilters.source = String(data.get("source") || "");
      toolFilters.model = String(data.get("model") || "").trim();
      const since = String(data.get("since") || "");
      toolFilters.since = since ? `${since}T00:00:00+00:00` : "";
      renderTools();
    });
  }
  const reset = document.getElementById("tool-reset");
  if (reset) {
    reset.addEventListener("click", () => {
      toolFilters.source = "";
      toolFilters.model = "";
      toolFilters.since = "";
      renderTools();
    });
  }
}

async function renderTools() {
  setActiveNav("/tools");
  setLoading("Tools");
  const query = usageQuery(toolFilters);
  const [rollup, loops] = await Promise.all([
    getJson(`/api/tools${query}`),
    getJson("/api/sessions/loops").catch(() => []),
  ]);
  const loopRiskCount = (loops || []).filter((item) => item.loop_risk).length;
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <h2>Tools</h2>
    ${renderToolFilters()}
    <div class="card-grid usage-metrics">
      <div class="card">
        <span class="badge navy">Tool Calls</span>
        <div class="metric">${formatNumber(rollup.totals.tool_calls)}</div>
        <p class="muted">${formatNumber(rollup.totals.distinct_tools)} distinct tools</p>
      </div>
      <div class="card">
        <span class="badge ${loopRiskCount ? "red" : "green"}">Loop Risk</span>
        <div class="metric">${formatNumber(loopRiskCount)}</div>
        <p class="muted">sessions at threshold</p>
      </div>
    </div>
    <div class="usage-charts">
      <section>
        <h3>Top Tools</h3>
        <div id="tools-chart"></div>
      </section>
      <section>
        <h3>Calls by Day</h3>
        <div class="chart-scroll"><div id="tools-day-chart"></div></div>
      </section>
    </div>
    <h3>Tool Table</h3>
    ${renderToolsTable(rollup.by_tool || [])}
  `;
  wireToolFilters();
  window.HubCharts.barChart(document.getElementById("tools-chart"), (rollup.by_tool || []).slice(0, 20), "tool", "count");
  window.HubCharts.barChart(document.getElementById("tools-day-chart"), rollup.by_day || [], "day", "count");
}

function renderBoardTable(board) {
  const systems = board.sub_systems || [];
  if (!systems.length) return '<p class="muted">No sub-systems found.</p>';
  const rows = systems.map((item) => `
    <tr>
      <td>${escapeHtml(item.name || "")}</td>
      <td>${escapeHtml(item.status || "")}</td>
      <td>${escapeHtml(item.note || "")}</td>
    </tr>
  `).join("");
  return `<div class="table-scroll"><table><thead><tr><th>Sub-system</th><th>Status</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function renderBoard() {
  setActiveNav("/board");
  setLoading("Board");
  const board = await getJson("/api/board");
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <div class="card">
      <span class="badge navy">${escapeHtml(board.owner || "no owner")}</span>
      <h2>Task Board</h2>
      <p class="muted">Updated ${escapeHtml(board.updated || "n/a")}</p>
      <p class="muted">${boardLatestLine(board)}</p>
      <pre class="board-text">${escapeHtml(board.objective || "No objective")}</pre>
    </div>
    <h2>Sub-systems</h2>
    ${renderBoardTable(board)}
    <h2>Next Step</h2>
    <pre class="board-text">${escapeHtml(board.next_step || "No next step")}</pre>
    <p class="muted">${(board.source_files || []).map(escapeHtml).join(" / ")}</p>
  `;
}

function hasModelUsage(value) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

function renderModelUsage(value) {
  if (!hasModelUsage(value)) {
    return '<span class="badge gray empty-chip">no model usage</span>';
  }
  return `<pre class="json-inline">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function renderInspectLogs(logs) {
  if (!logs.length) return '<p class="muted">No readable Inspect logs found.</p>';
  const rows = logs.map((log) => `
    <tr>
      <td>${escapeHtml(log.name)}</td>
      <td>${escapeHtml(log.task || "")}</td>
      <td class="nowrap">${escapeHtml(log.ts || "")}</td>
      <td>${renderModelUsage(log.model_usage)}</td>
    </tr>
  `).join("");
  return `<div class="table-scroll"><table><thead><tr><th>Log</th><th>Task</th><th>Time</th><th>Model Usage</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderMep(mep) {
  if (!mep) return '<p class="muted">No MEP packet available.</p>';
  const failures = mep.failed_samples || [];
  return `
    <div class="card">
      <span class="badge ${failures.length ? "red" : "green"}">${escapeHtml(mep.status || "mep")}</span>
      <h2>${escapeHtml(mep.task || "Latest MEP")}</h2>
      <p class="muted">${escapeHtml(mep.source_log || "")}</p>
      <p>Failed samples: ${escapeHtml(mep.failed_sample_count || 0)}</p>
    </div>
    <pre><code>${escapeHtml(JSON.stringify(mep, null, 2))}</code></pre>
  `;
}

async function renderInspect() {
  setActiveNav("/inspect");
  setLoading("Inspect");
  const [logs, mep] = await Promise.all([
    getJson("/api/inspect/logs"),
    getJson("/api/inspect/mep").catch(() => null),
  ]);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <h2>Inspect Evals</h2>
    ${renderInspectLogs(logs)}
    <h2>Latest MEP</h2>
    ${renderMep(mep)}
  `;
}

function sessionLink(session) {
  return `<a href="#/sessions/${encodeURIComponent(session.session)}">${escapeHtml(session.session)}</a>`;
}

function loopMetaBySession(loops) {
  const map = new Map();
  (loops || []).forEach((item) => {
    if (item && item.session) map.set(item.session, item);
  });
  return map;
}

function entropyMetaBySession(entropy) {
  const map = new Map();
  (entropy || []).forEach((item) => {
    if (item && item.session) map.set(item.session, item);
  });
  return map;
}

function renderSessionsTable(sessions, loops = [], entropy = []) {
  if (!sessions.length) return '<p class="muted">No sessions found.</p>';
  const loopMap = loopMetaBySession(loops);
  const entropyMap = entropyMetaBySession(entropy);
  const rows = sessions.map((session) => `
    <tr>
      <td>${sessionLink(session)} ${loopMap.get(session.session)?.loop_risk ? '<span class="badge red loop-risk-badge">Loop risk</span>' : ""} ${entropyMap.get(session.session)?.flagged ? '<span class="badge red loop-risk-badge">High entropy</span>' : ""}</td>
      <td>${escapeHtml(session.source)}</td>
      <td class="nowrap">${escapeHtml(session.ts || "")}</td>
      <td class="nowrap">${loopMap.get(session.session) ? `${formatLatency(loopMap.get(session.session).avg_latency_s)} / ${formatLatency(loopMap.get(session.session).max_latency_s)}` : "n/a"}</td>
      <td>${escapeHtml(session.project || "")}</td>
    </tr>
  `).join("");
  return `<div class="table-scroll"><table><thead><tr><th>Session</th><th>Source</th><th>Time</th><th>Latency avg/max</th><th>Project</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

async function renderSessions() {
  setActiveNav("/sessions");
  setLoading("Sessions");
  const [sessions, loops, entropy] = await Promise.all([
    getJson("/api/sessions"),
    getJson("/api/sessions/loops").catch(() => []),
    getJson("/api/sessions/entropy").catch(() => []),
  ]);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <h2>Sessions</h2>
    ${renderSessionsTable(sessions, loops, entropy)}
  `;
}

function renderEntropyTable(rows) {
  const flagged = (rows || []).filter((item) => item.flagged);
  if (!flagged.length) return '<p class="muted">No high-entropy sessions found.</p>';
  const body = flagged.map((item) => `
    <tr>
      <td><a href="#/sessions/${encodeURIComponent(item.session)}">${escapeHtml(item.session)}</a></td>
      <td>${escapeHtml(item.source)}</td>
      <td class="nowrap">${formatNumber(item.actions)}</td>
      <td class="nowrap">${escapeHtml(Math.round(Number(item.max_violation_rate || 0) * 100))}%</td>
      <td>${escapeHtml(item.top_reason || "")}</td>
    </tr>
  `).join("");
  return `<div class="table-scroll"><table><thead><tr><th>Session</th><th>Source</th><th>Actions</th><th>Max rate</th><th>Top reason</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

async function renderViolations() {
  setActiveNav("/violations");
  setLoading("Violations");
  const entropy = await getJson("/api/sessions/entropy");
  const flagged = entropy.filter((item) => item.flagged).length;
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <h2>Violations / Entropy</h2>
    <div class="card">
      <span class="badge ${flagged ? "red" : "green"}">Flagged Sessions</span>
      <div class="metric">${formatNumber(flagged)}</div>
      <p class="muted">Windowed violation rate over tool calls and tool errors.</p>
    </div>
    ${renderEntropyTable(entropy)}
  `;
}

function renderGovernanceDenials(rows) {
  const data = Array.isArray(rows) ? rows : [];
  if (!data.length) return '<p class="muted">No recent denials.</p>';
  const body = data.map((item) => `
    <tr>
      <td class="nowrap">${escapeHtml(item.ts || "")}</td>
      <td>${item.job_id ? `<a href="#/jobs/${encodeURIComponent(item.job_id)}">${escapeHtml(item.job_id)}</a>` : ""}</td>
      <td>${renderTextList(item.reasons || [], "No reasons.")}</td>
    </tr>
  `).join("");
  return `<div class="table-scroll"><table><thead><tr><th>Time</th><th>Job</th><th>Reasons</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderGovernanceFindings(rows) {
  const data = Array.isArray(rows) ? rows : [];
  if (!data.length) return '<p class="muted">No recent L1 findings.</p>';
  const body = data.map((item) => `
    <tr>
      <td class="nowrap">${escapeHtml(item.ts || "")}</td>
      <td>${item.job_id ? `<a href="#/jobs/${encodeURIComponent(item.job_id)}">${escapeHtml(item.job_id)}</a>` : ""}</td>
      <td><span class="badge ${item.type === "injection_pattern" ? "red" : "gray"}">${escapeHtml(item.type || "")}</span></td>
      <td><code>${escapeHtml(item.pattern || "")}</code></td>
      <td class="nowrap">${escapeHtml(item.offset ?? "")}</td>
    </tr>
  `).join("");
  return `<div class="table-scroll"><table><thead><tr><th>Time</th><th>Job</th><th>Type</th><th>Pattern</th><th>Offset</th></tr></thead><tbody>${body}</tbody></table></div>`;
}

async function renderGovernance() {
  setActiveNav("/governance");
  setLoading("Governance");
  const governance = await getJson("/api/governance");
  const level = Number(governance.degradation || 0);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <div class="page-hero">
      <h1>Governance</h1>
      <p class="lead">Rule-based runtime constraints for Harness Hub jobs.</p>
    </div>
    <div class="card-grid usage-metrics">
      <div class="card governance-card ${level > 0 ? "alert" : ""}">
        <span class="badge ${level > 0 ? "red" : "green"}">Degradation</span>
        <div class="metric">${formatNumber(level)}</div>
        <p class="muted">Current level</p>
      </div>
      <div class="card">
        <span class="badge navy">Blocked Tiers</span>
        <p class="governance-tier-line">${tierBadges(governance.blocked_tiers || [])}</p>
      </div>
    </div>
    <h2>Recent Denials</h2>
    ${renderGovernanceDenials(governance.recent_denials || [])}
    <h2>Recent L1 Findings</h2>
    ${renderGovernanceFindings(governance.recent_findings || [])}
  `;
}

function renderReplayColumn(title, rows, renderRow, attrsForRow = () => "") {
  const pane = title.toLowerCase();
  const body = rows.length
    ? rows.map((row) => `<div class="replay-item" data-pane="${escapeHtml(pane)}" data-trust="${escapeHtml(row.trust || "trusted")}" data-ts="${escapeHtml(row.ts || "")}" ${attrsForRow(row)}>${renderRow(row)}</div>`).join("")
    : '<p class="muted">Empty.</p>';
  return `<section class="replay-pane" data-pane-section="${escapeHtml(pane)}"><h3>${escapeHtml(title)}</h3>${body}<p class="muted replay-filter-empty" hidden>No matching rows.</p></section>`;
}

function renderToolCalls(calls) {
  if (!calls || !calls.length) return "";
  return calls.map((call) => `
    <details>
      <summary>${escapeHtml(call.name)} ${tierBadge(call.tier)}${call.command_tier ? ` <span class="command-tier">cmd ${tierBadge(call.command_tier)}</span>` : ""}</summary>
      <pre><code>${escapeHtml(JSON.stringify(call.input, null, 2))}</code></pre>
    </details>
  `).join("");
}

function renderReplayTimestamp(row) {
  const latency = row.latency_s === null || row.latency_s === undefined ? "" : ` <span class="latency-chip">+${escapeHtml(formatLatency(row.latency_s))}</span>`;
  return `${escapeHtml(row.ts || "")}${latency}`;
}

function wireReplaySync() {
  document.querySelectorAll(".replay-item").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const ts = item.dataset.ts;
      document.querySelectorAll(".replay-item").forEach((other) => {
        other.classList.toggle("active", !!ts && other.dataset.ts === ts);
      });
    });
  });
}

function updateReplayEmptyState(pane) {
  const section = document.querySelector(`[data-pane-section="${pane}"]`);
  if (!section) return;
  const rows = Array.from(section.querySelectorAll(".replay-item"));
  const empty = section.querySelector(".replay-filter-empty");
  if (empty) empty.hidden = !rows.length || rows.some((row) => !row.hidden);
}

function wireReplayFilters() {
  const agentTools = document.getElementById("filter-agent-tools");
  const monitorErrors = document.getElementById("filter-monitor-errors");
  const untrustedOnly = document.getElementById("filter-untrusted-only");
  const apply = () => {
    const onlyAgentTools = Boolean(agentTools?.checked);
    const onlyMonitorErrors = Boolean(monitorErrors?.checked);
    const onlyUntrusted = Boolean(untrustedOnly?.checked);
    document.querySelectorAll(".replay-item").forEach((item) => {
      let hidden = onlyUntrusted && item.dataset.trust !== "untrusted";
      if (item.dataset.pane === "agent") {
        hidden = hidden || (onlyAgentTools && item.dataset.hasTools !== "1");
      }
      if (item.dataset.pane === "monitor") {
        hidden = hidden || (onlyMonitorErrors && item.dataset.kind !== "error");
      }
      item.hidden = hidden;
    });
    updateReplayEmptyState("outline");
    updateReplayEmptyState("agent");
    updateReplayEmptyState("monitor");
  };
  agentTools?.addEventListener("change", apply);
  monitorErrors?.addEventListener("change", apply);
  untrustedOnly?.addEventListener("change", apply);
  apply();
}

async function renderSessionReplay(sessionId) {
  setActiveNav("/sessions");
  setLoading(sessionId);
  const replay = await getJson(`/api/sessions/${encodeURIComponent(sessionId)}/replay`);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/sessions">Back to sessions</a></div>
    <div class="card">
      <span class="badge navy">${escapeHtml(replay.source)}</span>
      <h2>${escapeHtml(replay.session)}</h2>
    </div>
    <div class="replay-filters">
      <label><input id="filter-agent-tools" type="checkbox"> Agent with tool calls</label>
      <label><input id="filter-monitor-errors" type="checkbox"> Monitor errors only</label>
      <label><input id="filter-untrusted-only" type="checkbox"> Untrusted only</label>
    </div>
    <div class="replay-grid">
      ${renderReplayColumn("Outline", replay.outline || [], (row) => `${provenanceBadge(row)} <span class="badge gray">${escapeHtml(row.kind)}</span><p>${escapeHtml(row.text)}</p><p class="muted">${escapeHtml(row.ts || "")}</p>`)}
      ${renderReplayColumn(
        "Agent",
        replay.agent || [],
        (row) => `${provenanceBadge(row)}<p>${escapeHtml(row.text || "")}</p>${renderToolCalls(row.tool_calls)}<p class="muted">${renderReplayTimestamp(row)}</p>`,
        (row) => `data-has-tools="${row.tool_calls && row.tool_calls.length ? "1" : "0"}"`,
      )}
      ${renderReplayColumn(
        "Monitor",
        replay.monitor || [],
        (row) => `${provenanceBadge(row)} <span class="badge ${row.kind === "error" ? "red" : "gray"}">${escapeHtml(row.kind)}</span> ${tierBadge(row.tier)}<p>${escapeHtml(row.tool || "")}</p><pre>${escapeHtml(row.summary || "")}</pre><p class="muted">${escapeHtml(row.ts || "")}</p>`,
        (row) => `data-kind="${escapeHtml(row.kind || "")}"`,
      )}
    </div>
  `;
  wireReplaySync();
  wireReplayFilters();
}

function wireArtifactButtons(runId) {
  document.querySelectorAll("[data-artifact]").forEach((button) => {
    button.addEventListener("click", async () => {
      const rel = button.dataset.artifact;
      const target = document.getElementById("artifact-view");
      target.innerHTML = `<div class="card">Loading ${escapeHtml(rel)}...</div>`;
      try {
        const text = await getText(`/api/runs/${encodeURIComponent(runId)}/artifact?rel=${encodeURIComponent(rel)}`);
        target.innerHTML = `<h3>${escapeHtml(rel)}</h3><pre><code>${escapeHtml(text)}</code></pre>`;
      } catch (error) {
        target.innerHTML = `<div class="card error-card">${escapeHtml(error.message || error)}</div>`;
      }
    });
  });
}

async function route() {
  clearAutoRefresh();
  clearJobStream();
  clearChatStream();
  window.HubWorkspace?.unmount?.();
  const hash = location.hash || "#/";
  const parts = hash.slice(1).split("/").filter(Boolean).map(decodeURIComponent);
  const isWorkspaceRoute = parts[0] === "workspace";
  document.body.classList.toggle("route-workspace", isWorkspaceRoute);
  try {
    if (parts.length === 0) {
      await renderDashboard();
    } else if (parts[0] === "runs" && parts[1]) {
      await renderRun(parts[1]);
    } else if (parts[0] === "runs") {
      await renderRuns();
    } else if (parts[0] === "jobs" && parts[1]) {
      await renderJob(parts[1]);
    } else if (parts[0] === "jobs") {
      await renderJobs();
    } else if (parts[0] === "suites" && parts[1]) {
      await renderSuite(parts[1]);
    } else if (parts[0] === "suites") {
      await renderSuites();
    } else if (parts[0] === "chat") {
      await renderChat();
    } else if (parts[0] === "workspace") {
      setActiveNav("/workspace");
      app.innerHTML = "";
      if (!window.HubWorkspace?.mount) {
        throw new Error("Workspace module failed to load.");
      }
      window.HubWorkspace.mount(app);
    } else if (parts[0] === "usage") {
      await renderUsage();
    } else if (parts[0] === "tools") {
      await renderTools();
    } else if (parts[0] === "violations") {
      await renderViolations();
    } else if (parts[0] === "governance") {
      await renderGovernance();
    } else if (parts[0] === "inspect") {
      await renderInspect();
    } else if (parts[0] === "board") {
      await renderBoard();
    } else if (parts[0] === "sessions" && parts[1]) {
      await renderSessionReplay(parts[1]);
    } else if (parts[0] === "sessions") {
      await renderSessions();
    } else {
      app.innerHTML = '<div class="card"><h2>Not found</h2></div>';
    }
  } catch (error) {
    setError(error);
  }
}
