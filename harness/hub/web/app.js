const app = document.getElementById("app");
const usageFilters = { source: "", model: "", since: "" };
const toolFilters = { source: "", model: "", since: "" };
let autoRefreshTimer = null;
let jobEventSource = null;

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);

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
    const message = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${message}`);
  }
  return response.json();
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

function setAutoRefresh(callback) {
  clearAutoRefresh();
  autoRefreshTimer = window.setInterval(callback, 10000);
}

let lastRunsSignature = null;

function runsSignature(runs) {
  if (!Array.isArray(runs) || !runs.length) return "0:";
  return `${runs.length}:${runs[0].run_id || ""}`;
}

// Poll /api/runs only; when a new run appears, hand the fresh runs to a patch
// callback that updates just the run-related nodes in place — no full DOM
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
  document.querySelectorAll(".hub-nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === path);
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

function renderJobsTable(jobs) {
  if (!jobs.length) {
    return '<p class="muted">No jobs found.</p>';
  }
  const rows = jobs.map((job) => `
    <tr>
      <td>${jobLink(job)}</td>
      <td>${statusBadge(job.status)}</td>
      <td>${escapeHtml(job.agent || "")}</td>
      <td>${escapeHtml(formatDiffstat(job.diffstat))}</td>
      <td class="nowrap">${escapeHtml(job.created_at || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Job</th><th>Status</th><th>Agent</th><th>Diffstat</th><th>Created</th></tr></thead>
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
        const result = document.getElementById("job-action-result");
        if (result) result.innerHTML = `<span class="error-text">${escapeHtml(error.message || error)}</span>`;
        button.disabled = false;
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
      <td class="nowrap">${escapeHtml(run.duration_seconds)}s</td>
      <td class="nowrap">${escapeHtml(run.finished_at || run.started_at || "")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Run</th><th>Suite</th><th>Status</th><th>Checks</th><th>Duration</th><th>Finished</th></tr></thead>
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
        <td>${escapeHtml(check.message || check.hint || "")}</td>
        <td class="nowrap">${check.duration_seconds === undefined ? "" : `${escapeHtml(check.duration_seconds)}s`}</td>
        <td>${logs}</td>
      </tr>
    `;
  }).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Check</th><th>Type</th><th>Status</th><th>Message</th><th>Duration</th><th>Logs</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function flushList(buffer, output) {
  if (!buffer.length) {
    return;
  }
  output.push(`<ul>${buffer.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
  buffer.length = 0;
}

function flushTable(buffer, output) {
  if (!buffer.length) {
    return;
  }
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
        <thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>
        <tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `);
  buffer.length = 0;
}

function renderMarkdown(markdown) {
  const output = [];
  const tableBuffer = [];
  const listBuffer = [];
  const lines = String(markdown || "").split(/\r?\n/);
  let inCode = false;
  let code = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushTable(tableBuffer, output);
      flushList(listBuffer, output);
      if (inCode) {
        output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (line.trim().startsWith("|")) {
      flushList(listBuffer, output);
      tableBuffer.push(line);
      continue;
    }
    flushTable(tableBuffer, output);
    if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      continue;
    }
    flushList(listBuffer, output);
    if (line.startsWith("# ")) {
      output.push(`<h2>${inlineMarkdown(line.slice(2))}</h2>`);
    } else if (line.startsWith("## ")) {
      output.push(`<h3>${inlineMarkdown(line.slice(3))}</h3>`);
    } else if (line.trim()) {
      output.push(`<p>${inlineMarkdown(line)}</p>`);
    }
  }

  flushTable(tableBuffer, output);
  flushList(listBuffer, output);
  if (inCode) {
    output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  }
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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [runs, suites, usageRollup, board] = await Promise.all([
    getJson("/api/runs"),
    getJson("/api/suites"),
    getJson(`/api/usage/rollup${usageQuery({ since: sevenDaysAgo })}`).catch(() => null),
    getJson("/api/board").catch(() => null),
  ]);
  const latest = runs[0];
  const usageTotals = usageRollup ? usageRollup.totals : { total_tokens: 0, calls: 0 };
  const topModel = usageRollup && usageRollup.by_model.length ? usageRollup.by_model[0].model : "n/a";
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
      <div class="card">
        <span class="badge navy">Usage 7d</span>
        <div class="metric">${formatNumber(usageTotals.total_tokens)} <span class="metric-label">incl. cache</span></div>
        <p class="muted">${renderCacheLine(usageTotals)}</p>
        <p class="muted">${formatNumber(usageTotals.calls)} calls &middot; ${escapeHtml(topModel)}</p>
      </div>
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
      <p class="muted">${escapeHtml(summary.suite_name || summary.suite)} · ${escapeHtml(summary.passed)}/${escapeHtml(summary.total)} checks · ${escapeHtml(summary.duration_seconds)}s</p>
    </div>
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
      <h2>${escapeHtml(job.id)}</h2>
      <p class="muted">${escapeHtml(job.agent || "")} &middot; ${escapeHtml(formatDiffstat(job.diffstat))}</p>
      <p>${escapeHtml(job.brief || "")}</p>
      <p class="muted"><code>${escapeHtml(job.branch || "")}</code></p>
      <p class="muted">Base <code>${escapeHtml(job.base_sha || "")}</code></p>
      <p class="muted">Created ${escapeHtml(job.created_at || "")}${job.started_at ? ` &middot; started ${escapeHtml(job.started_at)}` : ""}${job.finished_at ? ` &middot; finished ${escapeHtml(job.finished_at)}` : ""}</p>
      ${renderJobActions(job)}
      <div id="job-action-result" class="muted"></div>
    </div>
    ${job.status === "running" ? renderJobStreamPanel(job) : ""}
    ${showDiff ? `<h2>Diff</h2>${renderJobDiff(job.diff || "")}` : ""}
  `;
  wireJobActions(job.id);
  if (job.status === "running") {
    streamJob(job.id);
  }
}

async function renderSuites() {
  setActiveNav("/suites");
  setLoading("Suites");
  const suites = await getJson("/api/suites");
  app.innerHTML = `<h2>Suites</h2>${renderSuitesTable(suites)}`;
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
      <p class="muted">${escapeHtml(suite.check_count)} checks · ${escapeHtml(suite.path)}</p>
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
      <td class="nowrap">${formatNumber(item.count)}</td>
      <td class="nowrap">${formatNumber(item.sessions)}</td>
      <td>${(item.models || []).map(escapeHtml).join(", ")}</td>
    </tr>
  `).join("");
  return `
    <div class="table-scroll">
      <table>
        <thead><tr><th>Tool</th><th>Calls</th><th>Sessions</th><th>Models</th></tr></thead>
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

function renderSessionsTable(sessions, loops = []) {
  if (!sessions.length) return '<p class="muted">No sessions found.</p>';
  const loopMap = loopMetaBySession(loops);
  const rows = sessions.map((session) => `
    <tr>
      <td>${sessionLink(session)} ${loopMap.get(session.session)?.loop_risk ? '<span class="badge red loop-risk-badge">Loop risk</span>' : ""}</td>
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
  const [sessions, loops] = await Promise.all([
    getJson("/api/sessions"),
    getJson("/api/sessions/loops").catch(() => []),
  ]);
  app.innerHTML = `
    <div class="hub-actions"><a class="link-button" href="#/">Back to dashboard</a></div>
    <h2>Sessions</h2>
    ${renderSessionsTable(sessions, loops)}
  `;
}

function renderReplayColumn(title, rows, renderRow, attrsForRow = () => "") {
  const pane = title.toLowerCase();
  const body = rows.length
    ? rows.map((row) => `<div class="replay-item" data-ts="${escapeHtml(row.ts || "")}" ${attrsForRow(row)}>${renderRow(row)}</div>`).join("")
    : '<p class="muted">Empty.</p>';
  return `<section class="replay-pane" data-pane-section="${escapeHtml(pane)}"><h3>${escapeHtml(title)}</h3>${body}<p class="muted replay-filter-empty" hidden>No matching rows.</p></section>`;
}

function renderToolCalls(calls) {
  if (!calls || !calls.length) return "";
  return calls.map((call) => `
    <details>
      <summary>${escapeHtml(call.name)}</summary>
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
  const apply = () => {
    const onlyAgentTools = Boolean(agentTools?.checked);
    const onlyMonitorErrors = Boolean(monitorErrors?.checked);
    document.querySelectorAll('[data-pane="agent"]').forEach((item) => {
      item.hidden = onlyAgentTools && item.dataset.hasTools !== "1";
    });
    document.querySelectorAll('[data-pane="monitor"]').forEach((item) => {
      item.hidden = onlyMonitorErrors && item.dataset.kind !== "error";
    });
    updateReplayEmptyState("agent");
    updateReplayEmptyState("monitor");
  };
  agentTools?.addEventListener("change", apply);
  monitorErrors?.addEventListener("change", apply);
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
    </div>
    <div class="replay-grid">
      ${renderReplayColumn("Outline", replay.outline || [], (row) => `<span class="badge gray">${escapeHtml(row.kind)}</span><p>${escapeHtml(row.text)}</p><p class="muted">${escapeHtml(row.ts || "")}</p>`)}
      ${renderReplayColumn(
        "Agent",
        replay.agent || [],
        (row) => `<p>${escapeHtml(row.text || "")}</p>${renderToolCalls(row.tool_calls)}<p class="muted">${renderReplayTimestamp(row)}</p>`,
        (row) => `data-pane="agent" data-has-tools="${row.tool_calls && row.tool_calls.length ? "1" : "0"}"`,
      )}
      ${renderReplayColumn(
        "Monitor",
        replay.monitor || [],
        (row) => `<span class="badge ${row.kind === "error" ? "red" : "gray"}">${escapeHtml(row.kind)}</span><p>${escapeHtml(row.tool || "")}</p><pre>${escapeHtml(row.summary || "")}</pre><p class="muted">${escapeHtml(row.ts || "")}</p>`,
        (row) => `data-pane="monitor" data-kind="${escapeHtml(row.kind || "")}"`,
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
  const hash = location.hash || "#/";
  const parts = hash.slice(1).split("/").filter(Boolean).map(decodeURIComponent);
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
    } else if (parts[0] === "usage") {
      await renderUsage();
    } else if (parts[0] === "tools") {
      await renderTools();
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
