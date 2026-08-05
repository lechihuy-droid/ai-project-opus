import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const repositoryFor = ({ appRoot, name }) => name === "sqlite"
  ? createSqliteRepository({ appRoot })
  : createJsonRepository({ appRoot });

const factualEvidenceFor = (result) => ({
  id: result.provenance.sourceId,
  chunkId: result.id,
  domain: "factual",
  title: result.title,
  family: null,
  sourceType: result.sourceType,
  sourceRef: result.provenance.sourceRef,
  score: result.score.total,
  reasons: result.selectedReasons.map((reason) => reason.code),
});

export const selectFactualKnowledge = ({
  normalized,
  config,
  appRoot = process.cwd(),
  repository = null,
}) => {
  const settings = config.knowledge ?? {};
  const repositoryName = settings.repository ?? "sqlite";
  const store = repository ?? repositoryFor({ appRoot, name: repositoryName });
  const selections = [];
  for (const event of normalized.events) {
    const factRefs = [...new Set(event.factRefs ?? [])];
    if (!factRefs.length) continue;
    const query = {
      domain: "factual",
      text: clean([event.title, event.body ?? event.text, event.intent, event.beatRole, ...(event.actors ?? [])].filter(Boolean).join(" ")),
      rights: "approved",
      approval: "approved",
      limit: Math.max(settings.factualLimit ?? 20, factRefs.length),
    };
    const result = store.query(query);
    const bySource = new Map();
    for (const item of result.results) {
      const sourceId = item.provenance?.sourceId;
      if (factRefs.includes(sourceId) && !bySource.has(sourceId)) bySource.set(sourceId, factualEvidenceFor(item));
    }
    selections.push({
      eventId: event.id,
      query,
      requestedFactRefs: factRefs,
      resolvedFactRefs: factRefs.filter((factRef) => bySource.has(factRef)),
      evidence: factRefs.flatMap((factRef) => bySource.has(factRef) ? [bySource.get(factRef)] : []),
    });
  }
  return {
    schemaVersion: "factual-knowledge-selection/v1",
    domain: "factual",
    enabled: selections.length > 0,
    repository: repository ? "injected" : repositoryName,
    selections,
    summary: {
      queried: selections.length,
      requested: selections.reduce((count, selection) => count + selection.requestedFactRefs.length, 0),
      resolved: selections.reduce((count, selection) => count + selection.resolvedFactRefs.length, 0),
      evidence: selections.reduce((count, selection) => count + selection.evidence.length, 0),
      domain: "factual",
    },
  };
};

export const mergeKnowledgeSelections = ({ visual, factual }) => {
  const eventIds = [...new Set([
    ...(visual.selections ?? []).map((selection) => selection.eventId),
    ...(factual.selections ?? []).map((selection) => selection.eventId),
  ])];
  const visualByEvent = new Map((visual.selections ?? []).map((selection) => [selection.eventId, selection]));
  const factualByEvent = new Map((factual.selections ?? []).map((selection) => [selection.eventId, selection]));
  return {
    schemaVersion: "lucida-knowledge-selection/v2",
    enabled: visual.enabled || factual.enabled,
    repository: visual.repository ?? factual.repository,
    manifestHash: visual.manifestHash ?? null,
    selections: eventIds.map((eventId) => {
      const visualSelection = visualByEvent.get(eventId);
      const factualSelection = factualByEvent.get(eventId);
      return {
        eventId,
        query: {
          visualStyle: visualSelection?.query ?? null,
          factual: factualSelection?.query ?? null,
        },
        recommendedFamily: visualSelection?.recommendedFamily ?? null,
        requestedFactRefs: factualSelection?.requestedFactRefs ?? [],
        resolvedFactRefs: factualSelection?.resolvedFactRefs ?? [],
        evidence: [...(visualSelection?.evidence ?? []), ...(factualSelection?.evidence ?? [])],
      };
    }),
    summary: {
      domains: {
        "visual-style": visual.summary,
        factual: factual.summary,
      },
      queried: Math.max(visual.summary?.queried ?? 0, factual.summary?.queried ?? 0),
      matched: visual.summary?.matched ?? 0,
      evidence: (visual.summary?.evidence ?? 0) + (factual.summary?.evidence ?? 0),
    },
  };
};
