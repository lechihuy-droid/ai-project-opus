#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const fail = (message) => {
  console.error(`publish:handoff: ${message}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--run-id", "--video", "--thumb-at"].includes(flag)) fail(`Unknown argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!parsed["run-id"]) fail("Usage: npm run publish:handoff -- --run-id <id> [--video <path>] [--thumb-at <seconds>]");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(parsed["run-id"])) fail("Invalid --run-id");
  const thumbAt = Number(parsed["thumb-at"] ?? 1);
  if (!Number.isFinite(thumbAt) || thumbAt < 0) fail("--thumb-at must be a non-negative number");
  return { ...parsed, thumbAt };
};

const readJson = (filePath, fallback = {}) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
};

const findMp4 = (directory) => {
  if (!fs.existsSync(directory)) return null;
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".mp4") return candidate;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = findMp4(path.join(directory, entry.name));
    if (candidate) return candidate;
  }
  return null;
};

const runCommand = (command, commandArgs, capture = false) => {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: capture ? "utf8" : undefined,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    const detail = capture ? result.stderr?.trim() : "";
    fail(`${command} failed${detail ? `: ${detail}` : ""}`);
  }
  return capture ? result.stdout.trim() : "";
};

const args = parseArgs(process.argv.slice(2));
const runId = args["run-id"];
const runDir = path.join(root, "output", "render", "flow-runs", runId);
const sourceVideo = args.video ? path.resolve(root, args.video) : findMp4(runDir);
if (!sourceVideo || !fs.existsSync(sourceVideo)) fail(`No MP4 found for run ${runId}`);

const publishDir = path.join(root, "output", "publish", runId);
const outputVideo = path.join(publishDir, "video.mp4");
fs.mkdirSync(publishDir, { recursive: true });
fs.copyFileSync(sourceVideo, outputVideo);

runCommand("ffmpeg", [
  "-y",
  "-hide_banner",
  "-loglevel",
  "error",
  "-ss",
  String(args.thumbAt),
  "-i",
  outputVideo,
  "-frames:v",
  "1",
  path.join(publishDir, "thumbnail.png"),
]);

const durationSec = Number(
  runCommand("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    outputVideo,
  ], true),
);
if (!Number.isFinite(durationSec) || durationSec <= 0) fail("ffprobe returned an invalid video duration");

const videoMap = readJson(path.join(runDir, "video-map.json"), readJson(path.join(runDir, "video-map.source.json")));
const approvedScript = readJson(path.join(runDir, "approved-script.json"));
const series = videoMap.brand?.series ?? "";
const hashtagsBySeries = {
  "lucida-now": ["#AI", "#TinAI", "#CôngNghệ"],
  "lucida-work": ["#AI", "#OfficeAI", "#NăngSuất"],
  "lucida-lab": ["#AI", "#DevTools", "#Research"],
  "lucida-check": ["#AI", "#ReviewAI"],
};
const hook = videoMap.scenes?.find((scene) => scene.intent === "hook")?.headline ?? "";
const takeaway = videoMap.scenes?.find((scene) => scene.intent === "takeaway")?.headline ?? "";
const metadata = {
  title: videoMap.video?.title ?? approvedScript.title ?? "",
  subtitle: videoMap.video?.subtitle ?? approvedScript.subtitle ?? "",
  series,
  durationSec: Math.round(durationSec * 1000) / 1000,
  checksum: `sha256:${crypto.createHash("sha256").update(fs.readFileSync(outputVideo)).digest("hex")}`,
  description: [hook, takeaway, "CTA: [thêm lời kêu gọi hành động trước khi đăng]"].filter(Boolean).join("\n\n"),
  hashtags: hashtagsBySeries[series] ?? ["#AI"],
};
fs.writeFileSync(path.join(publishDir, "metadata.json"), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

const checklist = `# Publish checklist — ${runId}

## Upload thủ công

- [ ] Xem lại toàn bộ video.mp4 và thumbnail.png.
- [ ] Điền CTA cuối cùng, rà soát title, description và hashtags trong metadata.json.
- [ ] Upload video và thumbnail lên nền tảng đích.
- [ ] Kiểm tra crop, subtitle, âm thanh và safe area trong bản preview của nền tảng.
- [ ] Chỉ publish sau khi tất cả mục non-negotiable bên dưới đã đạt.

## Non-negotiable failures

- [ ] Không có claim quan trọng bị diễn đạt quá mức bằng chứng.
- [ ] Không có subtitle sai timing rõ rệt.
- [ ] Visual vẫn nhận diện rõ là Lucida.
- [ ] CTA hoặc conclusion không kích động fear khi thiếu agency.
- [ ] Không có asset vi phạm bản quyền hoặc không rõ nguồn.
`;
fs.writeFileSync(path.join(publishDir, "checklist.md"), checklist, "utf8");
console.log(`Publish bundle created: ${path.relative(root, publishDir)}`);
