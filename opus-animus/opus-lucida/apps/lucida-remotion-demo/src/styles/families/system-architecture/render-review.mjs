import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/system-architecture");
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const readArtifact = (name) => JSON.parse(fs.readFileSync(path.join(artifactsDir, name), "utf8"));
const renderProps = readArtifact("render-props.json");
const demo = readArtifact("demo-video-map.json");
const chromeCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const browserExecutable = chromeCandidates.find(fs.existsSync) ?? null;
const captureModeMinimumFrame = Object.freeze({
  "full-motion-settled": 42,
  "reduced-motion-settled": 30,
  "static-complete": 0,
});

const toProjectRelative = (absolutePath) => path.relative(root, absolutePath).split(path.sep).join("/");
const hashFile = (absolutePath) => crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");

const validateStableCapture = (scene) => {
  const minimumFrame = captureModeMinimumFrame[scene.captureMode];
  if (minimumFrame === undefined) {
    throw new Error("Unsupported captureMode for " + scene.id);
  }
  if (!Number.isInteger(scene.frame) || scene.frame < minimumFrame) {
    throw new Error("Unsettled capture frame for " + scene.id);
  }
  return { mode: scene.captureMode, minimumFrame, settled: true };
};

const signalStats = (absolutePath) => {
  const normalizedPath = absolutePath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const result = spawnSync("ffprobe", [
    "-v", "error", "-f", "lavfi", "-i", `movie='${normalizedPath}',signalstats`,
    "-show_entries", "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YLOW,lavfi.signalstats.YHIGH,lavfi.signalstats.SATAVG",
    "-of", "json",
  ], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "ffprobe signalstats failed");
  const tags = JSON.parse(result.stdout).frames?.[0]?.tags ?? {};
  return {
    yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0),
    yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0),
    yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0),
    saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0),
  };
};

const buildNonBlankCheck = (stats) => {
  const dynamicRange = Number((stats.yHigh - stats.yLow).toFixed(2));
  return {
    passed: dynamicRange >= 8 || stats.saturationAverage >= 3,
    heuristic: "signalstats dynamic range or saturation threshold",
    dynamicRange,
  };
};

const main = async () => {
  fs.mkdirSync(framesDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) fs.rmSync(path.join(framesDir, file), { force: true });

  const serveUrl = await bundle({
    entryPoint: path.join(root, renderProps.entryPoint),
    webpackOverride: (config) => config,
  });
  const frames = [];

  for (const scene of demo.scenes) {
    const capture = validateStableCapture(scene);
    const inputProps = { sceneKey: scene.sceneKey };
    const composition = await selectComposition({
      serveUrl,
      id: renderProps.compositionId,
      inputProps,
      browserExecutable,
      logLevel: "error",
    });
    const output = path.join(artifactsDir, scene.output);
    const repeat = path.join(framesDir, `.repeat-${scene.id}.png`);
    const render = (target) => renderStill({
      serveUrl,
      composition,
      inputProps,
      output: target,
      frame: scene.frame,
      imageFormat: renderProps.imageFormat,
      overwrite: true,
      browserExecutable,
      logLevel: "error",
    });

    await render(output);
    await render(repeat);
    const stats = signalStats(output);
    const sha256 = hashFile(output);
    const repeatedSha256 = hashFile(repeat);
    fs.rmSync(repeat, { force: true });
    frames.push({
      id: scene.id,
      sceneKey: scene.sceneKey,
      frame: scene.frame,
      capture,
      output: toProjectRelative(output),
      dimensions: { width: composition.width, height: composition.height },
      durationInFrames: composition.durationInFrames,
      sha256,
      fileBytes: fs.statSync(output).size,
      signalStats: stats,
      nonBlank: buildNonBlankCheck(stats),
      deterministic: { passed: sha256 === repeatedSha256, repeatedSha256 },
    });
  }

  const summary = {
    renderedFrameCount: frames.length,
    nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length,
    deterministicFrames: frames.filter((frame) => frame.deterministic.passed).length,
    settledCaptureFrames: frames.filter((frame) => frame.capture.settled).length,
    dimensionsValid: frames.every((frame) => frame.dimensions.width === demo.width && frame.dimensions.height === demo.height),
  };
  const report = {
    schemaVersion: "lucida-terra-render-review/v1",
    actor: "Terra",
    packageId: demo.packageId,
    compositionId: renderProps.compositionId,
    generatedAt: new Date().toISOString(),
    status: summary.renderedFrameCount === demo.scenes.length && summary.nonBlankFrames === demo.scenes.length && summary.deterministicFrames === demo.scenes.length && summary.settledCaptureFrames === demo.scenes.length && summary.dimensionsValid ? "ok" : "failed",
    decision: "no-approval-or-promotion",
    failureMode: "none",
    registration: "pending",
    renderer: { entryPoint: renderProps.entryPoint, browserExecutable, imageFormat: renderProps.imageFormat },
    checks: renderProps.qualityChecks,
    remediation: {
      attempt: 2,
      reviewedScenes: ["scene-02", "scene-04"],
      rootCause: "No black-canvas pixel condition was reproducible in the 1080x1920 RGB PNG evidence. The prior review-scene map named absent TypeScript fixtures, and renderer containment plus settled capture state were implicit rather than enforced.",
      fixes: ["bounded canvas and node-card sizing", "explicit text wrapping and canvas overflow containment", "fixture references aligned to JSON inputs", "settled reduced-motion and static capture frames"],
    },
    frames,
    summary,
    limitations: ["No approval, promotion, registration, registry, Director, or global documentation was changed."],
  };
  fs.writeFileSync(path.join(artifactsDir, "render-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== "ok") throw new Error("system-architecture render evidence failed quality checks");
  process.stdout.write(`Rendered ${frames.length} system-architecture draft review frames.\n`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
