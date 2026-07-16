#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { writeStableJson } from "./index-utils.mjs";
import { assertEvidenceDomain } from "./evidence-domain.mjs";

const USAGE = "Usage: npm run knowledge:approve -- --input <02-sanitized-input.json> --source <source-id> --revision <immutable-revision> --rights-policy <policy> --rights-evidence <evidence> --approved-by <reviewer> [--approved-at <ISO-8601>] --out <approved.json>";

const optionFrom = (argv, name) => {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
};

const required = (value, name) => {
  if (!String(value ?? "").trim()) throw new Error(`${name} is required. ${USAGE}`);
  return String(value).trim();
};

export const approveReference = ({
  appRoot = process.cwd(),
  inputPath,
  outputPath,
  sourceId,
  sourceRevision,
  rightsPolicy,
  rightsEvidence,
  approvedBy,
  approvedAt = new Date().toISOString(),
} = {}) => {
  const input = path.resolve(appRoot, required(inputPath, "--input"));
  const output = path.resolve(appRoot, required(outputPath, "--out"));
  const raw = JSON.parse(fs.readFileSync(input, "utf8"));
  if (raw.schemaVersion !== "sanitized-visual-input/v1" || raw.sanitization?.status !== "passed") {
    throw new Error("Approval requires sanitized-visual-input/v1 with sanitization.status=passed.");
  }
  const source = raw.sources?.find((candidate) => candidate.sourceId === required(sourceId, "--source"));
  if (!source) throw new Error(`Source ${sourceId} was not found in sanitized input.`);
  assertEvidenceDomain(source.domain, `Source ${sourceId} domain`);
  if (fs.existsSync(output)) throw new Error(`Approval output already exists: ${output}`);
  if (Number.isNaN(Date.parse(approvedAt))) throw new Error("--approved-at must be an ISO-8601 timestamp.");

  const approved = {
    ...raw,
    approval: {
      status: "approved",
      approvedBy: required(approvedBy, "--approved-by"),
      approvedAt: new Date(approvedAt).toISOString().slice(0, 10),
    },
    rights: {
      status: "approved",
      policy: required(rightsPolicy, "--rights-policy"),
      evidence: required(rightsEvidence, "--rights-evidence"),
    },
    sources: [{
      ...source,
      sourceRevision: required(sourceRevision, "--revision"),
    }],
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  writeStableJson(output, approved);
  return { output, sourceId: source.sourceId, records: source.records?.length ?? 0 };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const argv = process.argv.slice(2);
    const result = approveReference({
      inputPath: optionFrom(argv, "--input"),
      outputPath: optionFrom(argv, "--out"),
      sourceId: optionFrom(argv, "--source"),
      sourceRevision: optionFrom(argv, "--revision"),
      rightsPolicy: optionFrom(argv, "--rights-policy"),
      rightsEvidence: optionFrom(argv, "--rights-evidence"),
      approvedBy: optionFrom(argv, "--approved-by"),
      approvedAt: optionFrom(argv, "--approved-at") ?? undefined,
    });
    console.log(`Approved reference artifact: ${result.output} (${result.records} record(s)).`);
  } catch (error) {
    console.error(`Reference approval failed: ${error.message}`);
    process.exitCode = 1;
  }
}
