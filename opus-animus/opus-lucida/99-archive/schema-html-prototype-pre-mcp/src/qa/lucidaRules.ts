import type { Deck, QaIssue } from '../schema';
import { layoutCatalog } from '../layouts/layoutCatalog';

const japaneseTextPattern = /[\u3040-\u30ff\u3400-\u9fff]/;

const bannedPublicPhrases = [
  'Nghĩa - Hình - Dụng',
  'Meaning / Form / Usage',
  'Ngữ nghĩa - Văn phạm - Ngữ dụng',
  'Người nói đang làm gì?',
  'Speaker action',
  'speaker action',
  'Decision rule',
  'decision rule',
  'Clue map',
  'clue map',
  'Worked example',
  'worked example',
  'Diagnostic practice',
  'diagnostic practice',
  'Production note',
  'production note',
  'Lead magnet',
  'lead magnet',
  'Download worksheet now',
  'Practice bundle',
  'Blank'
];

const japaneseAnchorSlots: Record<string, string[]> = {
  quiz_before_after: ['question', 'choices'],
  grammar_card: ['title', 'form', 'example'],
  minimal_pair: ['left_title', 'right_title', 'pair_a', 'pair_b'],
  clue_map: ['mappings'],
  worked_example: ['question', 'choices', 'steps', 'rule'],
  diagnostic_practice: ['question', 'choices', 'feedback'],
  comparison_table: ['rows']
};

function slotToText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return Object.values(item).join(' ');
        return '';
      })
      .join(' ');
  }
  return '';
}

function hasJapanese(value: unknown): boolean {
  return japaneseTextPattern.test(slotToText(value));
}

function issue(slide_id: string, code: string, message: string, severity: QaIssue['severity'] = 'error'): QaIssue {
  return { code, severity, message, slide_id };
}

function checkJapaneseAnchors(deck: Deck): QaIssue[] {
  return deck.slides.flatMap((slide) => {
    const requiredSlots = japaneseAnchorSlots[slide.template_id] ?? [];
    return requiredSlots.flatMap((slot) => {
      if (hasJapanese(slide.slots[slot])) return [];
      return [
        issue(
          slide.slide_id,
          'missing_japanese_anchor',
          `Template ${slide.template_id} expects Japanese text in slot "${slot}".`
        )
      ];
    });
  });
}

function checkPublicLanguage(deck: Deck): QaIssue[] {
  const issues: QaIssue[] = [];
  for (const slide of deck.slides) {
    for (const [slot, value] of Object.entries(slide.slots)) {
      const text = slotToText(value);
      for (const phrase of bannedPublicPhrases) {
        if (text.includes(phrase)) {
          issues.push(
            issue(
              slide.slide_id,
              'banned_public_phrase',
              `Slot "${slot}" contains learner-facing banned phrase "${phrase}".`
            )
          );
        }
      }
    }
  }
  return issues;
}

function checkThreeViewLabels(deck: Deck): QaIssue[] {
  const joinedText = deck.slides.map((slide) => slotToText(Object.values(slide.slots))).join('\n');
  if (!joinedText.includes('Ý nghĩa') || !joinedText.includes('Dạng') || !joinedText.includes('Cách dùng')) {
    return [
      {
        code: 'missing_preferred_three_view_labels',
        severity: 'error',
        message: 'Public method text should use the preferred labels: Ý nghĩa - Dạng - Cách dùng.'
      }
    ];
  }
  return [];
}

function checkTemplateContracts(deck: Deck): QaIssue[] {
  const issues: QaIssue[] = [];
  for (const slide of deck.slides) {
    if (slide.template_id === 'quiz_before_after' || slide.template_id === 'worked_example') {
      if (!slotToText(slide.slots.answer).match(/[A-D]/)) {
        issues.push(issue(slide.slide_id, 'missing_quiz_answer_letter', 'Quiz/worked example answer should expose an answer letter.'));
      }
      if (!Array.isArray(slide.slots.choices) || slide.slots.choices.length < 2) {
        issues.push(issue(slide.slide_id, 'missing_quiz_choices', 'Quiz/worked example needs at least two answer choices.'));
      }
    }

    if (slide.template_id === 'worked_example') {
      const steps = slide.slots.steps;
      if (!Array.isArray(steps) || steps.length < 3) {
        issues.push(issue(slide.slide_id, 'missing_worked_steps', 'Worked example needs at least three reasoning steps.'));
      }
      const stepText = slotToText(steps).toLowerCase();
      if (!stepText.includes('blank') && !stepText.includes('chỗ trống')) {
        issues.push(issue(slide.slide_id, 'missing_blank_reasoning', 'Worked example should explicitly reason about the blank.'));
      }
    }

    if (slide.template_id === 'diagnostic_practice') {
      const feedback = slide.slots.feedback;
      if (!Array.isArray(feedback) || feedback.length < 2) {
        issues.push(issue(slide.slide_id, 'missing_diagnostic_feedback', 'Diagnostic practice needs feedback, not only the answer.'));
      }
      if (!slotToText(feedback).toLowerCase().includes('bẫy')) {
        issues.push(issue(slide.slide_id, 'missing_trap_feedback', 'Diagnostic feedback should name the trap being diagnosed.'));
      }
    }

    if (slide.template_id === 'cta_diagnostic') {
      const ctaText = slotToText(Object.values(slide.slots));
      if (!ctaText.includes('quiz') || !ctaText.toLowerCase().includes('luyện')) {
        issues.push(issue(slide.slide_id, 'weak_diagnostic_cta', 'CTA should point to diagnostic quiz and guided practice.'));
      }
    }
  }
  return issues;
}

export function validateLucidaRules(deck: Deck): QaIssue[] {
  const issues: QaIssue[] = [];
  const seen = new Set<number>();

  for (const slide of deck.slides) {
    if (seen.has(slide.slide_number)) {
      issues.push({
        code: 'duplicate_slide_number',
        severity: 'error',
        message: `Slide number ${slide.slide_number} appears more than once.`,
        slide_id: slide.slide_id
      });
    }
    seen.add(slide.slide_number);

    if (!slide.skeleton_link) {
      issues.push({
        code: 'missing_skeleton_link',
        severity: 'error',
        message: 'Every Lucida slide must trace back to the teaching skeleton.',
        slide_id: slide.slide_id
      });
    }

    if (!layoutCatalog[slide.template_id]) {
      issues.push({
        code: 'unknown_template_id',
        severity: 'error',
        message: `Unknown template_id "${slide.template_id}".`,
        slide_id: slide.slide_id
      });
    }

    if (!slide.learning_operation) {
      issues.push({
        code: 'missing_learning_operation',
        severity: 'error',
        message: 'Every slide must declare the visible learning operation.',
        slide_id: slide.slide_id
      });
    }

    if (!slide.design.dominant_accent) {
      issues.push({
        code: 'missing_dominant_accent',
        severity: 'error',
        message: 'Every slide must declare one Lucida accent color.',
        slide_id: slide.slide_id
      });
    }
  }

  return [
    ...issues,
    ...checkJapaneseAnchors(deck),
    ...checkPublicLanguage(deck),
    ...checkThreeViewLabels(deck),
    ...checkTemplateContracts(deck)
  ];
}
