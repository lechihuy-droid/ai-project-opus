import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { compileVideoMap } from "../../pipeline/compilers/video-map.mjs";
import { evaluateDirectorSelection } from "../../pipeline/director/evaluate-candidates.mjs";
import { loadProductionDirector } from "../../pipeline/director/load-production-director.mjs";
import { mapVisualScenes } from "../../pipeline/mappers/map-scenes.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const director = loadProductionDirector({ appRoot: APP_ROOT });

const content = (overrides = {}) => ({
  headlineChars: 40,
  bodyChars: 120,
  bulletItems: 2,
  codeLines: 0,
  dataSeries: 0,
  assetClassifications: [],
  hasStructuredNumericData: false,
  datedEvents: 0,
  hasSourcedChronology: false,
  ...overrides,
});

const evidence = (family, score = 100) => [{
  id: `gold:${family}`,
  domain: "visual-style",
  family,
  sourceType: "repository",
  score,
  reasons: ["SAFE_REFERENCE_APPROVED", "MATCH_RIGHTS", "MATCH_APPROVAL", "LEXICAL_MATCH"],
}];

const evaluate = (intent, sceneContent, family = null, history = {}) => evaluateDirectorSelection({
  director,
  mode: "auto",
  scene: { intent, content: sceneContent },
  evidence: family ? evidence(family) : [],
  history,
});

test("W7 gold queries select all nine production style packages", () => {
  const cases = [
    ["terminal-command-center", "code-explanation", content({ codeLines: 10 })],
    ["technical-editorial", "explain", content()],
    ["minimal-education", "list", content({ bulletItems: 4 })],
    ["cinematic-type", "hook", content({ bulletItems: 0, bodyChars: 80 })],
    ["dashboard-data", "comparison", content({ hasStructuredNumericData: true, dataSeries: 2 })],
    ["paper-notebook", "summarize", content(), "paper-notebook"],
    ["product-showcase", "use-case", content({ assetClassifications: ["embed_asset"] })],
    ["editorial-collage", "evidence", content({ assetClassifications: ["embed_asset"] })],
    ["timeline-documentary", "case-study", content({ datedEvents: 4, hasSourcedChronology: true })],
  ];
  for (const [expected, intent, sceneContent, evidenceFamily = null] of cases) {
    const result = evaluate(intent, sceneContent, evidenceFamily);
    assert.equal(result.selected?.familyId, expected, `${intent} should select ${expected}`);
    assert.ok(result.scores.every((score) => Number.isFinite(score.total)));
    assert.equal(result.scores[0].rank, 0);
  }
});

test("W7 ranking is deterministic and approved lexical evidence can change the winner", () => {
  const sceneContent = content();
  const baseline = evaluate("explain", sceneContent);
  const rerun = evaluate("explain", sceneContent);
  assert.deepEqual(rerun.scores, baseline.scores);
  assert.equal(baseline.selected.familyId, "technical-editorial");

  const evidenceLed = evaluate("explain", sceneContent, "minimal-education");
  assert.equal(evidenceLed.selected.familyId, "minimal-education");
  assert.ok(evidenceLed.scores[0].components.semanticFit.lexical > 0);
});

test("W7 repetition penalty is explicit and affects repeated-family history", () => {
  const result = evaluate("explain", content(), null, {
    selectedFamilies: ["technical-editorial"],
    selectedLayouts: ["top-title"],
  });
  const technical = result.scores.find((score) => score.familyId === "technical-editorial");
  assert.ok(technical.repetitionPenalty > 0);
  if (result.selected.familyId === "technical-editorial") {
    assert.equal(result.repetitionPenalty.applied, true);
  }
});

test("W7 five-scene mapper uses at least three layouts and never repeats over two scenes", () => {
  const config = {
    schemaVersion: "visual-flow/v2",
    projectId: "w7-five-scene-diversity",
    fps: 30,
    themeId: "lucida-editorial/v1",
    mapping: {
      allowedFamilies: ["terminal", "editorial", "infographic", "code", "dashboard", "data_visualization", "product_demo", "cinematic_typography"],
      allowedPresets: ["command", "headline-stat-grid", "progress-steps", "split-screen", "cinematic-title-intro"],
      defaultFamily: "editorial",
      defaultPreset: "headline-stat-grid",
      minSceneSeconds: 3,
      maxSceneSeconds: 8,
      maxItemsPerScene: 1,
    },
    run: {
      schemaVersion: "lucida-run/v1",
      runId: "w7-five-scene-diversity",
      lane: "rapid-visual-pilot",
      styleMode: "auto",
      publicationStatus: "non_publishable",
      approvalRefs: [],
    },
  };
  const intents = ["hook", "explain", "comparison", "process", "takeaway"];
  const normalized = {
    schemaVersion: "normalized-visual-input/v1",
    projectId: config.projectId,
    events: intents.map((intent, index) => ({
      id: `event-${index + 1}`,
      kind: "narrative",
      intent,
      title: `Scene ${index + 1}`,
      body: `One focused statement for ${intent}.`,
      provenance: {},
    })),
  };
  const mapped = mapVisualScenes(normalized, config, null, { director });
  const layouts = mapped.scenes.map((scene) => scene.effectiveLayout);
  assert.equal(layouts.length, 5);
  assert.ok(new Set(layouts).size >= 3, `layouts=${layouts.join(",")}`);
  let run = 1;
  let maxRun = 1;
  for (let index = 1; index < layouts.length; index += 1) {
    run = layouts[index] === layouts[index - 1] ? run + 1 : 1;
    maxRun = Math.max(maxRun, run);
  }
  assert.ok(maxRun <= 2, `layouts=${layouts.join(",")}`);
  assert.notEqual(layouts[0], "top-title");
  assert.notEqual(layouts.at(-1), "top-title");

  const videoMap = compileVideoMap(mapped, config);
  assert.deepEqual(videoMap.scenes.map((scene) => scene.layout), layouts);
});
