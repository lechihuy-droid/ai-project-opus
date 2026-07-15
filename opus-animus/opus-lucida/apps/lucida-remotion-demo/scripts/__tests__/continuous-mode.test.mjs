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

test("continuous schema accepts remove while legacy slides validation is unchanged", () => {
  const videoMap = sample();
  videoMap.scenes[2].transitions.unshift({
    target: "recipient-chip",
    action: "remove",
    props: {},
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

test("continuous schema accepts offsetSec and preserves maps that omit it", () => {
  const videoMap = sample();
  videoMap.scenes[0].transitions[0].offsetSec = 2;
  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));

  delete videoMap.scenes[0].transitions[0].offsetSec;
  assert.equal(validateMap(videoMap), true, JSON.stringify(validateMap.errors));
});
