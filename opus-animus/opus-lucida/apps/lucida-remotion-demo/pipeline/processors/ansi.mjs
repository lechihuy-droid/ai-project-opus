const ANSI_PATTERN = /\u001b\[([0-9;]*)m/g;
const COLORS = {
  30: "#000000",
  31: "#cd3131",
  32: "#0dbc79",
  33: "#e5e510",
  34: "#2472c8",
  35: "#bc3fbc",
  36: "#11a8cd",
  37: "#e5e5e5",
  90: "#666666",
  91: "#f14c4c",
  92: "#23d18b",
  93: "#f5f543",
  94: "#3b8eea",
  95: "#d670d6",
  96: "#29b8db",
  97: "#ffffff",
};

export const parseAnsi = (input) => {
  const textParts = [];
  const styleRuns = [];
  let sourceIndex = 0;
  let outputIndex = 0;
  let active = {};
  let match;

  const append = (segment) => {
    if (!segment) return;
    textParts.push(segment);
    const end = outputIndex + segment.length;
    if (Object.keys(active).length > 0)
      styleRuns.push({ start: outputIndex, end, ...active });
    outputIndex = end;
  };

  while ((match = ANSI_PATTERN.exec(input)) !== null) {
    append(input.slice(sourceIndex, match.index));
    const codes = (match[1] || "0").split(";").map(Number);
    for (const code of codes) {
      if (code === 0) active = {};
      else if (code === 1) active = { ...active, bold: true };
      else if (code === 3) active = { ...active, italic: true };
      else if (code === 4) active = { ...active, underline: true };
      else if (code === 22) {
        const { bold, ...rest } = active;
        active = rest;
      } else if (code === 23) {
        const { italic, ...rest } = active;
        active = rest;
      } else if (code === 24) {
        const { underline, ...rest } = active;
        active = rest;
      } else if (code === 39) {
        const { color, ...rest } = active;
        active = rest;
      } else if (COLORS[code]) active = { ...active, color: COLORS[code] };
    }
    sourceIndex = ANSI_PATTERN.lastIndex;
  }
  append(input.slice(sourceIndex));
  return { text: textParts.join(""), styleRuns };
};
