import fs from "node:fs";
import path from "node:path";
import { readJson } from "../index-utils.mjs";
import {
  applyHardFilters,
  lexicalMatches,
  normalizeQuery,
  rankEligible,
  recordsFromGeneratedIndexes,
  queryTokens,
} from "./query-core.mjs";

const requiredIndex = (directory, name) => {
  const filePath = path.join(directory, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Generated JSON index is missing: .generated/knowledge/${name}. Run npm run knowledge:compile first.`);
  }
  return readJson(filePath);
};

export class JsonKnowledgeRepository {
  constructor({ appRoot = process.cwd() } = {}) {
    this.appRoot = appRoot;
  }

  query(input = {}) {
    const query = normalizeQuery(input);
    const directory = path.join(this.appRoot, ".generated", "knowledge");
    const records = recordsFromGeneratedIndexes({
      templates: requiredIndex(directory, "template-index.json").templates,
      references: requiredIndex(directory, "reference-index.json"),
    });
    const { eligible, rejected } = applyHardFilters(records, query);
    return rankEligible({
      eligible,
      rejected,
      query,
      retrievedIds: lexicalMatches(eligible, queryTokens(query.text)),
      repository: "json",
    });
  }
}

export const createJsonRepository = (options) => new JsonKnowledgeRepository(options);
