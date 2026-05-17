import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { loadDeck } from './loadDeck';

const deckPath = process.argv[2] ?? 'src/fixtures/sampleDeck.json';
const outDir = resolve(process.cwd(), process.argv[3] ?? 'output/frames');
const deck = await loadDeck(deckPath);
const url =
  process.argv[4] ??
  (deck.deck_meta.deck_id.startsWith('wake-cluster') ? 'http://127.0.0.1:4177/?deck=wake' : 'http://127.0.0.1:4177');

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });

const slideCount = await page.locator('.slide').count();
if (slideCount !== deck.slides.length) {
  throw new Error(`Rendered slide count ${slideCount} does not match deck JSON ${deck.slides.length}.`);
}

for (let i = 0; i < slideCount; i += 1) {
  await page.evaluate((index) => window.scrollTo(0, index * 1080), i);
  const out = resolve(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({
    path: out,
    clip: { x: 0, y: 0, width: 1920, height: 1080 }
  });
  console.log(`[export] ${out}`);
}

await browser.close();
console.log(`[export] done ${slideCount}/${deck.slides.length}`);
