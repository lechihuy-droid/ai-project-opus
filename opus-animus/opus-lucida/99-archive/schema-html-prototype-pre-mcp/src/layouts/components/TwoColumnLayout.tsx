import type { LayoutProps } from '../types';
import { getText, getTextList } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function TwoColumnLayout({ slide }: LayoutProps) {
  const left = getTextList(slide.slots, 'left_items');
  const right = getTextList(slide.slots, 'right_items');
  return (
    <div className="layout two-column">
      <div className="layout-heading">
        <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
        <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      </div>
      <div className="columns">
        <section className="panel">
          <h3 data-slot="left_title">{getText(slide.slots, 'left_title')}</h3>
          <ul data-slot="left_items">
            {left.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h3 data-slot="right_title">{getText(slide.slots, 'right_title')}</h3>
          <ul data-slot="right_items">
            {right.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
