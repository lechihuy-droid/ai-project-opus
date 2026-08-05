import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRunEnvelope } from "../../pipeline/contracts/visual-flow-contracts.mjs";
import {
  assertContainedPath,
  assertPassedBoundQaReport,
  checksPassed,
  evaluateAudioMetrics,
  evaluateCaptionTiming,
  evaluateContentCapacity,
  evaluateProvenanceCompleteness,
  evaluateTimedInputs,
  sha256File,
} from "../../scripts/operating-model/qa-gates.mjs";
import { acquireRenderLock, releaseRenderLock, RenderLockError } from "../../scripts/operating-model/render-lock.mjs";
import { compileVideoMap } from "../../pipeline/compilers/video-map.mjs";

const temporaryDirectory = () => fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w4-"));
const checksum = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const productionVideoMap = () => ({
  video: { width: 1080, height: 1920, fps: 30, durationSec: 2, sourceBlocks: ["fact-001"] },
  scenes: [{
    id: "scene-001",
    visualFamily: "terminal-command-center",
    headline: "A concise headline",
    subtitle: { text: "Brief supporting copy" },
    content: { lines: ["one", "two"] },
  }],
});

const normalizedInput = () => ({
  events: [{
    id: "fact-001",
    provenance: {
      sourceId: "source-001",
      sourceRef: "facts.md#one",
      sourceChecksum: checksum,
      collectorVersion: "fixture/1",
    },
  }],
});

const packageLoader = () => ({
  contentCapacity: { headlineChars: 72, bodyChars: 240, maxCodeLines: 12 },
});

const timedScript = (phrase = {}) => ({
  voiceChecksum: checksum,
  phrases: [{ phraseId: "phrase-001", startMs: 0, endMs: 1000, ...phrase }],
});

const writeQaReport = ({ directory, runId, scriptPath, mapPath, videoPath }) => {
  const qaInputPaths = {
    approvedScript: scriptPath,
    sourceVideoMap: mapPath,
    timedVideoMap: path.join(directory, "video-map.json"),
    renderProps: path.join(directory, "render-props.json"),
    timedScript: path.join(directory, "timed-script.json"),
    audio: path.join(directory, "voice.wav"),
    normalizedInput: path.join(directory, "normalized-input.json"),
  };
  for (const [name, filePath] of Object.entries(qaInputPaths)) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `fixture-${name}`);
  }
  const qaReportPath = path.join(directory, "qa-report.json");
  fs.writeFileSync(qaReportPath, `${JSON.stringify({
    schemaVersion: "lucida-qa/v1",
    runId,
    phase: "post-render",
    generatedAt: "2026-07-16T10:00:00Z",
    status: "passed",
    thresholds: { nonSilentMeanDb: -45, clippingPeakDb: -0.1, captionDriftMs: 80 },
    inputChecksums: Object.fromEntries(Object.entries(qaInputPaths).map(([name, filePath]) => [name, sha256File(filePath)])),
    renderChecksum: sha256File(videoPath),
    checks: ["audio-stream", "audio-non-silent", "audio-clipping", "caption-timing", "render-integrity"].map((id) => ({ id, status: "passed", evidence: {} })),
    audioEvidence: { ffprobeStatus: 0, ffmpegStatus: 0, volumeDetect: "fixture" },
  }, null, 2)}\n`);
  return { qaReportPath, qaInputPaths };
};

test("runtime schema validation rejects a report shape that manual QA semantics would otherwise accept", () => {
  const directory = temporaryDirectory();
  try {
    const runId = "production-w4-schema";
    const scriptPath = path.join(directory, "approved-script.json");
    const mapPath = path.join(directory, "video-map.source.json");
    const videoPath = path.join(directory, "video.mp4");
    fs.writeFileSync(scriptPath, "script");
    fs.writeFileSync(mapPath, "map");
    fs.writeFileSync(videoPath, "video");
    const { qaReportPath, qaInputPaths } = writeQaReport({ directory, runId, scriptPath, mapPath, videoPath });
    const report = JSON.parse(fs.readFileSync(qaReportPath, "utf8"));
    report.generatedAt = 42;
    fs.writeFileSync(qaReportPath, `${JSON.stringify(report)}\n`);
    assert.throws(
      () => assertPassedBoundQaReport({ qaReportPath, runId, inputPaths: qaInputPaths, renderPath: videoPath }),
      /QA report schema invalid:.*generatedAt/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("runtime accepts the generated post-render QA report shape before semantic hash rebinding", () => {
  const directory = temporaryDirectory();
  try {
    const runId = "production-w4-generated";
    const scriptPath = path.join(directory, "approved-script.json");
    const mapPath = path.join(directory, "video-map.source.json");
    const videoPath = path.join(directory, "video.mp4");
    fs.writeFileSync(scriptPath, "script");
    fs.writeFileSync(mapPath, "map");
    fs.writeFileSync(videoPath, "video");
    const { qaReportPath, qaInputPaths } = writeQaReport({ directory, runId, scriptPath, mapPath, videoPath });
    assert.equal(assertPassedBoundQaReport({ qaReportPath, runId, inputPaths: qaInputPaths, renderPath: videoPath }).status, "passed");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("silent and clipped audio are hard failures with threshold evidence", () => {
  const silent = evaluateAudioMetrics({ streamPresent: true, meanVolumeDb: Number.NEGATIVE_INFINITY, peakVolumeDb: Number.NEGATIVE_INFINITY });
  const clipped = evaluateAudioMetrics({ streamPresent: true, meanVolumeDb: -12, peakVolumeDb: -0.05 });
  assert.equal(silent.find((check) => check.id === "audio-non-silent").status, "failed");
  assert.equal(clipped.find((check) => check.id === "audio-clipping").status, "failed");
  assert.equal(clipped.find((check) => check.id === "audio-clipping").evidence.thresholdDb, -0.1);
});

test("caption timing drift is a hard failure", () => {
  const check = evaluateCaptionTiming({
    timedScript: timedScript({ renderStartMs: 100 }),
    audioDurationMs: 1000,
    fps: 30,
  });
  assert.equal(check.status, "failed");
  assert.equal(check.evidence.invalid[0].driftMs, 100);
});

test("caption timing outside audio bounds is a hard failure", () => {
  const check = evaluateCaptionTiming({
    timedScript: timedScript({ startMs: 900, endMs: 1001 }),
    audioDurationMs: 1000,
    fps: 30,
  });
  assert.equal(check.status, "failed");
  assert.equal(check.evidence.invalid[0].endMs, 1001);
});

test("selected style capacity and factual provenance are production hard gates", () => {
  const overflowMap = productionVideoMap();
  overflowMap.scenes[0].headline = "x".repeat(73);
  const capacity = evaluateContentCapacity({ videoMap: overflowMap, packageLoader });
  assert.equal(capacity[0].status, "failed");
  assert.deepEqual(capacity[0].evidence.exceeded, [{ key: "headlineChars", actual: 73, limit: 72 }]);

  const missing = evaluateProvenanceCompleteness({ videoMap: productionVideoMap(), normalizedInput: { events: [{ id: "fact-001", provenance: {} }] } });
  assert.equal(missing[0].status, "failed");
  assert.match(missing[0].message, /complete normalized provenance/);
});

test("W9 minimal-education comparison compiles actor clauses within content capacity", () => {
  const body = "Teams can reserve Sol for ambiguous work, use Terra for balanced implementation, and route bounded checks to Luna.";
  const videoMap = compileVideoMap({
    scenes: [{
      sceneId: "minimal-education-comparison",
      visualFamily: "editorial",
      legacyFamily: "editorial",
      packageId: "minimal-education",
      intent: "comparison",
      preset: "headline-stat-grid",
      durationInFrames: 120,
      title: "Model choice becomes routing policy",
      blocks: [{ text: body, sourceEventIds: ["w9-comparison"] }],
      directorSelection: { semanticInputs: { actors: ["Sol", "Terra", "Luna"] } },
    }],
  }, { projectId: "w9-comparison", fps: 30, themeId: "lucida-editorial/v1" });
  const scene = videoMap.scenes[0];
  const capacity = evaluateContentCapacity({
    videoMap,
    packageLoader: () => ({ contentCapacity: { headlineChars: 88, bodyChars: 360, maxItems: 6 } }),
  });

  assert.deepEqual(scene.content.items.map((item) => item.title), ["Sol", "Terra"]);
  assert.deepEqual(scene.content.items.map((item) => item.body), ["Reserve for ambiguous work", "Use for balanced implementation"]);
  assert.equal(capacity[0].status, "passed");
  assert.ok(capacity[0].evidence.measures.bodyChars <= 360);
});

test("valid production inputs pass all pure pre/post QA gates", () => {
  const directory = temporaryDirectory();
  try {
    const audioPath = path.join(directory, "voice.wav");
    fs.writeFileSync(audioPath, "fixture-audio");
    const audioChecksum = sha256File(audioPath);
    const preChecks = [
      ...evaluateContentCapacity({ videoMap: productionVideoMap(), packageLoader }),
      ...evaluateProvenanceCompleteness({ videoMap: productionVideoMap(), normalizedInput: normalizedInput() }),
      ...evaluateTimedInputs({ renderProps: { audio: { checksum: audioChecksum } }, timedScript: { ...timedScript(), voiceChecksum: audioChecksum }, audioPath }),
    ];
    const postChecks = [
      ...evaluateAudioMetrics({ streamPresent: true, meanVolumeDb: -18, peakVolumeDb: -1 }),
      evaluateCaptionTiming({ timedScript: timedScript(), audioDurationMs: 1000, fps: 30 }),
    ];
    assert.equal(checksPassed([...preChecks, ...postChecks]), true);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("rapid visual pilots remain schema-valid preview runs and cannot become publishable", () => {
  const rapid = {
    schemaVersion: "lucida-run/v1",
    runId: "rapid-w4-preview",
    lane: "rapid-visual-pilot",
    styleMode: "auto",
    publicationStatus: "non_publishable",
    approvalRefs: [],
  };
  assert.deepEqual(validateRunEnvelope(rapid), []);
  const errors = validateRunEnvelope({ ...rapid, publicationStatus: "publishable" });
  assert.ok(errors.includes("rapid-visual-pilot must be non_publishable"));
  assert.ok(errors.includes("publishable runs must use production lane"));
});

test("active competing render lock blocks, stale dead-PID lock recovers, owner release and containment are enforced", () => {
  const root = temporaryDirectory();
  const runRoot = path.join(root, "runs", "production-w4-lock");
  const now = new Date("2026-07-16T10:00:00Z");
  try {
    const first = acquireRenderLock({ approvedRoot: root, runRoot, runId: "production-w4-lock", pid: 1234, now: () => now, isPidAlive: () => true });
    assert.throws(
      () => acquireRenderLock({ approvedRoot: root, runRoot, runId: "production-w4-lock", pid: 5678, now: () => now, isPidAlive: () => true }),
      RenderLockError,
    );
    assert.throws(
      () => releaseRenderLock({ approvedRoot: root, runRoot, ownerToken: "wrong" }),
      /Only the render lock owner/,
    );
    const stale = acquireRenderLock({
      approvedRoot: root,
      runRoot,
      runId: "production-w4-lock",
      pid: 5678,
      now: () => new Date(now.getTime() + 31 * 60 * 1000),
      isPidAlive: () => false,
    });
    assert.equal(stale.recovered.pid, 1234);
    assert.equal(stale.release(), true);
    assert.equal(fs.existsSync(path.join(runRoot, ".render.lock")), false);
    assert.throws(
      () => acquireRenderLock({ approvedRoot: root, runRoot: path.join(root, "..", "escape"), runId: "escape", isPidAlive: () => false }),
      /escapes approved root/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("missing QA report blocks and bound input or render checksum drift invalidates QA", () => {
  const directory = temporaryDirectory();
  try {
    const runId = "production-w4-qa";
    const scriptPath = path.join(directory, "approved-script.json");
    const mapPath = path.join(directory, "video-map.source.json");
    const videoPath = path.join(directory, "video.mp4");
    fs.writeFileSync(scriptPath, "script-a");
    fs.writeFileSync(mapPath, "map-a");
    fs.writeFileSync(videoPath, "video-a");
    assert.throws(
      () => assertPassedBoundQaReport({
        qaReportPath: path.join(directory, "missing-qa-report.json"),
        runId,
        inputPaths: { approvedScript: scriptPath, sourceVideoMap: mapPath },
        renderPath: videoPath,
      }),
      /Passed bound QA report is required/,
    );
    const { qaReportPath, qaInputPaths } = writeQaReport({ directory, runId, scriptPath, mapPath, videoPath });
    assert.equal(assertPassedBoundQaReport({
      qaReportPath,
      runId,
      inputPaths: qaInputPaths,
      renderPath: videoPath,
    }).status, "passed");
    fs.appendFileSync(scriptPath, "-changed");
    assert.throws(
      () => assertPassedBoundQaReport({ qaReportPath, runId, inputPaths: qaInputPaths, renderPath: videoPath }),
      /input checksum drift: approvedScript/,
    );
    fs.writeFileSync(scriptPath, "script-a");
    fs.appendFileSync(videoPath, "-changed");
    assert.throws(
      () => assertPassedBoundQaReport({ qaReportPath, runId, inputPaths: qaInputPaths, renderPath: videoPath }),
      /render checksum drift/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("QA path containment blocks traversal", () => {
  const root = temporaryDirectory();
  try {
    assert.throws(
      () => assertContainedPath({ root, candidate: path.join(root, "..", "escape.json"), label: "QA artifact" }),
      /must be contained under/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
