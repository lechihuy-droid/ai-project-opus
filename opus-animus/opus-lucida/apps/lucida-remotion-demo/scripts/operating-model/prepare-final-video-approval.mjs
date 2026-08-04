#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateApprovalRecord } from "../../pipeline/contracts/visual-flow-contracts.mjs";
import { readApprovalRecords, readJson, sha256File, writeJson } from "./orchestration.mjs";

const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;

const assertValidRunId = (runId) => {
  if (!RUN_ID_PATTERN.test(runId ?? "")) throw new Error("Invalid --run-id");
};

const isContained = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

const nearestExistingAncestor = (candidate) => {
  let current = path.resolve(candidate);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return current;
};

const resolveNewOutputPath = (appRoot, outPath) => {
  if (typeof outPath !== "string" || !outPath.trim()) throw new Error("--out is required");
  if (path.isAbsolute(outPath)) throw new Error("--out must be a relative path inside the app root");

  const lexicalRoot = path.resolve(appRoot);
  const outputPath = path.resolve(lexicalRoot, outPath);
  if (!isContained(lexicalRoot, outputPath)) throw new Error("--out must resolve inside the app root");
  if (fs.lstatSync(outputPath, { throwIfNoEntry: false })) {
    throw new Error(`Refusing to overwrite existing output: ${outputPath}`);
  }

  const realRoot = fs.realpathSync(lexicalRoot);
  const existingAncestor = nearestExistingAncestor(path.dirname(outputPath));
  const realAncestor = existingAncestor ? fs.realpathSync(existingAncestor) : null;
  if (!realAncestor || (realAncestor !== realRoot && !isContained(realRoot, realAncestor))) {
    throw new Error("--out escapes the app root through a symlink parent");
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const realParent = fs.realpathSync(path.dirname(outputPath));
  if (realParent !== realRoot && !isContained(realRoot, realParent)) {
    throw new Error("--out escapes the app root through a symlink parent");
  }
  return outputPath;
};

const assertApprovalRecordsForRun = (approvals, runId) => {
  const errors = approvals.flatMap((approval) =>
    validateApprovalRecord(approval).map((error) => `${approval?.approvalId ?? "unknown"}: ${error}`),
  );
  if (new Set(approvals.map((approval) => approval?.approvalId)).size !== approvals.length) {
    errors.push("approvalIds must be unique");
  }
  if (approvals.some((approval) => approval.runId !== runId)) {
    errors.push("existing approval belongs to a different run");
  }
  if (errors.length) throw new Error(`Existing approvals are invalid: ${errors.join("; ")}`);
};

const approvalContainer = (source, approvals) =>
  Array.isArray(source) ? approvals : { ...source, approvals };

export const prepareFinalVideoApproval = ({ appRoot, runId, approvedBy, approvedAt, outPath }) => {
  assertValidRunId(runId);
  if (typeof approvedBy !== "string" || !approvedBy.trim()) throw new Error("--approved-by is required");

  const timestamp = approvedAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(timestamp))) throw new Error("Invalid --approved-at");

  const runDir = path.join(appRoot, "output", "render", "flow-runs", runId);
  const videoPath = path.join(runDir, "video.mp4");
  const approvalsPath = path.join(runDir, "approvals.json");
  if (!fs.statSync(videoPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Rendered video does not exist: ${videoPath}`);
  }
  if (!fs.statSync(approvalsPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Existing approvals do not exist: ${approvalsPath}`);
  }

  const outputPath = resolveNewOutputPath(appRoot, outPath);

  const source = readJson(approvalsPath);
  const approvals = readApprovalRecords(approvalsPath);
  assertApprovalRecordsForRun(approvals, runId);
  if (approvals.some((approval) => approval.kind === "final-video")) {
    throw new Error("A final-video approval already exists for this run");
  }

  const approval = {
    schemaVersion: "lucida-approval/v1",
    approvalId: `final-video-${runId}`,
    runId,
    kind: "final-video",
    status: "approved",
    artifactHash: sha256File(videoPath),
    approvedBy: approvedBy.trim(),
    approvedAt: timestamp,
  };
  const approvalErrors = validateApprovalRecord(approval);
  if (approvalErrors.length) throw new Error(`Final approval is invalid: ${approvalErrors.join("; ")}`);

  writeJson(outputPath, approvalContainer(source, [...approvals, approval]));
  return { outputPath, approval };
};

export const parseCliArgs = (args) => {
  const valueAfter = (flag) => {
    const index = args.indexOf(flag);
    return index === -1 ? null : args[index + 1];
  };
  const knownFlags = new Set(["--run-id", "--approved-by", "--approved-at", "--out"]);
  const unknownArgs = args.filter((argument, index) => !knownFlags.has(argument) && !knownFlags.has(args[index - 1]));
  const required = ["--run-id", "--approved-by", "--out"];
  if (unknownArgs.length || required.some((flag) => !valueAfter(flag))) {
    throw new Error("Usage: npm run flow:prepare-final-approval -- --run-id <id> --approved-by <name> --out <new-approvals.json> [--approved-at <ISO-8601>]");
  }
  if ([...knownFlags].some((flag) => args.filter((argument) => argument === flag).length > 1)) {
    throw new Error("Each option may be supplied only once");
  }

  return {
    runId: valueAfter("--run-id"),
    approvedBy: valueAfter("--approved-by"),
    approvedAt: valueAfter("--approved-at") ?? undefined,
    outPath: valueAfter("--out"),
  };
};

const main = () => {
  const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const options = parseCliArgs(process.argv.slice(2));
  const result = prepareFinalVideoApproval({
    appRoot,
    ...options,
  });
  console.log(`Prepared final-video approval: ${result.outputPath}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`flow:prepare-final-approval: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
