#!/usr/bin/env node

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPublishableProductionRun,
  findRenderedVideo,
  readApprovalRecords,
  readJson as readOrchestrationJson,
  sha256File,
} from "./operating-model/orchestration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const fail = (message) => {
  console.error(`publish:handoff: ${message}`);
  process.exit(1);
};

const parseArgs = (argv) => {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--run-id", "--video", "--thumb-at", "--envelope", "--approvals"].includes(flag)) fail(`Unknown argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) fail(`Missing value for ${flag}`);
    parsed[flag.slice(2)] = value;
    index += 1;
  }
  if (!parsed["run-id"]) fail("Usage: npm run publish:handoff -- --run-id <id> [--video <path>] [--thumb-at <seconds>] [--envelope <candidate.json> --approvals <candidate.json>]");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(parsed["run-id"])) fail("Invalid --run-id");
  if (Boolean(parsed.envelope) !== Boolean(parsed.approvals)) {
    fail("--envelope and --approvals must be provided together");
  }
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
const runFile = (value, label) => {
  const filePath = path.resolve(root, value);
  const relativePath = path.relative(runDir, filePath);
  if (relativePath === "" || relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    fail(`${label} must be a file inside this run directory`);
  }
  if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) fail(`${label} does not exist: ${filePath}`);
  return filePath;
};
const envelopePath = args.envelope ? runFile(args.envelope, "--envelope") : path.join(runDir, "run-envelope.json");
const approvalsPath = args.approvals ? runFile(args.approvals, "--approvals") : path.join(runDir, "approvals.json");
const renderedVideo = findRenderedVideo(runDir);
if (!renderedVideo) fail(`No rendered video found for run ${runId}`);
const sourceVideo = args.video ? path.resolve(root, args.video) : renderedVideo;
if (!fs.existsSync(sourceVideo)) fail(`No MP4 found for run ${runId}`);
if (sha256File(sourceVideo) !== sha256File(renderedVideo)) {
  fail("--video must exactly match this run's rendered video");
}
try {
  assertPublishableProductionRun({
    envelope: readOrchestrationJson(envelopePath),
    approvals: readApprovalRecords(approvalsPath),
    scriptPath: path.join(runDir, "approved-script.json"),
    videoMapPath: path.join(runDir, "video-map.source.json"),
    videoPath: renderedVideo,
    qaReportPath: path.join(runDir, "qa-report.json"),
    qaInputPaths: {
      approvedScript: path.join(runDir, "approved-script.json"),
      sourceVideoMap: path.join(runDir, "video-map.source.json"),
      timedVideoMap: path.join(runDir, "video-map.json"),
      renderProps: path.join(runDir, "render-props.json"),
      timedScript: path.join(root, "public", "runs", runId, "audio", "timed-script.json"),
      audio: path.join(root, "public", "runs", runId, "audio", "voice.wav"),
      normalizedInput: path.join(runDir, "normalized-input.json"),
      contentBrief: path.join(runDir, "content-brief.json"),
    },
  });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

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
