import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  assertValidContentBrief,
  validateContentBrief,
} from "../../pipeline/contracts/content-brief-contracts.mjs";
import { validateVisualFlow } from "../../pipeline/contracts/visual-flow-contracts.mjs";
import { collectContentBrief, collectScript } from "../../pipeline/collectors/index.mjs";
import { mapVisualScenes } from "../../pipeline/mappers/map-scenes.mjs";
import { normalizeSanitizedInput, sanitizeRawInput } from "../../pipeline/processors/index.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const fixture = (name) => JSON.parse(fs.readFileSync(
  path.join(APP_ROOT, "pipeline/fixtures/content-brief", name),
  "utf8",
));

const autoRun = {
  schemaVersion: "lucida-run/v1",
  runId: "w5-content-brief-auto",
  lane: "rapid-visual-pilot",
  styleMode: "auto",
  publicationStatus: "non_publishable",
  approvalRefs: [],
};

const lockedRun = {
  schemaVersion: "lucida-run/v1",
  runId: "w5-content-brief-locked",
  lane: "rapid-visual-pilot",
  styleMode: "locked",
  lockedStyle: {
    family: "product-showcase",
    lockedBy: "operator@example.test",
    reason: "The approved product treatment is required for this review.",
  },
  publicationStatus: "non_publishable",
  approvalRefs: [],
};

const configFor = (run, sources) => ({
  schemaVersion: "visual-flow/v2",
  projectId: run.runId,
  fps: 30,
  themeId: "lucida-editorial/v1",
  run,
  sources,
  mapping: {
    allowedFamilies: ["terminal", "dashboard", "editorial", "infographic", "code", "data_visualization", "product_demo", "cinematic_typography"],
    allowedPresets: ["command", "headline-stat-grid", "progress-steps", "split-screen", "cinematic-title-intro"],
    defaultPreset: "headline-stat-grid",
    minSceneSeconds: 3,
    maxSceneSeconds: 8,
    maxItemsPerScene: 10,
  },
});

const collectNormalize = ({ briefPath, run, sourceId = "brief" }) => {
  const source = { id: sourceId, type: "content_brief", path: briefPath };
  const collected = collectContentBrief({ source, projectRoot: APP_ROOT, runEnvelope: run });
  const sanitized = sanitizeRawInput({
    schemaVersion: "raw-visual-input/v1",
    projectId: run.runId,
    generatedAt: "2026-07-16T00:00:00.000Z",
    inputMode: "content-brief",
    sources: [collected],
    warnings: [],
  });
  return { collected, sanitized, normalized: normalizeSanitizedInput(sanitized, { fps: 30 }) };
};

test("W5 validates auto and locked ContentBrief runtime contracts", () => {
  const autoBrief = fixture("valid-auto.fixture.json");
  const lockedBrief = fixture("valid-locked.fixture.json");

  assert.deepEqual(validateContentBrief(autoBrief, { runEnvelope: autoRun }), []);
  assert.deepEqual(validateContentBrief(lockedBrief, { runEnvelope: lockedRun }), []);
  assert.equal(assertValidContentBrief(autoBrief, { runEnvelope: autoRun }), autoBrief);
  assert.equal(assertValidContentBrief(lockedBrief, { runEnvelope: lockedRun }), lockedBrief);
});

test("W5 rejects duplicate beats, unknown facts, mode mismatch, and implicit auto locks", () => {
  for (const name of [
    "invalid-duplicate-beat.fixture.json",
    "invalid-unknown-fact.fixture.json",
    "invalid-auto-implicit-lock.fixture.json",
  ]) {
    assert.throws(() => assertValidContentBrief(fixture(name)), /Invalid ContentBrief/);
  }

  const errors = validateContentBrief(fixture("valid-auto.fixture.json"), { runEnvelope: lockedRun });
  assert.match(errors.join("\n"), /styleMode must match run\.styleMode/);
});

test("W5 preserves exact Vietnamese CRLF and LF title/body text through sanitize and normalize", (t) => {
  const tempDir = fs.mkdtempSync(path.join(APP_ROOT, "tests", ".tmp-w5-content-brief-"));
  t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

  const brief = {
    schemaVersion: "lucida-content-brief/v1",
    title: "Bản tin Việt Nam\r\nKhông được làm phẳng",
    audience: "Nhóm sản phẩm",
    intent: "explain",
    styleMode: "auto",
    factualSourceIds: ["fact-vn"],
    visualConstraints: { forbiddenFamilies: ["terminal"] },
    beats: [{
      id: "vn-crlf",
      title: "Tiêu đề riêng\r\nDòng thứ hai",
      body: "Nội dung tiếng Việt\r\nGiữ CRLF chính xác\nGiữ LF chính xác.",
      intent: "evidence",
      role: "evidence",
      actors: ["người vận hành"],
      factRefs: ["fact-vn"],
    }],
  };
  const filePath = path.join(tempDir, "brief.json");
  fs.writeFileSync(filePath, JSON.stringify(brief), "utf8");

  const source = { id: "vn", type: "content_brief", path: filePath };
  const collected = collectContentBrief({ source, projectRoot: APP_ROOT, runEnvelope: autoRun });
  const sanitized = sanitizeRawInput({
    schemaVersion: "raw-visual-input/v1",
    projectId: autoRun.runId,
    generatedAt: "2026-07-16T00:00:00.000Z",
    inputMode: "content-brief",
    sources: [collected],
    warnings: [],
  });
  const normalized = normalizeSanitizedInput(sanitized, { fps: 30 });

  assert.equal(sanitized.sources[0].contentBrief.title, brief.title);
  assert.equal(sanitized.sources[0].records[0].title, brief.beats[0].title);
  assert.equal(sanitized.sources[0].records[0].body, brief.beats[0].body);
  assert.equal(normalized.events[0].title, brief.beats[0].title);
  assert.equal(normalized.events[0].body, brief.beats[0].body);
  assert.equal(normalized.events[0].text, brief.beats[0].body);
  assert.match(normalized.events[0].body, /\r\n/);
  assert.match(normalized.events[0].body, /\nGiữ LF chính xác\./);
});

test("W5 retains structured beat and top-level semantic inputs through mapper trace", () => {
  const brief = fixture("valid-auto.fixture.json");
  const source = { id: "brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-auto.fixture.json" };
  const { collected, sanitized, normalized } = collectNormalize({ briefPath: source.path, run: autoRun });

  assert.equal(collected.contentBrief.title, brief.title);
  assert.equal(sanitized.sources[0].contentBrief.audience, brief.audience);
  assert.equal(normalized.contentBrief.intent, brief.intent);
  assert.deepEqual(normalized.contentBrief.factualSourceIds, brief.factualSourceIds);
  assert.deepEqual(normalized.contentBrief.visualConstraints, brief.visualConstraints);
  assert.equal(normalized.contentBrief.styleMode, brief.styleMode);

  for (const [index, beat] of brief.beats.entries()) {
    const event = normalized.events[index];
    assert.equal(event.title, beat.title);
    assert.equal(event.body, beat.body);
    assert.equal(event.intent, beat.intent ?? brief.intent);
    assert.equal(event.beatRole, beat.role);
    assert.deepEqual(event.actors, beat.actors);
    assert.deepEqual(event.factRefs, beat.factRefs);
    assert.deepEqual(event.factualSourceIds, brief.factualSourceIds);
    assert.deepEqual(event.visualConstraints, brief.visualConstraints);
  }

  const factualSelection = {
    enabled: true,
    repository: "fixture",
    manifestHash: "fixture",
    summary: { domain: "factual" },
    selections: normalized.events.map((event) => ({
      eventId: event.id,
      evidence: event.factRefs.map((id) => ({ id, domain: "factual" })),
    })),
  };
  const mapped = mapVisualScenes(normalized, configFor(autoRun, [source]), factualSelection);
  assert.equal(mapped.scenes.length, brief.beats.length);
  for (const [index, beat] of brief.beats.entries()) {
    const scene = mapped.scenes[index];
    const trace = mapped.directorSelection.selections[index];
    assert.equal(scene.title, beat.title);
    assert.equal(scene.blocks[0].text, beat.body);
    assert.notEqual(scene.title, scene.blocks[0].text);
    assert.equal(scene.intent, beat.intent ?? brief.intent);
    assert.equal(trace.beatId, beat.id);
    assert.equal(trace.semanticInputs.title, beat.title);
    assert.equal(trace.semanticInputs.body, beat.body);
    assert.equal(trace.semanticInputs.intent, beat.intent ?? brief.intent);
    assert.equal(trace.semanticInputs.role, beat.role);
    assert.deepEqual(trace.semanticInputs.actors, beat.actors);
    assert.deepEqual(trace.semanticInputs.factRefs, beat.factRefs);
    assert.deepEqual(trace.semanticInputs.factualSourceIds, brief.factualSourceIds);
    assert.deepEqual(trace.semanticInputs.visualConstraints, brief.visualConstraints);
  }
});

test("W5 requires exactly one ContentBrief for production v2 flows", () => {
  const source = { id: "brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-auto.fixture.json" };
  const productionRun = { ...autoRun, lane: "production", publicationStatus: "promotion_pending" };

  assert.match(
    validateVisualFlow(configFor(productionRun, [])).errors.join("\n"),
    /requires exactly one content_brief source/,
  );
  assert.deepEqual(validateVisualFlow(configFor(productionRun, [source])).errors, []);
  assert.match(
    validateVisualFlow(configFor(productionRun, [source, { ...source, id: "brief-duplicate" }])).errors.join("\n"),
    /requires exactly one content_brief source/,
  );
});

test("W5 keeps rapid script-only input as explicitly marked compatibility mode", () => {
  const source = { id: "legacy-script", type: "script", path: "pipeline/fixtures/collector-script.md" };
  assert.deepEqual(validateVisualFlow(configFor(autoRun, [source])).errors, []);

  const collected = collectScript({ source, projectRoot: APP_ROOT });
  const warning = "DEPRECATION legacy script input: no ContentBrief was collected; output is compatibility-only and non-production.";
  const normalized = normalizeSanitizedInput(sanitizeRawInput({
    schemaVersion: "raw-visual-input/v1",
    projectId: autoRun.runId,
    generatedAt: "2026-07-16T00:00:00.000Z",
    inputMode: "legacy-compatibility",
    compatibility: { deprecated: true, reason: warning },
    sources: [collected],
    warnings: [warning],
  }), { fps: 30 });

  assert.equal(normalized.inputMode, "legacy-compatibility");
  assert.equal(normalized.compatibility.deprecated, true);
  assert.equal(normalized.compatibility.reason, warning);
  assert.deepEqual(normalized.warnings, [warning]);
  assert.equal(normalized.contentBrief, undefined);
});

test("W5 keeps locked actor and reason from RunEnvelope and does not flatten title/body", () => {
  const source = { id: "locked-brief", type: "content_brief", path: "pipeline/fixtures/content-brief/valid-locked.fixture.json" };
  const { normalized } = collectNormalize({ briefPath: source.path, run: lockedRun, sourceId: source.id });
  const factualSelection = {
    enabled: true,
    repository: "fixture",
    manifestHash: "fixture",
    summary: { domain: "factual" },
    selections: normalized.events.map((event) => ({
      eventId: event.id,
      evidence: event.factRefs.map((id) => ({ id, domain: "factual" })),
    })),
  };
  const mapped = mapVisualScenes(normalized, configFor(lockedRun, [source]), factualSelection);
  const scene = mapped.scenes[0];

  assert.equal(scene.packageId, "product-showcase");
  assert.equal(scene.directorSelection.lockedBy, lockedRun.lockedStyle.lockedBy);
  assert.equal(scene.directorSelection.reason, lockedRun.lockedStyle.reason);
  assert.equal(mapped.directorSelection.selections[0].lockedBy, lockedRun.lockedStyle.lockedBy);
  assert.equal(mapped.directorSelection.selections[0].reason, lockedRun.lockedStyle.reason);
  assert.equal(scene.title, normalized.events[0].title);
  assert.equal(scene.blocks[0].text, normalized.events[0].body);
  assert.notEqual(scene.title, scene.blocks[0].text);
});
