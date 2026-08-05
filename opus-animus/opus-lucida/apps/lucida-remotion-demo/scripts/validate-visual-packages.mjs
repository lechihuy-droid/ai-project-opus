#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');

const PROJECT_ROOT = process.cwd();
const DEFAULT_ROOTS = ['design/visual-library/styles'];
const SKIP_DIRS = new Set([
  '.git',
  '.venv',
  '.uv-cache',
  '.pytest_cache',
  '__pycache__',
  'node_modules',
  'dist',
  'build',
  'runtime',
  'logs',
  'archives',
]);
const LEGACY_GAP_FIELDS = new Set([
  'version',
  'supportedIntents',
  'avoidFor',
  'aspectRatios',
  'contentCapacity',
  'renderCost',
  'reducedMotion',
  'accessibility',
  'directorCompatibility',
  'files',
]);
const PRODUCTION_COMPANION_NAMES = {
  visual: 'visual.json',
  tokens: 'tokens.json',
  componentMap: 'component-map.json',
  provenance: 'provenance.md',
  artifactManifest: 'artifact-manifest.json',
};
const PROVENANCE_ROOT_PREFIXES = [
  './',
  '../',
  'design/',
  'pipeline/',
  'docs/',
  'src/',
  'schemas/',
  'scripts/',
  'input/',
  'output/',
];

function main() {
  const options = parseArgs(process.argv.slice(2));
  const schemaPath = path.join(PROJECT_ROOT, 'design', 'schemas', 'visual-package.schema.json');
  const schema = readJsonFile(schemaPath, 'schema');
  const variantSchema = readJsonFile(
    path.join(PROJECT_ROOT, 'design', 'schemas', 'style-variant.schema.json'),
    'style variant schema',
  );
  const patternSchema = readJsonFile(
    path.join(PROJECT_ROOT, 'design', 'schemas', 'visual-pattern.schema.json'),
    'visual pattern schema',
  );
  if (schema.error || variantSchema.error || patternSchema.error) {
    printFatal(`Không đọc được schema: ${schema.error}`);
    process.exit(1);
  }

  const ajv = new Ajv({
    allErrors: true,
  });
  let validators;
  try {
    validators = {
      production: ajv.compile(schema.data),
      variant: ajv.compile(variantSchema.data),
      pattern: ajv.compile(patternSchema.data),
    };
  } catch (error) {
    printFatal(`Schema không compile được: ${error.message}`);
    process.exit(1);
  }

  const rootErrors = [];
  const packageFiles = [];
  for (const root of options.roots) {
    const absoluteRoot = path.resolve(PROJECT_ROOT, root);
    if (!fs.existsSync(absoluteRoot)) {
      rootErrors.push(`Root không tồn tại: ${toProjectRelative(absoluteRoot)}`);
      continue;
    }
    packageFiles.push(...findStylePackageFiles(absoluteRoot));
  }

  const dedupedPackageFiles = [...new Set(packageFiles)].sort();
  const results = dedupedPackageFiles.map((stylePackagePath) =>
    analyzePackage(stylePackagePath, validators),
  );

  const summary = summarize(results, rootErrors);

  if (options.json) {
    process.stdout.write(
      JSON.stringify(
        {
          roots: options.roots,
          summary,
          results,
        },
        null,
        2,
      ) + '\n',
    );
  } else {
    printHumanReport(options.roots, results, summary, options.strict);
  }

  const shouldFail =
    summary.errorCount > 0 || rootErrors.length > 0 || (options.strict && summary.migrationGapCount > 0);
  process.exit(shouldFail ? 1 : 0);
}

function parseArgs(argv) {
  const roots = [];
  let json = false;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        printFatal('Thiếu giá trị sau --root');
        process.exit(1);
      }
      roots.push(value);
      index += 1;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--strict') {
      strict = true;
      continue;
    }
    printFatal(`Tham số không hỗ trợ: ${arg}`);
    process.exit(1);
  }

  return {
    roots: roots.length > 0 ? roots : DEFAULT_ROOTS,
    json,
    strict,
  };
}

function findStylePackageFiles(rootDir) {
  const discovered = [];

  const walk = (currentDir) => {
    const entries = safeReadDir(currentDir);
    if (!entries) {
      return;
    }

    const hasStylePackage = entries.some(
      (entry) => entry.isFile() && entry.name === 'style-package.json',
    );
    if (hasStylePackage) {
      discovered.push(path.join(currentDir, 'style-package.json'));
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      walk(path.join(currentDir, entry.name));
    }
  };

  walk(rootDir);
  return discovered;
}

function analyzePackage(stylePackagePath, validators) {
  const packageDir = path.dirname(stylePackagePath);
  const packageLabel = toProjectRelative(stylePackagePath);
  const result = {
    packageFile: packageLabel,
    packageDir: toProjectRelative(packageDir),
    id: path.basename(packageDir),
    state: 'valid',
    errors: [],
    warnings: [],
    migrationGaps: [],
  };

  const stylePackage = readJsonFile(stylePackagePath, 'style package');
  if (stylePackage.error) {
    result.errors.push({
      code: 'STYLE_PACKAGE_PARSE',
      message: stylePackage.error,
    });
    result.state = 'error';
    return result;
  }

  const pkg = stylePackage.data;
  if (!isPlainObject(pkg)) {
    result.errors.push({
      code: 'STYLE_PACKAGE_TYPE',
      message: 'style-package.json phải là JSON object.',
    });
    result.state = 'error';
    return result;
  }

  result.id = typeof pkg.id === 'string' ? pkg.id : result.id;

  if (typeof pkg.id === 'string' && path.basename(packageDir) !== pkg.id) {
    result.errors.push({
      code: 'PACKAGE_DIR_MISMATCH',
      message: `Tên thư mục "${path.basename(packageDir)}" phải khớp với id "${pkg.id}".`,
    });
  }

  const isProductionValid = validators.production(pkg);
  const schemaErrors = isProductionValid ? [] : (validators.production.errors ?? []).map((error) => ({...error}));
  const isLegacyPackage = looksLikeLegacyPackage(pkg);

  if (!isProductionValid) {
    if (isLegacyPackage) {
      const classified = classifyLegacySchemaErrors(schemaErrors);
      result.migrationGaps.push(...classified.migrationGaps);
      result.errors.push(...classified.errors);
    } else {
      result.errors.push(
        ...schemaErrors.map((error) => ({
          code: 'SCHEMA',
          message: formatSchemaError(error),
        })),
      );
    }
  }

  if (isLegacyPackage) {
    validateLegacyPackage(result, pkg, packageDir, stylePackagePath);
  } else if (isProductionValid) {
    validateProductionPackage(result, pkg, packageDir, stylePackagePath, validators);
  }

  if (result.errors.length > 0) {
    result.state = 'error';
  } else if (result.migrationGaps.length > 0) {
    result.state = 'migration-gap';
  }

  return result;
}

function validateLegacyPackage(result, pkg, packageDir, stylePackagePath) {
  const minimumFields = [
    'schemaVersion',
    'id',
    'label',
    'status',
    'description',
    'sourceArtifacts',
    'validationArtifacts',
    'sourceReferences',
    'qualityGate',
  ];
  for (const field of minimumFields) {
    if (!(field in pkg)) {
      result.errors.push({
        code: 'LEGACY_REQUIRED_FIELD',
        message: `Legacy package vẫn phải có trường "${field}".`,
      });
    }
  }

  result.migrationGaps.push({
    code: 'LEGACY_STATUS',
    message: `Package đang ở trạng thái "${pkg.status ?? 'unknown'}"; cần migrate sang contract production trước khi promote.`,
  });

  for (const [key, fileName] of Object.entries(PRODUCTION_COMPANION_NAMES)) {
    const companionPath = path.join(packageDir, fileName);
    if (!fs.existsSync(companionPath)) {
      result.migrationGaps.push({
        code: 'LEGACY_COMPANION_MISSING',
        message: `Thiếu file production companion "${fileName}" (${key}).`,
      });
    }
  }

  validateArtifactRefCollection(result, pkg.sourceArtifacts, packageDir, 'sourceArtifacts');
  validateArtifactRefCollection(result, pkg.validationArtifacts, packageDir, 'validationArtifacts');

  const provenancePath = path.join(packageDir, 'provenance.md');
  if (fs.existsSync(provenancePath)) {
    validateProvenanceFile(result, provenancePath, packageDir);
  } else {
    result.migrationGaps.push({
      code: 'LEGACY_PROVENANCE_MISSING',
      message: 'Thiếu provenance.md.',
    });
  }

  const manifestPath = path.join(packageDir, 'artifact-manifest.json');
  if (fs.existsSync(manifestPath)) {
    validateArtifactManifest(result, manifestPath, pkg, packageDir, stylePackagePath, {
      requireCoverage: false,
      productionFileRefs: [],
      referencedArtifactRefs: collectArtifactCoverageTargets(pkg, packageDir),
    });
  } else {
    result.migrationGaps.push({
      code: 'LEGACY_MANIFEST_MISSING',
      message: 'Thiếu artifact-manifest.json.',
    });
  }
}

function validateProductionPackage(result, pkg, packageDir, stylePackagePath, validators) {
  if (Array.isArray(pkg.recommendedIntents)) {
    const supported = new Set(pkg.supportedIntents);
    const unsupported = pkg.recommendedIntents.filter((intent) => !supported.has(intent));
    if (unsupported.length > 0) {
      result.errors.push({
        code: 'INTENT_SUBSET',
        message: `recommendedIntents phải là tập con của supportedIntents. Không hợp lệ: ${unsupported.join(', ')}`,
      });
    }
  }

  const productionFileRefs = [];
  for (const [key, fileName] of Object.entries(PRODUCTION_COMPANION_NAMES)) {
    const ref = pkg.files[key];
    const resolved = validatePathReference(result, `${key}`, ref, packageDir, {
      ownerScope: 'package',
      expectedType: 'file',
      parseJson: fileName.endsWith('.json'),
    });
    if (!resolved) {
      continue;
    }
    productionFileRefs.push({
      label: key,
      absolutePath: resolved.absolutePath,
    });
    if (path.basename(resolved.absolutePath) !== fileName) {
      result.errors.push({
        code: 'COMPANION_NAME',
        message: `${key} phải trỏ tới "${fileName}", hiện tại là "${path.basename(resolved.absolutePath)}".`,
      });
    }
  }

  validateArtifactRefCollection(result, pkg.sourceArtifacts, packageDir, 'sourceArtifacts');
  validateArtifactRefCollection(result, pkg.validationArtifacts, packageDir, 'validationArtifacts');

  const provenanceResolved = resolvePathReference(pkg.files.provenance, packageDir);
  if (provenanceResolved.ok) {
    validateProvenanceFile(result, provenanceResolved.absolutePath, packageDir);
  }

  const manifestResolved = resolvePathReference(pkg.files.artifactManifest, packageDir);
  if (manifestResolved.ok) {
    validateArtifactManifest(result, manifestResolved.absolutePath, pkg, packageDir, stylePackagePath, {
      requireCoverage: true,
      productionFileRefs,
      referencedArtifactRefs: collectArtifactCoverageTargets(pkg, packageDir),
    });
  }

  validateStyleRagReferences(result, pkg, packageDir, validators);
}

function validateArtifactRefCollection(result, value, packageDir, labelPrefix) {
  for (const ref of collectPathReferences(value, labelPrefix)) {
    const expectedType = ref.label.startsWith('validationArtifacts.previewFrames[') ? 'file' : 'auto';
    const parseJson = path.extname(ref.value).toLowerCase() === '.json';
    validatePathReference(result, ref.label, ref.value, packageDir, {
      ownerScope: 'project',
      expectedType,
      parseJson,
    });
  }
}

function validateStyleRagReferences(result, pkg, packageDir, validators) {
  const hasVariantRefs = Object.hasOwn(pkg, 'variantRefs');
  const hasPatternRefs = Object.hasOwn(pkg, 'visualPatternRefs');
  if (!hasVariantRefs && !hasPatternRefs) {
    return;
  }

  const variants = loadStyleRagRecords(
    result,
    pkg.variantRefs,
    packageDir,
    'variantRefs',
    validators.variant,
    'VARIANT',
  );
  const patterns = loadStyleRagRecords(
    result,
    pkg.visualPatternRefs,
    packageDir,
    'visualPatternRefs',
    validators.pattern,
    'PATTERN',
  );

  const variantIds = new Set();
  for (const {label, record} of variants) {
    if (record.packageId !== pkg.id) {
      result.errors.push({
        code: 'VARIANT_PACKAGE_ID',
        message: `${label}: packageId "${record.packageId}" must match package "${pkg.id}".`,
      });
    }
    if (variantIds.has(record.variantId)) {
      result.errors.push({
        code: 'VARIANT_ID_DUPLICATE',
        message: `${label}: duplicate variantId "${record.variantId}".`,
      });
    }
    variantIds.add(record.variantId);
  }

  const packageSourceIds = new Set(pkg.sourceReferences.map((reference) => reference.id));
  const patternIds = new Set();
  for (const {label, record} of patterns) {
    if (record.packageId !== pkg.id) {
      result.errors.push({
        code: 'PATTERN_PACKAGE_ID',
        message: `${label}: packageId "${record.packageId}" must match package "${pkg.id}".`,
      });
    }
    if (patternIds.has(record.patternId)) {
      result.errors.push({
        code: 'PATTERN_ID_DUPLICATE',
        message: `${label}: duplicate patternId "${record.patternId}".`,
      });
    }
    patternIds.add(record.patternId);
    for (const variantId of record.variantIds) {
      if (!variantIds.has(variantId)) {
        result.errors.push({
          code: 'PATTERN_VARIANT_ID',
          message: `${label}: variantId "${variantId}" is not declared by variantRefs.`,
        });
      }
    }
    for (const sourceEvidenceId of record.sourceEvidenceIds) {
      if (!packageSourceIds.has(sourceEvidenceId)) {
        result.errors.push({
          code: 'PATTERN_SOURCE_EVIDENCE',
          message: `${label}: sourceEvidenceId "${sourceEvidenceId}" is absent from package sourceReferences.`,
        });
      }
    }
  }

  validateCanonicalEvidenceEligibility(result, packageSourceIds);
  validateRendererRegistration(result, pkg.id);
}

function loadStyleRagRecords(result, refs, packageDir, labelPrefix, validate, kind) {
  if (!Array.isArray(refs)) {
    return [];
  }

  const records = [];
  refs.forEach((ref, index) => {
    const label = `${labelPrefix}[${index}]`;
    const resolved = validatePathReference(result, label, ref, packageDir, {
      ownerScope: 'package',
      expectedType: 'file',
      parseJson: false,
    });
    if (!resolved) {
      return;
    }
    const parsed = readJsonFile(resolved.absolutePath, label);
    if (parsed.error) {
      result.errors.push({code: `${kind}_PARSE`, message: `${label}: ${parsed.error}`});
      return;
    }
    if (!isPlainObject(parsed.data)) {
      result.errors.push({code: `${kind}_TYPE`, message: `${label} must resolve to a JSON object.`});
      return;
    }
    if (!validate(parsed.data)) {
      for (const error of validate.errors ?? []) {
        result.errors.push({
          code: `${kind}_SCHEMA`,
          message: `${label}: ${formatSchemaError(error)}`,
        });
      }
      return;
    }
    records.push({label, record: parsed.data});
  });
  return records;
}

function validateCanonicalEvidenceEligibility(result, packageSourceIds) {
  const referenceRoot = path.join(PROJECT_ROOT, 'design', 'knowledge', 'reference-library');
  if (!fs.existsSync(referenceRoot)) {
    return;
  }

  const canonicalSources = findCanonicalSources(referenceRoot);
  for (const sourceId of packageSourceIds) {
    for (const source of canonicalSources.get(sourceId) ?? []) {
      if (
        source.domain !== 'visual-style' ||
        source.approval?.status !== 'approved' ||
        source.rights?.status !== 'approved'
      ) {
        result.errors.push({
          code: 'CANONICAL_EVIDENCE_INELIGIBLE',
          message: `sourceReferences id "${sourceId}" resolves to ineligible canonical evidence.`,
        });
      }
    }
  }
}

function findCanonicalSources(rootDir) {
  const sources = new Map();
  const walk = (currentDir) => {
    for (const entry of safeReadDir(currentDir) ?? []) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (!entry.isFile() || entry.name !== 'source.json') {
        continue;
      }
      const parsed = readJsonFile(entryPath, 'canonical source');
      if (!isPlainObject(parsed.data) || typeof parsed.data.sourceId !== 'string') {
        continue;
      }
      for (const alias of [parsed.data.sourceId, parsed.data.sourceId.split(':').at(-1)]) {
        const existing = sources.get(alias) ?? [];
        existing.push(parsed.data);
        sources.set(alias, existing);
      }
    }
  };
  walk(rootDir);
  return sources;
}

function tokenizeTypeScript(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1];
    if (/\s/u.test(current)) {
      index += 1;
      continue;
    }
    if (current === '/' && next === '/') {
      index = source.indexOf('\n', index + 2);
      if (index === -1) break;
      continue;
    }
    if (current === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end === -1) break;
      index = end + 2;
      continue;
    }
    if (current === '"' || current === "'" || current === '`') {
      const quote = current;
      let value = '';
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          value += source[index + 1] ?? '';
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        value += source[index];
        index += 1;
      }
      tokens.push({type: 'string', value});
      continue;
    }
    if (/[A-Za-z_$]/u.test(current)) {
      let end = index + 1;
      while (end < source.length && /[\w$]/u.test(source[end])) end += 1;
      tokens.push({type: 'identifier', value: source.slice(index, end)});
      index = end;
      continue;
    }
    tokens.push({type: 'punctuation', value: current});
    index += 1;
  }
  return tokens;
}

function registeredRendererPackageIds(registryPath) {
  const tokens = tokenizeTypeScript(fs.readFileSync(registryPath, 'utf8'));
  const stylesRoot = path.join(PROJECT_ROOT, 'design', 'visual-library', 'styles');
  const importedVisuals = new Map();
  for (let index = 0; index < tokens.length - 3; index += 1) {
    const [keyword, binding, from, specifier] = tokens.slice(index, index + 4);
    if (
      keyword.value !== 'import' ||
      binding.type !== 'identifier' ||
      from.value !== 'from' ||
      specifier.type !== 'string'
    ) {
      continue;
    }
    const importedPath = path.resolve(path.dirname(registryPath), specifier.value);
    if (path.basename(importedPath) !== 'visual.json' || !isWithinDirectory(importedPath, stylesRoot)) {
      continue;
    }
    importedVisuals.set(binding.value, path.basename(path.dirname(importedPath)));
  }

  const registered = new Set();
  for (let index = 0; index < tokens.length - 2; index += 1) {
    const [callee, openParen, binding] = tokens.slice(index, index + 3);
    const previous = tokens[index - 1];
    if (
      callee.value === 'definePackage' &&
      openParen.value === '(' &&
      binding.type === 'identifier' &&
      previous?.value !== '.' &&
      previous?.value !== 'function'
    ) {
      const packageId = importedVisuals.get(binding.value);
      if (packageId) registered.add(packageId);
    }
  }
  return registered;
}

function validateRendererRegistration(result, packageId) {
  const registryPath = path.join(PROJECT_ROOT, 'src', 'styles', 'runtime', 'packages.ts');
  if (!fs.existsSync(registryPath)) {
    result.errors.push({
      code: 'RENDERER_UNSUPPORTED',
      message: `Package "${packageId}" has no runtime renderer registration.`,
    });
    return;
  }
  if (!registeredRendererPackageIds(registryPath).has(packageId)) {
    result.errors.push({
      code: 'RENDERER_UNSUPPORTED',
      message: `Package "${packageId}" has no runtime renderer registration.`,
    });
  }
}

function validateArtifactManifest(
  result,
  manifestPath,
  pkg,
  packageDir,
  stylePackagePath,
  {requireCoverage, productionFileRefs, referencedArtifactRefs},
) {
  const manifest = readJsonFile(manifestPath, 'artifact manifest');
  if (manifest.error) {
    result.errors.push({
      code: 'MANIFEST_PARSE',
      message: `${toProjectRelative(manifestPath)}: ${manifest.error}`,
    });
    return;
  }

  if (!isPlainObject(manifest.data)) {
    result.errors.push({
      code: 'MANIFEST_TYPE',
      message: `${toProjectRelative(manifestPath)} phải là JSON object.`,
    });
    return;
  }

  if (manifest.data.schemaVersion !== 'lucida-artifact-manifest/v1') {
    result.errors.push({
      code: 'MANIFEST_SCHEMA',
      message: `${toProjectRelative(manifestPath)} phải dùng schemaVersion "lucida-artifact-manifest/v1".`,
    });
  }

  if (manifest.data.packageId !== pkg.id) {
    result.errors.push({
      code: 'MANIFEST_PACKAGE_ID',
      message: `${toProjectRelative(manifestPath)} packageId "${manifest.data.packageId}" phải khớp với "${pkg.id}".`,
    });
  }

  if (!Array.isArray(manifest.data.artifacts)) {
    result.errors.push({
      code: 'MANIFEST_ARTIFACTS',
      message: `${toProjectRelative(manifestPath)} phải có mảng artifacts.`,
    });
    return;
  }

  const coverageEntries = [];
  for (let index = 0; index < manifest.data.artifacts.length; index += 1) {
    const artifact = manifest.data.artifacts[index];
    if (!isPlainObject(artifact)) {
      result.errors.push({
        code: 'MANIFEST_ARTIFACT_ITEM',
        message: `artifacts[${index}] trong ${toProjectRelative(manifestPath)} phải là object.`,
      });
      continue;
    }

    if (typeof artifact.path !== 'string' || artifact.path.length === 0) {
      result.errors.push({
        code: 'MANIFEST_ARTIFACT_PATH',
        message: `artifacts[${index}] trong ${toProjectRelative(manifestPath)} thiếu path.`,
      });
      continue;
    }

    const resolved = validatePathReference(result, `artifact-manifest.artifacts[${index}].path`, artifact.path, packageDir, {
      ownerScope: 'project',
      expectedType: 'auto',
      parseJson: path.extname(artifact.path).toLowerCase() === '.json',
    });
    if (!resolved) {
      continue;
    }

    coverageEntries.push({
      absolutePath: resolved.absolutePath,
      isDirectory: resolved.isDirectory,
    });
  }

  const stylePackageCovered = isCoveredByManifest(stylePackagePath, coverageEntries);
  if (!stylePackageCovered) {
    result.errors.push({
      code: 'MANIFEST_STYLE_PACKAGE',
      message: `${toProjectRelative(manifestPath)} phải đăng ký style-package.json.`,
    });
  }

  if (!requireCoverage) {
    return;
  }

  for (const ref of productionFileRefs) {
    if (!isCoveredByManifest(ref.absolutePath, coverageEntries)) {
      result.errors.push({
        code: 'MANIFEST_COMPANION_COVERAGE',
        message: `${toProjectRelative(manifestPath)} chưa đăng ký ${ref.label} (${toProjectRelative(ref.absolutePath)}).`,
      });
    }
  }

  for (const ref of referencedArtifactRefs) {
    if (!isCoveredByManifest(ref.absolutePath, coverageEntries)) {
      result.errors.push({
        code: 'MANIFEST_ARTIFACT_COVERAGE',
        message: `${toProjectRelative(manifestPath)} chưa đăng ký ${ref.label} (${toProjectRelative(ref.absolutePath)}).`,
      });
    }
  }
}

function validateProvenanceFile(result, provenancePath, packageDir) {
  const text = fs.readFileSync(provenancePath, 'utf8');
  if (text.trim().length === 0) {
    result.errors.push({
      code: 'PROVENANCE_EMPTY',
      message: `${toProjectRelative(provenancePath)} không được rỗng.`,
    });
    return;
  }

  const referencedPaths = extractProvenancePaths(text);
  for (const ref of referencedPaths) {
    validatePathReference(result, `provenance:${ref}`, ref, packageDir, {
      ownerScope: 'project',
      expectedType: 'auto',
      parseJson: path.extname(ref).toLowerCase() === '.json',
    });
  }
}

function collectArtifactCoverageTargets(pkg, packageDir) {
  const refs = [];
  for (const ref of collectPathReferences(pkg.sourceArtifacts, 'sourceArtifacts')) {
    const resolved = resolvePathReference(ref.value, packageDir);
    if (resolved.ok && fs.existsSync(resolved.absolutePath)) {
      refs.push({
        label: ref.label,
        absolutePath: resolved.absolutePath,
      });
    }
  }
  for (const ref of collectPathReferences(pkg.validationArtifacts, 'validationArtifacts')) {
    const resolved = resolvePathReference(ref.value, packageDir);
    if (resolved.ok && fs.existsSync(resolved.absolutePath)) {
      refs.push({
        label: ref.label,
        absolutePath: resolved.absolutePath,
      });
    }
  }
  return refs;
}

function collectPathReferences(value, labelPrefix) {
  const collected = [];

  const walk = (currentValue, currentLabel) => {
    if (typeof currentValue === 'string') {
      collected.push({
        label: currentLabel,
        value: currentValue,
      });
      return;
    }
    if (Array.isArray(currentValue)) {
      currentValue.forEach((item, index) => walk(item, `${currentLabel}[${index}]`));
      return;
    }
    if (isPlainObject(currentValue)) {
      for (const [key, item] of Object.entries(currentValue)) {
        walk(item, `${currentLabel}.${key}`);
      }
    }
  };

  walk(value, labelPrefix);
  return collected;
}

function validatePathReference(
  result,
  label,
  ref,
  packageDir,
  {ownerScope, expectedType, parseJson},
) {
  const resolved = resolvePathReference(ref, packageDir);
  if (!resolved.ok) {
    result.errors.push({
      code: 'PATH_REFERENCE',
      message: `${label}: ${resolved.error}`,
    });
    return null;
  }

  if (ownerScope === 'package' && !isWithinDirectory(resolved.absolutePath, packageDir)) {
    result.errors.push({
      code: 'PACKAGE_SCOPE',
      message: `${label}: "${ref}" phải nằm trong package directory ${toProjectRelative(packageDir)}.`,
    });
    return null;
  }

  if (!fs.existsSync(resolved.absolutePath)) {
    result.errors.push({
      code: 'PATH_MISSING',
      message: `${label}: không tìm thấy ${ref} (${toProjectRelative(resolved.absolutePath)}).`,
    });
    return null;
  }

  if (ownerScope === 'package') {
    const realPackageDir = fs.realpathSync(packageDir);
    const realTargetPath = fs.realpathSync(resolved.absolutePath);
    if (!isWithinDirectory(realTargetPath, realPackageDir)) {
      result.errors.push({
        code: 'PACKAGE_SCOPE',
        message: `${label}: "${ref}" must remain inside package directory ${toProjectRelative(packageDir)}.`,
      });
      return null;
    }
  }

  const stats = fs.statSync(resolved.absolutePath);
  const isDirectory = stats.isDirectory();

  if (expectedType === 'file' && isDirectory) {
    result.errors.push({
      code: 'PATH_EXPECTED_FILE',
      message: `${label}: ${ref} phải là file, không phải directory.`,
    });
    return null;
  }

  if (expectedType === 'directory' && !isDirectory) {
    result.errors.push({
      code: 'PATH_EXPECTED_DIRECTORY',
      message: `${label}: ${ref} phải là directory.`,
    });
    return null;
  }

  if (parseJson && !isDirectory) {
    const parsed = readJsonFile(resolved.absolutePath, label);
    if (parsed.error) {
      result.errors.push({
        code: 'JSON_REFERENCE_PARSE',
        message: `${label}: ${parsed.error}`,
      });
      return null;
    }
  }

  return {
    absolutePath: resolved.absolutePath,
    isDirectory,
  };
}

function resolvePathReference(ref, packageDir) {
  if (typeof ref !== 'string' || ref.trim().length === 0) {
    return {
      ok: false,
      error: 'path phải là chuỗi không rỗng.',
    };
  }

  if (ref.includes('\\')) {
    return {
      ok: false,
      error: `path "${ref}" phải dùng forward slash (/), không dùng backslash.`,
    };
  }

  if (path.isAbsolute(ref)) {
    return {
      ok: false,
      error: `path "${ref}" không được là absolute path.`,
    };
  }

  const baseDir = ref.startsWith('./') || ref.startsWith('../') ? packageDir : PROJECT_ROOT;
  const absolutePath = path.resolve(baseDir, ref);

  if (!isWithinDirectory(absolutePath, PROJECT_ROOT) && absolutePath !== PROJECT_ROOT) {
    return {
      ok: false,
      error: `path "${ref}" thoát khỏi project root.`,
    };
  }

  return {
    ok: true,
    absolutePath,
  };
}

function extractProvenancePaths(text) {
  const matches = [...text.matchAll(/`([^`]+)`/g)];
  return matches
    .map((match) => match[1].trim())
    .filter((candidate) =>
      PROVENANCE_ROOT_PREFIXES.some((prefix) => candidate.startsWith(prefix)),
    );
}

function classifyLegacySchemaErrors(schemaErrors) {
  const classified = {
    migrationGaps: [],
    errors: [],
  };

  for (const error of schemaErrors) {
    if (error.keyword === 'required' && LEGACY_GAP_FIELDS.has(error.params.missingProperty)) {
      const property = error.params.missingProperty;
      if (property === 'files') {
        classified.migrationGaps.push({
          code: 'LEGACY_FILES_FIELD',
          message:
            'Thiếu trường production "files"; thêm visual.json, tokens.json, component-map.json, provenance.md, artifact-manifest.json và khai báo đường dẫn của chúng.',
        });
      } else {
        classified.migrationGaps.push({
          code: 'LEGACY_SCHEMA_FIELD',
          message: `Thiếu trường production "${property}" trong style-package.json.`,
        });
      }
      continue;
    }

    classified.errors.push({
      code: 'SCHEMA',
      message: formatSchemaError(error),
    });
  }

  return classified;
}

function formatSchemaError(error) {
  const target = error.instancePath ? `$${error.instancePath}` : '$';
  if (error.keyword === 'required') {
    return `${target} thiếu trường bắt buộc "${error.params.missingProperty}".`;
  }
  if (error.keyword === 'additionalProperties') {
    return `${target} có trường không được hỗ trợ "${error.params.additionalProperty}".`;
  }
  if (error.keyword === 'enum') {
    return `${target} phải là một trong: ${error.params.allowedValues.join(', ')}.`;
  }
  if (error.keyword === 'const') {
    return `${target} phải bằng ${JSON.stringify(error.params.allowedValue)}.`;
  }
  if (error.keyword === 'pattern') {
    return `${target} không khớp pattern yêu cầu.`;
  }
  if (error.keyword === 'minItems') {
    return `${target} phải có ít nhất ${error.params.limit} phần tử.`;
  }
  return `${target} ${error.message}.`;
}

function summarize(results, rootErrors) {
  return {
    validCount: results.filter((result) => result.state === 'valid').length,
    migrationGapCount: results.filter((result) => result.state === 'migration-gap').length,
    errorCount: results.filter((result) => result.state === 'error').length,
    rootErrorCount: rootErrors.length,
  };
}

function printHumanReport(roots, results, summary, strict) {
  console.log(`Visual package scan roots: ${roots.join(', ')}`);
  console.log('');

  for (const result of results) {
    const status = result.state === 'valid' ? 'OK' : result.state === 'migration-gap' ? 'WARN' : 'ERROR';
    console.log(`${status} ${result.id} (${result.packageFile})`);
    for (const issue of result.errors) {
      console.log(`  error: ${issue.message}`);
    }
    for (const gap of result.migrationGaps) {
      console.log(`  migration gap: ${gap.message}`);
    }
    for (const warning of result.warnings) {
      console.log(`  warning: ${warning.message}`);
    }
    console.log('');
  }

  console.log(
    `Summary: ${summary.validCount} valid, ${summary.migrationGapCount} migration-gap, ${summary.errorCount} error.`,
  );
  if (strict) {
    console.log('Strict mode: migration gaps cũng làm command fail.');
  }
}

function printFatal(message) {
  console.error(`ERROR ${message}`);
}

function readJsonFile(filePath, label) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return {
      data: JSON.parse(text),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: `${label} "${toProjectRelative(filePath)}" parse thất bại: ${error.message}`,
    };
  }
}

function safeReadDir(dirPath) {
  try {
    return fs.readdirSync(dirPath, {withFileTypes: true});
  } catch {
    return null;
  }
}

function isCoveredByManifest(targetPath, coverageEntries) {
  return coverageEntries.some((entry) => {
    if (entry.isDirectory) {
      return isWithinDirectory(targetPath, entry.absolutePath) || targetPath === entry.absolutePath;
    }
    return path.resolve(entry.absolutePath) === path.resolve(targetPath);
  });
}

function isWithinDirectory(targetPath, rootPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function toProjectRelative(targetPath) {
  const relative = path.relative(PROJECT_ROOT, targetPath);
  return relative.split(path.sep).join('/');
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeLegacyPackage(pkg) {
  return (
    isPlainObject(pkg) &&
    (pkg.status === 'prototype-created' ||
      (!('files' in pkg) && isPlainObject(pkg.tokens) && isPlainObject(pkg.templateBindings)))
  );
}

main();
