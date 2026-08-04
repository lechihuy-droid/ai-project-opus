import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { evaluateDirectorSelection } from "../../pipeline/director/evaluate-candidates.mjs";
import { loadProductionDirector } from "../../pipeline/director/load-production-director.mjs";
import { mapVisualScenes } from "../../pipeline/mappers/map-scenes.mjs";
import { compileVideoMap } from "../../pipeline/compilers/video-map.mjs";
import { validateRunEnvelope } from "../../pipeline/contracts/visual-flow-contracts.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const scene = {
  intent: "explain",
  content: {
    headlineChars: 30,
    bodyChars: 90,
    bulletItems: 2,
    codeLines: 0,
    dataSeries: 0,
    assetClassifications: [],
    hasStructuredNumericData: false,
    datedEvents: 0,
    hasSourcedChronology: false,
  },
};

test("W3 auto evaluates candidates with RAG trace and deterministic no-match fallback", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const auto = evaluateDirectorSelection({
    director,
    mode: "auto",
    scene,
    evidence: [{ id: "evidence-1", domain: "visual-style", family: "infographic" }],
  });
  assert.equal(auto.selected.familyId, "technical-editorial");
  assert.deepEqual(auto.selected.evidenceIds, ["evidence-1"]);
  assert.ok(auto.candidates.every((candidate) => candidate.componentAvailability));

  const noMatch = evaluateDirectorSelection({
    director,
    mode: "auto",
    scene: { ...scene, intent: "unknown-intent" },
  });
  assert.equal(noMatch.selected.familyId, "technical-editorial");
  assert.equal(noMatch.fallback.used, true);
  assert.equal(noMatch.selected.fallback, true);
});

test("W3 locked selection records actor and never claims RAG selected the package", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const locked = evaluateDirectorSelection({
    director,
    mode: "locked",
    scene,
    lockedStyle: {
      family: "terminal",
      lockedBy: "operator@example.test",
      reason: "Preserve the terminal treatment.",
    },
    evidence: [{ id: "evidence-2", domain: "visual-style", family: "terminal" }],
  });
  assert.equal(locked.selected.familyId, "terminal-command-center");
  assert.equal(locked.lockedBy, "operator@example.test");
  assert.match(locked.selected.selectedReasons.join("\n"), /supporting context only/i);
  assert.doesNotMatch(locked.selected.selectedReasons.join("\n"), /RAG selected/i);
});

test("W3 rejects a candidate with unavailable package components", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const packages = structuredClone(director.packages);
  packages["technical-editorial"].componentMap.primitives = [];
  const result = evaluateDirectorSelection({
    director: { ...director, packages },
    mode: "auto",
    scene,
  });
  const technical = result.candidates.find((candidate) => candidate.familyId === "technical-editorial");
  assert.equal(technical.status, "rejected");
  assert.equal(technical.componentAvailability.available, false);
  assert.ok(technical.rejectedReasons.some((reason) => reason.filterId === "component-availability"));
});

test("W3 auto ignores implicit family metadata and selects from intent/content", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const config = {
    schemaVersion: "visual-flow/v2",
    projectId: "w3-auto-implicit-family",
    fps: 30,
    themeId: "lucida-editorial/v1",
    mapping: {
      allowedFamilies: ["terminal", "editorial", "infographic", "code"],
      allowedPresets: ["command", "headline-stat-grid"],
      defaultPreset: "headline-stat-grid",
      minSceneSeconds: 3,
      maxSceneSeconds: 8,
      maxItemsPerScene: 10,
    },
    run: {
      schemaVersion: "lucida-run/v1",
      runId: "w3-auto-implicit-family",
      lane: "rapid-visual-pilot",
      styleMode: "auto",
      publicationStatus: "non_publishable",
      approvalRefs: [],
    },
  };
  const mapped = mapVisualScenes({
    schemaVersion: "normalized-visual-input/v1",
    projectId: config.projectId,
    events: [{
      id: "implicit-family-event",
      kind: "narrative",
      text: "Explain the system architecture.",
      data: { family: "product_demo", intent: "system-architecture" },
      provenance: {},
    }],
  }, config, null, { director });

  assert.equal(mapped.scenes[0].directorSelection.selected.familyId, "technical-editorial");
  assert.equal(mapped.scenes[0].directorSelection.selected.legacyFamily, "infographic");
  assert.notEqual(mapped.scenes[0].directorSelection.selected.familyId, "product-showcase");
});

test("W3 locked accepts legacy aliases and package IDs, with actor/reason and support-only RAG", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  for (const [family, expectedPackage] of [
    ["terminal", "terminal-command-center"],
    ["technical-editorial", "technical-editorial"],
  ]) {
    const trace = evaluateDirectorSelection({
      director,
      mode: "locked",
      scene,
      lockedStyle: {
        family,
        lockedBy: "operator@example.test",
        reason: "Explicit W3 compatibility lock.",
      },
      evidence: [{ id: "rag-support-only", domain: "visual-style", family }],
    });
    assert.equal(trace.selected.familyId, expectedPackage);
    assert.equal(trace.lockedBy, "operator@example.test");
    assert.equal(trace.reason, "Explicit W3 compatibility lock.");
    assert.match(trace.selected.selectedReasons.join("\n"), /supporting context only/i);
    assert.doesNotMatch(trace.selected.selectedReasons.join("\n"), /RAG selected/i);
  }

  const invalid = {
    schemaVersion: "lucida-run/v1",
    runId: "w3-locked-required-fields",
    lane: "rapid-visual-pilot",
    styleMode: "locked",
    lockedStyle: { family: "terminal" },
    publicationStatus: "non_publishable",
    approvalRefs: [],
  };
  const errors = validateRunEnvelope(invalid).join("\n");
  assert.match(errors, /run\.lockedStyle\.lockedBy required/);
  assert.match(errors, /run\.lockedStyle\.reason required/);
});

test("W3 gives every candidate reasons, evidence IDs, and component availability", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const trace = evaluateDirectorSelection({
    director,
    mode: "auto",
    scene,
    evidence: [{ id: "rag-explain", domain: "visual-style", family: "infographic" }],
  });
  for (const candidate of trace.candidates) {
    assert.ok(["accepted", "rejected"].includes(candidate.status));
    assert.ok(Array.isArray(candidate.selectedReasons) && candidate.selectedReasons.length);
    assert.ok(Array.isArray(candidate.rejectedReasons));
    assert.ok(Array.isArray(candidate.evidenceIds));
    assert.equal(typeof candidate.componentAvailability.available, "boolean");
    assert.ok(Array.isArray(candidate.componentAvailability.primitives));
    assert.ok(Array.isArray(candidate.componentAvailability.templates));
    assert.ok(candidate.componentAvailability.reason);
    if (candidate.status === "accepted") assert.equal(candidate.rejectedReasons.length, 0);
    if (candidate.status === "rejected") assert.ok(candidate.rejectedReasons.length);
  }
});

test("W6 Director rejects factual evidence from visual style selection", () => {
  const director = loadProductionDirector();
  assert.throws(() => evaluateDirectorSelection({
    director,
    mode: "auto",
    scene: { intent: "explain", content: {} },
    evidence: [{ id: "fact-only", domain: "factual", family: "infographic" }],
  }), /Director rejects non-visual-style evidence/);
});

test("W3 no-match fallback is deterministic and rejects unavailable packages", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const noMatchInput = { director, mode: "auto", scene: { ...scene, intent: "unmapped-intent" } };
  const first = evaluateDirectorSelection(noMatchInput);
  const second = evaluateDirectorSelection(noMatchInput);
  assert.deepEqual(second, first);
  assert.equal(first.fallback.used, true);
  assert.equal(first.selected.familyId, "technical-editorial");
  assert.equal(first.selected.fallback, true);

  const fallbackPackages = structuredClone(director.packages);
  delete fallbackPackages["technical-editorial"];
  const alternateFallback = evaluateDirectorSelection({
    director: { ...director, packages: fallbackPackages },
    mode: "auto",
    scene: { ...scene, intent: "unmapped-intent" },
  });
  assert.equal(alternateFallback.fallback.used, true);
  assert.notEqual(alternateFallback.selected.familyId, "technical-editorial");
  assert.match(
    alternateFallback.selected.selectedReasons.join("\n"),
    new RegExp(`deterministic ${alternateFallback.selected.familyId} fallback`),
  );

  const packages = structuredClone(director.packages);
  delete packages["technical-editorial"];
  const unavailable = evaluateDirectorSelection({
    director: { ...director, packages },
    mode: "auto",
    scene,
  });
  const rejected = unavailable.candidates.find((candidate) => candidate.familyId === "technical-editorial");
  assert.equal(rejected.status, "rejected");
  assert.ok(rejected.rejectedReasons.some((reason) => reason.filterId === "package-manifest"));
});

test("W3 compiler keeps package IDs while adapting legacy families to templates", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const config = {
    schemaVersion: "visual-flow/v1",
    projectId: "w3-compiler-compatibility",
    fps: 30,
    themeId: "lucida-command/v1",
    mapping: {
      allowedFamilies: ["terminal", "editorial"],
      allowedPresets: ["command", "headline-stat-grid"],
      defaultFamily: "terminal",
      defaultPreset: "command",
      minSceneSeconds: 3,
      maxSceneSeconds: 8,
      maxItemsPerScene: 10,
    },
  };
  const legacyMapped = mapVisualScenes({
    schemaVersion: "normalized-visual-input/v1",
    projectId: config.projectId,
    events: [
      { id: "legacy-narrative", kind: "narrative", text: "Legacy editorial", data: { family: "editorial" }, provenance: {} },
      { id: "legacy-output", kind: "output", text: "$ npm test", frame: 1, provenance: {} },
    ],
  }, config, null, { director });
  const legacyVideoMap = compileVideoMap(legacyMapped, config);
  assert.deepEqual(legacyVideoMap.scenes.map((item) => item.visualFamily), ["editorial", "terminal"]);
  assert.deepEqual(legacyVideoMap.scenes.map((item) => item.templateId), ["animated-list", "code-panel"]);

  const autoConfig = {
    ...config,
    schemaVersion: "visual-flow/v2",
    run: {
      schemaVersion: "lucida-run/v1",
      runId: "w3-compiler-package-id",
      lane: "rapid-visual-pilot",
      styleMode: "auto",
      publicationStatus: "non_publishable",
      approvalRefs: [],
    },
  };
  const packageMapped = mapVisualScenes({
    schemaVersion: "normalized-visual-input/v1",
    projectId: autoConfig.projectId,
    events: [{ id: "package-scene", kind: "narrative", text: "Explain the system", data: { intent: "system-architecture" }, provenance: {} }],
  }, autoConfig, null, { director });
  const packageVideoMap = compileVideoMap(packageMapped, autoConfig);
  assert.equal(packageVideoMap.scenes[0].visualFamily, "technical-editorial");
  assert.equal(packageVideoMap.scenes[0].templateId, "animated-list");
});

test("W3 v1 mapper behavior and director report remain JSON serializable", () => {
  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const config = {
    schemaVersion: "visual-flow/v1",
    projectId: "w3-v1-compatibility",
    fps: 30,
    themeId: "lucida-command/v1",
    mapping: {
      allowedFamilies: ["terminal", "editorial"],
      allowedPresets: ["command", "headline-stat-grid"],
      defaultFamily: "terminal",
      defaultPreset: "command",
      minSceneSeconds: 3,
      maxSceneSeconds: 8,
      maxItemsPerScene: 10,
    },
  };
  const mapped = mapVisualScenes({
    schemaVersion: "normalized-visual-input/v1",
    projectId: config.projectId,
    events: [
      { id: "v1-editorial", kind: "narrative", text: "Legacy story", data: { family: "editorial" }, provenance: {} },
      { id: "v1-terminal", kind: "output", text: "command output", frame: 2, provenance: {} },
    ],
  }, config, null, { director });
  assert.deepEqual(mapped.scenes.map((item) => item.visualFamily), ["editorial", "terminal"]);
  assert.deepEqual(mapped.scenes.map((item) => item.packageId), [undefined, undefined]);

  const autoConfig = {
    ...config,
    schemaVersion: "visual-flow/v2",
    run: {
      schemaVersion: "lucida-run/v1",
      runId: "w3-report-completeness",
      lane: "rapid-visual-pilot",
      styleMode: "auto",
      publicationStatus: "non_publishable",
      approvalRefs: [],
    },
  };
  const autoMapped = mapVisualScenes({
    schemaVersion: "normalized-visual-input/v1",
    projectId: autoConfig.projectId,
    events: [{
      id: "report-event",
      kind: "narrative",
      text: "Explain the system",
      data: { intent: "system-architecture" },
      provenance: {},
    }],
  }, autoConfig, {
    enabled: true,
    manifestHash: "manifest-w3",
    selections: [{ eventId: "report-event", evidence: [{ id: "rag-report", domain: "visual-style", family: "infographic" }] }],
  }, { director });
  const report = JSON.parse(JSON.stringify(autoMapped.directorSelection));
  assert.equal(report.runId, autoConfig.run.runId);
  assert.equal(report.mode, "auto");
  assert.equal(report.manifestHash, "manifest-w3");
  assert.equal(report.selections.length, 1);
  const selection = report.selections[0];
  assert.equal(selection.sceneId, autoMapped.scenes[0].sceneId);
  assert.deepEqual(selection.eventIds, ["report-event"]);
  assert.equal(selection.mode, "auto");
  assert.equal(selection.intent, "system-architecture");
  assert.ok(Array.isArray(selection.candidates));
  assert.ok("scores" in selection);
  assert.ok("repetitionPenalty" in selection);
  assert.ok("approvalRef" in selection);
  assert.ok(selection.selected);
  assert.ok(selection.fallback);
});
