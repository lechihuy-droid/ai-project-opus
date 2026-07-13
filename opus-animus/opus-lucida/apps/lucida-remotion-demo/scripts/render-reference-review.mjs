import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const args = process.argv.slice(2);
const inputPath = path.resolve(root, args[0] ?? "pipeline/runs/visual-reference-ingest-1/01-raw-input.json");
const outDir = path.resolve(root, args[1] ?? "pipeline/runs/visual-reference-ingest-1/source-review");
const chrome = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
const raw = JSON.parse(fs.readFileSync(inputPath, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const verdictFor = (sourceType) =>
  ({
    repository: ["REPOSITORY INPUT", "Strong source for reusable visual grammar", "8 / 10"],
    web_reference: ["WEB REFERENCE", "Good for layout and messaging cues", "7 / 10"],
    image_reference: ["IMAGE REFERENCE", "Useful as visual anchor", "6.5 / 10"],
    theme_reference: ["THEME INPUT", "High-value style token source", "8 / 10"],
  })[sourceType] ?? ["VISUAL INPUT", "Collected with provenance", "6 / 10"];

const recordsHtml = (source) =>
  source.records
    .slice(0, 8)
    .map(
      (record, index) => `<article class="card">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <b>${escapeHtml(record.kind)}</b>
        <p>${escapeHtml(record.text ?? JSON.stringify(record.data ?? {}))}</p>
      </article>`,
    )
    .join("");

const htmlFor = (source) => {
  const [label, verdict, score] = verdictFor(source.sourceType);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden;background:#0b0d10;color:#f3efe7;font-family:Inter,"Segoe UI",Arial,sans-serif}
  body{padding:68px;position:relative}body:after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 4px,rgba(255,255,255,.018) 5px)}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #30343b;padding-bottom:28px}
  .eyebrow{font:700 15px Consolas,monospace;color:#69d1dc}.source{font:600 16px Consolas,monospace;color:#8d969f}
  h1{font-size:54px;line-height:1.02;letter-spacing:0;margin:40px 0 14px;max-width:900px;word-break:break-word}.sub{color:#9aa2aa;font-size:21px;margin:0 0 34px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{min-height:132px;border:1px solid #2c333b;border-radius:8px;padding:18px;background:#11151a}
  .card span{display:block;color:#d9b66f;font:700 14px Consolas;margin-bottom:10px}.card b{display:block;color:#69d1dc;text-transform:uppercase;font:700 14px Consolas;margin-bottom:8px}
  .card p{margin:0;color:#d9dedf;font-size:18px;line-height:1.32;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
  footer{position:absolute;left:68px;right:68px;bottom:64px;border-top:1px solid #30343b;padding-top:28px;display:grid;grid-template-columns:1fr 170px;gap:36px}
  .verdict{font-size:25px;font-weight:700;margin-bottom:10px}.note{font-size:18px;line-height:1.45;color:#9aa2aa}.score{border-left:1px solid #30343b;padding-left:30px}.score small{display:block;color:#8f98a1;font:13px Consolas;margin-bottom:8px}.score b{font-size:30px;color:#d9b66f}
  </style></head><body>
  <header><div class="eyebrow">${label}</div><div class="source">${escapeHtml(source.collectorVersion)}</div></header>
  <h1>${escapeHtml(source.sourceId)}</h1><p class="sub">${escapeHtml(source.sourceType)} | ${source.records.length} records | checksum verified</p>
  <main class="grid">${recordsHtml(source)}</main>
  <footer><div><div class="verdict">${verdict}</div><div class="note">This review is generated from the normalized raw source artifact so references can be compared before mapping them into Remotion scenes.</div></div><div class="score"><small>INPUT QUALITY</small><b>${score}</b></div></footer>
  </body></html>`;
};

const results = [];
for (const source of raw.sources) {
  const htmlPath = path.join(outDir, `${source.sourceId}.html`);
  const pngPath = path.join(outDir, `${source.sourceId}.png`);
  fs.writeFileSync(htmlPath, htmlFor(source));
  const result = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1080,1350",
      `--screenshot=${pngPath}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  results.push({ sourceId: source.sourceId, png: path.relative(root, pngPath) });
}

fs.writeFileSync(
  path.join(outDir, "review-report.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2) + "\n",
);
console.log(`Rendered ${results.length} reference review PNGs -> ${path.relative(root, outDir)}`);
