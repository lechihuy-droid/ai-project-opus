import assert from "node:assert/strict";
import {
  normalizeSanitizedInput,
  parseAnsi,
  sanitizeRawInput,
} from "../pipeline/processors/index.mjs";

const provenance = {
  sourceId: "fixture",
  sourceRef: "fixture#1",
  sourceChecksum: "sha256:fixture",
  collectorVersion: "fixture/1",
};
const raw = {
  schemaVersion: "raw-visual-input/v1",
  projectId: "fixture",
  generatedAt: "2026-01-01T00:00:00.000Z",
  sources: [
    {
      sourceId: "fixture",
      sourceType: "asciicast",
      records: [
        {
          kind: "output",
          timeSeconds: 0.1,
          data: "\u001b[32mOK\u001b[0m\r\n",
          provenance,
        },
        {
          kind: "marker",
          timeSeconds: 5,
          data: "next",
          provenance: { ...provenance, sourceRef: "fixture#2" },
        },
        {
          kind: "resize",
          timeSeconds: 6,
          data: "100x30",
          provenance: { ...provenance, sourceRef: "fixture#3" },
        },
      ],
    },
  ],
  warnings: [],
};

const sanitized = sanitizeRawInput(raw);
assert.equal(sanitized.schemaVersion, "sanitized-visual-input/v1");

const normalized = normalizeSanitizedInput(sanitized, {
  fps: 30,
  idleTimeLimitSeconds: 1.5,
});
assert.equal(normalized.events.length, 3);
assert.equal(normalized.events[0].text, "OK\n");
assert.equal(normalized.events[0].styleRuns[0].color, "#0dbc79");
assert.equal(normalized.events[1].frame, 48);
assert.deepEqual(normalized.events[2].data, { columns: 100, rows: 30 });

const ansi = parseAnsi("\u001b[1;31mError\u001b[0m");
assert.equal(ansi.text, "Error");
assert.equal(ansi.styleRuns[0].bold, true);

assert.throws(
  () =>
    sanitizeRawInput({
      ...raw,
      sources: [
        {
          sourceId: "bad",
          sourceType: "script",
          records: [
            {
              kind: "script_block",
              text: "api_key=sk-abcdefghijklmnopqrstuvwxyz",
              provenance,
            },
          ],
        },
      ],
    }),
  /Sensitive content detected/,
);

console.log(
  "Visual processors passed: sanitization, ANSI parsing, timing, and normalization.",
);
