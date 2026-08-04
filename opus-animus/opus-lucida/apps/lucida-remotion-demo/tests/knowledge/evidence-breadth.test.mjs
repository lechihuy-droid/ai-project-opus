import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { auditEvidenceBreadth } from "../../scripts/knowledge/audit-evidence-breadth.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");

test("W8 audits all nine packages after canonical candidate promotion", () => {
  const { report, candidatePath } = auditEvidenceBreadth({ appRoot: APP_ROOT });
  assert.equal(report.packages.length, 9);
  assert.equal(report.actualPassingPackages, 5);
  assert.equal(report.projectedPassingPackages, 5);
  assert.equal(report.humanApprovalRequired, false);
  assert.equal(report.candidatesAreApproved, true);
  const candidates = JSON.parse(fs.readFileSync(candidatePath, "utf8"));
  assert.equal(candidates.sources.length, 12);
  assert.equal(candidates.approval, undefined);
  assert.equal(candidates.rights, undefined);
  assert.ok(candidates.sources.every((source) => source.domain === "visual-style"));
  assert.ok(candidates.sources.every((source) => source.sourceRevision && source.records.length === 1));
});

test("W8 actual and projected breadth reflect the completed human approval boundary", () => {
  const { report } = auditEvidenceBreadth({ appRoot: APP_ROOT });
  const terminal = report.packages.find((item) => item.packageId === "terminal-command-center");
  assert.equal(terminal.gatePassed, true);
  for (const packageId of ["dashboard-data", "technical-editorial", "minimal-education", "timeline-documentary"]) {
    const item = report.packages.find((candidate) => candidate.packageId === packageId);
    assert.equal(item.gatePassed, true);
    assert.equal(item.projectedGatePassed, true);
  }
  assert.ok(report.packages.every((item) => Array.isArray(item.gaps)));
});
