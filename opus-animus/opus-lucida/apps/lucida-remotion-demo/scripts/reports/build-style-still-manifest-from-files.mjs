#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { reviewRendererRecords } from "../../src/styles/review/renderer-registry.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const reportRoot = path.join(projectRoot, "design", "reports", "style-rag-phase1-stills");
const width = 1080;
const height = 1920;
const analysisTimeoutMs = 20_000;

const fail = (message) => {
  throw new Error(`Still manifest rebuild failed: ${message}`);
};

const relativePath = (absolutePath) =>
  path.relative(projectRoot, absolutePath).split(path.sep).join("/");

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
    { cwd: projectRoot, encoding: "utf8", timeout: analysisTimeoutMs },
  );
  if (result.error?.code === "ETIMEDOUT") fail(`ffprobe timed out for ${relativePath(filePath)}`);
  if (result.status !== 0) {
    fail(`ffprobe failed for ${relativePath(filePath)}: ${result.error?.message || result.stderr || result.stdout}`);
  }
  const tags = JSON.parse(result.stdout).frames?.[0]?.tags ?? {};
  return {
    yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0),
    yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0),
    yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0),
    saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0),
  };
};

const stills = reviewRendererRecords.map((record) => {
  const outputPath = path.join(reportRoot, "stills", record.packageId, `${record.variantId}.png`);
  if (!fs.existsSync(outputPath)) fail(`${record.key}: missing PNG ${relativePath(outputPath)}`);
  const fileBytes = fs.statSync(outputPath).size;
  if (fileBytes === 0) fail(`${record.key}: empty PNG ${relativePath(outputPath)}`);
  const stats = signalStats(outputPath);
  const dynamicRange = Number((stats.yHigh - stats.yLow).toFixed(2));
  const nonBlank = dynamicRange >= 8 || stats.saturationAverage >= 3;
  if (!nonBlank) fail(`${record.key}: PNG is blank`);
  return {
    key: record.key,
    packageId: record.packageId,
    variantId: record.variantId,
    entryPoint: record.entryPoint,
    compositionId: record.compositionId,
    fixturePath: record.fixturePath,
    input: record.input,
    frame: record.frame,
    output: relativePath(outputPath),
    dimensions: { width, height },
    sha256: hashFile(outputPath),
    fileBytes,
    nonBlank: { passed: true, dynamicRange, signalStats: stats },
  };
});

const manifest = {
  schemaVersion: "lucida-style-rag-phase1-stills/v1",
  recordCount: stills.length,
  selection: { packageId: null, variantId: null },
  outputRoot: "design/reports/style-rag-phase1-stills",
  bounds: {
    bundleTimeoutMs: 120_000,
    selectTimeoutMs: 30_000,
    renderTimeoutMs: 60_000,
    analysisTimeoutMs,
  },
  stills,
};

fs.writeFileSync(path.join(reportRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Rebuilt aggregate still manifest from ${stills.length} PNG files.\n`);
