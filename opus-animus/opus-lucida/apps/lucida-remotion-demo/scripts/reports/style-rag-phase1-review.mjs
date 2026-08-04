#!/usr/bin/env node
/**
 * Read-only aggregation of Phase 1 evidence. It never reads or writes
 * canonical reference state, package source, approvals, or promotions.
 * `--write` materializes the three report artifacts owned by this task.
 */
import {createHash} from "node:crypto";
import {existsSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const reportsDir = join(root, "design", "reports");
const outputPaths = {
  json: join(reportsDir, "STYLE_RAG_PHASE1_HUMAN_REVIEW_QUEUE.json"),
  html: join(reportsDir, "STYLE_RAG_PHASE1_HUMAN_REVIEW_QUEUE.html"),
  ledger: join(reportsDir, "STYLE_RAG_PHASE1_COMPLETION_LEDGER.md"),
};
const finalEvidencePaths = {
  globalDataAudit: join(reportsDir, "STYLE_RAG_PHASE1_GLOBAL_DATA_LUNA_AUDIT.json"),
  stillAudit: join(reportsDir, "STYLE_RAG_PHASE1_70_STILL_LUNA_AUDIT.json"),
  knowledgeRuntimeAudit: join(reportsDir, "STYLE_RAG_PHASE1_RUNTIME_LUNA_AUDIT.json"),
};

const baselineRuns = [
  "style-rag-p1-02",
  "p1-03",
  "style-rag-p1-04",
  "style-rag-p1-05",
  "style-rag-p1-06",
  "style-rag-p1-07",
  "style-rag-p1-08",
];
const includedSupplements = ["style-rag-p1-supplement-a", "style-rag-p1-supplement-d"];
const excludedSupplements = {
  "style-rag-p1-supplement-b": "Luna fail-closed: zero globally unique review-eligible records.",
  "style-rag-p1-supplement-c": "No Luna verification artifact; collection report is insufficient and remains unverified/conflicted.",
};

const targetVariants = {
  "terminal-command-center": ["clean-cli", "agent-runtime", "system-monitor", "cyberdeck", "retro-crt"],
  "technical-editorial": ["technical-brief", "annotated-explainer", "data-essay", "research-digest", "evidence-grid"],
  "minimal-education": ["single-concept", "step-sequence", "comparison-cards", "checklist", "takeaway"],
  "cinematic-type": ["kinetic-hook", "quote", "chapter-reset", "manifesto", "outro"],
  "dashboard-data": ["benchmark-grid", "operations-monitor", "comparison-dashboard", "trend-panel", "scorecard"],
  "paper-notebook": ["research-notes", "derivation", "annotated-paper", "checklist", "lab-log"],
  "product-showcase": ["product-hero", "feature-reveal", "before-after", "capability-grid", "launch-summary"],
  "editorial-collage": ["source-montage", "culture-recap", "visual-essay", "quote-collage", "multi-source-evidence"],
  "timeline-documentary": ["chronology", "milestones", "case-study", "evolution", "roadmap"],
  "system-architecture": ["layered-stack", "request-flow", "agent-graph", "data-pipeline", "dependency-map"],
  "code-walkthrough": ["code-focus", "diff-review", "api-sequence", "debugging-trace", "terminal-code-split"],
  "news-rundown": ["headline-stack", "top-stories", "bulletin-grid", "breaking-update", "weekly-roundup"],
  "claim-evidence": ["claim-proof", "pro-con", "benchmark-audit", "myth-reality", "source-triangulation"],
  "interface-walkthrough": ["annotated-screen", "step-flow", "feature-tour", "state-transition", "before-after-ui"],
};

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(path, "utf8");
const readJson = (path) => JSON.parse(readText(path));
const toPosix = (path) => relative(root, path).replaceAll("\\", "/");
const asArray = (value) => (Array.isArray(value) ? value : []);
const unique = (items) => [...new Set(items.filter(Boolean))];
const stable = (value) => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const assert = (condition, message) => {
  if (!condition) throw new Error(`Validation failed: ${message}`);
};
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[char]);

function artifact(path) {
  const text = readText(path);
  return {path: toPosix(path), sha256: `sha256:${sha256(text)}`};
}

function loadFinalEvidenceStatus() {
  const globalDataAudit = readJson(finalEvidencePaths.globalDataAudit);
  const stillAudit = readJson(finalEvidencePaths.stillAudit);
  const knowledgeRuntimeAudit = readJson(finalEvidencePaths.knowledgeRuntimeAudit);
  const strictPackageValidator = globalDataAudit.checks?.strictVisualPackageValidator;
  const knowledgeTest = asArray(knowledgeRuntimeAudit.validationRuns)
    .find((run) => run.name === "knowledge compiler runtime tests");

  assert(globalDataAudit.schemaVersion === "luna-style-rag-global-data-audit/v3", "Luna global data audit must be v3");
  assert(globalDataAudit.overall === "PASS", "Luna global data audit must pass");
  assert(globalDataAudit.counts?.packages?.observed === 14, "Luna global data audit must report 14 packages");
  assert(globalDataAudit.counts?.variants?.observed === 70, "Luna global data audit must report 70 variants");
  assert(globalDataAudit.counts?.patterns?.observed === 420, "Luna global data audit must report 420 patterns");
  assert(strictPackageValidator?.status === "PASS" && strictPackageValidator.validPackages === 14, "strict package validation must pass 14/14");
  assert(stillAudit.schemaVersion === "lucida-style-rag-phase1-luna-r70-audit/v1", "Luna 70-still audit schema is unexpected");
  assert(stillAudit.overall?.status === "PASS", "Luna 70-still audit must pass");
  assert(stillAudit.checks?.registry?.recordCount === 70, "Luna 70-still audit must cover 70 registry records");
  assert(stillAudit.checks?.pngOutputs?.actualPngCount === 70, "Luna 70-still audit must verify 70 PNG outputs");
  assert(knowledgeRuntimeAudit.schemaVersion === "style-rag-phase1-runtime-luna-audit/v3", "latest knowledge runtime audit schema is unexpected");
  assert(knowledgeTest, "latest knowledge runtime audit must include knowledge compiler runtime tests");
  assert(knowledgeTest.summary?.passed === 91, "knowledge compiler runtime tests must report 91 passes");
  assert(knowledgeTest.summary?.failed === 0, "knowledge compiler runtime tests must report zero failures");
  assert(knowledgeTest.summary?.skipped === 3, "knowledge compiler runtime tests must report three Windows EPERM skips");
  assert(asArray(knowledgeRuntimeAudit.validationRuns).every((run) => run.status === "PASS" || run.status === "PASS_WITH_ENVIRONMENTAL_SKIPS"), "all Luna runtime technical gates must pass");

  return {
    globalDataAudit: {
      ...artifact(finalEvidencePaths.globalDataAudit),
      schemaVersion: globalDataAudit.schemaVersion,
      status: globalDataAudit.overall,
      packages: globalDataAudit.counts.packages.observed,
      variants: globalDataAudit.counts.variants.observed,
      patterns: globalDataAudit.counts.patterns.observed,
    },
    stillAudit: {
      ...artifact(finalEvidencePaths.stillAudit),
      schemaVersion: stillAudit.schemaVersion,
      status: stillAudit.overall.status,
      registryRecords: stillAudit.checks.registry.recordCount,
      verifiedPngOutputs: stillAudit.checks.pngOutputs.actualPngCount,
      humanVisualApproval: "PENDING",
    },
    strictVisualPackages: {
      status: strictPackageValidator.status,
      validPackages: strictPackageValidator.validPackages,
      packageErrors: strictPackageValidator.packageErrors,
    },
    knowledgeFinalStatus: {
      ...artifact(finalEvidencePaths.knowledgeRuntimeAudit),
      source: "Latest available Luna runtime audit/report",
      schemaVersion: knowledgeRuntimeAudit.schemaVersion,
      status: "PASS",
      sourceVerdict: knowledgeRuntimeAudit.verdict.status,
      projectedVariants: knowledgeRuntimeAudit.inventory.generatedCounts.variants,
      projectedPatterns: knowledgeRuntimeAudit.inventory.generatedCounts.patterns,
      knowledgeTest: {
        status: knowledgeTest.status,
        passed: knowledgeTest.summary.passed,
        failed: knowledgeTest.summary.failed,
        skipped: knowledgeTest.summary.skipped,
        failureClassification: "Windows EPERM skips",
      },
    },
  };
}

function proposalPath(runId) {
  return join(root, "pipeline", "runs", runId, "03-terra-classification-proposal.json");
}

function normaliseAssociation(association) {
  const variantIds = asArray(association.variantIds).length
    ? association.variantIds
    : [association.variantId].filter(Boolean);
  return {
    packageId: association.packageId,
    variantIds,
    reason: association.classificationReason || association.reason || "No additional association reason recorded.",
    evidenceLocator: association.evidenceLocator || null,
    rendererAvailability: association.rendererAvailability ?? null,
  };
}

function normaliseSource(source, runId, sourceIndex, overrides = {}) {
  const metadata = source.metadata || {};
  const firstRecord = asArray(source.records)[0] || {};
  const recordData = firstRecord.data || {};
  const associations = asArray(source.packageAssociationProposals).length
    ? source.packageAssociationProposals
    : asArray(source.packageProposals);
  const sourceChecksum = source.snapshotChecksum || source.checksum || source.sourceChecksum || overrides.snapshotChecksum || null;
  return {
    rowId: `${runId}:${source.sourceId}`,
    runId,
    sourceId: source.sourceId,
    title: source.title || metadata.repo || metadata.owner || source.sourceId,
    sourceType: source.sourceType || "unknown",
    exactUrl: source.exactUrl || source.sourceUrl || source.url || metadata.url || recordData.url || null,
    sourceRevision: source.sourceRevision || source.immutableRevision || null,
    snapshotChecksum: sourceChecksum ? String(sourceChecksum).replace(/^sha256:/, "") : null,
    dedupeKey: source.dedupeKey || null,
    authority: source.authority || null,
    rights: source.rights || overrides.rights || null,
    evidenceLocators: unique([
      ...asArray(source.classification?.evidenceLocators),
      `02-sanitized-input.json#/sources/${sourceIndex}`,
      overrides.evidenceLocator,
    ]),
    classificationReasons: asArray(source.classification?.reasons),
    associations: associations.map(normaliseAssociation).filter((item) => item.packageId),
    sourceRecipeProposals: asArray(source.patternProposals).map(recipeSummary),
    lunaSourceStatus: overrides.lunaSourceStatus || "LUNA_VERIFIED_REVIEW_ELIGIBLE",
  };
}

function recipeSummary(pattern) {
  return {
    patternId: pattern.patternId,
    variantIds: asArray(pattern.variantIds),
    patternType: pattern.patternType,
    summary: unique([
      ...asArray(pattern.layoutTraits),
      ...asArray(pattern.typographyTraits),
      ...asArray(pattern.paletteTraits),
      ...asArray(pattern.motionTraits),
      ...asArray(pattern.componentTraits),
    ]).slice(0, 6),
    sourceEvidenceIds: asArray(pattern.sourceEvidenceIds),
    classificationReasons: asArray(pattern.classificationReasons),
    reviewStatus: pattern.reviewStatus || "proposed",
  };
}

function loadP103() {
  const runId = "p1-03";
  const proposal = readJson(proposalPath(runId));
  const sanitized = readJson(join(root, "pipeline", "runs", runId, "02-sanitized-input.json"));
  const remediation = readJson(join(root, "pipeline", "runs", runId, "05-terra-remediation.json"));
  const luna = readJson(join(root, "pipeline", "runs", runId, "06-luna-verification.json"));
  const byId = new Map(sanitized.sources.map((source, index) => [source.sourceId, {source, index}]));
  const rightsById = new Map(remediation.rightsAudit.map((entry) => [entry.sourceId, entry]));
  const patternsByEvidenceId = new Map();
  for (const pattern of proposal.patterns) {
    for (const sourceEvidenceId of asArray(pattern.sourceEvidenceIds)) {
      const rows = patternsByEvidenceId.get(sourceEvidenceId) || [];
      rows.push(pattern);
      patternsByEvidenceId.set(sourceEvidenceId, rows);
    }
  }
  const eligible = new Set(luna.eligibleSourceIds);
  return proposal.sourceAssociations
    .filter((association) => eligible.has(association.sourceId))
    .map((association) => {
      const match = byId.get(association.sourceId);
      assert(match, `${runId} source ${association.sourceId} is missing from sanitized input`);
      const rightsAudit = rightsById.get(association.sourceId);
      const source = normaliseSource(match.source, runId, match.index, {
        snapshotChecksum: rightsAudit?.sourceChecksum,
        rights: rightsAudit?.rights,
        evidenceLocator: `03-terra-classification-proposal.json#/sourceAssociations/${proposal.sourceAssociations.indexOf(association)}`,
      });
      source.associations = association.packageProposals.map(normaliseAssociation);
      source.sourceRecipeProposals = asArray(patternsByEvidenceId.get(association.sourceEvidenceId))
        .filter((pattern) => pattern.reviewStatus === "proposed")
        .map(recipeSummary);
      return source;
    });
}

function loadStandardRun(runId, lunaStatus) {
  if (runId === "p1-03") return loadP103();
  const proposal = readJson(proposalPath(runId));
  return proposal.sources
    .filter((source) => source.classification?.status === "accepted-for-human-review")
    .map((source, index) => normaliseSource(source, runId, index, {lunaSourceStatus: lunaStatus}));
}

class UnionFind {
  constructor(size) {
    this.parents = Array.from({length: size}, (_, index) => index);
  }
  find(index) {
    if (this.parents[index] !== index) this.parents[index] = this.find(this.parents[index]);
    return this.parents[index];
  }
  union(left, right) {
    const rootLeft = this.find(left);
    const rootRight = this.find(right);
    if (rootLeft !== rootRight) this.parents[rootRight] = rootLeft;
  }
}

function dedupeSources(rows) {
  const uf = new UnionFind(rows.length);
  const seen = new Map();
  for (const [index, row] of rows.entries()) {
    for (const [field, value] of [["sourceId", row.sourceId], ["exactUrl", row.exactUrl], ["dedupeKey", row.dedupeKey]]) {
      if (!value) continue;
      const key = `${field}:${String(value).toLowerCase()}`;
      if (seen.has(key)) uf.union(index, seen.get(key));
      else seen.set(key, index);
    }
  }
  const groups = new Map();
  rows.forEach((row, index) => {
    const rootIndex = uf.find(index);
    const group = groups.get(rootIndex) || [];
    group.push(row);
    groups.set(rootIndex, group);
  });
  return [...groups.values()].map((members) => {
    const sorted = [...members].sort((a, b) => a.rowId.localeCompare(b.rowId));
    const representative = sorted[0];
    const evidence = sorted.flatMap((member) => member.associations.map((association) => ({
      sourceId: member.sourceId,
      sourceTitle: member.title,
      sourceType: member.sourceType,
      exactUrl: member.exactUrl,
      sourceRevision: member.sourceRevision,
      snapshotChecksum: member.snapshotChecksum,
      rights: member.rights,
      authority: member.authority,
      runId: member.runId,
      lunaSourceStatus: member.lunaSourceStatus,
      ...association,
    })));
    return {
      queueSourceId: `SRC-${sha256(sorted.map((member) => member.rowId).join("|")) .slice(0, 12).toUpperCase()}`,
      sourceId: representative.sourceId,
      title: representative.title,
      sourceType: representative.sourceType,
      exactUrl: representative.exactUrl,
      sourceRevision: representative.sourceRevision,
      snapshotChecksum: representative.snapshotChecksum,
      dedupeKey: representative.dedupeKey,
      authority: representative.authority,
      rights: representative.rights,
      sourceRows: sorted.map((member) => ({runId: member.runId, sourceId: member.sourceId, exactUrl: member.exactUrl, dedupeKey: member.dedupeKey})),
      evidenceLocators: unique(sorted.flatMap((member) => member.evidenceLocators)),
      classificationReasons: unique(sorted.flatMap((member) => member.classificationReasons)),
      lunaSourceStatuses: unique(sorted.map((member) => member.lunaSourceStatus)),
      associations: evidence.sort((a, b) => `${a.packageId}:${a.variantIds.join(",")}:${a.sourceId}`.localeCompare(`${b.packageId}:${b.variantIds.join(",")}:${b.sourceId}`)),
      sourceRecipeProposals: sorted.flatMap((member) => member.sourceRecipeProposals),
      humanReview: sourceReviewControls(),
    };
  }).sort((a, b) => a.queueSourceId.localeCompare(b.queueSourceId));
}

function sourceReviewControls() {
  return {
    status: "PENDING_HUMAN_SOURCE_REVIEW",
    approve: false,
    reject: false,
    reviewer: null,
    reviewedAt: null,
    notes: null,
    prerequisite: "Human must bind approval to this exact revision/snapshot checksum and rights evidence; source approval does not approve patterns.",
  };
}

function patternReviewControls() {
  return {
    status: "PENDING_HUMAN_PATTERN_REVIEW",
    approve: false,
    reject: false,
    reviewer: null,
    reviewedAt: null,
    notes: null,
    prerequisite: "Approved source evidence, approved recipe fit, canonical promotion, compile/ingest, and Luna verification are all required before credit.",
  };
}

function loadPackagePatterns() {
  const packageRows = [];
  for (const packageId of Object.keys(targetVariants).sort()) {
    const packageDir = join(root, "design", "visual-library", "styles", packageId);
    const patternsPath = join(packageDir, "visual-patterns.json");
    const stylePackagePath = join(packageDir, "style-package.json");
    assert(existsSync(patternsPath), `${packageId} visual-patterns.json does not exist`);
    assert(existsSync(stylePackagePath), `${packageId} style-package.json does not exist`);
    const patterns = readJson(patternsPath);
    assert(Array.isArray(patterns), `${packageId} visual-patterns.json must be an array`);
    const declaredVariants = unique(patterns.flatMap((pattern) => asArray(pattern.variantIds))).sort();
    const recipesByVariant = Object.fromEntries(declaredVariants.map((variantId) => [variantId, patterns
      .filter((pattern) => asArray(pattern.variantIds).includes(variantId))
      .sort((a, b) => a.patternId.localeCompare(b.patternId))
      .map((pattern) => ({
        ...recipeSummary(pattern),
        packageId,
        humanReview: patternReviewControls(),
      }))]));
    packageRows.push({
      packageId,
      stylePackage: artifact(stylePackagePath),
      patternsArtifact: artifact(patternsPath),
      targetVariantIds: targetVariants[packageId],
      declaredRecipeVariantIds: declaredVariants,
      variantAlignment: {
        status: targetVariants[packageId].every((variantId) => declaredVariants.includes(variantId)) && declaredVariants.every((variantId) => targetVariants[packageId].includes(variantId)) ? "ALIGNED" : "REQUIRES_RECONCILIATION",
        missingDeclaredRecipesForTargetVariants: targetVariants[packageId].filter((variantId) => !declaredVariants.includes(variantId)),
        declaredRecipeVariantsOutsideTargetContract: declaredVariants.filter((variantId) => !targetVariants[packageId].includes(variantId)),
      },
      patterns: patterns.map((pattern) => ({...recipeSummary(pattern), packageId})),
      recipesByVariant,
    });
  }
  return packageRows;
}

function buildVariantQueue(packages, sources) {
  const evidenceByPackageVariant = new Map();
  for (const source of sources) {
    for (const association of source.associations) {
      for (const variantId of association.variantIds) {
        const key = `${association.packageId}:${variantId}`;
        const entries = evidenceByPackageVariant.get(key) || [];
        entries.push({
          queueSourceId: source.queueSourceId,
          sourceId: source.sourceId,
          title: source.title,
          sourceType: source.sourceType,
          exactUrl: source.exactUrl,
          sourceRevision: source.sourceRevision,
          snapshotChecksum: source.snapshotChecksum,
          rights: source.rights,
          runIds: source.sourceRows.map((row) => row.runId),
          lunaSourceStatuses: source.lunaSourceStatuses,
          reason: association.reason,
          evidenceLocator: association.evidenceLocator,
          rendererAvailability: association.rendererAvailability,
        });
        evidenceByPackageVariant.set(key, entries);
      }
    }
  }
  return packages.flatMap((packageRow) => packageRow.targetVariantIds.map((variantId) => {
    const sourceEvidence = (evidenceByPackageVariant.get(`${packageRow.packageId}:${variantId}`) || [])
      .sort((a, b) => a.queueSourceId.localeCompare(b.queueSourceId));
    const alignedRecipes = packageRow.recipesByVariant[variantId] || [];
    const promotionPrerequisites = [
      "Human source decision recorded against revision, checksum, and rights evidence.",
      "Human pattern decision recorded for each proposed recipe used.",
      "Canonical approval/promotion artifact created outside this report.",
      "Canonical ingest/compile and SQLite projection pass.",
      "Renderer registration and deterministic fixture/still QA pass for the target variant.",
      "Luna verifies the promoted corpus, renderer selection, and render QA.",
    ];
    if (packageRow.variantAlignment.status !== "ALIGNED") {
      promotionPrerequisites.unshift("Reconcile target variant contract with declared local recipe variant IDs; no mapping is inferred by this report.");
    }
    return {
      queueId: `HRQ-${packageRow.packageId}-${variantId}`,
      packageId: packageRow.packageId,
      targetVariantId: variantId,
      status: "PENDING_HUMAN_REVIEW",
      sourceEvidence,
      sourceRecipeProposals: sources
        .flatMap((source) => source.sourceRecipeProposals.map((recipe) => ({sourceId: source.sourceId, ...recipe})))
        .filter((recipe) => recipe.variantIds.includes(variantId) && recipe.patternId),
      declaredRecipeAlignment: packageRow.variantAlignment.status === "ALIGNED" ? "ALIGNED" : "REQUIRES_RECONCILIATION",
      declaredRecipeVariantId: alignedRecipes.length ? variantId : null,
      declaredRecipeSummary: alignedRecipes,
      humanReview: patternReviewControls(),
      promotionPrerequisites,
    };
  }));
}

function sourceTypeCounts(sources) {
  return Object.fromEntries(["repository", "web", "image", "theme"].map((type) => [type, sources.filter((source) => source.sourceType === type).length]));
}

function buildQueue() {
  const baselineRaw = baselineRuns.flatMap((runId) => loadStandardRun(runId, "LUNA_VERIFIED_REVIEW_ELIGIBLE"));
  const baseline = dedupeSources(baselineRaw);
  assert(baselineRaw.length === 101, `baseline eligible input rows expected 101, got ${baselineRaw.length}`);
  assert(baseline.length === 82, `baseline globally unique sources expected 82, got ${baseline.length}`);

  const supplementARaw = loadStandardRun("style-rag-p1-supplement-a", "LUNA_VERIFIED_SOURCE_ELIGIBLE_RUN_REPORT_DEFECT");
  const supplementA = dedupeSources(supplementARaw);
  assert(supplementA.length === 15, `supplement A globally unique sources expected 15, got ${supplementA.length}`);
  const supplementDRaw = loadStandardRun("style-rag-p1-supplement-d", "LUNA_VERIFIED_REVIEW_ELIGIBLE");
  const supplementD = dedupeSources(supplementDRaw);
  assert(supplementD.length === 5, `supplement D globally unique sources expected 5, got ${supplementD.length}`);

  const sources = dedupeSources([...baseline, ...supplementA, ...supplementD].flatMap((source) => source.sourceRows.map((row) => {
    const origin = [...baselineRaw, ...supplementARaw, ...supplementDRaw].find((candidate) => candidate.rowId === `${row.runId}:${row.sourceId}`);
    assert(origin, `source row ${row.runId}:${row.sourceId} could not be rehydrated`);
    return origin;
  })));
  assert(sources.length === 102, `globally unique review-eligible sources expected 102, got ${sources.length}`);

  const packages = loadPackagePatterns();
  const allPatterns = packages.flatMap((packageRow) => packageRow.patterns);
  const variantQueue = buildVariantQueue(packages, sources);
  assert(packages.length === 14, `package artifact inventory expected 14, got ${packages.length}`);
  assert(Object.values(targetVariants).flat().length === 70, "target variant contract must contain 70 entries");
  assert(variantQueue.length === 70, `variant review queue expected 70, got ${variantQueue.length}`);
  assert(allPatterns.length === 420, `proposed recipe inventory expected 420, got ${allPatterns.length}`);
  assert(allPatterns.every((pattern) => pattern.reviewStatus === "proposed"), "all 420 local recipes must remain proposed");
  const finalEvidenceStatus = loadFinalEvidenceStatus();

  const inputArtifacts = [
    ...baselineRuns,
    ...includedSupplements,
    ...Object.keys(excludedSupplements),
  ].flatMap((runId) => {
    const paths = [proposalPath(runId)];
    for (const name of ["06-luna-verification.json", "07-luna-verification.json", "07-final-report.json"]) {
      const path = join(root, "pipeline", "runs", runId, name);
      if (existsSync(path)) paths.push(path);
    }
    return paths.map(artifact);
  }).concat(Object.values(finalEvidencePaths).map(artifact));
  const draft = {
    schemaVersion: "style-rag-phase1-human-review-queue/v1",
    queueId: "STYLE_RAG_PHASE1_HUMAN_REVIEW_QUEUE",
    asOf: "2026-07-18",
    scope: {
      domain: "visual-style",
      authority: "aggregation only; no approval, promotion, classification, canonical ingest, or renderer state change",
      inclusion: "82 Luna-proven baseline globally unique review-eligible sources plus 15 from supplement A and 5 from supplement D",
      exclusions: excludedSupplements,
    },
    counts: {
      baselineReviewEligibleRowsBeforeDedup: baselineRaw.length,
      baselineGloballyUniqueReviewEligibleSources: baseline.length,
      supplementAGloballyUniqueReviewEligibleSources: supplementA.length,
      supplementDGloballyUniqueReviewEligibleSources: supplementD.length,
      globallyUniqueReviewEligibleSources: sources.length,
      targetPackages: packages.length,
      targetVariants: variantQueue.length,
      proposedPatterns: allPatterns.length,
      approvedSources: 0,
      approvedPatterns: 0,
      promotedSources: 0,
      promotedPatterns: 0,
      sourceTypes: sourceTypeCounts(sources),
      alignedPackageVariantContracts: packages.filter((packageRow) => packageRow.variantAlignment.status === "ALIGNED").length,
      packageVariantContractsRequiringReconciliation: packages.filter((packageRow) => packageRow.variantAlignment.status !== "ALIGNED").length,
    },
    inputArtifacts,
    finalEvidenceStatus,
    sourceQueue: sources,
    packageReview: packages.map((packageRow) => ({
      packageId: packageRow.packageId,
      stylePackage: packageRow.stylePackage,
      patternsArtifact: packageRow.patternsArtifact,
      targetVariantIds: packageRow.targetVariantIds,
      declaredRecipeVariantIds: packageRow.declaredRecipeVariantIds,
      variantAlignment: packageRow.variantAlignment,
      declaredRecipeReview: packageRow.recipesByVariant,
    })),
    variantReviewQueue: variantQueue,
    promotionPrerequisites: [
      "Human source and pattern decisions are recorded; source approval is bound to exact revision/checksum and rights evidence.",
      "Approved source/pattern records are promoted through the canonical approval flow outside this report.",
      "Canonical ingest/compile and SQLite projection complete without data leakage or stale-manifest failures.",
      "Each target variant has registered renderer support, deterministic fixtures, and passing still/render QA.",
      "Luna independently validates the promoted corpus, source quotas, retrieval/selection boundaries, renderer availability, and render QA.",
    ],
  };
  const queueChecksum = `sha256:${sha256(stable(draft))}`;
  return {...draft, validation: {status: "PASS", queueChecksum, deterministicInputChecksum: `sha256:${sha256(stable(inputArtifacts))}`}};
}

function htmlControls(id, kind) {
  return `<div class="controls"><label><input type="checkbox" name="${id}-approve"> approve ${kind}</label><label><input type="checkbox" name="${id}-reject"> reject ${kind}</label><label>reviewer <input name="${id}-reviewer" autocomplete="off"></label><label>date <input type="date" name="${id}-date"></label><label>notes <input name="${id}-notes" autocomplete="off"></label></div>`;
}

function renderSourceEvidence(evidence) {
  if (!evidence.length) return `<p class="empty">No included source association proposes this target variant.</p>`;
  return `<ul class="sources">${evidence.map((entry) => `<li><strong>${escapeHtml(entry.title)}</strong> <code>${escapeHtml(entry.sourceId)}</code> <span class="tag">${escapeHtml(entry.sourceType)}</span><br><a href="${escapeHtml(entry.exactUrl || "#")}">${escapeHtml(entry.exactUrl || "no source URL recorded")}</a><br><span>revision: ${escapeHtml(entry.sourceRevision || "not recorded")}; snapshot: ${escapeHtml(entry.snapshotChecksum || "not recorded")}; rights: ${escapeHtml(entry.rights?.license || entry.rights?.status || "not recorded")}</span><br><span>${escapeHtml(entry.reason)}</span></li>`).join("")}</ul>`;
}

function renderRecipe(recipe) {
  return `<li><code>${escapeHtml(recipe.patternId)}</code> <span class="tag">${escapeHtml(recipe.patternType)}</span><br>${escapeHtml(recipe.summary.join("; ") || "No recipe traits recorded.")}<br><span>evidence IDs: ${escapeHtml(recipe.sourceEvidenceIds.join(", ") || "none")}</span>${htmlControls(recipe.patternId, "pattern")}</li>`;
}

function renderHtml(queue) {
  const packageSections = queue.packageReview.map((packageRow) => {
    const targetRows = queue.variantReviewQueue.filter((row) => row.packageId === packageRow.packageId);
    const recipeGroups = Object.entries(packageRow.declaredRecipeReview).sort(([a], [b]) => a.localeCompare(b));
    return `<section class="package" id="${escapeHtml(packageRow.packageId)}"><header><h2>${escapeHtml(packageRow.packageId)}</h2><p>Target/source contract: ${escapeHtml(packageRow.variantAlignment.status)}. Declared recipe variants: ${escapeHtml(packageRow.declaredRecipeVariantIds.join(", "))}</p></header><div class="target-grid">${targetRows.map((row) => `<article class="variant"><h3>${escapeHtml(row.targetVariantId)}</h3><p>Status: <strong>${escapeHtml(row.status)}</strong>. Source associations: ${row.sourceEvidence.length}.</p>${renderSourceEvidence(row.sourceEvidence)}${row.sourceRecipeProposals.length ? `<details><summary>Source-proposed recipe summaries (${row.sourceRecipeProposals.length})</summary><ul class="recipes">${row.sourceRecipeProposals.map(renderRecipe).join("")}</ul></details>` : ""}${htmlControls(row.queueId, "target variant")}<details><summary>Promotion prerequisites</summary><ol>${row.promotionPrerequisites.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></details></article>`).join("")}</div><details class="recipe-catalog"><summary>Declared local recipe review (${Object.values(packageRow.declaredRecipeReview).flat().length} proposed patterns)</summary>${recipeGroups.map(([variantId, recipes]) => `<article class="recipe-group"><h3>${escapeHtml(variantId)} (${recipes.length})</h3><ul class="recipes">${recipes.map(renderRecipe).join("")}</ul></article>`).join("")}</details></section>`;
  }).join("\n");
  const knowledgeGate = queue.finalEvidenceStatus.knowledgeFinalStatus;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Style RAG Phase 1 Human Review Queue</title><style>
  :root{font-family:Arial,sans-serif;color:#17212b;background:#f4f6f8}body{margin:0}.wrap{max-width:1500px;margin:auto;padding:20px}.top{border-bottom:2px solid #1d4f6e;padding-bottom:14px}h1{margin:0;font-size:28px}h2{font-size:20px;margin:0}h3{font-size:16px;margin:0 0 8px}p{line-height:1.45}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin:16px 0}.metric{background:#fff;border:1px solid #cbd5df;padding:10px;border-radius:4px}.metric strong{display:block;font-size:22px}.notice{background:#fff6dc;border-left:4px solid #a76500;padding:10px}.package{background:#fff;border:1px solid #b7c5d1;margin:18px 0;border-radius:4px}.package>header{padding:14px;background:#e7eef4}.target-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:10px;padding:12px}.variant,.recipe-group{border:1px solid #d2dce5;padding:10px;border-radius:4px;background:#fbfcfd}.sources,.recipes{padding-left:20px}.sources li,.recipes li{margin:0 0 11px}.tag{display:inline-block;background:#dcebf6;border:1px solid #abc5d8;padding:1px 5px;border-radius:3px;font-size:12px}.controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px;font-size:13px}.controls label{display:flex;gap:4px;align-items:center}.controls input:not([type=checkbox]){width:100%;min-width:0}.recipe-catalog{padding:12px;border-top:1px solid #b7c5d1}.recipe-group{margin:10px 0}.empty{color:#6b3d00}.checks{font-family:monospace;font-size:12px;word-break:break-all}a{color:#075d98}@media(max-width:620px){.wrap{padding:10px}.controls{grid-template-columns:1fr}}
</style></head><body><main class="wrap"><header class="top"><h1>Style RAG Phase 1 Human Review Queue</h1><p>Operational review artifact. No source or pattern is approved, promoted, canonical, or renderer-eligible through this page.</p></header><p class="notice"><strong>Excluded:</strong> Supplement B is Luna fail-closed; Supplement C has no Luna verification and is unverified/conflicted. Supplement A sources are included because Luna independently proved 15 eligible unique sources, while its run-level report defect remains visible in the JSON provenance.</p><section class="summary">${[["Unique review-eligible sources", queue.counts.globallyUniqueReviewEligibleSources], ["Target packages", queue.counts.targetPackages], ["Target variants", queue.counts.targetVariants], ["Proposed patterns", queue.counts.proposedPatterns], ["Approved / promoted", "0 / 0"], ["Variant contracts reconciled", `${queue.counts.alignedPackageVariantContracts}/14`]].map(([label, value]) => `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</section><p class="checks">Knowledge technical gate: ${escapeHtml(knowledgeGate.status)} | ${escapeHtml(knowledgeGate.knowledgeTest.passed)} pass, ${escapeHtml(knowledgeGate.knowledgeTest.failed)} fail, ${escapeHtml(knowledgeGate.knowledgeTest.skipped)} Windows EPERM skips | source verdict: ${escapeHtml(knowledgeGate.sourceVerdict)}</p><p class="checks">Validation: ${escapeHtml(queue.validation.status)} | queue checksum: ${escapeHtml(queue.validation.queueChecksum)} | input checksum: ${escapeHtml(queue.validation.deterministicInputChecksum)}</p>${packageSections}</main></body></html>`;
}

function renderLedger(queue) {
  const sourceTypeRows = Object.entries(queue.counts.sourceTypes).map(([type, count]) => `| ${type} | ${count} |`).join("\n");
  const alignmentRows = queue.packageReview.map((packageRow) => `| ${packageRow.packageId} | ${packageRow.targetVariantIds.length} | ${packageRow.declaredRecipeVariantIds.length} | ${packageRow.variantAlignment.status} |`).join("\n");
  return `# Style RAG Phase 1 Completion Ledger

- **Scope:** aggregation-only review artifact for \`visual-style\` evidence.
- **Authority boundary:** this ledger neither approves, promotes, classifies, ingests, nor renders anything.
- **Validation:** \`${queue.validation.status}\`; queue checksum \`${queue.validation.queueChecksum}\`.

## Structural Inventory Achieved

| Measure | Structural evidence | Count | Credit status |
|---|---|---:|---|
| Review-eligible sources | 82 baseline globally unique + 15 supplement A + 5 supplement D | 102 | Pending human source review; not approved or canonical |
| Package artifacts | Local \`style-package.json\` inventory | 14 | Structural inventory only; not renderable credit |
| Target variant contract | 14 packages x 5 standard variant IDs | 70 | Target rows created; schema/fixture/render QA not credited |
| Proposed pattern recipes | Local \`visual-patterns.json\` inventory | 420 | Proposed only; not approved or canonical |

The source total deliberately excludes Supplement B (Luna fail-closed: zero eligible) and Supplement C (unverified/conflicted; no Luna verification artifact). Supplement A is included only at source eligibility level: Luna verified 15 unique eligible sources but flagged a run-report defect. No exception turns that result into approval or promotion.

## Source Type Inventory

| Source type | Unique review-eligible sources |
|---|---:|
${sourceTypeRows}

## Contract Reconciliation

The queue retains the Phase 1 target contract separately from declared local recipe variant IDs. This is intentional: no variant mapping is inferred or classified by aggregation.

| Package | Target variants | Declared recipe variants | Status |
|---|---:|---:|---|
${alignmentRows}

\`${queue.counts.alignedPackageVariantContracts}\` package contracts align exactly; \`${queue.counts.packageVariantContractsRequiringReconciliation}\` require explicit reconciliation before a target variant can use a locally declared recipe as evidence.

## Final Evidence Status

| Gate | Latest evidence | Status | Credit effect |
|---|---|---|---|
| Luna data audit v3 | Exact 14 packages / 70 variants / 420 proposed patterns; ${queue.finalEvidenceStatus.globalDataAudit.path} | ${queue.finalEvidenceStatus.globalDataAudit.status} | Structural and evidence-data validation only; no approval or promotion. |
| Strict visual package validation | ${queue.finalEvidenceStatus.strictVisualPackages.validPackages}/${queue.finalEvidenceStatus.strictVisualPackages.validPackages} valid packages; ${queue.finalEvidenceStatus.strictVisualPackages.packageErrors} package errors | ${queue.finalEvidenceStatus.strictVisualPackages.status} | Package validity does not create renderable or canonical credit. |
| Luna 70-still technical audit | ${queue.finalEvidenceStatus.stillAudit.registryRecords} registry records and ${queue.finalEvidenceStatus.stillAudit.verifiedPngOutputs} PNG outputs verified; ${queue.finalEvidenceStatus.stillAudit.path} | ${queue.finalEvidenceStatus.stillAudit.status} | Technical still evidence only; human visual approval remains ${queue.finalEvidenceStatus.stillAudit.humanVisualApproval}. |
| Knowledge final status | ${queue.finalEvidenceStatus.knowledgeFinalStatus.source}; runtime projection ${queue.finalEvidenceStatus.knowledgeFinalStatus.projectedVariants} variants / ${queue.finalEvidenceStatus.knowledgeFinalStatus.projectedPatterns} patterns; knowledge:test ${queue.finalEvidenceStatus.knowledgeFinalStatus.knowledgeTest.passed} pass, ${queue.finalEvidenceStatus.knowledgeFinalStatus.knowledgeTest.failed} fail, ${queue.finalEvidenceStatus.knowledgeFinalStatus.knowledgeTest.skipped} Windows EPERM skips (${queue.finalEvidenceStatus.knowledgeFinalStatus.knowledgeTest.failureClassification}); raw Luna verdict ${queue.finalEvidenceStatus.knowledgeFinalStatus.sourceVerdict}; ${queue.finalEvidenceStatus.knowledgeFinalStatus.path} | ${queue.finalEvidenceStatus.knowledgeFinalStatus.status} | Proposed records remain excluded; no canonical retrieval, approval, or promotion credit. |

All Luna technical gates passed. The raw runtime verdict retains PASS_WITH_ENVIRONMENTAL_SKIPS because Windows denied the three required symlink cases with EPERM.

## Pending Gates

1. Human reviewer records source approve/reject decisions against each exact revision, snapshot checksum, and rights record.
2. Human reviewer records pattern approve/reject decisions. Source approval does not approve any proposed pattern.
3. Approved records enter the canonical approval/promotion flow outside this report.
4. Canonical ingest, compiler, and SQLite projection complete and are independently verified by Luna.
5. Target variants obtain renderer registration, deterministic fixtures, still/render QA, and human visual review.
6. Luna recomputes corpus, renderer, retrieval, and QA gates after canonical promotion.

## Completion Credit

| Measure | Target | Credited | Why credit remains zero |
|---|---:|---:|---|
| Unique approved sources | 100 | 0 | 102 records are review-eligible only; no human approval or canonical promotion exists. |
| Renderable packages | 14 | 0 | Package inventory is not renderer registration plus QA evidence. |
| Schema-valid/QA-passed variants | 70 | 0 | 70-still technical audit passes, but canonical eligibility/promotion and human visual approval remain pending. |
| Approved visual patterns | 300-600 (target 420) | 0 | 420 records are proposed; no human pattern approval or canonical ingest exists. |

## Deterministic Reproduction

Run \`node scripts/reports/style-rag-phase1-review.mjs --check\` to recompute counts and compare the owned artifacts byte-for-byte. Run with \`--write\` to regenerate only this ledger and the paired JSON/HTML review reports.
`;
}

function main() {
  const mode = process.argv[2] || "--check";
  assert(["--check", "--write"].includes(mode), "usage: node scripts/reports/style-rag-phase1-review.mjs [--check|--write]");
  const queue = buildQueue();
  const json = `${JSON.stringify(queue, null, 2)}\n`;
  const html = `${renderHtml(queue)}\n`;
  const ledger = renderLedger(queue);
  if (mode === "--write") {
    writeFileSync(outputPaths.json, json);
    writeFileSync(outputPaths.html, html);
    writeFileSync(outputPaths.ledger, ledger);
    process.stdout.write(`Wrote review queue: ${queue.counts.globallyUniqueReviewEligibleSources} sources, ${queue.counts.targetPackages} packages, ${queue.counts.targetVariants} variants, ${queue.counts.proposedPatterns} proposed patterns.\n`);
    return;
  }
  for (const [name, expected] of [["json", json], ["html", html], ["ledger", ledger]]) {
    assert(existsSync(outputPaths[name]), `${toPosix(outputPaths[name])} is missing; run with --write`);
    assert(readText(outputPaths[name]) === expected, `${toPosix(outputPaths[name])} is stale; run with --write`);
  }
  process.stdout.write(`Review queue validation passed: ${queue.validation.queueChecksum}.\n`);
}

main();
