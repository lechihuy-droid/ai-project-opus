#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { databasePath } from "./sqlite-client.mjs";
import { foldSearchText } from "./index-utils.mjs";
import { createJsonRepository } from "./repositories/json-repository.mjs";
import { createSqliteRepository } from "./repositories/sqlite-repository.mjs";

const GOLD_QUERY_SCHEMA = "lucida-knowledge-gold-queries/v1";
const GOLD_EXPECTED_SCHEMA = "lucida-knowledge-gold-expected/v1";
const REPORT_SCHEMA = "lucida-knowledge-retrieval-report/v1";
const REQUIRED_PROVENANCE = [
  "sourceId", "snapshotId", "sourceType", "sourceRef", "sourceRevision", "collectorVersion",
];
const THRESHOLDS = {
  hardFilterPrecision: { operator: "=", value: 1 },
  recallAt5: { operator: ">=", value: 0.9 },
  mrr: { operator: ">=", value: 0.8 },
  ndcgAt5: { operator: ">=", value: 0.85 },
  accentPairCandidateParity: { operator: "=", value: 1 },
  repositoryParity: { operator: "=", value: 1 },
  provenanceCompleteness: { operator: "=", value: 1 },
};
const INPUT_FIELDS = new Set([
  "text", "query", "limit", "intent", "aspectRatio", "aspect-ratio", "family", "status",
  "sourceType", "source-type", "mediaType", "media-type", "renderable", "rights", "rightsStatus",
<<<<<<< HEAD
  "rights-status", "approval", "approvalStatus", "approval-status", "domain",
=======
  "rights-status", "approval", "approvalStatus", "approval-status",
>>>>>>> origin/main
]);

const readJson = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read ${label} at ${filePath}: ${error.message}`);
  }
};

const unique = (values) => [...new Set(values)];
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const percentage = (numerator, denominator) => denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
const codes = (entries) => (entries ?? []).map((entry) => entry.code).sort();
const listsEqual = (left, right) => left.length === right.length && left.every((value, index) => value === right[index]);
const hasAllCodes = (actual, expected) => expected.every((code) => actual.includes(code));
const filePath = (appRoot, ...segments) => path.join(appRoot, ...segments);
const nonTextFilters = (input) => Object.fromEntries(Object.entries(input)
  .filter(([field]) => field !== "text")
  .sort(([left], [right]) => left.localeCompare(right, "en")));

const validateGold = ({ queriesDocument, expectedDocument }) => {
  const errors = [];
  if (!isObject(queriesDocument) || queriesDocument.schemaVersion !== GOLD_QUERY_SCHEMA || !Array.isArray(queriesDocument.queries)) {
    errors.push(`queries.json must be ${GOLD_QUERY_SCHEMA} with a queries array.`);
  }
  if (!isObject(expectedDocument) || expectedDocument.schemaVersion !== GOLD_EXPECTED_SCHEMA || !Array.isArray(expectedDocument.expectations)) {
    errors.push(`expected.json must be ${GOLD_EXPECTED_SCHEMA} with an expectations array.`);
  }
  if (errors.length > 0) return { errors, queries: [], expectations: new Map() };

  const queries = queriesDocument.queries;
  const expectations = expectedDocument.expectations;
  if (queries.length < 32) errors.push(`Gold requires at least 32 queries; found ${queries.length}.`);
  const queryIds = queries.map((query) => query?.id);
  if (queryIds.some((id) => typeof id !== "string" || id.length === 0) || unique(queryIds).length !== queryIds.length) {
    errors.push("Gold query IDs must be non-empty and unique.");
  }
  const expectedIds = expectations.map((expected) => expected?.id);
  if (expectedIds.some((id) => typeof id !== "string" || id.length === 0) || unique(expectedIds).length !== expectedIds.length) {
    errors.push("Gold expectation IDs must be non-empty and unique.");
  }
  if (!listsEqual([...queryIds].sort(), [...expectedIds].sort())) {
    errors.push("queries.json and expected.json must contain exactly the same stable IDs.");
  }

  const accentPairs = new Map();
  const categoryCounts = new Map();
  for (const query of queries) {
    if (!isObject(query) || !["accent-pair", "english", "hard-negative-rights"].includes(query.category)) {
      errors.push(`Query ${query?.id ?? "<unknown>"} has an unsupported category.`);
      continue;
    }
    categoryCounts.set(query.category, (categoryCounts.get(query.category) ?? 0) + 1);
    if (!isObject(query.input) || typeof query.input.text !== "string" || query.input.text.trim().length === 0) {
      errors.push(`Query ${query.id} requires a non-empty input.text.`);
    } else if (Object.keys(query.input).some((field) => !INPUT_FIELDS.has(field))) {
      errors.push(`Query ${query.id} has an unsupported input filter.`);
    }
<<<<<<< HEAD
    if (!isObject(query.input) || !["factual", "visual-style"].includes(query.input.domain)) {
      errors.push(`Query ${query.id} requires input.domain factual or visual-style.`);
    }
=======
>>>>>>> origin/main
    if (!Number.isInteger(query.input?.limit) || query.input.limit < 1 || query.input.limit > 5) {
      errors.push(`Query ${query.id} must set input.limit between 1 and 5.`);
    }
    if (query.category === "accent-pair") {
      if (typeof query.pairId !== "string" || !["accented", "folded"].includes(query.variant)) {
        errors.push(`Accent query ${query.id} requires pairId and accented/folded variant.`);
      } else {
        accentPairs.set(query.pairId, [...(accentPairs.get(query.pairId) ?? []), query]);
      }
    } else if (query.pairId !== undefined || query.variant !== undefined) {
      errors.push(`Only accent-pair query ${query.id} may declare pairId or variant.`);
    }
  }
  if ((categoryCounts.get("accent-pair") ?? 0) < 24 || accentPairs.size < 12) {
    errors.push(`Gold requires at least 12 Vietnamese accent pairs (24 variants); found ${accentPairs.size} pairs and ${categoryCounts.get("accent-pair") ?? 0} variants.`);
  }
  if ((categoryCounts.get("english") ?? 0) < 4) errors.push(`Gold requires at least 4 English queries; found ${categoryCounts.get("english") ?? 0}.`);
  if ((categoryCounts.get("hard-negative-rights") ?? 0) < 4) errors.push(`Gold requires at least 4 hard-negative/rights queries; found ${categoryCounts.get("hard-negative-rights") ?? 0}.`);
  for (const [pairId, pair] of accentPairs) {
    if (pair.length !== 2 || !listsEqual(pair.map((query) => query.variant).sort(), ["accented", "folded"])) {
      errors.push(`Accent pair ${pairId} must contain exactly accented and folded variants.`);
      continue;
    }
    const [accented, folded] = pair.sort((left, right) => left.variant.localeCompare(right.variant, "en"));
    if (accented.input.text === folded.input.text || foldSearchText(accented.input.text) !== foldSearchText(folded.input.text)) {
      errors.push(`Accent pair ${pairId} must differ only in diacritics after search folding.`);
    }
    if (JSON.stringify(nonTextFilters(accented.input)) !== JSON.stringify(nonTextFilters(folded.input))) {
      errors.push(`Accent pair ${pairId} must use identical non-text filters.`);
    }
  }

  const expectationById = new Map(expectations.map((expected) => [expected?.id, expected]));
  for (const expected of expectations) {
    if (!isObject(expected) || !Array.isArray(expected.relevant) || !Array.isArray(expected.forbiddenIds) || !isObject(expected.expectedExplanationCodes)) {
      errors.push(`Expectation ${expected?.id ?? "<unknown>"} has an invalid shape.`);
      continue;
    }
    const relevantIds = expected.relevant.map((entry) => entry?.id);
    if (relevantIds.some((id) => typeof id !== "string") || unique(relevantIds).length !== relevantIds.length) {
      errors.push(`Expectation ${expected.id} must have unique relevant IDs.`);
    }
    if (expected.relevant.some((entry) => !Number.isInteger(entry?.grade) || entry.grade < 1 || entry.grade > 3)) {
      errors.push(`Expectation ${expected.id} grades must be integers from 1 to 3.`);
    }
    if (expected.forbiddenIds.some((id) => typeof id !== "string") || unique(expected.forbiddenIds).length !== expected.forbiddenIds.length) {
      errors.push(`Expectation ${expected.id} must have unique forbidden IDs.`);
    }
    if (relevantIds.some((id) => expected.forbiddenIds.includes(id))) errors.push(`Expectation ${expected.id} overlaps relevant and forbidden IDs.`);
    for (const type of ["query", "selected", "rejected"]) {
      const value = expected.expectedExplanationCodes[type];
      if (!Array.isArray(value) || value.some((code) => typeof code !== "string") || unique(value).length !== value.length) {
        errors.push(`Expectation ${expected.id} requires unique expectedExplanationCodes.${type}.`);
      }
    }
  }
  for (const query of queries) {
    const expected = expectationById.get(query.id);
    if (!expected || !Array.isArray(expected.relevant) || !Array.isArray(expected.forbiddenIds)) continue;
    if (["accent-pair", "english"].includes(query.category) && expected.relevant.length === 0) {
      errors.push(`Positive query ${query.id} must have at least one relevant ID; hardFilterPrecision evidence would be semantically incomplete.`);
    }
    if (query.category === "hard-negative-rights") {
      if (expected.relevant.length !== 0) errors.push(`Hard-negative query ${query.id} must not have relevant IDs.`);
      if (expected.forbiddenIds.length === 0) errors.push(`Hard-negative query ${query.id} must have at least one forbidden ID.`);
    }
  }
  return { errors, queries, expectations: expectationById };
};

const normalizedParityResult = (result) => ({
  ids: result.results.map((item) => item.id),
  selectedCodes: result.results.map((item) => codes(item.selectedReasons)),
  explanationCodes: result.results.map((item) => item.explanation.code),
  queryTokens: result.results.map((item) => item.explanation.queryTokens),
  matchedTokens: result.results.map((item) => item.explanation.matchedTokens),
  rejected: result.rejectedCandidates.map((item) => ({ id: item.id, codes: codes(item.reasons) })),
});

const resultEvidence = (result) => ({
  resultIds: result.results.map((item) => item.id),
  results: result.results.map((item) => ({
    id: item.id,
    selectedCodes: codes(item.selectedReasons),
    queryExplanationCode: item.explanation.code,
    capabilities: item.capabilities,
    sourceType: item.sourceType,
    mediaType: item.mediaType,
    queryTokens: item.explanation.queryTokens,
    matchedTokens: item.explanation.matchedTokens,
    provenance: item.provenance,
  })),
  rejected: result.rejectedCandidates.map((item) => ({ id: item.id, codes: codes(item.reasons) })),
});

const resultSatisfiesFilters = (result, item) => {
  const query = result.query;
  const matches = (filters, values) => filters.length === 0 || filters.some((filter) => values.includes(filter));
  if (!matches(query.intent, item.capabilities.intents)) return false;
  if (!matches(query.aspectRatio, item.capabilities.aspectRatios)) return false;
  if (!matches(query.family, Array.isArray(item.capabilities.family) ? item.capabilities.family : [item.capabilities.family])) return false;
  if (!matches(query.status, [item.capabilities.status])) return false;
  if (!matches(query.sourceType, [item.sourceType])) return false;
  if (!matches(query.mediaType, [item.mediaType])) return false;
  if (query.renderable !== undefined && query.renderable !== item.capabilities.renderable) return false;
  if (!matches(query.rights, [item.provenance.rights.status])) return false;
  return matches(query.approval, [item.provenance.approval.status]);
};

const provenanceGaps = (provenance) => {
  const gaps = REQUIRED_PROVENANCE.filter((field) => typeof provenance?.[field] !== "string" || provenance[field].length === 0);
  if (typeof provenance?.rights?.policy !== "string" || typeof provenance?.rights?.status !== "string") gaps.push("rights");
  if (typeof provenance?.approval?.status !== "string") gaps.push("approval");
  return gaps;
};

const reciprocalRank = (results, relevantIds) => {
  const index = results.findIndex((item) => relevantIds.has(item.id));
  return index === -1 ? 0 : 1 / (index + 1);
};

const ndcgAt5 = (results, grades) => {
  const gain = (grade, index) => (2 ** grade - 1) / Math.log2(index + 2);
  const observed = results.slice(0, 5).reduce((sum, item, index) => sum + gain(grades.get(item.id) ?? 0, index), 0);
  const idealGrades = [...grades.values()].sort((left, right) => right - left).slice(0, 5);
  const ideal = idealGrades.reduce((sum, grade, index) => sum + gain(grade, index), 0);
  return ideal === 0 ? null : observed / ideal;
};

const metric = (actual, threshold, numerator, denominator) => ({
  actual: actual === null ? null : Number(actual.toFixed(6)),
  threshold,
  numerator,
  denominator,
  passed: denominator > 0 && (threshold.operator === "=" ? actual === threshold.value : actual >= threshold.value),
});

export const evaluateKnowledge = ({ appRoot = process.cwd() } = {}) => {
  const dbPath = databasePath(appRoot);
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Knowledge evaluation requires SQLite projection at ${dbPath}. Run npm run knowledge:build first, or use npm run knowledge:qa.`);
  }
  const queriesDocument = readJson(filePath(appRoot, "tests", "knowledge", "gold", "queries.json"), "gold queries");
  const expectedDocument = readJson(filePath(appRoot, "tests", "knowledge", "gold", "expected.json"), "gold expectations");
  const gold = validateGold({ queriesDocument, expectedDocument });
  if (gold.errors.length > 0) throw new Error(`Gold dataset is invalid:\n${gold.errors.map((error) => `- ${error}`).join("\n")}`);

  const jsonRepository = createJsonRepository({ appRoot });
  const sqliteRepository = createSqliteRepository({ appRoot, dbPath });
<<<<<<< HEAD
  const corpusRecords = jsonRepository.query({ limit: 100, domain: "visual-style" }).results;
=======
  const corpusRecords = jsonRepository.query({ limit: 100 }).results;
>>>>>>> origin/main
  const corpusIds = new Set(corpusRecords.map((item) => item.id));
  const unknownIds = [];
  for (const expected of gold.expectations.values()) {
    for (const id of [...expected.relevant.map((entry) => entry.id), ...expected.forbiddenIds]) {
      if (!corpusIds.has(id)) unknownIds.push(`${expected.id}:${id}`);
    }
  }
  if (unknownIds.length > 0) throw new Error(`Gold references IDs outside the safe corpus: ${unknownIds.sort().join(", ")}`);

  const totals = {
    hardFilter: { passed: 0, total: 0 }, recall: { found: 0, total: 0 }, mrr: { sum: 0, total: 0 },
    ndcg: { sum: 0, total: 0 }, accent: { passed: 0, total: 0 }, parity: { passed: 0, total: 0 },
    provenance: { complete: 0, total: 0 },
  };
  const pairCandidates = new Map();
  const evidence = [];

  for (const query of gold.queries) {
    const expected = gold.expectations.get(query.id);
    const jsonResult = jsonRepository.query(query.input);
    const sqliteResult = sqliteRepository.query(query.input);
    const failures = [];
    const relevantIds = new Set(expected.relevant.map((entry) => entry.id));
    const grades = new Map(expected.relevant.map((entry) => [entry.id, entry.grade]));
    const jsonIds = jsonResult.results.map((item) => item.id);

    for (const item of jsonResult.results) {
      totals.hardFilter.total += 1;
      if (resultSatisfiesFilters(jsonResult, item) && !expected.forbiddenIds.includes(item.id)) totals.hardFilter.passed += 1;
      else failures.push(`hard-filter violation: ${item.id}`);
      const gaps = provenanceGaps(item.provenance);
      totals.provenance.total += 1;
      if (gaps.length === 0) totals.provenance.complete += 1;
      else failures.push(`incomplete provenance for ${item.id}: ${gaps.join(", ")}`);
    }
    const missingRelevant = expected.relevant.filter((entry) => !jsonIds.includes(entry.id)).map((entry) => entry.id);
    if (missingRelevant.length > 0) failures.push(`missing relevant IDs in top 5: ${missingRelevant.join(", ")}`);
    const forbiddenReturned = expected.forbiddenIds.filter((id) => jsonIds.includes(id));
    if (forbiddenReturned.length > 0) failures.push(`forbidden IDs returned: ${forbiddenReturned.join(", ")}`);
    if (!hasAllCodes([jsonResult.results[0]?.explanation.code].filter(Boolean), expected.expectedExplanationCodes.query)) {
      failures.push(`missing query explanation codes: ${expected.expectedExplanationCodes.query.join(", ")}`);
    }
    for (const relevant of jsonResult.results.filter((item) => relevantIds.has(item.id))) {
      if (!hasAllCodes(codes(relevant.selectedReasons), expected.expectedExplanationCodes.selected)) {
        failures.push(`missing selected explanation codes for ${relevant.id}`);
      }
    }
    const rejectedCodes = unique(jsonResult.rejectedCandidates.flatMap((item) => codes(item.reasons)));
    if (!hasAllCodes(rejectedCodes, expected.expectedExplanationCodes.rejected)) {
      failures.push(`missing rejected explanation codes: ${expected.expectedExplanationCodes.rejected.join(", ")}`);
    }

    if (relevantIds.size > 0) {
      totals.recall.total += relevantIds.size;
      totals.recall.found += jsonResult.results.slice(0, 5).filter((item) => relevantIds.has(item.id)).length;
      totals.mrr.total += 1;
      totals.mrr.sum += reciprocalRank(jsonResult.results.slice(0, 5), relevantIds);
      totals.ndcg.total += 1;
      totals.ndcg.sum += ndcgAt5(jsonResult.results, grades);
    }
    const parityPassed = JSON.stringify(normalizedParityResult(jsonResult)) === JSON.stringify(normalizedParityResult(sqliteResult));
    totals.parity.total += 1;
    if (parityPassed) totals.parity.passed += 1;
    else failures.push("JSON/SQLite result, ordering, or explanation parity failed");

    if (query.category === "accent-pair") {
      const candidateInput = { ...query.input, text: query.input.text, limit: 100 };
      pairCandidates.set(query.id, jsonRepository.query(candidateInput).results.map((item) => item.id).sort());
    }
    evidence.push({
      id: query.id,
      category: query.category,
      pairId: query.pairId,
      variant: query.variant,
      input: query.input,
      expected,
      json: resultEvidence(jsonResult),
      sqlite: resultEvidence(sqliteResult),
      failures,
    });
  }

  const accentPairs = [];
  for (const [pairId, pair] of new Map(gold.queries.filter((query) => query.category === "accent-pair").map((query) => [query.pairId, gold.queries.filter((other) => other.pairId === query.pairId)])).entries()) {
    const [accented, folded] = pair.sort((left, right) => left.variant.localeCompare(right.variant, "en"));
    const accentedCandidateIds = pairCandidates.get(accented.id);
    const foldedCandidateIds = pairCandidates.get(folded.id);
    const passed = JSON.stringify(accentedCandidateIds) === JSON.stringify(foldedCandidateIds);
    accentPairs.push({
      pairId,
      accented: {
        queryId: accented.id,
        text: accented.input.text,
        foldedText: foldSearchText(accented.input.text),
        candidateIds: accentedCandidateIds,
      },
      folded: {
        queryId: folded.id,
        text: folded.input.text,
        foldedText: foldSearchText(folded.input.text),
        candidateIds: foldedCandidateIds,
      },
      passed,
    });
    totals.accent.total += 1;
    if (passed) totals.accent.passed += 1;
    else {
      totals.accent.passed += 0;
      evidence.find((entry) => entry.id === accented.id).failures.push(`accent-pair candidate parity failed for ${pairId}`);
      evidence.find((entry) => entry.id === folded.id).failures.push(`accent-pair candidate parity failed for ${pairId}`);
    }
  }

  const metrics = {
    hardFilterPrecision: metric(percentage(totals.hardFilter.passed, totals.hardFilter.total), THRESHOLDS.hardFilterPrecision, totals.hardFilter.passed, totals.hardFilter.total),
    recallAt5: metric(percentage(totals.recall.found, totals.recall.total), THRESHOLDS.recallAt5, totals.recall.found, totals.recall.total),
    mrr: metric(percentage(totals.mrr.sum, totals.mrr.total), THRESHOLDS.mrr, totals.mrr.sum, totals.mrr.total),
    ndcgAt5: metric(percentage(totals.ndcg.sum, totals.ndcg.total), THRESHOLDS.ndcgAt5, totals.ndcg.sum, totals.ndcg.total),
    accentPairCandidateParity: metric(percentage(totals.accent.passed, totals.accent.total), THRESHOLDS.accentPairCandidateParity, totals.accent.passed, totals.accent.total),
    repositoryParity: metric(percentage(totals.parity.passed, totals.parity.total), THRESHOLDS.repositoryParity, totals.parity.passed, totals.parity.total),
    provenanceCompleteness: metric(percentage(totals.provenance.complete, totals.provenance.total), THRESHOLDS.provenanceCompleteness, totals.provenance.complete, totals.provenance.total),
  };
  const report = {
    schemaVersion: REPORT_SCHEMA,
    corpus: {
      templateCount: corpusRecords.filter((item) => item.kind === "template").length,
      approvedReferenceCount: corpusRecords.filter((item) => item.kind === "reference").length,
    },
    gold: { queryCount: gold.queries.length, accentPairCount: totals.accent.total, englishQueryCount: gold.queries.filter((query) => query.category === "english").length, hardNegativeRightsQueryCount: gold.queries.filter((query) => query.category === "hard-negative-rights").length },
<<<<<<< HEAD
    domainMetrics: Object.fromEntries(["factual", "visual-style"].map((domain) => ({
      domain,
      queryCount: gold.queries.filter((query) => query.input.domain === domain).length,
      resultCount: evidence.filter((entry) => entry.input.domain === domain).reduce((count, entry) => count + entry.json.results.length, 0),
    })).map((entry) => [entry.domain, entry])),
=======
>>>>>>> origin/main
    metrics,
    passed: Object.values(metrics).every((entry) => entry.passed) && evidence.every((entry) => entry.failures.length === 0),
    accentPairs,
    queries: evidence,
  };
  const reportPath = filePath(appRoot, "design", "knowledge", "reports", "retrieval-v0.1.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  if (!report.passed) {
    const failedMetrics = Object.entries(metrics).filter(([, entry]) => !entry.passed).map(([name]) => name);
    const failedQueries = evidence.filter((entry) => entry.failures.length > 0).map((entry) => entry.id);
    throw new Error(`Retrieval evaluation failed. Metrics: ${failedMetrics.join(", ") || "none"}. Queries: ${failedQueries.join(", ") || "none"}. See ${reportPath}.`);
  }
  return { reportPath, report };
};

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  try {
    const { reportPath, report } = evaluateKnowledge();
    console.log(`Knowledge evaluation passed: ${reportPath}`);
    for (const [name, entry] of Object.entries(report.metrics)) console.log(`${name}: ${entry.actual} ${entry.threshold.operator} ${entry.threshold.value}`);
  } catch (error) {
    console.error(`Knowledge evaluation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
