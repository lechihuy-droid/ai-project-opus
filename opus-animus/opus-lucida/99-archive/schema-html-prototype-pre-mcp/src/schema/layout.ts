import { z } from 'zod';

export const AspectRatioSchema = z.enum(['16:9']);
export const FrameModeSchema = z.enum(['static']);
export const AccentSchema = z.enum(['amber', 'blue', 'red', 'green', 'violet']);

export const LayoutIdSchema = z.enum([
  'hero_title',
  'section_divider',
  'key_message',
  'two_column',
  'comparison_table',
  'figure_focus',
  'summary',
  'quiz_before_after',
  'grammar_card',
  'minimal_pair',
  'clue_map',
  'worked_example',
  'diagnostic_practice',
  'cta_diagnostic'
]);

export const SlideRoleSchema = z.enum([
  'hero_title',
  'section',
  'key_message',
  'comparison',
  'figure_focus',
  'summary',
  'quiz',
  'grammar_card',
  'minimal_pair',
  'clue_map',
  'worked_example',
  'diagnostic_practice',
  'cta'
]);

export const PhaseSchema = z.enum([
  'Hook',
  'Try First',
  'Promise',
  'Context',
  'Method',
  'Grammar Core',
  'Contrast',
  'Exam Transfer',
  'Worked Example',
  'Practice',
  'Recap',
  'CTA'
]);

export const LearningOperationSchema = z.enum([
  'contrast',
  'clue_spotting',
  'speaker_action',
  'trap_elimination',
  'form_pattern',
  'real_life_situation',
  'exam_decision',
  'diagnostic_feedback',
  'recap',
  'cta'
]);

export const SlotBudgetSchema = z.object({
  maxChars: z.number().int().positive().optional(),
  maxItems: z.number().int().positive().optional(),
  maxLines: z.number().int().positive().optional()
});

export type LayoutId = z.infer<typeof LayoutIdSchema>;
export type LearningOperation = z.infer<typeof LearningOperationSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type SlotBudget = z.infer<typeof SlotBudgetSchema>;
