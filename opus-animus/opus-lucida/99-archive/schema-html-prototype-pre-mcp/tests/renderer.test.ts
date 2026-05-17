import { describe, expect, it } from 'vitest';
import sampleDeck from '../src/fixtures/sampleDeck.json';
import wakeTypedDeck from '../src/fixtures/wakeTypedDeck.json';
import { layoutCatalog } from '../src/layouts/layoutCatalog';
import { DeckSchema } from '../src/schema';

describe('layout catalog coverage', () => {
  it('contains every template used by the fixture deck', () => {
    const deck = DeckSchema.parse(sampleDeck);
    for (const slide of deck.slides) {
      expect(layoutCatalog[slide.template_id]).toBeDefined();
    }
  });

  it('contains every template used by the Wake deck', () => {
    const deck = DeckSchema.parse(wakeTypedDeck);
    for (const slide of deck.slides) {
      expect(layoutCatalog[slide.template_id]).toBeDefined();
    }
  });

  it('defines required slots for every layout', () => {
    for (const layout of Object.values(layoutCatalog)) {
      expect(layout.requiredSlots.length).toBeGreaterThan(0);
    }
  });
});
