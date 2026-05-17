import type { LayoutProps } from '../types';
import { getText, getTextList } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function SummaryLayout({ slide }: LayoutProps) {
  const items = getTextList(slide.slots, 'items');
  return (
    <div className="layout summary">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <div className="summary-grid" data-slot="items">
        {items.map((item) => (
          <div className="summary-item" key={item}>
            {item}
          </div>
        ))}
      </div>
      <div className="takeaway-strip" data-slot="takeaway">
        {getText(slide.slots, 'takeaway')}
      </div>
    </div>
  );
}
