import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fail = (message) => {
  console.error(`map:apply-timing: ${message}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--video-map", "--timed-script", "--out"].includes(flag)) {
      fail(`Unknown argument: ${flag}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${flag}`);
    args[flag.slice(2)] = value;
    index += 1;
  }
  if (!args["video-map"] || !args["timed-script"]) {
    fail("Usage: node scripts/apply-timed-durations.mjs --video-map <path> --timed-script <path> [--out <path>]");
  }
  return args;
};

const readJson = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Cannot read ${label} at ${filePath}: ${error.message}`);
  }
};

export const applyTimedDurations = (videoMap, timedScript) => {
  if (!Array.isArray(videoMap?.scenes)) fail("video-map.scenes must be an array");
  if (!Array.isArray(timedScript?.sentences)) fail("timed-script.sentences must be an array");

  const segments = new Map();
  for (const sentence of timedScript.sentences) {
    if (
      typeof sentence?.segmentId === "string" &&
      Number.isFinite(sentence.startMs) &&
      Number.isFinite(sentence.endMs)
    ) {
      const ranges = segments.get(sentence.segmentId) ?? [];
      ranges.push({ startMs: sentence.startMs, endMs: sentence.endMs });
      segments.set(sentence.segmentId, ranges);
    }
  }

  const mappedScenes = videoMap.scenes.map((scene) => {
    if (!Array.isArray(scene.segmentIds) || scene.segmentIds.length === 0) {
      return { scene, reason: "no segmentIds" };
    }

    const missing = scene.segmentIds.filter((segmentId) => !segments.has(segmentId));
    if (missing.length > 0) {
      return { scene, reason: `missing segmentIds [${missing.join(", ")}]` };
    }

    const ranges = scene.segmentIds.flatMap((segmentId) => segments.get(segmentId));
    const startMs = Math.min(...ranges.map((range) => range.startMs));
    const endMs = Math.max(...ranges.map((range) => range.endMs));
    if (endMs <= startMs) return { scene, reason: "invalid mapped range" };

    return {
      scene: {
        ...scene,
        startMs,
        endMs,
        durationSec: Math.round(((endMs - startMs) / 1000) * 100) / 100,
      },
      mapped: true,
    };
  });

  const warnings = [];
  const hasUsableBindings = mappedScenes.some(({ mapped }) => mapped);
  let scenes;
  if (hasUsableBindings) {
    scenes = mappedScenes.map(({ scene, mapped, reason }) => {
      if (!mapped) warnings.push(`scene "${scene.id ?? "<unknown>"}": ${reason}; kept existing timing`);
      return scene;
    });
  } else {
    const durationMs = timedScript.durationMs;
    const totalExistingDurationSec = videoMap.scenes.reduce(
      (total, scene) => total + Number(scene.durationSec ?? 0),
      0,
    );
    if (!Number.isFinite(durationMs) || durationMs <= 0 || totalExistingDurationSec <= 0) {
      scenes = videoMap.scenes;
      warnings.push("no usable scene segment bindings; unable to apply proportional timing fallback");
    } else {
      let accumulatedDurationSec = 0;
      scenes = videoMap.scenes.map((scene) => {
        const startMs = Math.round((accumulatedDurationSec / totalExistingDurationSec) * durationMs);
        accumulatedDurationSec += Number(scene.durationSec ?? 0);
        const endMs = Math.round((accumulatedDurationSec / totalExistingDurationSec) * durationMs);
        return {
          ...scene,
          startMs,
          endMs,
          durationSec: (endMs - startMs) / 1000,
        };
      });
      warnings.push(
        "no usable scene segment bindings; applied proportional timing fallback from timed-script.durationMs",
      );
    }
  }

  const durationSec = hasUsableBindings || scenes === videoMap.scenes
    ? Math.round(scenes.reduce((total, scene) => total + Number(scene.durationSec ?? 0), 0) * 100) / 100
    : timedScript.durationMs / 1000;
  return {
    videoMap: { ...videoMap, video: { ...videoMap.video, durationSec }, scenes },
    warnings,
  };
};

const runCli = () => {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const inputPath = path.resolve(root, args["video-map"]);
  const timedScriptPath = path.resolve(root, args["timed-script"]);
  const outputPath = args.out ? path.resolve(root, args.out) : inputPath;
  const result = applyTimedDurations(
    readJson(inputPath, "video map"),
    readJson(timedScriptPath, "timed script"),
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result.videoMap, null, 2)}\n`, "utf8");
  result.warnings.forEach((warning) => console.warn(`WARNING: ${warning}`));
  console.log(`Applied timing to ${path.relative(root, outputPath)} (${result.videoMap.scenes.length} scenes).`);
};

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) runCli();
