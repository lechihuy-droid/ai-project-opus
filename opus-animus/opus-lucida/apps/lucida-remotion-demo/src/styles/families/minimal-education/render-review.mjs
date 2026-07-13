import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.resolve(
  root,
  "design/visual-library/styles/minimal-education",
);
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const renderPropsPath = path.join(artifactsDir, "render-props.json");
const demoPath = path.join(artifactsDir, "demo-video-map.json");
const reportPath = path.join(artifactsDir, "render-report.json");

const renderProps = JSON.parse(fs.readFileSync(renderPropsPath, "utf8"));
const demo = JSON.parse(fs.readFileSync(demoPath, "utf8"));

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const browserExecutable =
  chromeCandidates.find((candidate) => fs.existsSync(candidate)) ?? null;

const ensureCleanFrames = () => {
  fs.mkdirSync(framesDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) {
    fs.rmSync(path.join(framesDir, file), { force: true });
  }
};

const toProjectRelative = (absolutePath) =>
  path.relative(root, absolutePath).split(path.sep).join("/");

const hashFile = (absolutePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");

const ffprobeSignalStats = (absolutePath) => {
  const normalizedPath = absolutePath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const args = [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    `movie='${normalizedPath}',signalstats`,
    "-show_entries",
    "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YLOW,lavfi.signalstats.YHIGH,lavfi.signalstats.SATAVG",
    "-of",
    "json",
  ];
  const result = spawnSync("ffprobe", args, {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "ffprobe signalstats failed");
  }

  const parsed = JSON.parse(result.stdout);
  const tags = parsed.frames?.[0]?.tags ?? {};

  return {
    yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0),
    yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0),
    yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0),
    saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0),
  };
};

const buildNonBlankCheck = (stats) => ({
  passed:
    stats.yHigh - stats.yLow >= 8 || stats.saturationAverage >= 3,
  heuristic: "signalstats dynamic range or saturation threshold",
  dynamicRange: Number((stats.yHigh - stats.yLow).toFixed(2)),
});

const renderReviewStill = async ({
  bundleUrl,
  composition,
  inputProps,
  output,
  frame,
}) => {
  await renderStill({
    serveUrl: bundleUrl,
    composition,
    inputProps,
    output,
    frame,
    imageFormat: renderProps.imageFormat,
    overwrite: true,
    browserExecutable,
    logLevel: "error",
  });
};

const main = async () => {
  ensureCleanFrames();

  const bundleUrl = await bundle({
    entryPoint: path.resolve(root, renderProps.entryPoint),
    webpackOverride: (config) => config,
  });

  const frames = [];

  for (const scene of demo.scenes) {
    const fixturePath = path.resolve(root, scene.fixture);
    const inputProps = {
      scene: JSON.parse(fs.readFileSync(fixturePath, "utf8")),
    };
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: renderProps.compositionId,
      inputProps,
      browserExecutable,
      logLevel: "error",
    });
    const outputPath = path.resolve(artifactsDir, scene.output);
    const repeatPath = path.join(framesDir, `.repeat-${scene.id}.png`);

    await renderReviewStill({
      bundleUrl,
      composition,
      inputProps,
      output: outputPath,
      frame: scene.frame,
    });
    await renderReviewStill({
      bundleUrl,
      composition,
      inputProps,
      output: repeatPath,
      frame: scene.frame,
    });

    const stats = ffprobeSignalStats(outputPath);
    const nonBlank = buildNonBlankCheck(stats);
    const sha256 = hashFile(outputPath);
    const repeatedSha256 = hashFile(repeatPath);
    fs.rmSync(repeatPath, { force: true });

    frames.push({
      id: scene.id,
      label: scene.label,
      fixture: scene.fixture,
      frame: scene.frame,
      output: toProjectRelative(outputPath),
      dimensions: {
        width: composition.width,
        height: composition.height,
      },
      durationInFrames: composition.durationInFrames,
      sha256,
      fileBytes: fs.statSync(outputPath).size,
      signalStats: stats,
      nonBlank,
      deterministic: {
        passed: sha256 === repeatedSha256,
        repeatedSha256,
      },
    });
  }

  const report = {
    packageId: demo.packageId,
    compositionId: renderProps.compositionId,
    generatedAt: new Date().toISOString(),
    renderer: {
      entryPoint: renderProps.entryPoint,
      browserExecutable,
      imageFormat: renderProps.imageFormat,
    },
    checks: renderProps.qualityChecks,
    frames,
    summary: {
      renderedFrameCount: frames.length,
      nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length,
      deterministicFrames: frames.filter((frame) => frame.deterministic.passed)
        .length,
      dimensionsValid: frames.every(
        (frame) =>
          frame.dimensions.width === demo.width &&
          frame.dimensions.height === demo.height,
      ),
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(
    `Rendered ${frames.length} minimal-education review frames -> ${toProjectRelative(framesDir)}\n`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
