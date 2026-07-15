import fs from "node:fs";
import path from "node:path";

const fail = (message) => {
  console.error(`evidence:export: ${message}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--run", "--out"].includes(flag)) fail(`Unknown argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${flag}`);
    args[flag.slice(2)] = value;
    index += 1;
  }
  if (!args.run) fail("Usage: node scripts/export-visual-evidence.mjs --run <pipeline-run-dir> [--out <path>]");
  return args;
};

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Cannot read normalized input at ${filePath}: ${error.message}`);
  }
};

const args = parseArgs(process.argv.slice(2));
const runPath = path.resolve(process.cwd(), args.run);
const inputPath = path.join(runPath, "03-normalized-input.json");
const outputPath = args.out ? path.resolve(process.cwd(), args.out) : path.join(runPath, "visual-evidence.json");
const normalized = readJson(inputPath);
if (!Array.isArray(normalized.events)) fail("03-normalized-input.json must contain an events array");

const sourceRun = path.relative(process.cwd(), runPath).split(path.sep).join("/") || ".";
const evidence = {
  schemaVersion: "1.0",
  sourceRun,
  exportedAt: new Date().toISOString(),
  blocks: normalized.events.map((event) => ({
    id: event.id,
    type: event.kind,
    content: {
      ...(event.text !== undefined ? { text: event.text } : {}),
      ...(event.timeSeconds !== undefined ? { timeSeconds: event.timeSeconds } : {}),
      ...(event.frame !== undefined ? { frame: event.frame } : {}),
      ...(event.data !== undefined ? { data: event.data } : {}),
    },
    source: {
      sourceId: event.sourceId,
      sourceRef: event.sourceRef,
      ...(event.provenance?.sourceChecksum ? { sourceChecksum: event.provenance.sourceChecksum } : {}),
      ...(event.provenance?.collectorVersion ? { collectorVersion: event.provenance.collectorVersion } : {}),
    },
  })),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`Exported ${evidence.blocks.length} visual evidence blocks to ${outputPath}.`);
