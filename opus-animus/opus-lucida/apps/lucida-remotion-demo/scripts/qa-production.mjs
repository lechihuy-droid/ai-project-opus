#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  QA_SCHEMA_VERSION,
  checksPassed,
  evaluateAudioMetrics,
  evaluateCaptionTiming,
  evaluateContentCapacity,
  evaluateProvenanceCompleteness,
  evaluateTimedInputs,
  loadStylePackage,
  probeAudioMetrics,
  probeRenderIntegrity,
  readJson,
  relativeChecksumPaths,
} from "./operating-model/qa-gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const fail = (message) => {
  console.error(`qa:production: ${message}`);
  process.exit(1);
};

const parseArgs = () => {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (![
      "--phase", "--run-id", "--run-dir", "--script", "--source-video-map", "--video-map",
      "--render-props", "--timed-script", "--audio", "--normalized-input", "--content-brief", "--video",
    ].includes(flag)) fail(`Unknown argument: ${flag}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!new Set(["pre", "post"]).has(parsed.phase)) fail("--phase must be pre or post");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(parsed["run-id"] ?? "")) fail("Invalid --run-id");
  for (const key of ["run-dir", "script", "source-video-map", "video-map", "render-props", "timed-script", "audio", "normalized-input", "content-brief"]) {
    if (!parsed[key]) fail(`--${key} is required`);
  }
  if (parsed.phase === "post" && !parsed.video) fail("--video is required for post-render QA");
  return parsed;
};

const parsed = parseArgs();
const runDir = path.resolve(root, parsed["run-dir"]);
const approvedRoot = path.join(root, "output", "render", "flow-runs");
const relative = path.relative(approvedRoot, runDir);
if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
  fail("--run-dir must be contained under output/render/flow-runs");
}
const resolve = (key) => path.resolve(root, parsed[key]);
const paths = {
  approvedScript: resolve("script"),
  sourceVideoMap: resolve("source-video-map"),
  timedVideoMap: resolve("video-map"),
  renderProps: resolve("render-props"),
  timedScript: resolve("timed-script"),
  audio: resolve("audio"),
  normalizedInput: resolve("normalized-input"),
  contentBrief: resolve("content-brief"),
};
for (const [name, filePath] of Object.entries(paths)) {
  if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) fail(`${name} does not exist: ${filePath}`);
}

const renderProps = readJson(paths.renderProps);
const videoMap = readJson(paths.timedVideoMap);
const timedScript = readJson(paths.timedScript);
const normalizedInput = readJson(paths.normalizedInput);
const preChecks = [
  ...evaluateContentCapacity({
    videoMap,
    packageLoader: (packageId) => loadStylePackage({ appRoot: root, packageId }),
  }),
  ...evaluateProvenanceCompleteness({ videoMap, normalizedInput }),
  ...evaluateTimedInputs({ renderProps, timedScript, audioPath: paths.audio }),
];
const preReport = {
  schemaVersion: QA_SCHEMA_VERSION,
  runId: parsed["run-id"],
  phase: "pre-render",
  generatedAt: new Date().toISOString(),
  status: checksPassed(preChecks) ? "passed" : "failed",
  inputChecksums: relativeChecksumPaths(paths),
  checks: preChecks,
};
const preReportPath = path.join(runDir, "qa-pre-render.json");
fs.writeFileSync(preReportPath, `${JSON.stringify(preReport, null, 2)}\n`, "utf8");
if (!checksPassed(preChecks)) {
  fail(`pre-render QA failed: ${preChecks.filter((check) => check.status === "failed").map((check) => check.id).join(", ")}`);
}
if (parsed.phase === "pre") {
  console.log(`Pre-render QA passed: ${path.relative(root, preReportPath)}`);
  process.exit(0);
}

const videoPath = resolve("video");
if (!fs.statSync(videoPath, { throwIfNoEntry: false })?.isFile()) fail(`rendered video does not exist: ${videoPath}`);
const audioMetrics = probeAudioMetrics(videoPath);
const postChecks = [
  ...evaluateAudioMetrics(audioMetrics),
  evaluateCaptionTiming({
    timedScript,
    audioDurationMs: Number(renderProps.audio?.durationMs ?? timedScript.durationMs),
    fps: Number(videoMap.video?.fps),
  }),
  probeRenderIntegrity({ videoPath, expectedVideo: videoMap.video }),
];
const report = {
  schemaVersion: QA_SCHEMA_VERSION,
  runId: parsed["run-id"],
  phase: "post-render",
  generatedAt: new Date().toISOString(),
  status: checksPassed([...preChecks, ...postChecks]) ? "passed" : "failed",
  thresholds: {
    nonSilentMeanDb: -45,
    clippingPeakDb: -0.1,
    captionDriftMs: 80,
  },
  inputChecksums: relativeChecksumPaths(paths),
  renderChecksum: relativeChecksumPaths({ render: videoPath }).render,
  checks: [...preChecks, ...postChecks],
  audioEvidence: audioMetrics.evidence,
};
const reportPath = path.join(runDir, "qa-report.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
if (!checksPassed(report.checks)) {
  fail(`post-render QA failed: ${report.checks.filter((check) => check.status === "failed").map((check) => check.id).join(", ")}`);
}
console.log(`Production QA passed: ${path.relative(root, reportPath)}`);
