import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDir = path.resolve(root, "design/visual-library/styles/timeline-documentary");
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const renderProps = JSON.parse(fs.readFileSync(path.join(artifactsDir, "render-props.json"), "utf8"));
const demo = JSON.parse(fs.readFileSync(path.join(artifactsDir, "demo-video-map.json"), "utf8"));
const browserExecutable = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(fs.existsSync) ?? null;
const relative = (value) => path.relative(root, value).split(path.sep).join("/");
const hash = (value) => crypto.createHash("sha256").update(fs.readFileSync(value)).digest("hex");

const signalStats = (file) => {
  const normalized = file.replace(/\\/g, "/").replace(/:/g, "\\:");
  const result = spawnSync("ffprobe", ["-v", "error", "-f", "lavfi", "-i", `movie='${normalized}',signalstats`, "-show_entries", "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YLOW,lavfi.signalstats.YHIGH,lavfi.signalstats.SATAVG", "-of", "json"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || "ffprobe signalstats failed");
  const tags = JSON.parse(result.stdout).frames?.[0]?.tags ?? {};
  return { yAverage: Number(tags["lavfi.signalstats.YAVG"] ?? 0), yLow: Number(tags["lavfi.signalstats.YLOW"] ?? 0), yHigh: Number(tags["lavfi.signalstats.YHIGH"] ?? 0), saturationAverage: Number(tags["lavfi.signalstats.SATAVG"] ?? 0) };
};

fs.mkdirSync(framesDir, { recursive: true });
for (const file of fs.readdirSync(framesDir)) fs.rmSync(path.join(framesDir, file), { force: true });

const bundleUrl = await bundle({ entryPoint: path.resolve(root, renderProps.entryPoint), webpackOverride: (config) => config });
const frames = [];
for (const scene of demo.scenes) {
  const inputProps = { sceneKey: scene.sceneKey };
  const composition = await selectComposition({ serveUrl: bundleUrl, id: renderProps.compositionId, inputProps, browserExecutable, logLevel: "error" });
  const output = path.resolve(artifactsDir, scene.output);
  await renderStill({ serveUrl: bundleUrl, composition, inputProps, output, frame: scene.frame, imageFormat: "png", overwrite: true, browserExecutable, logLevel: "error" });
  const stats = signalStats(output);
  frames.push({ id: scene.id, label: scene.label, sceneKey: scene.sceneKey, frame: scene.frame, output: relative(output), dimensions: { width: composition.width, height: composition.height }, durationInFrames: composition.durationInFrames, sha256: hash(output), fileBytes: fs.statSync(output).size, signalStats: stats, nonBlank: { passed: stats.yHigh - stats.yLow >= 8 || stats.saturationAverage >= 3, heuristic: "signalstats dynamic range or saturation threshold", dynamicRange: Number((stats.yHigh - stats.yLow).toFixed(2)) } });
}

const report = {
  status: frames.every((frame) => frame.nonBlank.passed) ? "ok" : "failed",
  packageId: demo.packageId,
  compositionId: renderProps.compositionId,
  generatedAt: new Date().toISOString(),
  renderer: { entryPoint: renderProps.entryPoint, browserExecutable, imageFormat: "png" },
  checks: renderProps.qualityChecks,
  frames,
  summary: { renderedFrameCount: frames.length, nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length, dimensionsValid: frames.every((frame) => frame.dimensions.width === 1080 && frame.dimensions.height === 1920) },
  validation: { visualPackageValidatorStrict: "pending", typescriptNoEmit: "pending" },
  limitations: ["Shared registry and app-root availability remain untouched because they are outside this ownership slice.", "16:9 support is metadata-ready only; review rendering covers 9:16.", "Archival visuals are original CSS treatments or explicit missing-image placeholders, not historical photographs."],
};
fs.writeFileSync(path.join(artifactsDir, "render-report.json"), JSON.stringify(report, null, 2) + "\n");
process.stdout.write(`Rendered ${frames.length} timeline-documentary review frames -> ${relative(framesDir)}\n`);
