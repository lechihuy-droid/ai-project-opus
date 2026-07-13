#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const PROJECT_ROOT = process.cwd();
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const DEFAULT_ROOT = 'design/visual-library/styles';
const DEFAULT_REPORT = 'design/visual-library/reports/qa-all-style-packages.json';
const EXPECTED_PACKAGE_IDS = [
  'terminal-command-center',
  'technical-editorial',
  'minimal-education',
  'cinematic-type',
  'dashboard-data',
  'paper-notebook',
  'product-showcase',
  'editorial-collage',
  'timeline-documentary',
];
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
const REQUIRED_STATUS = new Set(['experimental', 'stable']);
const REQUIRED_WIDTH = 1080;
const REQUIRED_HEIGHT = 1920;
const SHA256_RE = /^[a-f0-9]{64}$/i;

function main() {
  const options = parseArgs(process.argv.slice(2));
  const packageFiles = discoverStylePackages(options.roots);
  const strictValidation = runStrictPackageValidation(options.roots);
  const strictByPackage = new Map(
    (strictValidation.report?.results ?? []).map((result) => [normalizeProjectPath(result.packageFile), result]),
  );

  const families = packageFiles.map((packageFile) => analyzeFamily(packageFile, strictByPackage));
  const familyById = new Map(families.map((family) => [family.id, family]));
  const discoveredIds = new Set(families.map((family) => family.id));
  const missingExpectedPackageIds = EXPECTED_PACKAGE_IDS.filter((id) => !discoveredIds.has(id));
  const unplannedPackageIds = [...discoveredIds]
    .filter((id) => !EXPECTED_PACKAGE_IDS.includes(id))
    .sort();
  const plannedPackages = EXPECTED_PACKAGE_IDS.map((id) => {
    const family = familyById.get(id);
    return family
      ? {
          id,
          present: true,
          status: family.status,
          issueCount: family.issueCount,
          packageFile: family.packageFile,
        }
      : {
          id,
          present: false,
          status: 'missing',
          issueCount: 1,
          packageFile: null,
        };
  });

  const summary = {
    scannedPackageCount: families.length,
    passedPackageCount: families.filter((family) => family.status === 'pass').length,
    failedPackageCount: families.filter((family) => family.status === 'fail').length,
    missingExpectedPackageCount: missingExpectedPackageIds.length,
    unplannedPackageCount: unplannedPackageIds.length,
    strictPackageValidationPassed: strictValidation.exitCode === 0,
    status: families.every((family) => family.status === 'pass') && missingExpectedPackageIds.length === 0
      ? 'pass'
      : 'fail',
  };

  const aggregateReport = {
    schemaVersion: 'lucida-style-package-qa/v1',
    generatedAt: new Date().toISOString(),
    command: {
      cwd: toProjectRelative(PROJECT_ROOT),
      roots: options.roots,
      expectedPackageIds: EXPECTED_PACKAGE_IDS,
      requiredFrameDimensions: {
        width: REQUIRED_WIDTH,
        height: REQUIRED_HEIGHT,
      },
    },
    summary,
    plannedPackages,
    missingExpectedPackageIds,
    unplannedPackageIds,
    strictPackageValidation: {
      exitCode: strictValidation.exitCode,
      passed: strictValidation.exitCode === 0,
      parseError: strictValidation.parseError,
      summary: strictValidation.report?.summary ?? null,
    },
    families,
  };

  writeJsonReport(options.report, aggregateReport);

  if (options.json) {
    process.stdout.write(JSON.stringify(aggregateReport, null, 2) + '\n');
  } else {
    printHumanReport(aggregateReport, options.report);
  }

  process.exit(summary.status === 'pass' ? 0 : 1);
}

function parseArgs(argv) {
  const roots = [];
  let report = DEFAULT_REPORT;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) {
        failUsage('Missing value after --root.');
      }
      roots.push(value);
      index += 1;
      continue;
    }
    if (arg === '--report') {
      const value = argv[index + 1];
      if (!value) {
        failUsage('Missing value after --report.');
      }
      report = value;
      index += 1;
      continue;
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    failUsage(`Unsupported argument: ${arg}`);
  }

  return {
    roots: roots.length > 0 ? roots : [DEFAULT_ROOT],
    report,
    json,
  };
}

function discoverStylePackages(roots) {
  const found = [];
  for (const root of roots) {
    const absoluteRoot = path.resolve(PROJECT_ROOT, root);
    if (!fs.existsSync(absoluteRoot)) {
      continue;
    }
    walkForPackages(absoluteRoot, found);
  }
  return [...new Set(found)].sort((a, b) => toProjectRelative(a).localeCompare(toProjectRelative(b)));
}

function walkForPackages(dir, found) {
  const entries = safeReadDir(dir);
  if (!entries) {
    return;
  }

  if (entries.some((entry) => entry.isFile() && entry.name === 'style-package.json')) {
    found.push(path.join(dir, 'style-package.json'));
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
      continue;
    }
    walkForPackages(path.join(dir, entry.name), found);
  }
}

function runStrictPackageValidation(roots) {
  const validatorPath = path.join(SCRIPT_DIR, 'validate-visual-packages.mjs');
  const args = [validatorPath, '--strict', '--json'];
  for (const root of roots) {
    args.push('--root', root);
  }

  const result = spawnSync(process.execPath, args, {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
  });

  const stdout = result.stdout?.trim() ?? '';
  let report = null;
  let parseError = null;
  if (stdout.length > 0) {
    try {
      report = JSON.parse(stdout);
    } catch (error) {
      parseError = error.message;
    }
  } else {
    parseError = 'strict validator produced no JSON output';
  }

  return {
    exitCode: typeof result.status === 'number' ? result.status : 1,
    report,
    parseError,
    stderr: result.stderr ?? '',
  };
}

function analyzeFamily(packageFile, strictByPackage) {
  const packageDir = path.dirname(packageFile);
  const packageRel = toProjectRelative(packageFile);
  const packageDirRel = toProjectRelative(packageDir);
  const issues = [];
  const evidence = {
    strictPackageValidation: null,
    previewFrames: [],
    renderReport: null,
    artifactManifestCoverage: [],
    provenance: null,
  };

  const pkgResult = readJson(packageFile);
  if (!pkgResult.ok) {
    addIssue(issues, 'package-json', 'STYLE_PACKAGE_PARSE', pkgResult.error);
    return finishFamily({
      id: path.basename(packageDir),
      packageFile: packageRel,
      packageDir: packageDirRel,
      statusValue: null,
      issues,
      evidence,
    });
  }

  const pkg = pkgResult.data;
  const id = typeof pkg.id === 'string' ? pkg.id : path.basename(packageDir);
  const strictResult = strictByPackage.get(normalizeProjectPath(packageRel));
  evidence.strictPackageValidation = strictResult
    ? {
        state: strictResult.state,
        errors: strictResult.errors ?? [],
        migrationGaps: strictResult.migrationGaps ?? [],
      }
    : null;

  if (!strictResult || strictResult.state !== 'valid') {
    addIssue(issues, 'strict-package-validation', 'STRICT_PACKAGE_VALIDATION', 'Package does not pass strict visual package validation.');
  }

  if (!REQUIRED_STATUS.has(pkg.status)) {
    addIssue(
      issues,
      'status',
      'STATUS_NOT_PROMOTABLE',
      `Package status must be experimental or stable; found ${JSON.stringify(pkg.status)}.`,
    );
  }

  checkNoRegisteredMp4(pkg, packageDir, issues);
  checkProvenance(pkg, packageDir, issues, evidence);

  const manifest = loadArtifactManifest(pkg, packageDir, issues);
  checkArtifactManifestCoverage(pkg, packageDir, manifest, issues, evidence);

  const previewFrameRefs = Array.isArray(pkg.validationArtifacts?.previewFrames)
    ? pkg.validationArtifacts.previewFrames
    : [];
  if (previewFrameRefs.length < 3) {
    addIssue(
      issues,
      'preview-frames',
      'PREVIEW_FRAME_COUNT',
      `Expected at least 3 referenced PNG review frames; found ${previewFrameRefs.length}.`,
    );
  }

  const frameChecks = previewFrameRefs.map((ref, index) =>
    checkPreviewFrame(ref, index, packageDir, issues),
  );
  evidence.previewFrames = frameChecks;

  const renderReport = loadRenderReport(pkg, packageDir, issues);
  evidence.renderReport = renderReport.evidence;
  if (renderReport.data) {
    checkNoRegisteredMp4InRenderReport(renderReport.data, issues);
    checkRenderReportFrameEvidence(renderReport.data, frameChecks, packageDir, issues);
  }

  return finishFamily({
    id,
    packageFile: packageRel,
    packageDir: packageDirRel,
    statusValue: pkg.status ?? null,
    issues,
    evidence,
  });
}

function finishFamily({id, packageFile, packageDir, statusValue, issues, evidence}) {
  return {
    id,
    status: issues.length === 0 ? 'pass' : 'fail',
    packageStatus: statusValue,
    packageFile,
    packageDir,
    issueCount: issues.length,
    issues,
    missingEvidence: issues
      .filter((issue) => issue.gate.includes('evidence') || issue.code.startsWith('MISSING_'))
      .map((issue) => ({
        gate: issue.gate,
        code: issue.code,
        message: issue.message,
      })),
    evidence,
  };
}

function checkNoRegisteredMp4(pkg, packageDir, issues) {
  if (pkg.validationArtifacts?.videoBinaryRegistered !== false) {
    addIssue(
      issues,
      'no-registered-mp4',
      'VIDEO_BINARY_REGISTERED_FLAG',
      'validationArtifacts.videoBinaryRegistered must be false.',
    );
  }

  const manifestRef = pkg.files?.artifactManifest ?? './artifact-manifest.json';
  const manifestPath = resolveRef(manifestRef, packageDir);
  const manifest = manifestPath ? readJson(manifestPath) : {ok: false};
  const artifacts = manifest.ok && Array.isArray(manifest.data.artifacts) ? manifest.data.artifacts : [];
  for (const artifact of artifacts) {
    if (!artifact || typeof artifact !== 'object') {
      continue;
    }
    if (artifact.registersVideoBinary === true) {
      addIssue(
        issues,
        'no-registered-mp4',
        'MANIFEST_REGISTERS_VIDEO_BINARY',
        `Artifact ${JSON.stringify(artifact.id ?? artifact.path)} registers a video binary.`,
      );
    }
    if (typeof artifact.path === 'string' && path.extname(artifact.path).toLowerCase() === '.mp4') {
      addIssue(
        issues,
        'no-registered-mp4',
        'MANIFEST_MP4_PATH',
        `Artifact manifest contains MP4 path ${artifact.path}.`,
      );
    }
  }
}

function checkNoRegisteredMp4InRenderReport(renderReport, issues) {
  if (renderReport.videoBinaryRegistered === true) {
    addIssue(
      issues,
      'no-registered-mp4',
      'RENDER_REPORT_VIDEO_BINARY_REGISTERED',
      'Render report says videoBinaryRegistered is true.',
    );
  }
  for (const ref of collectStringValues(renderReport)) {
    if (/\.mp4(\?|#|$)/i.test(ref)) {
      addIssue(
        issues,
        'no-registered-mp4',
        'RENDER_REPORT_MP4_REFERENCE',
        `Render report contains MP4 reference ${ref}.`,
      );
    }
  }
}

function checkProvenance(pkg, packageDir, issues, evidence) {
  const provenanceRef = pkg.files?.provenance ?? './provenance.md';
  const provenancePath = resolveRef(provenanceRef, packageDir);
  if (!provenancePath || !fs.existsSync(provenancePath)) {
    addIssue(issues, 'provenance', 'MISSING_PROVENANCE', `Missing provenance file ${provenanceRef}.`);
    evidence.provenance = {
      path: provenanceRef,
      exists: false,
      bytes: 0,
    };
    return;
  }

  const bytes = fs.statSync(provenancePath).size;
  evidence.provenance = {
    path: toProjectRelative(provenancePath),
    exists: true,
    bytes,
  };
  if (bytes === 0 || fs.readFileSync(provenancePath, 'utf8').trim().length === 0) {
    addIssue(issues, 'provenance', 'EMPTY_PROVENANCE', `${toProjectRelative(provenancePath)} is empty.`);
  }
}

function loadArtifactManifest(pkg, packageDir, issues) {
  const manifestRef = pkg.files?.artifactManifest ?? './artifact-manifest.json';
  const manifestPath = resolveRef(manifestRef, packageDir);
  if (!manifestPath || !fs.existsSync(manifestPath)) {
    addIssue(issues, 'artifact-manifest', 'MISSING_ARTIFACT_MANIFEST', `Missing artifact manifest ${manifestRef}.`);
    return null;
  }

  const manifest = readJson(manifestPath);
  if (!manifest.ok) {
    addIssue(issues, 'artifact-manifest', 'ARTIFACT_MANIFEST_PARSE', manifest.error);
    return null;
  }
  if (!Array.isArray(manifest.data.artifacts)) {
    addIssue(issues, 'artifact-manifest', 'ARTIFACT_MANIFEST_ARTIFACTS', 'artifact-manifest.json must contain artifacts array.');
    return null;
  }
  return {
    path: manifestPath,
    data: manifest.data,
  };
}

function checkArtifactManifestCoverage(pkg, packageDir, manifest, issues, evidence) {
  if (!manifest) {
    return;
  }

  const coverageEntries = manifest.data.artifacts
    .filter((artifact) => artifact && typeof artifact.path === 'string')
    .map((artifact) => {
      const absolutePath = resolveRef(artifact.path, packageDir);
      return absolutePath
        ? {
            id: artifact.id ?? null,
            path: artifact.path,
            absolutePath,
            isDirectory: fs.existsSync(absolutePath) ? fs.statSync(absolutePath).isDirectory() : artifact.path.endsWith('/'),
          }
        : null;
    })
    .filter(Boolean);

  const requiredRefs = [
    {label: 'style-package', ref: './style-package.json'},
    {label: 'visual', ref: pkg.files?.visual},
    {label: 'tokens', ref: pkg.files?.tokens},
    {label: 'componentMap', ref: pkg.files?.componentMap},
    {label: 'provenance', ref: pkg.files?.provenance},
    {label: 'artifactManifest', ref: pkg.files?.artifactManifest},
    {label: 'renderReport', ref: pkg.validationArtifacts?.renderReport},
    ...(Array.isArray(pkg.validationArtifacts?.previewFrames)
      ? pkg.validationArtifacts.previewFrames.map((ref, index) => ({label: `previewFrames[${index}]`, ref}))
      : []),
  ].filter((entry) => typeof entry.ref === 'string' && entry.ref.length > 0);

  for (const required of requiredRefs) {
    const absolutePath = resolveRef(required.ref, packageDir);
    const covered = Boolean(absolutePath && isCoveredByManifest(absolutePath, coverageEntries));
    evidence.artifactManifestCoverage.push({
      label: required.label,
      path: absolutePath ? toProjectRelative(absolutePath) : required.ref,
      covered,
    });
    if (!covered) {
      addIssue(
        issues,
        'artifact-manifest',
        'MANIFEST_COVERAGE',
        `Artifact manifest does not cover ${required.label} (${required.ref}).`,
      );
    }
  }
}

function checkPreviewFrame(ref, index, packageDir, issues) {
  const frameEvidence = {
    index,
    ref,
    path: null,
    exists: false,
    isPng: /\.png$/i.test(ref),
    dimensions: null,
    sha256: null,
    fileBytes: null,
  };

  if (!frameEvidence.isPng) {
    addIssue(issues, 'preview-frames', 'PREVIEW_FRAME_NOT_PNG', `previewFrames[${index}] is not a PNG path: ${ref}.`);
  }

  const framePath = resolveRef(ref, packageDir);
  if (!framePath || !fs.existsSync(framePath)) {
    addIssue(issues, 'preview-frames', 'MISSING_PREVIEW_FRAME', `Missing preview frame ${ref}.`);
    return frameEvidence;
  }

  frameEvidence.path = toProjectRelative(framePath);
  frameEvidence.exists = true;
  const stats = fs.statSync(framePath);
  frameEvidence.fileBytes = stats.size;

  const dimensions = readPngDimensions(framePath);
  frameEvidence.dimensions = dimensions;
  if (!dimensions) {
    addIssue(issues, 'frame-dimensions', 'PNG_DIMENSION_READ', `Unable to read PNG dimensions for ${toProjectRelative(framePath)}.`);
  } else if (dimensions.width !== REQUIRED_WIDTH || dimensions.height !== REQUIRED_HEIGHT) {
    addIssue(
      issues,
      'frame-dimensions',
      'PNG_DIMENSION_MISMATCH',
      `${toProjectRelative(framePath)} is ${dimensions.width}x${dimensions.height}; expected ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}.`,
    );
  }

  frameEvidence.sha256 = sha256File(framePath);
  return frameEvidence;
}

function loadRenderReport(pkg, packageDir, issues) {
  const renderReportRef = pkg.validationArtifacts?.renderReport;
  if (typeof renderReportRef !== 'string' || renderReportRef.length === 0) {
    addIssue(issues, 'render-report-evidence', 'MISSING_RENDER_REPORT_REF', 'validationArtifacts.renderReport is missing.');
    return {
      data: null,
      evidence: {
        path: null,
        exists: false,
        frameEvidenceCount: 0,
      },
    };
  }

  const renderReportPath = resolveRef(renderReportRef, packageDir);
  if (!renderReportPath || !fs.existsSync(renderReportPath)) {
    addIssue(issues, 'render-report-evidence', 'MISSING_RENDER_REPORT', `Missing render report ${renderReportRef}.`);
    return {
      data: null,
      evidence: {
        path: renderReportRef,
        exists: false,
        frameEvidenceCount: 0,
      },
    };
  }

  const parsed = readJson(renderReportPath);
  if (!parsed.ok) {
    addIssue(issues, 'render-report-evidence', 'RENDER_REPORT_PARSE', parsed.error);
    return {
      data: null,
      evidence: {
        path: toProjectRelative(renderReportPath),
        exists: true,
        frameEvidenceCount: 0,
      },
    };
  }

  return {
    data: parsed.data,
    evidence: {
      path: toProjectRelative(renderReportPath),
      exists: true,
      frameEvidenceCount: Array.isArray(parsed.data.frames) ? parsed.data.frames.length : 0,
      checks: Array.isArray(parsed.data.checks) ? parsed.data.checks : [],
    },
  };
}

function checkRenderReportFrameEvidence(renderReport, frameChecks, packageDir, issues) {
  if (!Array.isArray(renderReport.frames)) {
    addIssue(issues, 'render-report-evidence', 'MISSING_RENDER_REPORT_FRAMES', 'Render report must contain per-frame evidence array.');
    return;
  }

  const reportLevelDeterminism = hasReportLevelDeterministicEvidence(renderReport);
  const reportFrames = renderReport.frames.map((frame, index) => ({
    index,
    frame,
    normalizedPath: normalizeReportFramePath(frame, packageDir),
  }));

  for (const frameCheck of frameChecks) {
    if (!frameCheck.exists || !frameCheck.path) {
      continue;
    }
    const reportFrame = findReportFrame(frameCheck, reportFrames);
    const label = frameCheck.path ?? frameCheck.ref;
    if (!reportFrame) {
      addIssue(issues, 'render-report-evidence', 'MISSING_FRAME_REPORT_EVIDENCE', `Render report lacks evidence for ${label}.`);
      continue;
    }

    validateFrameReportEvidence(reportFrame.frame, frameCheck, label, reportLevelDeterminism, issues);
  }
}

function validateFrameReportEvidence(reportFrame, frameCheck, label, reportLevelDeterminism, issues) {
  const reportedSha = typeof reportFrame.sha256 === 'string' ? reportFrame.sha256 : null;
  if (!reportedSha || !SHA256_RE.test(reportedSha)) {
    addIssue(issues, 'render-report-evidence', 'MISSING_FRAME_SHA256', `Render report frame for ${label} lacks a valid sha256.`);
  } else if (frameCheck.sha256 && reportedSha.toLowerCase() !== frameCheck.sha256.toLowerCase()) {
    addIssue(
      issues,
      'render-report-evidence',
      'FRAME_SHA256_MISMATCH',
      `Render report sha256 for ${label} does not match the checked-in PNG.`,
    );
  }

  const reportedWidth = reportFrame.dimensions?.width ?? reportFrame.width;
  const reportedHeight = reportFrame.dimensions?.height ?? reportFrame.height;
  if (reportedWidth !== REQUIRED_WIDTH || reportedHeight !== REQUIRED_HEIGHT) {
    addIssue(
      issues,
      'render-report-evidence',
      'FRAME_REPORT_DIMENSIONS',
      `Render report frame for ${label} must record ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT} dimensions.`,
    );
  }

  const nonBlankPassed =
    reportFrame.nonBlank === true ||
    (reportFrame.nonBlank && typeof reportFrame.nonBlank === 'object' && reportFrame.nonBlank.passed === true);
  const hasNonBlankEvidence =
    reportFrame.signalStats && typeof reportFrame.signalStats === 'object' ||
    typeof reportFrame.sampledColors === 'number' ||
    typeof reportFrame.nonBlank?.dynamicRange === 'number';
  if (!nonBlankPassed || !hasNonBlankEvidence) {
    addIssue(
      issues,
      'render-report-evidence',
      'MISSING_NONBLANK_EVIDENCE',
      `Render report frame for ${label} lacks passing nonblank evidence.`,
    );
  }

  if (!hasDeterministicEvidence(reportFrame, reportedSha, reportLevelDeterminism)) {
    addIssue(
      issues,
      'deterministic-evidence',
      'MISSING_DETERMINISTIC_EVIDENCE',
      `Render report frame for ${label} lacks repeated-checksum deterministic evidence.`,
    );
  }
}

function hasDeterministicEvidence(reportFrame, reportedSha, reportLevelDeterminism) {
  if (!reportedSha || !SHA256_RE.test(reportedSha)) {
    return false;
  }
  if (reportLevelDeterminism) {
    return true;
  }
  if (
    reportFrame.deterministic &&
    typeof reportFrame.deterministic === 'object' &&
    reportFrame.deterministic.passed === true &&
    typeof reportFrame.deterministic.repeatedSha256 === 'string' &&
    reportFrame.deterministic.repeatedSha256.toLowerCase() === reportedSha.toLowerCase()
  ) {
    return true;
  }
  if (
    typeof reportFrame.repeatedSha256 === 'string' &&
    reportFrame.repeatedSha256.toLowerCase() === reportedSha.toLowerCase()
  ) {
    return true;
  }
  if (
    Array.isArray(reportFrame.repeatedSha256) &&
    reportFrame.repeatedSha256.length > 0 &&
    reportFrame.repeatedSha256.every((sha) => typeof sha === 'string' && sha.toLowerCase() === reportedSha.toLowerCase())
  ) {
    return true;
  }
  return false;
}

function hasReportLevelDeterministicEvidence(renderReport) {
  const checks = Array.isArray(renderReport.checks) ? renderReport.checks : [];
  if (checks.some((check) => typeof check === 'string' && /(repeat|determin)/i.test(check))) {
    return true;
  }

  const validation = renderReport.validation;
  if (validation && typeof validation === 'object' && !Array.isArray(validation)) {
    return Object.entries(validation).some(
      ([key, value]) => /determin/i.test(key) && (value === true || value === 'passed'),
    );
  }

  if (renderReport.summary && typeof renderReport.summary === 'object') {
    return Object.entries(renderReport.summary).some(
      ([key, value]) => /determin/i.test(key) && (value === true || value === 'passed' || value > 0),
    );
  }

  return false;
}

function normalizeReportFramePath(reportFrame, packageDir) {
  const candidate =
    typeof reportFrame.output === 'string'
      ? reportFrame.output
      : typeof reportFrame.file === 'string'
        ? reportFrame.file
        : typeof reportFrame.path === 'string'
          ? reportFrame.path
          : null;
  if (!candidate) {
    return null;
  }
  const resolved = resolveRef(candidate, packageDir);
  return resolved ? toProjectRelative(resolved) : normalizeProjectPath(candidate);
}

function findReportFrame(frameCheck, reportFrames) {
  const expectedPath = normalizeProjectPath(frameCheck.path);
  const exactMatch = reportFrames.find((entry) => entry.normalizedPath === expectedPath);
  if (exactMatch) {
    return exactMatch;
  }

  return reportFrames.find((entry) => {
    if (!entry.normalizedPath) {
      return false;
    }
    return path.posix.basename(entry.normalizedPath) === path.posix.basename(expectedPath);
  });
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 24) {
    return null;
  }
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveRef(ref, packageDir) {
  if (typeof ref !== 'string' || ref.trim().length === 0 || ref.includes('\\') || path.isAbsolute(ref)) {
    return null;
  }
  const baseDir = ref.startsWith('./') || ref.startsWith('../') ? packageDir : PROJECT_ROOT;
  const resolved = path.resolve(baseDir, ref);
  if (!isWithinDirectory(resolved, PROJECT_ROOT) && resolved !== PROJECT_ROOT) {
    return null;
  }
  return resolved;
}

function isCoveredByManifest(targetPath, coverageEntries) {
  return coverageEntries.some((entry) => {
    if (entry.isDirectory) {
      return targetPath === entry.absolutePath || isWithinDirectory(targetPath, entry.absolutePath);
    }
    return path.resolve(entry.absolutePath) === path.resolve(targetPath);
  });
}

function collectStringValues(value) {
  const strings = [];
  const walk = (current) => {
    if (typeof current === 'string') {
      strings.push(current);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(walk);
      return;
    }
    if (current && typeof current === 'object') {
      Object.values(current).forEach(walk);
    }
  };
  walk(value);
  return strings;
}

function addIssue(issues, gate, code, message) {
  issues.push({gate, code, message});
}

function writeJsonReport(reportRef, report) {
  const reportPath = path.resolve(PROJECT_ROOT, reportRef);
  const reportsDir = path.resolve(PROJECT_ROOT, 'design/visual-library/reports');
  if (!isWithinDirectory(reportPath, reportsDir) && reportPath !== reportsDir) {
    failUsage(`Report path must stay under design/visual-library/reports: ${reportRef}`);
  }
  fs.mkdirSync(path.dirname(reportPath), {recursive: true});
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}

function printHumanReport(report, reportRef) {
  console.log(`Style package QA: ${report.summary.status.toUpperCase()}`);
  console.log(`Report: ${reportRef}`);
  console.log(
    `Packages: ${report.summary.passedPackageCount} pass, ${report.summary.failedPackageCount} fail, ${report.summary.scannedPackageCount} scanned.`,
  );
  if (report.missingExpectedPackageIds.length > 0) {
    console.log(`Missing planned packages: ${report.missingExpectedPackageIds.join(', ')}`);
  }
  if (report.unplannedPackageIds.length > 0) {
    console.log(`Unplanned discovered packages: ${report.unplannedPackageIds.join(', ')}`);
  }
  for (const family of report.families) {
    console.log(`${family.status.toUpperCase()} ${family.id}`);
    for (const issue of family.issues) {
      console.log(`  ${issue.gate}/${issue.code}: ${issue.message}`);
    }
  }
}

function readJson(filePath) {
  try {
    return {
      ok: true,
      data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    };
  } catch (error) {
    return {
      ok: false,
      error: `${toProjectRelative(filePath)} parse failed: ${error.message}`,
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

function isWithinDirectory(targetPath, rootPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function toProjectRelative(targetPath) {
  const relative = path.relative(PROJECT_ROOT, targetPath);
  return normalizeProjectPath(relative === '' ? '.' : relative);
}

function normalizeProjectPath(value) {
  return value.split(path.sep).join('/').replace(/^\.\//, '');
}

function failUsage(message) {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

main();
