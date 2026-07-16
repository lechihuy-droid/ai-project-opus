import assert from "node:assert/strict";
import test from "node:test";

import { applyTimedDurations } from "../apply-timed-durations.mjs";

const timedScript = (durationMs, sentences = []) => ({ durationMs, sentences });

test("falls back to proportional, contiguous scene timing when no segment bindings are usable", () => {
  const videoMap = {
    video: { durationSec: 20 },
    scenes: Array.from({ length: 5 }, (_, index) => ({ id: `scene-${index + 1}`, durationSec: 4 })),
  };

  const result = applyTimedDurations(videoMap, timedScript(31_710));

  assert.deepEqual(
    result.videoMap.scenes.map(({ startMs, endMs, durationSec }) => ({ startMs, endMs, durationSec })),
    [
      { startMs: 0, endMs: 6342, durationSec: 6.342 },
      { startMs: 6342, endMs: 12684, durationSec: 6.342 },
      { startMs: 12684, endMs: 19026, durationSec: 6.342 },
      { startMs: 19026, endMs: 25368, durationSec: 6.342 },
      { startMs: 25368, endMs: 31710, durationSec: 6.342 },
    ],
  );
  assert.equal(result.videoMap.video.durationSec, 31.71);
  assert.equal(result.videoMap.scenes.at(-1).endMs, 31_710);
  assert.match(result.warnings[0], /applied proportional timing fallback/);
  assert.doesNotMatch(result.warnings[0], /kept existing timing/);
});

test("keeps segment-bound timing behavior when at least one usable binding exists", () => {
  const result = applyTimedDurations(
    {
      video: { durationSec: 8 },
      scenes: [
        { id: "mapped", durationSec: 4, segmentIds: ["seg-001"] },
        { id: "unmapped", durationSec: 4 },
      ],
    },
    timedScript(31_710, [{ segmentId: "seg-001", startMs: 500, endMs: 2500 }]),
  );

  assert.deepEqual(result.videoMap.scenes[0], {
    id: "mapped",
    durationSec: 2,
    segmentIds: ["seg-001"],
    startMs: 500,
    endMs: 2500,
  });
  assert.deepEqual(result.videoMap.scenes[1], { id: "unmapped", durationSec: 4 });
  assert.match(result.warnings[0], /no segmentIds; kept existing timing/);
});
