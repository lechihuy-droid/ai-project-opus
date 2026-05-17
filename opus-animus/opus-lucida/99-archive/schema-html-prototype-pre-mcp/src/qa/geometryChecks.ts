import type { Page } from '@playwright/test';
import type { QaIssue } from '../schema';

type Box = {
  selector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export async function runGeometryChecks(page: Page): Promise<QaIssue[]> {
  const boxes = await page.locator('[data-slot]').evaluateAll((nodes) =>
    nodes.map((node) => {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      return {
        selector: `[data-slot="${el.dataset.slot}"]`,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        text: el.innerText
      };
    })
  );

  const issues: QaIssue[] = [];
  for (const box of boxes) {
    if (box.x < 0 || box.y < 0 || box.x + box.width > 1920 || box.y + box.height > 1080) {
      issues.push({
        code: 'out_of_bounds',
        severity: 'error',
        message: `${box.selector} is outside the 1920x1080 viewport.`,
        selector: box.selector
      });
    }
    if (box.height > 0 && box.text.length > 0) {
      const elInfo = await page.locator(box.selector).first().evaluate((node) => {
        const el = node as HTMLElement;
        return {
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth
        };
      });
      if (elInfo.scrollHeight > elInfo.clientHeight + 2 || elInfo.scrollWidth > elInfo.clientWidth + 2) {
        issues.push({
          code: 'overflow',
          severity: 'error',
          message: `${box.selector} has clipped or overflowing text.`,
          selector: box.selector
        });
      }
    }
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (intersects(boxes[i], boxes[j])) {
        issues.push({
          code: 'overlap',
          severity: 'warning',
          message: `${boxes[i].selector} overlaps ${boxes[j].selector}.`,
          selector: boxes[i].selector
        });
      }
    }
  }

  return issues;
}
