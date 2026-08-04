#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  finalizeProductionEnvelope,
  findRenderedVideo,
  readApprovalRecords,
  readJson,
  writeJson,
} from "./operating-model/orchestration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const fail = (message) => {
  console.error(`flow:finalize: ${message}`);
  process.exit(1);
};
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const unknownArgs = args.filter((argument, index) =>
  !["--run-id", "--approvals"].includes(argument) && !["--run-id", "--approvals"].includes(args[index - 1]),
);
const runId = valueAfter("--run-id");
const approvalsArg = valueAfter("--approvals");
if (unknownArgs.length || !runId || !approvalsArg) {
  fail("Usage: npm run flow:finalize -- --run-id <id> --approvals <approvals.json>");
}
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(runId)) fail("Invalid --run-id");

try {
  const runDir = path.join(root, "output", "render", "flow-runs", runId);
  const envelopePath = path.join(runDir, "run-envelope.json");
  const approvals = readApprovalRecords(path.resolve(root, approvalsArg));
  const finalized = finalizeProductionEnvelope({
    envelope: readJson(envelopePath),
    approvals,
    scriptPath: path.join(runDir, "approved-script.json"),
    videoMapPath: path.join(runDir, "video-map.source.json"),
    videoPath: findRenderedVideo(runDir),
    qaReportPath: path.join(runDir, "qa-report.json"),
    qaInputPaths: {
      approvedScript: path.join(runDir, "approved-script.json"),
      sourceVideoMap: path.join(runDir, "video-map.source.json"),
      timedVideoMap: path.join(runDir, "video-map.json"),
      renderProps: path.join(runDir, "render-props.json"),
      timedScript: path.join(root, "public", "runs", runId, "audio", "timed-script.json"),
      audio: path.join(root, "public", "runs", runId, "audio", "voice.wav"),
      normalizedInput: path.join(runDir, "normalized-input.json"),
      contentBrief: path.join(runDir, "content-brief.json"),
    },
  });

  // Handoff validates staged candidate inputs. The durable run state remains awaiting approval until it succeeds.
  const stagingDir = fs.mkdtempSync(path.join(runDir, ".finalize-"));
  const stagedEnvelopePath = path.join(stagingDir, "run-envelope.json");
  const stagedApprovalsPath = path.join(stagingDir, "approvals.json");
  writeJson(stagedEnvelopePath, finalized);
  writeJson(stagedApprovalsPath, approvals);

  const reportPath = path.join(runDir, "flow-report.json");
  const report = readJson(reportPath);
  try {
    const result = spawnSync(process.execPath, [
      path.join(root, "scripts", "publish-handoff.mjs"),
      "--run-id", runId,
      "--envelope", stagedEnvelopePath,
      "--approvals", stagedApprovalsPath,
    ], {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });
    if (result.error || result.status !== 0) throw new Error(`publish:handoff exited with code ${result.status ?? "unknown"}`);

    report.status = "publishable";
    report.finalizedAt = new Date().toISOString();
    fs.renameSync(stagedEnvelopePath, envelopePath);
    fs.renameSync(stagedApprovalsPath, path.join(runDir, "approvals.json"));
    writeJson(path.join(root, "pipeline", "runs", runId, "run-envelope.json"), finalized);
    writeJson(path.join(root, "pipeline", "runs", runId, "approvals.json"), approvals);
    writeJson(reportPath, report);
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  console.log(`Flow finalized and publish handoff created: ${runId}`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
