import { layoutCatalog } from '../src/layouts/layoutCatalog';
import { validateLucidaRules } from '../src/qa/lucidaRules';
import { checkDeckSlotBudgets } from '../src/qa/slotBudget';
import { loadDeck } from './loadDeck';

const deckPath = process.argv[2] ?? 'src/fixtures/sampleDeck.json';
const deck = await loadDeck(deckPath);
const issues = [...validateLucidaRules(deck), ...checkDeckSlotBudgets(deck)];
const unknownTemplates = deck.slides.filter((slide) => !(slide.template_id in layoutCatalog));

if (unknownTemplates.length > 0) {
  for (const slide of unknownTemplates) {
    console.error(`[validate] unknown template ${slide.template_id} on ${slide.slide_id}`);
  }
  process.exit(1);
}

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[validate] ${issue.slide_id ?? 'deck'} ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

console.log(`[validate] PASS ${deck.deck_meta.deck_id} (${deck.slides.length} slides)`);
