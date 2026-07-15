import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";

const appRoot = process.cwd();
const schemasDir = path.join(appRoot, "design", "schemas");
const templatesDir = path.join(appRoot, "design", "template-library");
const errors = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const toPosix = (value) => value.split(path.sep).join("/");
const relativePath = (filePath) => toPosix(path.relative(appRoot, filePath));

const reportSchemaErrors = (label, validate) => {
  const details = (validate.errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
  errors.push(`${label}: ${details}`);
};

const validatePathRef = (packageDir, ref, label) => {
  if (typeof ref !== "string" || ref.length === 0) {
    errors.push(`${label}: missing path reference`);
    return null;
  }

  const absolutePath = path.resolve(packageDir, ref);
  const packageRoot = `${path.resolve(packageDir)}${path.sep}`;

  if (absolutePath !== path.resolve(packageDir) && !absolutePath.startsWith(packageRoot)) {
    errors.push(`${label}: path escapes package directory: ${ref}`);
    return null;
  }

  if (!fs.existsSync(absolutePath)) {
    errors.push(`${label}: missing path: ${ref}`);
    return null;
  }

  return absolutePath;
};

const validateProjectPath = (ref, label) => {
  if (typeof ref !== "string" || ref.length === 0) {
    errors.push(`${label}: missing project path`);
    return;
  }

  const absolutePath = path.resolve(appRoot, ref);
  const projectRoot = `${path.resolve(appRoot)}${path.sep}`;
  if (!absolutePath.startsWith(projectRoot) || !fs.existsSync(absolutePath)) {
    errors.push(`${label}: missing project path: ${ref}`);
  }
};

const readSchema = (name) => readJson(path.join(schemasDir, name));
const ajv = new Ajv({ allErrors: true, strict: true });
const componentSchema = readSchema("component-primitive.schema.json");
const templateSchema = readSchema("template-definition.schema.json");
const slotSchema = readSchema("template-slot.schema.json");

let validateComponent;
let validateTemplate;
let validateSlots;
try {
  validateComponent = ajv.compile(componentSchema);
  validateTemplate = ajv.compile(templateSchema);
  validateSlots = ajv.compile(slotSchema);
} catch (error) {
  errors.push(`Schema compilation failed: ${error.message}`);
}

const templateIds = new Set();
const componentIds = new Set();
const logicalIds = new Set();

const packageEntries = fs.existsSync(templatesDir)
  ? fs.readdirSync(templatesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())
  : [];

if (packageEntries.length === 0) {
  errors.push("No template packages found under design/template-library");
}

for (const entry of packageEntries.sort((left, right) => left.name.localeCompare(right.name))) {
  const packageDir = path.join(templatesDir, entry.name);
  const packageLabel = `template package ${entry.name}`;
  const templatePath = path.join(packageDir, "template.json");

  if (!fs.existsSync(templatePath)) {
    errors.push(`${packageLabel}: missing template.json`);
    continue;
  }

  let template;
  try {
    template = readJson(templatePath);
  } catch (error) {
    errors.push(`${packageLabel}: invalid template.json: ${error.message}`);
    continue;
  }

  if (validateTemplate && !validateTemplate(template)) {
    reportSchemaErrors(`${packageLabel}/template.json`, validateTemplate);
  }

  if (templateIds.has(template.id)) {
    errors.push(`${packageLabel}: duplicate template id: ${template.id}`);
  }
  templateIds.add(template.id);

  if (logicalIds.has(template.logicalId)) {
    errors.push(`${packageLabel}: duplicate logical id: ${template.logicalId}`);
  }
  logicalIds.add(template.logicalId);

  const companionRefs = template.files ?? {};
  const requiredCompanions = [
    "template",
    "component",
    "contentSchema",
    "slots",
    "provenance",
    "validFixture",
    "invalidFixture",
  ];
  for (const companion of requiredCompanions) {
    validatePathRef(packageDir, companionRefs[companion], `${packageLabel}/${companion}`);
  }

  const componentPath = validatePathRef(packageDir, template.componentRef, `${packageLabel}/componentRef`);
  const contentSchemaPath = validatePathRef(
    packageDir,
    template.content?.schemaRef,
    `${packageLabel}/content.schemaRef`,
  );
  const slotsPath = validatePathRef(packageDir, template.slots?.schemaRef, `${packageLabel}/slots.schemaRef`);
  const provenancePath = validatePathRef(
    packageDir,
    template.provenanceRef,
    `${packageLabel}/provenanceRef`,
  );

  validateProjectPath(template.familyRef, `${packageLabel}/familyRef`);
  validateProjectPath(template.adapter?.path, `${packageLabel}/adapter.path`);

  if (componentPath) {
    try {
      const component = readJson(componentPath);
      if (validateComponent && !validateComponent(component)) {
        reportSchemaErrors(`${packageLabel}/component.json`, validateComponent);
      }
      if (componentIds.has(component.id)) {
        errors.push(`${packageLabel}: duplicate component id: ${component.id}`);
      }
      componentIds.add(component.id);
      if (logicalIds.has(component.logicalId)) {
        errors.push(`${packageLabel}: duplicate logical id: ${component.logicalId}`);
      }
      logicalIds.add(component.logicalId);
      validateProjectPath(component.adapterPath, `${packageLabel}/component.adapterPath`);
      validatePathRef(packageDir, component.provenanceRef, `${packageLabel}/component.provenanceRef`);
    } catch (error) {
      errors.push(`${packageLabel}: invalid component.json: ${error.message}`);
    }
  }

  if (slotsPath) {
    try {
      const slots = readJson(slotsPath);
      if (validateSlots && !validateSlots(slots)) {
        reportSchemaErrors(`${packageLabel}/slots.schema.json`, validateSlots);
      }
      if (slots.templateId !== template.id) {
        errors.push(`${packageLabel}: slots templateId does not match template id`);
      }
      const slotIds = new Set();
      for (const slot of slots.slots ?? []) {
        if (slotIds.has(slot.id)) {
          errors.push(`${packageLabel}: duplicate slot id: ${slot.id}`);
        }
        slotIds.add(slot.id);
      }
    } catch (error) {
      errors.push(`${packageLabel}: invalid slots.schema.json: ${error.message}`);
    }
  }

  if (contentSchemaPath) {
    try {
      const contentSchema = readJson(contentSchemaPath);
      const validateContent = new Ajv({ allErrors: true, strict: true }).compile(contentSchema);
      const validFixturePath = validatePathRef(packageDir, companionRefs.validFixture, `${packageLabel}/validFixture`);
      const invalidFixturePath = validatePathRef(packageDir, companionRefs.invalidFixture, `${packageLabel}/invalidFixture`);

      if (validFixturePath && !validateContent(readJson(validFixturePath))) {
        reportSchemaErrors(`${packageLabel}/fixtures/valid.json`, validateContent);
      }
      if (invalidFixturePath && validateContent(readJson(invalidFixturePath))) {
        errors.push(`${packageLabel}/fixtures/invalid.json: fixture unexpectedly passed`);
      }
    } catch (error) {
      errors.push(`${packageLabel}: invalid content schema or fixture: ${error.message}`);
    }
  }

  if (provenancePath) {
    try {
      const provenance = readJson(provenancePath);
      const license = provenance.license;
      const source = provenance.source;
      if (
        provenance.templateId !== template.id ||
        !source?.repository ||
        !source?.localCommitPin ||
        !source?.sourcePath ||
        !Array.isArray(source?.evidence) ||
        source.evidence.length === 0 ||
        !license?.status ||
        !license?.evidenceStatus ||
        !license?.reviewStatus
      ) {
        errors.push(`${packageLabel}: provenance is incomplete`);
      }
    } catch (error) {
      errors.push(`${packageLabel}: invalid provenance.json: ${error.message}`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Knowledge validation passed: ${templateIds.size} template package(s), ${componentIds.size} component primitive(s).`,
  );
}
