import type { Slide } from '../schema';
import { layoutCatalog } from '../layouts/layoutCatalog';
import { getLearningOperationLabel, getPhaseLabel } from './displayLabels';

type SlideRendererProps = {
  slide: Slide;
  index: number;
  total: number;
};

export function SlideRenderer({ slide, index, total }: SlideRendererProps) {
  const Layout = layoutCatalog[slide.template_id].component;
  return (
    <section
      className={`slide accent-${slide.design.dominant_accent}`}
      data-slide-id={slide.slide_id}
      data-slide-number={slide.slide_number}
      data-template-id={slide.template_id}
    >
      <header className="slide-topbar">
        <div>
          <span className="slide-number">{String(index + 1).padStart(2, '0')}</span>
          <span className="slide-template">{layoutCatalog[slide.template_id].label}</span>
        </div>
        <span className="slide-operation">{getLearningOperationLabel(slide.learning_operation)}</span>
      </header>
      <main className="slide-body">
        <Layout slide={slide} />
      </main>
      <footer className="slide-footer">
        <span>Lucida</span>
        <span>{getPhaseLabel(slide.phase)}</span>
        <span>
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </footer>
    </section>
  );
}
