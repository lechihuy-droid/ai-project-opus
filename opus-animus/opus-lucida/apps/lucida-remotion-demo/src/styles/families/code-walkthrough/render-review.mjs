import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { inspectPng } from "./inspect-png.mjs";

const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/code-walkthrough");
const artifactsDir = path.join(packageDir, "artifacts");
const framesDir = path.join(artifactsDir, "frames");
const reportPaths = [
  path.join(artifactsDir, "render-report.json"),
  path.join(artifactsDir, "terra-render-report.json"),
];
const manifestPath = path.join(artifactsDir, "terra-render-manifest.json");
const read = (name) => JSON.parse(fs.readFileSync(path.join(artifactsDir, name), "utf8"));
const props = read("render-props.json");
const demo = read("demo-video-map.json");
const browserExecutable = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].find(fs.existsSync) ?? null;
const limits = {
  totalMs: 110_000,
  bundleMs: 30_000,
  browserMs: 12_000,
  compositionMs: 10_000,
  renderMs: 8_000,
  inspectMs: 3_000,
  closeMs: 3_000,
};
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const projectRelative = (file) => path.relative(root, file).split(path.sep).join("/");
const errorEvidence = (error) => ({
  name: error instanceof Error ? error.name : "Error",
  code: typeof error === "object" && error !== null && "code" in error ? error.code : undefined,
  message: error instanceof Error ? error.message : String(error),
});

const run = async () => {
  const startedAt = new Date().toISOString();
  const deadline = Date.now() + limits.totalMs;
  const steps = [];
  const frames = [];
  let browser;
  let usedDirectExecutableFallback = false;
  let failure = null;
  let status = "failed";

  const writeArtifacts = () => {
    const summary = {
      requestedFrames: demo.scenes.length,
      renderedFrames: frames.length,
      nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length,
      dimensionsValid: frames.length === demo.scenes.length && frames.every((frame) => frame.dimensions.width === demo.width && frame.dimensions.height === demo.height),
      repeatSampleValid: frames[0]?.deterministic?.passed === true,
    };
    status = !failure && summary.renderedFrames === demo.scenes.length && summary.nonBlankFrames === demo.scenes.length && summary.dimensionsValid && summary.repeatSampleValid ? "ok" : "failed";
    const report = {
      schemaVersion: "lucida-terra-render-review/v1",
      actor: "Terra",
      packageId: demo.packageId,
      compositionId: props.compositionId,
      status,
      decision: "no-approval-or-promotion",
      generatedAt: new Date().toISOString(),
      startedAt,
      renderer: {
        tool: "@remotion/bundler + @remotion/renderer",
        entryPoint: props.entryPoint,
        browserExecutable,
        imageFormat: props.imageFormat,
        strategy: usedDirectExecutableFallback ? "bundle once, direct documented Chrome executable per Remotion operation after shared-browser EPERM" : "bundle once, one Chrome instance, one composition selection, sequential still renders",
        usedDirectExecutableFallback,
      },
      bounds: limits,
      checks: ["five-png", "1080x1920-dimensions", "decoded-png-nonblank", "repeat-render-sha256-sample"],
      steps,
      frames,
      summary,
      failure,
      limitations: ["No approval, registration, promotion, renderer behavior, variant metadata, registry, Director, or global documentation was changed."],
    };
    const manifest = {
      schemaVersion: "lucida-terra-render-manifest/v1",
      actor: "Terra",
      packageId: demo.packageId,
      status,
      report: projectRelative(reportPaths[1]),
      files: frames.map((frame) => ({
        id: frame.id,
        sceneKey: frame.sceneKey,
        output: frame.output,
        dimensions: frame.dimensions,
        sha256: frame.sha256,
        nonBlank: frame.nonBlank.passed,
      })),
      repeatSample: frames[0]?.deterministic ?? null,
      failure,
    };
    for (const reportPath of reportPaths) fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  };

  const step = async (name, requestedTimeoutMs, action, { respectDeadline = true } = {}) => {
    const remainingMs = deadline - Date.now();
    const timeoutMs = respectDeadline ? Math.min(requestedTimeoutMs, remainingMs) : requestedTimeoutMs;
    if (timeoutMs <= 0) throw new Error(`Harness deadline exceeded before ${name}`);
    const started = Date.now();
    const entry = { name, timeoutMs, startedAt: new Date().toISOString(), status: "running" };
    steps.push(entry);
    process.stdout.write(`[render-review] start ${name} (timeout ${timeoutMs}ms)\n`);
    let timer;
    try {
      const result = await Promise.race([
        Promise.resolve().then(action),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Step timed out after ${timeoutMs}ms: ${name}`)), timeoutMs);
        }),
      ]);
      entry.status = "ok";
      entry.durationMs = Date.now() - started;
      process.stdout.write(`[render-review] ok ${name} (${entry.durationMs}ms)\n`);
      return result;
    } catch (error) {
      entry.status = "failed";
      entry.durationMs = Date.now() - started;
      entry.error = errorEvidence(error);
      process.stderr.write(`[render-review] failed ${name}: ${entry.error.message}\n`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    fs.mkdirSync(framesDir, { recursive: true });
    for (const scene of demo.scenes) fs.rmSync(path.join(artifactsDir, scene.output), { force: true });
    const repeatOutput = path.join(framesDir, ".repeat-sample.png");
    fs.rmSync(repeatOutput, { force: true });

    const serveUrl = await step("bundle", limits.bundleMs, () => bundle({
      entryPoint: path.join(root, props.entryPoint),
      webpackOverride: (config) => config,
    }));
    try {
      browser = await step("open-browser", limits.browserMs, () => openBrowser("chrome", {
        browserExecutable,
        logLevel: "error",
      }));
    } catch (error) {
      if (errorEvidence(error).code !== "EPERM" || !browserExecutable) throw error;
      usedDirectExecutableFallback = true;
      steps.push({ name: "fallback:direct-browser-executable", status: "ok", reason: "shared Chrome spawn EPERM", browserExecutable });
    }
    const browserOptions = browser ? { puppeteerInstance: browser } : { browserExecutable };
    const firstScene = demo.scenes[0];
    const composition = await step("select-composition", limits.compositionMs, () => selectComposition({
      serveUrl,
      id: props.compositionId,
      inputProps: { sceneKey: firstScene.sceneKey },
      ...browserOptions,
      logLevel: "error",
    }));

    for (const scene of demo.scenes) {
      const output = path.join(artifactsDir, scene.output);
      const inputProps = { sceneKey: scene.sceneKey };
      await step(`render:${scene.id}`, limits.renderMs, () => renderStill({
        serveUrl,
        composition,
        inputProps,
        output,
        frame: scene.frame,
        imageFormat: props.imageFormat,
        overwrite: true,
        ...browserOptions,
        logLevel: "error",
      }));
      const nonBlank = await step(`inspect:${scene.id}`, limits.inspectMs, () => inspectPng(output));
      frames.push({
        id: scene.id,
        sceneKey: scene.sceneKey,
        frame: scene.frame,
        output: projectRelative(output),
        dimensions: { width: nonBlank.width, height: nonBlank.height },
        sha256: hash(output),
        fileBytes: fs.statSync(output).size,
        nonBlank,
        deterministic: null,
      });
    }

    const repeatScene = demo.scenes[0];
    await step(`render-repeat:${repeatScene.id}`, limits.renderMs, () => renderStill({
      serveUrl,
      composition,
      inputProps: { sceneKey: repeatScene.sceneKey },
      output: repeatOutput,
      frame: repeatScene.frame,
      imageFormat: props.imageFormat,
      overwrite: true,
      ...browserOptions,
      logLevel: "error",
    }));
    frames[0].deterministic = {
      passed: frames[0].sha256 === hash(repeatOutput),
      repeatedSha256: hash(repeatOutput),
    };
    fs.rmSync(repeatOutput, { force: true });
  } catch (error) {
    failure = errorEvidence(error);
  } finally {
    if (browser) {
      try {
        await step("close-browser", limits.closeMs, () => browser.close({ silent: true }), { respectDeadline: false });
      } catch (closeError) {
        if (!failure) failure = errorEvidence(closeError);
      }
    }
    writeArtifacts();
  }

  process.stdout.write(`Rendered ${frames.length}/${demo.scenes.length} code-walkthrough review frames. Status: ${status}.\n`);
  return status;
};

run().then((status) => {
  process.exitCode = status === "ok" ? 0 : 1;
  setImmediate(() => process.exit(process.exitCode));
}).catch((error) => {
  process.stderr.write(`${errorEvidence(error).message}\n`, () => process.exit(1));
});
