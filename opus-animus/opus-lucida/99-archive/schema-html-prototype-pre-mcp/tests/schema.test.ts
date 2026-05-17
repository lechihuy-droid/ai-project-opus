import { describe, expect, it } from 'vitest';
import sampleDeck from '../src/fixtures/sampleDeck.json';
import wakeTypedDeck from '../src/fixtures/wakeTypedDeck.json';
import { DeckSchema } from '../src/schema';

describe('DeckSchema', () => {
  it('accepts the sample deck fixture', () => {
    const parsed = DeckSchema.parse(sampleDeck);
    expect(parsed.slides).toHaveLength(5);
  });

  it('accepts the full Wake typed deck fixture', () => {
    const parsed = DeckSchema.parse(wakeTypedDeck);
    expect(parsed.slides).toHaveLength(17);
  });

  it('rejects missing deck metadata', () => {
    expect(() => DeckSchema.parse({ slides: [] })).toThrow();
  });

  it('rejects unknown template IDs', () => {
    const invalid = structuredClone(sampleDeck);
    invalid.slides[0].template_id = 'raw_html';
    expect(() => DeckSchema.parse(invalid)).toThrow();
  });
});
