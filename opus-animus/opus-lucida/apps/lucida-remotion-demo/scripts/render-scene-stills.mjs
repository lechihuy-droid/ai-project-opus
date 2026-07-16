import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { acquireRenderLock } from "./operating-model/render-lock.mjs";

const appRoot = process.cwd();
const videoMap = JSON.parse(fs.readFileSync(path.resolve(appRoot, "video-map.json"), "utf8"));
const runId =
  process.env.LUCIDA_RUN_ID ??
  new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const outDir = path.resolve(appRoot, "output/render/flow-runs", runId);
const npxBin = "npx";
const useShell = process.platform === "win32";

fs.mkdirSync(outDir, { recursive: true });

let startFrame = 0;
const report = {
  runId,
  generatedAt: new Date().toISOString(),
  compositionId: "LucidaMotionDemo",
  stills: [],
};

const renderLock = acquireRenderLock({
  approvedRoot: path.resolve(appRoot, "output", "render", "flow-runs"),
  runRoot: outDir,
  runId,
});
try {
  for (const [index, scene] of videoMap.scenes.entries()) {
    const durationFrames = Math.round(scene.durationSec * videoMap.video.fps);
    const frame = startFrame + Math.floor(durationFrames / 2);
    const safeId = scene.id.replace(/[^a-z0-9_-]/gi, "-");
    const output = path.join(outDir, `check-${String(index + 1).padStart(2, "0")}-${safeId}.png`);
    const args = ["remotion", "still", "LucidaMotionDemo", output, `--frame=${frame}`];
    const result = spawnSync(npxBin, args, {
      cwd: appRoot,
      stdio: "inherit",
      shell: useShell,
    });

    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`remotion still exited with code ${result.status ?? "unknown"}`);

    report.stills.push({
      sceneId: scene.id,
      frame,
      output: path.relative(appRoot, output),
      templateId: scene.templateId,
      templateRole: scene.templateRole,
      backgroundEffect: scene.backgroundEffect ?? null,
    });
    startFrame += durationFrames;
  }

  fs.writeFileSync(
    path.join(outDir, "qa-template-report.json"),
    JSON.stringify(report, null, 2),
  );
} finally {
  renderLock.release();
}

console.log(`Scene stills written to ${path.relative(appRoot, outDir)}`);
