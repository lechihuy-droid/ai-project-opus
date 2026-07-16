import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import test from "node:test";

import { chunkStructuralV1, compileReferences } from "../../scripts/knowledge/compile-references.mjs";
import { promoteReference } from "../../scripts/knowledge/promote-reference.mjs";
import { sha256, sha256File, stableJson } from "../../scripts/knowledge/index-utils.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CHECKSUM = "a".repeat(64);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, stableJson(value), "utf8");
};
const copy = (source, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const createRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-reference-wave4-"));
  copy(path.join(APP_ROOT, "design/schemas"), path.join(root, "design/schemas"));
  copy(
    path.join(APP_ROOT, "design/knowledge/reference-library"),
    path.join(root, "design/knowledge/reference-library"),
  );
  copy(
    path.join(APP_ROOT, "design/knowledge/reference-approvals"),
    path.join(root, "design/knowledge/reference-approvals"),
  );
  return root;
};

const withRoot = (callback) => {
  const root = createRoot();
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const schemaValidators = () => {
  const ajv = new Ajv({ allErrors: true, strict: true });
  return {
    source: ajv.compile(readJson(path.join(APP_ROOT, "design/schemas/reference-source.schema.json"))),
    document: ajv.compile(readJson(path.join(APP_ROOT, "design/schemas/reference-document.schema.json"))),
  };
};

const referencePackages = (root) => {
  const library = path.join(root, "design/knowledge/reference-library");
  return fs.readdirSync(library, { withFileTypes: true })
    .filter((type) => type.isDirectory())
    .flatMap((type) => fs.readdirSync(path.join(library, type.name), { withFileTypes: true })
      .filter((pkg) => pkg.isDirectory())
      .map((pkg) => ({ type: type.name, path: path.join(library, type.name, pkg.name) })));
};

const sanitizedArtifact = ({ sourceType = "repository", sourceId = "collector:fixture", text = "Approved reference evidence." } = {}) => {
  const collectorVersion = `${sourceType}-collector/1`;
  return {
    schemaVersion: "sanitized-visual-input/v1",
    projectId: "wave-4-fixture",
    sanitization: { status: "passed", redactions: 0, findings: [] },
    approval: { status: "approved", approvedBy: "Wave 4 reviewer", approvedAt: "2026-07-14" },
    sources: [{
      sourceId,
      sourceType,
      domain: "visual-style",
      sourceRevision: `${sourceType}-revision-1`,
      checksum: CHECKSUM,
      collectorVersion,
      metadata: { url: `${sourceType}://fixture/${sourceId}` },
      rights: { status: "approved", policy: "internal-fixture", evidence: "Project-owned test fixture." },
      records: [{
        kind: "layout_reference",
        text,
        data: { tags: ["fixture", sourceType] },
        provenance: {
          sourceChecksum: `sha256:${CHECKSUM}`,
          collectorVersion,
          sourceRef: `${sourceType}://fixture/${sourceId}#record-1`,
        },
      }],
    }],
  };
};

const promoteFixture = (root, artifact, name) => {
  const inputPath = path.join("pipeline", "runs", `${name}.json`);
  writeJson(path.join(root, inputPath), artifact);
  return promoteReference({
    appRoot: root,
    inputPath,
    sourceId: artifact.sources[0].sourceId,
    packageId: name,
  });
};

test("canonical reference packages validate schemas and cover repository/web/image/theme", () => {
  withRoot((root) => {
    const validators = schemaValidators();
    const packages = referencePackages(root);
    assert.deepEqual(new Set(packages.map((pkg) => pkg.type)), new Set(["repository", "web", "image", "theme"]));

    for (const pkg of packages) {
      const sourcePath = path.join(pkg.path, "source.json");
      const source = readJson(sourcePath);
      assert.equal(validators.source(source), true, `${sourcePath}: ${JSON.stringify(validators.source.errors)}`);
      for (const entry of fs.readdirSync(path.join(pkg.path, "documents"))) {
        const documentPath = path.join(pkg.path, "documents", entry);
        const document = readJson(documentPath);
        assert.equal(validators.document(document), true, `${documentPath}: ${JSON.stringify(validators.document.errors)}`);
        assert.equal(document.mediaType, pkg.type);
      }
    }

    const index = compileReferences({ appRoot: root });
    assert.equal(index.schemaVersion, "lucida-reference-index/v1");
    assert.equal(index.chunkerVersion, "structural-v1");
    assert.deepEqual(index.counts, {
      sources: index.sources.length,
      documents: index.documents.length,
      chunks: index.chunks.length,
    });
  });
});

test("all canonical source provenance checksums match project-owned approval files", () => {
  withRoot((root) => {
    const approvalRoot = path.join(root, "design/knowledge/reference-approvals");
    const packages = referencePackages(root);
    assert.ok(packages.length >= 4);
    for (const pkg of packages) {
      const sourcePath = path.join(pkg.path, "source.json");
      const source = readJson(sourcePath);
      const artifactPath = path.resolve(root, source.provenance.collectorArtifact);
      const relativeToApprovalRoot = path.relative(approvalRoot, artifactPath);

      assert.ok(relativeToApprovalRoot && !relativeToApprovalRoot.startsWith("..") && !path.isAbsolute(relativeToApprovalRoot));
      assert.equal(fs.existsSync(artifactPath), true, sourcePath);
      assert.equal(sha256File(artifactPath), source.provenance.sanitizedArtifactChecksum, sourcePath);
    }
  });
});

test("reference compilation rejects tampered approval bytes and source provenance checksum drift", () => {
  withRoot((root) => {
    const artifactPath = path.join(root, "design/knowledge/reference-approvals/repository/fixture-terminal-repo.sanitized-approved.json");
    fs.appendFileSync(artifactPath, "tampered approval bytes", "utf8");
    assert.throws(
      () => compileReferences({ appRoot: root }),
      /sanitizedArtifactChecksum does not match collectorArtifact/,
      "approval artifact byte tamper",
    );
  });

  withRoot((root) => {
    const sourcePath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo/source.json");
    const source = readJson(sourcePath);
    source.provenance.sanitizedArtifactChecksum = "0".repeat(64);
    writeJson(sourcePath, source);
    assert.throws(
      () => compileReferences({ appRoot: root }),
      /sanitizedArtifactChecksum does not match collectorArtifact/,
      "source provenance checksum drift",
    );
  });

  withRoot((root) => {
    const sourcePath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo/source.json");
    const source = readJson(sourcePath);
    source.snapshotChecksum = "0".repeat(64);
    writeJson(sourcePath, source);
    assert.throws(
      () => compileReferences({ appRoot: root }),
      /collectorArtifact checksum does not match canonical snapshotChecksum/,
      "source snapshot checksum drift",
    );
  });
});

test("reference compilation rejects approval artifact path escape and raw pipeline paths", () => {
  const cases = [
    { name: "path escape", collectorArtifact: "../../outside-approved.json" },
    { name: "raw pipeline artifact", collectorArtifact: "pipeline/runs/raw.json" },
  ];

  for (const item of cases) {
    withRoot((root) => {
      const sourcePath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo/source.json");
      const source = readJson(sourcePath);
      if (item.name === "raw pipeline artifact") {
        writeJson(
          path.join(root, "pipeline/runs/raw.json"),
          readJson(path.join(root, source.provenance.collectorArtifact)),
        );
      }
      source.provenance.collectorArtifact = item.collectorArtifact;
      writeJson(sourcePath, source);
      assert.throws(
        () => compileReferences({ appRoot: root }),
        /collectorArtifact must be design\/knowledge\/reference-approvals\/repository\/fixture-terminal-repo\.sanitized-approved\.json/,
        item.name,
      );
    });
  }
});

test("reference compilation rejects every canonical approval and record provenance inconsistency with a precise reason", () => {
  const cases = [
    {
      name: "approval",
      mutate: (artifact) => { artifact.approval.status = "rejected"; },
      error: /collectorArtifact approval does not match canonical approval/,
    },
    {
      name: "schema",
      mutate: (artifact) => { artifact.schemaVersion = "raw-visual-input/v1"; },
      error: /collectorArtifact must use sanitized-visual-input\/v1/,
    },
    {
      name: "sanitization",
      mutate: (artifact) => { artifact.sanitization.status = "failed"; },
      error: /collectorArtifact sanitization must have passed/,
    },
    {
      name: "sourceId",
      mutate: (artifact) => { artifact.sources[0].sourceId = "source:tampered"; },
      error: /collectorArtifact sourceId does not match canonical sourceId/,
    },
    {
      name: "sourceType",
      mutate: (artifact) => { artifact.sources[0].sourceType = "web_reference"; },
      error: /collectorArtifact sourceType does not match canonical sourceType/,
    },
    {
      name: "collectorVersion",
      mutate: (artifact) => { artifact.sources[0].collectorVersion = "tampered-collector\/2"; },
      error: /collectorArtifact collectorVersion does not match canonical source/,
    },
    {
      name: "revision",
      mutate: (artifact) => { artifact.sources[0].sourceRevision = "tampered-revision"; },
      error: /collectorArtifact sourceRevision does not match canonical source/,
    },
    {
      name: "snapshot checksum",
      mutate: (artifact) => { artifact.sources[0].checksum = "0".repeat(64); },
      error: /collectorArtifact checksum does not match canonical snapshotChecksum/,
    },
    {
      name: "rights",
      mutate: (artifact) => { artifact.sources[0].rights.policy = "external"; },
      error: /collectorArtifact rights do not match canonical rights/,
    },
    {
      name: "sourceRef",
      mutate: (artifact) => { artifact.sources[0].metadata.url = "pipeline/runs/raw.json"; },
      error: /collectorArtifact sourceRef does not match canonical sourceRef/,
    },
    {
      name: "record text",
      mutate: (artifact) => { artifact.sources[0].records[0].text = "Tampered record text."; },
      error: /collectorArtifact record text does not match canonical document/,
    },
  ];

  for (const item of cases) {
    withRoot((root) => {
      const packagePath = path.join(root, "design/knowledge/reference-library/repository/fixture-terminal-repo");
      const sourcePath = path.join(packagePath, "source.json");
      const artifactPath = path.join(root, "design/knowledge/reference-approvals/repository/fixture-terminal-repo.sanitized-approved.json");
      const artifact = readJson(artifactPath);
      item.mutate(artifact);
      writeJson(artifactPath, artifact);

      const source = readJson(sourcePath);
      source.provenance.sanitizedArtifactChecksum = sha256File(artifactPath);
      writeJson(sourcePath, source);

      assert.throws(() => compileReferences({ appRoot: root }), item.error, item.name);
    });
  }
});

test("promotion rejects unsafe or incomplete evidence through the Wave 4 matrix", () => {
  const cases = [
    {
      name: "unsanitized",
      mutate: (artifact) => { artifact.schemaVersion = "raw-visual-input/v1"; },
      error: /sanitized-visual-input\/v1/,
    },
    {
      name: "unreviewed",
      mutate: (artifact) => { delete artifact.approval; },
      error: /explicit root approval/,
    },
    {
      name: "rejected",
      mutate: (artifact) => { artifact.approval.status = "rejected"; },
      error: /explicit root approval/,
    },
    {
      name: "missing-rights-policy",
      mutate: (artifact) => { delete artifact.sources[0].rights.policy; },
      error: /approved rights with policy and evidence/,
    },
    {
      name: "checksum-mismatch",
      mutate: (artifact) => { artifact.sources[0].checksum = "not-a-sha256-checksum"; },
      error: /source\.checksum must be a SHA-256 checksum/,
    },
    {
      name: "missing-collector-version",
      mutate: (artifact) => { delete artifact.sources[0].collectorVersion; },
      error: /source\.collectorVersion/,
    },
    {
      name: "missing-source-revision",
      mutate: (artifact) => { delete artifact.sources[0].sourceRevision; },
      error: /immutable source\.sourceRevision/,
    },
  ];

  withRoot((root) => {
    for (const item of cases) {
      const artifact = sanitizedArtifact({ sourceId: `collector:${item.name}` });
      item.mutate(artifact);
      assert.throws(() => promoteFixture(root, artifact, `rejected-${item.name}`), item.error, item.name);
      assert.equal(
        fs.existsSync(path.join(root, "design/knowledge/reference-library/repository", `rejected-${item.name}`)),
        false,
        `${item.name} must not create a canonical package`,
      );
    }

    const raw = sanitizedArtifact({ sourceId: "collector:raw-pipeline" });
    raw.schemaVersion = "raw-visual-input/v1";
    writeJson(path.join(root, "pipeline/runs/raw-pipeline-artifact.json"), raw);
    assert.throws(
      () => promoteReference({
        appRoot: root,
        inputPath: "pipeline/runs/raw-pipeline-artifact.json",
        sourceId: "collector:raw-pipeline",
        packageId: "raw-pipeline-artifact",
      }),
      /sanitized-visual-input\/v1/,
      "raw pipeline artifact",
    );
  });
});

test("successful promotion emits schema-valid canonical packages for all four reference types", () => {
  const cases = [
    ["repository", "repository-promoted"],
    ["web_reference", "web-promoted"],
    ["image_reference", "image-promoted"],
    ["theme_reference", "theme-promoted"],
  ];

  withRoot((root) => {
    const validators = schemaValidators();
    const initialPackageCount = referencePackages(root).length;
    for (const [sourceType, packageId] of cases) {
      const artifact = sanitizedArtifact({ sourceType, sourceId: `collector:${packageId}`, text: `Approved ${sourceType} evidence.` });
      const result = promoteFixture(root, artifact, packageId);
      const packagePath = path.join(root, "design/knowledge/reference-library", result.packagePath.split("/").slice(3).join(path.sep));
      const source = readJson(path.join(packagePath, "source.json"));
      assert.equal(validators.source(source), true, `${sourceType}: ${JSON.stringify(validators.source.errors)}`);
      assert.equal(source.sourceType, sourceType.replace("_reference", ""));
      const document = readJson(path.join(packagePath, "documents/0001.json"));
      assert.equal(validators.document(document), true, `${sourceType}: ${JSON.stringify(validators.document.errors)}`);
      assert.equal(document.contentChecksum, sha256(document.rawText));
    }

    const index = compileReferences({ appRoot: root });
    assert.equal(index.sources.length, initialPackageCount + 4);
    assert.deepEqual(new Set(index.sources.map((source) => source.sourceType)), new Set(["repository", "web", "image", "theme"]));
  });
});

test("reference compilation rejects a canonical document checksum mismatch", () => {
  withRoot((root) => {
    const documentPath = path.join(
      root,
      "design/knowledge/reference-library/repository/fixture-terminal-repo/documents/overview.json",
    );
    const document = readJson(documentPath);
    document.rawText = `${document.rawText} tampered`;
    writeJson(documentPath, document);
    assert.throws(
      () => compileReferences({ appRoot: root }),
      /contentChecksum does not match rawText/,
    );
  });
});

test("source, snapshot, document, and chunk IDs remain stable and structural-v1 is deterministic", () => {
  withRoot((root) => {
    const first = compileReferences({ appRoot: root });
    const second = compileReferences({ appRoot: root });
    assert.deepEqual(second, first);

    for (const source of first.sources) {
      assert.equal(source.snapshotId, `snapshot:${source.sourceId}:${source.snapshotChecksum.slice(0, 16)}`);
    }
    for (const document of first.documents) {
      const source = first.sources.find((candidate) => candidate.snapshotId === document.snapshotId);
      assert.equal(document.documentId, `doc:${source.snapshotChecksum.slice(0, 16)}:${sha256(document.sourceRef).slice(0, 16)}`);
    }
    for (const chunk of first.chunks) {
      assert.equal(
        chunk.chunkId,
        `chunk:${sha256(chunk.documentId).slice(0, 16)}:${String(chunk.ordinal).padStart(4, "0")}:${chunk.contentHash.slice(0, 12)}`,
      );
    }
  });
});

test("structural-v1 has no overlap, a 1600-grapheme hard cap, and grapheme-safe boundaries", () => {
  const sourceGraphemes = Array.from({ length: 4200 }, (_, index) => (index % 2 === 0 ? "a\u0301" : "😀"));
  const source = sourceGraphemes.join("");
  const chunks = chunkStructuralV1(source);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const segment = (value) => [...segmenter.segment(value)].map((part) => part.segment);
  const chunkGraphemes = chunks.flatMap(segment);
  const normalizedGraphemes = segment(source.normalize("NFC"));

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => segment(chunk).length <= 1600));
  assert.deepEqual(chunkGraphemes, normalizedGraphemes, "chunk boundaries must neither overlap nor drop graphemes");
  assert.equal(chunks.join(""), source.normalize("NFC"));
  assert.ok(chunks.flatMap((chunk) => [...chunk]).every((codePoint) => codePoint.length !== 1 || !/[\uD800-\uDFFF]/u.test(codePoint)));
});
