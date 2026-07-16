import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildSampledStillsReport,
  parseCliArgs,
  sampleRenderedVideoStills,
  sceneMidpoints,
  technicalChecksPass,
  validateSampledStillsReport,
} from "../../scripts/operating-model/sample-rendered-video-stills.mjs";

test("scene midpoint uses timed ranges and deterministic cumulative duration fallback", () => {
  assert.deepEqual(sceneMidpoints({ scenes: [
    { id: "timed", startMs: 100, endMs: 900, durationSec: 0.8 },
    { id: "fallback", durationSec: 2 },
  ] }), [
    { sceneId: "timed", sceneIndex: 0, timingSource: "timed_video_map", startMs: 100, endMs: 900, timestampMs: 500, stillFile: "scene-001.png" },
    { sceneId: "fallback", sceneIndex: 1, timingSource: "cumulative_duration_fallback", startMs: 800, endMs: 2800, timestampMs: 1800, stillFile: "scene-002.png" },
  ]);
  assert.throws(() => sceneMidpoints({ scenes: [{ id: "invalid" }] }), /no valid timed range/);
});

test("sampled-stills report only passes when every technical check passes", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-sampled-stills-report-"));
  try {
    const videoPath = path.join(directory, "video.mp4");
    fs.writeFileSync(videoPath, "final-video");
    const checks = {
      extractedFromFinalMp4: { passed: true }, pngExists: true,
      pngBytes: { passed: true }, dimensions: { passed: true },
    };
    const report = buildSampledStillsReport({ runId: "run-001", videoPath, expectedWidth: 1080, expectedHeight: 1920, samples: [{ status: "technical_pass", checks }] });
    assert.equal(report.status, "technical_pass");
    assert.deepEqual(validateSampledStillsReport(report), []);
    report.samples[0].checks.dimensions.passed = false;
    assert.deepEqual(validateSampledStillsReport(report), ["status must reflect all sample technical checks"]);
    report.status = "technical_fail";
    assert.deepEqual(validateSampledStillsReport(report), []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("technical checks accept boolean pngExists when every check passes", () => {
  const checks = {
    extractedFromFinalMp4: { passed: true },
    pngExists: true,
    pngBytes: { passed: true },
    dimensions: { passed: true },
  };
  assert.equal(technicalChecksPass(checks), true);
  assert.equal(technicalChecksPass({ ...checks, pngExists: false }), false);
});

test("unsafe run paths and an existing stills directory fail before ffmpeg", (t) => {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-sampled-stills-"));
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-sampled-stills-outside-"));
  try {
    const runId = "run-001";
    const runDir = path.join(appRoot, "output", "render", "flow-runs", runId);
    fs.mkdirSync(path.join(runDir, "stills"), { recursive: true });
    fs.writeFileSync(path.join(runDir, "video.mp4"), "not a real render");
    fs.writeFileSync(path.join(runDir, "video-map.json"), JSON.stringify({ video: { width: 1080, height: 1920 }, scenes: [{ id: "one", durationSec: 1 }] }));
    assert.throws(() => sampleRenderedVideoStills({ appRoot, runId: "../escape" }), /Invalid --run-id/);
    assert.throws(() => sampleRenderedVideoStills({ appRoot, runId }), /Refusing to overwrite existing stills directory/);
    assert.throws(() => parseCliArgs(["--run-id", runId, "--run-id", "other"]), /Usage:/);

    const linkedRun = path.join(appRoot, "output", "render", "flow-runs", "linked-run");
    try {
      fs.symlinkSync(outsideRoot, linkedRun, "junction");
      assert.throws(() => sampleRenderedVideoStills({ appRoot, runId: "linked-run" }), /through a symlink/);
    } catch (error) {
      if (!['EPERM', 'EACCES', 'ENOTSUP', 'EINVAL'].includes(error?.code)) throw error;
      t.diagnostic(`OS disallows junction creation; symlink-containment assertion skipped: ${error.code}`);
    }
  } finally {
    fs.rmSync(appRoot, { recursive: true, force: true });
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  }
});
