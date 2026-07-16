import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { mapVisualScenes } from "../pipeline/mappers/map-scenes.mjs";
import { compileVideoMap } from "../pipeline/compilers/video-map.mjs";

const config = JSON.parse(
  fs.readFileSync(
    path.resolve("pipeline/fixtures/collector-flow.json"),
    "utf8",
  ),
);
const normalized = {
  schemaVersion: "normalized-visual-input/v1",
  projectId: "fixture",
  events: [
    {
      id: "event-1",
      kind: "narrative",
      text: "A strong opening",
      provenance: {},
    },
    {
      id: "event-2",
      kind: "output",
      frame: 3,
      text: "$ npm run render",
      provenance: {},
    },
    {
      id: "event-3",
      kind: "output",
      frame: 30,
      text: "Composition loaded",
      provenance: {},
    },
  ],
};
const mapped = mapVisualScenes(normalized, config);
assert.equal(mapped.scenes.length, 2);
assert.deepEqual(
  mapped.scenes.map((scene) => scene.visualFamily),
  ["editorial", "terminal"],
);
assert.ok(
  mapped.scenes.every((scene) =>
    scene.blocks.every((block) => block.sourceEventIds.length),
  ),
);

const videoMap = compileVideoMap(mapped, config);
assert.deepEqual(videoMap.brand, {
  id: "lucida-ai-v1",
  series: "lucida-now",
  contractRef: "docs/market-research/11-pipeline-contract.md",
});
assert.equal(videoMap.scenes[0].templateId, "animated-list");
assert.equal(videoMap.scenes[1].templateId, "code-panel");
assert.equal(
  videoMap.video.durationSec,
  videoMap.scenes.reduce((sum, scene) => sum + scene.durationSec, 0),
);

const autoConfig = {
  ...config,
  run: {
    schemaVersion: "lucida-run/v1",
    runId: "mapper-auto",
    lane: "rapid-visual-pilot",
    styleMode: "auto",
    publicationStatus: "non_publishable",
    approvalRefs: [],
  },
};
const autoMapped = mapVisualScenes({
  schemaVersion: "normalized-visual-input/v1",
  projectId: "mapper-auto",
  events: [{
    id: "auto-1",
    kind: "narrative",
    text: "Explain the system",
    data: { intent: "system-architecture" },
    provenance: {},
  }],
}, autoConfig, {
  enabled: true,
  manifestHash: "manifest-test",
  selections: [{
    eventId: "auto-1",
    evidence: [{ id: "rag-technical", domain: "visual-style", family: "infographic" }],
  }],
});
assert.equal(autoMapped.scenes[0].packageId, "technical-editorial");
assert.equal(autoMapped.scenes[0].legacyFamily, "infographic");
assert.deepEqual(autoMapped.scenes[0].directorSelection.selected.evidenceIds, ["rag-technical"]);
assert.equal(compileVideoMap(autoMapped, autoConfig).scenes[0].visualFamily, "technical-editorial");

const lockedConfig = {
  ...autoConfig,
  run: {
    ...autoConfig.run,
    runId: "mapper-locked",
    styleMode: "locked",
    lockedStyle: {
      family: "product-showcase",
      lockedBy: "test-director",
      reason: "Explicit package lock for compatibility coverage.",
    },
  },
};
const lockedMapped = mapVisualScenes({
  schemaVersion: "normalized-visual-input/v1",
  projectId: "mapper-locked",
  events: [{ id: "locked-1", kind: "narrative", text: "Show the product", data: {}, provenance: {} }],
}, lockedConfig);
assert.equal(lockedMapped.scenes[0].packageId, "product-showcase");
assert.equal(lockedMapped.scenes[0].directorSelection.lockedBy, "test-director");
assert.match(lockedMapped.scenes[0].directorSelection.selected.selectedReasons.join("\n"), /explicitly locked/i);
assert.equal(compileVideoMap(lockedMapped, lockedConfig).scenes[0].visualFamily, "product-showcase");
console.log("Visual mapper passed: legacy scenes, Director auto/locked selection, and VideoMap package compilation.");
