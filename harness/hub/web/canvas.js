(function () {
  const NODE_WIDTH = 170;
  const NODE_HEIGHT = 92;
  const NODE_GAP = 200;

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function orderedNodeIds(model) {
    const nodes = Array.isArray(model.nodes) ? model.nodes : [];
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const incoming = new Set((model.edges || []).map((edge) => edge[1]));
    const start = nodes.find((node) => !incoming.has(node.id));
    const result = [];
    let current = start?.id;
    while (current && byId.has(current) && !result.includes(current)) {
      result.push(current);
      const edge = (model.edges || []).find((item) => item[0] === current);
      current = edge?.[1];
    }
    return result.length === nodes.length ? result : nodes.map((node) => node.id);
  }

  function ensureUi(model) {
    model.ui = model.ui && typeof model.ui === "object" ? model.ui : {};
    model.ui.nodes = model.ui.nodes && typeof model.ui.nodes === "object" ? model.ui.nodes : {};
    const ids = new Set((model.nodes || []).map((node) => node.id));
    Object.keys(model.ui.nodes).forEach((id) => { if (!ids.has(id)) delete model.ui.nodes[id]; });
  }

  function mount(container, model, agentList = []) {
    ensureUi(model);
    const agents = Array.isArray(agentList) ? agentList : [];
    let selectedId = null;
    let drag = null;
    let positions = {};
    container.innerHTML = '<div class="workflow-canvas-layout"><div class="workflow-canvas-wrap"></div><aside class="workflow-node-panel"></aside></div>';
    const canvasWrap = container.querySelector(".workflow-canvas-wrap");
    const panel = container.querySelector(".workflow-node-panel");

    function positionFor(id, index) {
      const saved = model.ui.nodes[id];
      if (saved && Number.isFinite(Number(saved.x)) && Number.isFinite(Number(saved.y))) return { x: Number(saved.x), y: Number(saved.y) };
      return { x: 30 + index * NODE_GAP, y: 50 };
    }

    function renderPanel() {
      const node = (model.nodes || []).find((item) => item.id === selectedId);
      if (!node) {
        panel.innerHTML = '<p class="muted">Select a node to edit it.</p>';
        return;
      }
      const last = !(model.edges || []).some((edge) => edge[0] === node.id);
      panel.innerHTML = `
        <h2><code>${escapeHtml(node.id)}</code></h2>
        <label>Prompt<textarea data-canvas-field="prompt" rows="8">${escapeHtml(node.prompt)}</textarea></label>
        <label>Agent<select data-canvas-field="agent">${agents.map((agent) => `<option value="${escapeHtml(agent.id)}"${agent.id === node.agent ? " selected" : ""}>${escapeHtml(agent.name || agent.id)}</option>`).join("")}</select></label>
        <label>Gate<select data-canvas-field="gate"><option value="none"${node.gate === "none" ? " selected" : ""}>none</option><option value="approval"${node.gate === "approval" ? " selected" : ""}>approval</option></select></label>
        <button class="link-button" type="button" data-canvas-delete ${last && model.nodes.length > 1 ? "" : "disabled"}>Delete last node</button>`;
      panel.querySelectorAll("[data-canvas-field]").forEach((field) => field.addEventListener(field.dataset.canvasField === "prompt" ? "input" : "change", () => {
        node[field.dataset.canvasField] = field.value;
        if (field.dataset.canvasField !== "prompt") render();
      }));
      panel.querySelector("[data-canvas-delete]")?.addEventListener("click", () => {
        if (!last || model.nodes.length <= 1) return;
        model.nodes = model.nodes.filter((item) => item.id !== node.id);
        model.edges = model.edges.filter((edge) => edge[0] !== node.id && edge[1] !== node.id);
        delete model.ui.nodes[node.id];
        selectedId = null;
        render();
      });
    }

    function render() {
      ensureUi(model);
      const ids = orderedNodeIds(model);
      positions = Object.fromEntries(ids.map((id, index) => [id, positionFor(id, index)]));
      const width = Math.max(460, ...Object.values(positions).map((position) => position.x + NODE_WIDTH + 30));
      const height = Math.max(190, ...Object.values(positions).map((position) => position.y + NODE_HEIGHT + 40));
      const edges = (model.edges || []).map((edge) => {
        const from = positions[edge[0]];
        const to = positions[edge[1]];
        if (!from || !to) return "";
        const y1 = from.y + NODE_HEIGHT / 2;
        const y2 = to.y + NODE_HEIGHT / 2;
        return `<path class="workflow-canvas-edge" d="M ${from.x + NODE_WIDTH} ${y1} L ${to.x} ${y2}" marker-end="url(#workflow-canvas-arrow)"></path>`;
      }).join("");
      const nodes = ids.map((id) => {
        const node = model.nodes.find((item) => item.id === id);
        const position = positions[id];
        return `<g class="workflow-canvas-node${id === selectedId ? " selected" : ""}" data-canvas-node="${escapeHtml(id)}" transform="translate(${position.x} ${position.y})">
          <rect width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="6"></rect>
          <text x="12" y="24" class="workflow-canvas-node-id">${escapeHtml(node.id)}</text>
          <text x="12" y="48" class="workflow-canvas-agent">${escapeHtml(node.agent)}</text>
          ${node.gate === "approval" ? '<rect x="12" y="60" width="72" height="20" rx="4" class="workflow-canvas-gate-bg"></rect><text x="18" y="74" class="workflow-canvas-gate">approval</text>' : ""}
        </g>`;
      }).join("");
      canvasWrap.innerHTML = `<div class="hub-actions"><button class="link-button" type="button" data-canvas-add>Add node</button></div><svg class="workflow-canvas" viewBox="0 0 ${width} ${height}" role="img" aria-label="Workflow editor"><defs><marker id="workflow-canvas-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"></path></marker></defs>${edges}${nodes}</svg>`;
      canvasWrap.querySelector("[data-canvas-add]").addEventListener("click", () => {
        const idsNow = new Set(model.nodes.map((node) => node.id));
        let number = 1;
        while (idsNow.has(`node-${number}`)) number += 1;
        const lastId = orderedNodeIds(model).at(-1);
        const lastPosition = lastId ? positions[lastId] : { x: 30, y: 50 };
        const newId = `node-${number}`;
        model.nodes.push({ id: newId, agent: agents[0]?.id || "", prompt: lastId ? `{{${lastId}_output}}` : "{{objective}}", gate: "none" });
        if (lastId) model.edges.push([lastId, newId]);
        model.ui.nodes[newId] = { x: lastPosition.x + NODE_GAP, y: lastPosition.y };
        selectedId = newId;
        render();
      });
      canvasWrap.querySelectorAll("[data-canvas-node]").forEach((element) => element.addEventListener("pointerdown", (event) => {
        const id = element.dataset.canvasNode;
        drag = { id, x: event.clientX, y: event.clientY, original: { ...positions[id] }, moved: false };
      }));
      renderPanel();
    }

    window.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const x = Math.max(0, drag.original.x + event.clientX - drag.x);
      const y = Math.max(0, drag.original.y + event.clientY - drag.y);
      drag.moved = drag.moved || x !== drag.original.x || y !== drag.original.y;
      model.ui.nodes[drag.id] = { x, y };
      render();
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      if (!drag.moved) {
        selectedId = drag.id;
        render();
      }
      drag = null;
    });
    render();
    return { getModel: () => model };
  }

  window.HubCanvas = { mount };
})();
