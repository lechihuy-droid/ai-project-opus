#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const NUMBER_WORDS = new Map([
  ["một", 1],
  ["hai", 2],
  ["ba", 3],
  ["bốn", 4],
  ["năm", 5],
]);

const normalizeWords = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase("vi")
    .match(/[\p{L}\p{N}]+/gu) ?? [];

const COUNT_NOUNS = {
  steps: new Set(["bước", "step", "steps", "giai", "đoạn"]),
  items: new Set(["cách", "mục", "điều", "ý", "item", "items", "việc"]),
};

const extractCounts = (value, collectionName) => {
  const words = normalizeWords(value);
  return words.flatMap((word, index) => {
    const count =
      NUMBER_WORDS.get(word) ??
      (/^\d+$/u.test(word) ? Number.parseInt(word, 10) : null);
    if (count === null) return [];
    const nearbyWords = words.slice(index + 1, index + 3);
    return nearbyWords.some((nearbyWord) =>
      COUNT_NOUNS[collectionName].has(nearbyWord),
    )
      ? [count]
      : [];
  });
};

const overlapRatio = (left, right) => {
  const leftWords = new Set(normalizeWords(left));
  const rightWords = new Set(normalizeWords(right));
  const denominator = Math.min(leftWords.size, rightWords.size);
  if (denominator === 0) return 0;
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  return overlap / denominator;
};

const addResult = (
  results,
  severity,
  check,
  sceneId,
  message,
  details = {},
) => {
  results.push({ severity, check, sceneId, message, ...details });
};

const claimTexts = (scene) => {
  const values = [scene.headline, scene.content?.title];
  const cta = scene.content?.cta;
  if (typeof cta === "string") values.push(cta);
  if (cta && typeof cta === "object")
    values.push(cta.label, cta.detail, cta.title);
  return [
    ...new Set(
      values.filter((value) => typeof value === "string" && value.trim()),
    ),
  ];
};

export const validateSemantic = (videoMap, { final = false } = {}) => {
  const results = [];
  const actorsDeclared =
    Object.prototype.hasOwnProperty.call(videoMap, "actors") &&
    Array.isArray(videoMap.actors);
  const actorTargets = new Set(
    (videoMap.scenes ?? []).flatMap((scene) =>
      (scene.transitions ?? [])
        .filter(
          (transition) =>
            transition.action === "add" || transition.action === "update",
        )
        .map((transition) => transition.target),
    ),
  );

  for (const scene of videoMap.scenes ?? []) {
    const collection = Array.isArray(scene.content?.steps)
      ? { name: "steps", items: scene.content.steps }
      : Array.isArray(scene.content?.items)
        ? { name: "items", items: scene.content.items }
        : null;

    if (collection) {
      for (const text of claimTexts(scene)) {
        for (const claimedCount of new Set(
          extractCounts(text, collection.name),
        )) {
          if (claimedCount !== collection.items.length) {
            addResult(
              results,
              "FAIL",
              "claim-count",
              scene.id,
              `Claim ${JSON.stringify(text)} says ${claimedCount}, but content.${collection.name} has ${collection.items.length} elements.`,
              {
                claimedCount,
                actualCount: collection.items.length,
                collection: collection.name,
              },
            );
          }
        }
      }
    }

    const ratio = overlapRatio(scene.headline, scene.subtitle?.text);
    if (ratio > 0.7) {
      addResult(
        results,
        "WARN",
        "headline-subtitle-overlap",
        scene.id,
        `Headline and subtitle overlap ${(ratio * 100).toFixed(1)}% of words; shorten the headline or move repeated wording to the subtitle.`,
        { overlapRatio: Number(ratio.toFixed(4)) },
      );
    }

    const hasTransition =
      videoMap.mode === "continuous"
        ? Array.isArray(scene.transitions) && scene.transitions.length > 0
        : Boolean(scene.transitionIn || scene.transitionOut) ||
          (Array.isArray(scene.motion) && scene.motion.length > 0);
    if (
      videoMap.mode === "continuous" &&
      actorsDeclared &&
      !hasTransition
    ) {
      addResult(
        results,
        "FAIL",
        "beat-coverage",
        scene.id,
        "Continuous scenes must contain at least one transition when actors are declared.",
      );
    } else if (Number(scene.durationSec) > 8 && !hasTransition) {
      addResult(
        results,
        "WARN",
        "static-scene",
        scene.id,
        `Scene lasts ${scene.durationSec}s without a transition or motion instruction (limit: 8s).`,
        { durationSec: scene.durationSec },
      );
    }
  }

  if (actorsDeclared) {
    for (const actor of videoMap.actors) {
      if (actor.target === "environment" || actorTargets.has(actor.target)) {
        continue;
      }
      addResult(
        results,
        "FAIL",
        "actor-coverage",
        null,
        `Actor ${JSON.stringify(actor.id)} targets ${JSON.stringify(actor.target)}, but that target never appears in an add/update transition.`,
        { actorId: actor.id, target: actor.target },
      );
    }
  }

  if (final && videoMap.debug?.showTechnicalLabels === true) {
    addResult(
      results,
      "FAIL",
      "kicker-leak",
      null,
      "Final validation cannot run with debug.showTechnicalLabels=true.",
    );
  }

  const enabledChecks =
    4 +
    (actorsDeclared ? 1 : 0) +
    (actorsDeclared && videoMap.mode === "continuous" ? 1 : 0);
  const counts = {
    pass: enabledChecks - new Set(results.map((result) => result.check)).size,
    warn: results.filter((result) => result.severity === "WARN").length,
    fail: results.filter((result) => result.severity === "FAIL").length,
  };
  return {
    status: counts.fail > 0 ? "fail" : counts.warn > 0 ? "warn" : "pass",
    final,
    counts,
    results,
  };
};

const failUsage = (message) => {
  console.error(`validate:semantic: ${message}`);
  console.error(
    "Usage: npm run validate:semantic -- --input <video-map.json> [--final] [--report <report.json>]",
  );
  process.exitCode = 1;
};

const parseArgs = (argv) => {
  const parsed = { final: false };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--final") {
      parsed.final = true;
      continue;
    }
    if (!["--input", "--report"].includes(flag))
      throw new Error(`Unknown argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--"))
      throw new Error(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!parsed.input) throw new Error("--input is required");
  return parsed;
};

const runCli = () => {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    failUsage(error.message);
    return;
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  let videoMap;
  try {
    videoMap = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    failUsage(`Cannot read input at ${inputPath}: ${error.message}`);
    return;
  }

  const report = {
    ...validateSemantic(videoMap, { final: args.final }),
    input: path.relative(process.cwd(), inputPath),
    checkedAt: new Date().toISOString(),
  };
  for (const result of report.results) {
    const output = result.severity === "FAIL" ? console.error : console.warn;
    output(
      `${result.severity} [${result.check}]${result.sceneId ? ` scene=${result.sceneId}` : ""}: ${result.message}`,
    );
  }
  console.log(
    `Semantic QA: ${report.status.toUpperCase()} (${report.counts.fail} fail, ${report.counts.warn} warn).`,
  );

  if (args.report) {
    const reportPath = path.resolve(process.cwd(), args.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(
      reportPath,
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    console.log(`Semantic report: ${path.relative(process.cwd(), reportPath)}`);
  }
  if (report.counts.fail > 0) process.exitCode = 1;
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runCli();
}
