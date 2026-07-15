#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

const failUsage = (message) => {
  console.error(`flow:run: ${message}`);
  console.error(
    "Usage: npm run flow:run -- --script <approved-script.json> --video-map <video-map.json> [--run-id <id>] [--skip-voice]",
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
    if (!["--script", "--video-map", "--run-id"].includes(flag)) {
      failUsage(`Unknown argument: ${flag}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--"))
      failUsage(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!parsed.script || !parsed["video-map"])
    failUsage("--script and --video-map are required");
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
const runId = safeRunId(parsed["run-id"] ?? `flow-${Date.now()}`);
const scriptPath = path.resolve(root, parsed.script);
const videoMapPath = path.resolve(root, parsed["video-map"]);
const runDir = path.join(root, "output", "render", "flow-runs", runId);
const audioDir = path.join(root, "public", "runs", runId, "audio");
const timedScriptPath = path.join(audioDir, "timed-script.json");
const voicePath = path.join(audioDir, "voice.wav");
const voiceTrackPath = path.join(audioDir, "voice-track.json");
const approvedScriptCopy = path.join(runDir, "approved-script.json");
const sourceMapCopy = path.join(runDir, "video-map.source.json");
const timedMapPath = path.join(runDir, "video-map.json");
const renderPropsPath = path.join(runDir, "render-props.json");
const reportPath = path.join(runDir, "flow-report.json");
const semanticReportPath = path.join(runDir, "semantic-report.json");
const renderReportPath = path.join(runDir, "render-report.json");

for (const [label, filePath] of [
  ["approved script", scriptPath],
  ["video map", videoMapPath],
]) {
  if (!fs.existsSync(filePath))
    failUsage(`${label} does not exist: ${filePath}`);
}

fs.mkdirSync(runDir, { recursive: true });
fs.copyFileSync(scriptPath, approvedScriptCopy);
fs.copyFileSync(videoMapPath, sourceMapCopy);

const report = {
  runId,
  startedAt: new Date().toISOString(),
  completedAt: null,
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
    name: "publish:handoff",
    script: "scripts/publish-handoff.mjs",
    args: ["--run-id", runId],
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
writeReport();
console.log(`Flow completed: ${path.relative(root, runDir)}`);
