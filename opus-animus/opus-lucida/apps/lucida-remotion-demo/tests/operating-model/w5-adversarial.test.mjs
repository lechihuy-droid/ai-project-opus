import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import {
  assertValidContentBrief,
  assertNormalizedContentBriefBinding,
  readContentBriefFile,
  validateContentBrief,
} from "../../pipeline/contracts/content-brief-contracts.mjs";
import { collectContentBrief } from "../../pipeline/collectors/content-brief.mjs";
import { sha256 } from "../../pipeline/collectors/shared.mjs";
import { normalizeSanitizedInput, sanitizeRawInput } from "../../pipeline/processors/index.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const CONTENT_BRIEF_SCHEMA = path.join(APP_ROOT, "pipeline", "schemas", "content-brief.schema.json");
const CONTENT_BRIEF_FIXTURE = path.join(APP_ROOT, "pipeline", "fixtures", "content-brief", "valid-auto.fixture.json");
const CONTENT_BRIEF_RELATIVE = "pipeline/fixtures/content-brief/valid-auto.fixture.json";
const SCRIPT_RELATIVE = "pipeline/fixtures/audio/approved-script.fixture.json";
const VIDEO_MAP_RELATIVE = "pipeline/fixtures/audio/video-map.fixture.json";
const ENVELOPE_FIXTURE = path.join(APP_ROOT, "pipeline", "fixtures", "flow", "production-envelope.fixture.json");
const APPROVALS_FIXTURE = path.join(APP_ROOT, "pipeline", "fixtures", "flow", "production-approvals.fixture.json");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const baseBrief = readJson(CONTENT_BRIEF_FIXTURE);
const baseRun = {
  schemaVersion: "lucida-run/v1",
  runId: "w5-adversarial",
  lane: "rapid-visual-pilot",
  styleMode: "auto",
  publicationStatus: "non_publishable",
  approvalRefs: [],
};

const tempDirectory = (prefix) => fs.mkdtempSync(path.join(os.tmpdir(), prefix));
const removeIfPresent = (filePath) => fs.rmSync(filePath, { recursive: true, force: true });

const makeNormalizedInput = () => {
  const collected = collectContentBrief({
    source: { id: "brief", type: "content_brief", path: CONTENT_BRIEF_RELATIVE },
    projectRoot: APP_ROOT,
    runEnvelope: baseRun,
  });
  const sanitized = sanitizeRawInput({
    schemaVersion: "raw-visual-input/v1",
    projectId: baseRun.runId,
    generatedAt: "2026-07-16T00:00:00.000Z",
    inputMode: "content-brief",
    sources: [collected],
    warnings: [],
  });
  return normalizeSanitizedInput(sanitized, { fps: 30 });
};

const runProductionCli = ({ normalized, normalizedPath, contentBriefPath = CONTENT_BRIEF_RELATIVE }) => {
  const tempRoot = fs.mkdtempSync(path.join(APP_ROOT, "tests", ".tmp-w5-cli-"));
  const runId = `w5-adversarial-${crypto.randomUUID()}`;
  const runDir = path.join(APP_ROOT, "output", "render", "flow-runs", runId);
  const pipelineRunDir = path.join(APP_ROOT, "pipeline", "runs", runId);
  const envelope = { ...readJson(ENVELOPE_FIXTURE), runId };
  const approvals = readJson(APPROVALS_FIXTURE).map((approval) => ({ ...approval, runId }));
  const normalizedFile = normalizedPath ?? path.join(tempRoot, "normalized-input.json");
  if (!normalizedPath) fs.writeFileSync(normalizedFile, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  const envelopeFile = path.join(tempRoot, "run-envelope.json");
  const approvalsFile = path.join(tempRoot, "approvals.json");
  fs.writeFileSync(envelopeFile, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  fs.writeFileSync(approvalsFile, `${JSON.stringify(approvals, null, 2)}\n`, "utf8");

  const result = spawnSync(process.execPath, [
    path.join(APP_ROOT, "scripts", "run-flow.mjs"),
    "--content-brief", contentBriefPath,
    "--script", SCRIPT_RELATIVE,
    "--video-map", VIDEO_MAP_RELATIVE,
    "--normalized-input", normalizedPath ?? path.relative(APP_ROOT, normalizedFile),
    "--run-envelope", path.relative(APP_ROOT, envelopeFile),
    "--approvals", path.relative(APP_ROOT, approvalsFile),
    "--run-id", runId,
    "--skip-voice",
  ], { cwd: APP_ROOT, encoding: "utf8" });

  const acceptedBeforeExecution = fs.existsSync(runDir);
  removeIfPresent(runDir);
  removeIfPresent(pipelineRunDir);
  removeIfPresent(tempRoot);
  return { acceptedBeforeExecution, result };
};

test("runtime imports and loads the canonical ContentBrief schema", () => {
  const probe = [
    "import fs from 'node:fs';",
    "const reads = [];",
    "const original = fs.readFileSync;",
    "fs.readFileSync = (...args) => { reads.push(String(args[0])); return original.call(fs, ...args); };",
    `await import(${JSON.stringify(pathToFileURL(path.join(APP_ROOT, "pipeline", "contracts", "content-brief-contracts.mjs")).href)} + '?w5-schema-probe');`,
    "process.stdout.write(JSON.stringify(reads));",
  ].join("\n");
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", probe], {
    cwd: APP_ROOT,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const reads = JSON.parse(result.stdout);
  assert.ok(
    reads.some((filePath) => path.basename(filePath) === "content-brief.schema.json"),
    `runtime did not load ${CONTENT_BRIEF_SCHEMA}; reads=${JSON.stringify(reads)}`,
  );
});

test("canonical shape parity holds while manual semantic constraints remain enforced", () => {
  const schema = readJson(CONTENT_BRIEF_SCHEMA);
  const validateCanonical = new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(schema);
  const shapeCases = [
    {
      name: "valid",
      value: baseBrief,
    },
    {
      name: "unknown property",
      value: { ...baseBrief, unexpected: true },
    },
    {
      name: "unknown style enum",
      value: { ...baseBrief, styleMode: "surprise" },
    },
    {
      name: "unknown role enum",
      value: { ...baseBrief, beats: [{ ...baseBrief.beats[0], role: "surprise" }, baseBrief.beats[1]] },
    },
    {
      name: "duplicate factual source ID",
      value: { ...baseBrief, factualSourceIds: [baseBrief.factualSourceIds[0], baseBrief.factualSourceIds[0]] },
    },
    {
      name: "duplicate actor scalar",
      value: { ...baseBrief, beats: [{ ...baseBrief.beats[0], actors: [baseBrief.beats[0].actors[0], baseBrief.beats[0].actors[0]] }, baseBrief.beats[1]] },
    },
    {
      name: "duplicate factRef scalar",
      value: { ...baseBrief, beats: [{ ...baseBrief.beats[0], factRefs: [baseBrief.beats[0].factRefs[0], baseBrief.beats[0].factRefs[0]] }, baseBrief.beats[1]] },
    },
    {
      name: "empty actor and factRef arrays",
      value: { ...baseBrief, beats: [{ ...baseBrief.beats[0], actors: [], factRefs: [] }, baseBrief.beats[1]] },
    },
  ];
  const semanticCases = [
    {
      name: "duplicate beat ID",
      value: { ...baseBrief, beats: [baseBrief.beats[0], { ...baseBrief.beats[1], id: baseBrief.beats[0].id }] },
    },
    {
      name: "unknown fact reference",
      value: { ...baseBrief, beats: [{ ...baseBrief.beats[0], factRefs: ["fact-not-declared"] }, baseBrief.beats[1]] },
    },
  ];

  for (const item of shapeCases) {
    const canonicalValid = validateCanonical(item.value);
    const manualValid = validateContentBrief(item.value).length === 0;
    assert.equal(canonicalValid, manualValid, `${item.name}: canonical/manual shape drift`);
  }

  for (const item of semanticCases) {
    assert.equal(validateCanonical(item.value), true, `${item.name}: canonical shape should remain valid`);
    assert.notEqual(validateContentBrief(item.value).length, 0, `${item.name}: manual semantic validation must reject`);
    assert.throws(() => assertValidContentBrief(item.value), /Invalid ContentBrief/);
  }

  assert.doesNotThrow(() => assertValidContentBrief(baseBrief));
  assert.throws(() => assertValidContentBrief(shapeCases[1].value), /Invalid ContentBrief/);
  assert.throws(() => assertValidContentBrief(shapeCases[2].value), /styleMode invalid/);
});

test("ContentBrief collection rejects a junction or symlink that resolves outside the approved root", (t) => {
  const projectRoot = tempDirectory("lucida-w5-root-");
  const outsideRoot = tempDirectory("lucida-w5-outside-");
  const outsideBrief = path.join(outsideRoot, "brief.json");
  const linkPath = path.join(projectRoot, "linked");
  fs.writeFileSync(outsideBrief, `${JSON.stringify(baseBrief)}\n`, "utf8");
  t.after(() => {
    removeIfPresent(projectRoot);
    removeIfPresent(outsideRoot);
  });

  let linkKind = "junction";
  try {
    fs.symlinkSync(outsideRoot, linkPath, "junction");
  } catch (junctionError) {
    linkKind = "dir-symlink";
    try {
      fs.symlinkSync(outsideRoot, linkPath, "dir");
    } catch (symlinkError) {
      if (!["EPERM", "EACCES", "ENOTSUP", "EINVAL"].includes(symlinkError.code)) throw symlinkError;
      t.skip(`OS disallows junction/symlink creation: junction=${junctionError.code}, symlink=${symlinkError.code}`);
      return;
    }
  }

  assert.throws(
    () => readContentBriefFile({ projectRoot, filePath: `${path.basename(linkPath)}/brief.json` }),
    /escapes the project root|Path escapes approved root/,
    `${linkKind} target escaped approved root`,
  );
});

test("an exported normalized binding validator rejects missing, mutated, injected, reordered, and forged events", async () => {
  const normalized = makeNormalizedInput();
  const collected = collectContentBrief({
    source: { id: "brief", type: "content_brief", path: CONTENT_BRIEF_RELATIVE },
    projectRoot: APP_ROOT,
    runEnvelope: baseRun,
  });
  const variants = {
    omitted: { ...normalized, events: [] },
    mutated: { ...normalized, events: normalized.events.map((event, index) => index === 0 ? { ...event, body: "tampered" } : event) },
    injected: { ...normalized, events: [...normalized.events, { ...normalized.events[0], id: "beat-injected", beatId: "injected" }] },
    reordered: { ...normalized, events: [...normalized.events].reverse() },
    forgedProvenance: { ...normalized, events: normalized.events.map((event) => ({ ...event, provenance: { ...event.provenance, sourceChecksum: `sha256:${"f".repeat(64)}` } })) },
  };
  for (const [name, value] of Object.entries(variants)) {
    assert.throws(() => assertNormalizedContentBriefBinding({
      brief: normalized.contentBrief,
      normalizedInput: value,
      sourceId: collected.sourceId,
      rawChecksum: collected.checksum,
      projectRoot: APP_ROOT,
      briefPath: CONTENT_BRIEF_RELATIVE,
      expectedProjectId: baseRun.runId,
      expectedRunId: baseRun.runId,
    }), /normalized|binding|brief|event|provenance/i, name);
  }
});

test("ContentBrief collector provenance hashes raw file bytes, including whitespace and line endings", () => {
  const root = tempDirectory("lucida-w5-checksum-");
  const compactPath = path.join(root, "compact.json");
  const prettyPath = path.join(root, "pretty.json");
  const compactBytes = `${JSON.stringify(baseBrief)}\n`;
  const prettyBytes = `${JSON.stringify(baseBrief, null, 2).replaceAll("\n", "\r\n")}\r\n`;
  fs.writeFileSync(compactPath, compactBytes, "utf8");
  fs.writeFileSync(prettyPath, prettyBytes, "utf8");
  try {
    const compact = collectContentBrief({ source: { id: "compact", type: "content_brief", path: "compact.json" }, projectRoot: root });
    const pretty = collectContentBrief({ source: { id: "pretty", type: "content_brief", path: "pretty.json" }, projectRoot: root });
    assert.equal(compact.checksum, sha256(compactBytes));
    assert.equal(pretty.checksum, sha256(prettyBytes));
    assert.notEqual(compact.checksum, pretty.checksum, "whitespace/line-ending changes must change provenance checksum");
    assert.equal(compact.records[0].provenance.sourceChecksum, compact.checksum);
    assert.equal(pretty.records[0].provenance.sourceChecksum, pretty.checksum);
  } finally {
    removeIfPresent(root);
  }
});

test("production CLI rejects normalized event/source binding mismatches before execution", () => {
  const normalized = makeNormalizedInput();
  const variants = {
    omittedEvents: { ...normalized, events: [] },
    mutatedEvent: { ...normalized, events: normalized.events.map((event, index) => index === 0 ? { ...event, body: "tampered" } : event) },
    injectedEvent: { ...normalized, events: [...normalized.events, { ...normalized.events[0], id: "beat-injected", beatId: "injected" }] },
    reorderedEvents: { ...normalized, events: [...normalized.events].reverse() },
    wrongProvenance: { ...normalized, events: normalized.events.map((event) => ({ ...event, provenance: { ...event.provenance, sourceChecksum: `sha256:${"0".repeat(64)}` } })) },
    wrongRun: { ...normalized, projectId: "different-run" },
  };
  const accepted = [];
  for (const [name, value] of Object.entries(variants)) {
    const result = runProductionCli({ normalized: value });
    if (result.acceptedBeforeExecution) accepted.push({ name, stderr: result.result.stderr, stdout: result.result.stdout });
  }
  assert.deepEqual(accepted, [], `CLI accepted mismatched normalized artifacts: ${JSON.stringify(accepted)}`);
});

test("production CLI rejects normalized input outside the repository and same-content brief path substitution", () => {
  const normalized = makeNormalizedInput();
  const outsideRoot = tempDirectory("lucida-w5-cli-outside-");
  const internalRoot = fs.mkdtempSync(path.join(APP_ROOT, "tests", ".tmp-w5-brief-"));
  const outsideNormalized = path.join(outsideRoot, "normalized.json");
  const alternateBrief = path.join(internalRoot, "same-content-brief.json");
  fs.writeFileSync(outsideNormalized, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  fs.writeFileSync(alternateBrief, `${JSON.stringify(baseBrief, null, 2)}\n`, "utf8");
  try {
    const outsideResult = runProductionCli({ normalized, normalizedPath: outsideNormalized });
    const substitutedBriefResult = runProductionCli({ normalized, contentBriefPath: path.relative(APP_ROOT, alternateBrief) });
    assert.equal(outsideResult.acceptedBeforeExecution, false, outsideResult.result.stderr);
    assert.equal(substitutedBriefResult.acceptedBeforeExecution, false, substitutedBriefResult.result.stderr);
  } finally {
    removeIfPresent(outsideRoot);
    removeIfPresent(internalRoot);
  }
});
