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
assert.equal(videoMap.scenes[0].templateId, "animated-list");
assert.equal(videoMap.scenes[1].templateId, "code-panel");
assert.equal(
  videoMap.video.durationSec,
  videoMap.scenes.reduce((sum, scene) => sum + scene.durationSec, 0),
);
console.log("Visual mapper passed: general scenes and VideoMap compilation.");
