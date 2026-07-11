import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const propsArg = valueAfter("--props");
if (!propsArg)
  throw new Error(
    "Usage: npm run preview:generated -- --props <render-props.json>",
  );
const root = process.cwd();
const propsPath = path.resolve(root, propsArg);
const props = JSON.parse(fs.readFileSync(propsPath, "utf8"));
const outDir = path.join(path.dirname(propsPath), "preview");
fs.mkdirSync(outDir, { recursive: true });
const stills = [];
let startFrame = 0;

for (const [index, scene] of props.videoMap.scenes.entries()) {
  const frames = Math.round(scene.durationSec * props.videoMap.video.fps);
  const frame = startFrame + Math.floor(frames / 2);
  const output = path.join(
    outDir,
    `scene-${String(index + 1).padStart(2, "0")}.png`,
  );
  const result = spawnSync(
    "npx",
    [
      "remotion",
      "still",
      "LucidaMotionDemo",
      output,
      `--frame=${frame}`,
      `--props=${propsPath}`,
    ],
    {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  stills.push({
    sceneId: scene.id,
    templateId: scene.templateId,
    frame,
    output: path.relative(root, output),
  });
  startFrame += frames;
}
fs.writeFileSync(
  path.join(outDir, "preview-report.json"),
  JSON.stringify(
    { ok: true, generatedAt: new Date().toISOString(), stills },
    null,
    2,
  ) + "\n",
);
console.log(
  `Generated ${stills.length} preview stills -> ${path.relative(root, outDir)}`,
);
