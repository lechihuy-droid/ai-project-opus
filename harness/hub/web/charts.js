(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function barChart(target, rows, labelKey, valueKey) {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) return;
    const data = rows.filter((row) => Number(row[valueKey]) > 0);
    if (!data.length) {
      element.innerHTML = '<p class="muted">No chart data.</p>';
      return;
    }

    const width = 720;
    const rowHeight = 34;
    const labelWidth = 180;
    const valueWidth = 120;
    const plotWidth = width - labelWidth - valueWidth - 24;
    const height = data.length * rowHeight + 12;
    const max = Math.max(...data.map((row) => Number(row[valueKey]) || 0));
    const bars = data.map((row, index) => {
      const value = Number(row[valueKey]) || 0;
      const barWidth = Math.max(2, Math.round((value / max) * plotWidth));
      const y = 8 + index * rowHeight;
      const label = escapeHtml(row[labelKey]);
      const display = escapeHtml(value.toLocaleString());
      return `
        <g>
          <text x="0" y="${y + 20}" class="chart-label">${label}</text>
          <rect x="${labelWidth}" y="${y + 4}" width="${barWidth}" height="20" rx="3" class="chart-bar"></rect>
          <text x="${labelWidth + plotWidth + 12}" y="${y + 20}" class="chart-value">${display}</text>
        </g>
      `;
    }).join("");

    element.innerHTML = `
      <svg class="hub-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Token bar chart">
        ${bars}
      </svg>
    `;
  }

  function gauge(value, max) {
    const safeMax = max > 0 ? max : 1;
    const ratio = Math.max(0, Math.min(1.15, value / safeMax));
    const startAngle = Math.PI;
    const endAngle = startAngle + Math.PI * Math.min(ratio, 1);
    const cx = 50;
    const cy = 50;
    const r = 40;
    const arc = (a) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    let state = "ok";
    if (ratio > 1) state = "danger";
    else if (ratio > 0.8) state = "warn";
    const track = `M ${arc(startAngle)} A ${r} ${r} 0 1 1 ${arc(startAngle + Math.PI)}`;
    const fill = `M ${arc(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arc(endAngle)}`;
    return `
      <svg class="hub-gauge state-${state}" viewBox="0 0 100 62" role="img" aria-label="Usage gauge">
        <path d="${track}" class="gauge-track" fill="none" stroke-width="8" stroke-linecap="round"></path>
        <path d="${fill}" class="gauge-fill" fill="none" stroke-width="8" stroke-linecap="round"></path>
        <text x="50" y="48" class="gauge-text" text-anchor="middle">${Math.round(value)}</text>
      </svg>`;
  }

  function counter(value) {
    const text = String(Math.max(0, Math.round(value)));
    return `<span class="hub-counter" aria-label="${text}">${text}</span>`;
  }

  window.HubCharts = { barChart, gauge, counter };
})();
