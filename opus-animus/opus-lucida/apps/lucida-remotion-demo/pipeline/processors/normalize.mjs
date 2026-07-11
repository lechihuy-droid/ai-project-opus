import { parseAnsi } from "./ansi.mjs";

const kindFor = (sourceType, recordKind) => {
  if (sourceType === "script" && recordKind === "script_block")
    return "narrative";
  if (sourceType === "command" && recordKind === "stdout") return "output";
  if (sourceType === "command" && recordKind === "stderr") return "log";
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
        id: `event-${String(++eventIndex).padStart(4, "0")}`,
        sourceId: source.sourceId,
        sourceRef: record.provenance.sourceRef,
        kind,
        provenance: record.provenance,
      };

      if (sourceTime !== undefined) {
        event.timeSeconds = Number(adjustedTime.toFixed(6));
        event.frame = Math.round(adjustedTime * fps);
      }
      if (parsed.text)
        event.text = parsed.text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      if (parsed.styleRuns.length) event.styleRuns = parsed.styleRuns;
      if (kind === "log") event.level = "error";
      if (kind === "resize") {
        const match = /^(\d+)x(\d+)$/.exec(record.data);
        if (match)
          event.data = { columns: Number(match[1]), rows: Number(match[2]) };
      }
      events.push(event);
    }
  }

  return {
    schemaVersion: "normalized-visual-input/v1",
    projectId: sanitized.projectId,
    generatedAt: new Date().toISOString(),
    fps,
    idleTimeLimitSeconds,
    sourceArtifact: {
      schemaVersion: sanitized.schemaVersion,
      generatedAt: sanitized.generatedAt,
    },
    events,
    warnings: sanitized.warnings ?? [],
  };
};
