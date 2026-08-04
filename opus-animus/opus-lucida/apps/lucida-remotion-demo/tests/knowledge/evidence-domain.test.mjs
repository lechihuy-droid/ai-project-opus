import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildSqliteProjection } from "../../scripts/knowledge/build-sqlite.mjs";
import { foldSearchText, normalizeSearchText, sha256, stableJson, writeStableJson } from "../../scripts/knowledge/index-utils.mjs";
import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";
import { migrateEvidenceDomains } from "../../scripts/knowledge/migrate-evidence-domains.mjs";
import { selectVisualKnowledge } from "../../pipeline/retrieval/select-visual-knowledge.mjs";
import { evaluateDirectorSelection } from "../../pipeline/director/evaluate-candidates.mjs";
import { domainCounts } from "../../scripts/knowledge/evidence-domain.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixture = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "pipeline/fixtures/knowledge/factual/owned-factual-evidence.fixture.json"), "utf8"));
const copy = (source, destination) => { fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.cpSync(source, destination, { recursive: true }); };
const refreshManifest = (root) => {
  const directory = path.join(root, ".generated/knowledge");
  const references = JSON.parse(fs.readFileSync(path.join(directory, "reference-index.json"), "utf8"));
  const templates = JSON.parse(fs.readFileSync(path.join(directory, "template-index.json"), "utf8")).templates;
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8"));
  manifest.artifactHashes["reference-index.json"] = sha256(fs.readFileSync(path.join(directory, "reference-index.json")));
  manifest.counts.referenceSources = references.sources.length;
  manifest.counts.referenceDocuments = references.documents.length;
  manifest.counts.referenceChunks = references.chunks.length;
  manifest.domainCounts = {
    templates: domainCounts(templates, "template"),
    referenceSources: domainCounts(references.sources, "reference source"),
    referenceDocuments: domainCounts(references.documents, "reference document"),
    referenceChunks: domainCounts(references.chunks, "reference chunk"),
  };
  manifest.domainHashes = {
    templates: sha256(stableJson(templates.map(({ id, domain }) => ({ id, domain })))),
    referenceSources: sha256(stableJson(references.sources.map(({ sourceId, domain }) => ({ id: sourceId, domain })))),
    referenceDocuments: sha256(stableJson(references.documents.map(({ documentId, domain }) => ({ id: documentId, domain })))),
    referenceChunks: sha256(stableJson(references.chunks.map(({ chunkId, domain }) => ({ id: chunkId, domain })))),
  };
  const { manifestHash: _old, ...withoutHash } = manifest;
  manifest.manifestHash = sha256(stableJson(withoutHash));
  writeStableJson(path.join(directory, "manifest.json"), manifest);
};
const rootWithFactualFixture = (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w6-domain-"));
  for (const source of [".generated/knowledge", "design/storage/migrations", "design/template-library", "design/knowledge/reference-library", "design/knowledge/reference-approvals", "design/visual-library/styles/cinematic-type", "src/templates", "src/templateRegistry.tsx", "src/template-registry-map.json"]) copy(path.join(APP_ROOT, source), path.join(root, source));
  const referencePath = path.join(root, ".generated/knowledge/reference-index.json");
  const index = JSON.parse(fs.readFileSync(referencePath, "utf8"));
  const rawText = fixture.chunk.rawText;
  const canonicalSourcePath = path.join(root, fixture.source.packagePath, "source.json");
  fs.mkdirSync(path.dirname(canonicalSourcePath), { recursive: true });
  writeStableJson(canonicalSourcePath, fixture.source);
  index.sources.push(fixture.source);
  index.documents.push(fixture.document);
  index.chunks.push({ ...fixture.chunk, searchText: normalizeSearchText(rawText), searchFolded: foldSearchText(rawText), contentHash: sha256(rawText) });
  index.counts = { sources: index.sources.length, documents: index.documents.length, chunks: index.chunks.length };
  for (const key of ["sources", "documents", "chunks"]) index.domainCounts[key].factual += 1;
  writeStableJson(referencePath, index);
  refreshManifest(root);
  buildSqliteProjection({ appRoot: root });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
};
const queryBoth = (root, input) => {
  const json = createJsonRepository({ appRoot: root }).query(input);
  const sqlite = createSqliteRepository({ appRoot: root }).query(input);
  const { repository: _json, ...jsonPayload } = json;
  const { repository: _sqlite, ...sqlitePayload } = sqlite;
  assert.deepEqual(sqlitePayload, jsonPayload);
  return json;
};

test("W6 requires a valid domain and keeps factual and visual-style evidence isolated", (t) => {
  const root = rootWithFactualFixture(t);
  assert.throws(() => createJsonRepository({ appRoot: root }).query({ text: "Lucida" }), /query.domain/);
  assert.throws(() => createJsonRepository({ appRoot: root }).query({ text: "Lucida", domain: "unknown" }), /query.domain/);
  const factual = queryBoth(root, { text: "Lucida W6", domain: "factual" });
  const visual = queryBoth(root, { text: "Lucida W6", domain: "visual-style" });
  assert.deepEqual(factual.results.map((item) => item.id), [fixture.chunk.chunkId]);
  assert.ok(factual.results.every((item) => item.domain === "factual"));
  assert.ok(!visual.results.some((item) => item.id === fixture.chunk.chunkId));
  assert.ok(visual.rejectedCandidates.some((item) => item.id === fixture.chunk.chunkId && item.reasons.some((reason) => reason.code === "FILTER_DOMAIN_MISMATCH")));
});

test("W6 visual selector and Director require visual-style evidence", () => {
  const selection = selectVisualKnowledge({
    normalized: { events: [{ id: "event-1", title: "Terminal", text: "Terminal style", data: {} }] },
    config: { knowledge: { enabled: false }, mapping: { allowedFamilies: ["terminal"], defaultFamily: "terminal" } },
    appRoot: APP_ROOT,
  });
  assert.equal(selection.domain, "visual-style");
  assert.throws(() => evaluateDirectorSelection({ director: { rules: { productionCandidates: [] }, packages: {} }, mode: "auto", scene: { intent: "x", content: {} }, evidence: [{ id: "fact-1", domain: "factual" }] }), /Director rejects non-visual-style evidence/);
});

test("W6 domain migration is deterministic and idempotent for the current visual corpus", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w6-migration-"));
  copy(path.join(APP_ROOT, "design/knowledge/reference-library"), path.join(root, "design/knowledge/reference-library"));
  copy(path.join(APP_ROOT, "design/visual-library/styles"), path.join(root, "design/visual-library/styles"));
  const sourcePath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo/source.json");
  const documentPath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo/documents/overview.json");
  const stylePath = path.join(root, "design/visual-library/styles/technical-editorial/artifact-manifest.json");
  for (const filePath of [sourcePath, documentPath, stylePath]) {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    delete value.domain;
    writeStableJson(filePath, value);
  }
  const first = migrateEvidenceDomains({ appRoot: root });
  const second = migrateEvidenceDomains({ appRoot: root });
  assert.equal(first.report.changed.length, 3);
  assert.equal(second.report.changed.length, 0);
  for (const filePath of [sourcePath, documentPath, stylePath]) assert.equal(JSON.parse(fs.readFileSync(filePath, "utf8")).domain, "visual-style");
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
});
