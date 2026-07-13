#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.resolve(appRoot, relativePath), "utf8"));
const readJsonAbsolute = (absolutePath) =>
  JSON.parse(fs.readFileSync(absolutePath, "utf8"));

const rules = readJson("design/directors/selection-rules.json");
const fixtureRoot = path.resolve(appRoot, "pipeline/fixtures/director");
const candidateById = new Map((rules.productionCandidates ?? []).map((candidate) => [candidate.id, candidate]));
const packageById = new Map(
  (rules.productionCandidates ?? []).map((candidate) => [
    candidate.id,
    readJsonAbsolute(path.resolve(appRoot, candidate.packageRef)),
  ]),
);
const failures = [];
let sceneCaseCount = 0;
let continuityCaseCount = 0;

for (const fixturePath of findFixtureFiles(fixtureRoot)) {
  const fixture = readJsonAbsolute(fixturePath);
  for (const testCase of fixture.cases ?? []) {
    sceneCaseCount += 1;
    assertSceneCase(fixture.fixtureId, testCase);
  }
  for (const testCase of fixture.continuityCases ?? []) {
    continuityCaseCount += 1;
    assertContinuityCase(fixture.fixtureId, testCase);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`ERROR: ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Design director tests passed: ${sceneCaseCount} scene cases, ${continuityCaseCount} continuity cases.`,
);

function assertSceneCase(fixtureId, testCase) {
  const label = `${fixtureId}/${testCase.id}`;
  const evaluation = evaluateScene(testCase.scene);
  const selectedFamilyId = evaluation.selected?.familyId ?? null;

  if (selectedFamilyId !== testCase.expect.selected) {
    fail(label, `selected ${selectedFamilyId}, expected ${testCase.expect.selected}.`);
  }

  if (!evaluation.selected || evaluation.selected.selectedReasons.length === 0) {
    fail(label, "selected candidate did not record selectedReasons.");
  }

  for (const candidate of evaluation.candidates) {
    if (candidate.status === "rejected" && candidate.rejectedReasons.length === 0) {
      fail(label, `${candidate.familyId} was rejected without rejectedReasons.`);
    }
    if (candidate.status === "accepted" && candidate.selectedReasons.length === 0) {
      fail(label, `${candidate.familyId} was accepted without selectedReasons.`);
    }
  }

  for (const expected of testCase.expect.rejected ?? []) {
    const rejected = evaluation.candidates.find(
      (candidate) => candidate.familyId === expected.familyId && candidate.status === "rejected",
    );
    if (!rejected) {
      fail(label, `${expected.familyId} was not rejected.`);
      continue;
    }
    if (
      expected.filterId &&
      !rejected.rejectedReasons.some((reason) => reason.filterId === expected.filterId)
    ) {
      fail(label, `${expected.familyId} was rejected without filter ${expected.filterId}.`);
    }
  }

  assertHardSelectionRules(label, testCase.scene, evaluation);
}

function evaluateScene(scene) {
  const candidates = rules.intentToFamily?.[scene.intent] ?? [];
  const evaluations = candidates.map((familyId) => evaluateCandidate(familyId, scene));
  return {
    intent: scene.intent,
    candidates: evaluations,
    selected: evaluations.find((candidate) => candidate.status === "accepted") ?? null,
  };
}

function evaluateCandidate(familyId, scene) {
  const candidate = candidateById.get(familyId);
  const pkg = packageById.get(familyId);
  const selectedReasons = [
    formatReason(rules.intentReasonTemplate.selected, scene.intent, familyId),
    candidate?.selectedReason,
    pkg?.directorCompatibility?.selectionReason,
  ].filter(Boolean);
  const rejectedReasons = [];

  for (const filter of rules.contentFitFilters ?? []) {
    if (!filterApplies(filter, familyId)) {
      continue;
    }
    const result = applyFilter(filter, scene.content ?? {}, pkg);
    if (result.ok) {
      selectedReasons.push(`[${filter.id}] ${filter.selectedReason}`);
    } else {
      rejectedReasons.push({
        filterId: filter.id,
        reason: filter.rejectedReason,
        detail: result.detail,
      });
    }
  }

  return {
    familyId,
    status: rejectedReasons.length > 0 ? "rejected" : "accepted",
    selectedReasons,
    rejectedReasons,
  };
}

function applyFilter(filter, content, pkg) {
  const failed = [];

  for (const check of filter.checks ?? []) {
    const metricValue = numericContent(content, check.metric);
    const capacityValue = numericCapacity(pkg, check.capacity);
    if (metricValue > capacityValue) {
      failed.push(`${check.metric}=${metricValue} > ${check.capacity}=${capacityValue}`);
    }
  }

  for (const [key, expectedValue] of Object.entries(filter.requires ?? {})) {
    if (content[key] !== expectedValue) {
      failed.push(`${key}=${JSON.stringify(content[key])} expected ${JSON.stringify(expectedValue)}`);
    }
  }

  if (Array.isArray(filter.requiresAnyAssetClassification)) {
    const available = new Set(content.assetClassifications ?? []);
    const hasRequired = filter.requiresAnyAssetClassification.some((classification) =>
      available.has(classification),
    );
    if (!hasRequired) {
      failed.push(`assetClassifications lacks ${filter.requiresAnyAssetClassification.join(" or ")}`);
    }
  }

  if (filter.range) {
    const value = numericContent(content, filter.range.metric);
    if (value < filter.range.min || value > filter.range.max) {
      failed.push(
        `${filter.range.metric}=${value} outside ${filter.range.min}..${filter.range.max}`,
      );
    }
  }

  return failed.length === 0
    ? {ok: true, detail: null}
    : {ok: false, detail: failed.join("; ")};
}

function assertHardSelectionRules(label, scene, evaluation) {
  if (!evaluation.selected) {
    fail(label, "no candidate was selected.");
    return;
  }

  const selectedId = evaluation.selected.familyId;
  const traits = new Set(candidateById.get(selectedId)?.traits ?? []);
  const assetClassifications = new Set(scene.content?.assetClassifications ?? []);
  if (traits.has("asset-led") && !assetClassifications.has("embed_asset")) {
    fail(label, `${selectedId} is asset-led but scene has no embed_asset.`);
  }
  if (selectedId === "dashboard-data" && scene.content?.hasStructuredNumericData !== true) {
    fail(label, "dashboard-data selected without real structured numeric data.");
  }
}

function assertContinuityCase(fixtureId, testCase) {
  const label = `${fixtureId}/${testCase.id}`;
  const result = evaluateContinuity(testCase.selectedFamilies, testCase.intents);

  if (result.valid !== testCase.expect.valid) {
    fail(label, `continuity valid=${result.valid}, expected ${testCase.expect.valid}.`);
  }
  if (testCase.expect.dominantFamily && result.dominantFamily !== testCase.expect.dominantFamily) {
    fail(
      label,
      `dominantFamily ${result.dominantFamily}, expected ${testCase.expect.dominantFamily}.`,
    );
  }
  for (const expectedError of testCase.expect.errors ?? []) {
    if (!result.errors.includes(expectedError)) {
      fail(label, `missing continuity error ${expectedError}.`);
    }
  }
}

function evaluateContinuity(selectedFamilies, intents) {
  const continuity = rules.continuityRules;
  const counts = new Map();
  const firstSeen = new Map();
  selectedFamilies.forEach((familyId, index) => {
    counts.set(familyId, (counts.get(familyId) ?? 0) + 1);
    if (!firstSeen.has(familyId)) {
      firstSeen.set(familyId, index);
    }
  });

  const [dominantFamily, dominantCount] = [...counts.entries()].sort((left, right) => {
    const countDelta = right[1] - left[1];
    if (countDelta !== 0) {
      return countDelta;
    }
    return firstSeen.get(left[0]) - firstSeen.get(right[0]);
  })[0] ?? [null, 0];

  const errors = [];
  const dominantShare = selectedFamilies.length === 0 ? 0 : dominantCount / selectedFamilies.length;
  if (dominantShare < continuity.dominantFamilyMinimumShare) {
    errors.push("dominantFamilyMinimumShare");
  }
  if (counts.size > continuity.maxVisualFamiliesForShort) {
    errors.push("maxVisualFamiliesForShort");
  }

  const lastIntent = intents[intents.length - 1];
  const lastFamily = selectedFamilies[selectedFamilies.length - 1];
  if (
    continuity.returnToDominantFamilyForOutro &&
    continuity.outroIntents.includes(lastIntent) &&
    lastFamily !== dominantFamily
  ) {
    errors.push("returnToDominantFamilyForOutro");
  }

  for (let index = 1; index < selectedFamilies.length; index += 1) {
    const from = selectedFamilies[index - 1];
    const to = selectedFamilies[index];
    const state = continuity.compatibilityMatrix?.[from]?.[to];
    if (state === "avoid" || state === "block") {
      errors.push("compatibilityMatrix");
    }
  }

  return {
    valid: errors.length === 0,
    dominantFamily,
    dominantShare,
    errors: [...new Set(errors)],
  };
}

function filterApplies(filter, familyId) {
  return filter.families === "all" || (filter.families ?? []).includes(familyId);
}

function numericContent(content, key) {
  const value = content[key] ?? 0;
  return Number.isFinite(value) ? value : 0;
}

function numericCapacity(pkg, key) {
  const value = pkg?.contentCapacity?.[key] ?? 0;
  return Number.isFinite(value) ? value : 0;
}

function formatReason(template, intent, familyId) {
  return template.replace("{intent}", intent).replace("{familyId}", familyId);
}

function findFixtureFiles(rootDir) {
  return fs
    .readdirSync(rootDir, {withFileTypes: true})
    .filter((entry) => entry.isFile() && entry.name.endsWith(".fixture.json"))
    .map((entry) => path.join(rootDir, entry.name))
    .sort();
}

function fail(label, message) {
  failures.push(`${label}: ${message}`);
}
