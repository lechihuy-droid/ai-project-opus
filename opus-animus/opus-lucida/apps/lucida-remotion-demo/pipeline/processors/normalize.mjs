import { parseAnsi } from "./ansi.mjs";
import { assertNormalizedContentBriefBinding, assertValidContentBrief } from "../contracts/content-brief-contracts.mjs";

const kindFor = (sourceType, recordKind) => {
  if (sourceType === "content_brief" && recordKind === "content_brief_beat") return "narrative";
  if (sourceType === "script" && recordKind === "script_block")
    return "narrative";
  if (sourceType === "command" && recordKind === "stdout") return "output";
  if (sourceType === "command" && recordKind === "stderr") return "log";
  if (recordKind === "repository_summary") return "layout_reference";
  if (recordKind === "media") return "layout_reference";
  return recordKind;
};

const textFor = (record) =>
  typeof record.text === "string"
    ? record.text
    : typeof record.data === "string"
      ? record.data
      : undefined;

export const normalizeSanitizedInput = (
  sanitized,
  { fps, idleTimeLimitSeconds = 1.5 },
) => {
  if (sanitized.schemaVersion !== "sanitized-visual-input/v1") {
    throw new Error(
      `Unsupported sanitized input schema: ${sanitized.schemaVersion}`,
    );
  }
  if (!Number.isInteger(fps) || fps < 1 || fps > 120)
    throw new Error("fps must be an integer from 1 to 120");

  const events = [];
  let eventIndex = 0;
  const contentBriefSources = sanitized.sources.filter((source) => source.sourceType === "content_brief");
  if (contentBriefSources.length > 1) throw new Error("Normalized input cannot contain more than one ContentBrief source");
  const contentBrief = contentBriefSources[0]?.contentBrief;
  if (contentBrief) assertValidContentBrief(contentBrief);
  const beatIds = new Set();

  for (const source of sanitized.sources) {
    let adjustedTime = 0;
    let previousSourceTime = 0;
    for (const record of source.records ?? []) {
      const sourceTime =
        typeof record.timeSeconds === "number" ? record.timeSeconds : undefined;
      if (sourceTime !== undefined) {
        const delta = Math.max(0, sourceTime - previousSourceTime);
        adjustedTime += Math.min(delta, idleTimeLimitSeconds);
        previousSourceTime = sourceTime;
      }

      const parsed = parseAnsi(textFor(record) ?? "");
      const kind = kindFor(source.sourceType, record.kind);
      const event = {
        id: source.sourceType === "content_brief" ? `beat-${record.beatId}` : `event-${String(++eventIndex).padStart(4, "0")}`,
        sourceId: source.sourceId,
        sourceRef: record.provenance.sourceRef,
        kind,
        provenance: record.provenance,
      };

      if (source.sourceType === "content_brief") {
        if (beatIds.has(record.beatId)) throw new Error(`Duplicate ContentBrief beat ID in normalized input: ${record.beatId}`);
        beatIds.add(record.beatId);
        event.beatId = record.beatId;
        event.title = record.title;
        event.body = record.body;
        event.intent = record.intent;
        event.beatRole = record.role;
        event.actors = record.actors;
        event.factRefs = record.factRefs;
        event.factualSourceIds = record.data.factualSourceIds;
        event.visualConstraints = record.data.visualConstraints;
      }

      if (sourceTime !== undefined) {
        event.timeSeconds = Number(adjustedTime.toFixed(6));
        event.frame = Math.round(adjustedTime * fps);
      }
      if (source.sourceType === "content_brief") {
        event.text = record.body;
      } else if (parsed.text)
        event.text = parsed.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      if (parsed.styleRuns.length) event.styleRuns = parsed.styleRuns;
      if (record.data && typeof record.data === "object") {
        event.data = { ...(event.data ?? {}), ...record.data };
      }
      if (kind === "log") event.level = "error";
      if (kind === "resize") {
        const match = /^(\d+)x(\d+)$/.exec(record.data);
        if (match)
          event.data = { columns: Number(match[1]), rows: Number(match[2]) };
      }
      events.push(event);
    }
  }

  const normalized = {
    schemaVersion: "normalized-visual-input/v1",
    projectId: sanitized.projectId,
    generatedAt: new Date().toISOString(),
    fps,
    idleTimeLimitSeconds,
    sourceArtifact: {
      schemaVersion: sanitized.schemaVersion,
      generatedAt: sanitized.generatedAt,
    },
    ...(contentBrief ? { contentBrief } : {}),
    ...(contentBrief ? {
      contentBriefProvenance: {
        sourceId: contentBriefSources[0].sourceId,
        sourceRef: contentBriefSources[0].contentBriefPath ?? null,
        rawChecksum: contentBriefSources[0].checksum,
        collectorVersion: contentBriefSources[0].collectorVersion,
      },
    } : {}),
    inputMode: sanitized.inputMode ?? (contentBrief ? "content-brief" : "legacy-compatibility"),
    ...(sanitized.compatibility ? { compatibility: sanitized.compatibility } : {}),
    events,
    warnings: sanitized.warnings ?? [],
  };
  if (contentBrief) {
    assertNormalizedContentBriefBinding({
      brief: contentBrief,
      normalizedInput: normalized,
      sourceId: contentBriefSources[0].sourceId,
      rawChecksum: contentBriefSources[0].checksum,
      expectedProjectId: sanitized.projectId,
    });
  }
  return normalized;
};
