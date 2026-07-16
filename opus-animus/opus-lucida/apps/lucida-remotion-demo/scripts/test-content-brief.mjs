import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { assertValidContentBrief, validateContentBrief } from "../pipeline/contracts/content-brief-contracts.mjs";
import { validateVisualFlow } from "../pipeline/contracts/visual-flow-contracts.mjs";
import { collectContentBrief, collectScript } from "../pipeline/collectors/index.mjs";
import { normalizeSanitizedInput, sanitizeRawInput } from "../pipeline/processors/index.mjs";
import { mapVisualScenes } from "../pipeline/mappers/map-scenes.mjs";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const autoBrief = read("pipeline/fixtures/content-brief/valid-auto.fixture.json");
const autoRun = {
  schemaVersion: "lucida-run/v1",
  runId: "content-brief-auto",
  lane: "rapid-visual-pilot",
  styleMode: "auto",
  publicationStatus: "non_publishable",
  approvalRefs: [],
};
const configFor = (run) => ({
  schemaVersion: "visual-flow/v2",
  projectId: run.runId,
  fps: 30,
  themeId: "lucida-editorial/v1",
  run,
  sources: [{ id: "brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-auto.fixture.json" }],
  mapping: {
    allowedFamilies: ["terminal", "dashboard", "editorial", "infographic", "code", "data_visualization", "product_demo", "cinematic_typography"],
    allowedPresets: ["command", "headline-stat-grid", "progress-steps", "split-screen", "cinematic-title-intro"],
    defaultPreset: "headline-stat-grid",
    minSceneSeconds: 3,
    maxSceneSeconds: 8,
    maxItemsPerScene: 10,
  },
});
const factualKnowledgeFor = (normalizedInput) => ({
  enabled: true,
  repository: "test-fixture",
  manifestHash: "content-brief-test",
  selections: normalizedInput.events.map((event) => ({
    eventId: event.id,
    evidence: (event.factRefs ?? []).map((factRef) => ({
      id: factRef,
      domain: "factual",
      family: null,
      sourceType: "fixture",
      sourceRef: `fixture:${factRef}`,
      score: 1,
      reasons: ["TEST_FACT_APPROVED"],
    })),
  })),
});

const collected = collectContentBrief({
  source: { id: "brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-auto.fixture.json" },
  projectRoot: root,
  runEnvelope: autoRun,
});
assert.equal(collected.records.length, 2);
assert.equal(collected.records[0].title, autoBrief.beats[0].title);
assert.equal(collected.records[0].body, autoBrief.beats[0].body);

const raw = {
  schemaVersion: "raw-visual-input/v1",
  projectId: autoRun.runId,
  generatedAt: "2026-07-16T00:00:00.000Z",
  inputMode: "content-brief",
  sources: [collected],
  warnings: [],
};
const sanitized = sanitizeRawInput(raw);
const normalized = normalizeSanitizedInput(sanitized, { fps: 30 });
assert.deepEqual(normalized.contentBrief, autoBrief);
assert.equal(normalized.inputMode, "content-brief");
assert.equal(normalized.events[0].title, autoBrief.beats[0].title);
assert.equal(normalized.events[0].body, autoBrief.beats[0].body);
assert.equal(normalized.events[0].text, autoBrief.beats[0].body);
assert.match(normalized.events[0].body, /\n/);
assert.deepEqual(normalized.events[1].actors, autoBrief.beats[1].actors);
assert.deepEqual(normalized.events[1].factRefs, autoBrief.beats[1].factRefs);

const mapped = mapVisualScenes(normalized, configFor(autoRun), factualKnowledgeFor(normalized));
assert.equal(mapped.scenes.length, autoBrief.beats.length);
assert.equal(mapped.scenes[0].title, autoBrief.beats[0].title);
assert.equal(mapped.scenes[0].blocks[0].text, autoBrief.beats[0].body);
assert.notEqual(mapped.scenes[1].title, mapped.scenes[1].blocks[0].text);
assert.equal(mapped.directorSelection.selections[0].eventId, "beat-hook-vn");
assert.equal(mapped.directorSelection.selections[0].beatId, "hook-vn");
assert.deepEqual(mapped.directorSelection.selections[1].semanticInputs.actors, autoBrief.beats[1].actors);
assert.deepEqual(mapped.directorSelection.selections[1].semanticInputs.factRefs, autoBrief.beats[1].factRefs);
assert.deepEqual(mapped.directorSelection.selections[1].semanticInputs.visualConstraints, autoBrief.visualConstraints);

const lockedBrief = read("pipeline/fixtures/content-brief/valid-locked.fixture.json");
const lockedRun = {
  schemaVersion: "lucida-run/v1",
  runId: "content-brief-locked",
  lane: "rapid-visual-pilot",
  styleMode: "locked",
  lockedStyle: { family: "product-showcase", lockedBy: "director@example.test", reason: "Product evidence requires the approved product treatment." },
  publicationStatus: "non_publishable",
  approvalRefs: [],
};
const lockedCollected = collectContentBrief({
  source: { id: "brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-locked.fixture.json" },
  projectRoot: root,
  runEnvelope: lockedRun,
});
const lockedNormalized = normalizeSanitizedInput(sanitizeRawInput({
  schemaVersion: "raw-visual-input/v1", projectId: lockedRun.runId, generatedAt: "2026-07-16T00:00:00.000Z", inputMode: "content-brief", sources: [lockedCollected], warnings: [],
}), { fps: 30 });
const lockedMapped = mapVisualScenes(
  lockedNormalized,
  { ...configFor(lockedRun), sources: [{ id: "brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-locked.fixture.json" }] },
  factualKnowledgeFor(lockedNormalized),
);
assert.equal(lockedMapped.scenes[0].packageId, "product-showcase");
assert.equal(lockedMapped.scenes[0].directorSelection.lockedBy, lockedRun.lockedStyle.lockedBy);
assert.equal(lockedMapped.scenes[0].directorSelection.reason, lockedRun.lockedStyle.reason);

for (const file of ["invalid-unknown-fact.fixture.json", "invalid-duplicate-beat.fixture.json", "invalid-auto-implicit-lock.fixture.json"]) {
  assert.throws(() => assertValidContentBrief(read(`pipeline/fixtures/content-brief/${file}`)), /Invalid ContentBrief/);
}
assert.match(validateContentBrief(autoBrief, { runEnvelope: lockedRun }).join("\n"), /styleMode must match/);
const productionFlow = { ...configFor({ ...autoRun, lane: "production", publicationStatus: "promotion_pending" }) };
assert.deepEqual(validateVisualFlow(productionFlow).errors, []);
productionFlow.sources.push({ id: "another-brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-auto.fixture.json" });
assert.match(validateVisualFlow(productionFlow).errors.join("\n"), /exactly one content_brief/);

const legacyScript = collectScript({ source: { id: "legacy", type: "script", path: "pipeline/fixtures/collector-script.md" }, projectRoot: root });
const legacyNormalized = normalizeSanitizedInput(sanitizeRawInput({
  schemaVersion: "raw-visual-input/v1", projectId: "legacy", generatedAt: "2026-07-16T00:00:00.000Z", inputMode: "legacy-compatibility",
  compatibility: { deprecated: true, reason: "DEPRECATION legacy script input" }, sources: [legacyScript], warnings: ["DEPRECATION legacy script input"],
}), { fps: 30 });
assert.equal(legacyNormalized.inputMode, "legacy-compatibility");
assert.equal(legacyNormalized.compatibility.deprecated, true);
assert.match(legacyNormalized.warnings.join("\n"), /DEPRECATION legacy script input/);

const missingProductionBrief = spawnSync(process.execPath, ["scripts/run-flow.mjs", "--script", "missing", "--video-map", "missing", "--normalized-input", "missing", "--run-envelope", "missing", "--approvals", "missing"], { cwd: root, encoding: "utf8" });
assert.notEqual(missingProductionBrief.status, 0);
assert.ok(missingProductionBrief.error || missingProductionBrief.status !== 0, "production without ContentBrief must fail before stages run");

console.log("ContentBrief passed: collect, sanitize, normalize, map, trace, locked actor/reason, invalid contracts, and legacy compatibility.");
