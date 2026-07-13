import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const runDir = path.resolve(root, "pipeline/runs/terminal-video-20s");
const frameDir = path.join(runDir, "frames");
const outDir = path.join(runDir, "output");
const output = path.join(outDir, "terminal-style-20s.mp4");
const chrome = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
fs.mkdirSync(frameDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const scenes = [
  {
    title: "Terminal style atlas",
    subtitle: "Collected terminal references become a reusable video style.",
    footer: "source: quarto terminal + terminal.css",
    rows: [
      ["$", "collect --family terminal --mode visual", "text"],
      [">", "found: reveal terminal chrome", "success"],
      [">", "found: css component systems", "success"],
      [">", "found: cyan/gold command palette", "warn"],
    ],
  },
  {
    title: "Palette locked",
    subtitle: "Cyan for command focus, gold for status, dark navy for depth.",
    footer: "scanline opacity: low",
    rows: [
      [">", "--term-bg: #080B10;", "muted"],
      [">", "--term-panel: #10151D;", "muted"],
      [">", "--term-accent: #65D8E8;", "accent"],
      [">", "--term-warn: #D2B47A;", "warn"],
    ],
  },
  {
    title: "Reusable primitives",
    subtitle: "From references to deterministic Remotion primitives.",
    footer: "terminal MVP",
    rows: [
      ["01", "window chrome + prompt path", "text"],
      ["02", "typed code panel + cursor", "text"],
      ["03", "dashboard rows + metrics", "text"],
      ["04", "provenance-backed scene router", "accent"],
    ],
  },
  {
    title: "Next: style atlas",
    subtitle: "Terminal proved the pipeline. Now we scale the atlas.",
    footer: "exit 0",
    rows: [
      [">", "terminal MVP rendered", "success"],
      [">", "next: editorial + dashboard + product", "text"],
      [">", "next: infographic + cinematic typography", "text"],
      [">", "status: ready", "warn"],
    ],
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const htmlFor = (scene, index) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#080b10;color:#f4f0e8;font-family:"Segoe UI",Arial,sans-serif}
body{position:relative;padding:72px;background:
radial-gradient(circle at 18% 12%, rgba(101,216,232,.13), transparent 28%),
linear-gradient(180deg,#080b10,#0b0f15 58%,#07090d)}
body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(101,216,232,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(101,216,232,.045) 1px,transparent 1px);background-size:54px 54px;opacity:.52}
body:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 4px,rgba(255,255,255,.018) 5px)}
.frame{position:relative;z-index:1;width:100%;height:100%;border:1px solid rgba(244,240,232,.08);box-shadow:inset 0 0 120px rgba(0,0,0,.52)}
.kicker{position:absolute;left:44px;top:46px;color:#65d8e8;font:800 24px Consolas,monospace;letter-spacing:0}
h1{position:absolute;left:44px;right:44px;top:92px;margin:0;color:#f4f0e8;font:900 62px/1.04 Consolas,monospace;letter-spacing:0}
.sub{position:absolute;left:44px;right:44px;top:230px;color:#8b98a8;font:25px/1.35 Consolas,monospace}
.terminal{position:absolute;left:44px;right:44px;top:430px;height:760px;border:1px solid #2a3442;border-radius:8px;background:#10151d;overflow:hidden;box-shadow:0 36px 90px rgba(0,0,0,.42),0 0 46px rgba(101,216,232,.08)}
.bar{height:72px;border-bottom:1px solid #2a3442;background:#151b24;display:flex;align-items:center;padding:0 28px;gap:13px;color:#8b98a8;font:22px Consolas,monospace}.dot{width:14px;height:14px;border-radius:50%}.red{background:#ec7a7a}.gold{background:#d2b47a}.green{background:#72c991}.path{margin-left:160px}
.rows{position:absolute;left:34px;right:34px;top:118px}.row{display:grid;grid-template-columns:58px 1fr;gap:18px;align-items:start;margin-bottom:42px;font:35px/1.28 Consolas,monospace}.prompt{color:#65d8e8;font-weight:900}.text{color:#f4f0e8}.success{color:#72c991}.warn{color:#d2b47a}.muted{color:#8b98a8}.accent{color:#65d8e8}
.status{position:absolute;right:34px;bottom:28px;color:#72c991;font:800 22px Consolas,monospace}.footer{position:absolute;left:44px;right:44px;bottom:340px;border-top:1px solid #2a3442;padding-top:26px;color:#d2b47a;font:800 25px Consolas,monospace}.counter{position:absolute;right:44px;bottom:44px;color:#8b98a8;font:22px Consolas,monospace}
</style></head><body><div class="frame">
<div class="kicker">LUCIDA / TERMINAL STYLE MVP</div>
<h1>${escapeHtml(scene.title)}</h1>
<div class="sub">${escapeHtml(scene.subtitle)}</div>
<div class="terminal"><div class="bar"><i class="dot red"></i><i class="dot gold"></i><i class="dot green"></i><span class="path">~/lucida/visual-atlas</span></div>
<div class="rows">${scene.rows.map(([prompt, text, tone]) => `<div class="row"><span class="prompt">${escapeHtml(prompt)}</span><span class="${tone}">${escapeHtml(text)}</span></div>`).join("")}</div>
<div class="status">STATUS: READY</div></div>
<div class="footer">${escapeHtml(scene.footer)}</div><div class="counter">scene ${String(index + 1).padStart(2, "0")} / 04</div>
</div></body></html>`;

const concatLines = [];
for (const [index, scene] of scenes.entries()) {
  const htmlPath = path.join(frameDir, `scene-${String(index + 1).padStart(2, "0")}.html`);
  const pngPath = path.join(frameDir, `scene-${String(index + 1).padStart(2, "0")}.png`);
  fs.writeFileSync(htmlPath, htmlFor(scene, index));
  const shot = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1080,1920",
      `--screenshot=${pngPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { cwd: root, stdio: "inherit", windowsHide: true },
  );
  if (shot.status !== 0) process.exit(shot.status ?? 1);
  concatLines.push(`file '${pngPath.replaceAll("\\", "/").replaceAll("'", "'\\''")}'`);
  concatLines.push("duration 5");
}
concatLines.push(concatLines[concatLines.length - 2]);
const concatPath = path.join(frameDir, "concat.txt");
fs.writeFileSync(concatPath, concatLines.join("\n") + "\n");

const render = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-hide_banner",
    "-loglevel",
    "warning",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-vf",
    "fps=30,format=yuv420p",
    "-t",
    "20",
    "-c:v",
    "libx264",
    "-movflags",
    "+faststart",
    output,
  ],
  { cwd: root, stdio: "inherit", windowsHide: true },
);
if (render.status !== 0) process.exit(render.status ?? 1);

const bytes = fs.readFileSync(output);
const report = {
  ok: true,
  renderer: "chrome-screenshots-plus-ffmpeg",
  durationSec: 20,
  generatedAt: new Date().toISOString(),
  output: path.relative(root, output).replaceAll("\\", "/"),
  frames: scenes.length,
  bytes: bytes.length,
  checksum: `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`,
};
fs.writeFileSync(
  path.join(outDir, "terminal-style-20s-report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(`Rendered ${report.output}`);
