import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { acquireRenderLock } from "./operating-model/render-lock.mjs";

export const buildRemotionInvocation = ({ appRoot, output, propsPath, browserExecutable }) => {
  const renderArgs = ["render", "LucidaMotionDemo", output];
  if (propsPath) renderArgs.push(`--props=${propsPath}`);
  if (browserExecutable) renderArgs.push(`--browser-executable=${browserExecutable}`);

  return {
    command: process.execPath,
    args: [path.join(appRoot, "node_modules", "@remotion", "cli", "remotion-cli.js"), ...renderArgs],
  };
};

const main = () => {
const appRoot = process.cwd();
const fail = (message) => {
  console.error(`render preflight: ${message}`);
  process.exit(1);
};
const readJson = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} cannot be read at ${filePath}: ${error.message}`);
  }
};
const sha256 = (filePath) =>
  `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;

const args = process.argv.slice(2);
const propsIndex = args.indexOf("--props");
const propsValue = propsIndex >= 0 ? args[propsIndex + 1] : undefined;
if (propsIndex >= 0 && (!propsValue || propsValue.startsWith("--"))) {
  fail("Missing value for --props <render-props.json>");
}
const unknownArgs = propsIndex < 0
  ? args
  : args.filter((argument, index) => index !== propsIndex && index !== propsIndex + 1);
if (unknownArgs.length > 0) fail(`Unknown argument(s): ${unknownArgs.join(" ")}`);

const propsPath = path.resolve(appRoot, propsValue ?? "video-map.json");
const sourceData = readJson(propsPath, propsValue ? "render props" : "video map");
const propsData = sourceData.videoMap
  ? sourceData
  : {
      videoMap: sourceData,
      audio: sourceData.audio,
      timedCaptions: sourceData.timedCaptions,
    };
const audio = propsData.audio;
const timedCaptions = propsData.timedCaptions;

let voiceTrack;
if (audio) {
  if (typeof audio.src !== "string" || !audio.src.trim()) fail("audio.src is missing");
  if (typeof audio.checksum !== "string" || !audio.checksum.trim()) fail("audio.checksum is missing");
  const publicRoot = path.resolve(appRoot, "public");
  const audioPath = path.resolve(publicRoot, audio.src.replace(/^[/\\]+/u, ""));
  const relativeAudioPath = path.relative(publicRoot, audioPath);
  if (relativeAudioPath.startsWith("..") || path.isAbsolute(relativeAudioPath)) {
    fail(`audio.src resolves outside public/: ${audio.src}`);
  }
  if (!fs.existsSync(audioPath)) fail(`audio file not found: public/${audio.src}`);
  const fileChecksum = sha256(audioPath);
  if (fileChecksum !== audio.checksum) {
    fail(`audio checksum mismatch: props=${audio.checksum}, file=${fileChecksum}`);
  }

  const voiceTrackPath = path.join(path.dirname(audioPath), "voice-track.json");
  voiceTrack = readJson(voiceTrackPath, "voice-track.json from the audio run");
  if (voiceTrack.checksum !== audio.checksum) {
    fail(`voice-track checksum mismatch: props=${audio.checksum}, voice-track=${voiceTrack.checksum ?? "missing"}`);
  }
  if (timedCaptions?.voiceChecksum && timedCaptions.voiceChecksum !== voiceTrack.checksum) {
    fail(
      `timedCaptions.voiceChecksum mismatch: timedCaptions=${timedCaptions.voiceChecksum}, voice-track=${voiceTrack.checksum}`,
    );
  }
}

const runId =
  process.env.LUCIDA_RUN_ID ??
  new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const outDir = path.resolve(appRoot, "output/render/flow-runs", runId);
const output = path.join(outDir, "video.mp4");
fs.mkdirSync(outDir, { recursive: true });

const browserExecutable = process.env.LUCIDA_BROWSER_EXECUTABLE;
if (browserExecutable) {
  if (!fs.statSync(browserExecutable, { throwIfNoEntry: false })?.isFile()) {
    fail(`LUCIDA_BROWSER_EXECUTABLE is not a file: ${browserExecutable}`);
  }
}
const remotionInvocation = buildRemotionInvocation({
  appRoot,
  output,
  propsPath: propsValue ? propsPath : undefined,
  browserExecutable,
});
let result;
let renderLock;
try {
  renderLock = acquireRenderLock({
    approvedRoot: path.resolve(appRoot, "output", "render", "flow-runs"),
    runRoot: outDir,
    runId,
  });
  result = spawnSync(remotionInvocation.command, remotionInvocation.args, {
    cwd: appRoot,
    stdio: "inherit",
  });
} finally {
  renderLock?.release();
}
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

let audioStream = false;
if (audio) {
  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "json", output],
    { encoding: "utf8", windowsHide: true },
  );
  if (!probe.error && probe.status === 0) {
    try {
      audioStream = JSON.parse(probe.stdout)?.streams?.some((stream) => stream.codec_type === "audio") ?? false;
    } catch {
      audioStream = false;
    }
  } else {
    console.warn("WARNING: ffprobe could not inspect the rendered audio stream.");
  }
}

const fps = propsData.videoMap?.video?.fps ?? 30;
const phraseStarts = timedCaptions?.phrases
  ?.map((phrase) => phrase.startMs)
  .filter(Number.isFinite) ?? [];
const captionDriftMs = phraseStarts.reduce((maximum, startMs) => {
  const frameBoundaryMs = (Math.round((startMs / 1000) * fps) / fps) * 1000;
  return Math.max(maximum, Math.abs(startMs - frameBoundaryMs));
}, 0);
if (audio && captionDriftMs > 80) {
  console.warn(`WARNING: caption drift ${captionDriftMs.toFixed(2)}ms exceeds 80ms.`);
}

const report = {
  runId,
  generatedAt: new Date().toISOString(),
  compositionId: "LucidaMotionDemo",
  output: path.relative(appRoot, output),
  ...(audio
    ? {
        voiceChecksum: voiceTrack?.checksum ?? audio.checksum,
        voiceDurationMs: voiceTrack?.durationMs ?? audio.durationMs,
        audioStream,
        captionDriftMs: Math.round(captionDriftMs * 100) / 100,
      }
    : {}),
};
const serializedReport = `${JSON.stringify(report, null, 2)}\n`;
fs.writeFileSync(path.join(outDir, "render-report.json"), serializedReport);
fs.writeFileSync(path.join(outDir, "render-output.json"), serializedReport);
console.log(`Rendered ${path.relative(appRoot, output)}`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
