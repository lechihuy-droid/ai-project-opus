import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildSqliteProjection } from "../../scripts/knowledge/build-sqlite.mjs";
import { evaluateDirectorSelection } from "../../pipeline/director/evaluate-candidates.mjs";
import { loadProductionDirector } from "../../pipeline/director/load-production-director.mjs";
import { migrateEvidenceDomains } from "../../scripts/knowledge/migrate-evidence-domains.mjs";
import { selectVisualKnowledge } from "../../pipeline/retrieval/select-visual-knowledge.mjs";
import { mapVisualScenes } from "../../pipeline/mappers/map-scenes.mjs";
import { domainCounts } from "../../scripts/knowledge/evidence-domain.mjs";
import {
  foldSearchText,
  sha256,
  sha256File,
  stableJson,
  validateGeneratedIndex,
  writeStableJson,
} from "../../scripts/knowledge/index-utils.mjs";
import { databasePath, openDatabase } from "../../scripts/knowledge/sqlite-client.mjs";
import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const KNOWLEDGE_FILES = [
  "adapter-index.json",
  "compatibility-index.json",
  "director-index.json",
  "reference-index.json",
  "template-index.json",
];
const FACTUAL_FIXTURE = JSON.parse(fs.readFileSync(
  path.join(APP_ROOT, "pipeline/fixtures/knowledge/factual/owned-factual-evidence.fixture.json"),
  "utf8",
));

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const copy = (source, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};
const copyFromApp = (root, relativePath) => copy(path.join(APP_ROOT, relativePath), path.join(root, relativePath));
const cleanUp = (t, root) => t.after(() => fs.rmSync(root, { recursive: true, force: true }));

const refreshManifest = (root) => {
  const directory = path.join(root, ".generated/knowledge");
  const references = readJson(path.join(directory, "reference-index.json"));
  const templates = readJson(path.join(directory, "template-index.json")).templates;
  const prior = readJson(path.join(directory, "manifest.json"));
  const manifestWithoutHash = {
    ...prior,
    artifactHashes: Object.fromEntries(KNOWLEDGE_FILES.map((file) => [file, sha256File(path.join(directory, file))])),
    counts: {
      ...prior.counts,
      referenceChunks: references.chunks.length,
      referenceDocuments: references.documents.length,
      referenceSources: references.sources.length,
    },
    domainCounts: {
      templates: domainCounts(templates, "template"),
      referenceSources: domainCounts(references.sources, "reference source"),
      referenceDocuments: domainCounts(references.documents, "reference document"),
      referenceChunks: domainCounts(references.chunks, "reference chunk"),
    },
    domainHashes: {
      templates: sha256(stableJson(templates.map(({ id, domain }) => ({ id, domain })))),
      referenceSources: sha256(stableJson(references.sources.map(({ sourceId, domain }) => ({ id: sourceId, domain })))),
      referenceDocuments: sha256(stableJson(references.documents.map(({ documentId, domain }) => ({ id: documentId, domain })))),
      referenceChunks: sha256(stableJson(references.chunks.map(({ chunkId, domain }) => ({ id: chunkId, domain })))),
    },
  };
  delete manifestWithoutHash.manifestHash;
  writeStableJson(path.join(directory, "manifest.json"), {
    ...manifestWithoutHash,
    manifestHash: sha256(stableJson(manifestWithoutHash)),
  });
};

const addReference = (root, { unsafe = false, refresh = true } = {}) => {
  const directory = path.join(root, ".generated/knowledge");
  const indexPath = path.join(directory, "reference-index.json");
  const index = readJson(indexPath);
  const suffix = unsafe ? "unsafe-factual" : "owned-factual";
  const rawText = unsafe
    ? "Terminal dashboard W6 shared domain evidence unsafe projection record."
    : "Terminal dashboard W6 shared domain evidence for a factual claim.";
  const source = {
    ...FACTUAL_FIXTURE.source,
    sourceId: `source:test:${suffix}`,
    snapshotId: `snapshot:test:${suffix}`,
    packagePath: `design/knowledge/reference-library/repository/test-${suffix}`,
    rights: unsafe ? { policy: "blocked", status: "unapproved" } : FACTUAL_FIXTURE.source.rights,
    approval: unsafe ? { status: "rejected" } : FACTUAL_FIXTURE.source.approval,
  };
  const document = {
    ...FACTUAL_FIXTURE.document,
    documentId: `doc:test:${suffix}`,
    snapshotId: source.snapshotId,
  };
  const chunk = {
    ...FACTUAL_FIXTURE.chunk,
    chunkId: `chunk:test:${suffix}`,
    documentId: document.documentId,
    rawText,
    searchText: rawText.normalize("NFC").toLowerCase(),
    searchFolded: foldSearchText(rawText),
    contentHash: sha256(rawText),
  };

  const sourcePath = path.join(root, source.packagePath, "source.json");
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  writeStableJson(sourcePath, source);
  index.sources.push(source);
  index.documents.push(document);
  index.chunks.push(chunk);
  index.counts = { sources: index.sources.length, documents: index.documents.length, chunks: index.chunks.length };
  index.domainCounts = {
    sources: domainCounts(index.sources, "reference source"),
    documents: domainCounts(index.documents, "reference document"),
    chunks: domainCounts(index.chunks, "reference chunk"),
  };
  writeStableJson(indexPath, index);
  if (refresh) refreshManifest(root);
  return chunk;
};

const createCorpusRoot = ({ factual = false, build = true } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w6-evidence-domain-"));
  for (const relativePath of [
    ".generated/knowledge",
    "design/storage/migrations",
    "design/template-library",
    "design/knowledge/reference-library",
    "design/knowledge/reference-approvals",
    "design/visual-library/styles/cinematic-type",
    "src/templates",
    "src/templateRegistry.tsx",
    "src/template-registry-map.json",
  ]) copyFromApp(root, relativePath);
  const factualChunk = factual ? addReference(root) : null;
  if (build) buildSqliteProjection({ appRoot: root });
  return { root, factualChunk };
};

const payload = ({ repository: _repository, ...result }) => result;
const queryBoth = (root, input) => {
  const json = createJsonRepository({ appRoot: root }).query(input);
  const sqlite = createSqliteRepository({ appRoot: root }).query(input);
  assert.deepEqual(payload(sqlite), payload(json), `repository parity for ${JSON.stringify(input)}`);
  return { json, sqlite };
};

const sourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const filePath = path.join(directory, entry.name);
  if (entry.isDirectory()) return sourceFiles(filePath);
  return /[.](?:ts|tsx|mts|cts|mjs)$/u.test(entry.name) ? [filePath] : [];
});

test("W6 domain query contract isolates factual and visual-style results with JSON/SQLite parity", (t) => {
  const { root, factualChunk } = createCorpusRoot({ factual: true });
  cleanUp(t, root);
  const json = createJsonRepository({ appRoot: root });
  const sqlite = createSqliteRepository({ appRoot: root });

  for (const repository of [json, sqlite]) {
    assert.throws(() => repository.query({ text: "terminal dashboard" }), /query\.domain/u);
    assert.throws(() => repository.query({ text: "terminal dashboard", domain: "unknown" }), /query\.domain/u);
  }

  const factual = queryBoth(root, { text: "terminal dashboard", domain: "factual" }).json;
  const visual = queryBoth(root, { text: "terminal dashboard", domain: "visual-style" }).json;
  assert.deepEqual(factual.results.map((item) => item.id), [factualChunk.chunkId]);
  assert.ok(factual.results.every((item) => item.domain === "factual"));
  assert.ok(visual.results.length > 0);
  assert.ok(visual.results.every((item) => item.domain === "visual-style"));
  assert.ok(visual.rejectedCandidates.some((item) =>
    item.id === factualChunk.chunkId && item.reasons.some((reason) => reason.code === "FILTER_DOMAIN_MISMATCH"),
  ));
});

test("W6 keeps unsafe evidence invisible while retaining safe domain-mismatch trace", (t) => {
  const { root, factualChunk } = createCorpusRoot({ factual: true });
  cleanUp(t, root);
  // The SQLite projection is intentionally built from the approved corpus only.
  // Add the unsafe JSON record afterwards to prove query-layer invisibility too.
  const unsafeChunk = addReference(root, { unsafe: true, refresh: false });
  const query = { text: "terminal dashboard W6 shared domain evidence", domain: "visual-style" };

  for (const repository of [createJsonRepository({ appRoot: root }), createSqliteRepository({ appRoot: root })]) {
    const result = repository.query(query);
    const visibleIds = [...result.results, ...result.rejectedCandidates].map((item) => item.id);
    assert.ok(result.rejectedCandidates.some((item) =>
      item.id === factualChunk.chunkId && item.reasons.some((reason) => reason.code === "FILTER_DOMAIN_MISMATCH"),
    ));
    assert.ok(!visibleIds.includes(unsafeChunk.chunkId));
    assert.doesNotMatch(JSON.stringify(result), /unsafe|unapproved/u);
  }
});

test("W6 migration is dry-run safe, applies once, is idempotent, and canonical corpus is visual-style", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w6-domain-migration-"));
  cleanUp(t, root);
  copyFromApp(root, "design/knowledge/reference-library");
  copyFromApp(root, "design/visual-library/styles");

  const documentPath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo/documents/overview.json");
  const document = readJson(documentPath);
  delete document.domain;
  writeStableJson(documentPath, document);

  const dryRun = migrateEvidenceDomains({ appRoot: root, check: true }).report;
  assert.ok(dryRun.changed.includes("design/knowledge/reference-library/repository/fixture-terminal-repo/documents/overview.json"));
  assert.equal(readJson(documentPath).domain, undefined);

  const applied = migrateEvidenceDomains({ appRoot: root }).report;
  assert.deepEqual(applied.changed, dryRun.changed);
  assert.equal(readJson(documentPath).domain, "visual-style");
  assert.equal(fs.existsSync(path.join(root, "design/knowledge/reports/evidence-domain-migration.json")), true);
  assert.deepEqual(migrateEvidenceDomains({ appRoot: root }).report.changed, []);

  const canonical = migrateEvidenceDomains({ appRoot: APP_ROOT, check: true }).report;
  assert.deepEqual(canonical.changed, []);
  assert.equal(canonical.domain, "visual-style");
});

test("W6 manifest domain metadata changes with evidence domain and stale SQLite projection is rejected", (t) => {
  const { root } = createCorpusRoot({ build: false });
  cleanUp(t, root);
  const before = readJson(path.join(root, ".generated/knowledge/manifest.json"));
  addReference(root);
  const after = readJson(path.join(root, ".generated/knowledge/manifest.json"));
  assert.notDeepEqual(after.domainCounts.referenceChunks, before.domainCounts.referenceChunks);
  assert.notEqual(after.domainHashes.referenceChunks, before.domainHashes.referenceChunks);
  assert.notEqual(after.manifestHash, before.manifestHash);

  buildSqliteProjection({ appRoot: root });
  const staleManifest = { ...after, manifestHash: sha256("W6 stale projection manifest") };
  writeStableJson(path.join(root, ".generated/knowledge/manifest.json"), staleManifest);
  assert.throws(
    () => createSqliteRepository({ appRoot: root }).query({ text: "terminal", domain: "visual-style" }),
    /SQLite projection is stale for the current generated manifest/u,
  );
});

test("W6 visual selection and Director preserve visual-style evidence boundaries", (t) => {
  const { root } = createCorpusRoot({ factual: true });
  cleanUp(t, root);
  const selection = selectVisualKnowledge({
    appRoot: root,
    normalized: { events: [{ id: "event-1", title: "Terminal dashboard", text: "W6 shared domain evidence", data: {} }] },
    config: {
      knowledge: { enabled: true, repository: "json", limit: 3 },
      mapping: { allowedFamilies: ["terminal"], defaultFamily: "terminal" },
    },
  });
  assert.equal(selection.domain, "visual-style");
  assert.ok(selection.selections[0].evidence.length > 0);
  assert.ok(selection.selections[0].evidence.every((item) => item.domain === "visual-style"));

  const director = loadProductionDirector({ appRoot: APP_ROOT });
  const input = { director, mode: "auto", scene: { intent: "explain", content: {} } };
  assert.throws(
    () => evaluateDirectorSelection({ ...input, evidence: [{ id: "fact-only", domain: "factual", family: "infographic" }] }),
    /Director rejects non-visual-style evidence/u,
  );
  assert.ok(evaluateDirectorSelection({ ...input, evidence: [{ id: "visual-only", domain: "visual-style", family: "infographic" }] }).selected);
});

test("W6 renderer source has no dynamic knowledge repository or SQLite imports", () => {
  for (const filePath of sourceFiles(path.join(APP_ROOT, "src"))) {
    const source = fs.readFileSync(filePath, "utf8");
    assert.doesNotMatch(
      source,
      /(?:from|import\s*\()["'][^"']*(?:scripts\/knowledge|sqlite|repositories)[^"']*["']/iu,
      filePath,
    );
  }
});

test("W6 mapper requires every factRef to resolve to factual evidence", () => {
  const normalized = {
    schemaVersion: "normalized-visual-input/v1",
    projectId: "w6-fact-ref",
    events: [{
      id: "event-fact",
      sourceId: "brief",
      sourceRef: "brief.json#beat",
      kind: "narrative",
      text: "Factual claim",
      factRefs: ["fact-source"],
      provenance: {},
    }],
  };
  const config = {
    fps: 30,
    themeId: "test",
    mapping: {
      allowedFamilies: ["editorial"],
      allowedPresets: ["headline-stat-grid"],
      defaultFamily: "editorial",
      defaultPreset: "headline-stat-grid",
      minSceneSeconds: 1,
      maxSceneSeconds: 8,
      maxItemsPerScene: 5,
    },
  };
  const selection = (evidence) => ({
    enabled: true,
    repository: "fixture",
    manifestHash: "fixture",
    summary: {},
    selections: [{ eventId: "event-fact", evidence }],
  });

  assert.throws(() => mapVisualScenes(normalized, config, selection([])), /require matching factual evidence/u);
  assert.throws(
    () => mapVisualScenes(normalized, config, selection([{ id: "fact-source", domain: "visual-style" }])),
    /cannot use non-factual evidence/u,
  );
  assert.throws(
    () => mapVisualScenes(normalized, config, selection([{ id: "fact-source" }])),
    /cannot use non-factual evidence/u,
  );
  assert.doesNotThrow(() => mapVisualScenes(normalized, config, selection([{ id: "fact-source", domain: "factual" }])));
});

test("W6 SQLite rejects UPDATE domain to NULL for every domain table", (t) => {
  const { root } = createCorpusRoot();
  const database = openDatabase(databasePath(root));
  t.after(() => database.close());
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const table of ["sources", "documents", "chunks", "search_documents", "canonical_entities"]) {
    assert.throws(
      () => database.prepare(`UPDATE ${table} SET domain = NULL`).run(),
      /domain is required|constraint/u,
      table,
    );
  }
});

test("W6 corpus migration prevalidates all targets and never guesses future domains", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w6-domain-atomic-"));
  cleanUp(t, root);
  copyFromApp(root, "design/knowledge/reference-library");
  copyFromApp(root, "design/visual-library/styles");

  const knownPath = path.join(root, "design/knowledge/reference-library/image/technical-editorial-frame/source.json");
  const known = readJson(knownPath);
  delete known.domain;
  writeStableJson(knownPath, known);
  const knownBefore = fs.readFileSync(knownPath);

  const futureDir = path.join(root, "design/knowledge/reference-library/repository/future-factual");
  fs.mkdirSync(path.join(futureDir, "documents"), { recursive: true });
  writeStableJson(path.join(futureDir, "source.json"), { sourceId: "future-factual", domain: "factual" });
  writeStableJson(path.join(futureDir, "documents", "fact.json"), { sourceRef: "future#fact", domain: "factual" });

  const unknownPath = path.join(root, "design/knowledge/reference-library/zz-unknown/source.json");
  fs.mkdirSync(path.dirname(unknownPath), { recursive: true });
  writeStableJson(unknownPath, { sourceId: "unknown-missing-domain" });
  const reportPath = path.join(root, "design/knowledge/reports/evidence-domain-migration.json");
  assert.throws(() => migrateEvidenceDomains({ appRoot: root }), /unknown corpus file.*missing.*domain/iu);
  assert.deepEqual(fs.readFileSync(knownPath), knownBefore, "late validation failure mutated an earlier known target");
  assert.equal(fs.existsSync(reportPath), false, "failed migration wrote a report");
  assert.equal(readJson(path.join(futureDir, "source.json")).domain, "factual");

  fs.rmSync(path.dirname(unknownPath), { recursive: true, force: true });
  const applied = migrateEvidenceDomains({ appRoot: root }).report;
  assert.ok(applied.changed.includes("design/knowledge/reference-library/image/technical-editorial-frame/source.json"));
  assert.equal(readJson(path.join(futureDir, "source.json")).domain, "factual");
  assert.deepEqual(migrateEvidenceDomains({ appRoot: root }).report.changed, []);
});

test("W6 generated validation recomputes reference domain counts and hashes", (t) => {
  const { root } = createCorpusRoot({ build: false });
  cleanUp(t, root);
  const knowledgeDir = path.join(root, ".generated/knowledge");
  const manifestPath = path.join(knowledgeDir, "manifest.json");
  const writeValidManifestHash = (manifest) => {
    const { manifestHash: _prior, ...withoutHash } = manifest;
    writeStableJson(manifestPath, { ...withoutHash, manifestHash: sha256(stableJson(withoutHash)) });
  };

  const badCounts = readJson(manifestPath);
  badCounts.domainCounts.referenceSources["visual-style"] += 1;
  writeValidManifestHash(badCounts);
  assert.match(
    validateGeneratedIndex({ appRoot: root, knowledgeDir }).errors.join("\n"),
    /referenceSources domain counts do not match/u,
  );

  copyFromApp(root, ".generated/knowledge/manifest.json");
  const badHashes = readJson(manifestPath);
  badHashes.domainHashes.referenceChunks = "0".repeat(64);
  writeValidManifestHash(badHashes);
  assert.match(
    validateGeneratedIndex({ appRoot: root, knowledgeDir }).errors.join("\n"),
    /domain hashes do not match generated indexes/u,
  );
});
