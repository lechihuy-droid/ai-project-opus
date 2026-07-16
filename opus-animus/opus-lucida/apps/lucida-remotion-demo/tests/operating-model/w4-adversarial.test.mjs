import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assertPassedBoundQaReport,
  evaluateAudioMetrics,
  evaluateCaptionTiming,
  evaluateContentCapacity,
  evaluateProvenanceCompleteness,
  evaluateTimedInputs,
  probeRenderIntegrity,
  sha256File,
} from "../../scripts/operating-model/qa-gates.mjs";
import { acquireRenderLock, RenderLockError } from "../../scripts/operating-model/render-lock.mjs";
import { finalizeProductionEnvelope } from "../../scripts/operating-model/orchestration.mjs";

const root = process.cwd();
const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w4-adversarial-"));
const checksum = "sha256:" + "a".repeat(64);

const videoMap = (overrides = {}) => ({
  video: { width: 1080, height: 1920, fps: 30, durationSec: 2, sourceBlocks: ["fact-001"] },
  scenes: [{
    id: "scene-001",
    visualFamily: "terminal-command-center",
    headline: "A short headline",
    content: { lines: ["one"] },
  }],
  ...overrides,
});

const normalizedInput = (provenance = {
  sourceId: "source-001",
  sourceRef: "facts.md#one",
  sourceChecksum: checksum,
  collectorVersion: "fixture/1",
}) => ({ events: [{ id: "fact-001", provenance }] });

const timedScript = (phrase = {}) => ({
  voiceChecksum: checksum,
  phrases: [{ phraseId: "phrase-001", startMs: 0, endMs: 1000, ...phrase }],
});

test("pre-render rejects missing package, no scenes, partial provenance, and actual audio checksum mismatch", () => {
  const packageSpec = { contentCapacity: { headlineChars: 72 } };
  assert.equal(evaluateContentCapacity({ videoMap: videoMap(), packageLoader: () => null })[0].status, "failed");
  assert.equal(evaluateContentCapacity({ videoMap: { video: videoMap().video, scenes: [] }, packageLoader: () => packageSpec })[0].status, "failed");
  assert.equal(evaluateProvenanceCompleteness({ videoMap: videoMap(), normalizedInput: normalizedInput({ sourceId: "source-001" }) })[0].status, "failed");

  const directory = tempDir();
  try {
    const missingChecks = evaluateTimedInputs({
      renderProps: {},
      timedScript: {},
      audioPath: path.join(directory, "missing-voice.wav"),
    });
    assert.equal(missingChecks.find((check) => check.id === "timed-input:audio").status, "failed");
    assert.equal(missingChecks.find((check) => check.id === "timed-input:phrases").status, "failed");
    const audioPath = path.join(directory, "voice.wav");
    fs.writeFileSync(audioPath, "audio-bytes-do-not-match");
    const checks = evaluateTimedInputs({
      renderProps: { audio: { checksum } },
      timedScript: timedScript(),
      audioPath,
    });
    assert.equal(checks.find((check) => check.id === "timed-input:audio-checksum").status, "failed");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("post-render audio threshold boundaries are failures", () => {
  const checks = evaluateAudioMetrics({ streamPresent: true, meanVolumeDb: -45, peakVolumeDb: -0.1 });
  assert.equal(checks.find((check) => check.id === "audio-non-silent").status, "failed");
  assert.equal(checks.find((check) => check.id === "audio-clipping").status, "failed");
});

test("post-render rejects missing captions and negative caption bounds", () => {
  assert.equal(evaluateCaptionTiming({ timedScript: { phrases: [] }, audioDurationMs: 1000, fps: 30 }).status, "failed");
  assert.equal(evaluateCaptionTiming({ timedScript: timedScript({ startMs: -1 }), audioDurationMs: 1000, fps: 30 }).status, "failed");
});

test("post-render frame integrity failure is explicit for a corrupt video", () => {
  const directory = tempDir();
  try {
    const videoPath = path.join(directory, "corrupt.mp4");
    fs.writeFileSync(videoPath, "not an mp4");
    const check = probeRenderIntegrity({ videoPath, expectedVideo: videoMap().video });
    assert.equal(check.id, "render-integrity");
    assert.equal(check.status, "failed");
    assert.match(check.message, /integrity checks/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

const boundFixture = ({ fullInputChecksums = true, checkStatus = "passed", phase = "post-render" } = {}) => {
  const directory = tempDir();
  const files = {
    approvedScript: path.join(directory, "approved-script.json"),
    sourceVideoMap: path.join(directory, "video-map.source.json"),
    timedVideoMap: path.join(directory, "video-map.json"),
    renderProps: path.join(directory, "render-props.json"),
    timedScript: path.join(directory, "timed-script.json"),
    audio: path.join(directory, "voice.wav"),
    normalizedInput: path.join(directory, "normalized-input.json"),
    render: path.join(directory, "video.mp4"),
  };
  for (const [name, filePath] of Object.entries(files)) fs.writeFileSync(filePath, name);
  const runId = "production-w4-bound";
  const inputChecksums = fullInputChecksums
    ? Object.fromEntries(Object.entries(files).filter(([name]) => name !== "render").map(([name, filePath]) => [name, sha256File(filePath)]))
    : { approvedScript: sha256File(files.approvedScript), sourceVideoMap: sha256File(files.sourceVideoMap) };
  const qaReportPath = path.join(directory, "qa-report.json");
  fs.writeFileSync(qaReportPath, JSON.stringify({
    schemaVersion: "lucida-qa/v1",
    runId,
    phase,
    generatedAt: "2026-07-16T10:00:00Z",
    status: "passed",
    inputChecksums,
    renderChecksum: sha256File(files.render),
    checks: [{ id: "fixture", status: checkStatus, evidence: {} }],
  }));
  return { directory, files, runId, qaReportPath };
};

test("bound QA rejects a forged passed report that omits required input hashes", () => {
  const fixture = boundFixture({ fullInputChecksums: false });
  try {
    assert.throws(
      () => assertPassedBoundQaReport({
        qaReportPath: fixture.qaReportPath,
        runId: fixture.runId,
        inputPaths: fixture.files,
        renderPath: fixture.files.render,
      }),
      /QA report input checksum drift: (timedVideoMap|renderProps|timedScript|audio|normalizedInput)/,
    );
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("bound QA rejects a passed report with correct three hashes but empty checks", () => {
  const fixture = boundFixture({ fullInputChecksums: false });
  const report = JSON.parse(fs.readFileSync(fixture.qaReportPath, "utf8"));
  report.renderChecksum = sha256File(fixture.files.render);
  report.checks = [];
  fs.writeFileSync(fixture.qaReportPath, JSON.stringify(report));
  try {
    assert.throws(
      () => assertPassedBoundQaReport({
        qaReportPath: fixture.qaReportPath,
        runId: fixture.runId,
        inputPaths: {
          approvedScript: fixture.files.approvedScript,
          sourceVideoMap: fixture.files.sourceVideoMap,
        },
        renderPath: fixture.files.render,
      }),
      /checks|passed QA report/i,
    );
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("finalization rejects pre-render or failed-check reports even when status says passed", () => {
  const fixture = boundFixture({ fullInputChecksums: true, phase: "pre-render", checkStatus: "failed" });
  const envelope = {
    schemaVersion: "lucida-run/v1",
    runId: fixture.runId,
    lane: "production",
    styleMode: "auto",
    publicationStatus: "promotion_pending",
    approvalRefs: ["treatment", "map"],
  };
  const approvals = [
    { schemaVersion: "lucida-approval/v1", approvalId: "treatment", runId: fixture.runId, kind: "visual-treatment", status: "approved", artifactHash: sha256File(fixture.files.approvedScript), approvedBy: "qa", approvedAt: "2026-07-16T10:00:00Z" },
    { schemaVersion: "lucida-approval/v1", approvalId: "map", runId: fixture.runId, kind: "video-map", status: "approved", artifactHash: sha256File(fixture.files.sourceVideoMap), approvedBy: "qa", approvedAt: "2026-07-16T10:00:00Z" },
    { schemaVersion: "lucida-approval/v1", approvalId: "final", runId: fixture.runId, kind: "final-video", status: "approved", artifactHash: sha256File(fixture.files.render), approvedBy: "qa", approvedAt: "2026-07-16T10:00:00Z" },
  ];
  try {
    assert.throws(
      () => finalizeProductionEnvelope({
        envelope,
        approvals,
        scriptPath: fixture.files.approvedScript,
        videoMapPath: fixture.files.sourceVideoMap,
        videoPath: fixture.files.render,
        qaReportPath: fixture.qaReportPath,
      }),
      /post-render|failed check|QA report/i,
    );
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test("qa-report schema rejects a post-render report without the required hashes", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(root, "pipeline", "schemas", "qa-report.schema.json"), "utf8"));
  const validate = new Ajv2020({ strict: false }).compile(schema);
  const forged = {
    schemaVersion: "lucida-qa/v1",
    runId: "production-w4-forged",
    phase: "post-render",
    generatedAt: "2026-07-16T10:00:00Z",
    status: "passed",
    inputChecksums: { approvedScript: checksum, sourceVideoMap: checksum },
    checks: [{ id: "fixture", status: "passed", evidence: {} }],
  };
  assert.equal(validate(forged), false, JSON.stringify(validate.errors));
});

test("malformed young render locks remain blocking", () => {
  const rootDir = tempDir();
  const runRoot = path.join(rootDir, "runs", "malformed-young");
  const lockDir = path.join(runRoot, ".render.lock");
  try {
    fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(path.join(lockDir, "owner.json"), "{not-json");
    assert.throws(
      () => acquireRenderLock({
        approvedRoot: rootDir,
        runRoot,
        runId: "malformed-young",
        now: () => new Date("2026-07-16T10:00:00Z"),
        isPidAlive: () => false,
      }),
      RenderLockError,
    );
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("one-render lock scope blocks different run roots under one approved root", () => {
  const rootDir = tempDir();
  const now = new Date("2026-07-16T10:00:00Z");
  try {
    const first = acquireRenderLock({
      approvedRoot: rootDir,
      runRoot: path.join(rootDir, "runs", "run-a"),
      runId: "run-a",
      now: () => now,
      isPidAlive: () => true,
    });
    try {
      assert.throws(
        () => acquireRenderLock({
          approvedRoot: rootDir,
          runRoot: path.join(rootDir, "runs", "run-b"),
          runId: "run-b",
          now: () => now,
          isPidAlive: () => true,
        }),
        RenderLockError,
      );
    } finally {
      first.release();
    }
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("a live old render lock cannot be recovered", () => {
  const rootDir = tempDir();
  const runRoot = path.join(rootDir, "runs", "live-old");
  const acquiredAt = new Date("2026-07-16T08:00:00Z");
  try {
    const first = acquireRenderLock({
      approvedRoot: rootDir,
      runRoot,
      runId: "live-old",
      now: () => acquiredAt,
      isPidAlive: () => true,
    });
    try {
      assert.throws(
        () => acquireRenderLock({
          approvedRoot: rootDir,
          runRoot,
          runId: "live-old",
          now: () => new Date("2026-07-16T10:00:00Z"),
          isPidAlive: () => true,
        }),
        RenderLockError,
      );
    } finally {
      first.release();
    }
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test("render lock rejects a run root whose realpath escapes the approved root", (t) => {
  const rootDir = tempDir();
  const outsideDir = tempDir();
  const link = path.join(rootDir, "linked-run-root");
  try {
    try {
      fs.symlinkSync(outsideDir, link, "junction");
    } catch (error) {
      t.skip(`directory symlinks unavailable: ${error.code ?? error.message}`);
      return;
    }
    assert.throws(
      () => acquireRenderLock({ approvedRoot: rootDir, runRoot: path.join(link, "run"), runId: "symlink-escape" }),
      /escapes approved root/,
    );
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
});

test("all three render wrappers release their lock from finally", () => {
  for (const file of ["scripts/render-run.mjs", "scripts/render-generated-video.mjs", "scripts/render-scene-stills.mjs"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(source, /acquireRenderLock/);
    assert.match(source, /finally\s*\{[\s\S]*renderLock(?:\?\.|\.)release\(\)/);
  }
});

test("flow:run validates run ID before reading any supplied paths", () => {
  const result = spawnSync(process.execPath, [
    path.join(root, "scripts", "run-flow.mjs"),
    "--script", "missing-approved-script.json",
    "--video-map", "missing-video-map.json",
    "--run-envelope", "missing-envelope.json",
    "--approvals", "missing-approvals.json",
    "--run-id", "../w4-invalid",
  ], { cwd: root, encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Invalid|may contain only/);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /approvals do not exist|run envelope does not exist/);
});
