import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Ajv = require("ajv");
const APP_ROOT = path.resolve(import.meta.dirname, "../..");
const VISUAL_PACKAGE_VALIDATOR = path.join(APP_ROOT, "scripts", "validate-visual-packages.mjs");

const readSchema = (name) =>
  JSON.parse(fs.readFileSync(path.join(APP_ROOT, "design", "schemas", name), "utf8"));

const baseVariant = () => ({
  schemaVersion: "lucida-style-variant/v1",
  variantId: "clean-cli",
  packageId: "terminal-command-center",
  label: "Clean CLI",
  description: "High-contrast command-line scenes for operational walkthroughs.",
  intentTags: ["operations"],
  beatRoles: ["explain"],
  contentDensity: "balanced",
  aspectRatios: ["9:16"],
  layoutTraits: ["single-column"],
  typographyTraits: ["monospace-primary"],
  paletteTraits: ["dark-surface"],
  motionTraits: ["cursor-reveal"],
  componentTraits: ["command-block"],
  contentCapacity: { headlineChars: 42, bodyChars: 120 },
  positiveUseCases: ["agent runtime"],
  antiPatterns: ["dense financial tables"],
  sourceEvidenceIds: ["repo-terminal-css"],
  classificationReasons: ["Source demonstrates readable command hierarchy."],
  classifierVersion: "style-rag/1",
  reviewStatus: "approved",
});

const basePattern = () => {
  const { schemaVersion: _schemaVersion, variantId: _variantId, label: _label, description: _description, ...pattern } = baseVariant();
  return {
  ...pattern,
  schemaVersion: "lucida-visual-pattern/v1",
  patternId: "clean-cli-command-block",
  variantIds: ["clean-cli"],
  patternType: "component",
  };
};

const basePackage = () => ({
  schemaVersion: "lucida-style-package/v1",
  id: "terminal-command-center",
  label: "Terminal Command Center",
  status: "stable",
  description: "Operational command-line visual package for technical runtime content.",
  supportedIntents: ["operations"],
  avoidFor: ["human portraiture"],
  aspectRatios: ["9:16"],
  contentCapacity: { headlineChars: 42, bodyChars: 120 },
  renderCost: { tier: "low", notes: "Uses registered lightweight primitives." },
  reducedMotion: { strategy: "fade", notes: "Replaces cursor motion with fades." },
  accessibility: { contrast: "AA", notes: "Foreground and background meet contrast targets." },
  directorCompatibility: { selectionReason: "Supports operational narration and command sequences." },
  files: {
    visual: "./visual.json",
    tokens: "./tokens.json",
    componentMap: "./component-map.json",
    provenance: "./provenance.md",
    artifactManifest: "./artifact-manifest.json",
  },
  sourceArtifacts: { sourceReviewReport: "./source-review.md" },
  validationArtifacts: {
    previewFrames: ["./frame-1.png", "./frame-2.png", "./frame-3.png"],
    renderReport: "./render-report.json",
  },
  sourceReferences: [{
    id: "terminal-css",
    url: "https://example.com/terminal-css",
    selectedConcepts: ["command hierarchy"],
  }],
  qualityGate: { validated: true, checks: ["schema"] },
});

const schemaAspectRatios = (schema) => schema.properties.aspectRatios?.items?.enum ?? schema.definitions.aspectRatioList.items.enum;

const schemaCapacityFields = (schema) => Object.keys(schema.definitions?.contentCapacity?.properties ?? schema.properties.contentCapacity.properties).sort();

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const createStyleRagValidationRoot = ({ refs = true, renderer = true, canonical = true } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-style-rag-"));
  const packageDir = path.join(root, "design/visual-library/styles/terra-package");
  fs.mkdirSync(path.join(root, "design"), { recursive: true });
  fs.cpSync(path.join(APP_ROOT, "design/schemas"), path.join(root, "design/schemas"), { recursive: true });
  fs.cpSync(
    path.join(APP_ROOT, "pipeline/fixtures/styles/package-valid/technical-editorial"),
    packageDir,
    { recursive: true },
  );

  const pkgPath = path.join(packageDir, "style-package.json");
  const pkg = readJson(pkgPath);
  pkg.id = "terra-package";
  pkg.visualFamily = "terra-package";
  pkg.sourceReferences = [{
    id: "fixture-source",
    url: "https://example.com/fixture-source",
    selectedConcepts: ["cross-artifact validation"],
  }];
  if (refs) {
    pkg.variantRefs = Array.from({ length: 4 }, (_, index) => `./variants/variant-${index + 1}.json`);
    pkg.visualPatternRefs = Array.from({ length: 20 }, (_, index) => `./patterns/pattern-${index + 1}.json`);
  }
  writeJson(pkgPath, pkg);

  const manifestPath = path.join(packageDir, "artifact-manifest.json");
  const manifest = readJson(manifestPath);
  manifest.packageId = "terra-package";
  writeJson(manifestPath, manifest);

  if (refs) {
    for (let index = 1; index <= 4; index += 1) {
      writeJson(path.join(packageDir, "variants", `variant-${index}.json`), {
        ...baseVariant(),
        variantId: `variant-${index}`,
        packageId: "terra-package",
        sourceEvidenceIds: ["fixture-source"],
      });
    }
    for (let index = 1; index <= 20; index += 1) {
      writeJson(path.join(packageDir, "patterns", `pattern-${index}.json`), {
        ...basePattern(),
        patternId: `pattern-${index}`,
        packageId: "terra-package",
        variantIds: ["variant-1"],
        sourceEvidenceIds: ["fixture-source"],
      });
    }
  }

  if (renderer) {
    const registryPath = path.join(root, "src/styles/runtime/packages.ts");
    fs.mkdirSync(path.dirname(registryPath), { recursive: true });
    fs.writeFileSync(
      registryPath,
      [
        "import visual from '../../../design/visual-library/styles/terra-package/visual.json';",
        "const definePackage = (value) => value;",
        "definePackage(visual);",
      ].join("\n"),
      "utf8",
    );
  }
  if (canonical) {
    writeJson(path.join(root, "design/knowledge/reference-library/repository/fixture-source/source.json"), {
      sourceId: "source:reference:fixture-source",
      domain: "visual-style",
      approval: { status: "approved" },
      rights: { status: "approved" },
    });
  }
  return root;
};

const runVisualPackageValidator = (root) => spawnSync(
  process.execPath,
  [VISUAL_PACKAGE_VALIDATOR, "--strict", "--root", "design/visual-library/styles", "--json"],
  { cwd: root, encoding: "utf8" },
);

const withStyleRagValidationRoot = (options, callback) => {
  const root = createStyleRagValidationRoot(options);
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

test("style variant contract rejects invalid IDs, duplicate evidence, unsupported ratios, ranges, and additional properties", () => {
  const validate = new Ajv({ allErrors: true }).compile(readSchema("style-variant.schema.json"));
  assert.equal(validate(baseVariant()), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...baseVariant(), variantId: "Clean_CLI" }), false);
  assert.equal(validate({ ...baseVariant(), sourceEvidenceIds: ["repo-terminal-css", "repo-terminal-css"] }), false);
  assert.equal(validate({ ...baseVariant(), aspectRatios: ["4:3"] }), false);
  assert.equal(validate({ ...baseVariant(), contentCapacity: { headlineChars: -1 } }), false);
  assert.equal(validate({ ...baseVariant(), unsupported: true }), false);
  assert.equal(validate({ ...baseVariant(), reviewStatus: "verified" }), false);
});

test("visual pattern contract rejects invalid IDs, duplicate foreign keys, unsupported ratios, ranges, and additional properties", () => {
  const validate = new Ajv({ allErrors: true }).compile(readSchema("visual-pattern.schema.json"));
  assert.equal(validate(basePattern()), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...basePattern(), patternId: "Clean_CLI" }), false);
  assert.equal(validate({ ...basePattern(), patternType: "illustration" }), false);
  assert.equal(validate({ ...basePattern(), variantIds: ["clean-cli", "clean-cli"] }), false);
  assert.equal(validate({ ...basePattern(), sourceEvidenceIds: ["repo-terminal-css", "repo-terminal-css"] }), false);
  assert.equal(validate({ ...basePattern(), aspectRatios: ["4:3"] }), false);
  assert.equal(validate({ ...basePattern(), contentCapacity: { bodyChars: -1 } }), false);
  assert.equal(validate({ ...basePattern(), unsupported: true }), false);
});

test("visual package rejects duplicate source references, invalid IDs, ranges, and additional properties", () => {
  const schema = readSchema("visual-package.schema.json");
  const validate = new Ajv({ allErrors: true }).compile(schema);
  assert.match(schema.$comment, /validator layer/i);
  assert.equal(validate(basePackage()), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...basePackage(), id: "Terminal_Command_Center" }), false);
  assert.equal(validate({ ...basePackage(), aspectRatios: ["4:3"] }), false);
  assert.equal(validate({ ...basePackage(), contentCapacity: { headlineChars: 42, bodyChars: -1 } }), false);
  assert.equal(validate({ ...basePackage(), renderCost: { tier: "low", notes: "Uses registered lightweight primitives.", estimatedSceneComplexity: 11 } }), false);
  assert.equal(validate({ ...basePackage(), sourceReferences: [basePackage().sourceReferences[0], basePackage().sourceReferences[0]] }), false);
  assert.equal(validate({ ...basePackage(), sourceReferences: [{ ...basePackage().sourceReferences[0], unsupported: true }] }), false);
  assert.equal(validate({ ...basePackage(), unsupported: true }), false);
  assert.equal(validate({ ...basePackage(), validationArtifacts: { previewFrames: ["./frame-1.png", "./frame-2.png"], renderReport: "./render-report.json" } }), false);
  assert.equal(validate({ ...basePackage(), variantRefs: ["./variants/a.json", "./variants/b.json", "./variants/c.json"] }), false);
  assert.equal(validate({ ...basePackage(), variantRefs: ["./variants/a.json", "./variants/b.json", "./variants/c.json", "./variants/d.json"] }), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...basePackage(), variantRefs: ["./variants/a.json", "./variants/b.json", "./variants/c.json", "./variants/d.json", "./variants/e.json", "./variants/f.json", "./variants/g.json", "./variants/h.json", "./variants/i.json"] }), false);
  assert.equal(validate({ ...basePackage(), visualPatternRefs: Array.from({ length: 19 }, (_, index) => `./patterns/${index}.json`) }), false);
  assert.equal(validate({ ...basePackage(), visualPatternRefs: Array.from({ length: 41 }, (_, index) => `./patterns/${index}.json`) }), false);
});

test("schema parity keeps status, aspect-ratio, content-capacity, and required artifact contracts aligned", () => {
  const variant = readSchema("style-variant.schema.json");
  const pattern = readSchema("visual-pattern.schema.json");
  const pkg = readSchema("visual-package.schema.json");
  const expectedAspectRatios = ["9:16", "16:9", "1:1"];
  const expectedCapacityFields = ["bodyChars", "bulletsMaxItems", "headlineChars", "maxCodeLines", "maxDataSeries", "maxEvents", "maxItems", "maxMetrics", "maxPanels"];

  assert.deepEqual(schemaAspectRatios(variant), expectedAspectRatios);
  assert.deepEqual(schemaAspectRatios(pattern), expectedAspectRatios);
  assert.deepEqual(schemaAspectRatios(pkg), expectedAspectRatios);
  assert.deepEqual(schemaCapacityFields(variant), expectedCapacityFields);
  assert.deepEqual(schemaCapacityFields(pattern), expectedCapacityFields);
  assert.deepEqual(schemaCapacityFields(pkg), expectedCapacityFields);
  assert.ok(pkg.properties.status.enum.includes("deprecated"));
  assert.deepEqual(pkg.properties.sourceArtifacts.required, ["sourceReviewReport"]);
  assert.deepEqual(pkg.properties.validationArtifacts.required, ["previewFrames", "renderReport"]);
  assert.deepEqual(pkg.properties.qualityGate.required, ["validated", "checks"]);
});

test("visual package validator preserves legacy packages without Style RAG refs", () => {
  withStyleRagValidationRoot({ refs: false, renderer: false, canonical: false }, (root) => {
    const result = runVisualPackageValidator(root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});

test("visual package validator accepts optional variant refs without visual patterns", () => {
  withStyleRagValidationRoot({}, (root) => {
    const packagePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
    const pkg = readJson(packagePath);
    delete pkg.visualPatternRefs;
    writeJson(packagePath, pkg);

    const result = runVisualPackageValidator(root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});

test("visual package validator resolves approved Style RAG refs and rejects adversarial cross-artifact declarations", () => {
  withStyleRagValidationRoot({}, (root) => {
    const result = runVisualPackageValidator(root);
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });

  const cases = [
    {
      name: "path escape",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
        const pkg = readJson(filePath);
        pkg.variantRefs[0] = "../outside.json";
        writeJson(filePath, pkg);
      },
      reason: /package directory/i,
    },
    {
      name: "missing variant ref",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
        const pkg = readJson(filePath);
        pkg.variantRefs[0] = "./variants/missing.json";
        writeJson(filePath, pkg);
      },
      reason: /PATH_MISSING/i,
    },
    {
      name: "three variant refs",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
        const pkg = readJson(filePath);
        pkg.variantRefs = pkg.variantRefs.slice(0, 3);
        writeJson(filePath, pkg);
      },
      reason: /variantRefs.*4/i,
    },
    {
      name: "nine variant refs",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
        const pkg = readJson(filePath);
        pkg.variantRefs = Array.from({ length: 9 }, (_, index) => `./variants/variant-${index + 1}.json`);
        writeJson(filePath, pkg);
      },
      reason: /variantRefs.*8/i,
    },
    {
      name: "nineteen pattern refs",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
        const pkg = readJson(filePath);
        pkg.visualPatternRefs = pkg.visualPatternRefs.slice(0, 19);
        writeJson(filePath, pkg);
      },
      reason: /visualPatternRefs.*20/i,
    },
    {
      name: "forty-one pattern refs",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
        const pkg = readJson(filePath);
        pkg.visualPatternRefs = Array.from({ length: 41 }, (_, index) => `./patterns/pattern-${index + 1}.json`);
        writeJson(filePath, pkg);
      },
      reason: /visualPatternRefs.*40/i,
    },
    {
      name: "duplicate variant IDs",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/variants/variant-2.json");
        const variant = readJson(filePath);
        variant.variantId = "variant-1";
        writeJson(filePath, variant);
      },
      reason: /duplicate variantId/i,
    },
    {
      name: "duplicate pattern IDs",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/patterns/pattern-2.json");
        const pattern = readJson(filePath);
        pattern.patternId = "pattern-1";
        writeJson(filePath, pattern);
      },
      reason: /duplicate patternId/i,
    },
    {
      name: "variant package mismatch",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/variants/variant-1.json");
        const variant = readJson(filePath);
        variant.packageId = "other-package";
        writeJson(filePath, variant);
      },
      reason: /must match package/i,
    },
    {
      name: "pattern unknown variant and evidence",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/patterns/pattern-1.json");
        const pattern = readJson(filePath);
        pattern.variantIds = ["unknown-variant"];
        pattern.sourceEvidenceIds = ["unknown-evidence"];
        writeJson(filePath, pattern);
      },
      reason: /absent from package sourceReferences/i,
    },
    {
      name: "ineligible canonical evidence",
      mutate: (root) => {
        const filePath = path.join(root, "design/knowledge/reference-library/repository/fixture-source/source.json");
        const source = readJson(filePath);
        source.domain = "factual";
        writeJson(filePath, source);
      },
      reason: /ineligible canonical evidence/i,
    },
    {
      name: "unapproved canonical evidence",
      mutate: (root) => {
        const filePath = path.join(root, "design/knowledge/reference-library/repository/fixture-source/source.json");
        const source = readJson(filePath);
        source.approval.status = "pending";
        writeJson(filePath, source);
      },
      reason: /ineligible canonical evidence/i,
    },
    {
      name: "unsupported renderer declaration",
      options: { renderer: false },
      mutate: () => {},
      reason: /no runtime renderer registration/i,
    },
    {
      name: "unsupported variant renderer property",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/variants/variant-1.json");
        const variant = readJson(filePath);
        variant.renderer = "unknown-renderer";
        writeJson(filePath, variant);
      },
      reason: /renderer/i,
    },
    {
      name: "unsupported pattern fixture property",
      mutate: (root) => {
        const filePath = path.join(root, "design/visual-library/styles/terra-package/patterns/pattern-1.json");
        const pattern = readJson(filePath);
        pattern.fixture = "./fixtures/unregistered.json";
        writeJson(filePath, pattern);
      },
      reason: /fixture/i,
    },
  ];

  for (const testCase of cases) {
    withStyleRagValidationRoot(testCase.options, (root) => {
      testCase.mutate(root);
      const result = runVisualPackageValidator(root);
      assert.equal(result.status, 1, testCase.name);
      assert.match(`${result.stdout}\n${result.stderr}`, testCase.reason, testCase.name);
    });
  }
});

test("visual package validator rejects symlinked refs that escape the package directory", () => {
  withStyleRagValidationRoot({}, (root) => {
    const outsideDir = path.join(root, "design/visual-library/styles/outside-target");
    const linkDir = path.join(root, "design/visual-library/styles/terra-package/variants/linked");
    fs.mkdirSync(outsideDir, { recursive: true });
    writeJson(path.join(outsideDir, "variant-escape.json"), {
      ...baseVariant(),
      variantId: "variant-escape",
      packageId: "terra-package",
      sourceEvidenceIds: ["fixture-source"],
    });
    assert.doesNotThrow(() => {
      fs.symlinkSync(outsideDir, linkDir, process.platform === "win32" ? "junction" : "dir");
    });

    const pkgPath = path.join(root, "design/visual-library/styles/terra-package/style-package.json");
    const pkg = readJson(pkgPath);
    pkg.variantRefs[0] = "./variants/linked/variant-escape.json";
    writeJson(pkgPath, pkg);

    const result = runVisualPackageValidator(root);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(`${result.stdout}\n${result.stderr}`, /must remain inside package directory/i);
  });
});

test("visual package validator ignores renderer-like paths and calls in comments or strings", () => {
  withStyleRagValidationRoot({}, (root) => {
    const registryPath = path.join(root, "src/styles/runtime/packages.ts");
    fs.writeFileSync(
      registryPath,
      [
        "// import visual from '../../../design/visual-library/styles/terra-package/visual.json';",
        "// definePackage(visual);",
        "const example = \"definePackage(visual) design/visual-library/styles/terra-package/visual.json\";",
      ].join("\n"),
      "utf8",
    );

    const result = runVisualPackageValidator(root);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(`${result.stdout}\n${result.stderr}`, /no runtime renderer registration/i);
  });

  withStyleRagValidationRoot({}, (root) => {
    const registryPath = path.join(root, "src/styles/runtime/packages.ts");
    fs.writeFileSync(
      registryPath,
      [
        "import visual from '../../../design/visual-library/styles/terra-package/visual.json';",
        "const example = 'definePackage(visual)';",
        "// definePackage(visual)",
        "void visual;",
      ].join("\n"),
      "utf8",
    );

    const result = runVisualPackageValidator(root);
    assert.equal(result.status, 1, result.stderr || result.stdout);
    assert.match(`${result.stdout}\n${result.stderr}`, /no runtime renderer registration/i);
  });
});
