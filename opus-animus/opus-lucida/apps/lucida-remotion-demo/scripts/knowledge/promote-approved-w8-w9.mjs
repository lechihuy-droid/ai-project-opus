#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { approveReference } from "./approve-reference.mjs";
import { promoteReference } from "./promote-reference.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const approvedAt = "2026-07-17T00:00:00+09:00";
const approval = {
  approvedBy: "HUY",
  approvedAt,
  rightsPolicy: "link-and-review-note-only",
  rightsEvidence: "HUY approved these reviewer-authored link notes on 2026-07-17; no third-party source bodies or media are vendored.",
};

const catalog = JSON.parse(fs.readFileSync(
  path.join(appRoot, "design/knowledge/evidence-candidates/w8-catalog.json"),
  "utf8",
));
const jobs = catalog.candidates.map((candidate) => ({
  inputPath: "design/knowledge/reports/w8-evidence-candidates.sanitized.json",
  approvalPath: `design/knowledge/reports/w8-approvals/${candidate.sourceId}.approved.json`,
  sourceId: candidate.sourceId,
  sourceRevision: candidate.sourceRevision,
  packageId: candidate.sourceId,
  sourceType: candidate.sourceType === "web_reference" ? "web" : candidate.sourceType,
}));

jobs.push({
  inputPath: "design/knowledge/reports/w9-openai-gpt-5-6.sanitized.json",
  approvalPath: "design/knowledge/reports/w9-approvals/w9-openai-gpt-5-6.approved.json",
  sourceId: "w9-openai-gpt-5-6",
  sourceRevision: "openai-release:2026-07-09|link-note:2026-07-16",
  packageId: "openai-gpt-5-6-official",
  sourceType: "web",
});

const results = [];
for (const job of jobs) {
  const packageAbsolute = path.join(appRoot, "design/knowledge/reference-library", job.sourceType, job.packageId);
  if (fs.existsSync(packageAbsolute)) {
    results.push({ sourceId: job.sourceId, packageId: job.packageId, status: "already-promoted" });
    continue;
  }
  if (!fs.existsSync(path.join(appRoot, job.approvalPath))) {
    approveReference({
      appRoot,
      inputPath: job.inputPath,
      outputPath: job.approvalPath,
      sourceId: job.sourceId,
      sourceRevision: job.sourceRevision,
      ...approval,
    });
  }
  const promoted = promoteReference({
    appRoot,
    inputPath: job.approvalPath,
    sourceId: job.sourceId,
    packageId: job.packageId,
  });
  results.push({ sourceId: job.sourceId, packageId: job.packageId, status: "promoted", ...promoted });
}

console.log(JSON.stringify({ approvedBy: approval.approvedBy, approvedAt, results }, null, 2));
