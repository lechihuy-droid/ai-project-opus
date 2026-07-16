import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { buildSqliteProjection } from "../../scripts/knowledge/build-sqlite.mjs";
import { evaluateKnowledge } from "../../scripts/knowledge/evaluate.mjs";
import {
  databasePath,
  foldSearchText,
  openDatabase,
} from "../../scripts/knowledge/sqlite-client.mjs";
import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import {
  normalizeSearchText,
  readJson,
  sha256,
  sha256File,
  writeStableJson,
} from "../../scripts/knowledge/index-utils.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const EVALUATOR = path.join(APP_ROOT, "scripts", "knowledge", "evaluate.mjs");
const GOLD_QUERIES = path.join("tests", "knowledge", "gold", "queries.json");
const GOLD_EXPECTED = path.join("tests", "knowledge", "gold", "expected.json");

const copy = (root, relativePath) => {
  const source = path.join(APP_ROOT, relativePath);
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const createTempRoot = ({ build = true } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-wave6-evaluation-"));
  for (const file of [
    "adapter-index.json",
    "compatibility-index.json",
    "director-index.json",
    "manifest.json",
    "reference-index.json",
    "template-index.json",
  ]) copy(root, path.join(".generated", "knowledge", file));
  copy(root, GOLD_QUERIES);
  copy(root, GOLD_EXPECTED);
  if (build) {
    for (const relativePath of [
      "design/knowledge/reference-library",
      "design/storage/migrations",
      "design/template-library/glitch-text",
      "design/visual-library/styles/cinematic-type",
      "src/template-registry-map.json",
      "src/templateRegistry.tsx",
      "src/templates/adapters/GlitchTextAdapter.tsx",
    ]) copy(root, relativePath);
    buildSqliteProjection({ appRoot: root });
  }
  return root;
};

const removeRoot = (root) => fs.rmSync(root, { recursive: true, force: true });
const readGold = (root) => ({
  queries: readJson(path.join(root, GOLD_QUERIES)),
  expected: readJson(path.join(root, GOLD_EXPECTED)),
});
const writeGold = (root, { queries, expected }) => {
  writeStableJson(path.join(root, GOLD_QUERIES), queries);
  writeStableJson(path.join(root, GOLD_EXPECTED), expected);
};
const runEvaluator = (root) => spawnSync(process.execPath, [EVALUATOR], {
  cwd: root,
  encoding: "utf8",
  windowsHide: true,
});
const assertEvaluatorFails = (root, pattern, label = "evaluator mutation") => {
  const result = runEvaluator(root);
  assert.notEqual(result.status, 0, `${label}: ${result.stdout}`);
  assert.match(result.stderr, /Knowledge evaluation failed/u);
  if (pattern) assert.match(result.stderr, pattern);
  return result;
};

const categoryCounts = (queries) => Object.fromEntries(
  Object.entries(Object.groupBy(queries, (query) => query.category)).map(([category, entries]) => [category, entries.length]),
);

const expectedById = (expected) => new Map(expected.expectations.map((entry) => [entry.id, entry]));

test("gold has the required categories, pairs, stable IDs, and positive semantics", () => {
  const { queries, expected } = readGold(APP_ROOT);
  assert.equal(queries.schemaVersion, "lucida-knowledge-gold-queries/v1");
  assert.equal(expected.schemaVersion, "lucida-knowledge-gold-expected/v1");
  assert.ok(queries.queries.length >= 32);

  const counts = categoryCounts(queries.queries);
  assert.ok((counts["accent-pair"] ?? 0) >= 24);
  assert.ok((counts.english ?? 0) >= 4);
  assert.ok((counts["hard-negative-rights"] ?? 0) >= 4);
  assert.ok(new Set(Object.keys(counts)).has("accent-pair"));
  assert.ok(new Set(Object.keys(counts)).has("english"));
  assert.ok(new Set(Object.keys(counts)).has("hard-negative-rights"));

  const queryIds = queries.queries.map((query) => query.id);
  const expectedIds = expected.expectations.map((entry) => entry.id);
  assert.equal(new Set(queryIds).size, queryIds.length);
  assert.equal(new Set(expectedIds).size, expectedIds.length);
  assert.deepEqual([...queryIds].sort(), [...expectedIds].sort());

  const pairs = new Map();
  for (const query of queries.queries) {
    assert.equal(typeof query.input.text, "string");
    assert.ok(query.input.text.trim());
    if (query.category === "accent-pair") {
      pairs.set(query.pairId, [...(pairs.get(query.pairId) ?? []), query]);
    }
    const entry = expectedById(expected).get(query.id);
    assert.ok(entry);
    if (query.category === "accent-pair" || query.category === "english") {
      assert.ok(entry.relevant.length > 0, `${query.id} must have relevant evidence`);
    }
    if (query.category === "hard-negative-rights") {
      assert.equal(entry.relevant.length, 0, `${query.id} must not have relevant evidence`);
      assert.ok(entry.forbiddenIds.length > 0, `${query.id} must have forbidden evidence`);
    }
  }

  assert.ok(pairs.size >= 12);
  for (const [pairId, pair] of pairs) {
    assert.equal(pair.length, 2, pairId);
    assert.deepEqual(pair.map((query) => query.variant).sort(), ["accented", "folded"]);
    assert.notEqual(pair[0].input.text, pair[1].input.text, pairId);
    assert.equal(foldSearchText(pair[0].input.text), foldSearchText(pair[1].input.text), pairId);
    const left = { ...pair[0].input };
    const right = { ...pair[1].input };
    delete left.text;
    delete right.text;
    assert.deepEqual(left, right, `${pairId} changed a non-text filter`);
  }
});

test("positive and hard-negative gold semantics hold against a temp JSON/SQLite corpus", (t) => {
  const root = createTempRoot();
  t.after(() => removeRoot(root));
  const { queries, expected } = readGold(root);
  const expectations = expectedById(expected);
  const repository = createJsonRepository({ appRoot: root });

  for (const query of queries.queries) {
    const result = repository.query(query.input);
    const resultIds = new Set(result.results.slice(0, 5).map((item) => item.id));
    const rejectedIds = new Set(result.rejectedCandidates.map((item) => item.id));
    const entry = expectations.get(query.id);
    if (query.category === "accent-pair" || query.category === "english") {
      for (const relevant of entry.relevant) assert.ok(resultIds.has(relevant.id), `${query.id}:${relevant.id}`);
    } else {
      assert.equal(entry.relevant.length, 0);
      for (const forbiddenId of entry.forbiddenIds) {
        assert.ok(!resultIds.has(forbiddenId), `${query.id} returned ${forbiddenId}`);
        assert.ok(rejectedIds.has(forbiddenId), `${query.id} lost hard-negative ${forbiddenId}`);
      }
    }
  }
});

test("accent pair runtime queries preserve text and use equal folded lexical candidate sets", (t) => {
  const root = createTempRoot();
  t.after(() => removeRoot(root));
  const { queries } = readGold(root);
  const repository = createJsonRepository({ appRoot: root });
  const pairs = new Map();
  for (const query of queries.queries.filter((entry) => entry.category === "accent-pair")) {
    pairs.set(query.pairId, [...(pairs.get(query.pairId) ?? []), query]);
  }

  for (const [pairId, pair] of pairs) {
    const results = pair.map((query) => repository.query({ ...query.input, limit: 100 }));
    assert.ok(pair.every((query) => query.input.text.length > 0), `${pairId} deleted lexical text`);
    assert.equal(foldSearchText(pair[0].input.text), foldSearchText(pair[1].input.text), pairId);
    assert.deepEqual(
      results[0].results.map((item) => item.id).sort(),
      results[1].results.map((item) => item.id).sort(),
      pairId,
    );
  }
});

test("evaluator report is deterministic, complete, and independently recomputable", (t) => {
  const root = createTempRoot();
  t.after(() => removeRoot(root));
  const first = evaluateKnowledge({ appRoot: root });
  const firstReport = readJson(first.reportPath);
  const firstHash = sha256File(first.reportPath);
  const second = evaluateKnowledge({ appRoot: root });
  const secondReport = readJson(second.reportPath);
  assert.deepEqual(secondReport, firstReport);
  assert.equal(sha256File(second.reportPath), firstHash);
  assert.equal(firstReport.passed, true);
  assert.equal(firstReport.queries.length, firstReport.gold.queryCount);
  assert.ok(firstReport.queries.every((entry) => entry.failures.length === 0));

  const allRecords = createJsonRepository({ appRoot: root }).query({ limit: 100, domain: "visual-style" }).results;
  assert.equal(firstReport.corpus.templateCount, allRecords.filter((item) => item.kind === "template").length);
  assert.equal(firstReport.corpus.approvedReferenceCount, allRecords.filter((item) => item.kind === "reference").length);
  assert.equal(firstReport.gold.accentPairCount, new Set(
    firstReport.queries.filter((entry) => entry.category === "accent-pair").map((entry) => entry.pairId),
  ).size);
  assert.equal(firstReport.gold.englishQueryCount, firstReport.queries.filter((entry) => entry.category === "english").length);
  assert.equal(firstReport.gold.hardNegativeRightsQueryCount, firstReport.queries.filter((entry) => entry.category === "hard-negative-rights").length);

  const list = (value) => value === undefined ? [] : (Array.isArray(value) ? value : [value]).flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
  const matches = (expected, actual) => {
    const values = list(expected);
    return values.length === 0 || values.some((value) => actual.includes(value));
  };
  const satisfiesFilters = (entry, item) => {
    const input = entry.input;
    const family = Array.isArray(item.capabilities.family) ? item.capabilities.family : [item.capabilities.family];
    return matches(input.intent, item.capabilities.intents)
      && matches(input.aspectRatio ?? input["aspect-ratio"], item.capabilities.aspectRatios)
      && matches(input.family, family)
      && matches(input.status, [item.capabilities.status])
      && matches(input.sourceType ?? input["source-type"], [item.sourceType])
      && matches(input.mediaType ?? input["media-type"], [item.mediaType])
      && (input.renderable === undefined || input.renderable === item.capabilities.renderable)
      && matches(input.rights ?? input.rightsStatus ?? input["rights-status"], [item.provenance.rights.status])
      && matches(input.approval ?? input.approvalStatus ?? input["approval-status"], [item.provenance.approval.status]);
  };
  const isComplete = (provenance) => [
    "sourceId", "snapshotId", "sourceType", "sourceRef", "sourceRevision", "collectorVersion",
  ].every((field) => typeof provenance?.[field] === "string" && provenance[field].length > 0)
    && typeof provenance?.rights?.policy === "string"
    && typeof provenance?.rights?.status === "string"
    && typeof provenance?.approval?.status === "string";
  const positive = firstReport.queries.filter((entry) => entry.expected.relevant.length > 0);
  const hardFilterRows = firstReport.queries.flatMap((entry) => entry.json.results.map((item) => ({ entry, item })));
  assert.ok(hardFilterRows.every(({ item }) => item.capabilities && item.sourceType && item.mediaType), "report lacks corpus fields needed to recompute hard-filter precision");
  const hardFilterNumerator = hardFilterRows.filter(({ entry, item }) => satisfiesFilters(entry, item)
    && !entry.expected.forbiddenIds.includes(item.id)).length;
  assert.deepEqual(firstReport.metrics.hardFilterPrecision.numerator, hardFilterNumerator);
  assert.deepEqual(firstReport.metrics.hardFilterPrecision.denominator, hardFilterRows.length);
  assert.equal(firstReport.metrics.provenanceCompleteness.numerator, hardFilterRows.filter(({ item }) => isComplete(item.provenance)).length);
  assert.equal(firstReport.metrics.provenanceCompleteness.denominator, hardFilterRows.length);

  const recallFound = positive.reduce((sum, entry) => sum + entry.expected.relevant.filter((item) => entry.json.resultIds.slice(0, 5).includes(item.id)).length, 0);
  const recallTotal = positive.reduce((sum, entry) => sum + entry.expected.relevant.length, 0);
  assert.equal(firstReport.metrics.recallAt5.numerator, recallFound);
  assert.equal(firstReport.metrics.recallAt5.denominator, recallTotal);

  const mrrSum = positive.reduce((sum, entry) => {
    const index = entry.json.resultIds.slice(0, 5).findIndex((id) => entry.expected.relevant.some((item) => item.id === id));
    return sum + (index === -1 ? 0 : 1 / (index + 1));
  }, 0);
  assert.equal(firstReport.metrics.mrr.numerator, mrrSum);
  assert.equal(firstReport.metrics.mrr.denominator, positive.length);

  const gain = (grade, index) => (2 ** grade - 1) / Math.log2(index + 2);
  const ndcgSum = positive.reduce((sum, entry) => {
    const grades = new Map(entry.expected.relevant.map((item) => [item.id, item.grade]));
    const observed = entry.json.resultIds.slice(0, 5).reduce((total, id, index) => total + gain(grades.get(id) ?? 0, index), 0);
    const idealGrades = [...grades.values()].sort((left, right) => right - left).slice(0, 5);
    const ideal = idealGrades.reduce((total, grade, index) => total + gain(grade, index), 0);
    return sum + observed / ideal;
  }, 0);
  assert.equal(firstReport.metrics.ndcgAt5.numerator, ndcgSum);
  assert.equal(firstReport.metrics.ndcgAt5.denominator, positive.length);

  const comparable = (side) => ({
    resultIds: side.resultIds,
    selectedCodes: side.results.map((item) => item.selectedCodes),
    explanationCodes: side.results.map((item) => item.queryExplanationCode),
    rejected: side.rejected,
  });
  const parityFound = firstReport.queries.filter((entry) => JSON.stringify(comparable(entry.json)) === JSON.stringify(comparable(entry.sqlite))).length;
  assert.equal(firstReport.metrics.repositoryParity.numerator, parityFound);
  assert.equal(firstReport.metrics.repositoryParity.denominator, firstReport.queries.length);
});

test("report corpus counts are derived from the temp corpus rather than constants", (t) => {
  const root = createTempRoot();
  t.after(() => removeRoot(root));
  const filePath = path.join(root, ".generated", "knowledge", "reference-index.json");
  const index = readJson(filePath);
  const source = structuredClone(index.sources[0]);
  source.sourceId = `${source.sourceId}:wave6-count-fixture`;
  source.snapshotId = `${source.snapshotId}:wave6-count-fixture`;
  const document = structuredClone(index.documents[0]);
  document.documentId = `${document.documentId}:wave6-count-fixture`;
  document.snapshotId = source.snapshotId;
  const chunk = structuredClone(index.chunks[0]);
  chunk.chunkId = `${chunk.chunkId}:wave6-count-fixture`;
  chunk.documentId = document.documentId;
  chunk.rawText = "wave6 corpus count fixture";
  chunk.contentHash = sha256(chunk.rawText);
  chunk.searchText = normalizeSearchText(chunk.rawText);
  chunk.searchFolded = foldSearchText(chunk.rawText);
  index.sources.push(source);
  index.documents.push(document);
  index.chunks.push(chunk);
  index.counts = { sources: index.sources.length, documents: index.documents.length, chunks: index.chunks.length };
  writeStableJson(filePath, index);

  assert.throws(() => evaluateKnowledge({ appRoot: root }), /Retrieval evaluation failed/u);
  const report = readJson(path.join(root, "design", "knowledge", "reports", "retrieval-v0.1.json"));
  const records = createJsonRepository({ appRoot: root }).query({ limit: 100, domain: "visual-style" }).results;
  assert.equal(report.corpus.templateCount, records.filter((item) => item.kind === "template").length);
  assert.equal(report.corpus.approvedReferenceCount, records.filter((item) => item.kind === "reference").length);
});

test("report exposes actual accented/folded candidate IDs and full parity evidence", (t) => {
  const root = createTempRoot();
  t.after(() => removeRoot(root));
  const { reportPath } = evaluateKnowledge({ appRoot: root });
  const report = readJson(reportPath);
  const pairEvidence = report.accentPairs ?? report.accentPairEvidence;
  assert.ok(Array.isArray(pairEvidence), "report.accentPairs must expose lexical candidate evidence for every accent pair");
  assert.ok(report.queries.every((entry) => entry.json.results.every((item) => Array.isArray(item.queryTokens) && Array.isArray(item.matchedTokens))), "report lacks query/matched token evidence needed to recompute parity");
});

test("evaluator source passes actual accent text while raising only the candidate limit", () => {
  const source = fs.readFileSync(EVALUATOR, "utf8");
  assert.doesNotMatch(source, /candidateInput\s*=\s*\{[^}]*text:\s*["']["']/su, "accent candidate query must not erase text");
  assert.match(source, /candidateInput\s*=\s*\{[^}]*text:\s*query\.input\.text[^}]*limit:\s*100/su);
});

test("evaluateKnowledge is explicitly unavailable when the temp SQLite projection is absent", (t) => {
  const root = createTempRoot({ build: false });
  t.after(() => removeRoot(root));
  assert.equal(fs.existsSync(databasePath(root)), false);
  assert.throws(() => evaluateKnowledge({ appRoot: root }), /requires SQLite projection/u);
  assertEvaluatorFails(root, /requires SQLite projection/u);
});

test("mutations fail evaluator with non-zero status", (t) => {
  const cases = [
    {
      name: "wrong relevant ranking",
      pattern: /missing relevant IDs|recallAt5|accent-terminal-sample-accented/u,
      mutate: (root) => {
        const gold = readGold(root);
        const query = gold.queries.queries.find((entry) => entry.category === "accent-pair");
        gold.expected.expectations.find((entry) => entry.id === query.id).relevant = [{ id: "template:glitch-text@1.0.0", grade: 3 }];
        writeGold(root, gold);
      },
    },
    {
      name: "forbidden returned candidate",
      pattern: /forbidden IDs returned|hardFilterPrecision/u,
      mutate: (root) => {
        const gold = readGold(root);
        const query = gold.queries.queries.find((entry) => entry.id === "english-glitch-hook");
        const ranked = createJsonRepository({ appRoot: root }).query(query.input).results;
        assert.ok(ranked.length >= 1);
        const expectation = gold.expected.expectations.find((entry) => entry.id === query.id);
        expectation.relevant = [];
        expectation.forbiddenIds = [ranked[0].id];
        writeGold(root, gold);
      },
    },
    {
      name: "missing provenance",
      pattern: /provenanceCompleteness|incomplete provenance/u,
      mutate: (root) => {
        const filePath = path.join(root, ".generated", "knowledge", "reference-index.json");
        const index = readJson(filePath);
        const chunk = index.chunks.find((entry) => entry.chunkId.startsWith("chunk:"));
        const source = index.sources.find((entry) => entry.snapshotId === index.documents.find((document) => document.documentId === chunk.documentId).snapshotId);
        source.sourceRevision = "";
        writeStableJson(filePath, index);
      },
    },
    {
      name: "FTS/JSON parity divergence",
      pattern: /repositoryParity|parity failed/u,
      mutate: (root) => {
        const database = openDatabase(databasePath(root));
        try {
          database.prepare("INSERT INTO search_fts(search_fts) VALUES ('delete-all')").run();
        } finally {
          database.close();
        }
      },
    },
    {
      name: "below thresholds",
      pattern: /recallAt5|mrr|ndcgAt5/u,
      mutate: (root) => {
        const gold = readGold(root);
        for (const query of gold.queries.queries) {
          if (query.category === "accent-pair") {
            const suffix = query.variant === "accented" ? "a" : "a";
            query.input.text = `wave6-no-match-${query.pairId}-${suffix}${query.variant === "accented" ? "\u0301" : ""}`;
          } else if (query.category === "english") {
            query.input.text = "wave6-no-match-english";
          }
        }
        writeGold(root, gold);
      },
    },
    {
      name: "malformed pair",
      pattern: /Accent pair|differ only in diacritics/u,
      mutate: (root) => {
        const gold = readGold(root);
        const query = gold.queries.queries.find((entry) => entry.category === "accent-pair" && entry.variant === "folded");
        query.input.text = "not-the-folded-query";
        writeGold(root, gold);
      },
    },
    {
      name: "malformed category and count",
      pattern: /unsupported category|at least 32|same stable IDs/u,
      mutate: (root) => {
        const gold = readGold(root);
        gold.queries.queries[0].category = "not-a-category";
        gold.queries.queries = gold.queries.queries.slice(0, 31);
        writeGold(root, gold);
      },
    },
  ];

  for (const mutation of cases) {
    const root = createTempRoot();
    t.after(() => removeRoot(root));
    mutation.mutate(root);
    assertEvaluatorFails(root, mutation.pattern, mutation.name);
  }
});
