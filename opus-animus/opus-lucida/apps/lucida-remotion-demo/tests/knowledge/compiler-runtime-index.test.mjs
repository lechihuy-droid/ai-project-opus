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
  "style-pattern-index.json",
  "manifest.json",
];
const COMPILE_SCRIPT = path.join(APP_ROOT, "scripts/knowledge/compile.mjs");
const VALIDATE_INDEX_SCRIPT = path.join(APP_ROOT, "scripts/knowledge/validate-index.mjs");
const VALIDATE_SCRIPT = path.join(APP_ROOT, "scripts/knowledge/validate.mjs");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => fs.writeFileSync(filePath, stableJson(value), "utf8");
const outputOf = (result) => `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

const trySymlink = (target, linkPath, type) => {
  try {
    fs.symlinkSync(target, linkPath, type);
    return true;
  } catch (error) {
    if (process.platform === "win32" && error?.code === "EPERM") return false;
    throw error;
  }
};

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
    path.join(APP_ROOT, "design/knowledge/reference-approvals"),
    path.join(root, "design/knowledge/reference-approvals"),
  );
  copy(
    path.join(APP_ROOT, "design/visual-library/styles/cinematic-type"),
    path.join(root, "design/visual-library/styles/cinematic-type"),
  );
  copy(path.join(APP_ROOT, "src/templates"), path.join(root, "src/templates"));
  copy(path.join(APP_ROOT, "src/template-registry-map.json"), path.join(root, "src/template-registry-map.json"));
  copy(path.join(APP_ROOT, "src/templateRegistry.tsx"), path.join(root, "src/templateRegistry.tsx"));
  copy(path.join(APP_ROOT, "src/styles/runtime/packages.ts"), path.join(root, "src/styles/runtime/packages.ts"));
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

const installEligibleStylePackage = (root, {
  packageId = "technical-editorial",
  variantId = "terra-editorial-approved",
  patternId = "terra-editorial-layout",
  marker = "",
} = {}) => {
  const packageDir = path.join(root, "design/visual-library/styles", packageId);
  copy(path.join(APP_ROOT, "pipeline/fixtures/styles/package-valid/technical-editorial"), packageDir);
  const packagePath = path.join(packageDir, "style-package.json");
  const stylePackage = readJson(packagePath);
  stylePackage.id = packageId;
  stylePackage.sourceReferences = [{
    id: "w8-timeline-national-archives",
    url: `https://catalog.archives.gov/${marker}`,
    selectedConcepts: [`source-metadata-${marker}`],
  }];
  writeJson(packagePath, stylePackage);

  const variant = {
    schemaVersion: "lucida-style-variant/v1",
    variantId,
    packageId,
    label: "Terra Editorial Approved",
    description: "Readable editorial composition for a deterministic technical walkthrough.",
    intentTags: ["explain"],
    beatRoles: ["explain"],
    contentDensity: "balanced",
    aspectRatios: ["9:16"],
    layoutTraits: ["single-column"],
    typographyTraits: ["sans-primary"],
    paletteTraits: ["neutral-surface"],
    motionTraits: ["fade"],
    componentTraits: ["content-block"],
    contentCapacity: { headlineChars: 42, bodyChars: 120 },
    positiveUseCases: ["technical walkthrough"],
    antiPatterns: ["dense financial tables"],
    sourceEvidenceIds: ["w8-timeline-national-archives"],
    classificationReasons: [`classification-metadata-${marker}`],
    classifierVersion: "style-rag/1",
    reviewStatus: "approved",
  };
  const pattern = {
    ...variant,
    schemaVersion: "lucida-visual-pattern/v1",
    patternId,
    variantIds: [variantId],
    patternType: "layout",
  };
  delete pattern.variantId;
  delete pattern.label;
  delete pattern.description;
  writeJson(path.join(packageDir, "variants.json"), [variant]);
  writeJson(path.join(packageDir, "visual-patterns.json"), [pattern]);
  return { packageDir, pattern, variant };
};

test("knowledge compile is byte-identical across two runs for the generated artifact set of 7", () => {
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

test("style-pattern compile projects only approved, evidence-backed, renderer-supported records and rejects stale output", () => {
  withCompilerRoot((root) => {
    const packageDir = path.join(root, "design/visual-library/styles/technical-editorial");
    copy(
      path.join(APP_ROOT, "pipeline/fixtures/styles/package-valid/technical-editorial"),
      packageDir,
    );
    const packagePath = path.join(packageDir, "style-package.json");
    const stylePackage = readJson(packagePath);
    stylePackage.sourceReferences = [{
      id: "w8-timeline-national-archives",
      url: "https://catalog.archives.gov/",
      selectedConcepts: ["evidence-backed patterns"],
    }];
    writeJson(packagePath, stylePackage);

    const variant = {
      schemaVersion: "lucida-style-variant/v1",
      variantId: "terra-editorial-approved",
      packageId: "technical-editorial",
      label: "Terra Editorial Approved",
      description: "Readable editorial composition for a deterministic technical walkthrough.",
      intentTags: ["explain"],
      beatRoles: ["explain"],
      contentDensity: "balanced",
      aspectRatios: ["9:16"],
      layoutTraits: ["single-column"],
      typographyTraits: ["sans-primary"],
      paletteTraits: ["neutral-surface"],
      motionTraits: ["fade"],
      componentTraits: ["content-block"],
      contentCapacity: { headlineChars: 42, bodyChars: 120 },
      positiveUseCases: ["technical walkthrough"],
      antiPatterns: ["dense financial tables"],
      sourceEvidenceIds: ["w8-timeline-national-archives"],
      classificationReasons: ["Approved visual source supports a readable editorial hierarchy."],
      classifierVersion: "style-rag/1",
      reviewStatus: "approved",
    };
    const pattern = {
      ...variant,
      schemaVersion: "lucida-visual-pattern/v1",
      patternId: "terra-editorial-layout",
      variantIds: [variant.variantId],
      patternType: "layout",
    };
    delete pattern.variantId;
    delete pattern.label;
    delete pattern.description;
    writeJson(path.join(packageDir, "variants.json"), [variant, { ...variant, variantId: "terra-editorial-proposed", reviewStatus: "proposed" }]);
    writeJson(path.join(packageDir, "visual-patterns.json"), [
      pattern,
      { ...pattern, patternId: "terra-editorial-proposed", reviewStatus: "proposed" },
      { ...pattern, patternId: "terra-editorial-unlinked", variantIds: ["unknown-variant"] },
    ]);

    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const styleIndexPath = path.join(root, ".generated/knowledge/style-pattern-index.json");
    const styleIndex = readJson(styleIndexPath);
    assert.deepEqual(styleIndex.counts, { packages: 2, variants: 1, patterns: 1 });
    assert.deepEqual(styleIndex.variants.map((entry) => entry.variantId), ["terra-editorial-approved"]);
    assert.deepEqual(styleIndex.patterns.map((entry) => entry.patternId), ["terra-editorial-layout"]);
    const validateResult = run(VALIDATE_INDEX_SCRIPT, root);
    assert.equal(validateResult.status, 0, outputOf(validateResult));

    const stale = readJson(styleIndexPath);
    stale.patterns[0].label = "Tampered style pattern";
    writeJson(styleIndexPath, stale);
    assertFailure(
      run(VALIDATE_INDEX_SCRIPT, root),
      /Style pattern index is stale|Manifest hash mismatch for style-pattern-index\.json\./,
      "style pattern tamper",
    );

    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    fs.rmSync(styleIndexPath);
    assertFailure(run(VALIDATE_INDEX_SCRIPT, root), /Missing generated index: .generated\/knowledge\/style-pattern-index\.json/, "style pattern missing");
  });
});

test("style-pattern index keeps manifest counts and hashes authoritative and excludes source metadata", () => {
  withCompilerRoot((root) => {
    installEligibleStylePackage(root, { marker: "FACTUAL_RAW_SOURCE_TEXT_DO_NOT_INDEX" });
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);

    const knowledgeDir = path.join(root, ".generated/knowledge");
    const styleIndexPath = path.join(knowledgeDir, "style-pattern-index.json");
    const index = readJson(styleIndexPath);
    const serialized = stableJson(index);
    assert.doesNotMatch(serialized, /FACTUAL_RAW_SOURCE_TEXT_DO_NOT_INDEX/);
    for (const entry of [...index.variants, ...index.patterns]) {
      assert.equal(Object.hasOwn(entry, "sourceEvidenceIds"), false);
      assert.equal(Object.hasOwn(entry, "classificationReasons"), false);
      assert.equal(Object.hasOwn(entry, "classifierVersion"), false);
      assert.equal(Object.hasOwn(entry, "reviewStatus"), false);
    }

    const manifestPath = path.join(knowledgeDir, "manifest.json");
    const manifest = readJson(manifestPath);
    manifest.counts.stylePatterns += 1;
    const countTamper = { ...manifest };
    delete countTamper.manifestHash;
    manifest.manifestHash = sha256(stableJson(countTamper));
    writeJson(manifestPath, manifest);
    assertFailure(
      run(VALIDATE_INDEX_SCRIPT, root),
      /Manifest stylePatterns count does not match style pattern index\./,
      "style pattern manifest count",
    );

    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const hashManifest = readJson(manifestPath);
    hashManifest.artifactHashes["style-pattern-index.json"] = "0".repeat(64);
    const hashTamper = { ...hashManifest };
    delete hashTamper.manifestHash;
    hashManifest.manifestHash = sha256(stableJson(hashTamper));
    writeJson(manifestPath, hashManifest);
    assertFailure(
      run(VALIDATE_INDEX_SCRIPT, root),
      /Manifest hash mismatch for style-pattern-index\.json\./,
      "style pattern manifest hash",
    );
  });
});

test("style-pattern compiler rejects package variant duplicates and global pattern duplicates", () => {
  withCompilerRoot((root) => {
    const { packageDir, variant } = installEligibleStylePackage(root);
    writeJson(path.join(packageDir, "variants.json"), [variant, { ...variant, reviewStatus: "proposed" }]);
    assertFailure(run(COMPILE_SCRIPT, root), /Duplicate variantId in style package technical-editorial: terra-editorial-approved\./, "package variant ID");
  });

  withCompilerRoot((root) => {
    const { packageDir, pattern } = installEligibleStylePackage(root);
    writeJson(path.join(packageDir, "visual-patterns.json"), [pattern, { ...pattern, reviewStatus: "rejected" }]);
    assertFailure(run(COMPILE_SCRIPT, root), /Duplicate patternId in style package technical-editorial: terra-editorial-layout\./, "package pattern ID");
  });

  withCompilerRoot((root) => {
    installEligibleStylePackage(root);
    installEligibleStylePackage(root, {
      packageId: "minimal-education",
      variantId: "terra-editorial-approved",
      patternId: "minimal-education-layout",
    });
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
  });

  withCompilerRoot((root) => {
    installEligibleStylePackage(root);
    installEligibleStylePackage(root, {
      packageId: "minimal-education",
      variantId: "minimal-education-approved",
      patternId: "terra-editorial-layout",
    });
    assertFailure(
      run(COMPILE_SCRIPT, root),
      /Duplicate patternId across style packages minimal-education and technical-editorial: terra-editorial-layout\./,
      "global pattern ID",
    );
  });
});

test("style-pattern compiler requires registered imports and rejects realpath escapes", async (t) => {
  withCompilerRoot((root) => {
    installEligibleStylePackage(root);
    fs.writeFileSync(
      path.join(root, "src/styles/runtime/packages.ts"),
      "// design/visual-library/styles/technical-editorial/visual.json\nexport const runtimePackageList = [];\n",
      "utf8",
    );
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    assert.deepEqual(readJson(path.join(root, ".generated/knowledge/style-pattern-index.json")).patterns, []);
  });

  const escapeCases = [
    {
      name: "style package directory",
      setup: (root) => {
        const { packageDir } = installEligibleStylePackage(root);
        const outside = path.join(root, "outside-package");
        fs.renameSync(packageDir, outside);
        return trySymlink(outside, packageDir, "junction");
      },
      pattern: /Style package directory .* escapes its owned directory via a symlink or junction\./,
    },
    {
      name: "style package file",
      setup: (root) => {
        const { packageDir } = installEligibleStylePackage(root);
        const outside = path.join(root, "outside-style-package.json");
        copy(path.join(packageDir, "style-package.json"), outside);
        fs.rmSync(path.join(packageDir, "style-package.json"));
        return trySymlink(outside, path.join(packageDir, "style-package.json"), "file");
      },
      pattern: /Style package file .* escapes its owned directory via a symlink or junction\./,
    },
    {
      name: "variants file",
      setup: (root) => {
        const { packageDir } = installEligibleStylePackage(root);
        const outside = path.join(root, "outside-variants.json");
        copy(path.join(packageDir, "variants.json"), outside);
        fs.rmSync(path.join(packageDir, "variants.json"));
        return trySymlink(outside, path.join(packageDir, "variants.json"), "file");
      },
      pattern: /Style variants file .* escapes its owned directory via a symlink or junction\./,
    },
    {
      name: "patterns file",
      setup: (root) => {
        const { packageDir } = installEligibleStylePackage(root);
        const outside = path.join(root, "outside-patterns.json");
        copy(path.join(packageDir, "visual-patterns.json"), outside);
        fs.rmSync(path.join(packageDir, "visual-patterns.json"));
        return trySymlink(outside, path.join(packageDir, "visual-patterns.json"), "file");
      },
      pattern: /Style patterns file .* escapes its owned directory via a symlink or junction\./,
    },
  ];

  for (const escapeCase of escapeCases) {
    await t.test(escapeCase.name, (subtest) => {
      withCompilerRoot((root) => {
        if (!escapeCase.setup(root)) {
          subtest.skip("Windows denied the required file symlink with EPERM.");
          return;
        }
        assertFailure(run(COMPILE_SCRIPT, root), escapeCase.pattern, escapeCase.name);
      });
    });
  }
});

test("style-pattern compiler resolves explicit refs and leaves draft packages without patterns out of retrieval", () => {
  withCompilerRoot((root) => {
    const { packageDir, pattern, variant } = installEligibleStylePackage(root);
    const packagePath = path.join(packageDir, "style-package.json");
    const stylePackage = readJson(packagePath);
    stylePackage.variantRefs = Array.from({ length: 4 }, (_, index) => `./variants/variant-${index + 1}.json`);
    stylePackage.visualPatternRefs = Array.from({ length: 20 }, (_, index) => `./patterns/pattern-${index + 1}.json`);
    writeJson(packagePath, stylePackage);
    fs.mkdirSync(path.join(packageDir, "variants"), { recursive: true });
    fs.mkdirSync(path.join(packageDir, "patterns"), { recursive: true });
    for (let index = 1; index <= 4; index += 1) {
      writeJson(path.join(packageDir, "variants", `variant-${index}.json`), {
        ...variant,
        variantId: `variant-${index}`,
      });
    }
    for (let index = 1; index <= 20; index += 1) {
      writeJson(path.join(packageDir, "patterns", `pattern-${index}.json`), {
        ...pattern,
        patternId: `pattern-${index}`,
        variantIds: ["variant-1"],
      });
    }
    fs.writeFileSync(path.join(packageDir, "variants.json"), "not json", "utf8");
    fs.writeFileSync(path.join(packageDir, "visual-patterns.json"), "not json", "utf8");

    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const index = readJson(path.join(root, ".generated/knowledge/style-pattern-index.json"));
    assert.deepEqual(index.counts, { packages: 2, variants: 4, patterns: 20 });
    const technicalEditorial = index.packages.find((pkg) => pkg.id === "technical-editorial");
    assert.ok(technicalEditorial);
    const explicitVariantPaths = [
      "design/visual-library/styles/technical-editorial/variants/variant-1.json",
      "design/visual-library/styles/technical-editorial/variants/variant-2.json",
      "design/visual-library/styles/technical-editorial/variants/variant-3.json",
      "design/visual-library/styles/technical-editorial/variants/variant-4.json",
    ];
    const explicitPatternPaths = Array.from(
      { length: 20 },
      (_, index) => `design/visual-library/styles/technical-editorial/patterns/pattern-${index + 1}.json`,
    );
    assert.deepEqual(technicalEditorial.paths.variants, explicitVariantPaths);
    assert.deepEqual(
      technicalEditorial.sourceHashes,
      Object.fromEntries(
        [...explicitVariantPaths, ...explicitPatternPaths].map((recordPath) => [
          recordPath,
          sha256File(path.join(root, recordPath)),
        ]),
      ),
    );
  });

  withCompilerRoot((root) => {
    copy(
      path.join(APP_ROOT, "design/visual-library/styles/code-walkthrough"),
      path.join(root, "design/visual-library/styles/code-walkthrough"),
    );
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    const index = readJson(path.join(root, ".generated/knowledge/style-pattern-index.json"));
    assert.equal(index.patterns.some((pattern) => pattern.packageId === "code-walkthrough"), false);
  });
});

test("style-pattern compiler ignores renderer-like text and rejects explicit ref realpath escapes", () => {
  withCompilerRoot((root) => {
    installEligibleStylePackage(root);
    fs.writeFileSync(
      path.join(root, "src/styles/runtime/packages.ts"),
      [
        "import visual from '../../../design/visual-library/styles/technical-editorial/visual.json';",
        "// definePackage(visual)",
        "const example = 'definePackage(visual)';",
        "void visual;",
      ].join("\n"),
      "utf8",
    );
    assert.equal(run(COMPILE_SCRIPT, root).status, 0);
    assert.deepEqual(readJson(path.join(root, ".generated/knowledge/style-pattern-index.json")).patterns, []);
  });

  withCompilerRoot((root) => {
    const { packageDir } = installEligibleStylePackage(root);
    const packagePath = path.join(packageDir, "style-package.json");
    const stylePackage = readJson(packagePath);
    stylePackage.variantRefs = ["./variants/variant-1.json", "./variants/variant-2.json", "./variants/variant-3.json", "./variants/linked/variant-4.json"];
    stylePackage.visualPatternRefs = Array.from({ length: 20 }, (_, index) => `./patterns/pattern-${index + 1}.json`);
    writeJson(packagePath, stylePackage);
    fs.mkdirSync(path.join(packageDir, "variants"), { recursive: true });
    fs.mkdirSync(path.join(packageDir, "patterns"), { recursive: true });
    const variant = readJson(path.join(packageDir, "variants.json"))[0];
    const pattern = readJson(path.join(packageDir, "visual-patterns.json"))[0];
    for (let index = 1; index <= 3; index += 1) {
      writeJson(path.join(packageDir, "variants", `variant-${index}.json`), {
        ...variant,
        variantId: `variant-${index}`,
      });
    }
    for (let index = 1; index <= 20; index += 1) {
      writeJson(path.join(packageDir, "patterns", `pattern-${index}.json`), {
        ...pattern,
        patternId: `pattern-${index}`,
        variantIds: ["variant-1"],
      });
    }
    const outsideDir = path.join(root, "outside-variants");
    fs.mkdirSync(outsideDir, { recursive: true });
    writeJson(path.join(outsideDir, "variant-4.json"), {...variant, variantId: "variant-4"});
    fs.symlinkSync(outsideDir, path.join(packageDir, "variants", "linked"), "junction");

    assertFailure(
      run(COMPILE_SCRIPT, root),
      /Style variants file ref variantRefs\[3\] escapes its owned directory via a symlink or junction\./,
      "explicit variant ref realpath escape",
    );
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
