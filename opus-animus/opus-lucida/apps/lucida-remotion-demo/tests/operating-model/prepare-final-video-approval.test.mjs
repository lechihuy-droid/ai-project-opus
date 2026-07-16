import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseCliArgs, prepareFinalVideoApproval } from "../../scripts/operating-model/prepare-final-video-approval.mjs";
import { sha256File } from "../../scripts/operating-model/orchestration.mjs";

const createFixture = () => {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-final-approval-"));
  const runId = "production-final-001";
  const runDir = path.join(appRoot, "output", "render", "flow-runs", runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "video.mp4"), "final-render-bytes");
  fs.writeFileSync(path.join(runDir, "approvals.json"), "[]\n");
  return { appRoot, runId, runDir };
};

test("prepare final video approval creates one new, bound approval artifact and fails closed", (t) => {
  const fixture = createFixture();
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-final-approval-outside-"));
  try {
    const outputPath = path.join(fixture.appRoot, "candidate-approvals.json");
    const result = prepareFinalVideoApproval({
      ...fixture,
      approvedBy: "reviewer@example.test",
      approvedAt: "2026-07-17T10:00:00Z",
      outPath: "candidate-approvals.json",
    });
    const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert.equal(result.outputPath, outputPath);
    assert.equal(written.length, 1);
    assert.deepEqual(written[0], {
      schemaVersion: "lucida-approval/v1",
      approvalId: `final-video-${fixture.runId}`,
      runId: fixture.runId,
      kind: "final-video",
      status: "approved",
      artifactHash: sha256File(path.join(fixture.runDir, "video.mp4")),
      approvedBy: "reviewer@example.test",
      approvedAt: "2026-07-17T10:00:00Z",
    });
    assert.equal(fs.readFileSync(path.join(fixture.runDir, "approvals.json"), "utf8"), "[]\n");

    assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: "candidate-approvals.json" }), /Refusing to overwrite/);
    assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: path.join("..", "traversal.json") }), /resolve inside the app root/);
    assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: path.join(outsideRoot, "absolute.json") }), /relative path inside the app root/);

    const linkedParent = path.join(fixture.appRoot, "linked-parent");
    try {
      fs.symlinkSync(outsideRoot, linkedParent, "junction");
      assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: path.join("linked-parent", "escaped.json") }), /symlink parent/);
    } catch (error) {
      if (!["EPERM", "EACCES", "ENOTSUP", "EINVAL"].includes(error?.code)) throw error;
      t.diagnostic(`OS disallows junction creation; symlink-parent assertion skipped: ${error.code}`);
    }

    assert.throws(() => prepareFinalVideoApproval({ ...fixture, runId: "../escape", approvedBy: "reviewer", outPath: "unsafe.json" }), /Invalid --run-id/);
    fs.writeFileSync(path.join(fixture.runDir, "approvals.json"), `${JSON.stringify(written)}\n`);
    assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: "duplicate.json" }), /final-video approval already exists/);
    fs.writeFileSync(path.join(fixture.runDir, "approvals.json"), `${JSON.stringify([{ ...written[0], approvalId: "other-run", runId: "other-run" }])}\n`);
    assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: "mismatch.json" }), /different run/);
    fs.rmSync(path.join(fixture.runDir, "video.mp4"));
    assert.throws(() => prepareFinalVideoApproval({ ...fixture, approvedBy: "reviewer", outPath: "missing-video.json" }), /Rendered video does not exist/);

    assert.throws(() => parseCliArgs(["--run-id", fixture.runId]), /Usage: npm run flow:prepare-final-approval/);
    assert.throws(() => parseCliArgs(["--run-id", fixture.runId, "--approved-by", "reviewer", "--out", "new.json", "--unexpected"]), /Usage:/);
  } finally {
    fs.rmSync(fixture.appRoot, { recursive: true, force: true });
    fs.rmSync(outsideRoot, { recursive: true, force: true });
  }
});
