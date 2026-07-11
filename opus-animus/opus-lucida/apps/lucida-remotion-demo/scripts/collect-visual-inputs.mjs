import fs from "node:fs";
import path from "node:path";
import {
  collectAsciicast,
  collectCommand,
  collectScript,
} from "../pipeline/collectors/index.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const configArg = valueAfter("--config");
if (!configArg)
  throw new Error(
    "Usage: npm run collect:visual -- --config <config.json> [--out <directory>]",
  );

const projectRoot = process.cwd();
const configPath = path.resolve(projectRoot, configArg);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const allowlistPath = path.resolve(
  projectRoot,
  "pipeline/config/command-allowlist.json",
);
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
const allowedCommands = new Set(allowlist.commands ?? []);
const outDir = path.resolve(
  projectRoot,
  valueAfter("--out") ?? `pipeline/runs/${config.projectId}-${Date.now()}`,
);
fs.mkdirSync(outDir, { recursive: true });

const collected = [];
const warnings = [];
for (const source of config.sources) {
  try {
    if (source.type === "script")
      collected.push(collectScript({ source, projectRoot }));
    else if (source.type === "asciicast")
      collected.push(collectAsciicast({ source, projectRoot }));
    else if (source.type === "command")
      collected.push(
        await collectCommand({ source, projectRoot, allowedCommands }),
      );
    else
      warnings.push(
        `Collector not implemented for optional source type: ${source.type}`,
      );
  } catch (error) {
    if (source.required !== false) throw error;
    warnings.push(`${source.id}: ${error.message}`);
  }
}

if (collected.length === 0) throw new Error("No visual sources were collected");
const artifact = {
  schemaVersion: "raw-visual-input/v1",
  projectId: config.projectId,
  generatedAt: new Date().toISOString(),
  configPath: path.relative(projectRoot, configPath).replaceAll("\\", "/"),
  sources: collected,
  warnings,
};
const outputPath = path.join(outDir, "01-raw-input.json");
fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + "\n");
console.log(
  `Collected ${collected.length} visual sources -> ${path.relative(projectRoot, outputPath)}`,
);
