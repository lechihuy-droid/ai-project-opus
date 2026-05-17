import type { Deck } from '../schema';
import { SlideRenderer } from './SlideRenderer';

type DeckRendererProps = {
  deck: Deck;
};

export function DeckRenderer({ deck }: DeckRendererProps) {
  return (
    <div className="deck" data-deck-id={deck.deck_meta.deck_id}>
      {deck.slides.map((slide, index) => (
        <SlideRenderer key={slide.slide_id} slide={slide} index={index} total={deck.slides.length} />
      ))}
    </div>
  );
}
