#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertProductionInputsApproved,
  readApprovalRecords,
  readJson,
  writeJson,
} from "./operating-model/orchestration.mjs";
import {
  assertNormalizedContentBriefBinding,
  assertValidContentBrief,
  readContentBriefFile,
  resolveExistingFileInside,
} from "../pipeline/contracts/content-brief-contracts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const failUsage = (message) => {
  console.error(`flow:run: ${message}`);
  console.error(
    "Usage: npm run flow:run -- --content-brief <content-brief.json> --script <approved-script.json> --video-map <video-map.json> --normalized-input <normalized-input.json> --run-envelope <run-envelope.json> --approvals <approvals.json> [--run-id <id>] [--skip-voice]",
  );
  process.exit(1);
};

const parseArgs = () => {
  const parsed = { skipVoice: false };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--skip-voice") {
      parsed.skipVoice = true;
      continue;
    }
    if (!["--content-brief", "--script", "--video-map", "--normalized-input", "--run-envelope", "--approvals", "--run-id"].includes(flag)) {
      failUsage(`Unknown argument: ${flag}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--"))
      failUsage(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!parsed.script || !parsed["video-map"] || !parsed["run-envelope"] || !parsed.approvals)
    failUsage("--script, --video-map, --run-envelope, and --approvals are required");
  return parsed;
};

const safeRunId = (value) => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value)) {
    failUsage(
      "--run-id may contain only letters, numbers, dot, underscore, and hyphen",
    );
  }
  return value;
};

const parsed = parseArgs();
if (parsed["run-id"] !== undefined) safeRunId(parsed["run-id"]);
if (!parsed["content-brief"]) failUsage("--content-brief is required for production flow:run");
const scriptPath = resolveExistingFileInside({ projectRoot: root, filePath: parsed.script, label: "approved script" }).filePath;
const videoMapPath = resolveExistingFileInside({ projectRoot: root, filePath: parsed["video-map"], label: "video map" }).filePath;
const envelopePath = resolveExistingFileInside({ projectRoot: root, filePath: parsed["run-envelope"], label: "run envelope" }).filePath;
const approvalsPath = resolveExistingFileInside({ projectRoot: root, filePath: parsed.approvals, label: "approvals" }).filePath;
const envelope = readJson(envelopePath);
const { brief: contentBrief, filePath: contentBriefPath, rawChecksum: contentBriefRawChecksum } = readContentBriefFile({
  projectRoot: root,
  filePath: parsed["content-brief"],
  runEnvelope: envelope,
});
const approvals = readApprovalRecords(approvalsPath);
const runId = parsed["run-id"] ?? safeRunId(envelope.runId);
if (envelope.runId !== runId) failUsage("--run-id must match run-envelope.runId");
if (!parsed["normalized-input"]) failUsage("--normalized-input is required");
const normalizedInputPath = resolveExistingFileInside({ projectRoot: root, filePath: parsed["normalized-input"], label: "normalized input" }).filePath;
const runDir = path.join(root, "output", "render", "flow-runs", runId);
if (fs.existsSync(runDir)) {
  failUsage(`Output run directory already exists and is immutable: ${runDir}`);
}
const audioDir = path.join(root, "public", "runs", runId, "audio");
const timedScriptPath = path.join(audioDir, "timed-script.json");
const voicePath = path.join(audioDir, "voice.wav");
const voiceTrackPath = path.join(audioDir, "voice-track.json");
const approvedScriptCopy = path.join(runDir, "approved-script.json");
const contentBriefCopy = path.join(runDir, "content-brief.json");
const sourceMapCopy = path.join(runDir, "video-map.source.json");
const normalizedInputCopy = path.join(runDir, "normalized-input.json");
const timedMapPath = path.join(runDir, "video-map.json");
const renderPropsPath = path.join(runDir, "render-props.json");
const reportPath = path.join(runDir, "flow-report.json");
const semanticReportPath = path.join(runDir, "semantic-report.json");
const renderReportPath = path.join(runDir, "render-report.json");

const normalizedInput = readJson(normalizedInputPath);
if (!normalizedInput?.contentBrief) failUsage("production normalized input must contain a structured ContentBrief");
try {
  assertValidContentBrief(normalizedInput.contentBrief, { runEnvelope: envelope });
} catch (error) {
  failUsage(error instanceof Error ? error.message : String(error));
}
if (JSON.stringify(normalizedInput.contentBrief) !== JSON.stringify(contentBrief)) {
  failUsage("--content-brief must exactly match normalized-input.contentBrief");
}
try {
  assertNormalizedContentBriefBinding({
    brief: contentBrief,
    normalizedInput,
    rawChecksum: contentBriefRawChecksum,
    projectRoot: root,
    briefPath: contentBriefPath,
    expectedProjectId: runId,
    expectedRunId: runId,
  });
} catch (error) {
  failUsage(error instanceof Error ? error.message : String(error));
}

try {
  assertProductionInputsApproved({ envelope, approvals, scriptPath, videoMapPath });
} catch (error) {
  failUsage(error instanceof Error ? error.message : String(error));
}

fs.mkdirSync(runDir);
fs.copyFileSync(scriptPath, approvedScriptCopy);
fs.copyFileSync(contentBriefPath, contentBriefCopy);
fs.copyFileSync(videoMapPath, sourceMapCopy);
fs.copyFileSync(normalizedInputPath, normalizedInputCopy);
writeJson(path.join(runDir, "run-envelope.json"), envelope);
writeJson(path.join(runDir, "approvals.json"), approvals);
writeJson(path.join(root, "pipeline", "runs", runId, "run-envelope.json"), envelope);
writeJson(path.join(root, "pipeline", "runs", runId, "approvals.json"), approvals);

const report = {
  runId,
  startedAt: new Date().toISOString(),
  completedAt: null,
  status: "running",
  contentBrief: {
    schemaVersion: contentBrief.schemaVersion,
    title: contentBrief.title,
    styleMode: contentBrief.styleMode,
    beatCount: contentBrief.beats.length,
  },
  stages: [],
};

const writeReport = () => {
  const temporaryPath = `${reportPath}.tmp`;
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  fs.renameSync(temporaryPath, reportPath);
};

const definitions = [
  {
    name: "voice:generate",
    script: "scripts/voice-generate.mjs",
    args: ["--script", scriptPath, "--run-id", runId],
    skip: parsed.skipVoice,
  },
  {
    name: "voice:align",
    script: "scripts/voice-align.mjs",
    args: ["--run-id", runId, "--script", scriptPath],
    skip: parsed.skipVoice,
  },
  {
    name: "map:apply-timing",
    script: "scripts/apply-timed-durations.mjs",
    args: [
      "--video-map",
      sourceMapCopy,
      "--timed-script",
      timedScriptPath,
      "--out",
      timedMapPath,
    ],
  },
  {
    name: "validate:videomap",
    script: "scripts/validate-video-map.mjs",
    args: [timedMapPath],
    before: () => {
      const videoMap = JSON.parse(fs.readFileSync(timedMapPath, "utf8"));
      const timedScript = JSON.parse(fs.readFileSync(timedScriptPath, "utf8"));
      const voiceTrack = JSON.parse(fs.readFileSync(voiceTrackPath, "utf8"));
      const renderProps = {
        videoMap,
        audio: {
          src: `/runs/${runId}/audio/voice.wav`,
          durationMs: voiceTrack.durationMs ?? timedScript.durationMs,
          checksum: voiceTrack.checksum,
        },
        timedCaptions: timedScript,
      };
      fs.writeFileSync(
        renderPropsPath,
        `${JSON.stringify(renderProps, null, 2)}\n`,
        "utf8",
      );
    },
  },
  {
    name: "validate:brand",
    script: "scripts/validate-brand.mjs",
    args: ["--input", timedMapPath, "--timed-script", timedScriptPath],
  },
  {
    name: "qa:pre-render",
    script: "scripts/qa-production.mjs",
    args: [
      "--phase", "pre",
      "--run-id", runId,
      "--run-dir", runDir,
      "--script", approvedScriptCopy,
      "--source-video-map", sourceMapCopy,
      "--video-map", timedMapPath,
      "--render-props", renderPropsPath,
      "--timed-script", timedScriptPath,
      "--audio", voicePath,
      "--normalized-input", normalizedInputCopy,
      "--content-brief", contentBriefCopy,
    ],
  },
  {
    name: "validate:semantic",
    script: "scripts/validate-semantic.mjs",
    args: ["--input", timedMapPath, "--final", "--report", semanticReportPath],
    after: () => {
      report.semanticQa = JSON.parse(
        fs.readFileSync(semanticReportPath, "utf8"),
      );
    },
  },
  {
    name: "render",
    script: "scripts/render-run.mjs",
    args: ["--props", renderPropsPath],
    env: { LUCIDA_RUN_ID: runId },
    after: () => {
      const renderReport = JSON.parse(
        fs.readFileSync(renderReportPath, "utf8"),
      );
      renderReport.semanticQa = report.semanticQa;
      const serialized = `${JSON.stringify(renderReport, null, 2)}\n`;
      fs.writeFileSync(renderReportPath, serialized, "utf8");
      fs.writeFileSync(
        path.join(runDir, "render-output.json"),
        serialized,
        "utf8",
      );
    },
  },
  {
    name: "qa:post-render",
    script: "scripts/qa-production.mjs",
    args: [
      "--phase", "post",
      "--run-id", runId,
      "--run-dir", runDir,
      "--script", approvedScriptCopy,
      "--source-video-map", sourceMapCopy,
      "--video-map", timedMapPath,
      "--render-props", renderPropsPath,
      "--timed-script", timedScriptPath,
      "--audio", voicePath,
      "--normalized-input", normalizedInputCopy,
      "--content-brief", contentBriefCopy,
      "--video", path.join(runDir, "video.mp4"),
    ],
  },
];

writeReport();

if (parsed.skipVoice) {
  const missing = [voicePath, voiceTrackPath, timedScriptPath].filter(
    (filePath) => !fs.existsSync(filePath),
  );
  if (missing.length > 0) {
    definitions.slice(0, 2).forEach((stage) => {
      report.stages.push({
        name: stage.name,
        status: "skipped",
        startedAt: new Date().toISOString(),
        elapsedMs: 0,
      });
    });
    report.stages.push({
      name: "map:apply-timing",
      status: "failed",
      startedAt: new Date().toISOString(),
      elapsedMs: 0,
      error: `--skip-voice requires existing artifacts: ${missing.join(", ")}`,
    });
    definitions.slice(3).forEach((stage) => {
      report.stages.push({
        name: stage.name,
        status: "skipped",
        startedAt: new Date().toISOString(),
        elapsedMs: 0,
      });
    });
    report.completedAt = new Date().toISOString();
    report.status = "failed";
    writeReport();
    process.exit(1);
  }
}

for (const [index, stage] of definitions.entries()) {
  const startedAt = new Date().toISOString();
  if (stage.skip) {
    report.stages.push({
      name: stage.name,
      status: "skipped",
      startedAt,
      elapsedMs: 0,
    });
    writeReport();
    continue;
  }

  const clock = Date.now();
  let result;
  try {
    stage.before?.();
    result = spawnSync(
      process.execPath,
      [path.join(root, stage.script), ...stage.args],
      {
        cwd: root,
        stdio: "inherit",
        shell: false,
        env: { ...process.env, ...stage.env },
      },
    );
    if (!result.error && result.status === 0) stage.after?.();
  } catch (error) {
    result = { status: 1, error };
  }

  const elapsedMs = Date.now() - clock;
  if (result.error || result.status !== 0) {
    if (
      stage.name === "validate:semantic" &&
      fs.existsSync(semanticReportPath)
    ) {
      report.semanticQa = JSON.parse(
        fs.readFileSync(semanticReportPath, "utf8"),
      );
    }
    const error =
      result.error?.message ??
      `${stage.name} exited with code ${result.status ?? "unknown"}`;
    report.stages.push({
      name: stage.name,
      status: "failed",
      startedAt,
      elapsedMs,
      error,
      ...(stage.name === "validate:semantic"
        ? { result: report.semanticQa }
        : {}),
    });
    definitions.slice(index + 1).forEach((laterStage) => {
      report.stages.push({
        name: laterStage.name,
        status: "skipped",
        startedAt: new Date().toISOString(),
        elapsedMs: 0,
      });
    });
    report.completedAt = new Date().toISOString();
    report.status = "failed";
    writeReport();
    process.exit(1);
  }

  report.stages.push({
    name: stage.name,
    status: "completed",
    startedAt,
    elapsedMs,
    ...(stage.name === "validate:semantic"
      ? { result: report.semanticQa }
      : {}),
  });
  writeReport();
}

report.completedAt = new Date().toISOString();
report.status = "awaiting_final_approval";
report.nextAction = "Run flow:finalize with a final-video approval matching output/render/flow-runs/<runId>/video.mp4.";
writeReport();
console.log(`Flow rendered and is awaiting final approval: ${path.relative(root, runDir)}`);
