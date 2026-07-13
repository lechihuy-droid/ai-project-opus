import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.resolve(
  root,
  "design/visual-library/styles/cinematic-type",
);
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const reportPath = path.join(artifactsDir, "render-report.json");
const renderProps = JSON.parse(
  fs.readFileSync(path.join(artifactsDir, "render-props.json"), "utf8"),
);
const demo = JSON.parse(
  fs.readFileSync(path.join(artifactsDir, "demo-video-map.json"), "utf8"),
);

const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const browserExecutable =
  chromeCandidates.find((candidate) => fs.existsSync(candidate)) ?? null;

const toProjectRelative = (absolutePath) =>
  path.relative(root, absolutePath).split(path.sep).join("/");

const hashFile = (absolutePath) =>
  crypto
    .createHash("sha256")
    .update(fs.readFileSync(absolutePath))
    .digest("hex");

const readSignalStats = (absolutePath) => {
  const normalizedPath = absolutePath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const result = spawnSync(
    "ffprobe",
    [
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
    ],
    { cwd: root, encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(
      result.stderr || result.stdout || "ffprobe signalstats failed",
    );
  }

  const tags = JSON.parse(result.stdout).frames?.[0]?.tags ?? {};
  return {
    yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0),
    yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0),
    yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0),
    saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0),
  };
};

const renderScene = async ({
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
  fs.mkdirSync(framesDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) {
    fs.rmSync(path.join(framesDir, file), { force: true });
  }

  const bundleUrl = await bundle({
    entryPoint: path.resolve(root, renderProps.entryPoint),
    webpackOverride: (config) => config,
  });
  const frames = [];

  for (const [index, scene] of demo.scenes.entries()) {
    const inputProps = renderProps.propsByScene[scene.sceneKey];
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: renderProps.compositionId,
      inputProps,
      browserExecutable,
      logLevel: "error",
    });
    const outputPath = path.resolve(artifactsDir, scene.output);
    const repeatPath = path.join(framesDir, `.repeat-${index + 1}.png`);

    await renderScene({
      bundleUrl,
      composition,
      inputProps,
      output: outputPath,
      frame: scene.frame,
    });
    await renderScene({
      bundleUrl,
      composition,
      inputProps,
      output: repeatPath,
      frame: scene.frame,
    });

    const sha256 = hashFile(outputPath);
    const repeatSha256 = hashFile(repeatPath);
    fs.rmSync(repeatPath, { force: true });
    const signalStats = readSignalStats(outputPath);
    const dynamicRange = Number(
      (signalStats.yHigh - signalStats.yLow).toFixed(2),
    );

    frames.push({
      id: `scene-${String(index + 1).padStart(2, "0")}`,
      sceneKey: scene.sceneKey,
      frame: scene.frame,
      output: toProjectRelative(outputPath),
      dimensions: {
        width: composition.width,
        height: composition.height,
      },
      sha256,
      fileBytes: fs.statSync(outputPath).size,
      signalStats,
      nonBlank: {
        passed: dynamicRange >= 8 || signalStats.saturationAverage >= 3,
        heuristic: "signalstats dynamic range or saturation threshold",
        dynamicRange,
      },
      deterministic: {
        passed: sha256 === repeatSha256,
        repeatedSha256: repeatSha256,
      },
    });
  }

  const report = {
    status: frames.every(
      (frame) =>
        frame.nonBlank.passed &&
        frame.deterministic.passed &&
        frame.dimensions.width === demo.width &&
        frame.dimensions.height === demo.height,
    )
      ? "ok"
      : "failed",
    packageId: demo.packageId,
    compositionId: renderProps.compositionId,
    generatedAt: new Date().toISOString(),
    renderer: {
      tool: "@remotion/bundler + @remotion/renderer",
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
    limitations: [
      "Shared registry and visual-library index wiring are outside this family ownership scope.",
      "Only 9:16 review frames are rendered; 16:9 remains metadata-ready but unreviewed.",
      "Texture fields are deterministic CSS placeholders because no embeddable media is registered.",
    ],
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `Rendered ${frames.length} cinematic-type review frames -> ${toProjectRelative(framesDir)}\n`,
  );

  if (report.status !== "ok") {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
