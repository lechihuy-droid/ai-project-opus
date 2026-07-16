(() => {
  const SUGGESTIONS = [
    "Summarize a file",
    "Draft a document",
    "Review this text",
    "Create a table",
    "Write code",
    "Brainstorm ideas",
    "Compare two versions",
  ];
  const COMMANDS = [
    "Summarize a file",
    "Draft a document",
    "Review this text",
    "Create a table",
    "Write code",
    "Compare versions",
  ];
  const SECTION_ACTIONS = ["Rewrite", "Shorten", "Expand", "Add examples", "Change tone"];
  const EXPORT_FORMATS = ["Markdown", "HTML", "PDF", "DOCX", "JSON"];
  const TOAST_MS = 2400;

  function html(value) {
    if (window.escapeHtml) return window.escapeHtml(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseSseBlock(block) {
    if (window.parseSseBlock) return window.parseSseBlock(block);
    const dataLines = [];
    let eventName = "message";
    String(block || "").split(/\r?\n/).forEach((line) => {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    });
    return { eventName, data: dataLines.join("\n") };
  }

  function genId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function ARTIFACT_TEMPLATE() {
    return [
      {
        heading: "Overview",
        body: "This plan outlines the go-to-market approach for the Q3 workspace release, covering target audience, key messaging, and the cross-functional timeline needed to launch on schedule.",
      },
      {
        heading: "Goals",
        body: "Reach 10,000 signups within the first 30 days, achieve a 25% activation rate, and establish three reference customers willing to speak publicly about the product.",
      },
      {
        heading: "Timeline",
        body: "Weeks 1-2: finalize messaging and assets. Weeks 3-4: run private beta with design partners. Week 5: public launch across web, email, and partner channels. Week 6: retrospective and iteration.",
      },
      {
        heading: "Go-to-Market Channels",
        body: "Primary channels are product-led growth via in-app prompts, an email sequence to the existing waitlist, and a coordinated launch post across owned social accounts. Paid acquisition is out of scope for this phase.",
      },
      {
        heading: "Risks & Mitigations",
        body: "Key risk is a delayed integration with the billing system; mitigation is a feature flag that allows launch without billing enforcement for the first two weeks.",
      },
    ];
  }

  function normalizeModelCatalog(data) {
    const models = Array.isArray(data?.models) ? data.models.map((item) => String(item)) : [];
    const allowed = new Set(models);
    const rows = Array.isArray(data?.catalog) ? data.catalog : [];
    const catalog = rows.map((row, index) => {
      const id = String(row?.id || "");
      if (!id || (allowed.size && !allowed.has(id))) return null;
      return {
        rank: Number(row?.rank || index + 1),
        id,
        shortName: String(row?.shortName || row?.label || id),
        label: String(row?.label || row?.shortName || id),
        category: String(row?.category || "Fallback"),
        bestFor: String(row?.bestFor || ""),
        strengths: Array.isArray(row?.strengths) ? row.strengths.map((item) => String(item)) : [],
        weaknesses: Array.isArray(row?.weaknesses) ? row.weaknesses.map((item) => String(item)) : [],
        recommendedUse: String(row?.recommendedUse || ""),
        avoidWhen: String(row?.avoidWhen || ""),
        unavailable: Boolean(row?.unavailable),
      };
    }).filter(Boolean);

    if (catalog.length) return catalog;
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

  function plural(count, singular, pluralLabel) {
    return `${count} ${count === 1 ? singular : pluralLabel}`;
  }

  class Workspace {
    constructor() {
      this.host = null;
      this.root = null;
      this.mounted = false;
      this.timers = new Set();
      this.toastTimer = null;
      this.streamController = null;
      this.broadcastControllers = new Map();
      this.runtimeStreamController = null;
      this.modelController = null;
      this.providerController = null;
      this.handleClick = this.handleClick.bind(this);
      this.handleInput = this.handleInput.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.state = this.initialState();
    }

    initialState() {
      return {
        leftTab: "chats",
        chats: [{ id: "c1", title: "New Chat", messages: [], provider: "nvidia", sessionId: null }],
        activeChatId: "c1",
        nextChatNum: 2,
        files: [],
        artifacts: [],
        activeArtifactId: null,
        contextFileIds: [],
        contextArtifactIds: [],
        instructions: [{ id: "i1", label: "Use professional tone", active: true }],
        selectedModel: "",
        defaultModel: "",
        modelCatalog: [],
        modelIds: [],
        modelLoading: true,
        modelError: "",
        providers: [{ id: "nvidia", available: true, version: null, detail: "", capabilities: {} }],
        providerLoading: true,
        providerError: "",
        showModelPopover: false,
        showContextDrawer: false,
        showVersionHistory: false,
        showExportModal: false,
        forceContextWarning: false,
        promptText: "",
        exportFormat: "markdown",
        exportOptions: { title: true, metadata: true, versionHistory: false },
        toast: null,
        compareVersion: null,
        aiThinking: false,
        sending: false,
        taskStatus: null,
        runtimeRuns: [],
        activeRuntimeRunId: null,
        activeRuntimeRun: null,
        runtimeEvents: [],
        runtimeLoading: false,
        runtimeDetailLoading: false,
        runtimeError: "",
        runtimeStartText: "",
        runtimeStreaming: false,
      };
    }

    mount(host) {
      this.unmount();
      this.host = host;
      this.state = this.initialState();
      this.mounted = true;
      this.host.innerHTML = '<div class="ws-root" data-ws-root></div>';
      this.root = this.host.querySelector("[data-ws-root]");
      this.root.addEventListener("click", this.handleClick);
      this.root.addEventListener("input", this.handleInput);
      this.root.addEventListener("change", this.handleChange);
      this.root.addEventListener("keydown", this.handleKeyDown);
      this.root.addEventListener("submit", this.handleSubmit);
      this.render({ scrollMessagesBottom: true });
      this.loadModels();
      this.loadProviders();
      this.loadRuntimeRuns();
    }

    unmount() {
      this.abortStream();
      this.abortBroadcastStreams();
      this.abortRuntimeStream();
      if (this.modelController) {
        this.modelController.abort();
        this.modelController = null;
      }
      if (this.providerController) {
        this.providerController.abort();
        this.providerController = null;
      }
      this.timers.forEach((timer) => window.clearTimeout(timer));
      this.timers.clear();
      if (this.toastTimer) {
        window.clearTimeout(this.toastTimer);
        this.toastTimer = null;
      }
      if (this.root) {
        this.root.removeEventListener("click", this.handleClick);
        this.root.removeEventListener("input", this.handleInput);
        this.root.removeEventListener("change", this.handleChange);
        this.root.removeEventListener("keydown", this.handleKeyDown);
        this.root.removeEventListener("submit", this.handleSubmit);
      }
      this.root = null;
      this.host = null;
      this.mounted = false;
    }

    setTimer(callback, delay) {
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        if (this.mounted) callback();
      }, delay);
      this.timers.add(timer);
      return timer;
    }

    setState(updater, options = {}) {
      if (!this.mounted) return;
      const patch = typeof updater === "function" ? updater(this.state) : updater;
      if (patch && typeof patch === "object") {
        this.state = { ...this.state, ...patch };
      }
      this.render(options);
    }

    captureRenderState() {
      if (!this.root) return {};
      const active = document.activeElement;
      const prompt = this.root.querySelector("[data-ws-prompt]");
      const scrolls = {};
      this.root.querySelectorAll("[data-ws-scroll]").forEach((el) => {
        scrolls[el.getAttribute("data-ws-scroll")] = el.scrollTop;
      });
      return {
        promptFocused: active === prompt,
        selectionStart: prompt && prompt.selectionStart,
        selectionEnd: prompt && prompt.selectionEnd,
        scrolls,
      };
    }

    restoreRenderState(snapshot, options) {
      if (!this.root) return;
      this.root.querySelectorAll("[data-ws-scroll]").forEach((el) => {
        const key = el.getAttribute("data-ws-scroll");
        if (options.scrollMessagesBottom && key === "messages") {
          el.scrollTop = el.scrollHeight;
        } else if (snapshot.scrolls && Object.prototype.hasOwnProperty.call(snapshot.scrolls, key)) {
          el.scrollTop = snapshot.scrolls[key];
        }
      });

      const prompt = this.root.querySelector("[data-ws-prompt]");
      if (prompt instanceof HTMLTextAreaElement) {
        this.autogrow(prompt);
        if (snapshot.promptFocused) {
          prompt.focus();
          const start = Number(snapshot.selectionStart || 0);
          const end = Number(snapshot.selectionEnd || start);
          prompt.setSelectionRange(Math.min(start, prompt.value.length), Math.min(end, prompt.value.length));
        }
      }
    }

    render(options = {}) {
      if (!this.root) return;
      const snapshot = this.captureRenderState();
      this.root.innerHTML = this.renderShell();
      this.restoreRenderState(snapshot, options);
    }

    async loadModels() {
      this.modelController = new AbortController();
      try {
        const response = await fetch("/api/chat/models", { signal: this.modelController.signal });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = await response.json();
        const catalog = normalizeModelCatalog(data);
        const modelIds = Array.isArray(data.models) ? data.models.map((item) => String(item)) : catalog.map((item) => item.id);
        const defaultModel = String(data.default || "");
        const selectedModel = catalog.find((row) => row.id === defaultModel)?.id || catalog[0]?.id || modelIds[0] || "";
        this.setState({
          modelCatalog: catalog,
          modelIds,
          defaultModel,
          selectedModel,
          modelLoading: false,
          modelError: "",
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        this.setState({
          modelLoading: false,
          modelError: error.message || String(error),
          modelCatalog: [],
          modelIds: [],
          selectedModel: "",
        });
      } finally {
        this.modelController = null;
      }
    }

    async loadProviders() {
      this.providerController = new AbortController();
      try {
        const response = await fetch("/api/providers", { signal: this.providerController.signal });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = await response.json();
        const providers = Array.isArray(data) ? data.map((row) => ({
          id: String(row?.id || ""),
          available: Boolean(row?.available),
          version: row?.version ? String(row.version) : null,
          detail: String(row?.detail || ""),
          capabilities: row?.capabilities && typeof row.capabilities === "object" ? row.capabilities : {},
        })).filter((row) => row.id) : [];
        this.setState({ providers, providerLoading: false, providerError: "" });
      } catch (error) {
        if (error.name === "AbortError") return;
        this.setState({ providerLoading: false, providerError: error.message || String(error) });
      } finally {
        this.providerController = null;
      }
    }

    async loadRuntimeRuns() {
      this.setState({ runtimeLoading: true, runtimeError: "" });
      try {
        const response = await fetch("/api/agent/runs");
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const runs = await response.json();
        const rows = Array.isArray(runs) ? runs : [];
        const active = this.state.activeRuntimeRunId || rows[0]?.run_id || null;
        this.setState({ runtimeRuns: rows, activeRuntimeRunId: active, runtimeLoading: false, runtimeError: "" });
        if (active) this.loadRuntimeRunDetail(active);
      } catch (error) {
        this.setState({ runtimeLoading: false, runtimeError: error.message || String(error) });
      }
    }

    async loadRuntimeRunDetail(runId) {
      if (!runId) return;
      this.setState({ runtimeDetailLoading: true, activeRuntimeRunId: runId, runtimeError: "" });
      try {
        const [runResponse, eventsResponse] = await Promise.all([
          fetch(`/api/agent/runs/${encodeURIComponent(runId)}`),
          fetch(`/api/agent/runs/${encodeURIComponent(runId)}/events`),
        ]);
        if (!runResponse.ok) throw new Error(`${runResponse.status} ${runResponse.statusText}`);
        if (!eventsResponse.ok) throw new Error(`${eventsResponse.status} ${eventsResponse.statusText}`);
        const run = await runResponse.json();
        const events = await eventsResponse.json();
        this.setState({
          activeRuntimeRun: run,
          runtimeEvents: Array.isArray(events) ? events : [],
          runtimeDetailLoading: false,
          runtimeError: "",
        }, { scrollMessagesBottom: true });
      } catch (error) {
        this.setState({ runtimeDetailLoading: false, runtimeError: error.message || String(error) });
      }
    }

    abortRuntimeStream() {
      if (this.runtimeStreamController) {
        this.runtimeStreamController.abort();
        this.runtimeStreamController = null;
      }
      if (this.mounted && this.state.runtimeStreaming) {
        this.setState({ runtimeStreaming: false });
      }
    }

    async startRuntimeRun() {
      if (this.state.runtimeStreaming) return;
      const objective = String(this.state.runtimeStartText || "").trim() || "Run deterministic lead runtime pipeline";
      await this.streamRuntimeRequest("/api/agent/runs", { objective });
    }

    async resumeRuntimeInterrupt(runId, interruptId) {
      if (!runId || !interruptId || this.state.runtimeStreaming) return;
      await this.streamRuntimeRequest(
        `/api/agent/runs/${encodeURIComponent(runId)}/interrupts/${encodeURIComponent(interruptId)}/resume`,
        { action: "resume", payload: { approved: true } },
      );
    }

    async streamRuntimeRequest(path, body) {
      this.abortRuntimeStream();
      this.runtimeStreamController = new AbortController();
      this.setState({ runtimeStreaming: true, leftTab: "runs", runtimeError: "" }, { scrollMessagesBottom: true });
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hub-Client": "harness-hub" },
          body: JSON.stringify(body),
          signal: this.runtimeStreamController.signal,
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        if (!response.body) throw new Error("Empty runtime stream");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop() || "";
          parts.forEach((part) => this.handleRuntimeSseBlock(part));
        }
        buffer += decoder.decode();
        this.handleRuntimeSseBlock(buffer);
      } catch (error) {
        if (error.name !== "AbortError") {
          this.setState({ runtimeError: error.message || String(error) });
        }
      } finally {
        this.runtimeStreamController = null;
        this.setState({ runtimeStreaming: false }, { scrollMessagesBottom: true });
        this.loadRuntimeRuns();
      }
    }

    handleRuntimeSseBlock(block) {
      if (!String(block || "").trim()) return;
      let parsed;
      let payload = {};
      try {
        parsed = parseSseBlock(block);
        payload = parsed.data ? JSON.parse(parsed.data) : {};
      } catch (error) {
        this.setState({ runtimeError: error.message || String(error) });
        return;
      }
      const event = { ...payload, type: payload.type || parsed.eventName };
      this.setState((state) => {
        const patch = { runtimeEvents: [...state.runtimeEvents, event].slice(-200) };
        if (payload.run_id && !state.activeRuntimeRunId) patch.activeRuntimeRunId = payload.run_id;
        if (payload.state && typeof payload.state === "object") {
          patch.activeRuntimeRun = payload.state;
          patch.activeRuntimeRunId = payload.state.run_id || payload.run_id || state.activeRuntimeRunId;
        }
        return patch;
      }, { scrollMessagesBottom: true });
    }

    getActiveChat() {
      return this.state.chats.find((chat) => chat.id === this.state.activeChatId) || this.state.chats[0];
    }

    getActiveArtifact() {
      return this.state.artifacts.find((artifact) => artifact.id === this.state.activeArtifactId) || null;
    }

    getSelectedModel() {
      return this.state.modelCatalog.find((row) => row.id === this.state.selectedModel) || null;
    }

    selectedModelName() {
      const selected = this.getSelectedModel();
      if (selected) return selected.shortName;
      if (this.state.modelLoading) return "Loading...";
      return "Select model";
    }

    getActiveProvider() {
      const providerId = this.getActiveChat()?.provider || "nvidia";
      return this.state.providers.find((row) => row.id === providerId) || {
        id: providerId,
        available: providerId === "nvidia",
        version: null,
        detail: "",
        capabilities: {},
      };
    }

    providerLabel(id) {
      return ({ nvidia: "NVIDIA", claude: "Claude", codex: "Codex", gemini: "Gemini" })[id] || id;
    }

    isBroadcastChat(chat) {
      return Array.isArray(chat?.providers) && chat.providers.length >= 2;
    }

    statusMeta(kind, status) {
      const map = {
        file: {
          uploading: { className: "ws-status-file-uploading", label: "Uploading" },
          processing: { className: "ws-status-file-processing", label: "Processing" },
          ready: { className: "ws-status-file-ready", label: "Ready" },
          failed: { className: "ws-status-file-failed", label: "Failed" },
        },
        artifact: {
          draft: { className: "ws-status-artifact-draft", label: "Draft" },
          editing: { className: "ws-status-artifact-editing", label: "Editing" },
          final: { className: "ws-status-artifact-final", label: "Final" },
          exported: { className: "ws-status-artifact-exported", label: "Exported" },
        },
      };
      return map[kind][status] || map[kind].draft;
    }

    showToast(text) {
      if (this.toastTimer) window.clearTimeout(this.toastTimer);
      this.setState({ toast: text });
      this.toastTimer = window.setTimeout(() => {
        this.toastTimer = null;
        this.setState({ toast: null });
      }, TOAST_MS);
    }

    renderShell() {
      const art = this.getActiveArtifact();
      const runtimeMode = this.state.leftTab === "runs";
      return `
        ${this.renderTopbar(art)}
        <div class="ws-body">
          ${this.renderSidebar()}
          ${runtimeMode ? this.renderRuntimePanel() : this.renderChatPanel()}
          ${runtimeMode ? this.renderRuntimeDetailPanel() : this.renderArtifactPanel(art)}
        </div>
        ${this.state.showContextDrawer ? this.renderContextDrawer() : ""}
        ${this.state.showVersionHistory ? this.renderVersionHistory(art) : ""}
        ${this.state.showExportModal ? this.renderExportModal(art) : ""}
        ${this.state.toast ? `<div class="ws-toast">${html(this.state.toast)}</div>` : ""}
      `;
    }

    renderTopbar(art) {
      const chat = this.getActiveChat();
      const provider = this.getActiveProvider();
      const broadcast = this.isBroadcastChat(chat);
      const providerLocked = Boolean(chat?.messages.length);
      const providerOptions = this.state.providers.map((row) => {
        const label = this.providerLabel(row.id);
        const offline = row.available ? "" : " (offline)";
        return `<option value="${html(row.id)}" ${row.id === provider.id ? "selected" : ""} ${row.available ? "" : "disabled"}>${html(label + offline)}</option>`;
      }).join("");
      return `
        <div class="ws-topbar">
          <div class="ws-brand">
            <div class="ws-brand-tile">W</div>
            <div class="ws-brand-name">Harness Hub</div>
            <div class="ws-status-pill"><span class="ws-status-dot"></span>Active</div>
          </div>
          <div class="ws-top-actions">
            ${broadcast ? `<div class="ws-broadcast-providers">
              <span class="ws-provider-badge">Broadcast</span>
              ${this.state.providers.map((row) => `<label class="ws-broadcast-provider"><input type="checkbox" data-ws-broadcast-provider="${html(row.id)}" ${chat.providers.includes(row.id) ? "checked" : ""} ${providerLocked || !row.available ? "disabled" : ""}>${html(this.providerLabel(row.id))}</label>`).join("")}
              ${Object.values(chat.sessionIds || {}).length ? `<span class="ws-provider-badge">${Object.keys(chat.sessionIds).length} sessions</span>` : ""}
            </div>` : `<div class="ws-provider-wrap">
              <select class="ws-provider-select" data-ws-provider aria-label="Provider" ${providerLocked ? 'disabled title="provider locked after first message"' : ""}>
                ${providerOptions || `<option value="nvidia">${this.state.providerLoading ? "Loading providers..." : "NVIDIA"}</option>`}
              </select>
              ${provider.id !== "nvidia" ? `<span class="ws-provider-badge">read-only</span>${provider.version ? `<span class="ws-provider-version">${html(provider.version)}</span>` : ""}` : ""}
              ${chat?.sessionId ? `<span class="ws-provider-badge" title="${html(chat.sessionId)}">session ${html(String(chat.sessionId).slice(0, 8))}</span>` : ""}
            </div>`}
            ${!broadcast && provider.id === "nvidia" ? `
              <div class="ws-model-wrap">
                <button class="ws-model-button" type="button" data-ws-action="toggle-model-popover" aria-haspopup="true" aria-expanded="${this.state.showModelPopover ? "true" : "false"}">
                  <span class="ws-model-dot"></span>
                  <span>${html(this.selectedModelName())}</span>
                  <span class="ws-caret">&#9662;</span>
                </button>
                ${this.state.showModelPopover ? this.renderModelPopover() : ""}
              </div>
            ` : ""}
            <div class="ws-divider"></div>
            <button class="ws-secondary-button" type="button" data-ws-action="open-export" ${art ? "" : "disabled"}>Export</button>
            <button class="ws-icon-button" type="button" data-ws-action="settings" title="Settings" aria-label="Settings">&#9881;</button>
            <div class="ws-user-avatar">U</div>
          </div>
        </div>
      `;
    }

    renderModelPopover() {
      if (this.state.modelLoading) {
        return `<div class="ws-model-popover"><div class="ws-popover-label">Select model</div><div class="ws-empty-small">Loading models...</div></div>`;
      }
      if (this.state.modelError) {
        return `<div class="ws-model-popover"><div class="ws-popover-label">Select model</div><div class="ws-empty-small">Could not load models: ${html(this.state.modelError)}</div></div>`;
      }
      const cards = this.state.modelCatalog.map((model) => {
        const selected = model.id === this.state.selectedModel;
        const recommended = model.id === this.state.defaultModel;
        const weak = model.weaknesses[0] || "";
        return `
          <button class="ws-model-card" type="button" data-ws-action="select-model" data-model-id="${html(model.id)}">
            <div class="ws-model-card-head">
              <div class="ws-model-title">
                <span>${html(model.shortName)}</span>
                ${recommended ? '<span class="ws-recommended">RECOMMENDED</span>' : ""}
              </div>
              ${selected ? '<span class="ws-selected-check">&#10003;</span>' : ""}
            </div>
            <div class="ws-model-provider">${html(model.category)}</div>
            <div class="ws-model-detail"><b>Best:</b> ${html(model.bestFor)}</div>
            <div class="ws-model-detail"><b>Weak:</b> ${html(weak)}</div>
            <div class="ws-model-meta-line">${html(model.recommendedUse || model.label || model.id)}</div>
          </button>
        `;
      }).join("");
      return `
        <div class="ws-model-popover">
          <div class="ws-popover-label">Select model</div>
          ${cards || '<div class="ws-empty-small">No models available.</div>'}
        </div>
      `;
    }

    renderSidebar() {
      return `
        <aside class="ws-sidebar" aria-label="Workspace">
          <div class="ws-sidebar-top">
            <button class="ws-new-chat" type="button" data-ws-action="new-chat"><span>+</span> New Chat</button>
            <button class="ws-broadcast-chat" type="button" data-ws-action="new-broadcast-chat">Broadcast</button>
          </div>
          <div class="ws-left-nav">
            ${this.renderLeftNavRow("chats", "&#128172;", "Chats", this.state.chats.length)}
            ${this.renderLeftNavRow("files", "&#128193;", "Files", this.state.files.length)}
            ${this.renderLeftNavRow("artifacts", "&#9636;", "Artifacts", this.state.artifacts.length)}
            ${this.renderLeftNavRow("runs", "&#9881;", "Runs", this.state.runtimeRuns.length)}
          </div>
          <div class="ws-left-scroll" data-ws-scroll="left">
            ${this.renderLeftTab()}
          </div>
        </aside>
      `;
    }

    renderLeftNavRow(key, icon, label, count) {
      const active = this.state.leftTab === key;
      return `
        <button class="ws-nav-row${active ? " is-active" : ""}" type="button" data-ws-action="set-left-tab" data-tab="${key}">
          <span class="ws-nav-label"><span>${icon}</span>${html(label)}</span>
          <span class="ws-nav-count">${html(count)}</span>
        </button>
      `;
    }

    renderLeftTab() {
      if (this.state.leftTab === "files") return this.renderFilesList();
      if (this.state.leftTab === "artifacts") return this.renderArtifactsList();
      if (this.state.leftTab === "runs") return this.renderRuntimeRunsList();
      return this.renderChatsList();
    }

    renderChatsList() {
      const rows = this.state.chats.map((chat) => {
        const active = chat.id === this.state.activeChatId;
        const subtitle = chat.messages.length === 0 ? "Empty" : `${chat.messages.length} messages`;
        return `
          <button class="ws-chat-row${active ? " is-active" : ""}" type="button" data-ws-action="switch-chat" data-chat-id="${html(chat.id)}">
            <div class="ws-chat-title">${html(chat.title)}${this.isBroadcastChat(chat) ? ' <span class="ws-broadcast-badge">N&#9889;</span>' : ""}</div>
            <div class="ws-chat-subtitle">${html(subtitle)}</div>
          </button>
        `;
      }).join("");
      return `<div class="ws-list-label">Chats</div>${rows}`;
    }

    renderFilesList() {
      const rows = this.state.files.map((file) => {
        const meta = this.statusMeta("file", file.status);
        const inContext = this.state.contextFileIds.includes(file.id);
        return `
          <div class="ws-file-item">
            <div class="ws-file-main">
              <span>&#128196;</span>
              <div class="ws-file-name">${html(file.name)}</div>
            </div>
            <div class="ws-file-meta">
              <span class="ws-status-badge ${meta.className}">${html(meta.label)}</span>
              <span class="ws-file-context">${inContext ? "In context" : "Not in context"}</span>
            </div>
          </div>
        `;
      }).join("");
      return `
        <div class="ws-list-head">
          <div class="ws-list-label">Files</div>
          <button class="ws-upload-link" type="button" data-ws-action="upload-file">+ Upload</button>
        </div>
        ${this.state.files.length ? rows : '<div class="ws-empty-small">No files yet.</div>'}
      `;
    }

    renderArtifactsList() {
      const rows = this.state.artifacts.map((artifact) => {
        const active = artifact.id === this.state.activeArtifactId;
        const meta = this.statusMeta("artifact", artifact.status);
        return `
          <button class="ws-artifact-row${active ? " is-active" : ""}" type="button" data-ws-action="open-artifact" data-artifact-id="${html(artifact.id)}">
            <div class="ws-artifact-title">${html(artifact.title)}</div>
            <div class="ws-artifact-row-meta">
              <span class="ws-status-badge ${meta.className}">${html(meta.label)}</span>
              <span class="ws-artifact-version">v${html(artifact.version)}</span>
            </div>
          </button>
        `;
      }).join("");
      return `
        <div class="ws-list-label">Artifacts</div>
        ${this.state.artifacts.length ? rows : '<div class="ws-empty-small">Artifacts you create will appear here.</div>'}
      `;
    }

    renderRuntimeRunsList() {
      if (this.state.runtimeLoading) return '<div class="ws-list-label">Runs</div><div class="ws-empty-small">Loading runtime runs...</div>';
      if (this.state.runtimeError) return `<div class="ws-list-label">Runs</div><div class="ws-empty-small">${html(this.state.runtimeError)}</div>`;
      const rows = this.state.runtimeRuns.map((run) => {
        const active = run.run_id === this.state.activeRuntimeRunId;
        const meta = run.metadata || {};
        const subtitle = `${run.status || "unknown"} · ${meta.agent_id || "agent"}`;
        return `
          <button class="ws-artifact-row${active ? " is-active" : ""}" type="button" data-ws-action="open-runtime-run" data-run-id="${html(run.run_id)}">
            <div class="ws-artifact-title">${html(run.run_id)}</div>
            <div class="ws-artifact-row-meta">
              <span class="ws-status-badge ${this.runtimeStatusClass(run.status)}">${html(run.status || "unknown")}</span>
              <span class="ws-artifact-version">${html(subtitle)}</span>
            </div>
          </button>
        `;
      }).join("");
      return `
        <div class="ws-list-head">
          <div class="ws-list-label">Runs</div>
          <button class="ws-upload-link" type="button" data-ws-action="refresh-runtime-runs">Refresh</button>
        </div>
        ${rows || '<div class="ws-empty-small">No runtime runs yet.</div>'}
      `;
    }

    runtimeStatusClass(status) {
      const value = String(status || "").toLowerCase();
      if (value === "succeeded") return "ws-status-file-ready";
      if (value === "failed" || value === "cancelled") return "ws-status-file-failed";
      if (value === "interrupted") return "ws-status-file-processing";
      if (value === "running" || value === "queued") return "ws-status-artifact-editing";
      return "ws-status-artifact-draft";
    }

    renderRuntimePanel() {
      const run = this.state.activeRuntimeRun;
      const objective = this.state.runtimeStartText;
      return `
        <main class="ws-chat-panel ws-runtime-panel">
          <div class="ws-context-bar">
            <span>Super Agent Runtime</span>
            <button class="ws-inline-action" type="button" data-ws-action="refresh-runtime-runs">Refresh</button>
          </div>
          <div class="ws-runtime-compose">
            <textarea class="ws-prompt ws-runtime-objective" data-ws-runtime-objective rows="2" placeholder="Describe a deterministic runtime objective...">${html(objective)}</textarea>
            <button class="ws-modal-primary" type="button" data-ws-action="start-runtime-run" ${this.state.runtimeStreaming ? "disabled" : ""}>Start Run</button>
          </div>
          <div class="ws-message-list ws-runtime-events" data-ws-scroll="messages">
            ${this.state.runtimeDetailLoading ? '<div class="ws-empty-small">Loading run detail...</div>' : ""}
            ${run ? this.renderRuntimeSummary(run) : '<div class="ws-empty-chat"><div class="ws-empty-inner"><div class="ws-empty-title">No runtime run selected</div><div class="ws-empty-subtitle">Start a run or select one from the Runs tab.</div></div></div>'}
            ${this.renderRuntimeEvents()}
          </div>
        </main>
      `;
    }

    renderRuntimeSummary(run) {
      const metadata = run.metadata || {};
      const pending = (run.interrupts || []).filter((item) => item.status === "pending");
      return `
        <section class="ws-runtime-summary">
          <div class="ws-runtime-heading-row">
            <div>
              <div class="ws-runtime-title">${html(run.run_id)}</div>
              <div class="ws-runtime-subtitle">${html(run.thread_id || "")}</div>
            </div>
            <span class="ws-status-badge ${this.runtimeStatusClass(run.status)}">${html(run.status || "unknown")}</span>
          </div>
          <div class="ws-runtime-kv">Agent: ${html(metadata.agent_id || "lead")}</div>
          <div class="ws-runtime-kv">Completed: ${html((metadata.completed_nodes || []).join(", ") || "none")}</div>
          ${pending.map((interrupt) => `
            <div class="ws-runtime-interrupt">
              <div class="ws-runtime-kv">Interrupt: ${html(interrupt.reason || interrupt.interrupt_id)}</div>
              <button class="ws-modal-primary" type="button" data-ws-action="resume-runtime-interrupt" data-run-id="${html(run.run_id)}" data-interrupt-id="${html(interrupt.interrupt_id)}">Approve</button>
            </div>
          `).join("")}
        </section>
      `;
    }

    renderRuntimeEvents() {
      if (!this.state.runtimeEvents.length) return '<div class="ws-empty-small">No events yet.</div>';
      return this.state.runtimeEvents.map((event) => `
        <div class="ws-runtime-event">
          <div class="ws-runtime-event-head">
            <span class="ws-status-badge ws-status-artifact-draft">${html(event.type || "event")}</span>
            <span>${html(event.ts || "")}</span>
          </div>
          <pre>${html(JSON.stringify(this.compactRuntimeEvent(event), null, 2))}</pre>
        </div>
      `).join("");
    }

    compactRuntimeEvent(event) {
      const copy = { ...event };
      delete copy.state;
      return copy;
    }

    renderRuntimeDetailPanel() {
      const run = this.state.activeRuntimeRun;
      const artifacts = run && Array.isArray(run.artifacts) ? run.artifacts : [];
      const childRuns = run && Array.isArray(run.child_runs) ? run.child_runs : [];
      return `
        <aside class="ws-artifact-panel ws-runtime-detail">
          <div class="ws-artifact-header">
            <div class="ws-artifact-header-title">Runtime Detail</div>
            <div class="ws-artifact-meta">
              <span class="ws-artifact-meta-text">${html(run ? run.run_id : "No run")}</span>
            </div>
          </div>
          <div class="ws-artifact-scroll">
            <section class="ws-section">
              <div class="ws-section-heading">Artifacts</div>
              ${artifacts.length ? artifacts.map((artifact) => `
                <div class="ws-runtime-side-row">
                  <div class="ws-artifact-title">${html(artifact.title || artifact.id || artifact.path)}</div>
                  <div class="ws-artifact-version">${html(artifact.path || artifact.type || "")}</div>
                </div>
              `).join("") : '<div class="ws-empty-small">No artifacts.</div>'}
            </section>
            <section class="ws-section">
              <div class="ws-section-heading">Child Runs</div>
              ${childRuns.length ? childRuns.map((child) => `
                <div class="ws-runtime-side-row">
                  <div class="ws-artifact-title">${html(child.run_id || "")}</div>
                  <div class="ws-artifact-version">${html(child.status || "")} · ${html(child.agent_id || "")}</div>
                </div>
              `).join("") : '<div class="ws-empty-small">No child runs.</div>'}
            </section>
          </div>
        </aside>
      `;
    }

    renderChatPanel() {
      const chat = this.getActiveChat();
      if (!chat || chat.messages.length === 0) {
        return `
          <main class="ws-chat-panel">
            <div class="ws-empty-chat">
              <div class="ws-empty-inner">
                <div class="ws-empty-title">What would you like to work on?</div>
                <div class="ws-empty-subtitle">Start a chat, upload files, or create your first artifact.</div>
                <div class="ws-empty-actions">
                  <button class="ws-cta" type="button" data-ws-action="focus-chat">Start a Chat</button>
                  <button class="ws-cta" type="button" data-ws-action="upload-file">Upload File</button>
                  <button class="ws-cta ws-cta-primary" type="button" data-ws-action="create-artifact">Create Artifact</button>
                </div>
                <div class="ws-empty-suggest-label">Suggested</div>
                <div class="ws-suggestion-row">
                  ${SUGGESTIONS.map((label) => `<button class="ws-chip" type="button" data-ws-action="suggestion" data-suggestion="${html(label)}">${html(label)}</button>`).join("")}
                </div>
              </div>
            </div>
          </main>
        `;
      }

      return `
        <main class="ws-chat-panel">
          <div class="ws-context-bar">
            <span>${html(this.contextSummaryText())}</span>
            <button class="ws-inline-action" type="button" data-ws-action="open-context">Manage</button>
          </div>
          <div class="ws-message-list" data-ws-scroll="messages">
            ${this.renderMessages(chat)}
            ${this.state.aiThinking ? this.renderThinking() : ""}
            ${this.state.taskStatus ? this.renderTaskStatus() : ""}
          </div>
          <div class="ws-command-row">
            ${COMMANDS.map((label) => `<button class="ws-chip" type="button" data-ws-action="suggestion" data-suggestion="${html(label)}">${html(label)}</button>`).join("")}
          </div>
          <form class="ws-composer" data-ws-composer>
            <div class="ws-composer-box">
              <textarea class="ws-prompt" data-ws-prompt rows="1" placeholder="Ask AI anything..." ${this.state.sending ? "disabled" : ""}>${html(this.state.promptText)}</textarea>
              <button class="ws-attach" type="button" title="Attach file" aria-label="Attach file" data-ws-action="attach-file">&#128206;</button>
              ${this.state.sending && this.isBroadcastChat(chat) ? '<button class="ws-stop-all" type="button" data-ws-action="stop-all">Stop all</button>' : ""}
              <button class="ws-send" type="submit" title="Send" aria-label="Send" ${this.state.sending || (!this.isBroadcastChat(chat) && chat.provider === "nvidia" && !this.state.selectedModel) ? "disabled" : ""}>&#10148;</button>
            </div>
          </form>
        </main>
      `;
    }

    renderMessages(chat) {
      return chat.messages.map((message) => {
        if (message.broadcast) return this.renderBroadcastMessage(message);
        const role = message.role === "user" ? "user" : "assistant";
        const visible = role === "user" || message.text || message.error || message.artifactRef || message.canCreateArtifact;
        if (!visible) return "";
        const isError = Boolean(message.error);
        const showCreate = role === "assistant" && !message.artifactRef && (message.canCreateArtifact || (message.done && message.text));
        return `
          <div class="ws-message-row ws-message-row-${role}">
            <div class="ws-message-wrap">
              ${message.text || message.error ? `<div class="ws-bubble ws-bubble-${role}${isError ? " ws-message-error" : ""}">${html(message.text || message.error)}</div>` : ""}
              ${message.artifactRef ? this.renderMessageArtifactCard(message.artifactRef) : ""}
              ${showCreate ? `<button class="ws-create-affordance" type="button" data-ws-action="create-artifact-from-message" data-chat-id="${html(chat.id)}" data-message-id="${html(message.id)}">+ Create Artifact</button>` : ""}
            </div>
          </div>
        `;
      }).join("");
    }

    renderBroadcastMessage(message) {
      const responses = message.responses || {};
      return `<div class="ws-message-row ws-message-row-assistant"><div class="ws-broadcast-grid">${Object.keys(responses).map((provider) => {
        const response = responses[provider];
        const status = response.error ? "error" : response.streaming ? "streaming" : response.done ? "ok" : "pending";
        const tokens = response.usage?.total_tokens ?? response.usage?.total ?? response.usage?.completion_tokens;
        return `<section class="ws-broadcast-column"><div class="ws-broadcast-column-head"><span>${html(this.providerLabel(provider))}</span><span class="ws-broadcast-status ws-broadcast-status-${status}" title="${status}"></span>${response.done && tokens != null ? `<span class="ws-broadcast-usage">${html(tokens)} tokens</span>` : ""}</div><div class="ws-broadcast-column-body${response.error ? " ws-message-error" : ""}">${html(response.text || response.error || (response.streaming ? "" : "Waiting..."))}</div></section>`;
      }).join("")}</div></div>`;
    }

    renderMessageArtifactCard(artifactId) {
      const artifact = this.state.artifacts.find((item) => item.id === artifactId);
      if (!artifact) return "";
      return `
        <button class="ws-message-artifact-card" type="button" data-ws-action="open-artifact" data-artifact-id="${html(artifact.id)}">
          <div class="ws-artifact-card-icon">&#9636;</div>
          <div class="ws-artifact-card-copy">
            <div class="ws-artifact-card-title">${html(artifact.title)}</div>
            <div class="ws-artifact-card-meta">Document &middot; Draft</div>
          </div>
          <span class="ws-muted">&rarr;</span>
        </button>
      `;
    }

    renderThinking() {
      return `
        <div class="ws-thinking">
          <div class="ws-thinking-dots" aria-label="AI thinking">
            <span class="ws-thinking-dot"></span>
            <span class="ws-thinking-dot"></span>
            <span class="ws-thinking-dot"></span>
          </div>
        </div>
      `;
    }

    renderTaskStatus() {
      const steps = this.state.taskStatus.steps.map((step) => {
        const statusClass = `ws-task-step-${step.status}`;
        const suffix = step.status === "done" ? " - Done" : step.status === "running" ? " - Running" : " - Pending";
        const icon = step.status === "done" ? "&#10003;" : step.status === "running" ? "&#9679;" : "&#9675;";
        return `<div class="ws-task-step ${statusClass}"><span class="ws-task-icon">${icon}</span>${html(step.label + suffix)}</div>`;
      }).join("");
      return `
        <div class="ws-task-card">
          <div class="ws-task-title">${html(this.state.taskStatus.title)}</div>
          ${steps}
        </div>
      `;
    }

    renderArtifactPanel(art) {
      if (!art) {
        return `
          <aside class="ws-artifact-panel">
            <div class="ws-no-artifact">
              <div class="ws-no-artifact-icon">&#9636;</div>
              <div class="ws-no-artifact-title">No artifact selected</div>
              <div class="ws-no-artifact-copy">Artifacts will appear here when AI creates reusable output.</div>
              <button class="ws-link-button" type="button" data-ws-action="open-artifacts-tab">Open Library</button>
            </div>
          </aside>
        `;
      }
      const meta = this.statusMeta("artifact", art.status);
      return `
        <aside class="ws-artifact-panel">
          <div class="ws-artifact-header">
            <div class="ws-artifact-header-top">
              <div class="ws-artifact-header-title">${html(art.title)}</div>
              <div class="ws-artifact-actions">
                <button class="ws-icon-button" type="button" title="Edit" aria-label="Edit" data-ws-action="toggle-editing">${art.status === "editing" ? "&#10003;" : "&#9998;"}</button>
                <button class="ws-icon-button" type="button" title="Version history" aria-label="Version history" data-ws-action="open-version-history">&#9201;</button>
                <button class="ws-icon-button" type="button" title="Export" aria-label="Export" data-ws-action="open-export">&#10515;</button>
              </div>
            </div>
            <div class="ws-artifact-meta">
              <span class="ws-status-badge ${meta.className}">${html(meta.label)}</span>
              <span class="ws-artifact-meta-text">${html(art.type)}</span>
              <span class="ws-artifact-meta-text">&middot;</span>
              <span class="ws-artifact-meta-text">v${html(art.version)}</span>
              <span class="ws-artifact-meta-text">&middot;</span>
              <span class="ws-artifact-meta-text">${html(art.updated)}</span>
            </div>
            ${art.status !== "final" && art.status !== "exported" ? '<button class="ws-inline-action ws-mark-final" type="button" data-ws-action="mark-final">Mark as Final</button>' : ""}
          </div>
          <div class="ws-artifact-scroll" data-ws-scroll="artifact">
            ${art.sections.map((section) => this.renderArtifactSection(art, section)).join("")}
          </div>
        </aside>
      `;
    }

    renderArtifactSection(artifact, section) {
      return `
        <section class="ws-section">
          <div class="ws-section-heading-row">
            <div class="ws-section-heading">${html(section.heading)}</div>
            <button class="ws-menu-button" type="button" aria-label="Section actions" data-ws-action="toggle-section-menu" data-artifact-id="${html(artifact.id)}" data-section-id="${html(section.id)}">&#8943;</button>
          </div>
          ${section.loading ? '<div class="ws-section-loading">Updating selected section...</div>' : `<div class="ws-section-body">${html(section.body)}</div>`}
          ${section.menuOpen ? `
            <div class="ws-section-menu">
              ${SECTION_ACTIONS.map((label) => `<button class="ws-section-action" type="button" data-ws-action="section-action" data-artifact-id="${html(artifact.id)}" data-section-id="${html(section.id)}" data-section-action="${html(label)}">${html(label)}</button>`).join("")}
            </div>
          ` : ""}
        </section>
      `;
    }

    renderContextDrawer() {
      const files = this.state.files.map((file) => {
        const meta = this.statusMeta("file", file.status);
        const checked = this.state.contextFileIds.includes(file.id);
        return `
          <label class="ws-checkbox-row">
            <input type="checkbox" data-context-file-id="${html(file.id)}" ${checked ? "checked" : ""}>
            <div class="ws-checkbox-main"><div class="ws-checkbox-title">${html(file.name)}</div></div>
            <span class="ws-status-badge ${meta.className}">${html(meta.label)}</span>
          </label>
        `;
      }).join("");
      const artifacts = this.state.artifacts.map((artifact) => {
        const checked = this.state.contextArtifactIds.includes(artifact.id);
        return `
          <label class="ws-checkbox-row">
            <input type="checkbox" data-context-artifact-id="${html(artifact.id)}" ${checked ? "checked" : ""}>
            <div class="ws-checkbox-main"><div class="ws-checkbox-title">${html(artifact.title)} v${html(artifact.version)}</div></div>
          </label>
        `;
      }).join("");
      const instructions = this.state.instructions.map((instruction) => `
        <label class="ws-checkbox-row">
          <input type="checkbox" data-instruction-id="${html(instruction.id)}" ${instruction.active ? "checked" : ""}>
          <div class="ws-checkbox-title">${html(instruction.label)}</div>
        </label>
      `).join("");
      const estimate = this.contextEstimate();
      return `
        <div class="ws-overlay ws-drawer-scrim" data-ws-action="close-context"></div>
        <aside class="ws-drawer" aria-label="Manage Context">
          <div class="ws-drawer-header">
            <div class="ws-drawer-title">Manage Context</div>
            <button class="ws-close-button" type="button" data-ws-action="close-context" aria-label="Close">&times;</button>
          </div>
          <div class="ws-drawer-body">
            ${estimate.tooLarge ? `
              <div class="ws-context-warning">
                <div class="ws-context-warning-title">Too much context selected.</div>
                <div class="ws-context-warning-copy">Remove some files or artifacts, or use selected context only.</div>
                <div class="ws-warning-actions">
                  <button class="ws-danger-outline" type="button" data-ws-action="use-selected-only">Use Selected Only</button>
                  <button class="ws-danger-outline" type="button" data-ws-action="clear-context">Clear Context</button>
                </div>
              </div>
            ` : ""}
            <div class="ws-drawer-label">Files</div>
            ${files || '<div class="ws-empty-small">No files yet.</div>'}
            <div class="ws-drawer-label ws-drawer-label-spaced">Artifacts</div>
            ${artifacts || '<div class="ws-empty-small">None yet.</div>'}
            <div class="ws-drawer-label ws-drawer-label-spaced">Instructions</div>
            ${instructions}
            <div class="ws-context-estimate">
              <span>Context estimate</span>
              <b class="${html(estimate.className)}">${html(estimate.label)}</b>
            </div>
          </div>
          <div class="ws-drawer-footer">
            <button class="ws-link-button" type="button" data-ws-action="clear-context">Clear</button>
            <button class="ws-modal-primary" type="button" data-ws-action="apply-context">Apply</button>
          </div>
        </aside>
      `;
    }

    renderVersionHistory(art) {
      if (!art) return "";
      const versions = art.versions.map((version) => {
        const selected = version.v === (this.state.compareVersion || art.version);
        const current = version.v === art.version;
        return `
          <div class="ws-version-item${selected ? " is-selected" : ""}" data-ws-action="select-version" data-version="${html(version.v)}">
            <div class="ws-version-title-row">
              <span class="ws-version-label">v${html(version.v)}</span>
              ${current ? '<span class="ws-current-badge">CURRENT</span>' : ""}
            </div>
            <div class="ws-version-summary">${html(version.summary)}</div>
            <div class="ws-version-time">${html(version.time)} &middot; ${html(version.author)}</div>
            ${!current ? `<button class="ws-inline-action ws-version-restore" type="button" data-ws-action="restore-version" data-version="${html(version.v)}">Restore</button>` : ""}
          </div>
        `;
      }).join("");
      const diff = this.diffItems(art);
      return `
        <div class="ws-overlay ws-modal-shell" data-ws-action="close-version-history">
          <div class="ws-version-modal" role="dialog" aria-modal="true" aria-label="Version History" data-ws-modal>
            <div class="ws-modal-header">
              <div class="ws-modal-title">Version History &mdash; ${html(art.title)}</div>
              <button class="ws-close-button" type="button" data-ws-action="close-version-history" aria-label="Close">&times;</button>
            </div>
            <div class="ws-version-body">
              <div class="ws-version-list">${versions}</div>
              <div class="ws-diff-panel">
                <div class="ws-diff-title">Diff: ${html(diff.from)} &rarr; ${html(diff.to)}</div>
                ${diff.items.map((item) => `
                  <div class="ws-diff-row">
                    <span class="ws-diff-pill ${item.kind === "Added" ? "ws-diff-added" : "ws-diff-modified"}">${html(item.kind)}</span>
                    <div class="ws-diff-text">${html(item.text)}</div>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="ws-modal-footer">
              <button class="ws-link-button" type="button" data-ws-action="close-version-history">Close</button>
            </div>
          </div>
        </div>
      `;
    }

    renderExportModal(art) {
      if (!art) return "";
      const preview = this.buildExportPreview(art);
      return `
        <div class="ws-overlay ws-modal-shell" data-ws-action="close-export">
          <div class="ws-export-modal" role="dialog" aria-modal="true" aria-label="Export Artifact" data-ws-modal>
            <div class="ws-modal-header">
              <div class="ws-modal-title">Export Artifact</div>
              <button class="ws-close-button" type="button" data-ws-action="close-export" aria-label="Close">&times;</button>
            </div>
            <div class="ws-export-body">
              <div class="ws-export-artifact">${html(art.title)} &middot; ${html(art.type)}</div>
              <div class="ws-export-label">Format</div>
              <div class="ws-format-grid">
                ${EXPORT_FORMATS.map((label) => {
                  const value = label.toLowerCase();
                  const selected = this.state.exportFormat === value;
                  return `
                    <label class="ws-format-option${selected ? " is-selected" : ""}">
                      <input type="radio" name="exportFormat" value="${html(value)}" ${selected ? "checked" : ""}>
                      <span class="ws-format-label">${html(label)}</span>
                    </label>
                  `;
                }).join("")}
              </div>
              <div class="ws-export-label">Options</div>
              ${[
                ["title", "Include title"],
                ["metadata", "Include metadata"],
                ["versionHistory", "Include version history"],
              ].map(([key, label]) => `
                <label class="ws-checkbox-row ws-export-option-row">
                  <input type="checkbox" data-export-option="${html(key)}" ${this.state.exportOptions[key] ? "checked" : ""}>
                  <span class="ws-export-option-label">${html(label)}</span>
                </label>
              `).join("")}
              <div class="ws-export-label">Preview</div>
              <div class="ws-export-preview">${html(preview)}</div>
            </div>
            <div class="ws-modal-footer ws-export-footer">
              <button class="ws-link-button" type="button" data-ws-action="copy-export">Copy</button>
              <button class="ws-link-button" type="button" data-ws-action="share-export">Share Link</button>
              <div class="ws-export-spacer"></div>
              <button class="ws-modal-primary" type="button" data-ws-action="do-export">Download</button>
            </div>
          </div>
        </div>
      `;
    }

    contextSummaryText() {
      const fileCount = this.state.contextFileIds.length;
      const artifactCount = this.state.contextArtifactIds.length;
      if (fileCount === 0 && artifactCount === 0) return "No files or artifacts in context yet";
      return `Context: ${plural(fileCount, "file", "files")}, ${plural(artifactCount, "artifact", "artifacts")}`;
    }

    contextEstimate() {
      const score = this.state.contextFileIds.length * 2 + this.state.contextArtifactIds.length;
      const tooLarge = score > 8 || this.state.forceContextWarning;
      if (tooLarge) return { label: "Over limit", className: "ws-estimate-over", tooLarge };
      if (score >= 4) return { label: "High", className: "ws-estimate-high", tooLarge };
      if (score >= 2) return { label: "Medium", className: "ws-estimate-medium", tooLarge };
      return { label: "Low", className: "ws-estimate-low", tooLarge };
    }

    diffItems(art) {
      const currentVersion = this.state.compareVersion || art.version;
      const currentIndex = art.versions.findIndex((version) => version.v === currentVersion);
      const current = art.versions[currentIndex] || art.versions[0];
      const previous = art.versions[currentIndex + 1];
      const items = [{ kind: "Modified", text: current.summary }];
      if (!previous) {
        items.unshift({ kind: "Added", text: `Initial sections: ${art.sections.map((section) => section.heading).join(", ")}` });
      }
      return {
        from: previous ? `v${previous.v}` : "Start",
        to: `v${current.v}`,
        items,
      };
    }

    buildExportPreview(art) {
      if (!art) return "";
      let out = "";
      if (this.state.exportOptions.title) out += `# ${art.title}\n\n`;
      if (this.state.exportOptions.metadata) out += `Type: ${art.type} \u00b7 Version: v${art.version} \u00b7 Status: ${art.status}\n\n`;
      art.sections.forEach((section) => {
        out += `## ${section.heading}\n${section.body}\n\n`;
      });
      if (this.state.exportOptions.versionHistory) {
        out += "## Version History\n";
        art.versions.forEach((version) => {
          out += `v${version.v} \u2014 ${version.summary}\n`;
        });
      }
      return out.trim();
    }

    handleClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const modal = target.closest("[data-ws-modal]");
      const actionEl = target.closest("[data-ws-action]");

      if (actionEl && actionEl.classList.contains("ws-overlay") && modal) return;
      if (!actionEl) {
        if (this.state.showModelPopover && !target.closest(".ws-model-wrap")) {
          this.setState({ showModelPopover: false });
        }
        return;
      }

      const action = actionEl.getAttribute("data-ws-action");
      if (modal && actionEl.classList.contains("ws-overlay")) return;
      event.preventDefault();

      switch (action) {
        case "toggle-model-popover":
          this.setState((state) => ({ showModelPopover: !state.showModelPopover }));
          break;
        case "select-model":
          this.selectModel(actionEl.getAttribute("data-model-id") || "");
          break;
        case "settings":
          this.showToast("Settings not available in this preview.");
          break;
        case "open-export":
          this.openExportModal();
          break;
        case "new-chat":
          this.newChat();
          break;
        case "new-broadcast-chat":
          this.newBroadcastChat();
          break;
        case "stop-all":
          this.abortBroadcastStreams();
          break;
        case "set-left-tab":
          this.setState({ leftTab: actionEl.getAttribute("data-tab") || "chats" });
          if (actionEl.getAttribute("data-tab") === "runs") this.loadRuntimeRuns();
          break;
        case "switch-chat":
          this.switchChat(actionEl.getAttribute("data-chat-id") || "");
          break;
        case "open-runtime-run":
          this.loadRuntimeRunDetail(actionEl.getAttribute("data-run-id") || "");
          break;
        case "refresh-runtime-runs":
          this.loadRuntimeRuns();
          break;
        case "start-runtime-run":
          this.startRuntimeRun();
          break;
        case "resume-runtime-interrupt":
          this.resumeRuntimeInterrupt(actionEl.getAttribute("data-run-id") || "", actionEl.getAttribute("data-interrupt-id") || "");
          break;
        case "upload-file":
        case "attach-file":
          this.uploadFileMock();
          break;
        case "focus-chat":
          this.focusChatCta();
          break;
        case "create-artifact":
          this.createArtifactCta();
          break;
        case "suggestion":
          this.selectSuggestion(actionEl.getAttribute("data-suggestion") || "");
          break;
        case "open-context":
          this.setState({ showContextDrawer: true });
          break;
        case "close-context":
          this.setState({ showContextDrawer: false, forceContextWarning: false });
          break;
        case "use-selected-only":
          this.setState({ forceContextWarning: false });
          this.showToast("Using selected context only.");
          break;
        case "clear-context":
          this.setState({ contextFileIds: [], contextArtifactIds: [], forceContextWarning: false });
          break;
        case "apply-context":
          this.setState({ showContextDrawer: false });
          this.showToast("Context updated.");
          break;
        case "open-artifact":
          this.openArtifact(actionEl.getAttribute("data-artifact-id") || "");
          break;
        case "open-artifacts-tab":
          this.setState({ leftTab: "artifacts" });
          break;
        case "toggle-editing":
          this.toggleEditing();
          break;
        case "open-version-history":
          this.openVersionHistory();
          break;
        case "close-version-history":
          this.setState({ showVersionHistory: false });
          break;
        case "select-version":
          this.setState({ compareVersion: Number(actionEl.getAttribute("data-version") || 1) });
          break;
        case "restore-version":
          this.restoreVersion(Number(actionEl.getAttribute("data-version") || 1));
          break;
        case "mark-final":
          this.markFinal();
          break;
        case "toggle-section-menu":
          this.toggleSectionMenu(actionEl.getAttribute("data-artifact-id") || "", actionEl.getAttribute("data-section-id") || "");
          break;
        case "section-action":
          this.applySectionAction(
            actionEl.getAttribute("data-artifact-id") || "",
            actionEl.getAttribute("data-section-id") || "",
            actionEl.getAttribute("data-section-action") || "",
          );
          break;
        case "close-export":
          this.setState({ showExportModal: false });
          break;
        case "copy-export":
          this.copyExport();
          break;
        case "share-export":
          this.showToast("Share link copied.");
          break;
        case "do-export":
          this.doExport();
          break;
        case "create-artifact-from-message":
          this.runGenerationFlow(actionEl.getAttribute("data-chat-id") || this.state.activeChatId);
          break;
        default:
          break;
      }
    }

    handleInput(event) {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement && target.matches("[data-ws-prompt]")) {
        this.state.promptText = target.value;
        this.autogrow(target);
      }
      if (target instanceof HTMLTextAreaElement && target.matches("[data-ws-runtime-objective]")) {
        this.state.runtimeStartText = target.value;
        this.autogrow(target);
      }
    }

    handleChange(event) {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.matches("[data-ws-provider]")) {
        this.selectProvider(target.value);
        return;
      }
      if (!(target instanceof HTMLInputElement)) return;
      const broadcastProvider = target.getAttribute("data-ws-broadcast-provider");
      if (broadcastProvider) {
        this.toggleBroadcastProvider(broadcastProvider, target.checked);
        return;
      }
      const fileId = target.getAttribute("data-context-file-id");
      if (fileId) {
        this.toggleContextFile(fileId);
        return;
      }
      const artifactId = target.getAttribute("data-context-artifact-id");
      if (artifactId) {
        this.toggleContextArtifact(artifactId);
        return;
      }
      const instructionId = target.getAttribute("data-instruction-id");
      if (instructionId) {
        this.toggleInstruction(instructionId);
        return;
      }
      const exportOption = target.getAttribute("data-export-option");
      if (exportOption) {
        this.toggleExportOption(exportOption);
        return;
      }
      if (target.name === "exportFormat") {
        this.setState({ exportFormat: target.value });
      }
    }

    handleKeyDown(event) {
      const target = event.target;
      if (target instanceof HTMLTextAreaElement && target.matches("[data-ws-prompt]")) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          this.handleSend();
        }
      }
      if (event.key === "Escape") {
        if (this.state.showExportModal) this.setState({ showExportModal: false });
        else if (this.state.showVersionHistory) this.setState({ showVersionHistory: false });
        else if (this.state.showContextDrawer) this.setState({ showContextDrawer: false, forceContextWarning: false });
        else if (this.state.showModelPopover) this.setState({ showModelPopover: false });
      }
    }

    handleSubmit(event) {
      if (event.target instanceof HTMLFormElement && event.target.matches("[data-ws-composer]")) {
        event.preventDefault();
        this.handleSend();
      }
    }

    autogrow(textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }

    selectModel(id) {
      const model = this.state.modelCatalog.find((item) => item.id === id);
      if (!model || model.unavailable) return;
      this.setState({ selectedModel: id, showModelPopover: false });
      this.showToast(`${model.shortName} selected.`);
    }

    selectProvider(id) {
      const chat = this.getActiveChat();
      const provider = this.state.providers.find((row) => row.id === id);
      if (!chat || chat.messages.length || !provider?.available) return;
      this.setState((state) => ({
        chats: state.chats.map((item) => item.id === chat.id ? { ...item, provider: id, sessionId: null } : item),
        showModelPopover: false,
      }));
    }

    newChat() {
      if (this.state.sending) {
        this.abortStream();
        this.abortBroadcastStreams();
      }
      const id = genId("chat");
      const chat = { id, title: "New Chat", messages: [], provider: "nvidia", sessionId: null };
      this.setState((state) => ({
        chats: [chat, ...state.chats],
        activeChatId: id,
        leftTab: "chats",
        promptText: "",
        aiThinking: false,
        taskStatus: null,
      }));
    }

    newBroadcastChat() {
      if (this.state.sending) {
        this.abortStream();
        this.abortBroadcastStreams();
      }
      const providers = this.state.providers.filter((row) => row.available).map((row) => row.id);
      if (providers.length < 2) {
        this.showToast("Broadcast needs at least two available providers.");
        return;
      }
      const id = genId("chat");
      const chat = { id, title: "New Broadcast", messages: [], providers, sessionIds: {} };
      this.setState((state) => ({
        chats: [chat, ...state.chats], activeChatId: id, leftTab: "chats", promptText: "", aiThinking: false, taskStatus: null,
      }));
    }

    toggleBroadcastProvider(providerId, checked) {
      const chat = this.getActiveChat();
      if (!chat || !this.isBroadcastChat(chat) || chat.messages.length) return;
      const providers = checked ? [...new Set([...chat.providers, providerId])] : chat.providers.filter((id) => id !== providerId);
      if (providers.length < 2) {
        this.showToast("Select at least two providers for broadcast.");
        this.render();
        return;
      }
      this.setState((state) => ({ chats: state.chats.map((item) => item.id === chat.id ? { ...item, providers } : item) }));
    }

    switchChat(id) {
      if (!this.state.chats.some((chat) => chat.id === id)) return;
      if (this.state.sending) {
        this.abortStream();
        this.abortBroadcastStreams();
      }
      this.setState({ activeChatId: id, leftTab: "chats", promptText: "", aiThinking: false, taskStatus: null, showModelPopover: false }, { scrollMessagesBottom: true });
    }

    focusChatCta() {
      const chatId = this.state.activeChatId;
      const message = {
        id: genId("msg"),
        role: "assistant",
        text: "I'm ready. Ask me anything, or try one of the suggestions below.",
        done: true,
        canCreateArtifact: true,
      };
      this.setState((state) => ({
        chats: state.chats.map((chat) => chat.id === chatId ? { ...chat, messages: [message] } : chat),
      }), { scrollMessagesBottom: true });
    }

    createArtifactCta() {
      const chat = this.getActiveChat();
      if (!chat) return;
      if (chat.messages.length === 0) {
        const userMessage = { id: genId("msg"), role: "user", text: "Create a product launch plan" };
        this.setState((state) => ({
          chats: state.chats.map((item) => item.id === chat.id ? { ...item, messages: [userMessage], title: "Product Launch Plan" } : item),
        }), { scrollMessagesBottom: true });
      }
      this.runGenerationFlow(chat.id);
    }

    selectSuggestion(label) {
      if ((label === "Compare two versions" || label === "Compare versions") && this.state.activeArtifactId) {
        this.openVersionHistory();
        return;
      }
      this.sendMessage(label);
    }

    handleSend() {
      const text = String(this.state.promptText || "").trim();
      if (!text || this.state.sending) return;
      this.state.promptText = "";
      this.sendMessage(text);
    }

    chatRequestMessages(chat, additionalUserText) {
      const rows = chat.messages
        .filter((message) => (message.role === "user" || message.role === "assistant") && message.text)
        .map((message) => ({ role: message.role === "user" ? "user" : "assistant", content: String(message.text || "") }));
      if (additionalUserText) rows.push({ role: "user", content: additionalUserText });
      return rows;
    }

    broadcastRequestMessages(chat, provider, additionalUserText) {
      const rows = chat.messages.flatMap((message) => {
        if (message.role === "user" && message.text) return [{ role: "user", content: String(message.text) }];
        if (message.broadcast) {
          const response = message.responses?.[provider];
          return response?.text ? [{ role: "assistant", content: String(response.text) }] : [];
        }
        return message.role === "assistant" && message.text ? [{ role: "assistant", content: String(message.text) }] : [];
      });
      if (additionalUserText) rows.push({ role: "user", content: additionalUserText });
      return rows;
    }

    sendMessage(text) {
      const chat = this.getActiveChat();
      if (!chat) return;
      if (this.isBroadcastChat(chat)) {
        this.sendBroadcastMessage(chat, text);
        return;
      }
      const provider = chat.provider || "nvidia";
      if (provider === "nvidia" && !this.state.selectedModel) {
        this.showToast(this.state.modelLoading ? "Models are still loading." : "Select a model first.");
        return;
      }
      const requestMessages = this.chatRequestMessages(chat, text);
      const userMessage = { id: genId("msg"), role: "user", text };
      const assistantMessage = { id: genId("msg"), role: "assistant", text: "", reasoning: "", streaming: true, done: false };
      const shouldRename = chat.title === "New Chat" && chat.messages.length === 0;
      const nextTitle = shouldRename ? text.slice(0, 42) || "New Chat" : chat.title;
      this.setState((state) => ({
        chats: state.chats.map((item) => item.id === chat.id ? {
          ...item,
          title: nextTitle,
          messages: [...item.messages, userMessage, assistantMessage],
        } : item),
        aiThinking: true,
        sending: true,
        showModelPopover: false,
      }), { scrollMessagesBottom: true });
      this.streamChatResponse(chat.id, assistantMessage.id, requestMessages, provider, this.state.selectedModel, chat.sessionId);
    }

    sendBroadcastMessage(chat, text) {
      const providers = chat.providers.filter((id) => this.state.providers.some((row) => row.id === id && row.available));
      if (providers.length < 2) {
        this.showToast("Broadcast needs at least two available providers.");
        return;
      }
      const userMessage = { id: genId("msg"), role: "user", text };
      const assistantMessage = { id: genId("msg"), role: "assistant", broadcast: true, responses: Object.fromEntries(providers.map((id) => [id, { text: "", streaming: true, done: false }])) };
      const nextTitle = chat.title === "New Broadcast" && chat.messages.length === 0 ? text.slice(0, 42) || "New Broadcast" : chat.title;
      this.setState((state) => ({ chats: state.chats.map((item) => item.id === chat.id ? { ...item, title: nextTitle, messages: [...item.messages, userMessage, assistantMessage] } : item), aiThinking: true, sending: true, showModelPopover: false }), { scrollMessagesBottom: true });
      providers.forEach((provider) => this.streamBroadcastResponse(chat.id, assistantMessage.id, provider, this.broadcastRequestMessages(chat, provider, text), chat.sessionIds?.[provider]));
    }

    abortStream() {
      if (this.streamController) {
        this.streamController.abort();
        this.streamController = null;
      }
      if (this.mounted && this.state.sending) {
        this.setState({ sending: false, aiThinking: false });
      }
    }

    abortBroadcastStreams() {
      this.broadcastControllers.forEach((controller) => controller.abort());
      this.broadcastControllers.clear();
      if (this.mounted && this.state.sending) this.setState({ sending: false, aiThinking: false });
    }

    async streamChatResponse(chatId, messageId, requestMessages, requestProvider, requestModel, sessionId) {
      this.streamController = new AbortController();
      try {
        const body = { provider: requestProvider, messages: requestMessages };
        if (requestProvider === "nvidia") body.model = requestModel;
        if (sessionId) body.session_id = sessionId;
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hub-Client": "harness-hub" },
          body: JSON.stringify(body),
          signal: this.streamController.signal,
        });
        if (!response.ok) {
          const raw = await response.text();
          let message = `${response.status} ${response.statusText}`;
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.detail) message = Array.isArray(parsed.detail) ? parsed.detail.join("; ") : String(parsed.detail);
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
          parts.forEach((part) => this.handleSseBlock(part, chatId, messageId, requestModel));
        }
        buffer += decoder.decode();
        this.handleSseBlock(buffer, chatId, messageId, requestModel);
      } catch (error) {
        if (error.name !== "AbortError") {
          this.updateAssistantMessage(chatId, messageId, {
            text: error.message || String(error),
            error: error.message || String(error),
            streaming: false,
            done: false,
          });
        }
      } finally {
        if (this.streamController) this.streamController = null;
        if (this.mounted) {
          this.updateAssistantMessage(chatId, messageId, { streaming: false });
          this.setState({ sending: false, aiThinking: false }, { scrollMessagesBottom: true });
        }
      }
    }

    async streamBroadcastResponse(chatId, messageId, provider, requestMessages, sessionId) {
      const controller = new AbortController();
      this.broadcastControllers.set(provider, controller);
      try {
        const body = { provider, messages: requestMessages };
        if (provider === "nvidia" && this.state.selectedModel) body.model = this.state.selectedModel;
        if (sessionId) body.session_id = sessionId;
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Hub-Client": "harness-hub" },
          body: JSON.stringify(body), signal: controller.signal,
        });
        if (!response.ok) {
          const raw = await response.text();
          throw new Error(raw || `${response.status} ${response.statusText}`);
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
          parts.forEach((part) => this.handleBroadcastSseBlock(part, chatId, messageId, provider));
        }
        buffer += decoder.decode();
        this.handleBroadcastSseBlock(buffer, chatId, messageId, provider);
      } catch (error) {
        if (error.name !== "AbortError") this.updateBroadcastResponse(chatId, messageId, provider, { text: error.message || String(error), error: error.message || String(error), streaming: false, done: false });
      } finally {
        this.broadcastControllers.delete(provider);
        if (this.mounted) {
          this.updateBroadcastResponse(chatId, messageId, provider, { streaming: false });
          if (this.broadcastControllers.size === 0) this.setState({ sending: false, aiThinking: false }, { scrollMessagesBottom: true });
        }
      }
    }

    handleBroadcastSseBlock(block, chatId, messageId, provider) {
      if (!String(block || "").trim()) return;
      try {
        const parsed = parseSseBlock(block);
        const payload = parsed.data ? JSON.parse(parsed.data) : {};
        if (parsed.eventName === "delta") {
          this.appendBroadcastText(chatId, messageId, provider, String(payload.text || ""));
          this.setState({ aiThinking: false }, { scrollMessagesBottom: true });
        } else if (parsed.eventName === "done") {
          if (payload.session_id) this.setState((state) => ({ chats: state.chats.map((chat) => chat.id === chatId ? { ...chat, sessionIds: { ...(chat.sessionIds || {}), [provider]: String(payload.session_id) } } : chat) }));
          this.updateBroadcastResponse(chatId, messageId, provider, { streaming: false, done: true, usage: payload.usage || null, model: payload.model || null });
        } else if (parsed.eventName === "error") {
          const message = String(payload.message || "Chat stream error");
          this.updateBroadcastResponse(chatId, messageId, provider, { text: message, error: message, streaming: false, done: false });
        }
      } catch (error) {
        this.updateBroadcastResponse(chatId, messageId, provider, { text: error.message || String(error), error: error.message || String(error), streaming: false, done: false });
      }
    }

    updateBroadcastResponse(chatId, messageId, provider, patch) {
      this.setState((state) => ({ chats: state.chats.map((chat) => chat.id === chatId ? { ...chat, messages: chat.messages.map((message) => message.id === messageId ? { ...message, responses: { ...message.responses, [provider]: { ...message.responses?.[provider], ...patch } } } : message) } : chat) }), { scrollMessagesBottom: true });
    }

    appendBroadcastText(chatId, messageId, provider, text) {
      if (!text) return;
      const chat = this.state.chats.find((item) => item.id === chatId);
      const message = chat?.messages.find((item) => item.id === messageId);
      this.updateBroadcastResponse(chatId, messageId, provider, { text: String(message?.responses?.[provider]?.text || "") + text });
    }

    handleSseBlock(block, chatId, messageId, requestModel) {
      if (!String(block || "").trim()) return;
      let parsed;
      let payload = {};
      try {
        parsed = parseSseBlock(block);
        payload = parsed.data ? JSON.parse(parsed.data) : {};
      } catch (error) {
        this.updateAssistantMessage(chatId, messageId, {
          text: error.message || String(error),
          error: error.message || String(error),
          streaming: false,
        });
        return;
      }

      if (parsed.eventName === "delta") {
        this.appendAssistantText(chatId, messageId, String(payload.text || ""));
        this.setState({ aiThinking: false }, { scrollMessagesBottom: true });
      } else if (parsed.eventName === "reasoning") {
        this.appendAssistantReasoning(chatId, messageId, String(payload.text || ""));
      } else if (parsed.eventName === "done") {
        if (payload.session_id) {
          this.setState((state) => ({
            chats: state.chats.map((chat) => chat.id === chatId ? { ...chat, sessionId: String(payload.session_id) } : chat),
          }));
        }
        this.updateAssistantMessage(chatId, messageId, {
          streaming: false,
          done: true,
          model: payload.model || requestModel,
          usage: payload.usage || null,
        });
        this.setState({ aiThinking: false }, { scrollMessagesBottom: true });
      } else if (parsed.eventName === "error") {
        const message = String(payload.message || "Chat stream error");
        this.updateAssistantMessage(chatId, messageId, {
          text: message,
          error: message,
          streaming: false,
          done: false,
        });
        this.setState({ aiThinking: false }, { scrollMessagesBottom: true });
      }
    }

    updateAssistantMessage(chatId, messageId, patch) {
      this.setState((state) => ({
        chats: state.chats.map((chat) => chat.id === chatId ? {
          ...chat,
          messages: chat.messages.map((message) => message.id === messageId ? { ...message, ...patch } : message),
        } : chat),
      }), { scrollMessagesBottom: true });
    }

    appendAssistantText(chatId, messageId, text) {
      if (!text) return;
      this.setState((state) => ({
        chats: state.chats.map((chat) => chat.id === chatId ? {
          ...chat,
          messages: chat.messages.map((message) => message.id === messageId ? { ...message, text: String(message.text || "") + text } : message),
        } : chat),
      }), { scrollMessagesBottom: true });
    }

    appendAssistantReasoning(chatId, messageId, text) {
      if (!text) return;
      this.setState((state) => ({
        chats: state.chats.map((chat) => chat.id === chatId ? {
          ...chat,
          messages: chat.messages.map((message) => message.id === messageId ? { ...message, reasoning: String(message.reasoning || "") + text } : message),
        } : chat),
      }));
    }

    runGenerationFlow(chatId) {
      if (this.state.taskStatus) return;
      const steps = ["Understanding request", "Drafting structure", "Generating content", "Saving artifact"];
      this.setState({
        aiThinking: false,
        taskStatus: { title: "Creating artifact", steps: steps.map((label, index) => ({ label, status: index === 0 ? "running" : "pending" })) },
      }, { scrollMessagesBottom: true });

      let index = 0;
      const advance = () => {
        index += 1;
        this.setState((state) => {
          if (!state.taskStatus) return {};
          return {
            taskStatus: {
              ...state.taskStatus,
              steps: state.taskStatus.steps.map((step, stepIndex) => {
                if (stepIndex < index) return { ...step, status: "done" };
                if (stepIndex === index) return { ...step, status: "running" };
                return { ...step, status: "pending" };
              }),
            },
          };
        }, { scrollMessagesBottom: true });
        if (index < steps.length) {
          this.setTimer(advance, 550);
        } else {
          this.setTimer(() => this.finishGeneration(chatId), 500);
        }
      };
      this.setTimer(advance, 550);
    }

    finishGeneration(chatId) {
      const artId = genId("art");
      const artifact = {
        id: artId,
        title: "Product Launch Plan",
        type: "Document",
        status: "draft",
        version: 1,
        sections: ARTIFACT_TEMPLATE().map((section) => ({ id: genId("sec"), ...section, menuOpen: false, loading: false })),
        versions: [{ v: 1, summary: "Initial draft", time: "just now", author: "AI" }],
        updated: "just now",
      };
      const assistantMessage = {
        id: genId("msg"),
        role: "assistant",
        text: "I created a draft product launch plan as an artifact. You can review, edit, or export it from the right panel.",
        artifactRef: artId,
        done: true,
      };
      this.setState((state) => ({
        taskStatus: null,
        artifacts: [artifact, ...state.artifacts],
        activeArtifactId: artId,
        contextArtifactIds: state.contextArtifactIds.includes(artId) ? state.contextArtifactIds : [...state.contextArtifactIds, artId],
        leftTab: "artifacts",
        chats: state.chats.map((chat) => chat.id === chatId ? {
          ...chat,
          title: "Product Launch Plan",
          messages: [...chat.messages, assistantMessage],
        } : chat),
      }), { scrollMessagesBottom: true });
    }

    uploadFileMock() {
      const pool = ["RequirementNotes.md", "ResearchSummary.docx", "MeetingNotes.md", "DataOverview.csv"];
      const name = pool[this.state.files.length % pool.length];
      const id = genId("file");
      this.setState((state) => ({
        files: [...state.files, { id, name, status: "uploading" }],
        leftTab: "files",
      }));
      this.setTimer(() => {
        this.setState((state) => ({ files: state.files.map((file) => file.id === id ? { ...file, status: "processing" } : file) }));
      }, 900);
      this.setTimer(() => {
        this.setState((state) => ({
          files: state.files.map((file) => file.id === id ? { ...file, status: "ready" } : file),
          contextFileIds: state.contextFileIds.includes(id) ? state.contextFileIds : [...state.contextFileIds, id],
        }));
        this.showToast(`${name} is ready and added to context.`);
      }, 2000);
    }

    toggleContextFile(id) {
      this.setState((state) => {
        const has = state.contextFileIds.includes(id);
        return { contextFileIds: has ? state.contextFileIds.filter((item) => item !== id) : [...state.contextFileIds, id] };
      });
    }

    toggleContextArtifact(id) {
      this.setState((state) => {
        const has = state.contextArtifactIds.includes(id);
        return { contextArtifactIds: has ? state.contextArtifactIds.filter((item) => item !== id) : [...state.contextArtifactIds, id] };
      });
    }

    toggleInstruction(id) {
      this.setState((state) => ({
        instructions: state.instructions.map((instruction) => instruction.id === id ? { ...instruction, active: !instruction.active } : instruction),
      }));
    }

    openArtifact(id) {
      if (!this.state.artifacts.some((artifact) => artifact.id === id)) return;
      this.setState({ activeArtifactId: id, leftTab: "artifacts" });
    }

    toggleEditing() {
      const art = this.getActiveArtifact();
      if (!art) return;
      this.setState((state) => ({
        artifacts: state.artifacts.map((artifact) => artifact.id === art.id ? {
          ...artifact,
          status: artifact.status === "editing" ? "draft" : "editing",
        } : artifact),
      }));
    }

    markFinal() {
      const art = this.getActiveArtifact();
      if (!art) return;
      this.setState((state) => ({
        artifacts: state.artifacts.map((artifact) => artifact.id === art.id ? { ...artifact, status: "final" } : artifact),
      }));
      this.showToast("Marked as final.");
    }

    toggleSectionMenu(artifactId, sectionId) {
      this.setState((state) => ({
        artifacts: state.artifacts.map((artifact) => artifact.id !== artifactId ? artifact : {
          ...artifact,
          sections: artifact.sections.map((section) => section.id === sectionId ? { ...section, menuOpen: !section.menuOpen } : { ...section, menuOpen: false }),
        }),
      }));
    }

    applySectionAction(artifactId, sectionId, action) {
      this.setState((state) => ({
        artifacts: state.artifacts.map((artifact) => artifact.id !== artifactId ? artifact : {
          ...artifact,
          sections: artifact.sections.map((section) => section.id === sectionId ? { ...section, loading: true, menuOpen: false } : section),
        }),
      }));
      this.setTimer(() => {
        let newVersion = 1;
        this.setState((state) => ({
          artifacts: state.artifacts.map((artifact) => {
            if (artifact.id !== artifactId) return artifact;
            newVersion = artifact.version + 1;
            let changedHeading = "";
            const sections = artifact.sections.map((section) => {
              if (section.id !== sectionId) return section;
              changedHeading = section.heading;
              return { ...section, loading: false, body: this.transformText(section.body, action) };
            });
            return {
              ...artifact,
              sections,
              version: newVersion,
              status: "editing",
              updated: "just now",
              versions: [{ v: newVersion, summary: `${action} applied to "${changedHeading}"`, time: "just now", author: "AI" }, ...artifact.versions],
            };
          }),
        }));
        this.showToast(`Section updated \u2014 saved as v${newVersion}.`);
      }, 1100);
    }

    transformText(text, action) {
      if (action === "Shorten") return `${text.split(". ")[0]}.`;
      if (action === "Expand") return `${text} Additional detail has been added to support execution planning, clear ownership, and stakeholder sign-off.`;
      if (action === "Rewrite") return `Reframed for clarity \u2014 ${text}`;
      if (action === "Add examples") return `${text} For example, a comparable rollout reduced time-to-first-value by scoping its beta to three design partners.`;
      if (action === "Change tone") return `${text} (Tone adjusted to be more formal.)`;
      return text;
    }

    openVersionHistory() {
      const art = this.getActiveArtifact();
      if (!art) return;
      this.setState({ showVersionHistory: true, compareVersion: art.versions[0] ? art.versions[0].v : 1 });
    }

    restoreVersion(version) {
      this.setState({ showVersionHistory: false });
      this.showToast(`Restored to v${version}.`);
    }

    openExportModal() {
      if (!this.state.activeArtifactId) return;
      this.setState({ showExportModal: true });
    }

    toggleExportOption(key) {
      if (!Object.prototype.hasOwnProperty.call(this.state.exportOptions, key)) return;
      this.setState((state) => ({ exportOptions: { ...state.exportOptions, [key]: !state.exportOptions[key] } }));
    }

    async copyExport() {
      const art = this.getActiveArtifact();
      const text = this.buildExportPreview(art);
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      } catch (_error) {
        /* keep reference-style toast even when clipboard is unavailable */
      }
      this.showToast("Content copied to clipboard.");
    }

    doExport() {
      const art = this.getActiveArtifact();
      if (art) {
        this.setState((state) => ({
          artifacts: state.artifacts.map((artifact) => artifact.id === art.id ? { ...artifact, status: "exported" } : artifact),
          showExportModal: false,
        }));
      } else {
        this.setState({ showExportModal: false });
      }
      this.showToast(`Exported as ${this.state.exportFormat.toUpperCase()}.`);
    }
  }

  let instance = null;

  window.HubWorkspace = {
    mount(rootEl) {
      instance = new Workspace();
      instance.mount(rootEl);
    },
    unmount() {
      if (instance) {
        instance.unmount();
        instance = null;
      }
    },
  };
})();
