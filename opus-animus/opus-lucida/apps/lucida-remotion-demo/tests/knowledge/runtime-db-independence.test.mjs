import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { databasePath } from "../../scripts/knowledge/sqlite-client.mjs";
import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";
import { readJson } from "../../scripts/knowledge/index-utils.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const QUERY_SCRIPT = path.join(APP_ROOT, "scripts", "knowledge", "query.mjs");

const copy = (root, relativePath) => {
  const source = path.join(APP_ROOT, relativePath);
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const createTempRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-wave5-runtime-"));
  for (const file of [
    "adapter-index.json",
    "compatibility-index.json",
    "director-index.json",
    "manifest.json",
    "reference-index.json",
    "template-index.json",
  ]) {
    copy(root, path.join(".generated", "knowledge", file));
  }
  return root;
};

const afterRoot = (t, root) => t.after(() => fs.rmSync(root, { recursive: true, force: true }));

const runCli = (root, args) => spawnSync(process.execPath, [QUERY_SCRIPT, ...args], {
  cwd: root,
  encoding: "utf8",
  windowsHide: true,
});

const sourceFiles = (directory) => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(filePath));
    else if (/[.](?:ts|tsx|mts|cts|mjs)$/.test(entry.name)) files.push(filePath);
  }
  return files;
};

test("JSON remains usable without SQLite and SQLite reports a clear absent projection error", (t) => {
  const root = createTempRoot();
  afterRoot(t, root);
  assert.equal(fs.existsSync(databasePath(root)), false);

  const jsonResult = createJsonRepository({ appRoot: root }).query({ query: "terminal" });
  assert.equal(jsonResult.repository, "json");
  assert.ok(jsonResult.results.length > 0);

  assert.throws(
    () => createSqliteRepository({ appRoot: root }).query({ query: "terminal" }),
    (error) => error instanceof Error
      && error.message.includes("SQLite repository requested but projection is absent")
      && error.message.includes(databasePath(root))
      && error.message.includes("knowledge:build"),
  );
});

test("renderer source has no SQLite or repository imports and preflight does not require knowledge:build", () => {
  for (const filePath of sourceFiles(path.join(APP_ROOT, "src"))) {
    const source = fs.readFileSync(filePath, "utf8");
    assert.doesNotMatch(
      source,
      /(?:from|import\s*\()\s*["'][^"']*(?:sqlite|repository)[^"']*["']/iu,
      filePath,
    );
  }

  const packageJson = readJson(path.join(APP_ROOT, "package.json"));
  assert.doesNotMatch(packageJson.scripts.preflight, /knowledge:build/u);
  assert.doesNotMatch(packageJson.scripts["knowledge:preflight"], /knowledge:build/u);
});

test("CLI emits valid JSON by defaulting to JSON repository and honors query/filter flags", (t) => {
  const root = createTempRoot();
  afterRoot(t, root);

  const jsonRun = runCli(root, [
    "--json",
    "--query",
    "\"Terminal\", dashboard!",
    "--aspect-ratio",
    "9:16",
    "--renderable",
    "true",
    "--limit",
    "1",
  ]);
  assert.equal(jsonRun.status, 0, jsonRun.stderr);
  assert.equal(jsonRun.stderr, "");
  const result = JSON.parse(jsonRun.stdout);
  assert.deepEqual(Object.keys(result).sort(), ["query", "rejectedCandidates", "repository", "results", "schemaVersion"].sort());
  assert.equal(result.schemaVersion, "lucida-knowledge-query/v1");
  assert.equal(result.repository, "json");
  assert.equal(result.query.text, '"terminal", dashboard!');
  assert.equal(result.query.aspectRatio[0], "9:16");
  assert.equal(result.query.renderable, true);
  assert.equal(result.query.limit, 1);
  assert.ok(Array.isArray(result.results));
  assert.ok(Array.isArray(result.rejectedCandidates));
  assert.ok(result.results.every((item) => item.id && item.score && item.explanation));

  const textRun = runCli(root, ["--query", "terminal"]);
  assert.equal(textRun.status, 0, textRun.stderr);
  assert.match(textRun.stdout, /^Repository: json\r?\nResults: /u);
});

test("CLI rejects invalid repository, filters, and limits with non-zero exit", (t) => {
  const root = createTempRoot();
  afterRoot(t, root);
  const cases = [
    [["--repository", "postgres"], "repository must be json or sqlite."],
    [["--renderable", "maybe"], "renderable must be true or false."],
    [["--limit", "0"], "limit must be an integer between 1 and 100."],
    [["--unknown"], "Unknown option: --unknown"],
  ];
  for (const [args, message] of cases) {
    const result = runCli(root, args);
    assert.equal(result.status, 1, args.join(" "));
    assert.match(result.stderr, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), args.join(" "));
    assert.equal(result.stdout, "", args.join(" "));
  }
});
