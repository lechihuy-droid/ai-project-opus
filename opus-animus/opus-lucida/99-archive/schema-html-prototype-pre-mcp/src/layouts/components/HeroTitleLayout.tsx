import type { LayoutProps } from '../types';
import { getText } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function HeroTitleLayout({ slide }: LayoutProps) {
  return (
    <div className="layout hero-title">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h1 data-slot="title">{getText(slide.slots, 'title')}</h1>
      <p className="hero-subtitle" data-slot="subtitle">
        {getText(slide.slots, 'subtitle')}
      </p>
      <div className="takeaway-strip" data-slot="footer_cue">
        {getText(slide.slots, 'footer_cue')}
      </div>
    </div>
  );
}
