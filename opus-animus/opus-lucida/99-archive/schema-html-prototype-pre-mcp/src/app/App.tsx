import sampleDeckJson from '../fixtures/sampleDeck.json';
import wakeDeckJson from '../fixtures/wakeTypedDeck.json';
import { DeckSchema } from '../schema';
import { DeckRenderer } from '../renderer/DeckRenderer';

function selectDeck() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('deck') === 'wake') return wakeDeckJson;
  return sampleDeckJson;
}

export function App() {
  const deck = DeckSchema.parse(selectDeck());
  return <DeckRenderer deck={deck} />;
}
