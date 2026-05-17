import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { agentRoot, fail, isMain, parseArgs, repoRoot } from './lib.js';

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function copyBaselineIfNeeded(lane, framesDir) {
  const baselineDir = path.join(agentRoot, 'lessons', lane, 'baseline-frames');
  if (fs.existsSync(baselineDir)) return;
  if (!fs.existsSync(framesDir)) return;
  fs.mkdirSync(baselineDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir).filter((name) => name.endsWith('.png'))) {
    fs.copyFileSync(path.join(framesDir, file), path.join(baselineDir, file));
  }
}

export async function exportFrames(lane, outDir, size = { width: 1920, height: 1080 }) {
  const deckPath = path.join(agentRoot, 'lessons', lane, 'final-deck.html');
  if (!fs.existsSync(deckPath)) throw Object.assign(new Error(`missing deck ${deckPath}`), { code: 4 });
  const framesDir = outDir || path.join(repoRoot, 'production', '00-active', lane, 'frames');
  copyBaselineIfNeeded(lane, framesDir);
  fs.mkdirSync(framesDir, { recursive: true });
  for (const file of fs.readdirSync(framesDir).filter((name) => name.endsWith('.png'))) {
    fs.unlinkSync(path.join(framesDir, file));
  }

  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  await page.goto(`file://${deckPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: `.slide:not(.is-exporting){display:none!important}` });
  const slides = await page.locator('section.slide').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-slide-id')));
  for (let i = 0; i < slides.length; i += 1) {
    const slideId = slides[i];
    await page.locator('section.slide').evaluateAll((nodes, active) => {
      nodes.forEach((node) => node.classList.toggle('is-exporting', node.getAttribute('data-slide-id') === active));
    }, slideId);
    const fileName = `slide-${String(i + 1).padStart(2, '0')}-${slideId}.png`;
    await page.locator(`section.slide[data-slide-id="${slideId}"]`).screenshot({ path: path.join(framesDir, fileName) });
  }
  await browser.close();
  return { framesDir, count: slides.length };
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  if (!args.lane) fail(4, 'Usage: node scripts/exportFrames.js --lane <lane-id> [--out <dir>]');
  try {
    const width = args.width ? Number(args.width) : 1920;
    const height = args.height ? Number(args.height) : 1080;
    const result = await exportFrames(args.lane, args.out ? path.resolve(process.cwd(), args.out) : undefined, { width, height });
    console.log(`Exported ${result.count} frames to ${result.framesDir}`);
  } catch (error) {
    fail(error.code || 4, error.stack || error.message);
  }
}
