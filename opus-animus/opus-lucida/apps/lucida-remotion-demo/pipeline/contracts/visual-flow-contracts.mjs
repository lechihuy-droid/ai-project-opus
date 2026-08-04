import {
  LEGACY_VISUAL_FAMILIES,
  PRODUCTION_PACKAGE_IDS,
  isLegacyVisualFamily,
  resolveProductionPackageId,
} from "../director/style-identifiers.mjs";

export const VISUAL_FAMILIES = new Set(LEGACY_VISUAL_FAMILIES);
export const PRODUCTION_STYLE_PACKAGES = new Set(PRODUCTION_PACKAGE_IDS);

export const VISUAL_FLOW_V1_DEPRECATION =
  "DEPRECATION visual-flow/v1: adapt to visual-flow/v2; legacy family/defaultFamily is treated as locked style.";

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isSha256 = (value) => typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);

export const validateRunEnvelope = (run) => {
  const errors = [];
  if (run?.schemaVersion !== "lucida-run/v1") errors.push("run.schemaVersion must be lucida-run/v1");
  if (!isNonEmptyString(run?.runId)) errors.push("run.runId required");
  if (!new Set(["production", "rapid-visual-pilot"]).has(run?.lane)) errors.push("run.lane invalid");
  if (!new Set(["auto", "locked"]).has(run?.styleMode)) errors.push("run.styleMode invalid");
  if (!new Set(["non_publishable", "promotion_pending", "publishable"]).has(run?.publicationStatus)) errors.push("run.publicationStatus invalid");
  if (!Array.isArray(run?.approvalRefs) || !run.approvalRefs.every(isNonEmptyString)) {
    errors.push("run.approvalRefs must be string references");
  } else if (new Set(run.approvalRefs).size !== run.approvalRefs.length) {
    errors.push("run.approvalRefs must be unique");
  }
  if (run?.styleMode === "locked") {
    if (!resolveProductionPackageId(run?.lockedStyle?.family)) errors.push("run.lockedStyle.family invalid");
    if (!isNonEmptyString(run?.lockedStyle?.lockedBy)) errors.push("run.lockedStyle.lockedBy required");
    if (!isNonEmptyString(run?.lockedStyle?.reason)) errors.push("run.lockedStyle.reason required");
  } else if (run?.lockedStyle !== undefined) {
    errors.push("run.lockedStyle is only valid for locked styleMode");
  }
  if (run?.lane === "rapid-visual-pilot" && run?.publicationStatus !== "non_publishable") errors.push("rapid-visual-pilot must be non_publishable");
  if (run?.publicationStatus === "publishable") {
    if (run?.lane !== "production") errors.push("publishable runs must use production lane");
    if (!run?.approvalRefs?.length) errors.push("publishable runs require approvalRefs");
  }
  return errors;
};

export const validateApprovalRecord = (approval) => {
  const errors = [];
  if (approval?.schemaVersion !== "lucida-approval/v1") errors.push("approval.schemaVersion must be lucida-approval/v1");
  if (!isNonEmptyString(approval?.approvalId)) errors.push("approval.approvalId required");
  if (!isNonEmptyString(approval?.runId)) errors.push("approval.runId required");
  if (!new Set(["visual-treatment", "video-map", "final-video", "promotion"]).has(approval?.kind)) errors.push("approval.kind invalid");
  if (!new Set(["approved", "rejected"]).has(approval?.status)) errors.push("approval.status invalid");
  if (!isSha256(approval?.artifactHash)) errors.push("approval.artifactHash must be sha256");
  if (!isNonEmptyString(approval?.approvedBy)) errors.push("approval.approvedBy required");
  if (!isNonEmptyString(approval?.approvedAt) || Number.isNaN(Date.parse(approval.approvedAt))) errors.push("approval.approvedAt must be date-time");
  return errors;
};

export const validateApprovalReferences = (run, approvals) => {
  const errors = [];
  const byId = new Map((approvals ?? []).map((approval) => [approval.approvalId, approval]));
  for (const ref of run?.approvalRefs ?? []) {
    const approval = byId.get(ref);
    if (!approval) errors.push(`run.approvalRefs references missing approval: ${ref}`);
    else if (approval.runId !== run.runId) errors.push(`approval ${ref} belongs to a different run`);
    else if (approval.status !== "approved") errors.push(`approval ${ref} is not approved`);
  }
  return errors;
};

const validateMapping = (mapping) => {
  const errors = [];
  if (!mapping?.allowedFamilies?.every(isLegacyVisualFamily)) errors.push("mapping.allowedFamilies invalid");
  if (!mapping?.allowedPresets?.length) errors.push("mapping.allowedPresets required");
  if (mapping?.defaultFamily !== undefined && !mapping.allowedFamilies?.includes(mapping.defaultFamily)) errors.push("mapping.defaultFamily not allowed");
  if (!mapping?.allowedPresets?.includes(mapping.defaultPreset)) errors.push("mapping.defaultPreset not allowed");
  if (!(mapping?.minSceneSeconds > 0 && mapping?.maxSceneSeconds >= mapping.minSceneSeconds)) errors.push("invalid duration bounds");
  if (!Number.isInteger(mapping?.maxItemsPerScene) || mapping.maxItemsPerScene < 1) errors.push("invalid maxItemsPerScene");
  return errors;
};

const validateSharedFlow = (flow) => {
  const errors = [];
  if (!isNonEmptyString(flow?.projectId)) errors.push("projectId required");
  if (!Number.isInteger(flow?.fps) || flow.fps < 1 || flow.fps > 120) errors.push("invalid fps");
  if (!isNonEmptyString(flow?.themeId)) errors.push("themeId required");
  if (!Array.isArray(flow?.sources) || !flow.sources.length) errors.push("sources required");
  const sourceIds = new Set();
  for (const source of flow?.sources ?? []) {
    if (!isNonEmptyString(source.id) || sourceIds.has(source.id)) errors.push("source ids must be unique");
    sourceIds.add(source.id);
    if (source.type === "command" && !isNonEmptyString(source.command)) errors.push("command required");
    if (source.type === "asciicast" && !isNonEmptyString(source.path)) errors.push("asciicast path required");
    if (source.type === "content_brief" && !isNonEmptyString(source.path)) errors.push("content_brief path required");
    if (source.captureInputEvents) errors.push("sensitive input capture enabled");
  }
  return [...errors, ...validateMapping(flow?.mapping)];
};

export const validateVisualFlowV1 = (flow) => {
  const errors = validateSharedFlow(flow);
  if (flow?.schemaVersion !== "visual-flow/v1") errors.push("invalid v1 schemaVersion");
  if (!flow?.mapping?.allowedFamilies?.includes(flow?.mapping?.defaultFamily)) errors.push("defaultFamily not allowed");
  return errors;
};

export const adaptVisualFlowV1 = (flow, { onWarning = console.warn } = {}) => {
  if (flow?.schemaVersion !== "visual-flow/v1") throw new Error("visual-flow/v1 adapter received a non-v1 config");
  onWarning(VISUAL_FLOW_V1_DEPRECATION);
  const sourceFamilies = [
    ...new Set((flow.sources ?? []).map((source) => source.family).filter((family) => VISUAL_FAMILIES.has(family))),
  ];
  const family = sourceFamilies.length === 1 ? sourceFamilies[0] : flow.mapping?.defaultFamily;
  return {
    ...flow,
    schemaVersion: "visual-flow/v2",
    run: {
      schemaVersion: "lucida-run/v1",
      runId: `legacy-${flow.projectId}`,
      lane: "rapid-visual-pilot",
      styleMode: "locked",
      lockedStyle: {
        family,
        lockedBy: "visual-flow/v1-adapter",
        reason: "Legacy family preference preserved as a locked style.",
      },
      publicationStatus: "non_publishable",
      approvalRefs: [],
    },
  };
};

export const validateVisualFlowV2 = (flow) => {
  const errors = validateSharedFlow(flow);
  if (flow?.schemaVersion !== "visual-flow/v2") errors.push("invalid v2 schemaVersion");
  errors.push(...validateRunEnvelope(flow?.run));
  if (flow?.run?.lane === "production") {
    const contentBriefCount = flow.sources?.filter((source) => source.type === "content_brief").length ?? 0;
    if (contentBriefCount !== 1) errors.push("production visual-flow/v2 requires exactly one content_brief source");
  }
  if (flow?.run?.styleMode === "auto") {
    if (flow.sources?.some((source) => source.family !== undefined)) errors.push("v2 auto rejects source family metadata");
    if (flow.mapping?.defaultFamily !== undefined) errors.push("v2 auto rejects mapping.defaultFamily");
  }
  return errors;
};

export const validateVisualFlow = (flow, options) => {
  if (flow?.schemaVersion === "visual-flow/v1") {
    const errors = validateVisualFlowV1(flow);
    if (errors.length) return { errors, adapted: null };
    const adapted = adaptVisualFlowV1(flow, options);
    return { errors: validateVisualFlowV2(adapted), adapted };
  }
  return { errors: validateVisualFlowV2(flow), adapted: null };
};
