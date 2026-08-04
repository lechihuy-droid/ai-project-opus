#!/usr/bin/env node

import path from "node:path";
import { pathToFileURL } from "node:url";
import { createJsonRepository } from "./repositories/json-repository.mjs";
import { createSqliteRepository } from "./repositories/sqlite-repository.mjs";

const HELP = `Usage: npm run knowledge:query -- [options]

Options:
  --repository json|sqlite  Select the generated JSON repository (default: json) or SQLite projection.
<<<<<<< HEAD
  --domain factual|visual-style  Required evidence domain.
=======
>>>>>>> origin/main
  --query <text>            Full-text query. Vietnamese accent-folding is supported.
  --intent <value>          Filter template intent.
  --aspect-ratio <value>    Filter aspect ratio, for example 9:16.
  --family <value>          Filter visual family.
  --status <value>          Filter canonical template status.
  --source-type <value>     Filter canonical-package, repository, web, image, or theme.
  --media-type <value>      Filter canonical-entity, repository, web, image, or theme.
  --renderable [true|false] Filter renderable capability; a bare flag means true.
  --rights <value>          Filter rights status.
  --approval <value>        Filter approval status.
  --limit <1-100>           Result limit (default: 10).
  --json                    Emit machine-readable JSON only.
  --help                    Show this help.`;

const optionName = (name) => ({
  "aspect-ratio": "aspectRatio",
  "source-type": "sourceType",
  "media-type": "mediaType",
}[name] ?? name);

export const parseQueryArguments = (argv) => {
  const options = { repository: "json", json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (!argument.startsWith("--")) throw new Error(`Unknown argument: ${argument}`);
    const name = optionName(argument.slice(2));
    if (![
      "repository", "query", "intent", "aspectRatio", "family", "status", "sourceType", "mediaType",
<<<<<<< HEAD
       "renderable", "rights", "approval", "limit", "domain",
=======
      "renderable", "rights", "approval", "limit",
>>>>>>> origin/main
    ].includes(name)) {
      throw new Error(`Unknown option: ${argument}`);
    }
    const next = argv[index + 1];
    if (name === "renderable" && (next === undefined || next.startsWith("--"))) {
      options.renderable = true;
      continue;
    }
    if (next === undefined || next.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    options[name] = next;
    index += 1;
  }
  if (!["json", "sqlite"].includes(options.repository)) {
    throw new Error("repository must be json or sqlite.");
  }
<<<<<<< HEAD
  if (!options.domain) throw new Error("--domain is required (factual or visual-style).");
=======
>>>>>>> origin/main
  return options;
};

export const runQuery = ({ argv = process.argv.slice(2), appRoot = process.cwd() } = {}) => {
  const options = parseQueryArguments(argv);
  if (options.help) return { help: true };
  const { repository, json, ...query } = options;
  const instance = repository === "sqlite"
    ? createSqliteRepository({ appRoot })
    : createJsonRepository({ appRoot });
  return { json, result: instance.query(query) };
};

const renderText = (result) => {
  const lines = [`Repository: ${result.repository}`, `Results: ${result.results.length}`];
  for (const item of result.results) {
    lines.push(`${item.id}  score=${item.score.total}  ${item.title}`);
    lines.push(`  ${item.selectedReasons.map((entry) => entry.code).join(", ")}`);
  }
  if (result.rejectedCandidates.length) {
    lines.push(`Rejected: ${result.rejectedCandidates.length}`);
    for (const item of result.rejectedCandidates) {
      lines.push(`  ${item.id}: ${item.reasons.map((entry) => entry.code).join(", ")}`);
    }
  }
  return lines.join("\n");
};

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  try {
    const output = runQuery();
    if (output.help) console.log(HELP);
    else console.log(output.json ? JSON.stringify(output.result, null, 2) : renderText(output.result));
  } catch (error) {
    console.error(`Knowledge query failed: ${error.message}`);
    process.exitCode = 1;
  }
}
