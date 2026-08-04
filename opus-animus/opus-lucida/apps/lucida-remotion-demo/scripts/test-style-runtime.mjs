import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      resolveJsonModule: true,
      target: ts.ScriptTarget.ES2018,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

require.extensions[".tsx"] = require.extensions[".ts"];

const { createVideoInput } = require("../src/data.ts");
const { resolveStyleRuntimeChoice } = require("../src/styles/runtime/select.ts");
const {
  cinematicTypeSceneKey,
  editorialCollageSceneKey,
  paperNotebookSceneKey,
  timelineDocumentarySceneKey,
} = require("../src/styles/runtime/family-scene-keys.ts");

const fixturePath = path.join(
  appRoot,
  "pipeline",
  "fixtures",
  "styles",
  "runtime",
  "cases.json",
);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

const buildVideoMap = (testCase) => ({
  video: fixture.video,
  theme: fixture.theme,
  assets: testCase.assets,
  scenes: [testCase.scene],
});

for (const testCase of fixture.cases) {
  const input = createVideoInput(buildVideoMap(testCase));
  const scene = input.scenes[0];
  const firstChoice = resolveStyleRuntimeChoice({
    scene,
    assets: input.assets,
  });
  const secondChoice = resolveStyleRuntimeChoice({
    scene,
    assets: input.assets,
  });

  assert.deepEqual(
    secondChoice,
    firstChoice,
    `${testCase.name}: runtime choice must be deterministic`,
  );

  assert.equal(
    firstChoice.selectedFamily,
    testCase.expected.selectedFamily,
    `${testCase.name}: selectedFamily`,
  );
  assert.equal(
    firstChoice.rendererKind,
    testCase.expected.rendererKind,
    `${testCase.name}: rendererKind`,
  );
  assert.equal(
    firstChoice.templateId,
    testCase.expected.templateId,
    `${testCase.name}: templateId`,
  );

  if (testCase.expected.familySceneKey !== undefined) {
    assert.equal(
      firstChoice.familySceneKey,
      testCase.expected.familySceneKey,
      `${testCase.name}: familySceneKey`,
    );
  }

  if (testCase.expected.guard?.hasNumericData !== undefined) {
    assert.equal(
      firstChoice.guards.hasNumericData,
      testCase.expected.guard.hasNumericData,
      `${testCase.name}: hasNumericData`,
    );
  }

  if (testCase.expected.guard?.hasEmbeddableAsset !== undefined) {
    assert.equal(
      firstChoice.guards.hasEmbeddableAsset,
      testCase.expected.guard.hasEmbeddableAsset,
      `${testCase.name}: hasEmbeddableAsset`,
    );
  }

  if (testCase.expected.rejectionCode) {
    const rejectionCodes = firstChoice.rejected.flatMap(
      (rejection) => rejection.codes,
    );
    assert.ok(
      rejectionCodes.includes(testCase.expected.rejectionCode),
      `${testCase.name}: missing rejection code ${testCase.expected.rejectionCode}`,
    );
  }

  if (testCase.expected.notTemplateId) {
    assert.notEqual(
      firstChoice.templateId,
      testCase.expected.notTemplateId,
      `${testCase.name}: templateId must not silently fall back`,
    );
  }
}

const legacySceneKeyMappings = [
  [cinematicTypeSceneKey, "hook", "kinetic-hook"],
  [cinematicTypeSceneKey, "quote", "quote"],
  [cinematicTypeSceneKey, "transition", "chapter-reset"],
  [paperNotebookSceneKey, "notes", "research-notes"],
  [paperNotebookSceneKey, "derivation", "derivation"],
  [paperNotebookSceneKey, "checklist", "checklist"],
  [editorialCollageSceneKey, "normal", "source-montage"],
  [editorialCollageSceneKey, "dense", "multi-source-evidence"],
  [editorialCollageSceneKey, "edge", "visual-essay"],
  [timelineDocumentarySceneKey, "milestone", "milestones"],
  [timelineDocumentarySceneKey, "era-change", "evolution"],
  [timelineDocumentarySceneKey, "conclusion", "roadmap"],
];

for (const [resolveSceneKey, legacyKey, canonicalKey] of legacySceneKeyMappings) {
  assert.equal(resolveSceneKey(legacyKey), canonicalKey, `${legacyKey}: canonical scene key`);
}

console.log(`Style runtime tests passed: ${fixture.cases.length} deterministic cases.`);
