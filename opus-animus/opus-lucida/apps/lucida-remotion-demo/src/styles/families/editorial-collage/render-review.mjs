import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.resolve(root, "design/visual-library/styles/editorial-collage");
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const tempDir = path.join(artifactsDir, ".tmp-determinism");
const renderProps = JSON.parse(fs.readFileSync(path.join(artifactsDir, "render-props.json"), "utf8"));
const demo = JSON.parse(fs.readFileSync(path.join(artifactsDir, "demo-video-map.json"), "utf8"));
const reportPath = path.join(artifactsDir, "render-report.json");
const browserExecutable =
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((candidate) => fs.existsSync(candidate)) ?? null;

const projectRelative = (absolutePath) =>
  path.relative(root, absolutePath).split(path.sep).join("/");

const hashFile = (absolutePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");

const signalStats = (absolutePath) => {
  const escaped = absolutePath.replace(/\\/g, "/").replace(/:/g, "\\:");
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
    { cwd: root, encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "ffprobe signalstats failed");
  }
  const tags = JSON.parse(result.stdout).frames?.[0]?.tags ?? {};
  return {
    yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0),
    yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0),
    yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0),
    saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0),
  };
};

const main = async () => {
  fs.mkdirSync(framesDir, { recursive: true });
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) {
    fs.rmSync(path.join(framesDir, file), { force: true });
  }

  const serveUrl = await bundle({
    entryPoint: path.resolve(root, renderProps.entryPoint),
    webpackOverride: (config) => config,
  });
  const frames = [];

  for (const scene of demo.scenes) {
    const inputProps = { sceneKey: scene.sceneKey };
    const composition = await selectComposition({
      serveUrl,
      id: renderProps.compositionId,
      inputProps,
      browserExecutable,
      logLevel: "error",
    });
    const outputPath = path.resolve(artifactsDir, scene.output);
    const repeatPath = path.join(tempDir, `${scene.id}.png`);
    await renderStill({
      serveUrl,
      composition,
      inputProps,
      output: outputPath,
      frame: scene.frame,
      imageFormat: renderProps.imageFormat,
      overwrite: true,
      browserExecutable,
      logLevel: "error",
    });
    await renderStill({
      serveUrl,
      composition,
      inputProps,
      output: repeatPath,
      frame: scene.frame,
      imageFormat: renderProps.imageFormat,
      overwrite: true,
      browserExecutable,
      logLevel: "error",
    });

    const stats = signalStats(outputPath);
    const dynamicRange = Number((stats.yHigh - stats.yLow).toFixed(2));
    const sha256 = hashFile(outputPath);
    const repeatSha256 = hashFile(repeatPath);
    frames.push({
      id: scene.id,
      label: scene.label,
      sceneKey: scene.sceneKey,
      frame: scene.frame,
      output: projectRelative(outputPath),
      dimensions: { width: composition.width, height: composition.height },
      durationInFrames: composition.durationInFrames,
      sha256,
      fileBytes: fs.statSync(outputPath).size,
      signalStats: stats,
      nonBlank: {
        passed: dynamicRange >= 8 || stats.saturationAverage >= 3,
        heuristic: "signalstats dynamic range or saturation threshold",
        dynamicRange,
      },
      deterministicRepeat: {
        passed: sha256 === repeatSha256,
        repeatSha256,
      },
    });
  }

  fs.rmSync(tempDir, { recursive: true, force: true });

  const report = {
    status:
      frames.length === 3 &&
      frames.every((item) => item.nonBlank.passed) &&
      frames.every((item) => item.deterministicRepeat.passed)
        ? "ok"
        : "failed",
    packageId: demo.packageId,
    compositionId: renderProps.compositionId,
    generatedAt: new Date().toISOString(),
    renderer: {
      entryPoint: renderProps.entryPoint,
      browserExecutable,
      imageFormat: renderProps.imageFormat,
      rasterDependencies: false,
    },
    checks: renderProps.qualityChecks,
    assetPolicy: {
      renderableClassification: "embed_asset",
      rejectedClassifications: ["style_reference", "context_only"],
      missingAssetBehavior: "shared deliberate placeholder",
      deterministicCrop: "fixture xPercent/yPercent/zoom clamped in renderer",
    },
    frames,
    summary: {
      renderedFrameCount: frames.length,
      nonBlankFrames: frames.filter((item) => item.nonBlank.passed).length,
      deterministicFrames: frames.filter((item) => item.deterministicRepeat.passed).length,
      dimensionsValid: frames.every(
        (item) => item.dimensions.width === demo.width && item.dimensions.height === demo.height,
      ),
    },
    validation: {
      visualPackageValidatorStrict: "pending",
      typescriptNoEmit: "pending",
    },
    limitations: [
      "Shared registry and Director routing remain untouched because they are outside this ownership slice.",
      "16:9 support is metadata-ready only; this task renders portrait review frames only.",
      "Stable promotion requires human visual approval.",
    ],
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`Rendered ${frames.length} editorial-collage review frames -> ${projectRelative(framesDir)}\n`);
  if (report.status !== "ok" || !report.summary.dimensionsValid) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
