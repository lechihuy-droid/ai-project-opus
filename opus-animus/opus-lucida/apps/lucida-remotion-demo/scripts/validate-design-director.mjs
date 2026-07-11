import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(appRoot, relativePath), "utf8"));

const visualLibrary = readJson("design/visual-library/index.json");
const motionLibrary = readJson("design/motion-library/index.json");
const selectionRules = readJson("design/directors/selection-rules.json");
const catalog = readJson("../remotion-templates/template-catalog.json");

const errors = [];
const catalogIds = new Set([
  ...(catalog.templates ?? []).map((template) => template.id),
  ...(catalog.localAdapters ?? []).map((template) => template.id),
]);
const familyIds = new Set((visualLibrary.families ?? []).map((family) => family.id));
const motionIds = new Set((motionLibrary.presets ?? []).map((preset) => preset.id));

for (const family of visualLibrary.families ?? []) {
  for (const templateId of family.preferredTemplates ?? []) {
    if (!catalogIds.has(templateId)) {
      errors.push(`Visual family ${family.id} references unknown templateId: ${templateId}`);
    }
  }
}

for (const preset of motionLibrary.presets ?? []) {
  for (const familyId of preset.bestFor ?? []) {
    if (!familyIds.has(familyId)) {
      errors.push(`Motion preset ${preset.id} references unknown visual family: ${familyId}`);
    }
  }
  if (!motionIds.has(preset.id)) {
    errors.push(`Motion preset missing from motion id set: ${preset.id}`);
  }
}

for (const [intent, families] of Object.entries(selectionRules.intentToFamily ?? {})) {
  if (!Array.isArray(families) || families.length === 0) {
    errors.push(`Intent ${intent} has no visual family candidates`);
    continue;
  }
  for (const familyId of families) {
    if (!familyIds.has(familyId)) {
      errors.push(`Intent ${intent} references unknown visual family: ${familyId}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(
  `Design director validation passed: ${familyIds.size} visual families, ${motionIds.size} motion presets, ${catalogIds.size} catalog entries.`,
);
