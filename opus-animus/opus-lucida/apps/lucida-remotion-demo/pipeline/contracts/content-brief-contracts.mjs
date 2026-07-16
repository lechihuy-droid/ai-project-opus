import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { legacyFamilyForPackageId, resolveProductionPackageId } from "../director/style-identifiers.mjs";

export const CONTENT_BRIEF_SCHEMA_VERSION = "lucida-content-brief/v1";
export const CONTENT_BRIEF_COLLECTOR_VERSION = "content-brief-collector/1";
export const CONTENT_BRIEF_BEAT_ROLES = new Set([
  "hook", "context", "problem", "insight", "explanation", "evidence",
  "process", "comparison", "example", "turning-point", "takeaway",
  "call-to-action", "transition",
]);

const STYLE_MODES = new Set(["auto", "locked"]);
const FAMILIES = new Set(["terminal", "dashboard", "editorial", "infographic", "code", "data_visualization", "product_demo", "cinematic_typography"]);
const PACKAGES = new Set(["terminal-command-center", "technical-editorial", "minimal-education", "cinematic-type", "dashboard-data", "paper-notebook", "product-showcase", "editorial-collage", "timeline-documentary"]);
const DENSITIES = new Set(["low", "medium", "high"]);
const schemaPath = fileURLToPath(new URL("../schemas/content-brief.schema.json", import.meta.url));
const contentBriefSchema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const validateContentBriefSchema = new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(contentBriefSchema);

const schemaErrors = () => (validateContentBriefSchema.errors ?? [])
  .map((error) => `contentBrief${error.instancePath || ""} ${error.message}`.trim())
  .slice(0, 12);

const isText = (value) => typeof value === "string" && value.length > 0;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasOnly = (value, allowed, label, errors) => {
  if (!isRecord(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${label}.${key} is not allowed`);
  }
  return true;
};
const stringList = (value, label, errors) => {
  if (!Array.isArray(value) || !value.every(isText)) {
    errors.push(`${label} must be an array of non-empty strings`);
    return;
  }
  if (new Set(value).size !== value.length) errors.push(`${label} must be unique`);
};
const enumList = (value, label, values, errors) => {
  stringList(value, label, errors);
  for (const item of Array.isArray(value) ? value : []) {
    if (!values.has(item)) errors.push(`${label} contains unsupported value: ${item}`);
  }
};

const validateVisualConstraints = (constraints, errors) => {
  if (!hasOnly(constraints, new Set(["requiredPackages", "forbiddenPackages", "requiredFamilies", "forbiddenFamilies", "assets", "density", "layout"]), "visualConstraints", errors)) return;
  for (const key of ["requiredPackages", "forbiddenPackages"]) {
    if (constraints[key] !== undefined) enumList(constraints[key], `visualConstraints.${key}`, PACKAGES, errors);
  }
  for (const key of ["requiredFamilies", "forbiddenFamilies"]) {
    if (constraints[key] !== undefined) enumList(constraints[key], `visualConstraints.${key}`, FAMILIES, errors);
  }
  if (constraints.assets !== undefined && hasOnly(constraints.assets, new Set(["requiredClassifications", "allowedClassifications", "forbiddenClassifications"]), "visualConstraints.assets", errors)) {
    for (const key of ["requiredClassifications", "allowedClassifications", "forbiddenClassifications"]) {
      if (constraints.assets[key] !== undefined) stringList(constraints.assets[key], `visualConstraints.assets.${key}`, errors);
    }
  }
  if (constraints.density !== undefined && hasOnly(constraints.density, new Set(["preferred", "minimum", "maximum"]), "visualConstraints.density", errors)) {
    for (const key of ["preferred", "minimum", "maximum"]) {
      if (constraints.density[key] !== undefined && !DENSITIES.has(constraints.density[key])) errors.push(`visualConstraints.density.${key} invalid`);
    }
  }
  if (constraints.layout !== undefined && hasOnly(constraints.layout, new Set(["required", "forbidden", "minDistinct", "maxConsecutive"]), "visualConstraints.layout", errors)) {
    for (const key of ["required", "forbidden"]) {
      if (constraints.layout[key] !== undefined) stringList(constraints.layout[key], `visualConstraints.layout.${key}`, errors);
    }
    for (const key of ["minDistinct", "maxConsecutive"]) {
      if (constraints.layout[key] !== undefined && (!Number.isInteger(constraints.layout[key]) || constraints.layout[key] < 1)) errors.push(`visualConstraints.layout.${key} must be a positive integer`);
    }
  }
};

export const validateContentBrief = (brief, { runEnvelope } = {}) => {
  const schemaValid = validateContentBriefSchema(brief);
  const errors = schemaValid ? [] : schemaErrors();
  if (!hasOnly(brief, new Set(["schemaVersion", "title", "audience", "intent", "beats", "factualSourceIds", "visualConstraints", "styleMode"]), "contentBrief", errors)) return errors;
  if (brief.schemaVersion !== CONTENT_BRIEF_SCHEMA_VERSION) errors.push(`contentBrief.schemaVersion must be ${CONTENT_BRIEF_SCHEMA_VERSION}`);
  for (const key of ["title", "audience", "intent"]) if (!isText(brief[key])) errors.push(`contentBrief.${key} required`);
  if (!STYLE_MODES.has(brief.styleMode)) errors.push("contentBrief.styleMode invalid");
  stringList(brief.factualSourceIds, "contentBrief.factualSourceIds", errors);
  validateVisualConstraints(brief.visualConstraints, errors);
  if (!Array.isArray(brief.beats) || brief.beats.length === 0) {
    errors.push("contentBrief.beats must contain at least one beat");
  } else {
    const ids = new Set();
    for (const [index, beat] of brief.beats.entries()) {
      const label = `contentBrief.beats[${index}]`;
      if (!hasOnly(beat, new Set(["id", "title", "body", "intent", "role", "actors", "factRefs"]), label, errors)) continue;
      for (const key of ["id", "title", "body", "role"]) if (!isText(beat[key])) errors.push(`${label}.${key} required`);
      if (ids.has(beat.id)) errors.push(`contentBrief.beats duplicate id: ${beat.id}`);
      ids.add(beat.id);
      if (!CONTENT_BRIEF_BEAT_ROLES.has(beat.role)) errors.push(`${label}.role invalid`);
      if (beat.intent !== undefined && !isText(beat.intent)) errors.push(`${label}.intent must be a non-empty string when present`);
      stringList(beat.actors, `${label}.actors`, errors);
      stringList(beat.factRefs, `${label}.factRefs`, errors);
      for (const factRef of Array.isArray(beat.factRefs) ? beat.factRefs : []) {
        if (!brief.factualSourceIds?.includes(factRef)) errors.push(`${label}.factRefs references unknown factualSourceId: ${factRef}`);
      }
    }
  }
  if (brief.styleMode === "auto" && ((brief.visualConstraints?.requiredFamilies?.length ?? 0) > 0 || (brief.visualConstraints?.requiredPackages?.length ?? 0) > 0)) {
    errors.push("contentBrief auto mode rejects required family/package constraints because they implicitly lock style");
  }
  if (runEnvelope) {
    if (brief.styleMode !== runEnvelope.styleMode) errors.push("contentBrief.styleMode must match run.styleMode");
    if (brief.styleMode === "locked") {
      const packageId = resolveProductionPackageId(runEnvelope.lockedStyle?.family);
      const family = legacyFamilyForPackageId(packageId);
      if (packageId && brief.visualConstraints?.forbiddenPackages?.includes(packageId)) errors.push("contentBrief forbids the run's locked package");
      if (family && brief.visualConstraints?.forbiddenFamilies?.includes(family)) errors.push("contentBrief forbids the run's locked family");
    }
  }
  return errors;
};

export const assertValidContentBrief = (brief, options) => {
  const errors = validateContentBrief(brief, options);
  if (errors.length) throw new Error(`Invalid ContentBrief: ${errors.join("; ")}`);
  return brief;
};

export const resolveExistingFileInside = ({ projectRoot, filePath, label = "file" }) => {
  let root;
  let candidate;
  let resolved;
  try {
    root = fs.realpathSync(projectRoot);
    candidate = path.resolve(root, filePath);
    resolved = fs.realpathSync(candidate);
  } catch (error) {
    throw new Error(`${label} must be an existing file inside the project root: ${error.message}`);
  }
  const relative = path.relative(root, resolved);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes the project root through path or symlink: ${filePath}`);
  }
  if (!fs.statSync(resolved).isFile()) throw new Error(`${label} must be a file: ${filePath}`);
  return { projectRoot: root, filePath: resolved, relativePath: relative.replaceAll("\\", "/") };
};

export const readContentBriefFile = ({ projectRoot, filePath, runEnvelope }) => {
  const resolved = resolveExistingFileInside({ projectRoot, filePath, label: "ContentBrief" });
  const rawBytes = fs.readFileSync(resolved.filePath);
  let value;
  try {
    value = JSON.parse(rawBytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Cannot read ContentBrief ${resolved.relativePath}: ${error.message}`);
  }
  return {
    brief: assertValidContentBrief(value, { runEnvelope }),
    filePath: resolved.filePath,
    projectRoot: resolved.projectRoot,
    relativePath: resolved.relativePath,
    rawChecksum: `sha256:${crypto.createHash("sha256").update(rawBytes).digest("hex")}`,
  };
};

const expectedSourceRef = ({ projectRoot, briefPath, beatId }) => {
  if (!projectRoot || !briefPath) return null;
  const resolved = resolveExistingFileInside({ projectRoot, filePath: briefPath, label: "ContentBrief" });
  return `${resolved.relativePath}#beat-${encodeURIComponent(beatId)}`;
};

export const assertNormalizedContentBriefBinding = ({
  brief,
  normalizedInput,
  sourceId,
  rawChecksum,
  projectRoot,
  briefPath,
  expectedProjectId,
  expectedRunId,
}) => {
  assertValidContentBrief(brief);
  if (normalizedInput?.schemaVersion !== "normalized-visual-input/v1") throw new Error("Normalized ContentBrief binding requires normalized-visual-input/v1");
  if (!isDeepStrictEqual(normalizedInput.contentBrief, brief)) throw new Error("Normalized ContentBrief binding does not match the supplied ContentBrief");
  if (expectedProjectId && normalizedInput.projectId !== expectedProjectId) throw new Error("Normalized ContentBrief projectId does not match the expected project");
  if (expectedRunId && normalizedInput.projectId !== expectedRunId) throw new Error("Normalized ContentBrief projectId does not match the production runId");
  const beatEvents = (normalizedInput.events ?? []).filter((event) => event?.beatId !== undefined);
  const resolvedSourceId = sourceId ?? beatEvents[0]?.sourceId;
  if (!resolvedSourceId || beatEvents.some((event) => event.sourceId !== resolvedSourceId)) throw new Error("Normalized ContentBrief events must have exactly one sourceId");
  const provenanceChecksums = new Set(beatEvents.map((event) => event?.provenance?.sourceChecksum));
  if (provenanceChecksums.size !== 1 || !/^sha256:[a-f0-9]{64}$/u.test([...provenanceChecksums][0] ?? "")) throw new Error("Normalized ContentBrief beat provenance checksums must be one valid value");
  if (normalizedInput.contentBriefProvenance && (
    normalizedInput.contentBriefProvenance.sourceId !== resolvedSourceId
    || normalizedInput.contentBriefProvenance.rawChecksum !== [...provenanceChecksums][0]
    || normalizedInput.contentBriefProvenance.collectorVersion !== CONTENT_BRIEF_COLLECTOR_VERSION
  )) throw new Error("Normalized ContentBrief root provenance does not match beat provenance");
  const narrativeEvents = (normalizedInput.events ?? []).filter((event) => event?.sourceId === resolvedSourceId && event?.kind === "narrative");
  if (beatEvents.length !== brief.beats.length || narrativeEvents.length !== brief.beats.length) throw new Error("Normalized ContentBrief beat event count must exactly match the brief");
  for (const [index, beat] of brief.beats.entries()) {
    const event = beatEvents[index];
    const narrative = narrativeEvents[index];
    const expectedIntent = beat.intent ?? brief.intent;
    if (event !== narrative || event.id !== `beat-${beat.id}` || event.beatId !== beat.id) throw new Error(`Normalized ContentBrief beat ${beat.id} has an invalid event identity or order`);
    if (event.title !== beat.title || event.body !== beat.body || event.text !== beat.body || event.intent !== expectedIntent || event.beatRole !== beat.role) throw new Error(`Normalized ContentBrief beat ${beat.id} changed title, body, intent, or role`);
    if (!isDeepStrictEqual(event.actors, beat.actors) || !isDeepStrictEqual(event.factRefs, beat.factRefs)) throw new Error(`Normalized ContentBrief beat ${beat.id} changed actors or factRefs`);
    if (!isDeepStrictEqual(event.factualSourceIds, brief.factualSourceIds) || !isDeepStrictEqual(event.visualConstraints, brief.visualConstraints)) throw new Error(`Normalized ContentBrief beat ${beat.id} changed top-level semantic inputs`);
    const sourceRef = expectedSourceRef({ projectRoot, briefPath, beatId: beat.id }) ?? event.provenance?.sourceRef;
    if (!expectedSourceRef({ projectRoot, briefPath, beatId: beat.id }) && !String(sourceRef ?? "").endsWith(`#beat-${encodeURIComponent(beat.id)}`)) throw new Error(`Normalized ContentBrief beat ${beat.id} has an invalid sourceRef`);
    if (event.provenance?.sourceId !== resolvedSourceId || event.sourceRef !== sourceRef || event.provenance?.sourceRef !== sourceRef) throw new Error(`Normalized ContentBrief beat ${beat.id} has invalid source provenance`);
    if (event.provenance?.collectorVersion !== CONTENT_BRIEF_COLLECTOR_VERSION) throw new Error(`Normalized ContentBrief beat ${beat.id} has invalid collector provenance`);
    if (rawChecksum && event.provenance?.sourceChecksum !== rawChecksum) throw new Error(`Normalized ContentBrief beat ${beat.id} source checksum does not match raw ContentBrief bytes`);
    if (!/^sha256:[a-f0-9]{64}$/u.test(event.provenance?.sourceChecksum ?? "")) throw new Error(`Normalized ContentBrief beat ${beat.id} has invalid source checksum`);
  }
  return { sourceId: resolvedSourceId, rawChecksum: rawChecksum ?? beatEvents[0].provenance.sourceChecksum };
};
