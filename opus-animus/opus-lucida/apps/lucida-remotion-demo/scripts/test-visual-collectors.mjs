import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import {
  collectAsciicast,
  collectCommand,
  collectImageReference,
  collectRepository,
  collectScript,
  collectThemeReference,
  collectWebReference,
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

const repository = await collectRepository({
  source: {
    id: "repo",
    type: "repository",
    path: "pipeline/fixtures/reference-repo",
    include: ["README.md", "style.css"],
    family: "dashboard",
  },
  projectRoot,
});
assert.equal(repository.records.length, 3);
assert.ok(repository.records.some((record) => record.kind === "design_token"));

const theme = await collectThemeReference({
  source: {
    id: "theme",
    type: "theme_reference",
    path: "pipeline/fixtures/reference-theme.css",
    family: "terminal",
  },
  projectRoot,
});
assert.equal(theme.records[0].kind, "design_token");
assert.ok(theme.metadata.tokenCount >= 4);

const image = await collectImageReference({
  source: {
    id: "image",
    type: "image_reference",
    path: "pipeline/fixtures/reference-theme.css",
    note: "Local visual asset reference",
  },
  projectRoot,
});
assert.equal(image.records[0].kind, "media");

const server = http.createServer((_, response) => {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`<!doctype html><title>Reference Page</title><meta name="description" content="Dashboard web reference"><h1>Command Center</h1><code>npm run visual-flow</code>`);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const { port } = server.address();
  const web = await collectWebReference({
    source: {
      id: "web",
      type: "web_reference",
      url: `http://127.0.0.1:${port}/`,
      family: "editorial",
    },
    projectRoot,
  });
  assert.ok(web.records.some((record) => record.kind === "layout_reference"));
  assert.ok(web.records.some((record) => record.kind === "code"));
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log("Visual collectors passed: script, command, asciicast, repository, web, image, and theme.");
