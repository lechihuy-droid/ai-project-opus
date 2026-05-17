import type { LayoutProps } from '../types';
import { getText } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function FigureFocusLayout({ slide }: LayoutProps) {
  return (
    <div className="layout figure-focus">
      <div className="figure-copy">
        <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
        <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
        <p className="support" data-slot="caption">
          {getText(slide.slots, 'caption')}
        </p>
      </div>
      <div className="figure-box" data-slot="figure_label">
        {getText(slide.slots, 'figure_label')}
      </div>
    </div>
  );
}
