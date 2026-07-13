import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.resolve(root, "design/visual-library/styles/product-showcase");
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const renderPropsPath = path.join(artifactsDir, "render-props.json");
const demoPath = path.join(artifactsDir, "demo-video-map.json");
const reportPath = path.join(artifactsDir, "render-report.json");

const renderProps = JSON.parse(fs.readFileSync(renderPropsPath, "utf8"));
const demo = JSON.parse(fs.readFileSync(demoPath, "utf8"));

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

    const stats = signalStats(outputPath);
    const dynamicRange = Number((stats.yHigh - stats.yLow).toFixed(2));
    frames.push({
      id: scene.id,
      label: scene.label,
      sceneKey: scene.sceneKey,
      frame: scene.frame,
      output: projectRelative(outputPath),
      dimensions: {
        width: composition.width,
        height: composition.height,
      },
      durationInFrames: composition.durationInFrames,
      sha256: hashFile(outputPath),
      fileBytes: fs.statSync(outputPath).size,
      signalStats: stats,
      nonBlank: {
        passed: dynamicRange >= 8 || stats.saturationAverage >= 3,
        heuristic: "signalstats dynamic range or saturation threshold",
        dynamicRange,
      },
    });
  }

  const summary = {
    renderedFrameCount: frames.length,
    nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length,
    dimensionsValid: frames.every(
      (frame) =>
        frame.dimensions.width === demo.width &&
        frame.dimensions.height === demo.height,
    ),
    deterministicCropPolicy:
      "Fixture orientation and focalPoint are converted to object-position; only embed_asset receives a src.",
  };
  const report = {
    status:
      summary.renderedFrameCount === 3 &&
      summary.nonBlankFrames === 3 &&
      summary.dimensionsValid
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
    frames,
    summary,
    validation: {
      visualPackageValidatorStrict: "pending",
      typescriptNoEmit: "pending",
    },
    limitations: [
      "Shared registry and app-root availability remain untouched because they are outside this ownership slice.",
      "16:9 support is metadata-ready only; this task renders portrait review frames only.",
      "Review assets are original SVG data-URI UI mockups, not third-party product screenshots.",
      "Stable promotion still requires human visual approval.",
    ],
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `Rendered ${frames.length} product-showcase review frames -> ${projectRelative(framesDir)}\n`,
  );

  if (report.status !== "ok") {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
