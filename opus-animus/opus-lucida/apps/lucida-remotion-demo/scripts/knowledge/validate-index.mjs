#!/usr/bin/env node

import path from "node:path";
import { validateGeneratedIndex } from "./index-utils.mjs";

const appRoot = process.cwd();
const knowledgeDir = path.join(appRoot, ".generated", "knowledge");
const result = validateGeneratedIndex({ appRoot, knowledgeDir });

if (result.errors.length > 0) {
  for (const error of result.errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Generated knowledge index validation passed: ${result.templates} template(s), ${result.adapters} adapter(s), ${result.references} approved reference source(s).`);
}
