import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
};
const propsArg = valueAfter("--props");
if (!propsArg)
  throw new Error(
    "Usage: npm run preview:generated -- --props <render-props.json>",
  );
const root = process.cwd();
const propsPath = path.resolve(root, propsArg);
const props = JSON.parse(fs.readFileSync(propsPath, "utf8"));
const outDir = path.join(path.dirname(propsPath), "preview");
fs.mkdirSync(outDir, { recursive: true });
const stills = [];
let startFrame = 0;
const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), "lucida-preview-bundle-"));
const configuredBrowser = process.env.LUCIDA_BROWSER_EXECUTABLE?.trim();
const browserExecutable = configuredBrowser ? path.resolve(configuredBrowser) : null;
if (browserExecutable && (!fs.existsSync(browserExecutable) || !fs.statSync(browserExecutable).isFile())) {
  throw new Error(`LUCIDA_BROWSER_EXECUTABLE is not a readable file: ${browserExecutable}`);
}
let browser;

try {
  const serveUrl = await bundle({
    entryPoint: path.join(root, "src", "index.ts"),
    outDir: bundleDir,
    enableCaching: true,
    webpackOverride: enableTailwind,
    onProgress: (progress) => process.stdout.write(`\rBundling ${Math.round(progress)}%`),
  });
  process.stdout.write("\n");
  browser = await openBrowser("chrome", {
    ...(browserExecutable ? { browserExecutable } : {}),
    logLevel: "warn",
  });
  const composition = await selectComposition({
    serveUrl,
    id: "LucidaMotionDemo",
    inputProps: props,
    puppeteerInstance: browser,
    logLevel: "warn",
  });
  for (const [index, scene] of props.videoMap.scenes.entries()) {
    const frames = Math.round(scene.durationSec * props.videoMap.video.fps);
    const frame = startFrame + Math.floor(frames / 2);
    const output = path.join(outDir, `scene-${String(index + 1).padStart(2, "0")}.png`);
    await renderStill({
      composition,
      serveUrl,
      output,
      frame,
      inputProps: props,
      imageFormat: "png",
      overwrite: true,
      puppeteerInstance: browser,
      logLevel: "warn",
    });
    stills.push({
      sceneId: scene.id,
      templateId: scene.templateId,
      frame,
      output: path.relative(root, output),
    });
    startFrame += frames;
    console.log(`Rendered still ${index + 1}/${props.videoMap.scenes.length}: ${path.relative(root, output)}`);
  }
} finally {
  if (browser) {
    const closed = await Promise.race([
      browser.close({ silent: true }).then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 10_000)),
    ]);
    if (!closed) {
      browser.disconnect();
      browser.runner.forgetEventLoop();
      console.warn("WARNING: Browser close exceeded 10s; disconnected after rendered artifacts were flushed.");
    }
  }
  fs.rmSync(bundleDir, { recursive: true, force: true });
}
fs.writeFileSync(
  path.join(outDir, "preview-report.json"),
  JSON.stringify(
    { ok: true, generatedAt: new Date().toISOString(), stills },
    null,
    2,
  ) + "\n",
);
console.log(
  `Generated ${stills.length} preview stills -> ${path.relative(root, outDir)}`,
);
