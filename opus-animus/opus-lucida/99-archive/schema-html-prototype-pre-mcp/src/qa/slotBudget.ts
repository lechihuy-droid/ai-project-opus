import type { Deck, Slide } from '../schema';
import type { QaIssue } from '../schema';
import { layoutCatalog } from '../layouts/layoutCatalog';

function slotToText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return Object.values(item).join(' ');
        return '';
      })
      .join(' ');
  }
  return '';
}

export function checkSlideSlotBudgets(slide: Slide): QaIssue[] {
  const layout = layoutCatalog[slide.template_id];
  const issues: QaIssue[] = [];

  for (const slot of layout.requiredSlots) {
    if (!(slot in slide.slots)) {
      issues.push({
        code: 'missing_required_slot',
        severity: 'error',
        message: `Required slot "${slot}" is missing for ${slide.template_id}.`,
        slide_id: slide.slide_id
      });
    }
  }

  for (const [slot, budget] of Object.entries(layout.budgets)) {
    const value = slide.slots[slot];
    const text = slotToText(value);
    if (budget.maxChars && text.length > budget.maxChars) {
      issues.push({
        code: 'slot_budget_chars',
        severity: 'error',
        message: `Slot "${slot}" has ${text.length} chars; max is ${budget.maxChars}.`,
        slide_id: slide.slide_id
      });
    }
    if (budget.maxItems && Array.isArray(value) && value.length > budget.maxItems) {
      issues.push({
        code: 'slot_budget_items',
        severity: 'error',
        message: `Slot "${slot}" has ${value.length} items; max is ${budget.maxItems}.`,
        slide_id: slide.slide_id
      });
    }
  }

  return issues;
}

export function checkDeckSlotBudgets(deck: Deck): QaIssue[] {
  return deck.slides.flatMap(checkSlideSlotBudgets);
}
