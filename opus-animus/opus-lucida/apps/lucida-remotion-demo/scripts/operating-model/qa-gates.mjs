import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { resolveProductionPackageId } from "../../pipeline/director/style-identifiers.mjs";

export const QA_SCHEMA_VERSION = "lucida-qa/v1";
export const QA_THRESHOLDS = Object.freeze({
  nonSilentMeanDb: -45,
  clippingPeakDb: -0.1,
  captionDriftMs: 80,
  minimumVideoBytes: 1024,
});
export const REQUIRED_QA_INPUTS = Object.freeze([
  "approvedScript",
  "sourceVideoMap",
  "timedVideoMap",
  "renderProps",
  "timedScript",
  "audio",
  "normalizedInput",
]);
export const CONTENT_BRIEF_QA_INPUT = "contentBrief";
export const REQUIRED_POST_RENDER_CHECK_IDS = Object.freeze([
  "audio-stream",
  "audio-non-silent",
  "audio-clipping",
  "caption-timing",
  "render-integrity",
]);

const qaSchemaPath = fileURLToPath(new URL("../../pipeline/schemas/qa-report.schema.json", import.meta.url));
const qaSchema = JSON.parse(fs.readFileSync(qaSchemaPath, "utf8"));
const validateQaSchema = new Ajv2020({ strict: false, validateFormats: false }).compile(qaSchema);
const schemaErrorSummary = () => (validateQaSchema.errors ?? [])
  .slice(0, 3)
  .map((error) => `${error.instancePath || "/"} ${error.message}`.trim())
  .join("; ");
const missingInputChecksumFromSchema = () => (validateQaSchema.errors ?? []).find(
  (error) => error.keyword === "required"
    && error.instancePath === "/inputChecksums"
    && REQUIRED_QA_INPUTS.includes(error.params?.missingProperty),
)?.params?.missingProperty;

export const sha256File = (filePath) =>
  `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;

export const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

export const makeCheck = (id, passed, evidence, message) => ({
  id,
  status: passed ? "passed" : "failed",
  evidence,
  ...(message ? { message } : {}),
});

const itemText = (item) => [item?.label, item?.title, item?.body, item?.note].filter(Boolean).join(" ");
const sceneBodyChars = (scene) => [
  scene?.subtitle?.text,
  scene?.content?.subtitle,
  scene?.content?.footer,
  ...(scene?.content?.items ?? []).map(itemText),
  ...(scene?.content?.steps ?? []).map(itemText),
  ...(scene?.content?.panels ?? []).map((panel) => [panel?.title, panel?.body].filter(Boolean).join(" ")),
].join(" ").length;
const sceneItems = (scene) => Math.max(scene?.content?.items?.length ?? 0, scene?.content?.steps?.length ?? 0);

const capacityCheck = (scene, packageSpec) => {
  const capacity = packageSpec?.contentCapacity ?? {};
  const measures = {
    headlineChars: scene?.headline?.length ?? 0,
    bodyChars: sceneBodyChars(scene),
    maxItems: sceneItems(scene),
    maxPanels: scene?.content?.panels?.length ?? 0,
    maxMetrics: scene?.content?.metrics?.length ?? 0,
    maxCodeLines: scene?.content?.lines?.length ?? 0,
  };
  const exceeded = Object.entries(measures).flatMap(([key, actual]) =>
    Number.isFinite(capacity[key]) && actual > capacity[key]
      ? [{ key, actual, limit: capacity[key] }]
      : [],
  );
  return { measures, capacity, exceeded };
};

export const evaluateContentCapacity = ({ videoMap, packageLoader }) => {
  const checks = (videoMap?.scenes ?? []).map((scene) => {
    const packageId = resolveProductionPackageId(scene.visualFamily);
    if (!packageId) {
      return makeCheck(
        `content-capacity:${scene.id ?? "unknown"}`,
        false,
        { sceneId: scene.id ?? null, visualFamily: scene.visualFamily ?? null },
        "Production scene has no selected production style package.",
      );
    }
    const packageSpec = packageLoader(packageId);
    if (!packageSpec) {
      return makeCheck(
        `content-capacity:${scene.id ?? "unknown"}`,
        false,
        { sceneId: scene.id ?? null, packageId },
        "Selected production style package cannot be loaded.",
      );
    }
    const result = capacityCheck(scene, packageSpec);
    return makeCheck(
      `content-capacity:${scene.id ?? "unknown"}`,
      result.exceeded.length === 0,
      { sceneId: scene.id ?? null, packageId, ...result },
      result.exceeded.length ? "Scene exceeds the selected package content capacity." : undefined,
    );
  });
  return checks.length
    ? checks
    : [makeCheck("content-capacity:video", false, {}, "Production video must contain scenes.")];
};

const validProvenance = (provenance) =>
  typeof provenance?.sourceId === "string" && provenance.sourceId.length > 0
  && typeof provenance?.sourceRef === "string" && provenance.sourceRef.length > 0
  && /^sha256:[a-f0-9]{64}$/u.test(provenance?.sourceChecksum ?? "")
  && typeof provenance?.collectorVersion === "string" && provenance.collectorVersion.length > 0;

export const evaluateProvenanceCompleteness = ({ videoMap, normalizedInput }) => {
  const sourceBlocks = videoMap?.video?.sourceBlocks;
  if (!Array.isArray(sourceBlocks) || sourceBlocks.length === 0) {
    return [makeCheck("factual-provenance", false, { sourceBlocks: sourceBlocks ?? null }, "Production video must declare factual sourceBlocks.")];
  }
  const events = new Map((normalizedInput?.events ?? []).map((event) => [event.id, event]));
  return sourceBlocks.map((sourceBlock) => {
    const event = events.get(sourceBlock);
    const passed = Boolean(event) && validProvenance(event.provenance);
    return makeCheck(
      `factual-provenance:${sourceBlock}`,
      passed,
      {
        sourceBlock,
        eventFound: Boolean(event),
        provenance: event?.provenance ?? null,
      },
      passed ? undefined : "A factual source block is missing complete normalized provenance.",
    );
  });
};

export const evaluateTimedInputs = ({ renderProps, timedScript, audioPath }) => {
  const audio = renderProps?.audio;
  const phrases = timedScript?.phrases;
  const audioExists = Boolean(audioPath && fs.statSync(audioPath, { throwIfNoEntry: false })?.isFile());
  const actualChecksum = audioExists ? sha256File(audioPath) : null;
  const checksumMatches = typeof audio?.checksum === "string"
    && audio.checksum === actualChecksum
    && timedScript?.voiceChecksum === actualChecksum;
  const inputChecks = [
    makeCheck("timed-input:audio", audioExists, { audioPath: audioPath ?? null }, "Production render requires an existing audio input."),
    makeCheck("timed-input:audio-checksum", checksumMatches, { actualChecksum, renderChecksum: audio?.checksum ?? null, timedChecksum: timedScript?.voiceChecksum ?? null }, "Render props and TimedScript checksums must match the actual audio bytes."),
    makeCheck("timed-input:phrases", Array.isArray(phrases) && phrases.length > 0, { phraseCount: Array.isArray(phrases) ? phrases.length : null }, "Production render requires TimedScript caption phrases."),
  ];
  return inputChecks;
};

export const evaluateCaptionTiming = ({ timedScript, audioDurationMs, fps }) => {
  const phrases = timedScript?.phrases ?? [];
  const timingInputsValid = Number.isFinite(audioDurationMs) && audioDurationMs > 0 && Number.isFinite(fps) && fps > 0;
  if (!timingInputsValid) {
    return makeCheck(
      "caption-timing",
      false,
      { phraseCount: phrases.length, audioDurationMs, fps, thresholdMs: QA_THRESHOLDS.captionDriftMs, invalid: [] },
      "Caption timing requires a positive finite audio duration and fps.",
    );
  }
  const frameMs = 1000 / fps;
  const invalid = [];
  let maximumDriftMs = 0;
  for (const phrase of phrases) {
    const startMs = phrase?.startMs;
    const endMs = phrase?.endMs;
    const renderedStartMs = Number.isFinite(phrase?.renderStartMs)
      ? phrase.renderStartMs
      : Math.round(startMs / frameMs) * frameMs;
    const driftMs = Number.isFinite(startMs)
      ? Math.abs(startMs - renderedStartMs)
      : Number.POSITIVE_INFINITY;
    maximumDriftMs = Math.max(maximumDriftMs, driftMs);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs < 0 || endMs < 0 || endMs <= startMs || endMs > audioDurationMs || driftMs > QA_THRESHOLDS.captionDriftMs) {
      invalid.push({ phraseId: phrase?.phraseId ?? null, startMs, renderedStartMs, endMs, driftMs: Number.isFinite(driftMs) ? driftMs : null });
    }
  }
  const passed = phrases.length > 0 && invalid.length === 0;
  return makeCheck(
    "caption-timing",
    passed,
    { phraseCount: phrases.length, audioDurationMs, fps, maximumDriftMs, thresholdMs: QA_THRESHOLDS.captionDriftMs, invalid },
    passed ? undefined : "Caption timing is missing, outside audio bounds, or exceeds the hard drift threshold.",
  );
};

export const evaluateAudioMetrics = ({ streamPresent, meanVolumeDb, peakVolumeDb }) => {
  const checks = [
    makeCheck("audio-stream", streamPresent === true, { streamPresent }, "Rendered video has no audio stream."),
    makeCheck(
      "audio-non-silent",
      Number.isFinite(meanVolumeDb) && meanVolumeDb > QA_THRESHOLDS.nonSilentMeanDb,
      { meanVolumeDb, thresholdDb: QA_THRESHOLDS.nonSilentMeanDb },
      "Rendered audio is silent or below the minimum mean loudness threshold.",
    ),
    makeCheck(
      "audio-clipping",
      Number.isFinite(peakVolumeDb) && peakVolumeDb < QA_THRESHOLDS.clippingPeakDb,
      { peakVolumeDb, thresholdDb: QA_THRESHOLDS.clippingPeakDb },
      "Rendered audio peak meets or exceeds the clipping threshold.",
    ),
  ];
  return checks;
};

const runCaptured = (command, args) => spawnSync(command, args, {
  encoding: "utf8",
  windowsHide: true,
  maxBuffer: 2 * 1024 * 1024,
});

export const probeAudioMetrics = (videoPath) => {
  const streamProbe = runCaptured("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "json", videoPath]);
  const volumeProbe = runCaptured("ffmpeg", ["-hide_banner", "-nostats", "-i", videoPath, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"]);
  const output = `${volumeProbe.stdout ?? ""}\n${volumeProbe.stderr ?? ""}`;
  const mean = output.match(/mean_volume:\s*(-?(?:\d+(?:\.\d+)?)|-inf)\s*dB/u)?.[1];
  const peak = output.match(/max_volume:\s*(-?(?:\d+(?:\.\d+)?)|-inf)\s*dB/u)?.[1];
  const parseDb = (value) => value === "-inf" ? Number.NEGATIVE_INFINITY : Number(value);
  let streamPresent = false;
  try {
    streamPresent = streamProbe.status === 0 && JSON.parse(streamProbe.stdout)?.streams?.some((stream) => stream.codec_type === "audio");
  } catch {
    streamPresent = false;
  }
  return {
    streamPresent,
    meanVolumeDb: parseDb(mean),
    peakVolumeDb: parseDb(peak),
    evidence: {
      ffprobeStatus: streamProbe.status,
      ffmpegStatus: volumeProbe.status,
      volumeDetect: output.slice(-4000),
    },
  };
};

export const probeRenderIntegrity = ({ videoPath, expectedVideo }) => {
  const stat = fs.statSync(videoPath, { throwIfNoEntry: false });
  if (!stat?.isFile()) return makeCheck("render-integrity", false, { videoPath }, "Rendered video does not exist.");
  const probe = runCaptured("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", videoPath]);
  const decode = runCaptured("ffmpeg", ["-v", "error", "-i", videoPath, "-map", "0:v:0", "-frames:v", "1", "-f", "null", "-"]);
  let videoStream = null;
  let durationSec = null;
  try {
    const parsed = JSON.parse(probe.stdout);
    videoStream = parsed.streams?.find((stream) => stream.codec_type === "video") ?? null;
    durationSec = Number(parsed.format?.duration);
  } catch {
    // The failed status and null stream are included in evidence below.
  }
  const expectedDurationSec = Number(expectedVideo?.durationSec);
  const passed = stat.size >= QA_THRESHOLDS.minimumVideoBytes
    && probe.status === 0
    && decode.status === 0
    && videoStream
    && Number(videoStream.width) === Number(expectedVideo?.width)
    && Number(videoStream.height) === Number(expectedVideo?.height)
    && Number.isFinite(durationSec)
    && durationSec > 0
    && (!Number.isFinite(expectedDurationSec) || Math.abs(durationSec - expectedDurationSec) <= 0.25);
  return makeCheck(
    "render-integrity",
    Boolean(passed),
    {
      bytes: stat.size,
      minimumBytes: QA_THRESHOLDS.minimumVideoBytes,
      ffprobeStatus: probe.status,
      decodeStatus: decode.status,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      durationSec,
      expected: { width: expectedVideo?.width ?? null, height: expectedVideo?.height ?? null, durationSec: expectedDurationSec },
    },
    passed ? undefined : "Rendered video failed stream, decode, dimension, duration, or minimum-size integrity checks.",
  );
};

export const checksPassed = (checks) => checks.every((check) => check.status === "passed");

const assertQaReportContract = (report, runId) => {
  if (!validateQaSchema(report)) {
    const missingInput = missingInputChecksumFromSchema();
    throw new Error(`QA report schema invalid: ${schemaErrorSummary()}${missingInput ? `; QA report input checksum drift: ${missingInput}` : ""}`);
  }
  if (report?.schemaVersion !== QA_SCHEMA_VERSION || report?.status !== "passed" || report?.runId !== runId) {
    throw new Error("QA report is not a passed report for this production run.");
  }
  if (report.phase !== "post-render") throw new Error("QA report must be a post-render report.");
  if (!Array.isArray(report.checks) || report.checks.length === 0) throw new Error("QA report checks must be nonempty.");
  const ids = report.checks.map((check) => check?.id);
  if (ids.some((id) => typeof id !== "string" || id.length === 0) || new Set(ids).size !== ids.length) {
    throw new Error("QA report checks must have unique nonempty IDs.");
  }
  const failedCheck = report.checks.find((check) => check?.status !== "passed");
  if (failedCheck) throw new Error(`QA report contains a failed check: ${failedCheck.id ?? "unknown"}.`);
};

export const assertPassedBoundQaReport = ({ qaReportPath, runId, inputPaths, renderPath }) => {
  if (!qaReportPath || !fs.statSync(qaReportPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("Passed bound QA report is required before finalization or publish.");
  }
  let report;
  try {
    report = readJson(qaReportPath);
  } catch (error) {
    throw new Error(`QA report cannot be read: ${error.message}`);
  }
  assertQaReportContract(report, runId);
  const suppliedPaths = { ...(inputPaths ?? {}) };
  delete suppliedPaths.render;
  const requiredInputs = inputPaths?.[CONTENT_BRIEF_QA_INPUT]
    ? [...REQUIRED_QA_INPUTS, CONTENT_BRIEF_QA_INPUT]
    : REQUIRED_QA_INPUTS;
  for (const name of requiredInputs) {
    const filePath = suppliedPaths[name];
    if (!filePath || !fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      throw new Error(`QA-bound input does not exist: ${name}`);
    }
    const current = sha256File(filePath);
    if (report.inputChecksums?.[name] !== current) {
      throw new Error(`QA report input checksum drift: ${name}`);
    }
  }
  const checksumNames = Object.keys(report.inputChecksums ?? {}).sort();
  const requiredNames = [...requiredInputs].sort();
  if (checksumNames.length !== requiredNames.length || checksumNames.some((name, index) => name !== requiredNames[index])) {
    throw new Error("QA report input checksums must contain exactly the required production inputs.");
  }
  const missingRequiredChecks = REQUIRED_POST_RENDER_CHECK_IDS.filter((id) => !report.checks.some((check) => check.id === id));
  if (missingRequiredChecks.length) throw new Error(`QA report is missing required post-render checks: ${missingRequiredChecks.join(", ")}.`);
  if (!/^sha256:[a-f0-9]{64}$/u.test(report.renderChecksum ?? "")) {
    throw new Error("QA report render checksum is required and must be SHA-256.");
  }
  const renderChecksum = sha256File(renderPath);
  if (report.renderChecksum !== renderChecksum) {
    throw new Error("QA report render checksum drift.");
  }
  return report;
};

export const loadStylePackage = ({ appRoot, packageId }) => {
  const safeId = resolveProductionPackageId(packageId);
  if (!safeId) return null;
  const packagePath = path.join(appRoot, "design", "visual-library", "styles", safeId, "visual.json");
  return fs.statSync(packagePath, { throwIfNoEntry: false })?.isFile() ? readJson(packagePath) : null;
};

export const relativeChecksumPaths = (paths) => Object.fromEntries(
  Object.entries(paths).filter(([, value]) => value && fs.statSync(value, { throwIfNoEntry: false })?.isFile()).map(([name, value]) => [name, sha256File(value)]),
);

export const assertContainedPath = ({ root, candidate, label }) => {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must be contained under ${resolvedRoot}`);
  }
  return resolvedCandidate;
};
