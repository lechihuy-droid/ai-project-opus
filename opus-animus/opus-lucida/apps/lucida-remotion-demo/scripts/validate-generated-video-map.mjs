import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const inputIndex = args.indexOf("--input");
if (inputIndex === -1 || !args[inputIndex + 1]) {
  throw new Error("Usage: node scripts/validate-generated-video-map.mjs --input <video-map.json>");
}
const root = process.cwd();
const inputPath = path.resolve(root, args[inputIndex + 1]);
const videoMap = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const catalog = JSON.parse(fs.readFileSync(path.resolve(root, "../remotion-templates/template-catalog.json"), "utf8"));
const registry = JSON.parse(fs.readFileSync(path.resolve(root, "src/template-registry-map.json"), "utf8"));
const known = new Set([...(catalog.templates ?? []), ...(catalog.localAdapters ?? [])].map((entry) => entry.id));
const errors = [];
let duration = 0;
for (const scene of videoMap.scenes ?? []) {
  duration += scene.durationSec ?? 0;
  if (!known.has(scene.templateId)) errors.push(`Unknown template: ${scene.templateId}`);
  if (!registry[scene.templateId]) errors.push(`Unregistered template adapter: ${scene.templateId}`);
  if (!(scene.durationSec > 0)) errors.push(`Invalid duration: ${scene.id}`);
  if (!scene.content?.title && !scene.headline) errors.push(`Missing title: ${scene.id}`);
}
if (Math.abs(duration - videoMap.video.durationSec) > 0.001) errors.push("Video duration mismatch");
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
const report = {
  ok: true,
  generatedAt: new Date().toISOString(),
  input: path.relative(root, inputPath),
  sceneCount: videoMap.scenes.length,
  durationSec: duration,
  templateIds: videoMap.scenes.map((scene) => scene.templateId),
};
fs.writeFileSync(path.join(path.dirname(inputPath), "06-validation.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`Generated VideoMap passed: ${report.sceneCount} scenes, ${duration}s.`);
