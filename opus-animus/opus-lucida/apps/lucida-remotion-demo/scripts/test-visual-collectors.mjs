import assert from "node:assert/strict";
import path from "node:path";
import {
  collectAsciicast,
  collectCommand,
  collectScript,
} from "../pipeline/collectors/index.mjs";

const projectRoot = process.cwd();

const script = collectScript({
  source: {
    id: "script",
    type: "script",
    path: "pipeline/fixtures/collector-script.md",
  },
  projectRoot,
});
assert.equal(script.records.length, 3);
assert.ok(
  script.records.every((record) =>
    record.provenance.sourceChecksum.startsWith("sha256:"),
  ),
);

const cast = collectAsciicast({
  source: {
    id: "cast",
    type: "asciicast",
    path: "pipeline/fixtures/demo.cast",
    captureInputEvents: false,
  },
  projectRoot,
});
assert.deepEqual(
  cast.records.map((record) => record.kind),
  ["output", "marker", "output", "resize"],
);
assert.equal(cast.metadata.width, 80);
assert.ok(!JSON.stringify(cast).includes("secret-input"));

const command = await collectCommand({
  source: {
    id: "command",
    type: "command",
    command: process.execPath,
    args: ["-e", "process.stdout.write('collector-ok')"],
    timeoutSeconds: 10,
  },
  projectRoot,
  allowedCommands: new Set([process.execPath]),
});
assert.equal(command.metadata.exitCode, 0);
assert.equal(command.records[0].text, "collector-ok");

await assert.rejects(
  collectCommand({
    source: { id: "blocked", type: "command", command: "blocked-command" },
    projectRoot,
    allowedCommands: new Set(),
  }),
  /not allowlisted/,
);

console.log("Visual collectors passed: script, command, and asciicast v2.");
