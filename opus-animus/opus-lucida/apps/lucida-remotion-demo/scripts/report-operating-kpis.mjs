#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { writeStableJson } from "./knowledge/index-utils.mjs";

const DEFAULT_RUN_IDS = ["w9-ai-weekly-auto-20260716", "w9-ai-weekly-locked-20260716"];
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const ratio = (numerator, denominator) => denominator ? numerator / denominator : null;
const maxConsecutive = (values) => {
  let longest = values.length ? 1 : 0;
  let current = longest;
  for (let index = 1; index < values.length; index += 1) {
    current = values[index] === values[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
};
const statusFor = (value, predicate) => value === null ? "NO_DATA" : predicate(value) ? "PASS" : "FAIL";
const isPassed = (status) => status === "passed" || status === "pass";
const AUDIO_CAPTION_CHECK_IDS = new Set(["audio-stream", "audio-non-silent", "audio-clipping", "caption-timing"]);

const loadRun = (appRoot, runId) => {
  const root = path.join(appRoot, "pipeline", "runs", runId);
  const envelope = readJson(path.join(root, "run-envelope.json"));
  const videoMap = readJson(path.join(root, "05-video-map.json"));
  if (envelope.lane === "production") {
    const flowRoot = path.join(appRoot, "output", "render", "flow-runs", runId);
    return {
      runId,
      envelope,
      videoMap,
      scenes: readJson(path.join(root, "04-visual-scenes.json")),
      normalized: readJson(path.join(root, "03-normalized-input.json")),
      flowReport: readJson(path.join(flowRoot, "flow-report.json")),
      qaReport: readJson(path.join(flowRoot, "qa-report.json")),
      renderReport: readJson(path.join(flowRoot, "render-report.json")),
    };
  }
  return {
    runId,
    envelope,
    scenes: readJson(path.join(root, "04-visual-scenes.json")),
    videoMap,
    report: readJson(path.join(root, "report.json")),
  };
};

const hasAudioCaptionPass = (qaReport) => {
  const checks = new Map(qaReport.checks?.map((check) => [check.id, check.status]));
  return [...AUDIO_CAPTION_CHECK_IDS].every((id) => isPassed(checks.get(id)));
};

const approvedStillQa = (qaReport) => qaReport.checks?.find((check) =>
  check.id === "still-qa" && check.evidence?.firstPassPassed === true && isPassed(check.status),
);

export const buildOperatingKpiReport = ({ appRoot = process.cwd(), runIds = DEFAULT_RUN_IDS } = {}) => {
  const pilots = runIds.map((runId) => loadRun(appRoot, runId));
  const rapidRuns = pilots.filter((pilot) => pilot.envelope.lane !== "production");
  const productionRuns = pilots.filter((pilot) => pilot.envelope.lane === "production");
  const allInputs = pilots.flatMap((pilot) => pilot.scenes.scenes).map((scene) => ({
    evidence: (scene.knowledgeEvidence ?? []).length > 0,
    provenance: scene.blocks?.length > 0
      && scene.blocks.every((block) => (block.sourceEventIds ?? []).length > 0)
      && scene.directorSelection?.semanticInputs?.eventId,
  }));
  const evidenceScenes = allInputs.filter((input) => input.evidence).length;
  const provenanceScenes = allInputs.filter((input) => input.provenance).length;
  const autoSelections = rapidRuns.filter((pilot) => pilot.envelope.styleMode === "auto")
    .flatMap((pilot) => pilot.scenes.directorSelection?.selections ?? []);
  const autoOverrides = autoSelections.filter((selection) => selection.mode !== "auto" || selection.lockedBy).length;
  const layoutLongest = Math.max(...pilots.map((pilot) => maxConsecutive(pilot.videoMap.scenes.map((scene) => scene.layout))), 0);
  const audioCaptionValue = productionRuns.length
    ? ratio(productionRuns.filter((pilot) => hasAudioCaptionPass(pilot.qaReport)).length, productionRuns.length)
    : null;
  const stillQaRuns = productionRuns.filter((pilot) => approvedStillQa(pilot.qaReport));
  const stillQaValue = stillQaRuns.length ? ratio(stillQaRuns.length, productionRuns.length) : null;
  const publishValue = productionRuns.length
    ? ratio(productionRuns.filter((pilot) =>
      pilot.flowReport.status !== "awaiting_final_approval"
      && isPassed(pilot.qaReport.status)
      && Boolean(pilot.renderReport.output),
    ).length, productionRuns.length)
    : null;

  const metrics = {
    ragEvidenceCoverage: {
      numerator: evidenceScenes,
      denominator: allInputs.length,
      value: ratio(evidenceScenes, allInputs.length),
      target: ">=0.95",
    },
    provenanceCompleteness: {
      numerator: provenanceScenes,
      denominator: allInputs.length,
      value: ratio(provenanceScenes, allInputs.length),
      target: "1.0",
    },
    autoStyleOverrideRate: {
      numerator: autoOverrides,
      denominator: autoSelections.length,
      value: ratio(autoOverrides, autoSelections.length),
      target: "<0.20",
    },
    layoutRepetition: {
      numerator: layoutLongest,
      denominator: null,
      value: layoutLongest,
      target: "<=2",
    },
    audioCaptionPass: {
      numerator: null,
      denominator: productionRuns.length,
      value: audioCaptionValue,
      target: "1.0",
    },
    firstPassStillQa: {
      numerator: null,
      denominator: productionRuns.length,
      value: stillQaValue,
      target: ">=0.90",
    },
    publishReadiness: {
      numerator: null,
      denominator: productionRuns.length,
      value: publishValue,
      target: ">=0.95",
    },
  };
  metrics.ragEvidenceCoverage.status = statusFor(metrics.ragEvidenceCoverage.value, (value) => value >= 0.95);
  metrics.provenanceCompleteness.status = statusFor(metrics.provenanceCompleteness.value, (value) => value === 1);
  metrics.autoStyleOverrideRate.status = statusFor(metrics.autoStyleOverrideRate.value, (value) => value < 0.2);
  metrics.layoutRepetition.status = statusFor(metrics.layoutRepetition.value, (value) => value <= 2);
  metrics.audioCaptionPass.status = statusFor(metrics.audioCaptionPass.value, (value) => value === 1);
  metrics.firstPassStillQa.status = statusFor(metrics.firstPassStillQa.value, (value) => value >= 0.9);
  metrics.publishReadiness.status = statusFor(metrics.publishReadiness.value, (value) => value >= 0.95);

  return {
    schemaVersion: "lucida-operating-kpi-report/v1",
    generatedAt: pilots.map((pilot) => pilot.report?.completedAt ?? pilot.flowReport?.completedAt).filter(Boolean).sort().at(-1),
    scope: { runIds, rapidRuns: rapidRuns.length, productionRuns: productionRuns.length },
    overallStatus: Object.values(metrics).some((metric) => metric.status === "FAIL")
      ? "FAIL"
      : Object.values(metrics).some((metric) => metric.status === "NO_DATA") ? "INCOMPLETE" : "PASS",
    metrics,
    runs: pilots.map((pilot) => ({
      runId: pilot.runId,
      lane: pilot.envelope.lane,
      styleMode: pilot.envelope.styleMode,
      publicationStatus: pilot.envelope.publicationStatus,
      sceneCount: pilot.videoMap.scenes.length,
      packageIds: [...new Set((pilot.scenes?.scenes ?? pilot.videoMap.scenes).map((scene) => scene.packageId ?? scene.visualFamily))],
      layouts: pilot.videoMap.scenes.map((scene) => scene.layout),
      maxConsecutiveLayout: maxConsecutive(pilot.videoMap.scenes.map((scene) => scene.layout)),
    })),
    decision: productionRuns.length
      ? "Production gates are computed from bound QA, render, and flow artifacts; final approval is still required before publish."
      : "Rapid pilot metrics are valid; production audio, still QA, and publish readiness remain unproven.",
  };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const runIds = process.argv.flatMap((argument, index, argv) => argument === "--run-id" ? [argv[index + 1]] : []).filter(Boolean);
  const report = buildOperatingKpiReport({ runIds: runIds.length ? runIds : DEFAULT_RUN_IDS });
  const output = path.resolve(process.cwd(), "design", "reports", "W9_OPERATING_KPI_REPORT.json");
  writeStableJson(output, report);
  console.log(`Operating KPI report: ${report.overallStatus} -> ${path.relative(process.cwd(), output)}`);
}
