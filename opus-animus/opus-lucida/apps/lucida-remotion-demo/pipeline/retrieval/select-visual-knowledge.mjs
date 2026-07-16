import fs from "node:fs";
import path from "node:path";
import { createJsonRepository } from "../../scripts/knowledge/repositories/json-repository.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const repositoryFor = ({ appRoot, name }) => name === "sqlite"
  ? createSqliteRepository({ appRoot })
  : createJsonRepository({ appRoot });

const resultFamily = (result, allowedFamilies) => {
  const families = Array.isArray(result?.capabilities?.family)
    ? result.capabilities.family
    : [result?.capabilities?.family];
  return families.find((family) => allowedFamilies.includes(family)) ?? null;
};

const evidenceFor = (result) => {
  const families = Array.isArray(result.capabilities.family)
    ? result.capabilities.family
    : [result.capabilities.family].filter(Boolean);
  return {
    id: result.id,
    title: result.title,
    family: families[0] ?? null,
    sourceType: result.sourceType,
    sourceRef: result.provenance.sourceRef,
    score: result.score.total,
    reasons: result.selectedReasons.map((reason) => reason.code),
  };
};

export const selectVisualKnowledge = ({ normalized, config, appRoot = process.cwd() }) => {
  const settings = config.knowledge ?? {};
  const enabled = settings.enabled === true;
  const repositoryName = settings.repository ?? "sqlite";
  const manifestPath = path.join(appRoot, ".generated", "knowledge", "manifest.json");
  const manifestHash = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8")).manifestHash
    : null;

  if (!enabled) {
    return {
      schemaVersion: "visual-knowledge-selection/v1",
      enabled: false,
      repository: null,
      manifestHash,
      selections: [],
      summary: { queried: 0, matched: 0, evidence: 0 },
    };
  }

  const repository = repositoryFor({ appRoot, name: repositoryName });
  const limit = settings.limit ?? 3;
  const selections = [];

  for (const event of normalized.events) {
    const requestedFamily = event.data?.family ?? event.data?.visualFamily;
    const text = clean([
      event.text,
      requestedFamily,
      ...(event.data?.tags ?? []),
    ].filter(Boolean).join(" ")).slice(0, settings.maxQueryCharacters ?? 600);
    if (!text) continue;
    const families = config.mapping.allowedFamilies.includes(requestedFamily)
      ? [requestedFamily]
      : config.mapping.allowedFamilies;
    const query = {
      text,
      family: families,
      rights: "approved",
      approval: "approved",
      limit,
    };
    const result = repository.query(query);
    const top = result.results[0];
    selections.push({
      eventId: event.id,
      query,
      recommendedFamily: resultFamily(top, config.mapping.allowedFamilies),
      evidence: result.results.map(evidenceFor),
    });
  }

  return {
    schemaVersion: "visual-knowledge-selection/v1",
    enabled: true,
    repository: repositoryName,
    manifestHash,
    selections,
    summary: {
      queried: selections.length,
      matched: selections.filter((selection) => selection.recommendedFamily).length,
      evidence: selections.reduce((count, selection) => count + selection.evidence.length, 0),
    },
  };
};
