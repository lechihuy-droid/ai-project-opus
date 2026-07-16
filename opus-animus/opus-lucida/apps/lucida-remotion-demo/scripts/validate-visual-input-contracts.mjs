import fs from "node:fs";
import path from "node:path";
import { validateApprovalRecord, validateApprovalReferences, validateVisualFlow } from "../pipeline/contracts/visual-flow-contracts.mjs";

const read = (file) => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file), "utf8"));
const errors = [];
const warnings = [];
const validateFlowFixture = (file) => {
  const flow = read(file);
  const result = validateVisualFlow(flow, { onWarning: (warning) => warnings.push(`${file}: ${warning}`) });
  result.errors.forEach((error) => errors.push(`${file}: ${error}`));
  return result.adapted ?? flow;
};

[
  "pipeline/fixtures/valid-flow.json",
  "pipeline/fixtures/collector-flow.json",
  "pipeline/fixtures/gpt-5-6-weekly-flow.json",
  "pipeline/fixtures/visual-reference-flow.json",
  "pipeline/fixtures/contracts/visual-flow-v2-auto.fixture.json",
  "pipeline/fixtures/contracts/visual-flow-v2-locked.fixture.json",
  "pipeline/fixtures/contracts/visual-flow-v2-locked-package.fixture.json",
].forEach(validateFlowFixture);

for (const file of [
  "pipeline/fixtures/invalid-flow.json",
  "pipeline/fixtures/contracts/visual-flow-v2-auto-family.fixture.json",
  "pipeline/fixtures/contracts/visual-flow-v2-rapid-publishable.fixture.json",
  "pipeline/fixtures/contracts/visual-flow-v2-locked-missing.fixture.json",
]) {
  if (validateVisualFlow(read(file), { onWarning: () => {} }).errors.length === 0) errors.push(`invalid fixture passed: ${file}`);
}

const publishableFlow = validateFlowFixture("pipeline/fixtures/contracts/visual-flow-v2-production-publishable.fixture.json");
const approvals = read("pipeline/fixtures/contracts/approval-records.fixture.json");
for (const approval of approvals) validateApprovalRecord(approval).forEach((error) => errors.push(`approval ${approval.approvalId}: ${error}`));
validateApprovalReferences(publishableFlow.run, approvals).forEach((error) => errors.push(error));
if (validateApprovalReferences(publishableFlow.run, approvals.slice(1)).length === 0) errors.push("missing approval reference passed");

for (const file of [
  "pipeline/schemas/visual-flow-v1.schema.json",
  "pipeline/schemas/visual-flow.schema.json",
  "pipeline/schemas/run-envelope.schema.json",
  "pipeline/schemas/approval-record.schema.json",
  "pipeline/schemas/content-brief.schema.json",
  "pipeline/schemas/normalized-event.schema.json",
  "pipeline/schemas/visual-scene.schema.json",
]) {
  if (read(file).$schema !== "https://json-schema.org/draft/2020-12/schema") errors.push(`invalid schema dialect: ${file}`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
console.log("Visual input contracts passed: 7 flow fixtures, 4 invalid fixtures, and approval references.");
