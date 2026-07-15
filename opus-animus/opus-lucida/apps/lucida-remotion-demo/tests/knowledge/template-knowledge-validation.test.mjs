import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import Ajv from "ajv";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VALIDATOR_PATH = path.join(APP_ROOT, "scripts/knowledge/validate.mjs");
const TEMPLATE_DIR = path.join(APP_ROOT, "design/template-library/glitch-text");
const ADAPTER_PATH = path.join(APP_ROOT, "src/templates/adapters/GlitchTextAdapter.tsx");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, value) => {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const createValidationRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-rag-wave1-"));
  fs.mkdirSync(path.join(root, "design"), { recursive: true });
  fs.cpSync(path.join(APP_ROOT, "design/schemas"), path.join(root, "design/schemas"), {
    recursive: true,
  });
  fs.cpSync(TEMPLATE_DIR, path.join(root, "design/template-library/glitch-text"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, "design/visual-library/styles/cinematic-type"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, "design/visual-library/styles/cinematic-type/style-package.json"),
    "{}\n",
    "utf8",
  );
  fs.mkdirSync(path.join(root, "src/templates/adapters"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/templates/adapters/GlitchTextAdapter.tsx"), "// fixture\n", "utf8");
  return root;
};

const runValidator = (cwd) => {
  const result = spawnSync(process.execPath, [VALIDATOR_PATH], {
    cwd,
    encoding: "utf8",
  });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};

const withValidationRoot = (callback) => {
  const root = createValidationRoot();
  try {
    return callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const mutateTemplate = (root, mutate) => {
  const templatePath = path.join(root, "design/template-library/glitch-text/template.json");
  const template = readJson(templatePath);
  mutate(template);
  writeJson(templatePath, template);
};

const validatorOutput = (result) => `${result.stdout}\n${result.stderr}`;

test("canonical glitch-text package passes with a successful validator exit", () => {
  withValidationRoot((root) => {
    const result = runValidator(root);

    assert.equal(result.status, 0);
    assert.equal(result.signal, null);
    assert.match(result.stdout, /Knowledge validation passed: 1 template package\(s\), 1 component primitive\(s\)\./);
    assert.equal(result.stderr, "");
  });
});

test("invalid.json fails validation for the required headline reason", () => {
  const schema = readJson(path.join(TEMPLATE_DIR, "content.schema.json"));
  const fixture = readJson(path.join(TEMPLATE_DIR, "fixtures/invalid.json"));
  const validate = new Ajv({ allErrors: true, strict: true }).compile(schema);

  assert.equal(validate(fixture), false);
  assert.deepEqual(
    validate.errors
      ?.filter((error) => error.keyword === "required")
      .map((error) => ({ instancePath: error.instancePath, missingProperty: error.params.missingProperty })),
    [{ instancePath: "", missingProperty: "headline" }],
  );
});

test("duplicate stable template, logical, and component IDs fail with explicit reasons", () => {
  withValidationRoot((root) => {
    fs.cpSync(
      path.join(root, "design/template-library/glitch-text"),
      path.join(root, "design/template-library/glitch-text-duplicate"),
      { recursive: true },
    );
    const result = runValidator(root);
    const output = validatorOutput(result);

    assert.equal(result.status, 1);
    assert.match(output, /duplicate template id: glitch-text/);
    assert.match(output, /duplicate logical id: template:glitch-text/);
    assert.match(output, /duplicate component id: glitch-text/);
    assert.match(output, /duplicate logical id: component:glitch-text/);
  });
});

test("broken companion, package path, and project reference fail with precise reasons", () => {
  const cases = [
    {
      name: "companion",
      mutate: (template) => {
        template.files.validFixture = "fixtures/missing.json";
      },
      reason: /validFixture: missing path: fixtures\/missing\.json/,
    },
    {
      name: "package path",
      mutate: (template) => {
        template.componentRef = "../outside-component.json";
      },
      reason: /componentRef: path escapes package directory: \.\.\/outside-component\.json/,
    },
    {
      name: "project reference",
      mutate: (template) => {
        template.adapter.path = "src/templates/adapters/MissingAdapter.tsx";
      },
      reason: /adapter\.path: missing project path: src\/templates\/adapters\/MissingAdapter\.tsx/,
    },
  ];

  for (const testCase of cases) {
    withValidationRoot((root) => {
      mutateTemplate(root, testCase.mutate);
      const result = runValidator(root);

      assert.equal(result.status, 1, testCase.name);
      assert.match(validatorOutput(result), testCase.reason, testCase.name);
    });
  }
});

test("missing and incomplete provenance fail validation", () => {
  withValidationRoot((root) => {
    fs.rmSync(path.join(root, "design/template-library/glitch-text/provenance.json"));
    const missingResult = runValidator(root);

    assert.equal(missingResult.status, 1);
    assert.match(validatorOutput(missingResult), /provenance: missing path: provenance\.json/);
  });

  withValidationRoot((root) => {
    writeJson(path.join(root, "design/template-library/glitch-text/provenance.json"), {});
    const incompleteResult = runValidator(root);

    assert.equal(incompleteResult.status, 1);
    assert.match(validatorOutput(incompleteResult), /provenance is incomplete/);
  });
});

test("Draft-07 schemas reject extra properties and invalid status/capability values", () => {
  const schemasDir = path.join(APP_ROOT, "design/schemas");
  const ajv = new Ajv({ allErrors: true, strict: true });
  const template = readJson(path.join(TEMPLATE_DIR, "template.json"));
  const component = readJson(path.join(TEMPLATE_DIR, "component.json"));
  const slots = readJson(path.join(TEMPLATE_DIR, "slots.schema.json"));
  const cases = [
    ["template extra property", "template-definition.schema.json", { ...template, unexpected: true }, "additionalProperties"],
    ["template status", "template-definition.schema.json", { ...template, status: "approved" }, "enum"],
    [
      "template capability ratio",
      "template-definition.schema.json",
      { ...template, capabilities: { ...template.capabilities, aspectRatios: ["vertical"] } },
      "pattern",
    ],
    [
      "template renderable capability",
      "template-definition.schema.json",
      { ...template, capabilities: { ...template.capabilities, renderable: false } },
      "const",
    ],
    ["component extra property", "component-primitive.schema.json", { ...component, unexpected: true }, "additionalProperties"],
    ["component status", "component-primitive.schema.json", { ...component, status: "approved" }, "enum"],
    [
      "component capability extra property",
      "component-primitive.schema.json",
      { ...component, capabilities: { ...component.capabilities, unknownCapability: true } },
      "additionalProperties",
    ],
    ["slots extra property", "template-slot.schema.json", { ...slots, unexpected: true }, "additionalProperties"],
  ];
  const validators = new Map();

  for (const [name, schemaFile, data, keyword] of cases) {
    const validate = validators.get(schemaFile) ?? ajv.compile(readJson(path.join(schemasDir, schemaFile)));
    validators.set(schemaFile, validate);
    assert.equal(validate(data), false, name);
    assert.ok(validate.errors?.some((error) => error.keyword === keyword), `${name}: ${keyword}`);
  }
});

test("GlitchTextAdapter satisfies the scene-local deterministic adapter contract", () => {
  const source = fs.readFileSync(ADAPTER_PATH, "utf8");

  assert.match(source, /export const GlitchTextAdapter/);
  assert.match(source, /scene,\s*localFrame,\s*durationFrames/);
  assert.match(source, /scene\.headline/);
  assert.match(source, /scene\.content\.subtitle/);
  assert.match(source, /scene\.content\.quote/);
  assert.match(source, /scene\.content\.codeTitle/);
  assert.match(source, /interpolate\(localFrame/);
  assert.match(source, /Math\.sin\(localFrame/);

  for (const [name, pattern] of [
    ["Math.random", /Math\.random\s*\(/],
    ["Date", /\bDate(?:\.|\s*\()/],
    ["timer", /\b(?:setTimeout|setInterval|clearTimeout|clearInterval)\s*\(/],
    ["useCurrentFrame", /\buseCurrentFrame\b/],
    ["browser API", /\b(?:window|document|navigator|localStorage|sessionStorage)\b/],
  ]) {
    assert.doesNotMatch(source, pattern, name);
  }
});

test("knowledge validator output and exit behavior are deterministic", () => {
  withValidationRoot((root) => {
    const first = runValidator(root);
    const second = runValidator(root);

    assert.deepEqual(first, second);
    assert.equal(first.status, 0);
  });
});
