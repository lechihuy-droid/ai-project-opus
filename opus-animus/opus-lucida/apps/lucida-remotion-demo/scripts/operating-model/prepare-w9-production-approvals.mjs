#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256File, writeJson } from "./orchestration.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceRunId = "w9-ai-weekly-auto-20260716";
const valueAfter = (flag) => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : process.argv[index + 1];
};
const productionRunId = valueAfter("--production-run-id") ?? "w9-gpt-5-6-production-20260717";
const stagingRoot = path.resolve(
  appRoot,
  valueAfter("--staging-root") ?? "pipeline/runs/.staging-w9-gpt-5-6-production-20260717",
);
const outputSuffix = valueAfter("--output-suffix") ?? "";
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(productionRunId)) throw new Error("Invalid production run ID");
if (outputSuffix && !/^[A-Za-z0-9._-]+$/u.test(outputSuffix)) throw new Error("Invalid output suffix");
const suffix = outputSuffix ? `-${outputSuffix}` : "";
const approvedAt = "2026-07-17T00:00:00+09:00";
const record = ({ approvalId, runId, kind, artifactHash }) => ({
  schemaVersion: "lucida-approval/v1",
  approvalId,
  runId,
  kind,
  status: "approved",
  artifactHash,
  approvedBy: "HUY",
  approvedAt,
});

const promotion = record({
  approvalId: `w9-auto-pilot-promotion-huy${suffix}`,
  runId: sourceRunId,
  kind: "promotion",
  artifactHash: sha256File(path.join(appRoot, `pipeline/runs/${sourceRunId}/05-video-map.json`)),
});
const approvals = [
  record({
    approvalId: `w9-production-treatment-huy${suffix}`,
    runId: productionRunId,
    kind: "visual-treatment",
    artifactHash: sha256File(path.join(appRoot, "pipeline/fixtures/w9/production-script.approved.json")),
  }),
  record({
    approvalId: `w9-production-map-huy${suffix}`,
    runId: productionRunId,
    kind: "video-map",
    artifactHash: sha256File(path.join(stagingRoot, "05-video-map.json")),
  }),
];

writeJson(path.join(appRoot, `pipeline/fixtures/w9/promotion-approval${suffix}.approved.json`), promotion);
writeJson(path.join(appRoot, `pipeline/fixtures/w9/production-approvals${suffix}.approved.json`), approvals);
console.log(JSON.stringify({ promotion, approvals }, null, 2));
