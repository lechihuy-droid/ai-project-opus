import { describe, expect, it } from 'vitest';
import badOverflowDeck from '../src/fixtures/badOverflowDeck.json';
import sampleDeck from '../src/fixtures/sampleDeck.json';
import wakeTypedDeck from '../src/fixtures/wakeTypedDeck.json';
import { DeckSchema } from '../src/schema';
import { checkDeckSlotBudgets } from '../src/qa/slotBudget';

describe('slot budget checks', () => {
  it('passes the sample deck', () => {
    const deck = DeckSchema.parse(sampleDeck);
    expect(checkDeckSlotBudgets(deck)).toHaveLength(0);
  });

  it('passes the full Wake deck', () => {
    const deck = DeckSchema.parse(wakeTypedDeck);
    expect(checkDeckSlotBudgets(deck)).toHaveLength(0);
  });

  it('flags intentionally long fixture text', () => {
    const deck = DeckSchema.parse(badOverflowDeck);
    const issues = checkDeckSlotBudgets(deck);
    expect(issues.some((issue) => issue.code === 'slot_budget_chars')).toBe(true);
  });
});
