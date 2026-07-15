import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateSemantic } from "../validate-semantic.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const fixturePath = path.join(
  root,
  "input/scripts/ai-email-keigo/video-map.json",
);
const loadFixture = () => JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const cleanFixedFixture = () => {
  const videoMap = loadFixture();
  videoMap.scenes.find((scene) => scene.id === "steps").content.steps.pop();
  for (const [index, scene] of videoMap.scenes.entries()) {
    scene.subtitle.text = `Nội dung thuyết minh riêng cho cảnh số thứ tự ${index + 10}.`;
  }
  return videoMap;
};

test("email-keigo fixture fails claim-count at the steps scene", () => {
  const report = validateSemantic(loadFixture());
  const failures = report.results.filter(
    (result) => result.severity === "FAIL",
  );
  assert.equal(failures.length, 1);
  assert.equal(failures[0].check, "claim-count");
  assert.equal(failures[0].sceneId, "steps");
  assert.equal(failures[0].claimedCount, 3);
  assert.equal(failures[0].actualCount, 4);
});

test("corrected three-step map passes semantic QA", () => {
  const report = validateSemantic(cleanFixedFixture());
  assert.equal(report.status, "pass");
  assert.equal(report.counts.fail, 0);
  assert.equal(report.counts.warn, 0);
});

test("headline repeated by subtitle warns above 70 percent", () => {
  const videoMap = cleanFixedFixture();
  const scene = videoMap.scenes[0];
  scene.headline = "AI viết email đúng kính ngữ";
  scene.subtitle.text = "AI viết email đúng kính ngữ ngay hôm nay";
  const report = validateSemantic(videoMap);
  const warning = report.results.find(
    (result) =>
      result.check === "headline-subtitle-overlap" &&
      result.sceneId === scene.id,
  );
  assert.equal(warning?.severity, "WARN");
  assert.ok(warning.overlapRatio > 0.7);
});

test("final map with technical labels enabled fails kicker-leak", () => {
  const videoMap = cleanFixedFixture();
  videoMap.debug = { showTechnicalLabels: true };
  const report = validateSemantic(videoMap, { final: true });
  assert.equal(
    report.results.find((result) => result.check === "kicker-leak")?.severity,
    "FAIL",
  );
});

test("legacy map without debug remains valid", () => {
  const videoMap = cleanFixedFixture();
  delete videoMap.debug;
  const report = validateSemantic(videoMap, { final: true });
  assert.equal(report.status, "pass");
  assert.equal(
    report.results.some((result) => result.check === "kicker-leak"),
    false,
  );
});

test("scene longer than eight seconds without motion warns as static", () => {
  const videoMap = cleanFixedFixture();
  const scene = videoMap.scenes[0];
  scene.durationSec = 9;
  scene.motion = [];
  delete scene.transitionIn;
  delete scene.transitionOut;
  const report = validateSemantic(videoMap);
  assert.equal(
    report.results.find(
      (result) =>
        result.check === "static-scene" && result.sceneId === scene.id,
    )?.severity,
    "WARN",
  );
});
