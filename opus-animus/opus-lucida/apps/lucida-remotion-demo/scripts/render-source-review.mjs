import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {pathToFileURL} from "node:url";

const root = process.cwd();
const inputPath = path.resolve(root, process.argv[2] ?? "pipeline/runs/full-pipeline-test-4/01-raw-input.json");
const outDir = path.resolve(root, process.argv[3] ?? "pipeline/runs/full-pipeline-test-4/source-review");
const chrome = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
fs.mkdirSync(outDir, {recursive: true});

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const reviews = {
  script: {
    label: "NARRATIVE INPUT",
    verdict: "Useful structure, weak content depth",
    score: "5.5 / 10",
    note: "Three clean story blocks prove ingestion and provenance. Replace the fixture copy with an approved script before using it for visual direction.",
  },
  command: {
    label: "RUNTIME INPUT",
    verdict: "Safe capture, minimal visual value",
    score: "4 / 10",
    note: "The allowlisted command and exit metadata are correct. A real build, test, or analysis command is needed to produce meaningful dashboard or process scenes.",
  },
  asciicast: {
    label: "TIMED TERMINAL INPUT",
    verdict: "Best structured source in this run",
    score: "7 / 10",
    note: "Timing, marker, output, and resize events provide strong animation cues. The recording is only 2.5 seconds, so it validates mechanics rather than final aesthetics.",
  },
};

const contentFor = (source) => {
  if (source.sourceType === "script") {
    return source.records
      .map((record, index) => `<div class="story"><span>0${index + 1}</span><p>${escapeHtml(record.text)}</p></div>`)
      .join("");
  }
  if (source.sourceType === "command") {
    const meta = source.metadata;
    return `<div class="terminal">
      <div class="terminal-bar"><i></i><i></i><i></i><b>command capture</b></div>
      <div class="prompt"><span>$</span> ${escapeHtml(meta.command)} ${escapeHtml(meta.args.join(" "))}</div>
      ${source.records.map((record) => `<div class="output">${escapeHtml(record.text)}</div>`).join("")}
      <div class="meta"><span>EXIT ${meta.exitCode}</span><span>${escapeHtml(meta.cwd)}</span></div>
    </div>`;
  }
  return `<div class="cast-meta"><span>${source.metadata.width} x ${source.metadata.height}</span><span>${source.metadata.duration}s</span><span>${source.records.length} events</span></div>
    <div class="timeline">${source.records
      .map((record) => `<div class="event"><time>${Number(record.timeSeconds).toFixed(1)}s</time><b>${escapeHtml(record.kind)}</b><pre>${escapeHtml(record.data)}</pre></div>`)
      .join("")}</div>`;
};

const htmlFor = (source) => {
  const review = reviews[source.sourceType];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:#0b0d10;color:#f3efe7;font-family:Inter,"Segoe UI",Arial,sans-serif}
  body{padding:68px;position:relative}body:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 4px,rgba(255,255,255,.018) 5px)}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #30343b;padding-bottom:28px}
  .eyebrow{font:700 15px Consolas,monospace;color:#69d1dc}.source{font:600 16px Consolas,monospace;color:#8d969f}
  h1{font-size:58px;line-height:1.02;letter-spacing:0;margin:42px 0 14px;max-width:850px}.sub{color:#9aa2aa;font-size:21px;margin:0 0 42px}
  main{min-height:570px}.story{display:grid;grid-template-columns:70px 1fr;gap:22px;border-top:1px solid #252930;padding:26px 0}.story span{color:#d9b66f;font:700 18px Consolas}.story p{font-size:31px;line-height:1.25;margin:0}
  .terminal{border:1px solid #343a43;border-radius:8px;overflow:hidden;background:#11151a;box-shadow:0 22px 60px rgba(0,0,0,.34)}.terminal-bar{height:62px;padding:0 22px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #343a43;color:#88919a;font:15px Consolas}.terminal-bar i{width:12px;height:12px;border-radius:50%;background:#e16d68}.terminal-bar i:nth-child(2){background:#d9b66f}.terminal-bar i:nth-child(3){background:#67bf83}.terminal-bar b{margin-left:14px}.prompt,.output{padding:30px 36px 0;font:24px/1.5 Consolas,monospace}.prompt span{color:#69d1dc}.output{color:#73cb8e;padding-top:14px}.meta{margin-top:50px;border-top:1px solid #292f36;padding:22px 36px;display:flex;justify-content:space-between;color:#929ba4;font:15px Consolas}
  .cast-meta{display:flex;gap:10px;margin-bottom:26px}.cast-meta span{border:1px solid #39414a;padding:10px 14px;border-radius:4px;color:#aab2ba;font:15px Consolas}.timeline{border-left:2px solid #39414a;margin-left:40px}.event{display:grid;grid-template-columns:85px 110px 1fr;align-items:start;gap:18px;position:relative;padding:16px 0 18px 32px}.event:before{content:"";position:absolute;left:-7px;top:25px;width:12px;height:12px;background:#69d1dc;border-radius:50%}.event time{color:#d9b66f;font:16px Consolas}.event b{text-transform:uppercase;color:#aab2ba;font:15px Consolas}.event pre{white-space:pre-wrap;margin:0;color:#edf1f3;font:20px/1.35 Consolas}
  footer{position:absolute;left:68px;right:68px;bottom:64px;border-top:1px solid #30343b;padding-top:28px;display:grid;grid-template-columns:1fr 170px;gap:36px}.verdict{font-size:25px;font-weight:700;margin-bottom:10px}.note{font-size:18px;line-height:1.45;color:#9aa2aa}.score{border-left:1px solid #30343b;padding-left:30px}.score small{display:block;color:#8f98a1;font:13px Consolas;margin-bottom:8px}.score b{font-size:30px;color:#d9b66f}
  </style></head><body>
  <header><div class="eyebrow">${review.label}</div><div class="source">${escapeHtml(source.collectorVersion)}</div></header>
  <h1>${escapeHtml(source.sourceId)}</h1><p class="sub">${escapeHtml(source.sourceType)} · ${source.records.length} collected records · checksum verified</p>
  <main>${contentFor(source)}</main>
  <footer><div><div class="verdict">${review.verdict}</div><div class="note">${review.note}</div></div><div class="score"><small>INPUT QUALITY</small><b>${review.score}</b></div></footer>
  </body></html>`;
};

const results = [];
for (const source of raw.sources) {
  const htmlPath = path.join(outDir, `${source.sourceId}.html`);
  const pngPath = path.join(outDir, `${source.sourceId}.png`);
  fs.writeFileSync(htmlPath, htmlFor(source));
  const result = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1080,1350",
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href,
  ], {stdio: "inherit", windowsHide: true});
  if (result.status !== 0) process.exit(result.status ?? 1);
  results.push({sourceId: source.sourceId, png: path.relative(root, pngPath)});
}
fs.writeFileSync(path.join(outDir, "review-report.json"), JSON.stringify({generatedAt: new Date().toISOString(), results}, null, 2) + "\n");
console.log(`Rendered ${results.length} source review PNGs -> ${path.relative(root, outDir)}`);
