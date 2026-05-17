import { describe, expect, it } from 'vitest';
import wakeTypedDeck from '../src/fixtures/wakeTypedDeck.json';
import { validateLucidaRules } from '../src/qa/lucidaRules';
import { DeckSchema } from '../src/schema';

describe('Lucida rule validation', () => {
  it('passes the full Wake deck with hardened language and anchor checks', () => {
    const deck = DeckSchema.parse(wakeTypedDeck);
    expect(validateLucidaRules(deck)).toHaveLength(0);
  });

  it('flags learner-facing internal language', () => {
    const deck = DeckSchema.parse(wakeTypedDeck);
    deck.slides[13].slots.steps = ['Blank 1 uses speaker action.'];
    const issues = validateLucidaRules(deck);
    expect(issues.some((issue) => issue.code === 'banned_public_phrase')).toBe(true);
  });

  it('flags missing Japanese anchors on grammar cards', () => {
    const deck = DeckSchema.parse(wakeTypedDeck);
    deck.slides[5].slots.example = 'No Japanese example here.';
    const issues = validateLucidaRules(deck);
    expect(issues.some((issue) => issue.code === 'missing_japanese_anchor')).toBe(true);
  });
});
