#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { writeStableJson } from "./index-utils.mjs";

const PACKAGE_IDS = [
  "terminal-command-center", "technical-editorial", "minimal-education", "cinematic-type",
  "dashboard-data", "paper-notebook", "product-showcase", "editorial-collage", "timeline-documentary",
];
const PACKAGE_FOR_FAMILY = {
  terminal: "terminal-command-center",
  code: "terminal-command-center",
  infographic: "technical-editorial",
  dashboard: "dashboard-data",
  data_visualization: "dashboard-data",
  editorial: "editorial-collage",
  product_demo: "product-showcase",
  cinematic_typography: "cinematic-type",
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const packageIdFor = (value) => PACKAGE_IDS.includes(value) ? value : PACKAGE_FOR_FAMILY[value] ?? null;

const canonicalSources = (appRoot) => {
  const library = path.join(appRoot, "design", "knowledge", "reference-library");
  const sources = [];
  for (const typeEntry of fs.readdirSync(library, { withFileTypes: true })) {
    if (!typeEntry.isDirectory()) continue;
    const typeRoot = path.join(library, typeEntry.name);
    for (const packageEntry of fs.readdirSync(typeRoot, { withFileTypes: true })) {
      if (!packageEntry.isDirectory()) continue;
      const root = path.join(typeRoot, packageEntry.name);
      const source = readJson(path.join(root, "source.json"));
      const documentsRoot = path.join(root, "documents");
      const documents = fs.readdirSync(documentsRoot).filter((name) => name.endsWith(".json"))
        .map((name) => readJson(path.join(documentsRoot, name)));
      const packageIds = new Set();
      for (const document of documents) {
        for (const observation of document.observations ?? []) {
          const definition = observation.definition ?? {};
          for (const value of [definition.packageId, definition.family, definition.visualFamily]) {
            const packageId = packageIdFor(value);
            if (packageId) packageIds.add(packageId);
          }
        }
        for (const tag of document.tags ?? []) {
          const packageId = packageIdFor(tag);
          if (packageId) packageIds.add(packageId);
        }
      }
      sources.push({
        sourceId: source.sourceId,
        sourceType: source.sourceType,
        packageIds: [...packageIds].sort(),
        approved: source.approval?.status === "approved" && source.rights?.status === "approved",
        sourceRevision: source.sourceRevision,
      });
    }
  }
  return sources;
};

const prepareCandidateArtifact = ({ catalog, outputPath }) => {
  const sources = catalog.candidates.map((candidate) => {
    const rawText = [
      `# ${candidate.title}`,
      "",
      `Source: ${candidate.sourceRef}`,
      `Target package: ${candidate.packageId}`,
      "",
      "Reviewer-authored concepts:",
      ...candidate.concepts.map((concept) => `- ${concept}`),
      "",
      catalog.policy,
    ].join("\n");
    const checksum = sha256(rawText.normalize("NFC"));
    return {
      sourceId: candidate.sourceId,
      sourceType: candidate.sourceType,
      domain: "visual-style",
      collectorVersion: "w8-link-note-collector/1",
      checksum,
      sourceRevision: candidate.sourceRevision,
      metadata: { url: candidate.sourceRef, targetPackageId: candidate.packageId },
      records: [{
        kind: "layout_reference",
        text: rawText,
        data: { packageId: candidate.packageId, tags: [candidate.packageId, "w8-candidate", "link-only"] },
        provenance: {
          sourceRef: candidate.sourceRef,
          sourceChecksum: checksum,
          collectorVersion: "w8-link-note-collector/1",
        },
      }],
    };
  });
  const artifact = {
    schemaVersion: "sanitized-visual-input/v1",
    projectId: "lucida-remotion-demo-w8-evidence",
    generatedAt: `${catalog.preparedAt}T00:00:00.000Z`,
    sanitization: {
      status: "passed",
      redactions: 0,
      findings: ["Link-only reviewer notes; no third-party source body or media is stored."],
    },
    sources,
  };
  writeStableJson(outputPath, artifact);
  return artifact;
};

const metricsFor = (sources, packageId) => {
  const matched = sources.filter((source) => source.approved && source.packageIds.includes(packageId));
  return {
    sourceCount: new Set(matched.map((source) => source.sourceId)).size,
    sourceTypes: [...new Set(matched.map((source) => source.sourceType))].sort(),
    sourceIds: matched.map((source) => source.sourceId).sort(),
  };
};

export const auditEvidenceBreadth = ({ appRoot = process.cwd() } = {}) => {
  const catalogPath = path.join(appRoot, "design", "knowledge", "evidence-candidates", "w8-catalog.json");
  const reportsRoot = path.join(appRoot, "design", "knowledge", "reports");
  const candidatePath = path.join(reportsRoot, "w8-evidence-candidates.sanitized.json");
  const reportPath = path.join(reportsRoot, "evidence-breadth-v1.json");
  const markdownPath = path.join(reportsRoot, "evidence-breadth-v1.md");
  const catalog = readJson(catalogPath);
  const canonical = canonicalSources(appRoot);
  const candidateArtifact = prepareCandidateArtifact({ catalog, outputPath: candidatePath });
  const approvedCandidateIds = new Set(canonical.filter((source) => source.approved).map((source) => source.sourceId));
  const candidatesAreApproved = catalog.candidates.every((candidate) =>
    approvedCandidateIds.has(`source:reference:${candidate.sourceId}`),
  );
  const projected = [
    ...canonical,
    ...candidateArtifact.sources.filter((source) =>
      !approvedCandidateIds.has(`source:reference:${source.sourceId}`),
    ).map((source) => ({
      sourceId: source.sourceId,
      sourceType: source.sourceType === "web_reference" ? "web" : source.sourceType,
      packageIds: [source.metadata.targetPackageId],
      approved: true,
      sourceRevision: source.sourceRevision,
    })),
  ];
  const packages = PACKAGE_IDS.map((packageId) => {
    const approved = metricsFor(canonical, packageId);
    const ifCandidatesApproved = metricsFor(projected, packageId);
    return {
      packageId,
      approved,
      ifCandidatesApproved,
      gatePassed: approved.sourceCount >= 3 && approved.sourceTypes.length >= 2,
      projectedGatePassed: ifCandidatesApproved.sourceCount >= 3 && ifCandidatesApproved.sourceTypes.length >= 2,
      gaps: [
        ...(approved.sourceCount < 3 ? [`needs ${3 - approved.sourceCount} more approved source(s)`] : []),
        ...(approved.sourceTypes.length < 2 ? [`needs ${2 - approved.sourceTypes.length} more approved source type(s)`] : []),
      ],
    };
  });
  const report = {
    schemaVersion: "lucida-evidence-breadth-report/v1",
    generatedAt: `${catalog.preparedAt}T00:00:00.000Z`,
    gate: { minimumPackages: 5, minimumSourcesPerPackage: 3, minimumSourceTypesPerPackage: 2 },
    actualPassingPackages: packages.filter((item) => item.gatePassed).length,
    projectedPassingPackages: packages.filter((item) => item.projectedGatePassed).length,
    humanApprovalRequired: !candidatesAreApproved,
    candidatesAreApproved,
    packages,
  };
  writeStableJson(reportPath, report);
  const lines = [
    "# W8 Evidence Breadth Audit", "",
    `- Actual gate: ${report.actualPassingPackages}/5 packages`,
    `- Projected after explicit human approval: ${report.projectedPassingPackages}/5 packages`,
    `- Candidate status: ${candidatesAreApproved ? "approved and promoted" : "pending human rights and approval review"}`, "",
    "| Package | Approved sources | Types | Actual | Projected | Gap |", "|---|---:|---|---|---|---|",
    ...packages.map((item) => `| ${item.packageId} | ${item.approved.sourceCount} | ${item.approved.sourceTypes.join(", ") || "none"} | ${item.gatePassed ? "PASS" : "FAIL"} | ${item.projectedGatePassed ? "PASS" : "FAIL"} | ${item.gaps.join("; ") || "none"} |`),
    "", "## Decision Boundary", "",
    candidatesAreApproved
      ? "HUY approved and promoted all W8 candidates. The raw candidate artifact remains unapproved by design; canonical approval artifacts and source packages are the source of truth."
      : "The prepared artifact is sanitized but intentionally has no approval or rights decision. Run `knowledge:approve` only after a human confirms the immutable revision, link-only policy, rights evidence, reviewer identity, and approval timestamp for each source. Then run `knowledge:promote`, `knowledge:qa`, and this audit again.", "",
    "## Candidate Review Queue", "",
    "| Source ID | Package | Type | Immutable revision | Source |", "|---|---|---|---|---|",
    ...catalog.candidates.map((candidate) => `| ${candidate.sourceId} | ${candidate.packageId} | ${candidate.sourceType} | ${candidate.sourceRevision} | ${candidate.sourceRef} |`),
    "",
  ];
  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);
  return { report, reportPath, candidatePath, markdownPath };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditEvidenceBreadth();
  console.log(`Evidence breadth: ${result.report.actualPassingPackages}/5 actual, ${result.report.projectedPassingPackages}/5 projected.`);
  if (result.report.actualPassingPackages < result.report.gate.minimumPackages) process.exitCode = 2;
}
