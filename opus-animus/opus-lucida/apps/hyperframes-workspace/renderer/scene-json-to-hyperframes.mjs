import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const supportedLayerKinds = new Set([
  "text",
  "media",
  "shape",
  "code",
  "browser",
  "terminal",
  "chart",
  "timeline",
]);

const palette = {
  background: "#0b0f14",
  foreground: "#f5f7fb",
  panel: "rgba(14,20,28,0.86)",
  border: "rgba(255,255,255,0.12)",
  accent: "#58a6ff",
  accentAlt: "#3ddc97",
};

main().catch((error) => {
  console.error(`[scene-json] ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    printHelp();
    return;
  }

  const inputPath = path.resolve(args.input);
  const scene = JSON.parse(await readFile(inputPath, "utf8"));
  const diagnostics = validateScene(scene);
  if (diagnostics.length > 0) {
    throw new Error(`invalid scene JSON:\n${diagnostics.map((item) => `- ${item}`).join("\n")}`);
  }

  const projectId = slug(scene.metadata.id);
  const outputDir = path.resolve(args.output || path.join("generated", projectId));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "index.html"), renderDocument(scene), "utf8");
  await writeFile(path.join(outputDir, "meta.json"), `${JSON.stringify(renderMeta(scene), null, 2)}\n`, "utf8");

  console.log(`[scene-json] wrote ${outputDir}`);
  console.log(`[scene-json] duration=${scene.duration}s size=${scene.metadata.width}x${scene.metadata.height} fps=${scene.metadata.fps}`);
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (item === "--help" || item === "-h") parsed.help = true;
    else if (item === "--input" || item === "-i") parsed.input = args[++index];
    else if (item === "--output" || item === "-o") parsed.output = args[++index];
    else if (!parsed.input) parsed.input = item;
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage:
  node renderer/scene-json-to-hyperframes.mjs --input scene-schema/examples/ai-engine-intro.json --output generated/ai-engine-intro

Creates a HyperFrames project directory with index.html and meta.json.`);
}

function validateScene(scene) {
  const errors = [];
  if (!scene || typeof scene !== "object") return ["root must be an object"];
  if (!scene.metadata || typeof scene.metadata !== "object") errors.push("metadata is required");
  if (!Array.isArray(scene.scenes) || scene.scenes.length === 0) errors.push("scenes must contain at least one scene");
  if (!isPositiveNumber(scene.duration)) errors.push("duration must be a positive number");

  const metadata = scene.metadata || {};
  for (const key of ["id", "title"]) {
    if (!isNonEmptyString(metadata[key])) errors.push(`metadata.${key} is required`);
  }
  if (!Number.isInteger(metadata.width) || metadata.width <= 0) errors.push("metadata.width must be a positive integer");
  if (!Number.isInteger(metadata.height) || metadata.height <= 0) errors.push("metadata.height must be a positive integer");
  if (!isPositiveNumber(metadata.fps)) errors.push("metadata.fps must be a positive number");

  for (const [index, item] of (scene.scenes || []).entries()) {
    const prefix = `scenes[${index}]`;
    if (!isNonEmptyString(item.id)) errors.push(`${prefix}.id is required`);
    if (!isNumber(item.start) || item.start < 0) errors.push(`${prefix}.start must be >= 0`);
    if (!isPositiveNumber(item.duration)) errors.push(`${prefix}.duration must be positive`);
    if (!item.composition || typeof item.composition !== "object") errors.push(`${prefix}.composition is required`);

    for (const [layerIndex, layer] of (item.layers || []).entries()) {
      const layerPrefix = `${prefix}.layers[${layerIndex}]`;
      if (!isNonEmptyString(layer.id)) errors.push(`${layerPrefix}.id is required`);
      if (!supportedLayerKinds.has(layer.kind)) errors.push(`${layerPrefix}.kind is unsupported: ${layer.kind}`);
    }
  }
  return errors;
}

function renderDocument(scene) {
  const width = scene.metadata.width;
  const height = scene.metadata.height;
  const background = scene.metadata.background || palette.background;
  const body = scene.scenes.map((item) => renderScene(item, scene)).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(scene.metadata.title)}</title>
    <style>
${indent(renderCss(scene, width, height, background), 6)}
    </style>
  </head>
  <body>
    <div
      id="stage"
      data-composition-id="${escapeAttr(scene.metadata.id)}"
      data-start="0"
      data-duration="${formatNumber(scene.duration)}"
      data-width="${width}"
      data-height="${height}"
      data-no-timeline
    >
${indent(body, 6)}
    </div>
  </body>
</html>
`;
}

function renderCss(scene, width, height, background) {
  const animationCss = renderAnimationCss(scene);
  const layerPresetCss = renderLayerPresetCss(scene);
  return `:root {
  color-scheme: dark;
}
html, body {
  margin: 0;
  width: ${width}px;
  height: ${height}px;
  overflow: hidden;
  background: ${background};
  font-family: Inter, Segoe UI, Arial, sans-serif;
}
#stage {
  position: relative;
  width: ${width}px;
  height: ${height}px;
  color: ${palette.foreground};
  background: ${background};
}
.scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.layer {
  position: absolute;
  box-sizing: border-box;
}
.text-layer {
  color: var(--layer-color, ${palette.foreground});
  font-weight: var(--layer-font-weight, 700);
  font-size: var(--layer-font-size, 64px);
  line-height: var(--layer-line-height, 1.08);
  white-space: pre-wrap;
}
.shape-layer {
  background: var(--layer-fill, ${palette.accent});
  border: var(--layer-border, 0 solid transparent);
  border-radius: var(--layer-radius, 0);
}
.media-layer {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.panel-layer {
  border: 1px solid ${palette.border};
  border-radius: 12px;
  background: ${palette.panel};
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.34);
}
.terminal-layer, .code-layer {
  padding: 28px;
  font-family: "JetBrains Mono", Consolas, monospace;
  font-size: var(--layer-font-size, 26px);
  line-height: 1.5;
  white-space: pre-wrap;
}
.browser-layer {
  background: #f7f9fc;
  color: #17202a;
}
.browser-bar {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  font-size: 14px;
  color: rgba(23,32,42,0.68);
}
.browser-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d0d7de;
}
.browser-content {
  padding: 32px;
  font-size: var(--layer-font-size, 34px);
  line-height: 1.22;
  white-space: pre-line;
}
.timeline-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.18);
}
.timeline-node {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: ${palette.accentAlt};
  box-shadow: 0 0 0 8px rgba(61,220,151,0.12);
}
${layerPresetCss}
${animationCss}`;
}

function renderScene(sceneItem, root) {
  const layerHtml = (sceneItem.layers || []).map((layer) => renderLayer(layer, sceneItem, root)).join("\n");
  const customHtml = sceneItem.composition?.html ? sceneItem.composition.html : "";
  return `<section class="scene" id="${escapeAttr(sceneItem.id)}" data-start="${formatNumber(sceneItem.start)}" data-duration="${formatNumber(sceneItem.duration)}">
  ${customHtml}
${indent(layerHtml, 2)}
</section>`;
}

function renderLayer(layer, sceneItem) {
  const style = renderLayerStyle(layer);
  const dataAttrs = `id="${escapeAttr(layer.id)}" data-start="${formatNumber(layer.start ?? sceneItem.start)}" data-duration="${formatNumber(layer.duration ?? sceneItem.duration)}"`;
  const className = `layer ${layer.kind}-layer clip`;

  if (layer.kind === "media") return renderMediaLayer(layer, className, dataAttrs, style);
  if (layer.kind === "terminal") return `<div class="${className} panel-layer" ${dataAttrs} style="${style}">${renderTerminalText(layer)}</div>`;
  if (layer.kind === "code") return `<pre class="${className} panel-layer" ${dataAttrs} style="${style}"><code>${escapeHtml(layer.text || "")}</code></pre>`;
  if (layer.kind === "browser") {
    return `<div class="${className} panel-layer" ${dataAttrs} style="${style}">
  <div class="browser-bar"><span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span><span>${escapeHtml(layer.url || "https://example.local")}</span></div>
  <div class="browser-content">${escapeHtml(layer.text || "")}</div>
</div>`;
  }
  if (layer.kind === "timeline") return renderTimelineLayer(layer, className, dataAttrs, style);
  if (layer.kind === "shape" || layer.kind === "chart") return `<div class="${className}" ${dataAttrs} style="${style}"></div>`;
  return `<div class="${className}" ${dataAttrs} style="${style}">${escapeHtml(layer.text || "")}</div>`;
}

function renderMediaLayer(layer, className, dataAttrs, style) {
  const src = escapeAttr(layer.src || "");
  if (layer.mediaType === "video" || /\.(mp4|webm|mov)$/i.test(layer.src || "")) {
    return `<video class="${className}" ${dataAttrs} style="${style}" src="${src}" muted playsinline ${layer.loop ? "loop" : ""}></video>`;
  }
  return `<img class="${className}" ${dataAttrs} style="${style}" src="${src}" alt="${escapeAttr(layer.alt || "")}" />`;
}

function renderTimelineLayer(layer, className, dataAttrs, style) {
  const nodes = Array.isArray(layer.items) ? layer.items : [];
  const nodeHtml = nodes
    .map((item, index) => {
      const left = nodes.length > 1 ? (index / (nodes.length - 1)) * 100 : 50;
      return `<span class="timeline-node" style="left: ${formatNumber(left)}%" title="${escapeAttr(item.label || "")}"></span>`;
    })
    .join("");
  return `<div class="${className}" ${dataAttrs} style="${style}">
  <div class="timeline-track"></div>
  ${nodeHtml}
</div>`;
}

function renderLayerStyle(layer) {
  const entries = [];
  entries.push(`left: ${formatCssLength(layer.x ?? 0)}`);
  entries.push(`top: ${formatCssLength(layer.y ?? 0)}`);
  if (layer.width != null) entries.push(`width: ${formatCssLength(layer.width)}`);
  if (layer.height != null) entries.push(`height: ${formatCssLength(layer.height)}`);
  if (layer.opacity != null) entries.push(`opacity: ${formatNumber(layer.opacity)}`);
  if (layer.zIndex != null) entries.push(`z-index: ${Number(layer.zIndex)}`);
  if (layer.color) entries.push(`--layer-color: ${layer.color}`);
  if (layer.fill) entries.push(`--layer-fill: ${layer.fill}`);
  if (layer.border) entries.push(`--layer-border: ${layer.border}`);
  if (layer.radius != null) entries.push(`--layer-radius: ${formatCssLength(layer.radius)}`);
  if (layer.fontSize != null) entries.push(`--layer-font-size: ${formatCssLength(layer.fontSize)}`);
  if (layer.fontWeight != null) entries.push(`--layer-font-weight: ${layer.fontWeight}`);
  if (layer.lineHeight != null) entries.push(`--layer-line-height: ${layer.lineHeight}`);
  if (layer.align) entries.push(`text-align: ${layer.align}`);
  if (layer.transform) entries.push(`transform: ${layer.transform}`);
  return entries.join("; ");
}

function renderAnimationCss(root) {
  const css = [];
  for (const sceneItem of root.scenes) {
    for (const animation of sceneItem.animation || []) {
      const id = cssIdentifier(animation.target);
      const name = `anim-${id}-${cssIdentifier(animation.property)}`;
      const delay = animation.start ?? 0;
      css.push(`#${id} { animation: ${name} ${formatNumber(animation.duration)}s ${animation.ease || "ease"} ${formatNumber(delay)}s both; }`);
      css.push(`@keyframes ${name} {
  from { ${cssProperty(animation.property, animation.from)}; }
  to { ${cssProperty(animation.property, animation.to)}; }
}`);
    }
  }
  return css.join("\n");
}

function renderLayerPresetCss(root) {
  const css = [];
  for (const sceneItem of root.scenes) {
    for (const layer of sceneItem.layers || []) {
      const animations = [];
      if (layer.enter) {
        const enter = normalizeMotion(layer.enter);
        const delay = enter.delay || 0;
        const name = `enter-${cssIdentifier(layer.id)}-${cssIdentifier(enter.preset)}`;
        animations.push(`${name} ${formatNumber(enter.duration)}s ${enter.ease} ${formatNumber(delay)}s both`);
        css.push(renderPresetKeyframes(name, enter.preset, layer));
      }
      if (layer.emphasis) {
        const emphasis = normalizeMotion(layer.emphasis, { duration: 1.2, ease: "ease-in-out", delay: 0 });
        const delay = emphasis.delay || 0;
        const name = `emphasis-${cssIdentifier(layer.id)}-${cssIdentifier(emphasis.preset)}`;
        animations.push(`${name} ${formatNumber(emphasis.duration)}s ${emphasis.ease} ${formatNumber(delay)}s ${emphasis.iterations || 1} forwards`);
        css.push(renderPresetKeyframes(name, emphasis.preset, layer));
      }
      if (animations.length > 0) {
        css.push(`#${cssIdentifier(layer.id)} { opacity: ${layer.enter ? 0 : formatNumber(layer.opacity ?? 1)}; animation: ${animations.join(", ")}; }`);
      }
    }
  }
  return css.join("\n");
}

function normalizeMotion(value, defaults = {}) {
  if (typeof value === "string") {
    return {
      preset: value,
      delay: defaults.delay ?? 0,
      duration: defaults.duration ?? 0.75,
      ease: defaults.ease ?? "cubic-bezier(0.22, 1, 0.36, 1)",
    };
  }
  return {
    preset: value.preset || "fade-up",
    delay: value.delay ?? defaults.delay ?? 0,
    duration: value.duration ?? defaults.duration ?? 0.75,
    ease: value.ease || defaults.ease || "cubic-bezier(0.22, 1, 0.36, 1)",
    iterations: value.iterations,
  };
}

function renderPresetKeyframes(name, preset, layer) {
  if (preset === "fade") {
    return `@keyframes ${name} {
  from { opacity: 0; }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; }
}`;
  }
  if (preset === "fade-down") {
    return `@keyframes ${name} {
  from { opacity: 0; transform: translateY(-32px); }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: translateY(0); }
}`;
  }
  if (preset === "slide-left") {
    return `@keyframes ${name} {
  from { opacity: 0; transform: translateX(72px); }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: translateX(0); }
}`;
  }
  if (preset === "slide-right") {
    return `@keyframes ${name} {
  from { opacity: 0; transform: translateX(-72px); }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: translateX(0); }
}`;
  }
  if (preset === "scale-in") {
    return `@keyframes ${name} {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: scale(1); }
}`;
  }
  if (preset === "draw-x") {
    return `@keyframes ${name} {
  from { opacity: 1; transform: scaleX(0); transform-origin: left center; }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: scaleX(1); transform-origin: left center; }
}`;
  }
  if (preset === "pulse") {
    return `@keyframes ${name} {
  0%, 100% { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: scale(1); }
  50% { opacity: ${formatNumber(Math.max(0.55, (layer.opacity ?? 1) * 0.78))}; transform: scale(1.035); }
}`;
  }
  if (preset === "float") {
    return `@keyframes ${name} {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-14px); }
}`;
  }
  if (preset === "glow") {
    return `@keyframes ${name} {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(45, 212, 191, 0)); }
  50% { filter: drop-shadow(0 0 24px rgba(45, 212, 191, 0.55)); }
}`;
  }
  if (preset === "scan") {
    return `@keyframes ${name} {
  from { transform: translateX(-36px); opacity: 0.35; }
  50% { opacity: 1; }
  to { transform: translateX(36px); opacity: 0.35; }
}`;
  }
  if (preset === "wipe-up") {
    return `@keyframes ${name} {
  from { opacity: 0; clip-path: inset(100% 0 0 0); transform: translateY(18px); }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; clip-path: inset(0 0 0 0); transform: translateY(0); }
}`;
  }
  return `@keyframes ${name} {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: ${formatNumber(layer.opacity ?? 1)}; transform: translateY(0); }
}`;
}

function cssProperty(property, value) {
  if (property === "x") return `transform: translateX(${formatCssLength(value)})`;
  if (property === "y") return `transform: translateY(${formatCssLength(value)})`;
  if (property === "scale") return `transform: scale(${Number(value)})`;
  if (property === "rotate") return `transform: rotate(${formatNumber(value)}deg)`;
  if (property === "opacity") return `opacity: ${formatNumber(value)}`;
  if (property === "color") return `color: ${value}`;
  if (property === "background") return `background: ${value}`;
  return `${property}: ${value}`;
}

function renderMeta(scene) {
  return {
    id: scene.metadata.id,
    title: scene.metadata.title,
    duration: scene.duration,
    fps: scene.metadata.fps,
    width: scene.metadata.width,
    height: scene.metadata.height,
    assets: scene.assets || [],
    source: "scene-json-to-hyperframes",
  };
}

function renderTerminalText(layer) {
  const lines = Array.isArray(layer.lines) ? layer.lines : String(layer.text || "").split("\n");
  return lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value) {
  return isNumber(value) && value > 0;
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "scene";
}

function cssIdentifier(value) {
  return slug(value).replace(/^-?[0-9]/, "x$&");
}

function formatNumber(value) {
  return Number(value).toFixed(4).replace(/\.?0+$/, "");
}

function formatCssLength(value) {
  if (typeof value === "string") return value;
  return `${formatNumber(value)}px`;
}

function percent(value) {
  return Math.max(0, Math.min(100, value * 100)).toFixed(2);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function indent(value, spaces) {
  const pad = " ".repeat(spaces);
  return String(value)
    .split("\n")
    .map((line) => (line.length ? `${pad}${line}` : line))
    .join("\n");
}
