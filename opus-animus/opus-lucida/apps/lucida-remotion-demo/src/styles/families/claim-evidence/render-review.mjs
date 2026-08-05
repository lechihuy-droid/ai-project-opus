import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { inspectPng } from "./inspect-png.mjs";

const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/claim-evidence");
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const readArtifact = (name) => JSON.parse(fs.readFileSync(path.join(artifactsDir, name), "utf8"));
const props = readArtifact("render-props.json");
const demo = readArtifact("demo-video-map.json");
const browserExecutable = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(fs.existsSync) ?? null;
const limits = { totalMs: 110_000, bundleMs: 30_000, browserMs: 12_000, compositionMs: 10_000, renderMs: 8_000, inspectMs: 3_000, closeMs: 3_000 };
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const projectRelative = (file) => path.relative(root, file).split(path.sep).join("/");
const errorEvidence = (error) => ({ name: error instanceof Error ? error.name : "Error", code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined, message: error instanceof Error ? error.message : String(error) });

const run = async () => {
  const startedAt = new Date().toISOString();
  const deadline = Date.now() + limits.totalMs;
  const steps = [];
  const frames = [];
  let browser;
  let usedDirectExecutableFallback = false;
  let failure = null;
  const step = async (name, requestedTimeoutMs, action, respectDeadline = true) => {
    const timeoutMs = respectDeadline ? Math.min(requestedTimeoutMs, deadline - Date.now()) : requestedTimeoutMs;
    if (timeoutMs <= 0) throw new Error(`Harness deadline exceeded before ${name}`);
    const entry = { name, timeoutMs, startedAt: new Date().toISOString(), status: "running" };
    steps.push(entry);
    let timer;
    try {
      const result = await Promise.race([Promise.resolve().then(action), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Step timed out after ${timeoutMs}ms: ${name}`)), timeoutMs); })]);
      entry.status = "ok";
      entry.durationMs = Date.now() - Date.parse(entry.startedAt);
      return result;
    } catch (error) {
      entry.status = "failed";
      entry.durationMs = Date.now() - Date.parse(entry.startedAt);
      entry.error = errorEvidence(error);
      throw error;
    } finally { clearTimeout(timer); }
  };
  const writeReport = () => {
    const summary = { requestedFrames: demo.scenes.length, renderedFrames: frames.length, nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length, dimensionsValid: frames.length === demo.scenes.length && frames.every((frame) => frame.dimensions.width === demo.width && frame.dimensions.height === demo.height), repeatSampleValid: frames[0]?.deterministic?.passed === true };
    const status = !failure && summary.renderedFrames === demo.scenes.length && summary.nonBlankFrames === demo.scenes.length && summary.dimensionsValid && summary.repeatSampleValid ? "ok" : "failed";
    const report = { schemaVersion: "lucida-terra-render-review/v1", actor: "Terra", packageId: demo.packageId, compositionId: props.compositionId, status, decision: "no-approval-or-promotion", failureMode: failure ? "fail-closed" : "none", generatedAt: new Date().toISOString(), startedAt, renderer: { tool: "@remotion/bundler + @remotion/renderer", entryPoint: props.entryPoint, browserExecutable, imageFormat: props.imageFormat, strategy: usedDirectExecutableFallback ? "bundle once, direct documented Chrome executable per Remotion operation after shared-browser EPERM" : "bundle once, one Chrome instance, one composition selection, sequential still renders", usedDirectExecutableFallback }, bounds: limits, checks: props.qualityChecks, steps, frames, summary, failure, limitations: ["No approval, registration, promotion, registry, Director, or global documentation was changed.", "A failed render is not evidence of successful visual review."] };
    fs.writeFileSync(path.join(artifactsDir, "render-report.json"), `${JSON.stringify(report, null, 2)}\n`);
    return status;
  };
  try {
    fs.mkdirSync(framesDir, { recursive: true });
    for (const scene of demo.scenes) fs.rmSync(path.join(artifactsDir, scene.output), { force: true });
    const repeatOutput = path.join(framesDir, ".repeat-sample.png");
    fs.rmSync(repeatOutput, { force: true });
    const serveUrl = await step("bundle", limits.bundleMs, () => bundle({ entryPoint: path.join(root, props.entryPoint), webpackOverride: (config) => config }));
    try {
      browser = await step("open-browser", limits.browserMs, () => openBrowser("chrome", { browserExecutable, logLevel: "error" }));
    } catch (error) {
      if (errorEvidence(error).code !== "EPERM" || !browserExecutable) throw error;
      usedDirectExecutableFallback = true;
      steps.push({ name: "fallback:direct-browser-executable", status: "ok", reason: "shared Chrome spawn EPERM", browserExecutable });
    }
    const browserOptions = browser ? { puppeteerInstance: browser } : { browserExecutable };
    const composition = await step("select-composition", limits.compositionMs, () => selectComposition({ serveUrl, id: props.compositionId, inputProps: { sceneKey: demo.scenes[0].sceneKey }, ...browserOptions, logLevel: "error" }));
    for (const scene of demo.scenes) {
      const output = path.join(artifactsDir, scene.output);
      await step(`render:${scene.id}`, limits.renderMs, () => renderStill({ serveUrl, composition, inputProps: { sceneKey: scene.sceneKey }, output, frame: scene.frame, imageFormat: props.imageFormat, overwrite: true, ...browserOptions, logLevel: "error" }));
      const nonBlank = await step(`inspect:${scene.id}`, limits.inspectMs, () => inspectPng(output));
      frames.push({ id: scene.id, sceneKey: scene.sceneKey, frame: scene.frame, output: projectRelative(output), dimensions: { width: nonBlank.width, height: nonBlank.height }, sha256: hash(output), fileBytes: fs.statSync(output).size, nonBlank, deterministic: null });
    }
    const repeatScene = demo.scenes[0];
    await step("render-repeat:scene-01", limits.renderMs, () => renderStill({ serveUrl, composition, inputProps: { sceneKey: repeatScene.sceneKey }, output: repeatOutput, frame: repeatScene.frame, imageFormat: props.imageFormat, overwrite: true, ...browserOptions, logLevel: "error" }));
    frames[0].deterministic = { passed: frames[0].sha256 === hash(repeatOutput), repeatedSha256: hash(repeatOutput) };
    fs.rmSync(repeatOutput, { force: true });
  } catch (error) {
    failure = errorEvidence(error);
  } finally {
    if (browser) try { await step("close-browser", limits.closeMs, () => browser.close({ silent: true }), false); } catch (closeError) { if (!failure) failure = errorEvidence(closeError); }
  }
  const status = writeReport();
  process.stdout.write(`Rendered ${frames.length}/${demo.scenes.length} claim-evidence review frames. Status: ${status}.\n`);
  return status;
};

run().then((status) => { process.exitCode = status === "ok" ? 0 : 1; }).catch((error) => { process.stderr.write(`${errorEvidence(error).message}\n`); process.exitCode = 1; });
