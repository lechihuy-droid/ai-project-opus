import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const defaultOutputRoot = "D:\\HyperFrames\\output";
const defaultTempRoot = "D:\\HyperFrames\\tmp";

const defaultFfmpegPath =
  "C:\\Users\\HUY\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-124279-g0f6ba39122-win64-gpl\\bin\\ffmpeg.exe";
const defaultFfprobePath =
  "C:\\Users\\HUY\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-124279-g0f6ba39122-win64-gpl\\bin\\ffprobe.exe";
const defaultChromePath =
  "C:\\Users\\HUY\\.cache\\hyperframes\\chrome\\chrome-headless-shell\\win64-152.0.7928.2\\chrome-headless-shell-win64\\chrome-headless-shell.exe";

main().catch((error) => {
  console.error(`[render-project] ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.project) {
    printHelp();
    return;
  }

  const tempDir = path.resolve(
    args.tempDir || process.env.HYPERFRAMES_TEMP_ROOT || defaultTempRoot,
  );
  process.env.TEMP = tempDir;
  process.env.TMP = tempDir;
  process.env.TMPDIR = tempDir;
  process.env.HYPERFRAMES_FFMPEG_PATH ||= defaultFfmpegPath;
  process.env.HYPERFRAMES_FFPROBE_PATH ||= defaultFfprobePath;
  process.env.PRODUCER_HEADLESS_SHELL_PATH ||= defaultChromePath;
  process.env.HF_DE_PARALLEL_ROUTER ||= "false";

  const projectDir = path.resolve(args.project);
  const outputRoot = process.env.HYPERFRAMES_OUTPUT_ROOT || defaultOutputRoot;
  const outputPath = path.resolve(
    args.output || path.join(outputRoot, `${path.basename(projectDir)}.mp4`),
  );
  await mkdir(tempDir, { recursive: true });
  await mkdir(path.dirname(outputPath), { recursive: true });

  const { createRenderJob, executeRenderJob } = await import(
    "../hyperframes/packages/producer/dist/index.js"
  );
  const job = createRenderJob({
    fps: Number(args.fps || 30),
    quality: args.quality || "draft",
    workers: Number(args.workers || 1),
    format: "mp4",
    producerConfig: {
      enableStreamingEncode: false,
    },
  });

  console.log(`[render-project] start ${projectDir}`);
  console.log(`[render-project] temp ${tempDir}`);
  console.log(`[render-project] output ${outputPath}`);
  await executeRenderJob(job, projectDir, outputPath, (state, message) => {
    const progress = formatProgress(state.progress);
    console.log(`[render-project] ${state.status} ${progress} ${message}`);
  });
  console.log(`[render-project] done ${outputPath}`);
}

function formatProgress(value) {
  if (!Number.isFinite(value)) return "n/a";
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const item = args[index];
    if (item === "--help" || item === "-h") parsed.help = true;
    else if (item === "--project" || item === "-p") parsed.project = args[++index];
    else if (item === "--output" || item === "-o") parsed.output = args[++index];
    else if (item === "--quality") parsed.quality = args[++index];
    else if (item === "--workers") parsed.workers = args[++index];
    else if (item === "--fps") parsed.fps = args[++index];
    else if (item === "--temp-dir") parsed.tempDir = args[++index];
  }
  return parsed;
}

function printHelp() {
  console.log(`Usage:
  node renderer/render-project.mjs --project generated/ai-engine-intro
  node renderer/render-project.mjs --project generated/ai-engine-intro --output D:\\HyperFrames\\output\\ai-engine-intro.mp4

Options:
  --output <path>       Default: D:\\HyperFrames\\output\\<project>.mp4
  --temp-dir <path>     Default: D:\\HyperFrames\\tmp
  --quality draft|standard|high
  --workers 1
  --fps 30`);
}
