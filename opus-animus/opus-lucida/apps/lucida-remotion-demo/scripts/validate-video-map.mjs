import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const read = (p) =>
  JSON.parse(fs.readFileSync(path.resolve(appRoot, p), "utf8"));

const schemaPath = "schemas/video-map.schema.json";
const videoMapPath = process.argv[2] ?? "video-map.json";

// Minimal JSON-Schema (subset) interpreter, in the same hand-written-validator
// spirit as scripts/validate-visual-input-contracts.mjs. Supports the
// keywords actually used by schemas/video-map.schema.json: type, enum,
// const, required, properties, items, minItems, minLength,
// minimum/exclusiveMinimum, additionalProperties.
const typeOf = (value) => {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
};

const validate = (schema, value, pointer, errors) => {
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${pointer}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
    return;
  }

  if (schema.enum) {
    if (!schema.enum.includes(value)) {
      errors.push(`${pointer}: expected one of ${JSON.stringify(schema.enum)}, got ${JSON.stringify(value)}`);
    }
    return;
  }

  if (schema.type) {
    const actual = typeOf(value);
    const expected = schema.type;
    const matches =
      actual === expected ||
      (expected === "number" && actual === "number" && Number.isFinite(value));
    if (!matches) {
      errors.push(`${pointer}: expected type ${expected}, got ${actual}`);
      return;
    }
  }

  if (schema.type === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${pointer}: string shorter than minLength ${schema.minLength}`);
    }
  }

  if (schema.type === "number" || schema.type === "integer") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${pointer}: ${value} is below minimum ${schema.minimum}`);
    }
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push(`${pointer}: ${value} is not > exclusiveMinimum ${schema.exclusiveMinimum}`);
    }
  }

  if (schema.type === "array") {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${pointer}: array shorter than minItems ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        validate(schema.items, item, `${pointer}[${index}]`, errors);
      });
    }
  }

  if (schema.type === "object") {
    for (const key of schema.required ?? []) {
      if (value[key] === undefined) {
        errors.push(`${pointer}: missing required property "${key}"`);
      }
    }
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      if (value[key] !== undefined) {
        validate(propSchema, value[key], `${pointer}.${key}`, errors);
      }
    }
    if (schema.additionalProperties === false) {
      const known = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!known.has(key)) {
          errors.push(`${pointer}: unexpected additional property "${key}"`);
        }
      }
    }
  }
};

const schema = read(schemaPath);
const videoMap = read(videoMapPath);

const errors = [];
validate(schema, videoMap, "$", errors);

// B5: diagram scenes should carry explicit node coordinates; otherwise the
// diagram adapter auto-synthesizes a grid layout, which the mapping stage
// should be told about explicitly.
const warnings = [];
for (const scene of videoMap.scenes ?? []) {
  if (scene.templateId !== "diagram") continue;
  const nodes = scene.content?.nodes ?? [];
  nodes.forEach((node, index) => {
    if (typeof node.x !== "number" || typeof node.y !== "number") {
      warnings.push(
        `Scene "${scene.id}" (diagram) node[${index}]${node.label ? ` "${node.label}"` : ""} is missing x/y coordinates; layout will be auto-synthesized.`,
      );
    }
  });
}

// Layout rhythm warnings (batch 1). Effective layout defaults to "top-title"
// when the field is absent. Warnings only — never errors.
const scenes = videoMap.scenes ?? [];
const effectiveLayouts = scenes.map((scene) => scene.layout ?? "top-title");

// (a) Two consecutive scenes with the same effective layout.
for (let i = 1; i < scenes.length; i += 1) {
  if (effectiveLayouts[i] === effectiveLayouts[i - 1]) {
    warnings.push(
      `Scenes "${scenes[i - 1].id}" and "${scenes[i].id}" use the same effective layout "${effectiveLayouts[i]}" back to back; vary layouts to avoid scene monotony.`,
    );
  }
}

// (b) Fewer than 3 distinct layouts when the video has 5+ scenes.
if (scenes.length >= 5) {
  const distinct = new Set(effectiveLayouts);
  if (distinct.size < 3) {
    warnings.push(
      `Video has ${scenes.length} scenes but only ${distinct.size} distinct layout(s) (${[...distinct].join(", ")}); use at least 3 layouts for macro variety.`,
    );
  }
}

// (c) hook / takeaway scenes should not fall back to the default top-title.
scenes.forEach((scene, index) => {
  if (
    (scene.intent === "hook" || scene.intent === "takeaway") &&
    effectiveLayouts[index] === "top-title"
  ) {
    warnings.push(
      `Scene "${scene.id}" (intent ${scene.intent}) uses top-title; hook/takeaway beats land harder with center-stage, oversized-type, or bottom-statement.`,
    );
  }
});

for (const warning of warnings) {
  console.warn(`WARNING: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(`Video map validation passed: ${videoMap.scenes.length} scenes against ${schemaPath}.`);
