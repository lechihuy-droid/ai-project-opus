import type { LayoutDefinition, LayoutProps } from './types';
import { HeroTitleLayout } from './components/HeroTitleLayout';
import { SectionDividerLayout } from './components/SectionDividerLayout';
import { KeyMessageLayout } from './components/KeyMessageLayout';
import { TwoColumnLayout } from './components/TwoColumnLayout';
import { ComparisonTableLayout } from './components/ComparisonTableLayout';
import { FigureFocusLayout } from './components/FigureFocusLayout';
import { SummaryLayout } from './components/SummaryLayout';
import {
  ClueMapLayout,
  CtaDiagnosticLayout,
  DiagnosticPracticeLayout,
  GrammarCardLayout,
  MinimalPairLayout,
  QuizBeforeAfterLayout,
  WorkedExampleLayout
} from './components/WakeTemplateLayouts';
import type { ComponentType } from 'react';
import type { LayoutId } from '../schema';

export const layoutCatalog: Record<LayoutId, LayoutDefinition> = {
  hero_title: {
    id: 'hero_title',
    label: 'Mở bài',
    requiredSlots: ['title', 'subtitle', 'footer_cue'],
    budgets: {
      title: { maxChars: 86, maxLines: 2 },
      subtitle: { maxChars: 160, maxLines: 3 },
      footer_cue: { maxChars: 80, maxLines: 1 }
    },
    component: HeroTitleLayout
  },
  section_divider: {
    id: 'section_divider',
    label: 'Chuyển phần',
    requiredSlots: ['title', 'subtitle'],
    budgets: {
      title: { maxChars: 72, maxLines: 2 },
      subtitle: { maxChars: 140, maxLines: 3 }
    },
    component: SectionDividerLayout
  },
  key_message: {
    id: 'key_message',
    label: 'Ý chính',
    requiredSlots: ['title', 'key_message', 'bullets'],
    budgets: {
      title: { maxChars: 68, maxLines: 2 },
      key_message: { maxChars: 160, maxLines: 3 },
      bullets: { maxItems: 4, maxChars: 220 }
    },
    component: KeyMessageLayout
  },
  two_column: {
    id: 'two_column',
    label: 'Hai hướng nhìn',
    requiredSlots: ['title', 'left_title', 'right_title', 'left_items', 'right_items'],
    budgets: {
      title: { maxChars: 72, maxLines: 2 },
      left_title: { maxChars: 42, maxLines: 1 },
      right_title: { maxChars: 42, maxLines: 1 },
      left_items: { maxItems: 4, maxChars: 220 },
      right_items: { maxItems: 4, maxChars: 220 }
    },
    component: TwoColumnLayout
  },
  comparison_table: {
    id: 'comparison_table',
    label: 'Bảng so sánh',
    requiredSlots: ['title', 'rows'],
    budgets: {
      title: { maxChars: 72, maxLines: 2 },
      rows: { maxItems: 5, maxChars: 360 }
    },
    component: ComparisonTableLayout
  },
  figure_focus: {
    id: 'figure_focus',
    label: 'Trọng tâm',
    requiredSlots: ['title', 'figure_label', 'caption'],
    budgets: {
      title: { maxChars: 72, maxLines: 2 },
      figure_label: { maxChars: 48, maxLines: 2 },
      caption: { maxChars: 170, maxLines: 4 }
    },
    component: FigureFocusLayout
  },
  summary: {
    id: 'summary',
    label: 'Tổng kết',
    requiredSlots: ['title', 'items', 'takeaway'],
    budgets: {
      title: { maxChars: 72, maxLines: 2 },
      items: { maxItems: 6, maxChars: 360 },
      takeaway: { maxChars: 120, maxLines: 2 }
    },
    component: SummaryLayout
  },
  quiz_before_after: {
    id: 'quiz_before_after',
    label: 'Thử chọn nhanh',
    requiredSlots: ['title', 'question', 'choices', 'answer', 'payoff'],
    budgets: {
      title: { maxChars: 72, maxLines: 2 },
      question: { maxChars: 150, maxLines: 4 },
      choices: { maxItems: 4, maxChars: 190 },
      answer: { maxChars: 70, maxLines: 1 },
      payoff: { maxChars: 170, maxLines: 3 }
    },
    component: QuizBeforeAfterLayout
  },
  grammar_card: {
    id: 'grammar_card',
    label: 'Nắm từng mẫu',
    requiredSlots: ['title', 'speaker_action', 'meaning', 'form', 'usage', 'example', 'trap'],
    budgets: {
      title: { maxChars: 42, maxLines: 1 },
      speaker_action: { maxChars: 118, maxLines: 3 },
      meaning: { maxChars: 96, maxLines: 2 },
      form: { maxChars: 56, maxLines: 1 },
      usage: { maxChars: 120, maxLines: 2 },
      example: { maxChars: 150, maxLines: 3 },
      trap: { maxChars: 130, maxLines: 2 },
      bonus: { maxChars: 80, maxLines: 1 }
    },
    component: GrammarCardLayout
  },
  minimal_pair: {
    id: 'minimal_pair',
    label: 'Cặp dễ nhầm',
    requiredSlots: ['title', 'left_title', 'right_title', 'left_items', 'right_items', 'pair_a', 'pair_b', 'trap'],
    budgets: {
      title: { maxChars: 82, maxLines: 2 },
      left_title: { maxChars: 46, maxLines: 1 },
      right_title: { maxChars: 46, maxLines: 1 },
      left_items: { maxItems: 3, maxChars: 160 },
      right_items: { maxItems: 3, maxChars: 160 },
      pair_a: { maxChars: 62, maxLines: 1 },
      pair_b: { maxChars: 62, maxLines: 1 },
      trap: { maxChars: 150, maxLines: 2 }
    },
    component: MinimalPairLayout
  },
  clue_map: {
    id: 'clue_map',
    label: 'Dấu hiệu để chọn',
    requiredSlots: ['title', 'checklist', 'mappings', 'takeaway'],
    budgets: {
      title: { maxChars: 64, maxLines: 1 },
      checklist: { maxItems: 4, maxChars: 210 },
      mappings: { maxItems: 4, maxChars: 430 },
      takeaway: { maxChars: 130, maxLines: 2 }
    },
    component: ClueMapLayout
  },
  worked_example: {
    id: 'worked_example',
    label: 'Giải từng bước',
    requiredSlots: ['title', 'question', 'choices', 'steps', 'answer', 'rule'],
    budgets: {
      title: { maxChars: 64, maxLines: 1 },
      question: { maxChars: 150, maxLines: 4 },
      choices: { maxItems: 3, maxChars: 190 },
      steps: { maxItems: 5, maxChars: 420 },
      answer: { maxChars: 48, maxLines: 1 },
      rule: { maxChars: 140, maxLines: 2 }
    },
    component: WorkedExampleLayout
  },
  diagnostic_practice: {
    id: 'diagnostic_practice',
    label: 'Luyện chẩn đoán',
    requiredSlots: ['title', 'question', 'choices', 'answer', 'feedback'],
    budgets: {
      title: { maxChars: 64, maxLines: 1 },
      question: { maxChars: 76, maxLines: 2 },
      choices: { maxItems: 3, maxChars: 110 },
      answer: { maxChars: 58, maxLines: 1 },
      feedback: { maxItems: 3, maxChars: 180 }
    },
    component: DiagnosticPracticeLayout
  },
  cta_diagnostic: {
    id: 'cta_diagnostic',
    label: 'Luyện tiếp',
    requiredSlots: ['title', 'subtitle', 'items', 'cue'],
    budgets: {
      title: { maxChars: 82, maxLines: 2 },
      subtitle: { maxChars: 140, maxLines: 3 },
      items: { maxItems: 4, maxChars: 250 },
      cue: { maxChars: 96, maxLines: 2 }
    },
    component: CtaDiagnosticLayout
  }
};

export function getLayoutComponent(templateId: LayoutId): ComponentType<LayoutProps> {
  return layoutCatalog[templateId].component;
}
