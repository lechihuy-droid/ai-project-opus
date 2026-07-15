import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runIdIndex = process.argv.indexOf("--run-id");
const runId = runIdIndex >= 0 ? process.argv[runIdIndex + 1] : undefined;
if (!runId || !/^[A-Za-z0-9._-]+$/u.test(runId)) {
  console.error("Usage: node scripts/test-audio-e2e.mjs --run-id <id>");
  process.exit(1);
}

let failed = false;
const check = (label, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}: ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failed = true;
};
const readJson = (filePath) => {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return null; }
};
const probe = (filePath) => {
  const result = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "stream=codec_type,sample_rate,channels:format=duration", "-of", "json", filePath,
  ], { encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) return null;
  try { return JSON.parse(result.stdout); } catch { return null; }
};
const sha256 = (filePath) => `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;

const runDir = path.join(root, "public", "runs", runId);
const audioDir = path.join(runDir, "audio");
const voicePath = path.join(audioDir, "voice.wav");
const voiceTrackPath = path.join(audioDir, "voice-track.json");
const timedScriptPath = path.join(audioDir, "timed-script.json");
const videoMapPath = path.join(runDir, "video-map.json");
const mp4Candidates = [
  path.join(root, "output", "render", "flow-runs", runId, "video.mp4"),
  path.join(runDir, "video.mp4"),
];

const voiceExists = fs.existsSync(voicePath);
check("voice.wav exists", voiceExists, voicePath);
const voiceProbe = voiceExists ? probe(voicePath) : null;
const voiceAudio = voiceProbe?.streams?.find((stream) => stream.codec_type === "audio");
check("voice.wav is 48kHz mono", voiceAudio?.sample_rate === "48000" && voiceAudio?.channels === 1,
  voiceProbe ? `${voiceAudio?.sample_rate ?? "?"}Hz, ${voiceAudio?.channels ?? "?"} channel(s)` : "ffprobe failed");

const voiceTrack = readJson(voiceTrackPath);
check("voice-track.json exists and parses", Boolean(voiceTrack), voiceTrackPath);
const actualChecksum = voiceExists ? sha256(voicePath) : null;
check("voice-track checksum matches voice.wav", Boolean(actualChecksum && voiceTrack?.checksum === actualChecksum),
  `track=${voiceTrack?.checksum ?? "missing"}, file=${actualChecksum ?? "missing"}`);

const timedScript = readJson(timedScriptPath);
check("timed-script.json exists and parses", Boolean(timedScript), timedScriptPath);
check("timed-script voiceChecksum matches", Boolean(timedScript?.voiceChecksum && timedScript.voiceChecksum === voiceTrack?.checksum),
  `timed=${timedScript?.voiceChecksum ?? "missing"}, track=${voiceTrack?.checksum ?? "missing"}`);

const videoMap = readJson(videoMapPath);
check("applied video-map exists and parses", Boolean(videoMap), videoMapPath);
const ranges = (videoMap?.scenes ?? [])
  .filter((scene) => Number.isFinite(scene.startMs) && Number.isFinite(scene.endMs))
  .map((scene) => ({ id: scene.id, startMs: scene.startMs, endMs: scene.endMs }))
  .sort((a, b) => a.startMs - b.startMs);
const allScenesTimed = Boolean(videoMap?.scenes?.length) && ranges.length === videoMap.scenes.length;
const expectedDurationMs = Number(voiceTrack?.durationMs ?? timedScript?.durationMs);
const rangesValid = ranges.every((range) => range.startMs >= 0 && range.endMs > range.startMs);
let largestGapMs = ranges.length > 0 ? ranges[0].startMs : Number.POSITIVE_INFINITY;
for (let index = 1; index < ranges.length; index += 1) {
  largestGapMs = Math.max(largestGapMs, ranges[index].startMs - ranges[index - 1].endMs);
}
if (ranges.length > 0 && Number.isFinite(expectedDurationMs)) {
  largestGapMs = Math.max(largestGapMs, expectedDurationMs - ranges[ranges.length - 1].endMs);
}
check("video-map scene timing covers without gaps over 1000ms", allScenesTimed && rangesValid && largestGapMs <= 1000,
  `timed=${ranges.length}/${videoMap?.scenes?.length ?? 0}, largestGapMs=${largestGapMs}`);

const mp4Path = mp4Candidates.find((candidate) => fs.existsSync(candidate));
if (mp4Path) {
  const mp4Probe = probe(mp4Path);
  const hasAudio = Boolean(mp4Probe?.streams?.some((stream) => stream.codec_type === "audio"));
  check("mp4 contains an audio stream", hasAudio, mp4Path);
  const mp4DurationMs = Number(mp4Probe?.format?.duration) * 1000;
  const durationOk = Number.isFinite(mp4DurationMs) && Number.isFinite(expectedDurationMs) &&
    Math.abs(mp4DurationMs - expectedDurationMs) <= 100;
  check("mp4 duration matches voice within 100ms", durationOk,
    `mp4=${Number.isFinite(mp4DurationMs) ? Math.round(mp4DurationMs) : "?"}ms, voice=${Number.isFinite(expectedDurationMs) ? expectedDurationMs : "?"}ms`);
} else {
  console.log("PASS: mp4 checks skipped - no mp4 artifact present");
}

process.exitCode = failed ? 1 : 0;
