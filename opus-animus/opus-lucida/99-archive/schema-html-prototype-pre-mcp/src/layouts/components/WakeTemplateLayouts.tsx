import type { LayoutProps } from '../types';
import { getRows, getText, getTextList } from '../../renderer/renderSlot';
import { getPhaseLabel } from '../../renderer/displayLabels';

function ChoiceList({ choices }: { choices: string[] }) {
  return (
    <div className="choice-list">
      {choices.map((choice) => (
        <div className="choice-pill" key={choice}>
          {choice}
        </div>
      ))}
    </div>
  );
}

export function QuizBeforeAfterLayout({ slide }: LayoutProps) {
  const choices = getTextList(slide.slots, 'choices');
  return (
    <div className="layout quiz-before-after">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <div className="quiz-board">
        <section className="board-panel board-before">
          <div className="board-label">Trước khi chốt</div>
          <div className="jp-question" data-slot="question">
            {getText(slide.slots, 'question')}
          </div>
          <ChoiceList choices={choices} />
        </section>
        <section className="board-panel board-after">
          <div className="board-label">Sau khi chốt</div>
          <div className="answer-strip" data-slot="answer">
            {getText(slide.slots, 'answer')}
          </div>
          <div className="support compact" data-slot="payoff">
            {getText(slide.slots, 'payoff')}
          </div>
        </section>
      </div>
    </div>
  );
}

export function GrammarCardLayout({ slide }: LayoutProps) {
  return (
    <div className="layout grammar-card">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <div className="grammar-shell">
        <div className="pattern-card">
          <div className="board-label">Mẫu cần nhìn</div>
          <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
          <strong>Ở câu này, người nói đang muốn nói gì?</strong>
          <p data-slot="speaker_action">{getText(slide.slots, 'speaker_action')}</p>
        </div>
        <div className="grammar-grid">
          <div className="grammar-cell">
            <strong>Ý nghĩa</strong>
            <span data-slot="meaning">{getText(slide.slots, 'meaning')}</span>
          </div>
          <div className="grammar-cell">
            <strong>Dạng</strong>
            <span data-slot="form">{getText(slide.slots, 'form')}</span>
          </div>
          <div className="grammar-cell">
            <strong>Cách dùng</strong>
            <span data-slot="usage">{getText(slide.slots, 'usage')}</span>
          </div>
          <div className="grammar-cell">
            <strong>Bẫy dễ nhầm</strong>
            <span data-slot="trap">{getText(slide.slots, 'trap')}</span>
          </div>
        </div>
      </div>
      <div className="example-strip" data-slot="example">
        <span>Ví dụ</span>
        {getText(slide.slots, 'example')}
      </div>
      {getText(slide.slots, 'bonus') ? (
        <div className="bonus-note" data-slot="bonus">
          {getText(slide.slots, 'bonus')}
        </div>
      ) : null}
    </div>
  );
}

export function MinimalPairLayout({ slide }: LayoutProps) {
  const leftItems = getTextList(slide.slots, 'left_items');
  const rightItems = getTextList(slide.slots, 'right_items');
  return (
    <div className="layout minimal-pair">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <div className="contrast-axis">Trục khác nhau: ý người nói đang đẩy câu theo hướng nào?</div>
      <div className="pair-grid">
        <section>
          <h3 data-slot="left_title">{getText(slide.slots, 'left_title')}</h3>
          <ul data-slot="left_items">
            {leftItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="jp-mini" data-slot="pair_a">
            {getText(slide.slots, 'pair_a')}
          </div>
        </section>
        <section>
          <h3 data-slot="right_title">{getText(slide.slots, 'right_title')}</h3>
          <ul data-slot="right_items">
            {rightItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="jp-mini" data-slot="pair_b">
            {getText(slide.slots, 'pair_b')}
          </div>
        </section>
      </div>
      <div className="takeaway-strip" data-slot="trap">
        {getText(slide.slots, 'trap')}
      </div>
    </div>
  );
}

export function ClueMapLayout({ slide }: LayoutProps) {
  const checklist = getTextList(slide.slots, 'checklist');
  const mappings = getRows(slide.slots, 'mappings');
  return (
    <div className="layout clue-map">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <div className="clue-layout">
        <div className="checklist" data-slot="checklist">
          <div className="board-label">Đọc đề theo thứ tự</div>
          {checklist.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
        <div className="mapping-list" data-slot="mappings">
          <div className="board-label">Chọn mẫu theo mạch ý</div>
          {mappings.map((row) => (
            <div className="mapping-row" key={row.label}>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
              {row.note ? <em>{row.note}</em> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="takeaway-strip" data-slot="takeaway">
        {getText(slide.slots, 'takeaway')}
      </div>
    </div>
  );
}

export function WorkedExampleLayout({ slide }: LayoutProps) {
  const choices = getTextList(slide.slots, 'choices');
  const steps = getTextList(slide.slots, 'steps');
  return (
    <div className="layout worked-example">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <div className="worked-grid">
        <section className="board-panel">
          <div className="board-label">Đề bài</div>
          <div className="jp-question smaller" data-slot="question">
            {getText(slide.slots, 'question')}
          </div>
          <ChoiceList choices={choices} />
          <div className="answer-strip" data-slot="answer">
            {getText(slide.slots, 'answer')}
          </div>
        </section>
        <section className="board-panel">
          <div className="board-label">Cách giải</div>
          <ol className="step-list" data-slot="steps">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
      <div className="takeaway-strip" data-slot="rule">
        {getText(slide.slots, 'rule')}
      </div>
    </div>
  );
}

export function DiagnosticPracticeLayout({ slide }: LayoutProps) {
  const choices = getTextList(slide.slots, 'choices');
  const feedback = getTextList(slide.slots, 'feedback');
  return (
    <div className="layout diagnostic-practice">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <div className="diagnostic-grid">
        <section className="board-panel board-before">
          <div className="board-label">Trước khi chốt</div>
          <div className="jp-question" data-slot="question">
            {getText(slide.slots, 'question')}
          </div>
          <ChoiceList choices={choices} />
        </section>
        <section className="feedback-panel board-after">
          <div className="board-label">Sau khi chốt</div>
          <div className="answer-strip" data-slot="answer">
            {getText(slide.slots, 'answer')}
          </div>
          <ul data-slot="feedback">
            {feedback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export function CtaDiagnosticLayout({ slide }: LayoutProps) {
  const items = getTextList(slide.slots, 'items');
  return (
    <div className="layout cta-diagnostic">
      <p className="slide-kicker">{getPhaseLabel(slide.phase)}</p>
      <h2 data-slot="title">{getText(slide.slots, 'title')}</h2>
      <p className="support" data-slot="subtitle">
        {getText(slide.slots, 'subtitle')}
      </p>
      <div className="cta-list" data-slot="items">
        {items.map((item) => (
          <div className="cta-item" key={item}>
            {item}
          </div>
        ))}
      </div>
      <div className="takeaway-strip" data-slot="cue">
        {getText(slide.slots, 'cue')}
      </div>
    </div>
  );
}
