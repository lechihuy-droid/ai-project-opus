#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const MINIMUM_PNG_BYTES = 1024;

const isContained = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

const assertValidRunId = (runId) => {
  if (!RUN_ID_PATTERN.test(runId ?? "")) throw new Error("Invalid --run-id");
};

const assertExistingPathInside = ({ root, candidate, label, type }) => {
  const lexicalRoot = path.resolve(root);
  const lexicalCandidate = path.resolve(candidate);
  if (!isContained(lexicalRoot, lexicalCandidate)) throw new Error(`${label} escapes output/render/flow-runs`);

  const stat = fs.statSync(lexicalCandidate, { throwIfNoEntry: false });
  if (!stat || (type === "file" ? !stat.isFile() : !stat.isDirectory())) {
    throw new Error(`${label} does not exist: ${lexicalCandidate}`);
  }

  const realRoot = fs.realpathSync(lexicalRoot);
  const realCandidate = fs.realpathSync(lexicalCandidate);
  if (!isContained(realRoot, realCandidate)) throw new Error(`${label} escapes output/render/flow-runs through a symlink`);
  return realCandidate;
};

export const sceneMidpoints = (videoMap) => {
  if (!Array.isArray(videoMap?.scenes) || videoMap.scenes.length === 0) {
    throw new Error("timed video-map.json must contain at least one scene");
  }

  let cumulativeMs = 0;
  return videoMap.scenes.map((scene, index) => {
    const sceneId = typeof scene?.id === "string" && scene.id.trim() ? scene.id : `scene-${index + 1}`;
    const durationMs = Number.isFinite(scene?.durationSec) && scene.durationSec > 0
      ? scene.durationSec * 1000
      : null;
    const hasTimedRange = Number.isFinite(scene?.startMs) && Number.isFinite(scene?.endMs) && scene.endMs > scene.startMs;
    const startMs = hasTimedRange ? scene.startMs : cumulativeMs;
    const endMs = hasTimedRange ? scene.endMs : cumulativeMs + durationMs;
    if (!Number.isFinite(endMs) || endMs <= startMs) {
      throw new Error(`scene "${sceneId}" has no valid timed range or positive durationSec fallback`);
    }
    cumulativeMs += durationMs ?? (endMs - startMs);
    return {
      sceneId,
      sceneIndex: index,
      timingSource: hasTimedRange ? "timed_video_map" : "cumulative_duration_fallback",
      startMs,
      endMs,
      timestampMs: Math.round(((startMs + endMs) / 2) * 1000) / 1000,
      stillFile: `scene-${String(index + 1).padStart(3, "0")}.png`,
    };
  });
};

const parseProbeDimensions = (stdout) => {
  const probe = JSON.parse(stdout);
  const stream = probe?.streams?.find((candidate) => candidate?.codec_type === "video") ?? probe?.streams?.[0];
  return { width: stream?.width, height: stream?.height };
};

const runCommand = (command, args) => spawnSync(command, args, { encoding: "utf8", windowsHide: true });

export const technicalChecksPass = (checks) =>
  checks?.extractedFromFinalMp4?.passed === true &&
  checks?.pngExists === true &&
  checks?.pngBytes?.passed === true &&
  checks?.dimensions?.passed === true;

const checkStill = ({ videoPath, stillPath, expectedWidth, expectedHeight, timestampMs }) => {
  const extraction = runCommand("ffmpeg", [
    "-v", "error", "-nostdin", "-ss", (timestampMs / 1000).toFixed(6), "-i", videoPath,
    "-frames:v", "1", "-c:v", "png", stillPath,
  ]);
  const pngStat = fs.statSync(stillPath, { throwIfNoEntry: false });
  const probe = pngStat?.isFile()
    ? runCommand("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", stillPath])
    : null;
  let dimensions = null;
  try {
    dimensions = probe?.status === 0 ? parseProbeDimensions(probe.stdout) : null;
  } catch {
    dimensions = null;
  }

  const checks = {
    extractedFromFinalMp4: { passed: extraction.status === 0, exitCode: extraction.status, error: extraction.error?.message ?? null },
    pngExists: Boolean(pngStat?.isFile()),
    pngBytes: { actual: pngStat?.size ?? 0, minimum: MINIMUM_PNG_BYTES, passed: (pngStat?.size ?? 0) >= MINIMUM_PNG_BYTES },
    dimensions: {
      actual: dimensions,
      expected: { width: expectedWidth, height: expectedHeight },
      passed: dimensions?.width === expectedWidth && dimensions?.height === expectedHeight,
      ffprobeExitCode: probe?.status ?? null,
    },
  };
  return { checks, status: technicalChecksPass(checks) ? "technical_pass" : "technical_fail" };
};

export const validateSampledStillsReport = (report) => {
  const errors = [];
  if (!SHA256_PATTERN.test(report?.videoHash ?? "")) errors.push("videoHash must be an exact sha256 hash");
  if (report?.styleReview !== "deferred_by_user") errors.push("styleReview must be deferred_by_user");
  if (report?.visualApproval !== "not_claimed") errors.push("visualApproval must be not_claimed");
  if (!Array.isArray(report?.samples) || report.samples.length === 0) errors.push("samples must be a non-empty array");
  const allSamplesPass = Array.isArray(report?.samples) && report.samples.length > 0 &&
    report.samples.every((sample) => sample?.status === "technical_pass" && technicalChecksPass(sample?.checks));
  if (report?.status !== (allSamplesPass ? "technical_pass" : "technical_fail")) {
    errors.push("status must reflect all sample technical checks");
  }
  return errors;
};

export const buildSampledStillsReport = ({ runId, videoPath, expectedWidth, expectedHeight, samples }) => {
  const report = {
    schemaVersion: "lucida-sampled-stills/v1",
    runId,
    generatedAt: new Date().toISOString(),
    videoPath,
    videoHash: `sha256:${crypto.createHash("sha256").update(fs.readFileSync(videoPath)).digest("hex")}`,
    expectedDimensions: { width: expectedWidth, height: expectedHeight },
    styleReview: "deferred_by_user",
    visualApproval: "not_claimed",
    samples,
  };
  report.status = samples.length > 0 && samples.every((sample) => sample.status === "technical_pass")
    ? "technical_pass"
    : "technical_fail";
  return report;
};

export const sampleRenderedVideoStills = ({ appRoot, runId }) => {
  assertValidRunId(runId);
  const runsRoot = path.join(appRoot, "output", "render", "flow-runs");
  const runDir = assertExistingPathInside({ root: runsRoot, candidate: path.join(runsRoot, runId), label: "Run directory", type: "directory" });
  const videoPath = assertExistingPathInside({ root: runsRoot, candidate: path.join(runDir, "video.mp4"), label: "Rendered video", type: "file" });
  const videoMapPath = assertExistingPathInside({ root: runsRoot, candidate: path.join(runDir, "video-map.json"), label: "Timed video map", type: "file" });
  const videoMap = JSON.parse(fs.readFileSync(videoMapPath, "utf8"));
  const expectedWidth = videoMap?.video?.width;
  const expectedHeight = videoMap?.video?.height;
  if (!Number.isInteger(expectedWidth) || expectedWidth <= 0 || !Number.isInteger(expectedHeight) || expectedHeight <= 0) {
    throw new Error("timed video-map.json must define positive integer video.width and video.height");
  }
  const midpoints = sceneMidpoints(videoMap);
  const stillsDir = path.join(runDir, "stills");
  if (fs.lstatSync(stillsDir, { throwIfNoEntry: false })) throw new Error(`Refusing to overwrite existing stills directory: ${stillsDir}`);
  fs.mkdirSync(stillsDir);
  if (!isContained(runDir, fs.realpathSync(stillsDir))) {
    throw new Error("stills directory escapes run directory through a symlink");
  }

  const samples = midpoints.map((midpoint) => {
    const stillPath = path.join(stillsDir, midpoint.stillFile);
    const result = checkStill({ videoPath, stillPath, expectedWidth, expectedHeight, timestampMs: midpoint.timestampMs });
    return { ...midpoint, stillPath: path.relative(runDir, stillPath), ...result };
  });
  const report = buildSampledStillsReport({
    runId,
    videoPath: path.relative(appRoot, videoPath),
    expectedWidth,
    expectedHeight,
    samples,
  });
  const reportErrors = validateSampledStillsReport(report);
  if (reportErrors.length) throw new Error(`Sampled stills report is invalid: ${reportErrors.join("; ")}`);
  const reportPath = path.join(stillsDir, "sampled-stills-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { reportPath, report };
};

export const parseCliArgs = (args) => {
  if (args.length !== 2 || args[0] !== "--run-id" || !args[1]) {
    throw new Error("Usage: npm run evidence:sample-rendered-stills -- --run-id <id>");
  }
  assertValidRunId(args[1]);
  return { runId: args[1] };
};

const main = () => {
  const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const { runId } = parseCliArgs(process.argv.slice(2));
  const result = sampleRenderedVideoStills({ appRoot, runId });
  console.log(`${result.report.status}: ${result.reportPath}`);
  if (result.report.status !== "technical_pass") process.exitCode = 1;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`evidence:sample-rendered-stills: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
