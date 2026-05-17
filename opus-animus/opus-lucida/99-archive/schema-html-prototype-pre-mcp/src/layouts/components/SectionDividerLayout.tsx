import type { LayoutProps } from '../types';
import { getText } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function SectionDividerLayout({ slide }: LayoutProps) {
  return (
    <div className="layout section-divider">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <p className="support" data-slot="subtitle">
        {getText(slide.slots, 'subtitle')}
      </p>
    </div>
  );
}
