import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const manifestDir = path.join(root, "scene-schema", "examples", "prompt-engineering-series");
const generatedDir = path.join(root, "generated", "prompt-engineering-series");
const outputRoot = process.env.HYPERFRAMES_OUTPUT_ROOT || "D:\\HyperFrames\\output";
const tempRoot = process.env.HYPERFRAMES_TEMP_ROOT || "D:\\HyperFrames\\tmp";
const outputDir = path.resolve(args.outputDir || path.join(outputRoot, "prompt-engineering-series"));
const tempDir = path.resolve(args.tempDir || tempRoot);

await mkdir(outputDir, { recursive: true });
await mkdir(tempDir, { recursive: true });
console.log(`[series] output ${outputDir}`);
console.log(`[series] temp ${tempDir}`);

const files = (await readdir(manifestDir))
  .filter((file) => file.endsWith(".json"))
  .filter((file) => !args.episode || file.startsWith(args.episode))
  .filter((file) => !args.from || file >= args.from)
  .sort();

if (files.length === 0) {
  throw new Error(`Không tìm thấy tập ${args.episode || "nào"}.`);
}

for (const file of files) {
  const slug = path.basename(file, ".json");
  const input = path.join(manifestDir, file);
  const project = path.join(generatedDir, slug);
  const output = path.join(outputDir, `${slug}.mp4`);

  console.log(`\n[series] compile ${slug}`);
  await run(process.execPath, [
    path.join(root, "renderer", "scene-json-to-hyperframes.mjs"),
    "--input", input,
    "--output", project,
  ]);

  if (!args.compileOnly) {
    console.log(`[series] render ${slug}`);
    await run(process.execPath, [
      path.join(root, "renderer", "render-project.mjs"),
      "--project", project,
      "--output", output,
      "--quality", args.quality,
      "--workers", "1",
      "--temp-dir", tempDir,
    ]);
  }
}

console.log(`\n[series] hoàn tất ${files.length} tập`);

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: root, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(commandArgs[0])} thoát với mã ${code}`));
    });
  });
}

function parseArgs(values) {
  const parsed = { quality: "draft", compileOnly: false };
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--quality") parsed.quality = values[++index];
    else if (values[index] === "--episode") parsed.episode = values[++index];
    else if (values[index] === "--from") parsed.from = values[++index];
    else if (values[index] === "--output-dir") parsed.outputDir = values[++index];
    else if (values[index] === "--temp-dir") parsed.tempDir = values[++index];
    else if (values[index] === "--compile-only") parsed.compileOnly = true;
  }
  return parsed;
}
