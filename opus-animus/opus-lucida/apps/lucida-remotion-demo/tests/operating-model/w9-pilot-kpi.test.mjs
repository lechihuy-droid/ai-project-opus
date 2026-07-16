import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildOperatingKpiReport } from "../../scripts/report-operating-kpis.mjs";
import { assertValidContentBrief } from "../../pipeline/contracts/content-brief-contracts.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");

test("W9 auto and locked rapid pilots preserve lane and style boundaries", () => {
  const report = buildOperatingKpiReport({ appRoot: APP_ROOT });
  assert.equal(report.runs.length, 2);
  const auto = report.runs.find((run) => run.styleMode === "auto");
  const locked = report.runs.find((run) => run.styleMode === "locked");
  assert.equal(auto.lane, "rapid-visual-pilot");
  assert.equal(locked.lane, "rapid-visual-pilot");
  assert.equal(auto.publicationStatus, "non_publishable");
  assert.equal(locked.publicationStatus, "non_publishable");
  assert.ok(auto.packageIds.length >= 3);
  assert.deepEqual(locked.packageIds, ["terminal-command-center"]);
  assert.ok(new Set(auto.layouts).size >= 3);
  assert.ok(auto.maxConsecutiveLayout <= 2);
  assert.ok(locked.maxConsecutiveLayout <= 2);
});

test("W9 KPI report passes measured rapid metrics and refuses to infer production readiness", () => {
  const report = buildOperatingKpiReport({ appRoot: APP_ROOT });
  assert.equal(report.metrics.ragEvidenceCoverage.status, "PASS");
  assert.equal(report.metrics.ragEvidenceCoverage.value, 1);
  assert.equal(report.metrics.provenanceCompleteness.status, "PASS");
  assert.equal(report.metrics.autoStyleOverrideRate.status, "PASS");
  assert.equal(report.metrics.layoutRepetition.status, "PASS");
  assert.equal(report.metrics.audioCaptionPass.status, "NO_DATA");
  assert.equal(report.metrics.firstPassStillQa.status, "NO_DATA");
  assert.equal(report.metrics.publishReadiness.status, "NO_DATA");
  assert.equal(report.overallStatus, "INCOMPLETE");
  assert.match(report.decision, /unproven/i);
});

test("W9 production KPI report reads bound flow artifacts and remains non-publishable pending approval", () => {
  const report = buildOperatingKpiReport({
    appRoot: APP_ROOT,
    runIds: [
      "w9-ai-weekly-auto-20260716",
      "w9-ai-weekly-locked-20260716",
      "w9-gpt-5-6-production-20260717-r6",
    ],
  });

  assert.equal(report.scope.productionRuns, 1);
  assert.equal(report.metrics.ragEvidenceCoverage.numerator, 15);
  assert.equal(report.metrics.ragEvidenceCoverage.denominator, 15);
  assert.equal(report.metrics.ragEvidenceCoverage.value, 1);
  const production = report.runs.find((run) => run.lane === "production");
  assert.equal(production.sceneCount, 5);
  assert.equal(report.metrics.audioCaptionPass.value, 1);
  assert.equal(report.metrics.audioCaptionPass.status, "PASS");
  assert.equal(report.metrics.firstPassStillQa.value, null);
  assert.equal(report.metrics.firstPassStillQa.status, "NO_DATA");
  assert.equal(report.metrics.publishReadiness.value, 0);
  assert.equal(report.metrics.publishReadiness.status, "FAIL");
  assert.equal(report.overallStatus, "FAIL");
  assert.match(report.decision, /final approval/i);
});

test("W9 production candidates are factual-domain bound but remain explicitly unapproved", () => {
  const factual = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "design/knowledge/reports/w9-openai-gpt-5-6.sanitized.json"), "utf8"));
  const source = factual.sources[0];
  assert.equal(source.domain, "factual");
  assert.equal(factual.approval, undefined);
  assert.equal(factual.rights, undefined);
  assert.equal(crypto.createHash("sha256").update(source.records[0].text.normalize("NFC")).digest("hex"), source.checksum);

  const brief = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "pipeline/fixtures/w9/content-brief-production.json"), "utf8"));
  assert.doesNotThrow(() => assertValidContentBrief(brief));
  assert.deepEqual(brief.factualSourceIds, ["source:reference:openai-gpt-5-6-official"]);

  const script = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "pipeline/fixtures/w9/production-script.candidate.json"), "utf8"));
  assert.equal(script.status, "pending_approval");
  assert.ok(script.sentences.every((sentence) => sentence.locked === false));
});

test("W9 preview QA preserves first-pass failure after remediation", () => {
  const review = JSON.parse(fs.readFileSync(path.join(
    APP_ROOT,
    "pipeline/runs/w9-ai-weekly-auto-20260716/preview/qa-review.json",
  ), "utf8"));
  assert.equal(review.firstPassPassed, false);
  assert.equal(review.status, "needs_reverification");
  assert.ok(review.findings.some((finding) => finding.severity === "high"));
});
