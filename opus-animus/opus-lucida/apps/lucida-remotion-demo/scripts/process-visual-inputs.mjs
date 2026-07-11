import fs from "node:fs";
import path from "node:path";
import {
  normalizeSanitizedInput,
  sanitizeRawInput,
} from "../pipeline/processors/index.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const inputArg = valueAfter("--input");
const configArg = valueAfter("--config");
if (!inputArg || !configArg) {
  throw new Error(
    "Usage: npm run process:visual -- --input <01-raw-input.json> --config <config.json>",
  );
}

const root = process.cwd();
const inputPath = path.resolve(root, inputArg);
const config = JSON.parse(
  fs.readFileSync(path.resolve(root, configArg), "utf8"),
);
const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const outDir = path.dirname(inputPath);

try {
  const sanitized = sanitizeRawInput(raw);
  const sanitizedPath = path.join(outDir, "02-sanitized-input.json");
  fs.writeFileSync(sanitizedPath, JSON.stringify(sanitized, null, 2) + "\n");

  const normalized = normalizeSanitizedInput(sanitized, {
    fps: config.fps,
    idleTimeLimitSeconds: config.normalization?.idleTimeLimitSeconds ?? 1.5,
  });
  const normalizedPath = path.join(outDir, "03-normalized-input.json");
  fs.writeFileSync(normalizedPath, JSON.stringify(normalized, null, 2) + "\n");
  console.log(
    `Sanitized and normalized ${normalized.events.length} events -> ${path.relative(root, normalizedPath)}`,
  );
} catch (error) {
  if (error.findings) {
    for (const finding of error.findings) {
      console.error(`ERROR: sensitive ${finding.type} at ${finding.path}`);
    }
  }
  throw error;
}
