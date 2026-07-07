/* diagram.js — self-contained SVG renderer (flowchart + sequence)
 * Usage: <div class="diagram" data-chart='{"type":"flow",...}'></div>
 * No dependencies. Works offline. Include after styles.css.
 */
(function () {
  'use strict';

  const C = {
    navy: '#051C2C', blue: '#0047AB', blueMid: '#2563EB',
    blueLight: '#E8F1FB', teal: '#00968A', red: '#C9002B',
    green: '#00875A', gray: '#6B7280', gray100: '#ECEEF1',
    gray200: '#D0D4DB', white: '#FFFFFF',
  };
  const FONT = 'Segoe UI,system-ui,sans-serif';

  /* ── SVG factory ─────────────────────────────────────── */
  function el(tag, attrs, ...children) {
    const ns = 'http://www.w3.org/2000/svg';
    const e = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    children.forEach(c =>
      e.appendChild(typeof c === 'string'
        ? document.createTextNode(c)
        : c)
    );
    return e;
  }

  function arrowMarker(id, color) {
    const m = el('marker', { id, markerWidth: '10', markerHeight: '7', refX: '9', refY: '3.5', orient: 'auto' });
    m.appendChild(el('polygon', { points: '0 0,10 3.5,0 7', fill: color }));
    return m;
  }

  /* ── Flowchart ───────────────────────────────────────── */
  function renderFlow(container, { nodes, edges }) {
    const NW = 144, NH = 44, GX = 56, GY = 52;

    // BFS level assignment
    const lvl = {};
    nodes.forEach(n => (lvl[n.id] = -1));
    const inDeg = {};
    nodes.forEach(n => (inDeg[n.id] = 0));
    edges.forEach(e => (inDeg[e.to] = (inDeg[e.to] || 0) + 1));

    const queue = nodes.filter(n => !inDeg[n.id]).map(n => ({ id: n.id, lv: 0 }));
    while (queue.length) {
      const { id, lv } = queue.shift();
      if (lvl[id] >= lv || lv >= nodes.length) continue; // lv cap: cycles must not loop forever
      lvl[id] = lv;
      edges.filter(e => e.from === id).forEach(e => queue.push({ id: e.to, lv: lv + 1 }));
    }
    nodes.forEach(n => { if (lvl[n.id] < 0) lvl[n.id] = 0; });

    const byLv = {};
    nodes.forEach(n => ((byLv[lvl[n.id]] = byLv[lvl[n.id]] || []).push(n)));
    const maxLv = Math.max(...Object.keys(byLv).map(Number));
    const maxCols = Math.max(...Object.values(byLv).map(a => a.length));

    const svgW = maxCols * (NW + GX) - GX + 80;
    const svgH = (maxLv + 1) * (NH + GY) - GY + 80;

    const pos = {};
    Object.entries(byLv).forEach(([lv, ns]) => {
      const rowW = ns.length * (NW + GX) - GX;
      const ox = (svgW - rowW) / 2;
      ns.forEach((n, i) => {
        pos[n.id] = { x: ox + i * (NW + GX) + NW / 2, y: +lv * (NH + GY) + 40 + NH / 2 };
      });
    });

    const root = el('svg', { width: svgW, height: svgH, xmlns: 'http://www.w3.org/2000/svg', style: 'display:block' });
    const defs = el('defs', {});
    defs.appendChild(arrowMarker('fa', C.gray));
    root.appendChild(defs);

    // Edges
    edges.forEach(({ from, to, label }) => {
      const f = pos[from], t = pos[to];
      if (!f || !t) return;
      const dy = t.y - f.y;
      const cy1 = f.y + NH / 2 + dy * 0.35, cy2 = t.y - NH / 2 - dy * 0.35;
      root.appendChild(el('path', {
        d: `M${f.x},${f.y + NH / 2} C${f.x},${cy1} ${t.x},${cy2} ${t.x},${t.y - NH / 2 - 7}`,
        fill: 'none', stroke: C.gray200, 'stroke-width': '1.5', 'marker-end': 'url(#fa)',
      }));
      if (label) {
        const lx = (f.x + t.x) / 2, ly = (f.y + t.y) / 2;
        root.appendChild(el('rect', { x: lx - 22, y: ly - 9, width: 44, height: 16, rx: 3, fill: C.white }));
        root.appendChild(el('text', { x: lx, y: ly + 3, 'text-anchor': 'middle', fill: C.gray, 'font-size': '10', 'font-family': FONT }, label));
      }
    });

    // Nodes
    nodes.forEach(n => {
      const p = pos[n.id];
      if (!p) return;
      const { x, y } = p;
      const shape = n.shape || 'rect';

      if (shape === 'terminal' || shape === 'oval') {
        root.appendChild(el('rect', { x: x - NW / 2, y: y - NH / 2, width: NW, height: NH, rx: NH / 2, fill: C.navy }));
        root.appendChild(el('text', { x, y: y + 4, 'text-anchor': 'middle', fill: C.white, 'font-size': '12', 'font-family': FONT, 'font-weight': '600' }, n.label));
      } else if (shape === 'diamond') {
        root.appendChild(el('polygon', {
          points: `${x},${y - NH / 2} ${x + NW / 2},${y} ${x},${y + NH / 2} ${x - NW / 2},${y}`,
          fill: C.blueLight, stroke: C.blue, 'stroke-width': '1.5',
        }));
        root.appendChild(el('text', { x, y: y + 4, 'text-anchor': 'middle', fill: C.navy, 'font-size': '11', 'font-family': FONT, 'font-weight': '600' }, n.label));
      } else {
        const fill = { process: C.blueLight, io: '#F0FDF4', default: C.blueLight };
        root.appendChild(el('rect', { x: x - NW / 2, y: y - NH / 2, width: NW, height: NH, rx: 4, fill: fill[shape] || fill.default, stroke: C.blue, 'stroke-width': '1.5' }));
        root.appendChild(el('text', { x, y: y + 4, 'text-anchor': 'middle', fill: C.navy, 'font-size': '12', 'font-family': FONT, 'font-weight': '600' }, n.label));
      }
    });

    container.appendChild(root);
  }

  /* ── Sequence diagram ────────────────────────────────── */
  function renderSequence(container, { actors, steps }) {
    const CW = 160, RH = 52, PX = 40, PT = 64;
    const W = actors.length * CW + PX * 2;
    const H = steps.length * RH + PT + 48;

    const root = el('svg', { width: W, height: H, xmlns: 'http://www.w3.org/2000/svg', style: 'display:block' });
    const defs = el('defs', {});
    defs.appendChild(arrowMarker('sa', C.blue));
    defs.appendChild(arrowMarker('sr', C.teal));
    root.appendChild(defs);

    const cx = i => PX + i * CW + CW / 2;

    // Actor boxes
    actors.forEach((a, i) => {
      const x = cx(i);
      root.appendChild(el('rect', { x: x - 60, y: 8, width: 120, height: 32, rx: 4, fill: C.navy }));
      root.appendChild(el('text', { x, y: 29, 'text-anchor': 'middle', fill: C.white, 'font-size': '12', 'font-family': FONT, 'font-weight': '600' }, a));
    });

    // Lifelines
    actors.forEach((_, i) => {
      root.appendChild(el('line', { x1: cx(i), y1: 40, x2: cx(i), y2: H - 16, stroke: C.gray200, 'stroke-width': '2', 'stroke-dasharray': '6,4' }));
    });

    // Steps
    steps.forEach((s, i) => {
      const fi = actors.indexOf(s.from);
      const ti = actors.indexOf(s.to);
      if (fi < 0 || ti < 0) return;
      const y = PT + i * RH + RH / 2;
      const x1 = cx(fi), x2 = cx(ti);
      const isReturn = !!s.return;
      const arrowColor = isReturn ? C.teal : C.blue;
      const markerId = isReturn ? 'url(#sr)' : 'url(#sa)';

      if (fi === ti) {
        root.appendChild(el('path', {
          d: `M${x1},${y} C${x1 + 50},${y} ${x1 + 50},${y + 28} ${x1},${y + 28}`,
          fill: 'none', stroke: arrowColor, 'stroke-width': '1.5', 'marker-end': markerId,
        }));
      } else {
        const dir = x2 > x1 ? -8 : 8;
        const dash = isReturn ? '5,3' : null;
        const lineAttrs = { x1, y1: y, x2: x2 + dir, y2: y, stroke: arrowColor, 'stroke-width': '1.5', 'marker-end': markerId };
        if (dash) lineAttrs['stroke-dasharray'] = dash;
        root.appendChild(el('line', lineAttrs));
      }

      const lx = fi === ti ? x1 + 28 : (x1 + x2) / 2;
      root.appendChild(el('rect', { x: lx - 44, y: y - 17, width: 88, height: 14, rx: 2, fill: C.white }));
      root.appendChild(el('text', { x: lx, y: y - 5, 'text-anchor': 'middle', fill: C.navy, 'font-size': '10', 'font-family': FONT, 'font-weight': '500' }, s.msg));
    });

    container.appendChild(root);
  }

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    document.querySelectorAll('.diagram[data-chart]').forEach(container => {
      try {
        const data = JSON.parse(container.dataset.chart);
        if (data.type === 'flow') renderFlow(container, data);
        else if (data.type === 'sequence') renderSequence(container, data);
        else container.textContent = `Unknown diagram type: ${data.type}`;
      } catch (e) {
        container.style.cssText = 'color:red;font-size:.85rem;padding:.5rem';
        container.textContent = 'Diagram error: ' + e.message;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
