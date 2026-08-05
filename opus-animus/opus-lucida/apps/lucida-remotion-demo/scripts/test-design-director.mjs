#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  evaluateContinuity,
  evaluateDirectorSelection,
} from "../pipeline/director/evaluate-candidates.mjs";
import { loadProductionDirector } from "../pipeline/director/load-production-director.mjs";

const appRoot = process.cwd();
const fixtureRoot = path.resolve(appRoot, "pipeline/fixtures/director");
const director = loadProductionDirector({ appRoot });
const failures = [];
let sceneCaseCount = 0;
let continuityCaseCount = 0;

for (const fixturePath of findFixtureFiles(fixtureRoot)) {
  const fixture = readJson(fixturePath);
  for (const testCase of fixture.cases ?? []) {
    sceneCaseCount += 1;
    assertSceneCase(fixture.fixtureId, testCase);
  }
  for (const testCase of fixture.continuityCases ?? []) {
    continuityCaseCount += 1;
    assertContinuityCase(fixture.fixtureId, testCase);
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  process.exit(1);
}
console.log(`Design director tests passed: ${sceneCaseCount} scene cases, ${continuityCaseCount} continuity cases.`);

function assertSceneCase(fixtureId, testCase) {
  const label = `${fixtureId}/${testCase.id}`;
  const evaluation = evaluateDirectorSelection({
    director,
    mode: "auto",
    scene: testCase.scene,
  });
  const selectedFamilyId = evaluation.selected?.familyId ?? null;
  if (selectedFamilyId !== testCase.expect.selected) {
    fail(label, `selected ${selectedFamilyId}, expected ${testCase.expect.selected}.`);
  }
  if (!evaluation.selected || !evaluation.selected.selectedReasons.length) {
    fail(label, "selected candidate did not record selectedReasons.");
  }
  for (const candidate of evaluation.candidates) {
    if (!["accepted", "rejected"].includes(candidate.status)) {
      fail(label, `${candidate.familyId} has invalid status ${candidate.status}.`);
    }
    if (!candidate.componentAvailability || !Array.isArray(candidate.evidenceIds)) {
      fail(label, `${candidate.familyId} did not record component availability and evidence IDs.`);
    }
    if (candidate.status === "rejected" && !candidate.rejectedReasons.length) {
      fail(label, `${candidate.familyId} was rejected without rejectedReasons.`);
    }
    if (candidate.status === "accepted" && !candidate.selectedReasons.length) {
      fail(label, `${candidate.familyId} was accepted without selectedReasons.`);
    }
  }
  for (const expected of testCase.expect.rejected ?? []) {
    const rejected = evaluation.candidates.find((candidate) =>
      candidate.familyId === expected.familyId && candidate.status === "rejected",
    );
    if (!rejected) {
      fail(label, `${expected.familyId} was not rejected.`);
    } else if (expected.filterId && !rejected.rejectedReasons.some((reason) => reason.filterId === expected.filterId)) {
      fail(label, `${expected.familyId} was rejected without filter ${expected.filterId}.`);
    }
  }
}

function assertContinuityCase(fixtureId, testCase) {
  const label = `${fixtureId}/${testCase.id}`;
  const result = evaluateContinuity({
    rules: director.rules,
    selectedFamilies: testCase.selectedFamilies,
    intents: testCase.intents,
  });
  if (result.valid !== testCase.expect.valid) fail(label, `continuity valid=${result.valid}, expected ${testCase.expect.valid}.`);
  if (testCase.expect.dominantFamily && result.dominantFamily !== testCase.expect.dominantFamily) {
    fail(label, `dominantFamily ${result.dominantFamily}, expected ${testCase.expect.dominantFamily}.`);
  }
  for (const expectedError of testCase.expect.errors ?? []) {
    if (!result.errors.includes(expectedError)) fail(label, `missing continuity error ${expectedError}.`);
  }
}

function findFixtureFiles(rootDir) {
  return fs.readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".fixture.json"))
    .map((entry) => path.join(rootDir, entry.name))
    .sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(label, message) {
  failures.push(`${label}: ${message}`);
}
