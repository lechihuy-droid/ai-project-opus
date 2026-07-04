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

  window.HubCharts = { barChart };
})();
