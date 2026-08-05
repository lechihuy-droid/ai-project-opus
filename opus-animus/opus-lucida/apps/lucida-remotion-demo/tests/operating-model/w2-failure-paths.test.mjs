import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  assertProductionInputsApproved,
  assertPublishableProductionRun,
  finalizeProductionEnvelope,
  promoteRapidRun,
  sha256File,
} from "../../scripts/operating-model/orchestration.mjs";

const root = process.cwd();
const temporaryRun = () => fs.mkdtempSync(path.join(os.tmpdir(), "lucida-w2-failure-"));
const hash = (letter) => `sha256:${letter.repeat(64)}`;
const approval = ({ approvalId, runId, kind, artifactHash, status = "approved" }) => ({
  schemaVersion: "lucida-approval/v1",
  approvalId,
  runId,
  kind,
  status,
  artifactHash,
  approvedBy: "reviewer@example.test",
  approvedAt: "2026-07-16T10:00:00Z",
});

const writePassedQaReport = ({ directory, runId, scriptPath, videoMapPath, videoPath }) => {
  const qaInputPaths = {
    approvedScript: scriptPath,
    sourceVideoMap: videoMapPath,
    timedVideoMap: path.join(directory, "video-map.timed.json"),
    renderProps: path.join(directory, "render-props.json"),
    timedScript: path.join(directory, "timed-script.json"),
    audio: path.join(directory, "voice.wav"),
    normalizedInput: path.join(directory, "normalized-input.json"),
  };
  for (const [name, filePath] of Object.entries(qaInputPaths)) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `fixture-${name}`);
  }
  const qaReportPath = path.join(directory, "qa-report.json");
  fs.writeFileSync(qaReportPath, `${JSON.stringify({
    schemaVersion: "lucida-qa/v1",
    runId,
    phase: "post-render",
    generatedAt: "2026-07-16T10:00:00Z",
    status: "passed",
    inputChecksums: Object.fromEntries(Object.entries(qaInputPaths).map(([name, filePath]) => [name, sha256File(filePath)])),
    renderChecksum: sha256File(videoPath),
    checks: ["audio-stream", "audio-non-silent", "audio-clipping", "caption-timing", "render-integrity"].map((id) => ({ id, status: "passed", evidence: {} })),
  })}\n`);
  return { qaReportPath, qaInputPaths };
};

const createProductionInputs = () => {
  const directory = temporaryRun();
  const scriptPath = path.join(directory, "approved-script.json");
  const videoMapPath = path.join(directory, "video-map.json");
  const videoPath = path.join(directory, "video.mp4");
  fs.writeFileSync(scriptPath, '{"title":"Approved"}\n');
  fs.writeFileSync(videoMapPath, '{"video":true}\n');
  fs.writeFileSync(videoPath, "render-a");
  const runId = "production-w2-test";
  const envelope = {
    schemaVersion: "lucida-run/v1",
    runId,
    lane: "production",
    styleMode: "auto",
    publicationStatus: "promotion_pending",
    approvalRefs: ["treatment", "map"],
  };
  const approvals = [
    approval({ approvalId: "treatment", runId, kind: "visual-treatment", artifactHash: sha256File(scriptPath) }),
    approval({ approvalId: "map", runId, kind: "video-map", artifactHash: sha256File(videoMapPath) }),
    approval({ approvalId: "final", runId, kind: "final-video", artifactHash: sha256File(videoPath) }),
  ];
  const { qaReportPath, qaInputPaths } = writePassedQaReport({ directory, runId, scriptPath, videoMapPath, videoPath });
  return { directory, scriptPath, videoMapPath, videoPath, qaReportPath, qaInputPaths, envelope, approvals };
};

const runScript = (script, args, options = {}) => spawnSync(
  process.execPath,
  [path.join(root, "scripts", script), ...args],
  { cwd: root, encoding: "utf8", ...options },
);

test("rapid direct publish and production lane/status violations are rejected", () => {
  const inputs = createProductionInputs();
  try {
    const rapid = {
      ...inputs.envelope,
      runId: "rapid-w2-direct-publish",
      lane: "rapid-visual-pilot",
      publicationStatus: "non_publishable",
      approvalRefs: [],
    };
    assert.throws(
      () => assertPublishableProductionRun({
        envelope: rapid,
        approvals: [],
        scriptPath: inputs.scriptPath,
        videoMapPath: inputs.videoMapPath,
        videoPath: inputs.videoPath,
      }),
      /publishable production envelope/,
    );

    const alreadyPublishable = { ...inputs.envelope, publicationStatus: "publishable", approvalRefs: ["treatment", "map", "final"] };
    assert.throws(
      () => assertProductionInputsApproved({
        envelope: alreadyPublishable,
        approvals: inputs.approvals,
        scriptPath: inputs.scriptPath,
        videoMapPath: inputs.videoMapPath,
      }),
      /flow:run cannot render an already publishable envelope/,
    );
  } finally {
    fs.rmSync(inputs.directory, { recursive: true, force: true });
  }
});

test("missing, rejected, wrong-run, and duplicate approvals fail closed", () => {
  const inputs = createProductionInputs();
  try {
    const base = { envelope: inputs.envelope, scriptPath: inputs.scriptPath, videoMapPath: inputs.videoMapPath };
    assert.throws(
      () => assertProductionInputsApproved({ ...base, approvals: inputs.approvals.filter(({ approvalId }) => approvalId !== "map") }),
      /references missing approval: map/,
    );
    assert.throws(
      () => assertProductionInputsApproved({
        ...base,
        approvals: inputs.approvals.map((item) => item.approvalId === "map" ? { ...item, status: "rejected" } : item),
      }),
      /approval map is not approved/,
    );
    assert.throws(
      () => assertProductionInputsApproved({
        ...base,
        approvals: inputs.approvals.map((item) => item.approvalId === "map" ? { ...item, runId: "another-run" } : item),
      }),
      /approval map belongs to a different run/,
    );
    assert.throws(
      () => assertProductionInputsApproved({ ...base, approvals: [...inputs.approvals, inputs.approvals[0]] }),
      /approvalIds must be unique/,
    );
  } finally {
    fs.rmSync(inputs.directory, { recursive: true, force: true });
  }
});

test("script, video-map, final-render, and promotion source hash drift is rejected", () => {
  const inputs = createProductionInputs();
  const sourceMapPath = path.join(inputs.directory, "05-video-map.json");
  fs.writeFileSync(sourceMapPath, "pilot-map");
  try {
    fs.appendFileSync(inputs.scriptPath, "drift");
    assert.throws(
      () => assertProductionInputsApproved({ envelope: inputs.envelope, approvals: inputs.approvals, scriptPath: inputs.scriptPath, videoMapPath: inputs.videoMapPath }),
      /visual-treatment approval does not match current artifact hash/,
    );
    fs.writeFileSync(inputs.scriptPath, '{"title":"Approved"}\n');
    fs.appendFileSync(inputs.videoMapPath, "drift");
    assert.throws(
      () => assertProductionInputsApproved({ envelope: inputs.envelope, approvals: inputs.approvals, scriptPath: inputs.scriptPath, videoMapPath: inputs.videoMapPath }),
      /video-map approval does not match current artifact hash/,
    );
    fs.writeFileSync(inputs.videoMapPath, '{"video":true}\n');
    fs.appendFileSync(inputs.videoPath, "drift");
    writePassedQaReport({
      directory: inputs.directory,
      runId: inputs.envelope.runId,
      scriptPath: inputs.scriptPath,
      videoMapPath: inputs.videoMapPath,
      videoPath: inputs.videoPath,
    });
    assert.throws(
      () => finalizeProductionEnvelope({ ...inputs, videoMapPath: inputs.videoMapPath }),
      /final-video approval does not match rendered video hash/,
    );
    assert.throws(
      () => promoteRapidRun({
        sourceEnvelope: {
          schemaVersion: "lucida-run/v1",
          runId: "rapid-w2-source",
          lane: "rapid-visual-pilot",
          styleMode: "auto",
          publicationStatus: "non_publishable",
          approvalRefs: [],
        },
        sourceVideoMapPath: sourceMapPath,
        promotionApproval: approval({ approvalId: "promotion", runId: "rapid-w2-source", kind: "promotion", artifactHash: hash("0") }),
        productionRunId: "production-w2-promoted",
        productionApprovals: [approval({ approvalId: "treatment", runId: "production-w2-promoted", kind: "visual-treatment", artifactHash: hash("a") })],
      }),
      /does not match rapid source hash/,
    );
  } finally {
    fs.rmSync(inputs.directory, { recursive: true, force: true });
  }
});

test("promotion leaves the rapid source unchanged and refuses an existing production run", () => {
  const sourceRunId = `rapid-w2-immutable-${process.pid}`;
  const productionRunId = `production-w2-existing-${process.pid}`;
  const sourceDir = path.join(root, "pipeline", "runs", sourceRunId);
  const productionDir = path.join(root, "pipeline", "runs", productionRunId);
  const temporary = temporaryRun();
  const sourceEnvelope = {
    schemaVersion: "lucida-run/v1",
    runId: sourceRunId,
    lane: "rapid-visual-pilot",
    styleMode: "auto",
    publicationStatus: "non_publishable",
    approvalRefs: [],
  };
  const sourceMap = "immutable-source-map\n";
  try {
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(productionDir, { recursive: true });
    fs.writeFileSync(path.join(sourceDir, "run-envelope.json"), `${JSON.stringify(sourceEnvelope)}\n`);
    fs.writeFileSync(path.join(sourceDir, "05-video-map.json"), sourceMap);
    const existing = "existing-production-run\n";
    fs.writeFileSync(path.join(productionDir, "run-envelope.json"), existing);
    const promotionPath = path.join(temporary, "promotion.json");
    const approvalsPath = path.join(temporary, "production-approvals.json");
    fs.writeFileSync(promotionPath, `${JSON.stringify(approval({ approvalId: "promotion", runId: sourceRunId, kind: "promotion", artifactHash: sha256File(path.join(sourceDir, "05-video-map.json")) }))}\n`);
    fs.writeFileSync(approvalsPath, JSON.stringify([approval({ approvalId: "treatment", runId: productionRunId, kind: "visual-treatment", artifactHash: hash("a")})]));
    const result = runScript("promote-flow.mjs", [
      "--source-run-id", sourceRunId,
      "--approval", promotionPath,
      "--production-run-id", productionRunId,
      "--production-approvals", approvalsPath,
    ]);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /Production run already exists/);
    assert.equal(fs.readFileSync(path.join(sourceDir, "run-envelope.json"), "utf8"), `${JSON.stringify(sourceEnvelope)}\n`);
    assert.equal(fs.readFileSync(path.join(sourceDir, "05-video-map.json"), "utf8"), sourceMap);
    assert.equal(fs.readFileSync(path.join(productionDir, "run-envelope.json"), "utf8"), existing);
  } finally {
    fs.rmSync(sourceDir, { recursive: true, force: true });
    fs.rmSync(productionDir, { recursive: true, force: true });
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("entrypoints reject traversal run IDs before starting work", () => {
  const invalidRunId = "../w2-path-traversal";
  const common = ["--run-id", invalidRunId];
  const results = [
    runScript("run-visual-flow.mjs", ["--config", "pipeline/fixtures/contracts/visual-flow-v2-auto.fixture.json", ...common]),
    runScript("run-flow.mjs", [
      "--script", "pipeline/fixtures/audio/approved-script.fixture.json",
      "--video-map", "pipeline/fixtures/audio/video-map.fixture.json",
      "--run-envelope", "pipeline/fixtures/flow/production-envelope.fixture.json",
      "--approvals", "pipeline/fixtures/flow/production-approvals.fixture.json",
      ...common,
    ]),
    runScript("promote-flow.mjs", ["--source-run-id", invalidRunId, "--approval", "missing", "--production-run-id", "production-w2", "--production-approvals", "missing"]),
    runScript("finalize-flow.mjs", [...common, "--approvals", "pipeline/fixtures/flow/production-approvals.fixture.json"]),
    runScript("publish-handoff.mjs", common),
  ];
  for (const result of results) {
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /Invalid|unsupported characters|may contain only/);
  }
});

test("flow:run has no publish stage and finalization adds the exact final approval reference", () => {
  const runFlowSource = fs.readFileSync(path.join(root, "scripts", "run-flow.mjs"), "utf8");
  assert.doesNotMatch(runFlowSource, /publish-handoff/);
  assert.match(runFlowSource, /awaiting_final_approval/);

  const inputs = createProductionInputs();
  try {
    const finalized = finalizeProductionEnvelope({ ...inputs, videoMapPath: inputs.videoMapPath });
    assert.equal(finalized.publicationStatus, "publishable");
    assert.deepEqual(finalized.approvalRefs, ["treatment", "map", "final"]);
    assertPublishableProductionRun({ ...inputs, envelope: finalized, videoMapPath: inputs.videoMapPath });
  } finally {
    fs.rmSync(inputs.directory, { recursive: true, force: true });
  }
});

test("failed publish handoff must not leave a publishable production state", () => {
  const runId = `production-w2-publish-failure-${process.pid}`;
  const runDir = path.join(root, "output", "render", "flow-runs", runId);
  const temporary = temporaryRun();
  const scriptPath = path.join(runDir, "approved-script.json");
  const videoMapPath = path.join(runDir, "video-map.source.json");
  const videoPath = path.join(runDir, "video.mp4");
  const envelope = {
    schemaVersion: "lucida-run/v1",
    runId,
    lane: "production",
    styleMode: "auto",
    publicationStatus: "promotion_pending",
    approvalRefs: ["treatment", "map"],
  };
  try {
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(scriptPath, "approved-script\n");
    fs.writeFileSync(videoMapPath, "approved-map\n");
    fs.writeFileSync(videoPath, "rendered-video\n");
    const approvals = [
      approval({ approvalId: "treatment", runId, kind: "visual-treatment", artifactHash: sha256File(scriptPath) }),
      approval({ approvalId: "map", runId, kind: "video-map", artifactHash: sha256File(videoMapPath) }),
      approval({ approvalId: "final", runId, kind: "final-video", artifactHash: sha256File(videoPath) }),
    ];
    fs.writeFileSync(path.join(runDir, "run-envelope.json"), `${JSON.stringify(envelope)}\n`);
    fs.writeFileSync(path.join(runDir, "flow-report.json"), `${JSON.stringify({ runId, status: "awaiting_final_approval", stages: [] })}\n`);
    const audioDir = path.join(root, "public", "runs", runId, "audio");
    const qaInputPaths = {
      approvedScript: scriptPath,
      sourceVideoMap: videoMapPath,
      timedVideoMap: path.join(runDir, "video-map.json"),
      renderProps: path.join(runDir, "render-props.json"),
      timedScript: path.join(audioDir, "timed-script.json"),
      audio: path.join(audioDir, "voice.wav"),
      normalizedInput: path.join(runDir, "normalized-input.json"),
    };
    fs.mkdirSync(audioDir, { recursive: true });
    for (const [name, filePath] of Object.entries(qaInputPaths)) {
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, `fixture-${name}`);
    }
    fs.writeFileSync(path.join(runDir, "qa-report.json"), `${JSON.stringify({
      schemaVersion: "lucida-qa/v1",
      runId,
      phase: "post-render",
      generatedAt: "2026-07-16T10:00:00Z",
      status: "passed",
      inputChecksums: Object.fromEntries(Object.entries(qaInputPaths).map(([name, filePath]) => [name, sha256File(filePath)])),
      renderChecksum: sha256File(videoPath),
      checks: ["audio-stream", "audio-non-silent", "audio-clipping", "caption-timing", "render-integrity"].map((id) => ({ id, status: "passed", evidence: {} })),
    })}\n`);
    const approvalsPath = path.join(temporary, "approvals.json");
    fs.writeFileSync(approvalsPath, `${JSON.stringify(approvals)}\n`);
    const fakeFfmpeg = path.join(temporary, "ffmpeg.cmd");
    fs.writeFileSync(fakeFfmpeg, "@echo off\r\nexit /b 1\r\n");
    const result = runScript("finalize-flow.mjs", ["--run-id", runId, "--approvals", approvalsPath], {
      env: { ...process.env, PATH: `${temporary};${process.env.PATH}` },
    });
    assert.notEqual(result.status, 0);
    const persistedEnvelope = JSON.parse(fs.readFileSync(path.join(runDir, "run-envelope.json"), "utf8"));
    const persistedReport = JSON.parse(fs.readFileSync(path.join(runDir, "flow-report.json"), "utf8"));
    assert.notEqual(persistedEnvelope.publicationStatus, "publishable");
    assert.notEqual(persistedReport.status, "publishable");
  } finally {
    fs.rmSync(runDir, { recursive: true, force: true });
    fs.rmSync(path.join(root, "pipeline", "runs", runId), { recursive: true, force: true });
    fs.rmSync(path.join(root, "output", "publish", runId), { recursive: true, force: true });
    fs.rmSync(path.join(root, "public", "runs", runId), { recursive: true, force: true });
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
