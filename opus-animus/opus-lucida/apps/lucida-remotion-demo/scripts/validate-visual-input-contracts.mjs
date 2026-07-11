import fs from "node:fs";
import path from "node:path";
const read = (p) =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), p), "utf8"));
const validateFlow = (v) => {
  const e = [];
  if (v.schemaVersion !== "visual-flow/v1") e.push("invalid schemaVersion");
  if (!v.projectId?.trim()) e.push("projectId required");
  if (!Number.isInteger(v.fps) || v.fps < 1 || v.fps > 120)
    e.push("invalid fps");
  if (!v.themeId?.trim()) e.push("themeId required");
  if (!v.sources?.length) e.push("sources required");
  const ids = new Set();
  for (const s of v.sources ?? []) {
    if (!s.id || ids.has(s.id)) e.push("source ids must be unique");
    ids.add(s.id);
    if (s.type === "command" && !s.command) e.push("command required");
    if (s.type === "asciicast" && !s.path) e.push("asciicast path required");
    if (s.captureInputEvents) e.push("sensitive input capture enabled");
  }
  const m = v.mapping ?? {};
  if (!m.allowedFamilies?.includes(m.defaultFamily))
    e.push("defaultFamily not allowed");
  if (!m.allowedPresets?.includes(m.defaultPreset))
    e.push("defaultPreset not allowed");
  if (!(m.minSceneSeconds > 0 && m.maxSceneSeconds >= m.minSceneSeconds))
    e.push("invalid duration bounds");
  if (!Number.isInteger(m.maxItemsPerScene) || m.maxItemsPerScene < 1)
    e.push("invalid maxItemsPerScene");
  return e;
};
const validateEvent = (v) => {
  const e = [];
  if (!v.id || !v.sourceId || !v.sourceRef || !v.kind)
    e.push("event identity required");
  if (v.frame !== undefined && (!Number.isInteger(v.frame) || v.frame < 0))
    e.push("invalid frame");
  if (
    v.provenance?.sourceId !== v.sourceId ||
    v.provenance?.sourceRef !== v.sourceRef
  )
    e.push("provenance mismatch");
  if (!v.provenance?.sourceChecksum?.startsWith("sha256:"))
    e.push("invalid checksum");
  return e;
};
const validateScene = (v) => {
  const e = [];
  if (!v.sceneId || !v.visualFamily || !v.preset || !v.themeId)
    e.push("scene identity required");
  if (!Number.isInteger(v.durationInFrames) || v.durationInFrames < 1)
    e.push("invalid duration");
  if (!v.blocks?.length) e.push("blocks required");
  let last = -1;
  for (const b of v.blocks ?? []) {
    if (!Number.isInteger(b.at) || b.at < 0 || b.at >= v.durationInFrames)
      e.push("block outside scene");
    if (b.at < last) e.push("blocks not monotonic");
    if (!b.sourceEventIds?.length) e.push("block provenance required");
    last = b.at;
  }
  return e;
};
const errors = [
  ...validateFlow(read("pipeline/fixtures/valid-flow.json")),
  ...validateEvent(read("pipeline/fixtures/valid-event.json")),
  ...validateScene(read("pipeline/fixtures/valid-scene.json")),
];
if (validateFlow(read("pipeline/fixtures/invalid-flow.json")).length === 0)
  errors.push("invalid fixture passed");
for (const p of [
  "pipeline/schemas/visual-flow.schema.json",
  "pipeline/schemas/normalized-event.schema.json",
  "pipeline/schemas/visual-scene.schema.json",
]) {
  if (read(p).$schema !== "https://json-schema.org/draft/2020-12/schema")
    errors.push(`invalid schema dialect: ${p}`);
}
if (errors.length) {
  errors.forEach((e) => console.error(`ERROR: ${e}`));
  process.exit(1);
}
console.log(
  "Visual input contracts passed: 3 valid fixtures and 1 invalid fixture.",
);
