import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageDir = path.join(root, "design/visual-library/styles/interface-walkthrough");
const artifactsDir = path.join(packageDir, "artifacts");
const demo = JSON.parse(fs.readFileSync(path.join(artifactsDir, "demo-video-map.json"), "utf8"));
const props = JSON.parse(fs.readFileSync(path.join(artifactsDir, "render-props.json"), "utf8"));
const deadline = Date.now() + 110_000;
const failure = (error) => ({ code: typeof error === "object" && error && "code" in error ? error.code : "RENDER_FAILED", message: error instanceof Error ? error.message : String(error) });
const within = async (name, ms, action) => {
  const timeout = Math.min(ms, deadline - Date.now());
  if (timeout <= 0) throw new Error(`Deadline exceeded before ${name}`);
  let timer;
  try { return await Promise.race([action(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${name} timed out`)), timeout); })]); } finally { clearTimeout(timer); }
};
let browser;
let report = { schemaVersion: "lucida-terra-render-review/v1", actor: "Terra", packageId: demo.packageId, status: "failed", decision: "no-approval-or-promotion", validated: false, bounds: { totalMs: 110000, bundleMs: 30000, browserMs: 12000, sceneMs: 9000 }, frames: [], failure: null };
try {
  fs.mkdirSync(path.join(artifactsDir, "frames"), { recursive: true });
  const serveUrl = await within("bundle", 30000, () => bundle({ entryPoint: path.join(root, props.entryPoint) }));
  browser = await within("open-browser", 12000, () => openBrowser("chrome", { logLevel: "error" }));
  const composition = await within("select-composition", 10000, () => selectComposition({ serveUrl, id: props.compositionId, inputProps: { sceneKey: demo.scenes[0].sceneKey }, puppeteerInstance: browser, logLevel: "error" }));
  for (const scene of demo.scenes) { const output = path.join(artifactsDir, scene.output); await within(`render:${scene.id}`, 9000, () => renderStill({ serveUrl, composition, inputProps: { sceneKey: scene.sceneKey }, output, frame: scene.frame, imageFormat: "png", overwrite: true, puppeteerInstance: browser, logLevel: "error" })); report.frames.push({ id: scene.id, output: scene.output, nonBlank: fs.statSync(output).size > 0 }); }
  report.status = report.frames.length === 5 && report.frames.every((frame) => frame.nonBlank) ? "ok" : "failed";
  report.validated = report.status === "ok";
} catch (error) { report.failure = failure(error); report.status = "failed"; report.validated = false; } finally { if (browser) await browser.close({ silent: true }).catch(() => undefined); fs.writeFileSync(path.join(artifactsDir, "render-report.json"), `${JSON.stringify(report, null, 2)}\n`); }
process.exitCode = report.validated ? 0 : 1;
