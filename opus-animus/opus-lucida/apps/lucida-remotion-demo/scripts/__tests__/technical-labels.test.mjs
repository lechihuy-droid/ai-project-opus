import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("technical labels are optional, default false, and passed to SceneShell", () => {
  const schema = JSON.parse(
    fs.readFileSync(path.join(root, "schemas/video-map.schema.json"), "utf8"),
  );
  assert.equal(schema.properties.debug.required, undefined);
  assert.equal(
    schema.properties.debug.properties.showTechnicalLabels.default,
    false,
  );

  const composition = fs.readFileSync(
    path.join(root, "src/Composition.tsx"),
    "utf8",
  );
  assert.match(
    composition,
    /showTechnicalLabels=\{videoMap\.debug\?\.showTechnicalLabels \?\? false\}/u,
  );

  const registry = fs.readFileSync(
    path.join(root, "src/templateRegistry.tsx"),
    "utf8",
  );
  assert.match(registry, /showTechnicalLabels \? \(/u);
  assert.match(registry, /showTechnicalLabels = false/u);
});

test("flow runs semantic QA after brand and merges details into render report", () => {
  const flow = fs.readFileSync(path.join(root, "scripts/run-flow.mjs"), "utf8");
  const brandStage = flow.indexOf('name: "validate:brand"');
  const semanticStage = flow.indexOf('name: "validate:semantic"');
  const renderStage = flow.indexOf('name: "render"');
  assert.ok(brandStage >= 0 && brandStage < semanticStage);
  assert.ok(semanticStage < renderStage);
  assert.match(flow, /renderReport\.semanticQa = report\.semanticQa/u);
  assert.match(flow, /result: report\.semanticQa/u);
});
