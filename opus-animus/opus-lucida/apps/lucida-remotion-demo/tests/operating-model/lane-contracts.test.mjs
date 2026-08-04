import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  VISUAL_FLOW_V1_DEPRECATION,
  adaptVisualFlowV1,
  validateRunEnvelope,
  validateApprovalRecord,
  validateApprovalReferences,
  validateVisualFlow,
} from "../../pipeline/contracts/visual-flow-contracts.mjs";

const read = (file) => JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file), "utf8"));

test("enforces the locked-style conditional and rapid publication boundary", () => {
  const locked = read("pipeline/fixtures/contracts/visual-flow-v2-locked.fixture.json");
  assert.deepEqual(validateVisualFlow(locked).errors, []);

  const missingLockedStyle = read("pipeline/fixtures/contracts/visual-flow-v2-locked-missing.fixture.json");
  assert.match(validateVisualFlow(missingLockedStyle).errors.join("\n"), /run\.lockedStyle\.family invalid/);

  const autoWithLockedStyle = read("pipeline/fixtures/contracts/visual-flow-v2-auto.fixture.json");
  autoWithLockedStyle.run.lockedStyle = locked.run.lockedStyle;
  assert.match(validateVisualFlow(autoWithLockedStyle).errors.join("\n"), /run\.lockedStyle is only valid for locked styleMode/);

  const rapidPublishable = read("pipeline/fixtures/contracts/visual-flow-v2-rapid-publishable.fixture.json");
  assert.match(validateVisualFlow(rapidPublishable).errors.join("\n"), /rapid-visual-pilot must be non_publishable/);

  const packageLocked = read("pipeline/fixtures/contracts/visual-flow-v2-locked-package.fixture.json");
  assert.deepEqual(validateVisualFlow(packageLocked).errors, []);
});

test("locked style requires an explicit actor and reason", () => {
  const locked = read("pipeline/fixtures/contracts/visual-flow-v2-locked.fixture.json");
  const missingActor = structuredClone(locked);
  delete missingActor.run.lockedStyle.lockedBy;
  assert.match(validateVisualFlow(missingActor).errors.join("\n"), /run\.lockedStyle\.lockedBy required/);

  const missingReason = structuredClone(locked);
  delete missingReason.run.lockedStyle.reason;
  assert.match(validateVisualFlow(missingReason).errors.join("\n"), /run\.lockedStyle\.reason required/);
});

test("adapts legacy visual-flow/v1 to locked rapid lane with a deprecation warning", () => {
  const warnings = [];
  const adapted = adaptVisualFlowV1(read("pipeline/fixtures/gpt-5-6-weekly-flow.json"), {
    onWarning: (warning) => warnings.push(warning),
  });
  assert.deepEqual(warnings, [VISUAL_FLOW_V1_DEPRECATION]);
  assert.equal(adapted.schemaVersion, "visual-flow/v2");
  assert.equal(adapted.run.styleMode, "locked");
  assert.equal(adapted.run.lockedStyle.family, "terminal");
  assert.deepEqual(validateVisualFlow(adapted).errors, []);

  const legacyWithoutSourceFamily = read("pipeline/fixtures/gpt-5-6-weekly-flow.json");
  legacyWithoutSourceFamily.sources = legacyWithoutSourceFamily.sources.map(({ family, ...source }) => source);
  const fallback = adaptVisualFlowV1(legacyWithoutSourceFamily, { onWarning: () => {} });
  assert.equal(fallback.run.lockedStyle.family, legacyWithoutSourceFamily.mapping.defaultFamily);
});

test("v2 auto rejects implicit source-family and defaultFamily metadata", () => {
  const sourceFamilyErrors = validateVisualFlow(read("pipeline/fixtures/contracts/visual-flow-v2-auto-family.fixture.json")).errors;
  assert.match(sourceFamilyErrors.join("\n"), /v2 auto rejects source family metadata/);
  assert.match(sourceFamilyErrors.join("\n"), /v2 auto rejects mapping\.defaultFamily/);
});

test("publishable production run requires approved references for the same run", () => {
  const flow = read("pipeline/fixtures/contracts/visual-flow-v2-production-publishable.fixture.json");
  const approvals = read("pipeline/fixtures/contracts/approval-records.fixture.json");
  assert.deepEqual(validateVisualFlow(flow).errors, []);
  assert.deepEqual(validateApprovalReferences(flow.run, approvals), []);

  const missing = validateApprovalReferences(flow.run, approvals.slice(1));
  assert.match(missing.join("\n"), /references missing approval: map-approved/);

  const wrongRun = approvals.map((approval) =>
    approval.approvalId === "map-approved" ? { ...approval, runId: "another-run" } : approval,
  );
  assert.match(validateApprovalReferences(flow.run, wrongRun).join("\n"), /belongs to a different run/);

  const rejected = approvals.map((approval) =>
    approval.approvalId === "map-approved" ? { ...approval, status: "rejected" } : approval,
  );
  assert.match(validateApprovalReferences(flow.run, rejected).join("\n"), /is not approved/);

  const duplicateRefs = { ...flow.run, approvalRefs: ["map-approved", "map-approved"] };
  assert.match(validateRunEnvelope(duplicateRefs).join("\n"), /approvalRefs must be unique/);
});

test("W2 pending production fixture remains a valid, non-publishable handoff state", () => {
  const envelope = read("pipeline/fixtures/contracts/w2-production-envelope-pending.fixture.json");
  const approvals = read("pipeline/fixtures/contracts/w2-production-approvals.fixture.json");
  assert.deepEqual(validateRunEnvelope(envelope), []);
  assert.deepEqual(approvals.flatMap(validateApprovalRecord), []);
  assert.deepEqual(validateApprovalReferences(envelope, approvals), []);
  assert.equal(envelope.publicationStatus, "promotion_pending");
});
