import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const appRoot = process.cwd();
const runId =
  process.env.LUCIDA_RUN_ID ??
  new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const outDir = path.resolve(appRoot, "output/render/flow-runs", runId);
const output = path.join(outDir, "video.mp4");
const npxBin = "npx";
const useShell = process.platform === "win32";

fs.mkdirSync(outDir, { recursive: true });

const result = spawnSync(
  npxBin,
  ["remotion", "render", "LucidaMotionDemo", output],
  {
    cwd: appRoot,
    stdio: "inherit",
    shell: useShell,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const reportPath = path.join(outDir, "render-output.json");
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      runId,
      generatedAt: new Date().toISOString(),
      compositionId: "LucidaMotionDemo",
      output: path.relative(appRoot, output),
    },
    null,
    2,
  ),
);

console.log(`Rendered ${path.relative(appRoot, output)}`);
