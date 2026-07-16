import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { mapVisualScenes } from "../../pipeline/mappers/map-scenes.mjs";
import { selectVisualKnowledge } from "../../pipeline/retrieval/select-visual-knowledge.mjs";
import { approveReference } from "../../scripts/knowledge/approve-reference.mjs";
import { buildSqliteProjection } from "../../scripts/knowledge/build-sqlite.mjs";
import { sha256, writeStableJson } from "../../scripts/knowledge/index-utils.mjs";
import { promoteReference } from "../../scripts/knowledge/promote-reference.mjs";
import { createSqliteRepository } from "../../scripts/knowledge/repositories/sqlite-repository.mjs";

const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const temporaryRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), "lucida-visual-rag-"));

test("explicit approval promotes one sanitized collector source", () => {
  const root = temporaryRoot();
  try {
    const text = "Terminal dashboard reference";
    const checksum = sha256(text);
    const input = path.join(root, "02-sanitized-input.json");
    writeStableJson(input, {
      schemaVersion: "sanitized-visual-input/v1",
      sanitization: { status: "passed", findings: [], redactions: 0 },
      sources: [{
        sourceId: "repo-terminal",
        sourceType: "repository",
        domain: "visual-style",
        collectorVersion: "repository-collector/1",
        checksum: `sha256:${checksum}`,
        metadata: { url: "https://example.com/terminal" },
        records: [{
          kind: "repository_summary",
          text,
          data: { family: "terminal", tags: ["terminal"] },
          provenance: {
            sourceRef: "https://example.com/terminal",
            sourceChecksum: `sha256:${checksum}`,
            collectorVersion: "repository-collector/1",
          },
        }],
      }],
    });
    const approvedPath = path.join(root, "approved.json");
    approveReference({
      appRoot: root,
      inputPath: input,
      outputPath: approvedPath,
      sourceId: "repo-terminal",
      sourceRevision: "commit:abc123",
      rightsPolicy: "reviewed-link-and-code",
      rightsEvidence: "operator-reviewed-2026-07-16",
      approvedBy: "test-reviewer",
      approvedAt: "2026-07-16T00:00:00.000Z",
    });
    const result = promoteReference({
      appRoot: root,
      inputPath: approvedPath,
      sourceId: "repo-terminal",
      packageId: "terminal-reviewed",
    });
    assert.equal(result.documents, 1);
    assert.ok(fs.existsSync(path.join(root, result.packagePath, "source.json")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("approved RAG evidence can select scene family before mapping", () => {
  const config = {
    fps: 30,
    themeId: "test",
    knowledge: { enabled: true, repository: "json", limit: 2 },
    mapping: {
      allowedFamilies: ["terminal", "editorial"],
      allowedPresets: ["command", "headline-stat-grid"],
      defaultFamily: "editorial",
      defaultPreset: "headline-stat-grid",
      minSceneSeconds: 3,
      maxSceneSeconds: 9,
      maxItemsPerScene: 8,
    },
  };
  const normalized = {
    schemaVersion: "normalized-visual-input/v1",
    projectId: "rag-map",
    events: [{ id: "event-1", kind: "narrative", text: "terminal CSS dashboard", data: {} }],
  };
  const selection = selectVisualKnowledge({ normalized, config, appRoot: APP_ROOT });
  const mapped = mapVisualScenes(normalized, config, selection);
  assert.equal(selection.selections[0].recommendedFamily, "terminal");
  assert.equal(mapped.scenes[0].visualFamily, "terminal");
  assert.ok(mapped.scenes[0].knowledgeEvidence.length > 0);
});

test("SQLite query rejects projection built from a different manifest", () => {
  const root = temporaryRoot();
  try {
    fs.cpSync(path.join(APP_ROOT, ".generated", "knowledge"), path.join(root, ".generated", "knowledge"), { recursive: true });
    fs.cpSync(path.join(APP_ROOT, "design", "storage"), path.join(root, "design", "storage"), { recursive: true });
    fs.cpSync(path.join(APP_ROOT, "design", "template-library"), path.join(root, "design", "template-library"), { recursive: true });
    fs.cpSync(path.join(APP_ROOT, "design", "knowledge"), path.join(root, "design", "knowledge"), { recursive: true });
    fs.cpSync(path.join(APP_ROOT, "design", "visual-library", "styles", "cinematic-type"), path.join(root, "design", "visual-library", "styles", "cinematic-type"), { recursive: true });
    fs.cpSync(path.join(APP_ROOT, "src", "templates"), path.join(root, "src", "templates"), { recursive: true });
    fs.mkdirSync(path.join(root, "src"), { recursive: true });
    fs.copyFileSync(path.join(APP_ROOT, "src", "templateRegistry.tsx"), path.join(root, "src", "templateRegistry.tsx"));
    fs.copyFileSync(path.join(APP_ROOT, "src", "template-registry-map.json"), path.join(root, "src", "template-registry-map.json"));
    buildSqliteProjection({ appRoot: root });
    const repository = createSqliteRepository({ appRoot: root });
    assert.ok(repository.query({ limit: 1, domain: "visual-style" }).results.length > 0);
    const manifestPath = path.join(root, ".generated", "knowledge", "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.manifestHash = "f".repeat(64);
    writeStableJson(manifestPath, manifest);
    assert.throws(
      () => repository.query({ limit: 1, domain: "visual-style" }),
      /SQLite projection is stale for the current generated manifest/,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
