import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { inspectPng } from "../code-walkthrough/inspect-png.mjs";

const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/news-rundown");
const artifactsDir = path.join(packageDir, "artifacts");
const read = (name) => JSON.parse(fs.readFileSync(path.join(artifactsDir, name), "utf8"));
const props = read("render-props.json");
const demo = read("demo-video-map.json");
const limits = { totalMs: 110_000, bundleMs: 30_000, browserMs: 12_000, compositionMs: 10_000, renderMs: 8_000, inspectMs: 3_000, closeMs: 3_000 };
const browserExecutable = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(fs.existsSync) ?? null;
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const asError = (error) => ({ name: error instanceof Error ? error.name : "Error", code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined, message: error instanceof Error ? error.message : String(error) });

const run = async () => {
  const startedAt = new Date().toISOString();
  const deadline = Date.now() + limits.totalMs;
  const steps = [];
  const frames = [];
  let browser;
  let usedDirectExecutableFallback = false;
  let failure = null;
  const step = async (name, requestedTimeoutMs, action) => {
    const timeoutMs = Math.min(requestedTimeoutMs, deadline - Date.now());
    if (timeoutMs <= 0) throw new Error(`Harness deadline exceeded before ${name}`);
    const entry = { name, timeoutMs, startedAt: new Date().toISOString(), status: "running" };
    steps.push(entry);
    const started = Date.now();
    let timer;
    try {
      const value = await Promise.race([Promise.resolve().then(action), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Step timed out after ${timeoutMs}ms: ${name}`)), timeoutMs); })]);
      entry.status = "ok";
      entry.durationMs = Date.now() - started;
      return value;
    } catch (error) {
      entry.status = "failed";
      entry.durationMs = Date.now() - started;
      entry.error = asError(error);
      throw error;
    } finally { clearTimeout(timer); }
  };
  try {
    const framesDir = path.join(artifactsDir, "frames");
    fs.mkdirSync(framesDir, { recursive: true });
    const serveUrl = await step("bundle", limits.bundleMs, () => bundle({ entryPoint: path.join(root, props.entryPoint), webpackOverride: (config) => config }));
    try {
      browser = await step("open-browser", limits.browserMs, () => openBrowser("chrome", { browserExecutable, logLevel: "error" }));
    } catch (error) {
      if (asError(error).code !== "EPERM" || !browserExecutable) throw error;
      usedDirectExecutableFallback = true;
      steps.push({ name: "fallback:direct-browser-executable", status: "ok", reason: "shared Chrome spawn EPERM", browserExecutable });
    }
    const browserOptions = browser ? { puppeteerInstance: browser } : { browserExecutable };
    const composition = await step("select-composition", limits.compositionMs, () => selectComposition({ serveUrl, id: props.compositionId, inputProps: { sceneKey: demo.scenes[0].sceneKey }, ...browserOptions, logLevel: "error" }));
    for (const scene of demo.scenes) {
      const output = path.join(artifactsDir, scene.output);
      await step(`render:${scene.id}`, limits.renderMs, () => renderStill({ serveUrl, composition, inputProps: { sceneKey: scene.sceneKey }, output, frame: scene.frame, imageFormat: props.imageFormat, overwrite: true, ...browserOptions, logLevel: "error" }));
      const nonBlank = await step(`inspect:${scene.id}`, limits.inspectMs, () => inspectPng(output));
      frames.push({ id: scene.id, sceneKey: scene.sceneKey, output: relative(output), dimensions: { width: nonBlank.width, height: nonBlank.height }, sha256: sha256(output), fileBytes: fs.statSync(output).size, nonBlank, deterministic: null });
    }
    const sample = demo.scenes[0];
    const repeatOutput = path.join(artifactsDir, "frames/.repeat-sample.png");
    await step("render-repeat", limits.renderMs, () => renderStill({ serveUrl, composition, inputProps: { sceneKey: sample.sceneKey }, output: repeatOutput, frame: sample.frame, imageFormat: props.imageFormat, overwrite: true, ...browserOptions, logLevel: "error" }));
    frames[0].deterministic = { passed: frames[0].sha256 === sha256(repeatOutput), repeatedSha256: sha256(repeatOutput) };
    fs.rmSync(repeatOutput, { force: true });
  } catch (error) { failure = asError(error); }
  if (browser) { try { await Promise.race([browser.close({ silent: true }), new Promise((_, reject) => setTimeout(() => reject(new Error("close browser timeout")), limits.closeMs))]); } catch (error) { failure ??= asError(error); } }
  const summary = { requestedFrames: demo.scenes.length, renderedFrames: frames.length, nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length, dimensionsValid: frames.length === demo.scenes.length && frames.every((frame) => frame.dimensions.width === demo.width && frame.dimensions.height === demo.height), repeatSampleValid: frames[0]?.deterministic?.passed === true };
  const status = !failure && summary.renderedFrames === demo.scenes.length && summary.nonBlankFrames === demo.scenes.length && summary.dimensionsValid && summary.repeatSampleValid ? "ok" : "failed";
  const report = { schemaVersion: "lucida-terra-render-review/v1", actor: "Terra", packageId: demo.packageId, compositionId: props.compositionId, status, decision: "no-approval-or-promotion", generatedAt: new Date().toISOString(), startedAt, renderer: { tool: "@remotion/bundler + @remotion/renderer", entryPoint: props.entryPoint, browserExecutable, imageFormat: props.imageFormat, strategy: usedDirectExecutableFallback ? "bundle once, direct documented Chrome executable per Remotion operation after shared-browser EPERM" : "bundle once, one Chrome instance, sequential still renders", usedDirectExecutableFallback }, bounds: limits, checks: ["five-png", "1080x1920-dimensions", "decoded-png-nonblank", "repeat-render-sha256-sample"], steps, frames, summary, failure, limitations: ["No approval, registration, promotion, renderer behavior, registry, Director, or global documentation was changed."] };
  const manifest = { schemaVersion: "lucida-terra-render-manifest/v1", actor: "Terra", packageId: demo.packageId, status, report: relative(path.join(artifactsDir, "terra-render-report.json")), files: frames.map((frame) => ({ id: frame.id, sceneKey: frame.sceneKey, output: frame.output, dimensions: frame.dimensions, sha256: frame.sha256, nonBlank: frame.nonBlank.passed })), repeatSample: frames[0]?.deterministic ?? null, failure };
  fs.writeFileSync(path.join(artifactsDir, "terra-render-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(artifactsDir, "terra-render-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Rendered ${frames.length}/${demo.scenes.length} news-rundown review frames. Status: ${status}.\n`);
  if (status !== "ok") process.exitCode = 1;
};

run().catch((error) => { process.stderr.write(`${asError(error).message}\n`); process.exitCode = 1; });
