#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  promoteRapidRun,
  readApprovalRecords,
  readJson,
  writeJson,
} from "./operating-model/orchestration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const usage = "Usage: npm run flow:promote -- --source-run-id <rapid-run> --approval <promotion-approval.json> --production-run-id <production-run> --production-approvals <approvals.json>";
const safeRunId = (value) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(value ?? "");

const parseArgs = () => {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (!new Set(["--source-run-id", "--approval", "--production-run-id", "--production-approvals"]).has(flag)) {
      throw new Error(`Unknown argument: ${flag}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!parsed["source-run-id"] || !parsed.approval || !parsed["production-run-id"] || !parsed["production-approvals"]) {
    throw new Error(usage);
  }
  if (!safeRunId(parsed["source-run-id"]) || !safeRunId(parsed["production-run-id"])) {
    throw new Error("Run IDs may contain only letters, numbers, dot, underscore, and hyphen");
  }
  return parsed;
};

try {
  const parsed = parseArgs();
  const sourceDir = path.join(root, "pipeline", "runs", parsed["source-run-id"]);
  const sourceEnvelope = readJson(path.join(sourceDir, "run-envelope.json"));
  const promotionApproval = readJson(path.resolve(root, parsed.approval));
  const productionApprovals = readApprovalRecords(path.resolve(root, parsed["production-approvals"]));
  const { productionEnvelope, promotion } = promoteRapidRun({
    sourceEnvelope,
    sourceVideoMapPath: path.join(sourceDir, "05-video-map.json"),
    promotionApproval,
    productionRunId: parsed["production-run-id"],
    productionApprovals,
  });
  const productionDir = path.join(root, "pipeline", "runs", productionEnvelope.runId);
  if (fs.existsSync(productionDir)) throw new Error(`Production run already exists: ${productionEnvelope.runId}`);
  writeJson(path.join(productionDir, "run-envelope.json"), productionEnvelope);
  writeJson(path.join(productionDir, "approvals.json"), productionApprovals);
  writeJson(path.join(productionDir, "promotion.json"), promotion);
  console.log(`Production run promoted: ${path.relative(root, productionDir)}`);
} catch (error) {
  console.error(`flow:promote: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
