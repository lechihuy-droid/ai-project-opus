import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { validateSemantic } from "../validate-semantic.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const samplePath = path.join(root, "tests/fixtures/continuous-video-map.json");
const sample = () => JSON.parse(fs.readFileSync(samplePath, "utf8"));
const schema = JSON.parse(
  fs.readFileSync(path.join(root, "schemas/video-map.schema.json"), "utf8"),
);
const validateMap = new Ajv2020({ strict: false }).compile(schema);

test("schema defaults to slides and legacy slides map still validates", () => {
  assert.equal(schema.properties.mode.default, "slides");
  const legacyMap = JSON.parse(
    fs.readFileSync(path.join(root, "video-map.json"), "utf8"),
  );
  assert.equal(
    validateMap(legacyMap),
    true,
    JSON.stringify(validateMap.errors),
  );
});

test("sample continuous map validates and semantic QA reads transitions", () => {
  const videoMap = sample();
  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));
  const report = validateSemantic(videoMap);
  assert.equal(report.status, "pass");
  assert.equal(
    report.results.some((item) => item.check === "static-scene"),
    false,
  );
});

test("continuous schema rejects slide templateId and missing transitions", () => {
  const videoMap = sample();
  videoMap.scenes[0].templateId = "hero-title";
  delete videoMap.scenes[0].transitions;
  assert.equal(validateMap(videoMap), false);
  assert.ok(
    validateMap.errors.some(
      (error) =>
        error.instancePath.endsWith("/templateId") ||
        error.params?.missingProperty === "transitions",
    ),
  );
});

test("continuous static-scene check ignores slide motion and requires transitions", () => {
  const videoMap = sample();
  videoMap.scenes[0].durationSec = 9;
  videoMap.scenes[0].transitions = [];
  videoMap.scenes[0].motion = ["legacy-slide-motion"];
  const report = validateSemantic(videoMap);
  assert.equal(
    report.results.find(
      (item) =>
        item.check === "static-scene" && item.sceneId === "window-draft",
    )?.severity,
    "WARN",
  );
});

test("continuous schema accepts remove without props while legacy slides validation is unchanged", () => {
  const videoMap = sample();
  videoMap.scenes[2].transitions.unshift({
    target: "recipient-chip",
    action: "remove",
  });
  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));

  const legacyMap = JSON.parse(
    fs.readFileSync(path.join(root, "video-map.json"), "utf8"),
  );
  assert.equal(
    validateMap(legacyMap),
    true,
    JSON.stringify(validateMap.errors),
  );
});

test("continuous schema still requires props for add and update", () => {
  for (const action of ["add", "update"]) {
    const videoMap = sample();
    videoMap.scenes[0].transitions.unshift({
      target: `missing-props-${action}`,
      action,
    });

    assert.equal(validateMap(videoMap), false);
    assert.ok(
      validateMap.errors.some(
        (error) => error.params?.missingProperty === "props",
      ),
      `${action} without props should fail: ${JSON.stringify(validateMap.errors)}`,
    );
  }
});

test("continuous schema accepts offsetSec and preserves maps that omit it", () => {
  const videoMap = sample();
  videoMap.scenes[0].transitions[0].offsetSec = 2;
  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));

  delete videoMap.scenes[0].transitions[0].offsetSec;
  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));
});

test("two-window continuous map with environment transform validates", () => {
  const videoMap = sample();
  videoMap.actors = [
    { id: "email", target: "environment" },
    { id: "chat", target: "chat-window" },
  ];
  videoMap.environment.props.position = { left: 80, top: 250 };
  videoMap.environment.props.scale = 0.8;
  videoMap.scenes[0].transitions.push({
    target: "chat-window",
    action: "add",
    props: {
      component: "MechanismWindow",
      variant: "chat",
      title: "Chat keigo",
      japaneseText: "承知いたしました。",
      vietnameseText: "Tôi đã hiểu.",
      state: "draft",
      showCursor: true,
      cursorBlinkFrames: 12,
      position: { left: 520, top: 720 },
      scale: 0.5,
    },
  });
  videoMap.scenes[1].transitions.push({
    target: "environment",
    action: "update",
    props: { position: { left: 40, top: 210 }, scale: 0.7 },
  });

  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));
  assert.equal(validateSemantic(videoMap).status, "pass");
});

test("declared actor target without add or update transition fails coverage", () => {
  const videoMap = sample();
  videoMap.actors = [{ id: "missing", target: "never-added" }];
  const report = validateSemantic(videoMap);

  assert.equal(report.status, "fail");
  assert.equal(
    report.results.find((item) => item.check === "actor-coverage")?.target,
    "never-added",
  );
});

test("actors elevate an empty continuous scene to beat-coverage FAIL", () => {
  const videoMap = sample();
  videoMap.actors = [{ id: "email", target: "environment" }];
  videoMap.scenes[0].durationSec = 9;
  videoMap.scenes[0].transitions = [];
  const report = validateSemantic(videoMap);

  assert.equal(
    report.results.find((item) => item.check === "beat-coverage")?.severity,
    "FAIL",
  );
  assert.equal(
    report.results.some((item) => item.check === "static-scene"),
    false,
  );
});

test("maps without actors retain the previous semantic behavior and counts", () => {
  const videoMap = sample();
  videoMap.scenes[0].durationSec = 9;
  videoMap.scenes[0].transitions = [];
  const report = validateSemantic(videoMap);

  assert.equal(report.status, "warn");
  assert.deepEqual(report.counts, { pass: 3, warn: 1, fail: 0 });
  assert.equal(
    report.results.find((item) => item.check === "static-scene")?.severity,
    "WARN",
  );
  assert.equal(
    report.results.some((item) => item.check === "beat-coverage"),
    false,
  );
});
