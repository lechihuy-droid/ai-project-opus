import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildSqliteProjection } from "../../scripts/knowledge/build-sqlite.mjs";
import {
  databasePath,
  foldSearchText,
  normalizeSearchText,
  openDatabase,
  rebuildSearchFts,
} from "../../scripts/knowledge/sqlite-client.mjs";
import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";
import {
  readJson,
  sha256,
  sha256File,
  stableJson,
  writeStableJson,
} from "../../scripts/knowledge/index-utils.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const QUERY_TOKEN = "wave5ftsonlytoken";

const copy = (root, relativePath) => {
  const source = path.join(APP_ROOT, relativePath);
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const createTempRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-wave5-parity-"));
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

const copyBuildInputs = (root) => {
  for (const relativePath of [
    "design/knowledge/reference-library",
    "design/storage/migrations",
    "design/template-library/glitch-text",
    "design/visual-library/styles/cinematic-type",
    "src/template-registry-map.json",
    "src/templateRegistry.tsx",
    "src/templates/adapters/GlitchTextAdapter.tsx",
  ]) {
    copy(root, relativePath);
  }
};

const addVietnameseTerms = (root) => {
  const filePath = path.join(root, ".generated", "knowledge", "reference-index.json");
  const index = readJson(filePath);
  const additions = new Map([
    ["fixture-terminal-repo", "Bảng điều khiển terminal."],
    ["local-reference-theme", "Bảng điều khiển dashboard."],
    ["technical-editorial-frame", "Biên tập kỹ thuật editorial."],
  ]);

  for (const chunk of index.chunks) {
    const source = index.sources.find((candidate) => candidate.snapshotId === index.documents
      .find((document) => document.documentId === chunk.documentId)?.snapshotId);
    const sourceKey = source?.sourceId?.split(":").at(-1);
    const addition = additions.get(sourceKey);
    if (!addition) continue;
    chunk.rawText = `${chunk.rawText}\n\n${addition}`.normalize("NFC");
    chunk.contentHash = sha256(chunk.rawText);
    chunk.searchText = normalizeSearchText(chunk.rawText);
    chunk.searchFolded = foldSearchText(chunk.rawText);
  }

  writeStableJson(filePath, index);
  const manifestPath = path.join(root, ".generated", "knowledge", "manifest.json");
  const manifest = readJson(manifestPath);
  manifest.artifactHashes["reference-index.json"] = sha256File(filePath);
  const { manifestHash: _oldManifestHash, ...withoutManifestHash } = manifest;
  manifest.manifestHash = sha256(stableJson(withoutManifestHash));
  writeStableJson(manifestPath, manifest);
};

const setupRoot = ({ build = true, vietnamese = false } = {}) => {
  const root = createTempRoot();
  if (vietnamese) addVietnameseTerms(root);
  if (build) {
    copyBuildInputs(root);
    buildSqliteProjection({ appRoot: root });
  }
  return root;
};

const afterRoot = (t, root) => t.after(() => fs.rmSync(root, { recursive: true, force: true }));

const parityPayload = ({ repository: _repository, ...result }) => result;

const queryBoth = (root, input) => {
<<<<<<< HEAD
  const visualInput = { ...input, domain: input.domain ?? "visual-style" };
  const json = createJsonRepository({ appRoot: root }).query(visualInput);
  const sqlite = createSqliteRepository({ appRoot: root }).query(visualInput);
=======
  const json = createJsonRepository({ appRoot: root }).query(input);
  const sqlite = createSqliteRepository({ appRoot: root }).query(input);
>>>>>>> origin/main
  assert.deepEqual(parityPayload(sqlite), parityPayload(json), JSON.stringify(input));
  return { json, sqlite };
};

const codes = (entries) => entries.map((entry) => entry.code);

test("JSON and SQLite share normalized query, ranking, explanation, and rejection parity", (t) => {
  const root = setupRoot({ vietnamese: true });
  afterRoot(t, root);

  const matrix = [
    {},
    { query: "  Terminal, dashboard! " },
    { query: '"terminal" (dashboard), [editorial]?' },
    { query: "editorial" },
    { query: "bảng điều khiển" },
    { query: "bang dieu khien" },
    { query: "biên tập" },
    { query: "bien tap" },
    { query: "kỹ thuật" },
    { query: "ky thuat" },
    { query: "terminal", intent: "hook", aspectRatio: "9:16", family: "cinematic-type", status: "experimental" },
    { query: "terminal", sourceType: "canonical-package", mediaType: "canonical-entity", renderable: true },
    { query: "terminal", sourceType: "repository", mediaType: "repository", renderable: false },
    { query: "terminal", rights: "approved", approval: "approved" },
    { query: "terminal", rights: "canonical", approval: "validated" },
    { query: "terminal", limit: 1 },
  ];

  for (const input of matrix) {
    const { json, sqlite } = queryBoth(root, input);
    assert.deepEqual(json.query, sqlite.query);
    assert.ok(json.results.every((item) => item.selectedReasons.length > 0));
    assert.ok(json.results.every((item) => item.explanation.code === "HARD_FILTER_THEN_LEXICAL_THEN_RULES"));
    assert.ok(json.results.every((item) => Array.isArray(item.explanation.queryTokens)));
    assert.ok(json.results.every((item) => Array.isArray(item.explanation.matchedTokens)));
    assert.ok(json.rejectedCandidates.every((item) => Array.isArray(item.reasons) && item.reasons.length > 0));
  }

  const accented = [
    ["bảng điều khiển", "bang dieu khien"],
    ["biên tập", "bien tap"],
    ["kỹ thuật", "ky thuat"],
  ];
  for (const [withAccents, withoutAccents] of accented) {
    const accentedResult = queryBoth(root, { query: withAccents }).json;
    const plainResult = queryBoth(root, { query: withoutAccents }).json;
    assert.deepEqual(
      accentedResult.results.map((item) => item.id),
      plainResult.results.map((item) => item.id),
      `accent parity for ${withAccents}`,
    );
    assert.deepEqual(
      accentedResult.rejectedCandidates.map((item) => item.id),
      plainResult.rejectedCandidates.map((item) => item.id),
    );
  }
});

test("all hard filters and boolean/limit validation are shared by both repositories", (t) => {
  const root = setupRoot();
  afterRoot(t, root);
  const filters = [
    ["intent", "hook", "MATCH_INTENT"],
    ["aspectRatio", "9:16", "MATCH_ASPECT_RATIO"],
    ["family", "cinematic-type", "MATCH_FAMILY"],
    ["family", "terminal", "MATCH_FAMILY"],
    ["status", "experimental", "MATCH_STATUS"],
    ["sourceType", "canonical-package", "MATCH_SOURCE_TYPE"],
    ["sourceType", "repository", "MATCH_SOURCE_TYPE"],
    ["mediaType", "canonical-entity", "MATCH_MEDIA_TYPE"],
    ["mediaType", "repository", "MATCH_MEDIA_TYPE"],
    ["renderable", true, "MATCH_RENDERABLE"],
    ["renderable", false, "MATCH_RENDERABLE"],
    ["rights", "canonical", "MATCH_RIGHTS"],
    ["rights", "approved", "MATCH_RIGHTS"],
    ["approval", "validated", "MATCH_APPROVAL"],
    ["approval", "approved", "MATCH_APPROVAL"],
  ];

  for (const [field, value, selectedCode] of filters) {
    const { json } = queryBoth(root, { [field]: value });
    assert.ok(json.results.length > 0, `${field}=${value} should select at least one safe record`);
    assert.ok(json.results.every((item) => codes(item.selectedReasons).includes(selectedCode)));
    assert.ok(json.rejectedCandidates.every((item) => codes(item.reasons).some((code) => code.startsWith("FILTER_"))));
  }

  for (const invalidLimit of [0, -1, 1.5, 101, "not-a-number"]) {
<<<<<<< HEAD
    assert.throws(() => createJsonRepository({ appRoot: root }).query({ limit: invalidLimit, domain: "visual-style" }), /limit must be/);
    assert.throws(() => createSqliteRepository({ appRoot: root }).query({ limit: invalidLimit, domain: "visual-style" }), /limit must be/);
  }
  for (const invalidBoolean of ["yes", "1", 1, "TRUE"]) {
    assert.throws(() => createJsonRepository({ appRoot: root }).query({ renderable: invalidBoolean, domain: "visual-style" }), /renderable must be true or false/);
    assert.throws(() => createSqliteRepository({ appRoot: root }).query({ renderable: invalidBoolean, domain: "visual-style" }), /renderable must be true or false/);
=======
    assert.throws(() => createJsonRepository({ appRoot: root }).query({ limit: invalidLimit }), /limit must be/);
    assert.throws(() => createSqliteRepository({ appRoot: root }).query({ limit: invalidLimit }), /limit must be/);
  }
  for (const invalidBoolean of ["yes", "1", 1, "TRUE"]) {
    assert.throws(() => createJsonRepository({ appRoot: root }).query({ renderable: invalidBoolean }), /renderable must be true or false/);
    assert.throws(() => createSqliteRepository({ appRoot: root }).query({ renderable: invalidBoolean }), /renderable must be true or false/);
>>>>>>> origin/main
  }
  assert.equal(queryBoth(root, { renderable: true }).json.query.renderable, true);
  assert.equal(queryBoth(root, { renderable: false }).json.query.renderable, false);
});

test("unsafe or unapproved JSON evidence is invisible even from rejected candidates", (t) => {
  const root = setupRoot({ build: false });
  afterRoot(t, root);
  const filePath = path.join(root, ".generated", "knowledge", "reference-index.json");
  const index = readJson(filePath);
  const rawText = "UNSAFE rights evidence secret terminal dashboard";
  index.sources.push({
    sourceId: "source:wave5:unapproved-evidence",
    snapshotId: "snapshot:wave5:unapproved-evidence",
    sourceType: "repository",
<<<<<<< HEAD
    domain: "visual-style",
=======
>>>>>>> origin/main
    packagePath: "outside-approved-package",
    sourceRef: "unapproved://wave5",
    sourceRevision: "wave5",
    collectorVersion: "wave5-test",
    rights: { policy: "blocked", status: "unapproved" },
    approval: { status: "rejected" },
  });
  index.documents.push({
    documentId: "doc:wave5:unapproved-evidence",
    snapshotId: "snapshot:wave5:unapproved-evidence",
    sourceRef: "unapproved://wave5",
    mediaType: "repository",
<<<<<<< HEAD
    domain: "visual-style",
=======
>>>>>>> origin/main
  });
  index.chunks.push({
    chunkId: "chunk:wave5:unapproved-evidence",
    documentId: "doc:wave5:unapproved-evidence",
<<<<<<< HEAD
    domain: "visual-style",
=======
>>>>>>> origin/main
    ordinal: 0,
    rawText,
    searchText: normalizeSearchText(rawText),
    searchFolded: foldSearchText(rawText),
    contentHash: sha256(rawText),
    title: "Unsafe evidence fixture",
    tags: ["unsafe", "terminal"],
    observations: [],
  });
  writeStableJson(filePath, index);

<<<<<<< HEAD
  const result = createJsonRepository({ appRoot: root }).query({ query: "secret terminal", rights: "approved", domain: "visual-style" });
=======
  const result = createJsonRepository({ appRoot: root }).query({ query: "secret terminal", rights: "approved" });
>>>>>>> origin/main
  const allIds = [
    ...result.results.map((item) => item.id),
    ...result.rejectedCandidates.map((item) => item.id),
  ];
  assert.ok(!allIds.includes("chunk:wave5:unapproved-evidence"));
  assert.ok(!JSON.stringify(result).includes("unapproved"));
});

test("SQLite lexical retrieval uses the FTS5 index and rebuild restores generated content", (t) => {
  const root = setupRoot();
  afterRoot(t, root);
  const dbPath = databasePath(root);
<<<<<<< HEAD
  assert.deepEqual(createSqliteRepository({ appRoot: root }).query({ query: QUERY_TOKEN, domain: "visual-style" }).results, []);
=======
  assert.deepEqual(createSqliteRepository({ appRoot: root }).query({ query: QUERY_TOKEN }).results, []);
>>>>>>> origin/main

  const database = openDatabase(dbPath);
  try {
    const row = database.prepare("SELECT rowid, owner_id FROM search_documents WHERE owner_type = 'entity' LIMIT 1").get();
    const emptyValues = [row.rowid, "", "", "", "", QUERY_TOKEN, QUERY_TOKEN];
    database.prepare(
      "INSERT INTO search_fts(search_fts, rowid, title, body, tags, provenance, search_text, search_folded) VALUES ('delete', ?, ?, ?, ?, ?, ?, ?)",
    ).run(...emptyValues);
    database.prepare(
      "INSERT INTO search_fts(rowid, title, body, tags, provenance, search_text, search_folded) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(...emptyValues);
  } finally {
    database.close();
  }

<<<<<<< HEAD
  const manipulated = createSqliteRepository({ appRoot: root }).query({ query: QUERY_TOKEN, domain: "visual-style" });
=======
  const manipulated = createSqliteRepository({ appRoot: root }).query({ query: QUERY_TOKEN });
>>>>>>> origin/main
  assert.deepEqual(manipulated.results.map((item) => item.id), ["template:glitch-text@1.0.0"]);
  assert.deepEqual(manipulated.results[0].explanation.queryTokens, [QUERY_TOKEN]);
  assert.deepEqual(manipulated.results[0].explanation.matchedTokens, []);

  const rebuilt = openDatabase(dbPath);
  try {
    rebuildSearchFts(rebuilt);
  } finally {
    rebuilt.close();
  }
<<<<<<< HEAD
  assert.deepEqual(createSqliteRepository({ appRoot: root }).query({ query: QUERY_TOKEN, domain: "visual-style" }).results, []);
=======
  assert.deepEqual(createSqliteRepository({ appRoot: root }).query({ query: QUERY_TOKEN }).results, []);
>>>>>>> origin/main
});

test("repeated runs and lexical ties remain deterministic", (t) => {
  const root = setupRoot({ vietnamese: true });
  afterRoot(t, root);
  const repository = createJsonRepository({ appRoot: root });
<<<<<<< HEAD
  const first = repository.query({ query: "terminal", domain: "visual-style" });
  for (let run = 0; run < 5; run += 1) assert.deepEqual(repository.query({ query: "terminal", domain: "visual-style" }), first);
  const ties = repository.query({ domain: "visual-style" });
=======
  const first = repository.query({ query: "terminal" });
  for (let run = 0; run < 5; run += 1) assert.deepEqual(repository.query({ query: "terminal" }), first);
  const ties = repository.query({});
>>>>>>> origin/main
  const tiedIds = ties.results
    .filter((item) => item.score.total === ties.results.at(-1).score.total)
    .map((item) => item.id);
  assert.deepEqual(tiedIds, [...tiedIds].sort((left, right) => left.localeCompare(right, "en")));
});
