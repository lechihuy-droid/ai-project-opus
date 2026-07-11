import fs from "node:fs";
import path from "node:path";
import { mapVisualScenes } from "../pipeline/mappers/map-scenes.mjs";
import { compileVideoMap } from "../pipeline/compilers/video-map.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const inputArg = valueAfter("--input");
const configArg = valueAfter("--config");
if (!inputArg || !configArg)
  throw new Error(
    "Usage: npm run map:visual -- --input <03-normalized-input.json> --config <config.json>",
  );

const root = process.cwd();
const inputPath = path.resolve(root, inputArg);
const config = JSON.parse(
  fs.readFileSync(path.resolve(root, configArg), "utf8"),
);
const normalized = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const outDir = path.dirname(inputPath);
const mapped = mapVisualScenes(normalized, config);
const videoMap = compileVideoMap(mapped, config);
fs.writeFileSync(
  path.join(outDir, "04-visual-scenes.json"),
  JSON.stringify(mapped, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(outDir, "05-video-map.json"),
  JSON.stringify(videoMap, null, 2) + "\n",
);
fs.writeFileSync(
  path.join(outDir, "render-props.json"),
  JSON.stringify({ videoMap }, null, 2) + "\n",
);
console.log(
  `Mapped ${mapped.scenes.length} scenes -> ${path.relative(root, path.join(outDir, "05-video-map.json"))}`,
);
