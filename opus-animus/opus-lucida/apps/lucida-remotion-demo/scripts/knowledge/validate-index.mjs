#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { compileStylePatterns } from "./compile-references.mjs";
import { readJson, sha256File, stableJson, validateGeneratedIndex } from "./index-utils.mjs";

const appRoot = process.cwd();
const knowledgeDir = path.join(appRoot, ".generated", "knowledge");
const result = validateGeneratedIndex({ appRoot, knowledgeDir });
const errors = [...result.errors];
const stylePatternFile = "style-pattern-index.json";
const stylePatternPath = path.join(knowledgeDir, stylePatternFile);
const manifestPath = path.join(knowledgeDir, "manifest.json");

if (!fs.existsSync(stylePatternPath)) {
  errors.push(`Missing generated index: .generated/knowledge/${stylePatternFile}`);
} else {
  try {
    const actual = readJson(stylePatternPath);
    const expected = compileStylePatterns({ appRoot });
    if (stableJson(actual) !== stableJson(expected)) {
      errors.push("Style pattern index is stale or does not match eligible package-local records.");
    }
    const manifest = readJson(manifestPath);
    if (manifest.artifactHashes?.[stylePatternFile] !== sha256File(stylePatternPath)) {
      errors.push(`Manifest hash mismatch for ${stylePatternFile}.`);
    }
    for (const [key, value] of Object.entries({
      stylePatternPackages: expected.counts.packages,
      stylePatternVariants: expected.counts.variants,
      stylePatterns: expected.counts.patterns,
    })) {
      if (manifest.counts?.[key] !== value) errors.push(`Manifest ${key} count does not match style pattern index.`);
    }
  } catch (error) {
    errors.push(`Cannot recompute style pattern index: ${error.message}`);
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Generated knowledge index validation passed: ${result.templates} template(s), ${result.adapters} adapter(s), ${result.references} approved reference source(s).`);
}
