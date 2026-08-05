import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertProductionInputsApproved,
  assertPublishableProductionRun,
  finalizeProductionEnvelope,
  promoteRapidRun,
  sha256File,
} from "../../scripts/operating-model/orchestration.mjs";

const temporaryRun = () => fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w2-"));
const approval = ({ approvalId, runId, kind, artifactHash }) => ({
  schemaVersion: "lucida-approval/v1",
  approvalId,
  runId,
  kind,
  status: "approved",
  artifactHash,
  approvedBy: "reviewer@example.test",
  approvedAt: "2026-07-16T10:00:00Z",
});

const writePassedQaReport = ({ root, runId, scriptPath, mapPath, videoPath }) => {
  const qaInputPaths = {
    approvedScript: scriptPath,
    sourceVideoMap: mapPath,
    timedVideoMap: path.join(root, "video-map.timed.json"),
    renderProps: path.join(root, "render-props.json"),
    timedScript: path.join(root, "timed-script.json"),
    audio: path.join(root, "voice.wav"),
    normalizedInput: path.join(root, "normalized-input.json"),
  };
  for (const [name, filePath] of Object.entries(qaInputPaths)) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `fixture-${name}`);
  }
  const qaReportPath = path.join(root, "qa-report.json");
  fs.writeFileSync(qaReportPath, `${JSON.stringify({
    schemaVersion: "lucida-qa/v1",
    runId,
    phase: "post-render",
    generatedAt: "2026-07-16T10:00:00Z",
    status: "passed",
    inputChecksums: Object.fromEntries(Object.entries(qaInputPaths).map(([name, filePath]) => [name, sha256File(filePath)])),
    renderChecksum: sha256File(videoPath),
    checks: ["audio-stream", "audio-non-silent", "audio-clipping", "caption-timing", "render-integrity"].map((id) => ({ id, status: "passed", evidence: {} })),
  })}\n`);
  return { qaReportPath, qaInputPaths };
};

test("promotion accepts only a hashed rapid source and creates a separate pending production envelope", () => {
  const root = temporaryRun();
  const sourceMap = path.join(root, "05-video-map.json");
  fs.writeFileSync(sourceMap, "{\"pilot\":true}\n");
  const sourceEnvelope = {
    schemaVersion: "lucida-run/v1",
    runId: "rapid-001",
    lane: "rapid-visual-pilot",
    styleMode: "auto",
    publicationStatus: "non_publishable",
    approvalRefs: [],
  };
  const productionApprovals = [
    approval({ approvalId: "treatment", runId: "production-001", kind: "visual-treatment", artifactHash: `sha256:${"a".repeat(64)}` }),
    approval({ approvalId: "map", runId: "production-001", kind: "video-map", artifactHash: `sha256:${"b".repeat(64)}` }),
  ];
  const result = promoteRapidRun({
    sourceEnvelope,
    sourceVideoMapPath: sourceMap,
    promotionApproval: approval({
      approvalId: "pilot-promotion",
      runId: "rapid-001",
      kind: "promotion",
      artifactHash: sha256File(sourceMap),
    }),
    productionRunId: "production-001",
    productionApprovals,
  });

  assert.equal(sourceEnvelope.lane, "rapid-visual-pilot");
  assert.equal(result.productionEnvelope.runId, "production-001");
  assert.equal(result.productionEnvelope.lane, "production");
  assert.equal(result.productionEnvelope.publicationStatus, "promotion_pending");
  assert.deepEqual(result.productionEnvelope.approvalRefs, ["treatment", "map"]);
  assert.equal(result.promotion.sourceRunId, "rapid-001");
});

test("finalization and publishability require approvals for the exact dependencies and render", () => {
  const root = temporaryRun();
  const scriptPath = path.join(root, "approved-script.json");
  const mapPath = path.join(root, "video-map.json");
  const videoPath = path.join(root, "video.mp4");
  fs.writeFileSync(scriptPath, "{\"title\":\"Approved\"}\n");
  fs.writeFileSync(mapPath, "{\"video\":true}\n");
  fs.writeFileSync(videoPath, "render-bytes");
  const envelope = {
    schemaVersion: "lucida-run/v1",
    runId: "production-002",
    lane: "production",
    styleMode: "auto",
    publicationStatus: "promotion_pending",
    approvalRefs: ["treatment", "map"],
  };
  const approvals = [
    approval({ approvalId: "treatment", runId: envelope.runId, kind: "visual-treatment", artifactHash: sha256File(scriptPath) }),
    approval({ approvalId: "map", runId: envelope.runId, kind: "video-map", artifactHash: sha256File(mapPath) }),
    approval({ approvalId: "final", runId: envelope.runId, kind: "final-video", artifactHash: sha256File(videoPath) }),
  ];
  const { qaReportPath, qaInputPaths } = writePassedQaReport({ root, runId: envelope.runId, scriptPath, mapPath, videoPath });

  assertProductionInputsApproved({ envelope, approvals, scriptPath, videoMapPath: mapPath });
  const finalized = finalizeProductionEnvelope({ envelope, approvals, scriptPath, videoMapPath: mapPath, videoPath, qaReportPath, qaInputPaths });
  assert.equal(finalized.publicationStatus, "publishable");
  assert.ok(finalized.approvalRefs.includes("final"));
  assert.doesNotThrow(() =>
    assertPublishableProductionRun({ envelope: finalized, approvals, scriptPath, videoMapPath: mapPath, videoPath, qaReportPath, qaInputPaths }),
  );

  fs.writeFileSync(mapPath, "{\"video\":false}\n");
  assert.throws(
    () => assertProductionInputsApproved({ envelope, approvals, scriptPath, videoMapPath: mapPath }),
    /video-map approval does not match current artifact hash/,
  );
});

test("rapid envelopes and changed render bytes cannot bypass the publish gate", () => {
  const root = temporaryRun();
  const scriptPath = path.join(root, "script.json");
  const mapPath = path.join(root, "map.json");
  const videoPath = path.join(root, "video.mp4");
  fs.writeFileSync(scriptPath, "script");
  fs.writeFileSync(mapPath, "map");
  fs.writeFileSync(videoPath, "render-a");
  const rapid = {
    schemaVersion: "lucida-run/v1",
    runId: "rapid-002",
    lane: "rapid-visual-pilot",
    styleMode: "auto",
    publicationStatus: "non_publishable",
    approvalRefs: [],
  };
  assert.throws(
    () => assertPublishableProductionRun({ envelope: rapid, approvals: [], scriptPath, videoMapPath: mapPath, videoPath }),
    /Publish handoff requires a publishable production envelope/,
  );

  const envelope = {
    schemaVersion: "lucida-run/v1",
    runId: "production-003",
    lane: "production",
    styleMode: "auto",
    publicationStatus: "promotion_pending",
    approvalRefs: ["treatment", "map"],
  };
  const approvals = [
    approval({ approvalId: "treatment", runId: envelope.runId, kind: "visual-treatment", artifactHash: sha256File(scriptPath) }),
    approval({ approvalId: "map", runId: envelope.runId, kind: "video-map", artifactHash: sha256File(mapPath) }),
    approval({ approvalId: "final", runId: envelope.runId, kind: "final-video", artifactHash: sha256File(videoPath) }),
  ];
  fs.writeFileSync(videoPath, "render-b");
  const { qaReportPath, qaInputPaths } = writePassedQaReport({ root, runId: envelope.runId, scriptPath, mapPath, videoPath });
  assert.throws(
    () => finalizeProductionEnvelope({ envelope, approvals, scriptPath, videoMapPath: mapPath, videoPath, qaReportPath, qaInputPaths }),
    /final-video approval does not match rendered video hash/,
  );
});
