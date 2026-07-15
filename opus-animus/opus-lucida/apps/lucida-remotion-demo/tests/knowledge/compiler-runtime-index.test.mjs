import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  sha256,
  sha256File,
  stableJson,
} from "../../scripts/knowledge/index-utils.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const KNOWLEDGE_DIR = path.join(APP_ROOT, ".generated", "knowledge");
const KNOWLEDGE_FILES = [
  "template-index.json",
  "adapter-index.json",
  "director-index.json",
  "compatibility-index.json",
  "reference-index.json",
  "manifest.json",
];
const COMPILE_SCRIPT = path.join(APP_ROOT, "scripts/knowledge/compile.mjs");
const VALIDATE_INDEX_SCRIPT = path.join(APP_ROOT, "scripts/knowledge/validate-index.mjs");
const VALIDATE_SCRIPT = path.join(APP_ROOT, "scripts/knowledge/validate.mjs");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, stableJson(value), "utf8");
const outputOf = (result) => `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

const run = (script, cwd, args = []) =>
  spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
  });

const copy = (source, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const createCompilerRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-rag-wave2-"));
  copy(path.join(APP_ROOT, "design/schemas"), path.join(root, "design/schemas"));
  copy(path.join(APP_ROOT, "design/template-library"), path.join(root, "design/template-library"));
  copy(
    path.join(APP_ROOT, "design/knowledge/reference-library"),
    path.join(root, "design/knowledge/reference-library"),
  );
  copy(
    path.join(APP_ROOT, "design/visual-library/styles/cinematic-type"),
    path.join(root, "design/visual-library/styles/cinematic-type"),
  );
  copy(path.join(APP_ROOT, "src/templates"), path.join(root, "src/templates"));
  copy(path.join(APP_ROOT, "src/template-registry-map.json"), path.join(root, "src/template-registry-map.json"));
  copy(path.join(APP_ROOT, "src/templateRegistry.tsx"), path.join(root, "src/templateRegistry.tsx"));
  copy(path.join(APP_ROOT, "scripts/knowledge"), path.join(root, "scripts/knowledge"));
  fs.symlinkSync(path.join(APP_ROOT, "node_modules"), path.join(root, "node_modules"), "junction");
  return root;
};

const withCompilerRoot = (callback) => {
  const root = createCompilerRoot();
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const refreshManifest = (root) => {
  const knowledgeDir = path.join(root, ".generated", "knowledge");
  const manifestPath = path.join(knowledgeDir, "manifest.json");
  const manifest = readJson(manifestPath);
  const manifestWithoutHash = { ...manifest };
  delete manifestWithoutHash.manifestHash;
  manifestWithoutHash.artifactHashes = Object.fromEntries(
    KNOWLEDGE_FILES.filter((file) => file !== "manifest.json").map((file) => [
      file,
      sha256File(path.join(knowledgeDir, file)),
    ]),
  );
  writeJson(manifestPath, {
    ...manifestWithoutHash,
    manifestHash: sha256(stableJson(manifestWithoutHash)),
  });
};

const assertFailure = (result, pattern, label) => {
  assert.equal(result.status, 1, `${label}: expected exit 1, got ${result.status}`);
  assert.match(outputOf(result), pattern, label);
};

test("knowledge compile is byte-identical across two runs for the generated artifact set of 6", () => {
  withCompilerRoot((root) => {
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const first = Object.fromEntries(
      KNOWLEDGE_FILES.map((file) => [file, crypto.createHash("sha256").update(fs.readFileSync(path.join(root, ".generated/knowledge", file))).digest("hex")]),
    );

    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const second = Object.fromEntries(
      KNOWLEDGE_FILES.map((file) => [file, crypto.createHash("sha256").update(fs.readFileSync(path.join(root, ".generated/knowledge", file))).digest("hex")]),
    );
    assert.deepEqual(second, first);
    assert.deepEqual(fs.readdirSync(path.join(root, ".generated/knowledge")).sort(), KNOWLEDGE_FILES.sort());
  });
});

test("validate-index passes the canonical generated state and runtime resolves GlitchTextAdapter", () => {
  const result = run(VALIDATE_INDEX_SCRIPT, APP_ROOT);
  assert.equal(result.status, 0, outputOf(result));

  const generated = readJson(path.join(KNOWLEDGE_DIR, "template-index.json"));
  const glitch = generated.templates.find((template) => template.id === "glitch-text");
  assert.equal(glitch?.adapterId, "GlitchTextAdapter");
  assert.equal(Object.prototype.hasOwnProperty.call(readJson(path.join(APP_ROOT, "src/template-registry-map.json")), "glitch-text"), false);
  assert.match(fs.readFileSync(path.join(APP_ROOT, "src/templateRegistry.tsx"), "utf8"), /canonicalTemplateRegistry\[templateId\]/);
  assert.match(fs.readFileSync(path.join(APP_ROOT, "src/templateRegistry.tsx"), "utf8"), /GlitchTextAdapter/);
});

test("tampered source, package, manifest, and generated index fail with precise validation errors", () => {
  withCompilerRoot((root) => {
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);

    const adapterPath = path.join(root, "src/templates/adapters/GlitchTextAdapter.tsx");
    fs.appendFileSync(adapterPath, "\n// tampered source\n", "utf8");
    assertFailure(run(VALIDATE_INDEX_SCRIPT, root), /Adapter source hash mismatch: GlitchTextAdapter\./, "source");
    fs.rmSync(path.join(root, ".generated"), { recursive: true, force: true });
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);

    const templatePath = path.join(root, "design/template-library/glitch-text/template.json");
    const template = readJson(templatePath);
    template.label = "Tampered Glitch Text";
    writeJson(templatePath, template);
    assertFailure(
      run(VALIDATE_INDEX_SCRIPT, root),
      /Template source hash mismatch: glitch-text:design\/template-library\/glitch-text\/template\.json\./,
      "package",
    );
    writeJson(templatePath, readJson(path.join(APP_ROOT, "design/template-library/glitch-text/template.json")));

    const manifestPath = path.join(root, ".generated/knowledge/manifest.json");
    const manifest = readJson(manifestPath);
    manifest.manifestHash = "tampered";
    writeJson(manifestPath, manifest);
    assertFailure(run(VALIDATE_INDEX_SCRIPT, root), /manifest hash mismatch\./, "manifest");
    fs.rmSync(path.join(root, ".generated"), { recursive: true, force: true });
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);

    const templateIndexPath = path.join(root, ".generated/knowledge/template-index.json");
    const templateIndex = readJson(templateIndexPath);
    templateIndex.templates[0].label = "Tampered generated index";
    writeJson(templateIndexPath, templateIndex);
    assertFailure(run(VALIDATE_INDEX_SCRIPT, root), /Manifest hash mismatch for template-index\.json\./, "generated index");

    fs.rmSync(path.join(root, ".generated"), { recursive: true, force: true });
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const referenceIndexPath = path.join(root, ".generated/knowledge/reference-index.json");
    const referenceIndex = readJson(referenceIndexPath);
    referenceIndex.chunks[0].rawText = `${referenceIndex.chunks[0].rawText} tampered`;
    writeJson(referenceIndexPath, referenceIndex);
    assertFailure(run(VALIDATE_INDEX_SCRIPT, root), /Manifest hash mismatch for reference-index\.json\./, "reference index");
  });
});

test("deleted package, duplicate ID, broken adapter relationship, and unsupported generated adapter fail explicitly", () => {
  withCompilerRoot((root) => {
    fs.rmSync(path.join(root, "design/template-library/glitch-text"), { recursive: true, force: true });
    assertFailure(run(COMPILE_SCRIPT, root), /No template packages found under design\/template-library/, "deleted package");
  });

  withCompilerRoot((root) => {
    copy(
      path.join(root, "design/template-library/glitch-text"),
      path.join(root, "design/template-library/glitch-text-duplicate"),
    );
    assertFailure(run(COMPILE_SCRIPT, root), /duplicate template id: glitch-text/, "duplicate ID");
  });

  withCompilerRoot((root) => {
    const templatePath = path.join(root, "design/template-library/glitch-text/template.json");
    const template = readJson(templatePath);
    template.adapter.path = "src/templates/adapters/MissingAdapter.tsx";
    writeJson(templatePath, template);
    assertFailure(run(COMPILE_SCRIPT, root), /adapter\.path: missing project path: src\/templates\/adapters\/MissingAdapter\.tsx/, "broken adapter");
  });

  withCompilerRoot((root) => {
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const adapterIndexPath = path.join(root, ".generated/knowledge/adapter-index.json");
    const adapterIndex = readJson(adapterIndexPath);
    adapterIndex.adapters[0].id = "UnsupportedGeneratedAdapter";
    adapterIndex.adapters[0].export = "UnsupportedGeneratedAdapter";
    writeJson(adapterIndexPath, adapterIndex);
    const templateIndexPath = path.join(root, ".generated/knowledge/template-index.json");
    const templateIndex = readJson(templateIndexPath);
    templateIndex.templates[0].adapterId = "UnsupportedGeneratedAdapter";
    writeJson(templateIndexPath, templateIndex);
    refreshManifest(root);
    assertFailure(
      run(VALIDATE_INDEX_SCRIPT, root),
      /Generated adapter is unsupported by runtime registry: UnsupportedGeneratedAdapter\./,
      "unsupported generated adapter",
    );
  });
});

test("clean generated directory is rebuilt as a complete atomic set with no staging residue", () => {
  withCompilerRoot((root) => {
    const generatedRoot = path.join(root, ".generated");
    fs.rmSync(generatedRoot, { recursive: true, force: true });
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);

    const knowledgeDir = path.join(generatedRoot, "knowledge");
    assert.deepEqual(fs.readdirSync(knowledgeDir).sort(), KNOWLEDGE_FILES.sort());
    assert.equal(fs.readdirSync(generatedRoot).some((name) => name.startsWith(".knowledge-staging-")), false);
    assert.equal(fs.existsSync(`${knowledgeDir}.previous`), false);
    assert.equal(run(VALIDATE_INDEX_SCRIPT, root).status, 0);
  });
});

test("preview props wrapper proves glitch-text input and required Gate A checks pass", () => {
  const fixture = readJson(path.join(APP_ROOT, "pipeline/fixtures/knowledge/glitch-text/long-vietnamese-9x16.json"));
  assert.equal(fixture.scenes[0].templateId, "glitch-text");
  const reportPath = path.join(APP_ROOT, "design/template-library/glitch-text/gate-a-report.json");
  assert.equal(fs.existsSync(reportPath), true, "Gate A report is required after preview");
  const report = readJson(reportPath);
  const preview = report.checks.find((check) => check.id === "deterministic-preview");
  assert.equal(preview?.evidence?.propsShape, "{ videoMap: VideoMap }");
  assert.equal(preview?.evidence?.renderedInputTemplateId, "glitch-text");
  assert.equal(preview?.evidence?.width, 1080);
  assert.equal(preview?.evidence?.height, 1920);
  assert.equal(preview?.evidence?.checksum, preview?.evidence?.secondChecksum);
  assert.equal(preview?.evidence?.nonBlank, true);
  assert.deepEqual(preview?.evidence?.mp4Files, []);
  const requiredCheckIds = new Set([
    "canonical-package",
    "provenance",
    "schema",
    "dedicated-adapter",
    "generated-index",
    "deterministic-preview",
    "no-manual-map",
    "safe-area-pixels",
  ]);
  for (const checkId of requiredCheckIds) {
    assert.ok(report.checks.some((check) => check.id === checkId), `Missing required Gate A check: ${checkId}`);
  }
  assert.ok(report.checks.every((check) => check.status === "passed"));
});
