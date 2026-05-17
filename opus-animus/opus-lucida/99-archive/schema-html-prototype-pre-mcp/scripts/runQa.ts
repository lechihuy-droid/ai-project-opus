import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { checkDeckSlotBudgets } from '../src/qa/slotBudget';
import { validateLucidaRules } from '../src/qa/lucidaRules';
import { checkTextDensity } from '../src/qa/textDensityChecks';
import type { QaIssue, QaStatus } from '../src/schema';
import { loadDeck } from './loadDeck';

const deckPath = process.argv[2] ?? 'src/fixtures/sampleDeck.json';
const reportPath = resolve(process.cwd(), process.argv[4] ?? 'output/qa-report.json');
const deck = await loadDeck(deckPath);
const url =
  process.argv[3] ??
  (deck.deck_meta.deck_id.startsWith('wake-cluster') ? 'http://127.0.0.1:4177/?deck=wake' : 'http://127.0.0.1:4177');

function statusFromIssues(issues: QaIssue[]): QaStatus {
  if (issues.some((issue) => issue.severity === 'error')) return 'REVISE';
  if (issues.length > 0) return 'PASS_WITH_NOTES';
  return 'PASS';
}

async function geometryForSlide(page: Page, slideIndex: number): Promise<QaIssue[]> {
  return page.evaluate((index) => {
    const slide = document.querySelectorAll<HTMLElement>('.slide')[index];
    if (!slide) {
      return [
        {
          code: 'missing_rendered_slide',
          severity: 'error',
          message: `Rendered slide ${index + 1} is missing.`
        }
      ];
    }
    const slideRect = slide.getBoundingClientRect();
    const boxes = Array.from(slide.querySelectorAll<HTMLElement>('[data-slot]')).map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        selector: `[data-slot="${el.dataset.slot}"]`,
        x: rect.x - slideRect.x,
        y: rect.y - slideRect.y,
        width: rect.width,
        height: rect.height,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        overflowX: getComputedStyle(el).overflowX,
        overflowY: getComputedStyle(el).overflowY
      };
    });
    const issues: Array<{ code: string; severity: 'warning' | 'error'; message: string; selector?: string }> = [];
    for (const box of boxes) {
      if (box.x < -1 || box.y < -1 || box.x + box.width > 1921 || box.y + box.height > 1081) {
        issues.push({
          code: 'out_of_bounds',
          severity: 'error',
          message: `${box.selector} is outside slide bounds.`,
          selector: box.selector
        });
      }
      const clipsX = box.overflowX !== 'visible';
      const clipsY = box.overflowY !== 'visible';
      if ((clipsY && box.scrollHeight > box.clientHeight + 16) || (clipsX && box.scrollWidth > box.clientWidth + 16)) {
        issues.push({
          code: 'overflow',
          severity: 'error',
          message: `${box.selector} overflows its rendered box.`,
          selector: box.selector
        });
      }
    }
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        const overlap = a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
        if (overlap) {
          issues.push({
            code: 'overlap',
            severity: 'warning',
            message: `${a.selector} overlaps ${b.selector}.`,
            selector: a.selector
          });
        }
      }
    }
    return issues;
  }, slideIndex);
}

const deckIssues = [...validateLucidaRules(deck), ...checkDeckSlotBudgets(deck), ...checkTextDensity(deck)];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle' });

const renderedCount = await page.locator('.slide').count();
if (renderedCount !== deck.slides.length) {
  deckIssues.push({
    code: 'slide_count_mismatch',
    severity: 'error',
    message: `Rendered slide count ${renderedCount} does not match JSON ${deck.slides.length}.`
  });
}

const slideReports = [];
for (let i = 0; i < deck.slides.length; i += 1) {
  const slide = deck.slides[i];
  const issues = [
    ...deckIssues.filter((issue) => issue.slide_id === slide.slide_id),
    ...(await geometryForSlide(page, i)).map((issue) => ({ ...issue, slide_id: slide.slide_id }))
  ];
  slideReports.push({
    slide_id: slide.slide_id,
    status: statusFromIssues(issues),
    issues
  });
}

await browser.close();

const report = {
  deck_id: deck.deck_meta.deck_id,
  status: statusFromIssues([...deckIssues, ...slideReports.flatMap((slide) => slide.issues)]),
  issues: deckIssues.filter((issue) => !issue.slide_id),
  slides: slideReports
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
console.log(`[qa] ${report.status} -> ${reportPath}`);
if (report.status === 'REVISE' || report.status === 'BLOCK') {
  process.exit(1);
}
