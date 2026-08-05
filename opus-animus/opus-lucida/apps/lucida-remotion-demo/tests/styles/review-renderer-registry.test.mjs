import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  reviewRendererRecords,
  reviewRendererRegistry,
  reviewRendererRegistryKey,
  resolveReviewRenderer,
} from "../../src/styles/review/renderer-registry.mjs";

const APP_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const EXPECTED_PACKAGE_COUNT = 14;
const EXPECTED_VARIANT_COUNT = 70;
const EXPECTED_VARIANTS_PER_PACKAGE = 5;

const source = (projectRelativePath) =>
  fs.readFileSync(path.join(APP_ROOT, projectRelativePath), "utf8");

const filesBelow = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
  });

test("review renderer registry contains exactly 14 packages and 70 keyed records", () => {
  assert.equal(reviewRendererRecords.length, EXPECTED_VARIANT_COUNT);
  assert.equal(Object.keys(reviewRendererRegistry).length, EXPECTED_VARIANT_COUNT);

  const packageIds = [...new Set(reviewRendererRecords.map((record) => record.packageId))];
  assert.equal(packageIds.length, EXPECTED_PACKAGE_COUNT);
  for (const packageId of packageIds) {
    assert.equal(
      reviewRendererRecords.filter((record) => record.packageId === packageId).length,
      EXPECTED_VARIANTS_PER_PACKAGE,
      packageId,
    );
  }

  for (const record of reviewRendererRecords) {
    assert.equal(record.key, reviewRendererRegistryKey(record.packageId, record.variantId));
    assert.equal(resolveReviewRenderer(record.packageId, record.variantId), record);
  }
});

test("every review mapping resolves its declared variant, fixture, entry point, and composition", () => {
  const idsByPackage = new Map();
  for (const record of reviewRendererRecords) {
    const stylePackagePath = path.join(
      APP_ROOT,
      "design",
      "visual-library",
      "styles",
      record.packageId,
      "variants.json",
    );
    const variantIds = idsByPackage.get(record.packageId) ?? new Set(
      JSON.parse(fs.readFileSync(stylePackagePath, "utf8")).map((variant) => variant.variantId),
    );
    idsByPackage.set(record.packageId, variantIds);
    assert.ok(variantIds.has(record.variantId), `${record.key}: variants.json`);

    const fixturePath = path.join(APP_ROOT, record.fixturePath);
    assert.ok(fs.existsSync(fixturePath), `${record.key}: fixture`);
    if (record.input.kind === "scene-fixture-json") {
      const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
      assert.equal(fixture.sceneId, `${record.variantId}-scene`, `${record.key}: JSON fixture`);
      assert.equal(record.input.propName, "scene", `${record.key}: JSON prop`);
    } else if (record.fixturePath.endsWith(".json")) {
      const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
      assert.equal(fixture.key, record.variantId, `${record.key}: JSON fixture key`);
      assert.deepEqual(record.input, { kind: "scene-key", sceneKey: record.variantId });
    } else {
      assert.deepEqual(record.input, { kind: "scene-key", sceneKey: record.variantId });
      assert.match(fs.readFileSync(fixturePath, "utf8"), new RegExp(`key:\\s*["']${record.variantId}["']`));
    }

    const entryPointPath = path.join(APP_ROOT, record.entryPoint);
    assert.ok(fs.existsSync(entryPointPath), `${record.key}: entry point`);
    assert.match(fs.readFileSync(entryPointPath, "utf8"), /registerRoot\(/);
    const familySources = filesBelow(path.dirname(entryPointPath))
      .filter((filePath) => /\.(?:ts|tsx)$/.test(filePath))
      .map((filePath) => fs.readFileSync(filePath, "utf8"))
      .join("\n");
    assert.match(familySources, /<Composition/);
    assert.ok(familySources.includes(`"${record.compositionId}"`), `${record.key}: composition`);
  }
});

test("production RuntimeStyleRenderer and Director modules do not import or read the review registry", () => {
  const productionModules = [
    "src/Composition.tsx",
    "src/styles/runtime/RuntimeStyleRenderer.tsx",
    "src/styles/runtime/index.ts",
    "pipeline/director/load-production-director.mjs",
    "pipeline/director/evaluate-candidates.mjs",
    "pipeline/director/style-identifiers.mjs",
    "pipeline/mappers/map-scenes.mjs",
  ];
  const forbiddenReviewReference = /styles[\\/]review|reviewRendererRegistry|review-renderer-registry/;

  for (const modulePath of productionModules) {
    assert.doesNotMatch(source(modulePath), forbiddenReviewReference, modulePath);
  }
});
