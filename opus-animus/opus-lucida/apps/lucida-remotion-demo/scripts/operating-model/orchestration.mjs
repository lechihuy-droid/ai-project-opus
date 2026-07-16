import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  validateApprovalRecord,
  validateApprovalReferences,
  validateRunEnvelope,
} from "../../pipeline/contracts/visual-flow-contracts.mjs";
import { assertPassedBoundQaReport } from "./qa-gates.mjs";

export const sha256File = (filePath) =>
  `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;

export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

export const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
};

export const readApprovalRecords = (filePath) => {
  const value = readJson(filePath);
  const approvals = Array.isArray(value) ? value : value?.approvals;
  if (!Array.isArray(approvals)) {
    throw new Error("Approval file must contain an array or an { approvals } array");
  }
  return approvals;
};

const assertNoErrors = (errors, label) => {
  if (errors.length) throw new Error(`${label}: ${errors.join("; ")}`);
};

export const assertRunEnvelope = (envelope, label = "Run envelope") => {
  assertNoErrors(validateRunEnvelope(envelope), label);
  return envelope;
};

export const assertApprovalRecords = (approvals, label = "Approval records") => {
  if (!Array.isArray(approvals) || approvals.length === 0) {
    throw new Error(`${label}: at least one approval record is required`);
  }
  const errors = approvals.flatMap((approval) =>
    validateApprovalRecord(approval).map((error) => `${approval?.approvalId ?? "unknown"}: ${error}`),
  );
  if (new Set(approvals.map((approval) => approval.approvalId)).size !== approvals.length) {
    errors.push("approvalIds must be unique");
  }
  assertNoErrors(errors, label);
  return approvals;
};

const matchingApproval = ({ approvals, envelope, kind, artifactHash }) =>
  approvals.find(
    (approval) =>
      envelope.approvalRefs.includes(approval.approvalId) &&
      approval.runId === envelope.runId &&
      approval.kind === kind &&
      approval.status === "approved" &&
      approval.artifactHash === artifactHash,
  );

export const assertApprovalReferences = (envelope, approvals) => {
  assertApprovalRecords(approvals);
  assertNoErrors(validateApprovalReferences(envelope, approvals), "Approval references");
};

export const assertProductionInputsApproved = ({ envelope, approvals, scriptPath, videoMapPath, allowPublishable = false }) => {
  assertRunEnvelope(envelope);
  if (envelope.lane !== "production") throw new Error("Production envelope is required");
  if (envelope.publicationStatus === "publishable" && !allowPublishable) {
    throw new Error("flow:run cannot render an already publishable envelope; use flow:finalize after render");
  }
  assertApprovalReferences(envelope, approvals);
  const requirements = [
    ["visual-treatment", scriptPath],
    ["video-map", videoMapPath],
  ];
  for (const [kind, filePath] of requirements) {
    if (!fs.existsSync(filePath)) throw new Error(`Approved ${kind} artifact does not exist: ${filePath}`);
    const artifactHash = sha256File(filePath);
    if (!matchingApproval({ approvals, envelope, kind, artifactHash })) {
      throw new Error(`${kind} approval does not match current artifact hash ${artifactHash}`);
    }
  }
};

export const findRenderedVideo = (runDir) => {
  const videoPath = path.join(runDir, "video.mp4");
  return fs.statSync(videoPath, { throwIfNoEntry: false })?.isFile() ? videoPath : null;
};

export const finalizeProductionEnvelope = ({ envelope, approvals, scriptPath, videoMapPath, videoPath, qaReportPath, qaInputPaths }) => {
  assertProductionInputsApproved({ envelope, approvals, scriptPath, videoMapPath, allowPublishable: true });
  if (!videoPath || !fs.existsSync(videoPath)) throw new Error("Rendered video is required before finalization");
  assertPassedBoundQaReport({
    qaReportPath,
    runId: envelope.runId,
    inputPaths: qaInputPaths,
    renderPath: videoPath,
  });
  const artifactHash = sha256File(videoPath);
  const finalApproval = approvals.find(
    (approval) =>
      approval.runId === envelope.runId &&
      approval.kind === "final-video" &&
      approval.status === "approved" &&
      approval.artifactHash === artifactHash,
  );
  if (!finalApproval) {
    throw new Error(`final-video approval does not match rendered video hash ${artifactHash}`);
  }
  const finalized = {
    ...envelope,
    publicationStatus: "publishable",
    approvalRefs: [...new Set([...envelope.approvalRefs, finalApproval.approvalId])],
  };
  assertRunEnvelope(finalized);
  assertApprovalReferences(finalized, approvals);
  return finalized;
};

export const assertPublishableProductionRun = ({ envelope, approvals, scriptPath, videoMapPath, videoPath, qaReportPath, qaInputPaths }) => {
  assertRunEnvelope(envelope);
  if (envelope.lane !== "production" || envelope.publicationStatus !== "publishable") {
    throw new Error("Publish handoff requires a publishable production envelope");
  }
  const finalized = finalizeProductionEnvelope({ envelope, approvals, scriptPath, videoMapPath, videoPath, qaReportPath, qaInputPaths });
  if (finalized.approvalRefs.length !== envelope.approvalRefs.length) {
    throw new Error("Publishable envelope must reference the matching final-video approval");
  }
};

export const promoteRapidRun = ({ sourceEnvelope, sourceVideoMapPath, promotionApproval, productionRunId, productionApprovals }) => {
  assertRunEnvelope(sourceEnvelope, "Rapid source envelope");
  if (sourceEnvelope.lane !== "rapid-visual-pilot" || sourceEnvelope.publicationStatus !== "non_publishable") {
    throw new Error("Promotion source must be a non_publishable rapid-visual-pilot run");
  }
  assertApprovalRecords([promotionApproval], "Promotion approval");
  if (
    promotionApproval.runId !== sourceEnvelope.runId ||
    promotionApproval.kind !== "promotion" ||
    promotionApproval.status !== "approved"
  ) {
    throw new Error("Promotion approval must be approved, kind promotion, and belong to the rapid source run");
  }
  if (!sourceVideoMapPath || !fs.existsSync(sourceVideoMapPath)) {
    throw new Error("Rapid source video map is required for promotion");
  }
  const sourceHash = sha256File(sourceVideoMapPath);
  if (promotionApproval.artifactHash !== sourceHash) {
    throw new Error(`Promotion approval does not match rapid source hash ${sourceHash}`);
  }
  assertApprovalRecords(productionApprovals, "Production approvals");
  const productionEnvelope = {
    schemaVersion: "lucida-run/v1",
    runId: productionRunId,
    lane: "production",
    styleMode: sourceEnvelope.styleMode,
    ...(sourceEnvelope.lockedStyle ? { lockedStyle: sourceEnvelope.lockedStyle } : {}),
    publicationStatus: "promotion_pending",
    approvalRefs: productionApprovals.map((approval) => approval.approvalId),
  };
  assertRunEnvelope(productionEnvelope, "Production envelope");
  assertApprovalReferences(productionEnvelope, productionApprovals);
  return {
    productionEnvelope,
    promotion: {
      schemaVersion: "lucida-promotion/v1",
      sourceRunId: sourceEnvelope.runId,
      sourceVideoMapHash: sourceHash,
      approvalId: promotionApproval.approvalId,
      approvedBy: promotionApproval.approvedBy,
      approvedAt: promotionApproval.approvedAt,
    },
  };
};
