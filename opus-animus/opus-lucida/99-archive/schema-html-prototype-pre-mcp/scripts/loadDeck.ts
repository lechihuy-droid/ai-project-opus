import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DeckSchema, type Deck } from '../src/schema';

export async function loadDeck(deckPath = 'src/fixtures/sampleDeck.json'): Promise<Deck> {
  const fullPath = resolve(process.cwd(), deckPath);
  const raw = await readFile(fullPath, 'utf-8');
  return DeckSchema.parse(JSON.parse(raw));
}
