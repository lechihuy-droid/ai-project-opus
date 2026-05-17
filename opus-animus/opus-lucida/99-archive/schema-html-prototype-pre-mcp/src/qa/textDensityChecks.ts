import type { Deck } from '../schema';
import type { QaIssue } from '../schema';

function countSlideChars(slots: Record<string, unknown>): number {
  return Object.values(slots).reduce<number>((sum, value) => {
    if (typeof value === 'string') return sum + value.length;
    if (Array.isArray(value)) return sum + value.map((item) => JSON.stringify(item)).join('').length;
    return sum;
  }, 0);
}

export function checkTextDensity(deck: Deck, maxCharsPerSlide = 780): QaIssue[] {
  return deck.slides.flatMap((slide) => {
    const chars = countSlideChars(slide.slots);
    if (chars <= maxCharsPerSlide) return [];
    return [
      {
        code: 'text_density',
        severity: 'warning' as const,
        message: `Slide has ${chars} slot chars; recommended max is ${maxCharsPerSlide}.`,
        slide_id: slide.slide_id
      }
    ];
  });
}
