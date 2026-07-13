#!/usr/bin/env node

import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const renderPropsSourcePath = path.resolve(
  root,
  "pipeline/fixtures/styles/all-style-reference/render-props.json",
);
const renderProps = JSON.parse(fs.readFileSync(renderPropsSourcePath, "utf8"));
const fixturePath = path.resolve(root, renderProps.sourceFixture);
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const outputDir = path.resolve(root, renderProps.outputDir);
const framesDir = path.resolve(root, renderProps.framesDir);
const reportPath = path.resolve(root, renderProps.reportPath);
const htmlReportPath = path.resolve(root, renderProps.htmlReportPath);

const browserExecutable =
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((candidate) => fs.existsSync(candidate)) ?? null;

const projectRelative = (absolutePath) =>
  path.relative(root, absolutePath).split(path.sep).join("/");

const hashFile = (absolutePath) =>
  crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const assertPngOutput = (output) => {
  if (path.extname(output).toLowerCase() !== ".png") {
    throw new Error(`Reference render only allows PNG still outputs: ${output}`);
  }
};

const imageDimensions = (absolutePath) => {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "json",
      absolutePath,
    ],
    { cwd: root, encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "ffprobe dimensions failed");
  }

  const stream = JSON.parse(result.stdout).streams?.[0] ?? {};
  return {
    width: Number(stream.width ?? 0),
    height: Number(stream.height ?? 0),
  };
};

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

const validateFixturePlan = () => {
  const durationSeconds = fixture.durationInFrames / fixture.fps;
  const families = new Set(fixture.sequencePlan.map((sequence) => sequence.family));
  const components = new Set(
    fixture.sequencePlan.map((sequence) => sequence.component),
  );
  const declaredFamilies = new Set(fixture.familiesUsed ?? []);
  const declaredComponents = new Set(fixture.productionSceneComponentsUsed ?? []);
  const finalSequence = fixture.sequencePlan[fixture.sequencePlan.length - 1];
  const firstSequence = fixture.sequencePlan[0];
  const dominantSequences = fixture.sequencePlan.filter(
    (sequence) => sequence.family === fixture.dominantFamily,
  );
  const familyFrames = new Map();

  for (const sequence of fixture.sequencePlan) {
    familyFrames.set(
      sequence.family,
      (familyFrames.get(sequence.family) ?? 0) + sequence.durationInFrames,
    );
  }

  const dominantFrames = familyFrames.get(fixture.dominantFamily) ?? 0;
  const largestFrames = Math.max(...familyFrames.values());
  const dominantShare = dominantFrames / fixture.durationInFrames;
  const exactFamilyLimit = fixture.constraints?.maxVisualFamiliesForShort ?? 4;
  const minimumDominantShare =
    fixture.constraints?.minimumDominantFamilyShare ?? 0.5;
  const expectedEndFrame = fixture.sequencePlan.reduce(
    (maxEnd, sequence) =>
      Math.max(maxEnd, sequence.startFrame + sequence.durationInFrames),
    0,
  );
  const sequenceStartsAreContiguous = fixture.sequencePlan.every(
    (sequence, index, sequences) =>
      index === 0 ||
      sequence.startFrame ===
        sequences[index - 1].startFrame + sequences[index - 1].durationInFrames,
  );
  const declaredFamiliesMatchPlan =
    declaredFamilies.size === families.size &&
    [...families].every((family) => declaredFamilies.has(family));
  const declaredComponentsMatchPlan =
    declaredComponents.size === components.size &&
    [...components].every((component) => declaredComponents.has(component));

  return {
    durationSeconds,
    durationValid: durationSeconds >= 45 && durationSeconds <= 60,
    dimensionsValid: fixture.width === 1080 && fixture.height === 1920,
    familyCount: families.size,
    exactFamilyLimit,
    familyCountValid: families.size === exactFamilyLimit,
    declaredFamiliesMatchPlan,
    componentCount: components.size,
    componentCountValid: components.size === exactFamilyLimit,
    declaredComponentsMatchPlan,
    sequenceCoverageValid:
      fixture.sequencePlan[0]?.startFrame === 0 &&
      expectedEndFrame === fixture.durationInFrames &&
      sequenceStartsAreContiguous,
    dominantFamily: fixture.dominantFamily,
    dominantFrames,
    dominantSeconds: dominantFrames / fixture.fps,
    dominantShare: Number(dominantShare.toFixed(4)),
    minimumDominantShare,
    dominantShareValid: dominantShare >= minimumDominantShare,
    dominantIsLargest: dominantFrames === largestFrames,
    dominantOpensComposition: firstSequence.family === fixture.dominantFamily,
    dominantAppearsInOutro: finalSequence.family === fixture.dominantFamily,
    dominantSequenceIds: dominantSequences.map((sequence) => sequence.id),
    finalSequenceId: finalSequence.id,
  };
};

const writeHtmlReport = (report) => {
  const rows = report.frames
    .map(
      (frame) => `<tr>
        <td>${escapeHtml(frame.id)}</td>
        <td>${escapeHtml(frame.sequenceId)}</td>
        <td>${frame.frame}</td>
        <td>${escapeHtml(frame.output)}</td>
        <td>${frame.dimensions.width}x${frame.dimensions.height}</td>
        <td>${frame.nonBlank.passed ? "pass" : "fail"}</td>
        <td>${frame.deterministic.passed ? "pass" : "fail"}</td>
      </tr>`,
    )
    .join("");
  const sequenceCards = report.sequencePlan
    .map(
      (sequence) => `<article>
        <div>${String(sequence.order).padStart(2, "0")} / ${escapeHtml(sequence.family)}</div>
        <h2>${escapeHtml(sequence.id)}</h2>
        <p>${escapeHtml(sequence.narrativeBeat)}</p>
        <small>${escapeHtml(sequence.continuityBridge)}</small>
      </article>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.compositionId)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#101214;color:#f4efe5;font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.45;padding:40px}main{max-width:1180px;margin:0 auto}header{border-bottom:1px solid #34383d;padding-bottom:24px;margin-bottom:28px}h1{font-size:38px;line-height:1.05;margin:0 0 10px}p{color:#b8c0c2}.meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}.box,article{border:1px solid #30363b;background:#171b1f;border-radius:8px;padding:18px}.box b{display:block;font-size:22px;color:#7dd3c7}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:18px 0 30px}article div{color:#d9b66f;font-size:13px;font-weight:800;text-transform:uppercase}article h2{font-size:18px;margin:8px 0;color:#fff}article p{margin:0 0 10px}article small{color:#9aa4a7}table{width:100%;border-collapse:collapse;margin-top:18px;background:#171b1f;border:1px solid #30363b}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #30363b;font-size:13px}th{color:#d9b66f;text-transform:uppercase}.pass{color:#7dd3c7}.fail{color:#ff9b8b}
  </style></head><body><main>
  <header><h1>${escapeHtml(report.compositionId)}</h1><p>${escapeHtml(report.continuityRationale.globalNarrative)}</p></header>
  <section class="meta">
    <div class="box"><span>Status</span><b class="${report.status === "ok" ? "pass" : "fail"}">${escapeHtml(report.status)}</b></div>
    <div class="box"><span>Duration</span><b>${report.duration.seconds}s</b></div>
    <div class="box"><span>Families</span><b>${report.planEvidence.familyCount}</b></div>
    <div class="box"><span>Dominant return</span><b class="${report.planEvidence.dominantAppearsInOutro ? "pass" : "fail"}">${report.planEvidence.dominantAppearsInOutro ? "pass" : "fail"}</b></div>
  </section>
  <h2>Sequence Plan</h2><section class="grid">${sequenceCards}</section>
  <h2>Rendered Stills</h2><table><thead><tr><th>ID</th><th>Sequence</th><th>Frame</th><th>Output</th><th>Dimensions</th><th>Nonblank</th><th>Repeat SHA</th></tr></thead><tbody>${rows}</tbody></table>
  </main></body></html>`;

  fs.writeFileSync(htmlReportPath, html);
};

const main = async () => {
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir)) {
    if (file.toLowerCase().endsWith(".png")) {
      fs.rmSync(path.join(framesDir, file), { force: true });
    }
  }

  const artifactFixturePath = path.join(outputDir, "source-fixture.json");
  const artifactRenderPropsPath = path.join(outputDir, "render-props.json");
  fs.copyFileSync(fixturePath, artifactFixturePath);
  fs.copyFileSync(renderPropsSourcePath, artifactRenderPropsPath);

  for (const still of renderProps.stillFrames) {
    assertPngOutput(still.output);
  }

  const planEvidence = validateFixturePlan();
  const bundleUrl = await bundle({
    entryPoint: path.resolve(root, renderProps.entryPoint),
    webpackOverride: (config) => config,
  });
  const composition = await selectComposition({
    serveUrl: bundleUrl,
    id: renderProps.compositionId,
    browserExecutable,
    logLevel: "error",
  });

  const frames = [];
  for (const [index, still] of renderProps.stillFrames.entries()) {
    const outputPath = path.resolve(outputDir, still.output);
    const repeatPath = path.join(framesDir, `.repeat-${index + 1}.png`);
    await renderStill({
      serveUrl: bundleUrl,
      composition,
      output: outputPath,
      frame: still.frame,
      imageFormat: renderProps.imageFormat,
      overwrite: true,
      browserExecutable,
      logLevel: "error",
    });
    await renderStill({
      serveUrl: bundleUrl,
      composition,
      output: repeatPath,
      frame: still.frame,
      imageFormat: renderProps.imageFormat,
      overwrite: true,
      browserExecutable,
      logLevel: "error",
    });

    const stats = signalStats(outputPath);
    const dimensions = imageDimensions(outputPath);
    const dynamicRange = Number((stats.yHigh - stats.yLow).toFixed(2));
    const sha256 = hashFile(outputPath);
    const repeatedSha256 = hashFile(repeatPath);
    fs.rmSync(repeatPath, { force: true });

    frames.push({
      id: still.id,
      sequenceId: still.sequenceId,
      frame: still.frame,
      output: projectRelative(outputPath),
      dimensions,
      sha256,
      fileBytes: fs.statSync(outputPath).size,
      signalStats: stats,
      nonBlank: {
        passed: dynamicRange >= 8 || stats.saturationAverage >= 3,
        heuristic: "signalstats dynamic range or saturation threshold",
        dynamicRange,
      },
      deterministic: {
        passed: sha256 === repeatedSha256,
        repeatedSha256,
      },
    });
  }

  const summary = {
    renderedFrameCount: frames.length,
    nonBlankFrames: frames.filter((frame) => frame.nonBlank.passed).length,
    deterministicFrames: frames.filter((frame) => frame.deterministic.passed)
      .length,
    dimensionsValid: frames.every(
      (frame) => frame.dimensions.width === 1080 && frame.dimensions.height === 1920,
    ),
    pngOnly: frames.every((frame) => path.extname(frame.output) === ".png"),
    mp4Generated: false,
    appRootRegistered: false,
    networkAssets: false,
  };
  const status =
    planEvidence.durationValid &&
    planEvidence.dimensionsValid &&
    planEvidence.familyCountValid &&
    planEvidence.declaredFamiliesMatchPlan &&
    planEvidence.componentCountValid &&
    planEvidence.declaredComponentsMatchPlan &&
    planEvidence.sequenceCoverageValid &&
    planEvidence.dominantShareValid &&
    planEvidence.dominantIsLargest &&
    planEvidence.dominantOpensComposition &&
    planEvidence.dominantAppearsInOutro &&
    summary.renderedFrameCount === renderProps.stillFrames.length &&
    summary.nonBlankFrames === renderProps.stillFrames.length &&
    summary.deterministicFrames === renderProps.stillFrames.length &&
    summary.dimensionsValid &&
    summary.pngOnly
      ? "ok"
      : "failed";
  const report = {
    schemaVersion: "lucida-all-style-reference-render-report/v1",
    status,
    generatedAt: new Date().toISOString(),
    compositionId: renderProps.compositionId,
    renderer: {
      tool: "@remotion/bundler + @remotion/renderer renderStill",
      entryPoint: renderProps.entryPoint,
      browserExecutable,
      imageFormat: renderProps.imageFormat,
      renderMediaCalled: false,
      mp4Generated: false,
      registeredInAppRoot: false,
      networkAssets: false,
    },
    duration: {
      frames: fixture.durationInFrames,
      fps: fixture.fps,
      seconds: planEvidence.durationSeconds,
      valid45To60Seconds: planEvidence.durationValid,
    },
    dimensions: {
      width: fixture.width,
      height: fixture.height,
      valid1080x1920: planEvidence.dimensionsValid,
    },
    artifacts: {
      sourceFixture: projectRelative(artifactFixturePath),
      renderProps: projectRelative(artifactRenderPropsPath),
      jsonReport: projectRelative(reportPath),
      htmlReport: projectRelative(htmlReportPath),
      framesDir: projectRelative(framesDir),
    },
    checks: renderProps.qualityChecks,
    continuityRationale: fixture.continuityRationale,
    sequencePlan: fixture.sequencePlan,
    planEvidence,
    declaredDominantFamilyEvidence: fixture.dominantFamilyEvidence,
    frames,
    summary,
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  writeHtmlReport(report);

  process.stdout.write(
    `Reference composition ${status.toUpperCase()}: ${frames.length} PNG stills -> ${projectRelative(framesDir)}\n`,
  );

  if (status !== "ok") {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
