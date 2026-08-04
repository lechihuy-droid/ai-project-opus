import { foldSearchText, normalizeSearchText } from "../index-utils.mjs";
<<<<<<< HEAD
import { assertEvidenceDomain, isEvidenceDomain } from "../evidence-domain.mjs";
=======
>>>>>>> origin/main

export const QUERY_SCHEMA_VERSION = "lucida-knowledge-query/v1";

const compareText = (left, right) => String(left).localeCompare(String(right), "en");
const sorted = (values) => [...values].sort(compareText);
const unique = (values) => [...new Set(values.filter(Boolean))];

const asList = (value) => {
  if (value === undefined || value === null || value === "") return [];
  return (Array.isArray(value) ? value : [value]).flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
};

const booleanValue = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new Error(`${label} must be true or false.`);
};

export const normalizeQuery = (input = {}) => {
  const limit = input.limit === undefined ? 10 : Number(input.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("limit must be an integer between 1 and 100.");
  }

  return {
<<<<<<< HEAD
    domain: assertEvidenceDomain(input.domain, "query.domain"),
=======
>>>>>>> origin/main
    text: normalizeSearchText(input.text ?? input.query ?? ""),
    limit,
    intent: sorted(asList(input.intent)),
    aspectRatio: sorted(asList(input.aspectRatio ?? input["aspect-ratio"])),
    family: sorted(asList(input.family)),
    status: sorted(asList(input.status)),
    sourceType: sorted(asList(input.sourceType ?? input["source-type"])),
    mediaType: sorted(asList(input.mediaType ?? input["media-type"])),
    renderable: booleanValue(input.renderable, "renderable"),
    rights: sorted(asList(input.rights ?? input.rightsStatus ?? input["rights-status"])),
    approval: sorted(asList(input.approval ?? input.approvalStatus ?? input["approval-status"])),
  };
};

export const queryTokens = (text) => unique(foldSearchText(text).match(/[\p{L}\p{N}]+/gu) ?? []);

const templateSearch = (template) => {
  const title = template.label;
  const body = `${template.description} Template ${template.id} belongs to ${template.familyId}.`;
  const tags = [
    "template",
    template.id,
    template.familyId,
    template.status,
    ...template.capabilities.intents,
    ...template.capabilities.presets,
    ...template.capabilities.aspectRatios,
    String(template.capabilities.renderable),
  ].join(" ");
  const provenance = `${template.paths.package} ${template.paths.provenance}`;
  const searchText = normalizeSearchText([title, body, tags, provenance].join(" "));
  return { title, body, tags, provenance, searchText, searchFolded: foldSearchText(searchText) };
};

export const createTemplateRecord = (template, provenance = {}) => {
<<<<<<< HEAD
  assertEvidenceDomain(template.domain, `template ${template.id} domain`);
=======
>>>>>>> origin/main
  const search = templateSearch(template);
  const sourceId = provenance.sourceId ?? `source:template:${template.id}`;
  const snapshotId = provenance.snapshotId ?? `snapshot:${sourceId}:${template.contentHash.slice(0, 16)}`;
  return {
    id: `${template.logicalId}@${template.version}`,
    ownerType: "entity",
    ownerId: `${template.logicalId}@${template.version}`,
    kind: "template",
<<<<<<< HEAD
    domain: template.domain,
=======
>>>>>>> origin/main
    title: search.title,
    body: search.body,
    tags: search.tags.split(" ").filter(Boolean),
    searchText: search.searchText,
    searchFolded: search.searchFolded,
    capabilities: {
      intents: sorted(template.capabilities.intents),
      presets: sorted(template.capabilities.presets),
      aspectRatios: sorted(template.capabilities.aspectRatios),
      renderable: template.capabilities.renderable,
      family: template.familyId,
      status: template.status,
    },
    sourceType: "canonical-package",
    mediaType: "canonical-entity",
    provenance: {
      sourceId,
      snapshotId,
      sourceType: "canonical-package",
      sourceRef: provenance.sourcePath ?? template.paths.provenance,
      sourceRevision: provenance.sourceRevision ?? template.version,
      collectorVersion: provenance.collectorVersion ?? "compiler-v1",
      rights: { policy: "canonical-review-required", status: "canonical" },
      approval: { status: provenance.reviewStatus ?? "validated" },
    },
  };
};

export const createReferenceRecord = ({ source, document, chunk, observations }) => {
<<<<<<< HEAD
  assertEvidenceDomain(source.domain, `source ${source.sourceId} domain`);
  assertEvidenceDomain(document.domain, `document ${document.documentId} domain`);
  assertEvidenceDomain(chunk.domain, `chunk ${chunk.chunkId} domain`);
  if (source.domain !== document.domain || source.domain !== chunk.domain) {
    throw new Error(`Reference ${chunk.chunkId} has inconsistent evidence domains.`);
  }
=======
>>>>>>> origin/main
  const tags = sorted(unique([...chunk.tags, source.sourceType]));
  return {
    id: chunk.chunkId,
    ownerType: "chunk",
    ownerId: chunk.chunkId,
    kind: "reference",
<<<<<<< HEAD
    domain: chunk.domain,
=======
>>>>>>> origin/main
    title: chunk.title,
    body: chunk.rawText,
    tags,
    searchText: chunk.searchText,
    searchFolded: chunk.searchFolded,
    capabilities: {
      intents: [],
      presets: [],
      aspectRatios: [],
      renderable: false,
      family: sorted(unique((observations ?? []).map((item) => item.definition?.family))),
      status: undefined,
    },
    sourceType: source.sourceType,
    mediaType: document.mediaType,
    provenance: {
      sourceId: source.sourceId,
      snapshotId: source.snapshotId,
      sourceType: source.sourceType,
      sourceRef: document.sourceRef,
      sourceRevision: source.sourceRevision,
      collectorVersion: source.collectorVersion,
      rights: { policy: source.rights.policy, status: source.rights.status },
      approval: { status: source.approval.status },
    },
  };
};

export const recordsFromGeneratedIndexes = ({ templates, references }) => {
  const documents = new Map(references.documents.map((document) => [document.documentId, document]));
  const sources = new Map(references.sources.map((source) => [source.snapshotId, source]));
  return [
    ...templates.map((template) => createTemplateRecord(template)),
    ...references.chunks.map((chunk) => {
      const document = documents.get(chunk.documentId);
      const source = sources.get(document?.snapshotId);
      if (!document || !source) throw new Error(`Reference chunk ${chunk.chunkId} has incomplete generated provenance.`);
      return createReferenceRecord({ source, document, chunk, observations: chunk.observations });
    }),
  ].sort((left, right) => compareText(left.id, right.id));
};

const matchesAny = (expected, actual) => expected.length === 0 || expected.some((value) => actual.includes(value));
const reason = (code, detail) => detail === undefined ? { code } : { code, detail };

const hardFilterReasons = (record, query) => {
  const reasons = [];
<<<<<<< HEAD
  if (record.domain !== query.domain) reasons.push(reason("FILTER_DOMAIN_MISMATCH"));
=======
>>>>>>> origin/main
  const family = Array.isArray(record.capabilities.family) ? record.capabilities.family : [record.capabilities.family];
  if (!matchesAny(query.intent, record.capabilities.intents)) reasons.push(reason("FILTER_INTENT_MISMATCH"));
  if (!matchesAny(query.aspectRatio, record.capabilities.aspectRatios)) reasons.push(reason("FILTER_ASPECT_RATIO_MISMATCH"));
  if (!matchesAny(query.family, family)) reasons.push(reason("FILTER_FAMILY_MISMATCH"));
  if (!matchesAny(query.status, [record.capabilities.status])) reasons.push(reason("FILTER_STATUS_MISMATCH"));
  if (!matchesAny(query.sourceType, [record.sourceType])) reasons.push(reason("FILTER_SOURCE_TYPE_MISMATCH"));
  if (!matchesAny(query.mediaType, [record.mediaType])) reasons.push(reason("FILTER_MEDIA_TYPE_MISMATCH"));
  if (query.renderable !== undefined && query.renderable !== record.capabilities.renderable) {
    reasons.push(reason("FILTER_RENDERABLE_MISMATCH"));
  }
  if (!matchesAny(query.rights, [record.provenance.rights.status])) reasons.push(reason("FILTER_RIGHTS_MISMATCH"));
  if (!matchesAny(query.approval, [record.provenance.approval.status])) reasons.push(reason("FILTER_APPROVAL_MISMATCH"));
  return reasons;
};

const isSafeCorpusRecord = (record) => {
  if (record.kind === "template") return record.capabilities.renderable === true;
  return record.provenance.rights.status === "approved" && record.provenance.approval.status === "approved";
};

export const applyHardFilters = (records, query) => {
  const eligible = [];
  const rejected = [];
  for (const record of records) {
    // Unsafe evidence is intentionally invisible, even as a rejected candidate.
<<<<<<< HEAD
    if (!isEvidenceDomain(record.domain) || !isSafeCorpusRecord(record)) continue;
=======
    if (!isSafeCorpusRecord(record)) continue;
>>>>>>> origin/main
    const reasons = hardFilterReasons(record, query);
    if (reasons.length === 0) eligible.push(record);
    else rejected.push({ id: record.id, reasons });
  }
  return {
    eligible: eligible.sort((left, right) => compareText(left.id, right.id)),
    rejected: rejected.sort((left, right) => compareText(left.id, right.id)),
  };
};

const termFrequency = (text, token) => (text.match(new RegExp(`(?:^|\\s)${token.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?=\\s|$)`, "gu")) ?? []).length;

export const lexicalMatches = (records, tokens) => new Set(
  records.filter((record) => tokens.some((token) => termFrequency(record.searchFolded, token) > 0)).map((record) => record.id),
);

const lexicalScore = (record, corpus, tokens) => {
  if (tokens.length === 0) return { score: 0, matchedTokens: [] };
  let score = 0;
  const matchedTokens = [];
  for (const token of tokens) {
    const tf = termFrequency(record.searchFolded, token);
    if (tf === 0) continue;
    const documentFrequency = corpus.filter((candidate) => termFrequency(candidate.searchFolded, token) > 0).length;
    const idf = Math.log(1 + (corpus.length - documentFrequency + 0.5) / (documentFrequency + 0.5));
    score += (tf * 2.2 / (tf + 1.2)) * idf;
    matchedTokens.push(token);
  }
  return { score: Number(score.toFixed(6)), matchedTokens };
};

const selectedReasons = (record, query, matchedTokens) => {
  const reasons = [reason(record.kind === "template" ? "SAFE_CANONICAL_RENDERABLE" : "SAFE_REFERENCE_APPROVED")];
  if (query.intent.length) reasons.push(reason("MATCH_INTENT", query.intent));
<<<<<<< HEAD
  reasons.push(reason("MATCH_DOMAIN", query.domain));
=======
>>>>>>> origin/main
  if (query.aspectRatio.length) reasons.push(reason("MATCH_ASPECT_RATIO", query.aspectRatio));
  if (query.family.length) reasons.push(reason("MATCH_FAMILY", query.family));
  if (query.status.length) reasons.push(reason("MATCH_STATUS", query.status));
  if (query.sourceType.length) reasons.push(reason("MATCH_SOURCE_TYPE", query.sourceType));
  if (query.mediaType.length) reasons.push(reason("MATCH_MEDIA_TYPE", query.mediaType));
  if (query.renderable !== undefined) reasons.push(reason("MATCH_RENDERABLE", query.renderable));
  if (query.rights.length) reasons.push(reason("MATCH_RIGHTS", query.rights));
  if (query.approval.length) reasons.push(reason("MATCH_APPROVAL", query.approval));
  if (matchedTokens.length) reasons.push(reason("LEXICAL_MATCH", matchedTokens));
  reasons.push(reason("DETERMINISTIC_RULE_SCORE"));
  return reasons;
};

export const rankEligible = ({ eligible, rejected, query, retrievedIds, repository }) => {
  const tokens = queryTokens(query.text);
  const candidates = tokens.length === 0
    ? eligible
    : eligible.filter((record) => retrievedIds.has(record.id));
  const lexicalCorpus = candidates.length > 0 ? candidates : eligible;
  const results = candidates.map((record) => {
    const lexical = lexicalScore(record, lexicalCorpus, tokens);
    const ruleScore = Number((
      (record.kind === "template" ? 1 : 0) +
      (record.capabilities.renderable ? 0.5 : 0) +
      (query.intent.length + query.aspectRatio.length + query.family.length + query.status.length + query.sourceType.length + query.mediaType.length) * 0.1
    ).toFixed(6));
    const total = Number((lexical.score * 100 + ruleScore).toFixed(6));
    return {
      id: record.id,
      ownerType: record.ownerType,
      ownerId: record.ownerId,
      kind: record.kind,
<<<<<<< HEAD
      domain: record.domain,
=======
>>>>>>> origin/main
      title: record.title,
      tags: record.tags,
      capabilities: record.capabilities,
      sourceType: record.sourceType,
      mediaType: record.mediaType,
      provenance: record.provenance,
      score: { lexical: lexical.score, rules: ruleScore, total },
      selectedReasons: selectedReasons(record, query, lexical.matchedTokens),
      explanation: {
        code: "HARD_FILTER_THEN_LEXICAL_THEN_RULES",
        queryTokens: tokens,
        matchedTokens: lexical.matchedTokens,
        retrieval: tokens.length === 0 ? "hard-filter-only" : "lexical-bm25-like-v1",
      },
    };
  }).sort((left, right) => right.score.total - left.score.total || compareText(left.id, right.id));

  return {
    schemaVersion: QUERY_SCHEMA_VERSION,
    repository,
    query,
    results: results.slice(0, query.limit),
    rejectedCandidates: rejected,
  };
};
