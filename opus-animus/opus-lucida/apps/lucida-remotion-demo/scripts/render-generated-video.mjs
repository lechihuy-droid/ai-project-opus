import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { acquireRenderLock } from "./operating-model/render-lock.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const propsArg = valueAfter("--props");
if (!propsArg)
  throw new Error(
    "Usage: npm run render:generated -- --props <render-props.json>",
  );
const root = process.cwd();
const propsPath = path.resolve(root, propsArg);
const outDir = path.join(path.dirname(propsPath), "output");
const output = path.join(outDir, "video.mp4");
fs.mkdirSync(outDir, { recursive: true });
const runId = path.basename(path.dirname(propsPath));
let result;
let renderLock;
try {
  renderLock = acquireRenderLock({
    approvedRoot: path.dirname(propsPath),
    runRoot: outDir,
    runId,
  });
  result = spawnSync(
    "npx",
    ["remotion", "render", "LucidaMotionDemo", output, `--props=${propsPath}`, "--concurrency=1"],
    {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
} finally {
  renderLock?.release();
}
if (result.status !== 0) process.exit(result.status ?? 1);
const bytes = fs.readFileSync(output);
const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  output: path.relative(root, output),
  bytes: bytes.length,
  checksum: `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`,
};
fs.writeFileSync(
  path.join(outDir, "render-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(`Rendered generated video -> ${report.output}`);
