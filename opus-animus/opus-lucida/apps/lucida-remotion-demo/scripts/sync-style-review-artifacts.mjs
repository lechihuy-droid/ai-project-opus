#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectPng } from "../src/styles/families/code-walkthrough/inspect-png.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const MANIFEST_PATH = path.join(
  PROJECT_ROOT,
  "design",
  "reports",
  "style-rag-phase1-stills",
  "manifest.json",
);
const SOURCE_STILLS_ROOT = path.join(
  PROJECT_ROOT,
  "design",
  "reports",
  "style-rag-phase1-stills",
  "stills",
);
const TARGET_PACKAGE_IDS = [
  "claim-evidence",
  "code-walkthrough",
  "news-rundown",
  "interface-walkthrough",
];
const EXPECTED_RECORD_COUNT = 70;
const EXPECTED_VARIANT_COUNT = 5;
const EXPECTED_DIMENSIONS = { width: 1080, height: 1920 };

const fail = (message) => {
  throw new Error(`Style review artifact sync failed closed: ${message}`);
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const sha256 = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const relativePath = (filePath) =>
  path.relative(PROJECT_ROOT, filePath).split(path.sep).join("/");

const assertWithin = (filePath, rootPath, label) => {
  const relative = path.relative(rootPath, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} escapes ${relativePath(rootPath)}`);
  }
};

const assertExactKeys = (actual, expected, label) => {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(`${label} does not match variants.json order`);
  }
};

const assertDimensions = (inspection, label) => {
  if (
    inspection.width !== EXPECTED_DIMENSIONS.width ||
    inspection.height !== EXPECTED_DIMENSIONS.height
  ) {
    fail(
      `${label} is ${inspection.width}x${inspection.height}, expected ${EXPECTED_DIMENSIONS.width}x${EXPECTED_DIMENSIONS.height}`,
    );
  }
  if (!inspection.passed) fail(`${label} failed decoded PNG nonblank check`);
};

const parseOptions = (args) => {
  let validateOnly = false;
  let packageId = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--validate-only") {
      if (validateOnly) fail("--validate-only may only be provided once");
      validateOnly = true;
      continue;
    }

    const packageValue =
      argument === "--package"
        ? args[index + 1]
        : argument.slice("--package=".length);
    if (argument === "--package" || argument.startsWith("--package=")) {
      if (!packageValue || packageValue.startsWith("--"))
        fail("--package requires a supported package ID");
      if (packageId) fail("--package may only be provided once");
      if (!TARGET_PACKAGE_IDS.includes(packageValue)) {
        fail(`--package must be one of ${TARGET_PACKAGE_IDS.join(", ")}`);
      }
      packageId = packageValue;
      if (argument === "--package") index += 1;
      continue;
    }

    fail(`unsupported argument ${argument}`);
  }

  return {
    validateOnly,
    packageIds: packageId ? [packageId] : TARGET_PACKAGE_IDS,
  };
};

const loadPackage = (packageId, manifest) => {
  const packageDir = path.join(
    PROJECT_ROOT,
    "design",
    "visual-library",
    "styles",
    packageId,
  );
  const artifactsDir = path.join(packageDir, "artifacts");
  const variantsPath = path.join(packageDir, "variants.json");
  const demoPath = path.join(artifactsDir, "demo-video-map.json");
  const renderPropsPath = path.join(artifactsDir, "render-props.json");
  const stylePackagePath = path.join(packageDir, "style-package.json");

  for (const requiredPath of [
    variantsPath,
    demoPath,
    renderPropsPath,
    stylePackagePath,
  ]) {
    if (!fs.existsSync(requiredPath))
      fail(`${packageId}: missing ${relativePath(requiredPath)}`);
  }

  const variants = readJson(variantsPath);
  if (!Array.isArray(variants) || variants.length !== EXPECTED_VARIANT_COUNT) {
    fail(
      `${packageId}: variants.json must contain exactly ${EXPECTED_VARIANT_COUNT} variants`,
    );
  }
  const variantIds = variants.map((variant) => variant?.variantId);
  if (
    variantIds.some(
      (variantId) => typeof variantId !== "string" || variantId.length === 0,
    )
  ) {
    fail(`${packageId}: variants.json contains an invalid variantId`);
  }
  if (new Set(variantIds).size !== variantIds.length)
    fail(`${packageId}: variants.json contains duplicate variantIds`);
  if (variants.some((variant) => variant.packageId !== packageId)) {
    fail(`${packageId}: variants.json packageId mismatch`);
  }

  const demo = readJson(demoPath);
  if (
    demo.packageId !== packageId ||
    !Array.isArray(demo.scenes) ||
    demo.scenes.length !== EXPECTED_VARIANT_COUNT
  ) {
    fail(
      `${packageId}: demo-video-map.json must contain five scenes for this package`,
    );
  }
  if (
    demo.width !== EXPECTED_DIMENSIONS.width ||
    demo.height !== EXPECTED_DIMENSIONS.height
  ) {
    fail(`${packageId}: demo-video-map.json dimensions are not 1080x1920`);
  }
  assertExactKeys(
    demo.scenes.map((scene, index) => {
      const expectedId = `scene-${String(index + 1).padStart(2, "0")}`;
      const expectedOutput = `frames/${expectedId}.png`;
      if (scene.id !== expectedId || scene.output !== expectedOutput) {
        fail(
          `${packageId}: demo scene ${index + 1} does not target ${expectedOutput}`,
        );
      }
      return scene.sceneKey;
    }),
    variantIds,
    `${packageId}: demo scene keys`,
  );

  const renderProps = readJson(renderPropsPath);
  if (
    renderProps.packageId !== packageId ||
    renderProps.imageFormat !== "png"
  ) {
    fail(
      `${packageId}: render-props.json does not declare this package's PNG contract`,
    );
  }

  const stylePackage = readJson(stylePackagePath);
  const configuredReport = stylePackage.validationArtifacts?.renderReport;
  if (typeof configuredReport !== "string")
    fail(`${packageId}: missing validationArtifacts.renderReport`);
  const configuredReportPath = path.resolve(packageDir, configuredReport);
  assertWithin(
    configuredReportPath,
    artifactsDir,
    `${packageId}: configured render report`,
  );

  const records = variantIds.map((variantId, index) => {
    const matches = manifest.stills.filter(
      (record) =>
        record.packageId === packageId && record.variantId === variantId,
    );
    if (matches.length !== 1) {
      fail(
        `${packageId}:${variantId}: expected exactly one authoritative manifest record, found ${matches.length}`,
      );
    }
    const record = matches[0];
    if (
      record.key !== `${packageId}:${variantId}` ||
      record.input?.sceneKey !== variantId
    ) {
      fail(
        `${packageId}:${variantId}: manifest identity does not resolve to its variant`,
      );
    }
    if (
      record.dimensions?.width !== EXPECTED_DIMENSIONS.width ||
      record.dimensions?.height !== EXPECTED_DIMENSIONS.height ||
      record.nonBlank?.passed !== true ||
      typeof record.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/i.test(record.sha256)
    ) {
      fail(
        `${packageId}:${variantId}: manifest record fails the required rendered-still contract`,
      );
    }

    const sourcePath = path.resolve(PROJECT_ROOT, record.output);
    const expectedSourcePath = path.join(
      SOURCE_STILLS_ROOT,
      packageId,
      `${variantId}.png`,
    );
    if (sourcePath !== expectedSourcePath) {
      fail(
        `${packageId}:${variantId}: manifest output is not its canonical still path`,
      );
    }
    assertWithin(
      sourcePath,
      SOURCE_STILLS_ROOT,
      `${packageId}:${variantId}: source still`,
    );
    if (!fs.existsSync(sourcePath) || fs.statSync(sourcePath).size === 0) {
      fail(`${packageId}:${variantId}: authoritative PNG is missing or empty`);
    }
    if (sha256(sourcePath) !== record.sha256) {
      fail(
        `${packageId}:${variantId}: authoritative PNG SHA256 does not match manifest`,
      );
    }
    assertDimensions(
      inspectPng(sourcePath),
      `${packageId}:${variantId}: authoritative PNG`,
    );

    const sceneId = `scene-${String(index + 1).padStart(2, "0")}`;
    const targetPath = path.join(artifactsDir, "frames", `${sceneId}.png`);
    assertWithin(
      targetPath,
      artifactsDir,
      `${packageId}:${variantId}: target frame`,
    );
    return { record, sceneId, targetPath, sourcePath };
  });

  return {
    packageId,
    artifactsDir,
    configuredReportPath,
    renderProps,
    demo,
    records,
  };
};

const syncPackage = (packageData) => {
  const frames = packageData.records.map(
    ({ record, sceneId, sourcePath, targetPath }) => {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);

      const copiedSha256 = sha256(targetPath);
      if (copiedSha256 !== record.sha256) {
        fail(
          `${record.key}: copied PNG SHA256 does not match its authoritative source`,
        );
      }
      const inspection = inspectPng(targetPath);
      assertDimensions(inspection, `${record.key}: copied PNG`);

      return {
        id: sceneId,
        sceneKey: record.variantId,
        frame: record.frame,
        output: relativePath(targetPath),
        source: {
          manifest: relativePath(MANIFEST_PATH),
          key: record.key,
          output: record.output,
          sha256: record.sha256,
        },
        dimensions: { width: inspection.width, height: inspection.height },
        sha256: copiedSha256,
        fileBytes: fs.statSync(targetPath).size,
        nonBlank: inspection,
        deterministic: {
          passed: true,
          method: "authoritative-manifest-sha256-and-byte-for-byte-copy",
        },
      };
    },
  );

  const allFramesValid =
    frames.length === EXPECTED_VARIANT_COUNT &&
    frames.every(
      (frame) =>
        frame.dimensions.width === EXPECTED_DIMENSIONS.width &&
        frame.dimensions.height === EXPECTED_DIMENSIONS.height &&
        frame.nonBlank.passed &&
        frame.sha256 === frame.source.sha256,
    );
  if (!allFramesValid)
    fail(`${packageData.packageId}: copied frame verification failed`);

  const report = {
    schemaVersion: "lucida-terra-render-review/v1",
    actor: "Terra",
    packageId: packageData.packageId,
    compositionId: packageData.renderProps.compositionId,
    status: "ok",
    decision: "no-approval-or-promotion",
    failureMode: "none",
    generatedAt: new Date().toISOString(),
    renderer: {
      tool: "authoritative-rendered-still artifact sync",
      entryPoint: packageData.renderProps.entryPoint,
      imageFormat: "png",
      strategy:
        "verify manifest record, SHA256, decoded PNG dimensions and nonblank data; byte-for-byte copy",
      usedDirectExecutableFallback: false,
    },
    checks: [
      "five-png",
      "1080x1920-dimensions",
      "decoded-png-nonblank",
      "authoritative-manifest-sha256",
      "deterministic-byte-for-byte-copy",
    ],
    validation: {
      deterministicArtifactSync: true,
      sourceManifestRecordCount: EXPECTED_RECORD_COUNT,
      sourceManifest: relativePath(MANIFEST_PATH),
    },
    frames,
    summary: {
      requestedFrames: EXPECTED_VARIANT_COUNT,
      renderedFrames: frames.length,
      nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length,
      dimensionsValid: true,
      deterministicFrames: frames.filter((frame) => frame.deterministic.passed)
        .length,
      sourceManifestSha256Valid: true,
    },
    failure: null,
    limitations: [
      "Frames are synchronized from existing authoritative rendered PNG artifacts; this operation does not render scenes.",
      "No approval, promotion, registration, variant metadata, patterns, renderer behavior, Director, or global manifest was changed.",
    ],
  };

  const reportPaths = new Set([
    path.join(packageData.artifactsDir, "render-report.json"),
    packageData.configuredReportPath,
  ]);
  for (const reportPath of reportPaths) {
    assertWithin(
      reportPath,
      packageData.artifactsDir,
      `${packageData.packageId}: output render report`,
    );
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  return {
    packageId: packageData.packageId,
    frames: frames.length,
    reportPaths: [...reportPaths],
  };
};

const writeValidationPlan = (packages) => {
  for (const packageData of packages) {
    for (const { record, sourcePath, targetPath } of packageData.records) {
      process.stdout.write(
        `PLAN ${record.key} ${relativePath(sourcePath)} -> ${relativePath(targetPath)}\n`,
      );
    }
  }
  process.stdout.write(
    `Validated ${packages.length * EXPECTED_VARIANT_COUNT} authoritative PNG mapping(s); no package data written.\n`,
  );
};

const main = () => {
  const options = parseOptions(process.argv.slice(2));
  if (!fs.existsSync(MANIFEST_PATH))
    fail(`missing authoritative manifest ${relativePath(MANIFEST_PATH)}`);
  const manifest = readJson(MANIFEST_PATH);
  if (
    manifest.schemaVersion !== "lucida-style-rag-phase1-stills/v1" ||
    manifest.recordCount !== EXPECTED_RECORD_COUNT ||
    !Array.isArray(manifest.stills) ||
    manifest.stills.length !== EXPECTED_RECORD_COUNT
  ) {
    fail(
      `authoritative manifest must contain exactly ${EXPECTED_RECORD_COUNT} still records`,
    );
  }
  if (
    new Set(manifest.stills.map((record) => record.key)).size !==
    EXPECTED_RECORD_COUNT
  ) {
    fail("authoritative manifest has duplicate record keys");
  }

  const packages = options.packageIds.map((packageId) =>
    loadPackage(packageId, manifest),
  );
  if (options.validateOnly) {
    writeValidationPlan(packages);
    return;
  }
  const results = packages.map(syncPackage);
  for (const result of results) {
    process.stdout.write(
      `${result.packageId}: synchronized ${result.frames} authoritative PNGs and ${result.reportPaths.length} render report(s).\n`,
    );
  }
};

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
}
