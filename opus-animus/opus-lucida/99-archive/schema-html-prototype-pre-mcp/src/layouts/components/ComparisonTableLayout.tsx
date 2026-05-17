import type { LayoutProps } from '../types';
import { getRows, getText } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

export function ComparisonTableLayout({ slide }: LayoutProps) {
  const rows = getRows(slide.slots, 'rows');
  return (
    <div className="layout comparison-table">
      <div className="layout-heading">
        <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
        <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      </div>
      <div className="comparison-grid" data-slot="rows">
        {rows.map((row) => (
          <div className="comparison-row" key={row.label}>
            <strong>{row.label}</strong>
            <span>{row.value}</span>
            {row.note ? <em>{row.note}</em> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
