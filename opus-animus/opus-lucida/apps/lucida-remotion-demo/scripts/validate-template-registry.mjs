import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const catalogPath = path.resolve(appRoot, "../remotion-templates/template-catalog.json");
const videoMapPath = path.resolve(appRoot, "video-map.json");
const registryPath = path.resolve(appRoot, "src/templateRegistry.tsx");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const catalog = readJson(catalogPath);
const videoMap = readJson(videoMapPath);
const registrySource = fs.readFileSync(registryPath, "utf8");
const supportedTemplateIds = new Set(
  [...registrySource.matchAll(/^\s+"([^"]+)":\s+[A-Za-z0-9_]+Adapter,/gm)].map(
    (match) => match[1],
  ),
);

const errors = [];
const warnings = [];
const catalogDir = path.dirname(catalogPath);
const templates = catalog.templates ?? [];
const localAdapters = catalog.localAdapters ?? [];
const allTemplateEntries = [...templates, ...localAdapters];
const knownTemplateIds = new Set();

for (const template of templates) {
  const sourcePath = path.resolve(catalogDir, template.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    errors.push(`Missing template source for ${template.id}: ${template.sourceFile}`);
  }
}

for (const adapter of localAdapters) {
  const sourcePath = path.resolve(catalogDir, adapter.sourceFile);
  if (!fs.existsSync(sourcePath)) {
    errors.push(`Missing local adapter source for ${adapter.id}: ${adapter.sourceFile}`);
  }
}

for (const entry of allTemplateEntries) {
  if (knownTemplateIds.has(entry.id)) {
    errors.push(`Duplicate template id in catalog: ${entry.id}`);
  }
  knownTemplateIds.add(entry.id);
}

const hasContentField = (scene, field) => {
  const content = scene.content ?? {};
  const value = content[field];

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (field === "title") {
    return Boolean(content.title || scene.headline);
  }

  if (field === "text") {
    return Boolean(content.text || scene.subtitle?.text);
  }

  return value !== undefined && value !== null;
};

const templateById = new Map(allTemplateEntries.map((entry) => [entry.id, entry]));
let durationSec = 0;
const renderedTemplates = [];

for (const [index, scene] of (videoMap.scenes ?? []).entries()) {
  durationSec += scene.durationSec ?? 0;
  renderedTemplates.push({
    index,
    id: scene.id,
    templateId: scene.templateId,
    templateRole: scene.templateRole,
    backgroundEffect: scene.backgroundEffect ?? null,
    transitionIn: scene.transitionIn ?? null,
    transitionOut: scene.transitionOut ?? null,
  });

  if (!knownTemplateIds.has(scene.templateId)) {
    errors.push(`Scene ${scene.id} uses unknown templateId: ${scene.templateId}`);
    continue;
  }

  if (!supportedTemplateIds.has(scene.templateId)) {
    errors.push(`Scene ${scene.id} uses cataloged but unsupported adapter: ${scene.templateId}`);
  }

  const template = templateById.get(scene.templateId);
  for (const requiredField of template?.requiredContent ?? []) {
    if (!hasContentField(scene, requiredField)) {
      errors.push(
        `Scene ${scene.id} missing required content field "${requiredField}" for ${scene.templateId}`,
      );
    }
  }

  if (scene.templateId !== "diagram" && (!scene.templateId || scene.templateId === "node_graph")) {
    errors.push(`Scene ${scene.id} would risk diagram fallback without explicit templateId`);
  }
}

if (Math.abs(durationSec - videoMap.video.durationSec) > 0.01) {
  errors.push(
    `Video duration mismatch: scenes=${durationSec}, video.durationSec=${videoMap.video.durationSec}`,
  );
}

const distinctSceneTemplates = new Set((videoMap.scenes ?? []).map((scene) => scene.templateId));
if (distinctSceneTemplates.size < 4) {
  warnings.push(`Expected at least 4 visually distinct scene templates, got ${distinctSceneTemplates.size}`);
}

const outDir = path.resolve(appRoot, "output/render");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.resolve(outDir, "render-report.json"),
  JSON.stringify(
    {
      ok: errors.length === 0,
      generatedAt: new Date().toISOString(),
      catalogPath: path.relative(appRoot, catalogPath),
      videoMapPath: path.relative(appRoot, videoMapPath),
      sceneCount: videoMap.scenes?.length ?? 0,
      durationSec,
      renderedTemplates,
      warnings,
      errors,
    },
    null,
    2,
  ),
);

if (warnings.length > 0) {
  for (const warning of warnings) {
    console.warn(`WARN: ${warning}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(`Template registry validation passed: ${videoMap.scenes.length} scenes, ${templates.length} catalog templates.`);
