#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256File, writeStableJson } from "./index-utils.mjs";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const libraryRoot = path.join(appRoot, "design/knowledge/reference-library");
const targets = [
  ...fs.readdirSync(path.join(libraryRoot, "repository"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("w8-"))
    .map((entry) => ["repository", entry.name]),
  ...fs.readdirSync(path.join(libraryRoot, "web"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && (entry.name.startsWith("w8-") || entry.name === "openai-gpt-5-6-official"))
    .map((entry) => ["web", entry.name]),
];

for (const [sourceType, packageId] of targets) {
  const sourcePath = path.join(libraryRoot, sourceType, packageId, "source.json");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const artifactPath = path.join(appRoot, source.provenance.collectorArtifact);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const approval = { ...source.approval, approvedAt: String(source.approval.approvedAt).slice(0, 10) };
  artifact.approval = approval;
  artifact.sources[0].rights = source.rights;
  writeStableJson(artifactPath, artifact);
  source.approval = approval;
  source.provenance.sanitizedArtifactChecksum = sha256File(artifactPath);
  writeStableJson(sourcePath, source);
}

console.log(`Repaired ${targets.length} canonical W8/W9 promotion packages.`);
