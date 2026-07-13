import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vieneuRoot = path.resolve(appRoot, "../VieNeu-TTS");
const configPath = path.join(appRoot, "pipeline/config/voice-config.json");

const fail = (message) => {
  console.error(`voice:generate: ${message}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!["--script", "--run-id", "--voice"].includes(argument)) {
      fail(`Unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      fail(`Missing value for ${argument}`);
    }
    parsed[argument.slice(2)] = value;
    index += 1;
  }
  if (!parsed.script) fail("Required argument missing: --script <approved-script.json>");
  return parsed;
};

const readJson = (filePath, label) => {
  let source;
  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`${label} does not exist or cannot be read: ${filePath} (${error.message})`);
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    fail(`${label} is not valid JSON: ${filePath} (${error.message})`);
  }
};

const requireCommand = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "ignore",
    windowsHide: true,
  });
  if (result.error?.code === "ENOENT") {
    fail(`${command} was not found on PATH`);
  }
  if (result.error || result.status !== 0) {
    fail(`${command} is unavailable on PATH or failed its version check`);
  }
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.capture ? "utf8" : undefined,
    windowsHide: true,
  });
  if (result.error) fail(`Could not start ${command}: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = options.capture ? result.stderr.trim() : "";
    fail(`${command} exited with code ${result.status}${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout;
};

const validateScript = (script) => {
  if (!script || typeof script !== "object" || Array.isArray(script)) {
    fail("Approved script must be a JSON object");
  }
  if (script.status !== "approved") {
    fail(`Script status must be \"approved\"; received ${JSON.stringify(script.status)}`);
  }
  if (typeof script.scriptId !== "string" || !script.scriptId.trim()) {
    fail("Approved script must have a non-empty scriptId");
  }
  if (script.revision === undefined || script.revision === null) {
    fail("Approved script must have a revision");
  }
  if (typeof script.content?.voiceoverText !== "string" || !script.content.voiceoverText.trim()) {
    fail("Approved script must have non-empty content.voiceoverText");
  }
  if (!Array.isArray(script.sentences) || script.sentences.length === 0) {
    fail("Approved script must have a non-empty sentences array");
  }
  script.sentences.forEach((sentence, index) => {
    if (typeof sentence?.text !== "string" || !sentence.text.trim()) {
      fail(`sentences[${index}].text must be a non-empty string`);
    }
  });
};

const validateConfig = (config) => {
  if (typeof config.voice !== "string" || !config.voice.trim()) fail("Config voice must be a non-empty string");
  if (typeof config.style !== "string" || !config.style.trim()) fail("Config style must be a non-empty string");
  if (!["per-sentence", "single"].includes(config.chunkStrategy)) {
    fail('Config chunkStrategy must be "per-sentence" or "single"');
  }
  if (!Number.isInteger(config.gapMs) || config.gapMs < 0) {
    fail("Config gapMs must be a non-negative integer");
  }
};

const safeRunId = (value) => {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    fail("--run-id may contain only letters, numbers, dot, underscore, and hyphen");
  }
  return value;
};

const concatChunks = (chunkPaths, gapMs, outputPath) => {
  if (chunkPaths.length === 1) {
    fs.copyFileSync(chunkPaths[0], outputPath);
    return;
  }

  const args = ["-y", "-hide_banner", "-loglevel", "error"];
  const labels = [];
  const filters = [];
  let inputIndex = 0;
  for (const [chunkIndex, chunkPath] of chunkPaths.entries()) {
    args.push("-i", chunkPath);
    filters.push(
      `[${inputIndex}:a]aresample=48000,aformat=sample_fmts=s16:channel_layouts=mono[a${inputIndex}]`,
    );
    labels.push(`[a${inputIndex}]`);
    inputIndex += 1;
    if (chunkIndex < chunkPaths.length - 1 && gapMs > 0) {
      args.push("-f", "lavfi", "-t", String(gapMs / 1000), "-i", "anullsrc=r=48000:cl=mono");
      filters.push(`[${inputIndex}:a]aformat=sample_fmts=s16:channel_layouts=mono[a${inputIndex}]`);
      labels.push(`[a${inputIndex}]`);
      inputIndex += 1;
    }
  }
  filters.push(`${labels.join("")}concat=n=${labels.length}:v=0:a=1[out]`);
  args.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[out]",
    "-c:a",
    "pcm_s16le",
    outputPath,
  );
  run("ffmpeg", args);
};

const args = parseArgs(process.argv.slice(2));
const scriptPath = path.resolve(process.cwd(), args.script);
if (!fs.existsSync(scriptPath)) fail(`Script file does not exist: ${scriptPath}`);
if (!fs.existsSync(configPath)) fail(`Voice config does not exist: ${configPath}`);
if (!fs.existsSync(path.join(vieneuRoot, "scripts/lucida_generate.py"))) {
  fail(`VieNeu adapter does not exist under: ${vieneuRoot}`);
}

const script = readJson(scriptPath, "Approved script");
const config = readJson(configPath, "Voice config");
validateScript(script);
validateConfig(config);

requireCommand("uv", ["--version"]);
requireCommand("ffmpeg", ["-version"]);
requireCommand("ffprobe", ["-version"]);

const runId = safeRunId(
  args["run-id"] ??
    `${script.scriptId}-r${script.revision}-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "")}`,
);
const requestedVoice = args.voice ?? config.voice;
if (!requestedVoice.trim()) fail("Voice must be a non-empty string");

const audioDir = path.join(appRoot, "public/runs", runId, "audio");
fs.mkdirSync(audioDir, { recursive: true });
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-voice-"));

try {
  const chunks =
    config.chunkStrategy === "per-sentence"
      ? script.sentences.map((sentence, index) => ({
          id: `chunk-${String(index + 1).padStart(4, "0")}`,
          text: sentence.text,
        }))
      : [{ id: "chunk-0001", text: script.content.voiceoverText }];
  const chunksDir = path.join(workDir, "chunks");
  const jobPath = path.join(workDir, "job.json");
  fs.writeFileSync(
    jobPath,
    JSON.stringify(
      {
        chunks,
        voice: requestedVoice,
        style: config.style,
        outDir: chunksDir,
      },
      null,
      2,
    ) + "\n",
  );

  run("uv", [
    "run",
    "--directory",
    vieneuRoot,
    "python",
    "scripts/lucida_generate.py",
    "--input",
    jobPath,
  ]);

  const manifestPath = path.join(chunksDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) fail(`VieNeu adapter did not create manifest: ${manifestPath}`);
  const manifest = readJson(manifestPath, "VieNeu manifest");
  if (typeof manifest.voice !== "string" || !manifest.voice) fail("VieNeu manifest has no resolved voice id");

  const chunkPaths = chunks.map((chunk) => path.join(chunksDir, `${chunk.id}.wav`));
  for (const chunkPath of chunkPaths) {
    if (!fs.existsSync(chunkPath)) fail(`VieNeu adapter did not create chunk: ${chunkPath}`);
  }

  const joinedPath = path.join(workDir, "joined.wav");
  concatChunks(chunkPaths, config.chunkStrategy === "per-sentence" ? config.gapMs : 0, joinedPath);

  const voicePath = path.join(audioDir, "voice.wav");
  run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    joinedPath,
    "-af",
    "loudnorm=I=-14:TP=-1",
    "-ar",
    "48000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    voicePath,
  ]);

  const probeRaw = run(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "format=duration:stream=sample_rate,channels",
      "-of",
      "json",
      voicePath,
    ],
    { capture: true },
  );
  let probe;
  try {
    probe = JSON.parse(probeRaw);
  } catch (error) {
    fail(`ffprobe returned invalid JSON: ${error.message}`);
  }
  const stream = probe.streams?.[0];
  const durationSeconds = Number(probe.format?.duration);
  if (Number(stream?.sample_rate) !== 48000 || Number(stream?.channels) !== 1) {
    fail("Normalized voice failed probe: expected 48000 Hz mono audio");
  }
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    fail("Normalized voice failed probe: invalid duration");
  }

  const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
  const voiceTrack = {
    provider: "vieneu",
    voice: manifest.voice,
    style: config.style,
    durationMs: Math.round(durationSeconds * 1000),
    sampleRate: 48000,
    channels: 1,
    checksum: `sha256:${sha256(fs.readFileSync(voicePath))}`,
    scriptId: script.scriptId,
    scriptRevision: script.revision,
    scriptChecksum: `sha256:${sha256(script.content.voiceoverText)}`,
    chunkStrategy: config.chunkStrategy,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(audioDir, "voice-track.json"),
    JSON.stringify(voiceTrack, null, 2) + "\n",
  );
  console.log(`Generated ${path.relative(appRoot, voicePath)}`);
} finally {
  fs.rmSync(workDir, { recursive: true, force: true });
}
