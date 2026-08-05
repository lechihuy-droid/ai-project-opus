import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  reviewRendererRecords,
  reviewRendererRegistry,
  reviewRendererRegistryKey,
  resolveReviewRenderer,
} from "../src/styles/review/renderer-registry.mjs";

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const DEFAULT_RENDER_TEMP_ROOT = "D:/lucida-remotion-artifacts/temp";
const configureRenderTemp = () => {
  const configured = process.env.LUCIDA_RENDER_TEMP?.trim();
  const renderTemp = configured || (fs.existsSync("D:/") ? DEFAULT_RENDER_TEMP_ROOT : null);
  if (!renderTemp) return null;
  fs.mkdirSync(renderTemp, { recursive: true });
  process.env.TEMP = renderTemp;
  process.env.TMP = renderTemp;
  process.env.PUPPETEER_CACHE_DIR = path.join(renderTemp, "puppeteer-cache");
  return renderTemp;
};
const REPORT_ROOT = path.join(
  PROJECT_ROOT,
  "design",
  "reports",
  "style-rag-phase1-stills",
);
const BUNDLE_TIMEOUT_MS = 120_000;
const SELECT_TIMEOUT_MS = 30_000;
const RENDER_TIMEOUT_MS = 60_000;
const ANALYSIS_TIMEOUT_MS = 20_000;
const EXPECTED_WIDTH = 1080;
const EXPECTED_HEIGHT = 1920;
const EXPECTED_PACKAGE_COUNT = 14;
const EXPECTED_VARIANT_COUNT = 70;
const EXPECTED_VARIANTS_PER_PACKAGE = 5;

const fail = (message) => {
  throw new Error(`Review still harness failed closed: ${message}`);
};

const relativePath = (absolutePath) =>
  path.relative(PROJECT_ROOT, absolutePath).split(path.sep).join("/");

const readText = (absolutePath) => fs.readFileSync(absolutePath, "utf8");

const readJson = (absolutePath) => JSON.parse(readText(absolutePath));

const pathFromProject = (projectRelativePath) => {
  const resolved = path.resolve(PROJECT_ROOT, projectRelativePath);
  const relative = path.relative(PROJECT_ROOT, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`path escapes project root: ${projectRelativePath}`);
  }
  return resolved;
};

const allFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? allFiles(entryPath) : [entryPath];
  });
};

const withTimeout = async (operation, timeoutMs, label) => {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
};

const parseArgs = (args) => {
  const options = { packageId: null, variantId: null, validateOnly: false };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--validate-only") {
      options.validateOnly = true;
      continue;
    }
    if (argument === "--package" || argument === "--variant") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        fail(`${argument} requires a value`);
      }
      options[argument === "--package" ? "packageId" : "variantId"] = value;
      index += 1;
      continue;
    }
    if (argument === "--help") {
      process.stdout.write(
        "Usage: node scripts/render-style-variant-stills.mjs [--validate-only] [--package <packageId>] [--variant <variantId>]\n",
      );
      process.exit(0);
    }
    fail(`unsupported argument: ${argument}`);
  }

  return options;
};

const packageVariantIds = (packageId) => {
  const variantPath = path.join(
    PROJECT_ROOT,
    "design",
    "visual-library",
    "styles",
    packageId,
    "variants.json",
  );
  if (!fs.existsSync(variantPath)) fail(`${packageId}: missing variants.json`);
  const variants = readJson(variantPath);
  if (!Array.isArray(variants)) fail(`${packageId}: variants.json must be an array`);
  if (variants.length !== EXPECTED_VARIANTS_PER_PACKAGE) {
    fail(`${packageId}: expected ${EXPECTED_VARIANTS_PER_PACKAGE} variants, found ${variants.length}`);
  }
  const ids = variants.map((variant) => variant?.variantId);
  if (ids.some((variantId) => typeof variantId !== "string" || !variantId)) {
    fail(`${packageId}: variants.json has a missing variantId`);
  }
  if (new Set(ids).size !== ids.length) fail(`${packageId}: duplicate variantId`);
  if (variants.some((variant) => variant.packageId !== packageId)) {
    fail(`${packageId}: variant packageId mismatch`);
  }
  return ids;
};

const validateFixture = (record) => {
  const fixturePath = pathFromProject(record.fixturePath);
  if (!fs.existsSync(fixturePath)) {
    fail(`${record.key}: missing fixture ${record.fixturePath}`);
  }

  if (record.input.kind === "scene-fixture-json") {
    const fixture = readJson(fixturePath);
    if (fixture.sceneId !== `${record.variantId}-scene`) {
      fail(`${record.key}: fixture sceneId does not resolve its variant`);
    }
    if (!fixture.sceneType) fail(`${record.key}: fixture has no sceneType`);
    return;
  }

  if (record.fixturePath.endsWith(".json")) {
    const fixture = readJson(fixturePath);
    if (fixture.key !== record.variantId) {
      fail(`${record.key}: JSON fixture key does not match variantId`);
    }
    return;
  }

  if (record.input.kind !== "scene-key" || record.input.sceneKey !== record.variantId) {
    fail(`${record.key}: scene-key props do not resolve this variant`);
  }

  const fixtureSource = readText(fixturePath);
  const quotedVariantId = `"${record.variantId}"`;
  if (!fixtureSource.includes(`key: ${quotedVariantId}`)) {
    fail(`${record.key}: fixture key does not match variantId`);
  }
};

const validateEntrypoint = (record) => {
  const entryPoint = pathFromProject(record.entryPoint);
  if (!fs.existsSync(entryPoint)) {
    fail(`${record.key}: missing entry point ${record.entryPoint}`);
  }
  const entryPointSource = readText(entryPoint);
  if (!entryPointSource.includes("registerRoot(")) {
    fail(`${record.key}: entry point does not register a Remotion root`);
  }

  const familyDirectory = path.dirname(entryPoint);
  const familySource = allFiles(familyDirectory)
    .filter((filePath) => /\.(?:ts|tsx)$/.test(filePath))
    .map(readText)
    .join("\n");
  if (!familySource.includes("<Composition") || !familySource.includes(`"${record.compositionId}"`)) {
    fail(`${record.key}: composition ${record.compositionId} is missing from ${record.entryPoint}`);
  }
};

const validateRegistry = () => {
  const records = reviewRendererRecords;
  if (records.length !== EXPECTED_VARIANT_COUNT) {
    fail(`expected ${EXPECTED_VARIANT_COUNT} registry records, found ${records.length}`);
  }
  if (Object.keys(reviewRendererRegistry).length !== EXPECTED_VARIANT_COUNT) {
    fail("registry key count does not match record count");
  }

  const styleRoot = path.join(PROJECT_ROOT, "design", "visual-library", "styles");
  const expectedPackageIds = fs
    .readdirSync(styleRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const actualPackageIds = [...new Set(records.map((record) => record.packageId))].sort();
  if (expectedPackageIds.length !== EXPECTED_PACKAGE_COUNT) {
    fail(`expected ${EXPECTED_PACKAGE_COUNT} style packages, found ${expectedPackageIds.length}`);
  }
  if (JSON.stringify(actualPackageIds) !== JSON.stringify(expectedPackageIds)) {
    fail("registry package IDs do not exactly match style packages");
  }

  const keys = new Set();
  const recordsByPackage = new Map();
  for (const record of records) {
    if (record.key !== reviewRendererRegistryKey(record.packageId, record.variantId)) {
      fail(`${record.key}: registry key does not match packageId + variantId`);
    }
    if (keys.has(record.key)) fail(`${record.key}: duplicate registry record`);
    keys.add(record.key);
    if (resolveReviewRenderer(record.packageId, record.variantId) !== record) {
      fail(`${record.key}: resolver does not return the registered record`);
    }
    if (record.entryPoint.includes("/review/")) {
      fail(`${record.key}: review registry must point to an existing family entry point`);
    }
    const packageRecords = recordsByPackage.get(record.packageId) ?? [];
    packageRecords.push(record);
    recordsByPackage.set(record.packageId, packageRecords);
    validateFixture(record);
    validateEntrypoint(record);
  }

  for (const packageId of actualPackageIds) {
    const packageRecords = recordsByPackage.get(packageId) ?? [];
    if (packageRecords.length !== EXPECTED_VARIANTS_PER_PACKAGE) {
      fail(`${packageId}: expected ${EXPECTED_VARIANTS_PER_PACKAGE} registry records, found ${packageRecords.length}`);
    }
    const registeredIds = packageRecords.map((record) => record.variantId).sort();
    const declaredIds = packageVariantIds(packageId).sort();
    if (JSON.stringify(registeredIds) !== JSON.stringify(declaredIds)) {
      fail(`${packageId}: registry variants do not exactly match variants.json`);
    }
  }

  return records;
};

const selectRecords = (records, options) => {
  const selected = records.filter(
    (record) =>
      (!options.packageId || record.packageId === options.packageId) &&
      (!options.variantId || record.variantId === options.variantId),
  );
  if (!selected.length) {
    fail(`no review records match package=${options.packageId ?? "*"} variant=${options.variantId ?? "*"}`);
  }
  return selected;
};

const inputPropsFor = (record) => {
  if (record.input.kind === "scene-key") {
    return { sceneKey: record.input.sceneKey };
  }
  if (record.input.kind === "scene-fixture-json") {
    return { [record.input.propName]: readJson(pathFromProject(record.fixturePath)) };
  }
  fail(`${record.key}: unsupported input kind ${record.input.kind}`);
};

const browserExecutable = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find((candidate) => fs.existsSync(candidate));

const hashFile = (filePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");

const signalStats = (filePath) => {
  const escaped = filePath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      `movie='${escaped}',signalstats`,
      "-show_entries",
      "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YLOW,lavfi.signalstats.YHIGH,lavfi.signalstats.SATAVG",
      "-of",
      "json",
    ],
    { cwd: PROJECT_ROOT, encoding: "utf8", timeout: ANALYSIS_TIMEOUT_MS },
  );
  if (result.error?.code === "ETIMEDOUT") {
    fail(`ffprobe timed out for ${relativePath(filePath)}`);
  }
  if (result.status !== 0) {
    fail(`ffprobe failed for ${relativePath(filePath)}: ${result.stderr || result.stdout}`);
  }
  const tags = JSON.parse(result.stdout).frames?.[0]?.tags ?? {};
  return {
    yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0),
    yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0),
    yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0),
    saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0),
  };
};

const outputPathFor = (record) => {
  const outputPath = path.join(
    REPORT_ROOT,
    "stills",
    record.packageId,
    `${record.variantId}.png`,
  );
  const relative = path.relative(REPORT_ROOT, outputPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${record.key}: output path escapes report directory`);
  }
  return outputPath;
};

const manifestPathFor = (options) => {
  const suffix = [options.packageId, options.variantId].filter(Boolean).join("--");
  return path.join(REPORT_ROOT, suffix ? `manifest--${suffix}.json` : "manifest.json");
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const records = validateRegistry();
  const selectedRecords = selectRecords(records, options);

  if (options.validateOnly) {
    process.stdout.write(
      `Validated ${records.length} review registry records; selected ${selectedRecords.length}.\n`,
    );
    return;
  }

  const renderTempRoot = configureRenderTemp();
  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  const recordsByEntryPoint = new Map();
  for (const record of selectedRecords) {
    const group = recordsByEntryPoint.get(record.entryPoint) ?? [];
    group.push(record);
    recordsByEntryPoint.set(record.entryPoint, group);
  }

  const stills = [];
  for (const [entryPoint, entryRecords] of [...recordsByEntryPoint.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const bundleUrl = await withTimeout(
      bundle({
        entryPoint: pathFromProject(entryPoint),
        webpackOverride: (config) => config,
      }),
      BUNDLE_TIMEOUT_MS,
      `bundle ${entryPoint}`,
    );

    for (const record of entryRecords) {
      const inputProps = inputPropsFor(record);
      const composition = await withTimeout(
        selectComposition({
          serveUrl: bundleUrl,
          id: record.compositionId,
          inputProps,
          browserExecutable,
          logLevel: "error",
          timeoutInMilliseconds: SELECT_TIMEOUT_MS,
        }),
        SELECT_TIMEOUT_MS,
        `select composition ${record.key}`,
      );
      if (composition.width !== EXPECTED_WIDTH || composition.height !== EXPECTED_HEIGHT) {
        fail(`${record.key}: expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, got ${composition.width}x${composition.height}`);
      }
      if (!Number.isInteger(composition.durationInFrames) || record.frame >= composition.durationInFrames) {
        fail(`${record.key}: capture frame ${record.frame} is outside duration ${composition.durationInFrames}`);
      }

      const outputPath = outputPathFor(record);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      await withTimeout(
        renderStill({
          serveUrl: bundleUrl,
          composition,
          inputProps,
          output: outputPath,
          frame: record.frame,
          imageFormat: "png",
          overwrite: true,
          browserExecutable,
          logLevel: "error",
          timeoutInMilliseconds: RENDER_TIMEOUT_MS,
        }),
        RENDER_TIMEOUT_MS,
        `render ${record.key}`,
      );
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        fail(`${record.key}: no still was written`);
      }

      const stats = signalStats(outputPath);
      const dynamicRange = Number((stats.yHigh - stats.yLow).toFixed(2));
      const nonBlank = dynamicRange >= 8 || stats.saturationAverage >= 3;
      if (!nonBlank) fail(`${record.key}: rendered still is blank`);
      stills.push({
        key: record.key,
        packageId: record.packageId,
        variantId: record.variantId,
        entryPoint: record.entryPoint,
        compositionId: record.compositionId,
        fixturePath: record.fixturePath,
        input: record.input,
        frame: record.frame,
        output: relativePath(outputPath),
        dimensions: { width: composition.width, height: composition.height },
        sha256: hashFile(outputPath),
        fileBytes: fs.statSync(outputPath).size,
        nonBlank: { passed: true, dynamicRange, signalStats: stats },
      });
    }
  }

  stills.sort((left, right) => left.key.localeCompare(right.key));
  const manifest = {
    schemaVersion: "lucida-style-rag-phase1-stills/v1",
    recordCount: stills.length,
    selection: {
      packageId: options.packageId,
      variantId: options.variantId,
    },
    outputRoot: "design/reports/style-rag-phase1-stills",
    renderTempRoot: renderTempRoot ? renderTempRoot.replaceAll("\\", "/") : null,
    bounds: {
      bundleTimeoutMs: BUNDLE_TIMEOUT_MS,
      selectTimeoutMs: SELECT_TIMEOUT_MS,
      renderTimeoutMs: RENDER_TIMEOUT_MS,
      analysisTimeoutMs: ANALYSIS_TIMEOUT_MS,
    },
    stills,
  };
  const manifestPath = manifestPathFor(options);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `Rendered ${stills.length} review stills -> ${relativePath(manifestPath)}\n`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
