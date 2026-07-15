import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const workspaceRoot = path.resolve(import.meta.dirname, "..");
const examplesRoot = path.join(workspaceRoot, "examples");
const outputRoot = path.resolve(
  process.env.HYPERFRAMES_OUTPUT_ROOT || "D:\\HyperFrames\\output",
  "samples",
);
const tempRoot = path.resolve(
  process.env.HYPERFRAMES_TEMP_ROOT || "D:\\HyperFrames\\tmp",
);

const sampleNames = process.argv.slice(2);
const targets = sampleNames.length > 0 ? sampleNames : ["hello-world", "typography", "timeline", "terminal"];

process.env.TEMP = tempRoot;
process.env.TMP = tempRoot;
process.env.TMPDIR = tempRoot;
process.env.HYPERFRAMES_FFMPEG_PATH ||=
  "C:\\Users\\HUY\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-124279-g0f6ba39122-win64-gpl\\bin\\ffmpeg.exe";
process.env.HYPERFRAMES_FFPROBE_PATH ||=
  "C:\\Users\\HUY\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-124279-g0f6ba39122-win64-gpl\\bin\\ffprobe.exe";
process.env.PRODUCER_HEADLESS_SHELL_PATH ||=
  "C:\\Users\\HUY\\.cache\\hyperframes\\chrome\\chrome-headless-shell\\win64-152.0.7928.2\\chrome-headless-shell-win64\\chrome-headless-shell.exe";

await mkdir(outputRoot, { recursive: true });
await mkdir(tempRoot, { recursive: true });
const { createRenderJob, executeRenderJob } = await import(
  "../hyperframes/packages/producer/dist/index.js"
);

console.log(`[render] output ${outputRoot}`);
console.log(`[render] temp ${tempRoot}`);

for (const name of targets) {
  const projectDir = path.join(examplesRoot, name);
  const outputPath = path.join(outputRoot, `${name}.mp4`);
  const job = createRenderJob({
    fps: 30,
    quality: "draft",
    workers: 1,
    format: "mp4",
    producerConfig: {
      enableStreamingEncode: false,
    },
  });

  console.log(`[render] start ${name}`);
  const startedAt = Date.now();

  await executeRenderJob(job, projectDir, outputPath, (state, message) => {
    const progress = formatProgress(state.progress);
    console.log(`[render] ${name} ${state.status} ${progress} ${message}`);
  });

  const elapsedMs = Date.now() - startedAt;
  console.log(`[render] done ${name} -> ${outputPath} (${elapsedMs}ms)`);
}

function formatProgress(value) {
  if (!Number.isFinite(value)) return "n/a";
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}
