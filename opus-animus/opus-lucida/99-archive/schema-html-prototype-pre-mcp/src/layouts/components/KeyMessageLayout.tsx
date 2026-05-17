import type { LayoutProps } from '../types';
import { getText, getTextList } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function KeyMessageLayout({ slide }: LayoutProps) {
  const bullets = getTextList(slide.slots, 'bullets');
  return (
    <div className="layout key-message">
      <div>
        <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
        <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      </div>
      <div className="message-box" data-slot="key_message">
        {getText(slide.slots, 'key_message')}
      </div>
      <ul className="bullet-list" data-slot="bullets">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
