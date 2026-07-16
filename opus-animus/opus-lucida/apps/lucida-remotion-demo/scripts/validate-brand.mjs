import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const fail = (message) => {
  console.error(`validate:brand: ${message}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--input", "--timed-script"].includes(flag)) fail(`Unknown argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${flag}`);
    args[flag.slice(2)] = value;
    index += 1;
  }
  if (!args.input) fail("Usage: node scripts/validate-brand.mjs --input <video-map.json> [--timed-script <timed-script.json>]");
  return args;
};

const readJson = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Cannot read ${label} at ${filePath}: ${error.message}`);
  }
};

const parseHex = (value) => {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1].length === 3
    ? [...match[1]].map((digit) => `${digit}${digit}`).join("")
    : match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
};

const relativeLuminance = (hex) => {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const countWords = (text) =>
  String(text ?? "").trim().split(/\s+/u).filter(Boolean).length;

const extractPhrases = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractPhrases);
  if (!value || typeof value !== "object") return [];
  if (typeof value.phrase === "string") return [value.phrase];
  if (typeof value.text === "string") return [value.text];
  if (Array.isArray(value.phrases)) return value.phrases.flatMap(extractPhrases);
  if (Array.isArray(value.sentences)) return value.sentences.flatMap(extractPhrases);
  if (Array.isArray(value.captions)) return value.captions.flatMap(extractPhrases);
  return [];
};

const seriesIntents = {
  "lucida-now": [
    { label: "hook", intents: ["hook", "problem"] },
    { label: "proof/data", intents: ["comparison", "system_architecture", "quote", "code_explanation"] },
    { label: "takeaway", intents: ["takeaway"] },
  ],
  "lucida-work": [
    { label: "workflow", intents: ["process", "use_case"] },
    { label: "result", intents: ["takeaway"] },
    { label: "safety check", intents: ["problem", "comparison"] },
  ],
  "lucida-lab": [
    { label: "mechanism/demo", intents: ["process", "system_architecture", "code_explanation", "use_case"] },
    { label: "limitation", intents: ["problem", "comparison"] },
  ],
  "lucida-check": [
    { label: "verdict", intents: ["takeaway", "comparison"] },
    { label: "fit guidance", intents: ["use_case", "problem"] },
  ],
};

const args = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(process.cwd(), args.input);
const configPath = path.resolve(appRoot, "pipeline/config/brand-check.json");
const videoMap = readJson(inputPath, "video map");
const config = readJson(configPath, "brand-check config");
const violations = [];
const warnings = [];
const checks = [];

const check = (passed, message) => {
  checks.push(Boolean(passed));
  if (!passed) violations.push(message);
};

const luminance = relativeLuminance(videoMap.theme?.background);
check(
  luminance !== null && luminance < config.darkLuminanceMax,
  `theme.background must be a hex color with relative luminance < ${config.darkLuminanceMax}; got ${JSON.stringify(videoMap.theme?.background)}${luminance === null ? "" : ` (${luminance.toFixed(4)})`}.`,
);

const banned = new Set(config.bannedTemplateIds ?? []);
const bannedScenes = (videoMap.scenes ?? []).filter((scene) => banned.has(scene.templateId));
check(
  bannedScenes.length === 0,
  `Banned templateId used by scene(s): ${bannedScenes.map((scene) => `${scene.id}:${scene.templateId}`).join(", ")}.`,
);

const validLanguages = ["vi", "en"];
const hasSupportedLanguage = validLanguages.includes(videoMap.video?.language);
check(
  hasSupportedLanguage,
  `video.language must be one of ${validLanguages.join(", ")}; got ${JSON.stringify(videoMap.video?.language)}.`,
);

const validSeries = Object.keys(seriesIntents);
check(
  validSeries.includes(videoMap.brand?.series),
  `brand.series must be one of ${validSeries.join(", ")}; got ${JSON.stringify(videoMap.brand?.series)}.`,
);

let timedCaptions = videoMap.timedCaptions;
if (args["timed-script"]) {
  timedCaptions = readJson(path.resolve(process.cwd(), args["timed-script"]), "timed script");
}
if (timedCaptions !== undefined) {
  const phrases = extractPhrases(timedCaptions);
  const longPhrases = phrases
    .map((phrase, index) => ({ index, phrase, words: countWords(phrase) }))
    .filter(({ words }) => words > config.maxWordsPerPhrase);
  check(
    phrases.length > 0 && longPhrases.length === 0,
    phrases.length === 0
      ? "Timed captions were provided but no phrases could be read."
      : `Timed caption phrase(s) exceed ${config.maxWordsPerPhrase} words: ${longPhrases.map(({ index, words }) => `#${index + 1} (${words})`).join(", ")}.`,
  );
}

const intentRequirements = seriesIntents[videoMap.brand?.series];
if (intentRequirements) {
  const intents = new Set((videoMap.scenes ?? []).map((scene) => scene.intent));
  const missing = intentRequirements
    .filter((requirement) => !requirement.intents.some((intent) => intents.has(intent)))
    .map((requirement) => requirement.label);
  if (missing.length > 0) {
    warnings.push(`Series ${videoMap.brand.series} may be missing scene intent coverage for: ${missing.join(", ")}.`);
  }
}

const score = Number((checks.filter(Boolean).length / checks.length).toFixed(2));
const report = {
  score,
  violations,
  warnings,
  checkedAt: new Date().toISOString(),
};
const reportPath = path.join(path.dirname(inputPath), "brand-check.json");
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

violations.forEach((violation) => console.error(`VIOLATION: ${violation}`));
warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
console.log(`Brand check score: ${score.toFixed(2)}. Report: ${reportPath}`);

if (score < config.thresholds.normalize) process.exit(1);
if (!hasSupportedLanguage) process.exit(1);
if (score < config.thresholds.pass) console.warn("WARNING: normalize and revalidate");
