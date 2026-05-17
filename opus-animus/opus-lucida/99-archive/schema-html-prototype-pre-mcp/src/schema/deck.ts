import { z } from 'zod';
import {
  AccentSchema,
  AspectRatioSchema,
  FrameModeSchema,
  LayoutIdSchema,
  LearningOperationSchema,
  PhaseSchema,
  SlideRoleSchema
} from './layout';

export const SlideSlotsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.array(z.string()),
    z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        note: z.string().optional()
      })
    )
  ])
);

export const SlideSchema = z.object({
  slide_id: z.string(),
  slide_number: z.number().int().positive(),
  role: SlideRoleSchema,
  phase: PhaseSchema,
  template_id: LayoutIdSchema,
  learning_operation: LearningOperationSchema,
  skeleton_link: z.string().optional(),
  slots: SlideSlotsSchema,
  design: z
    .object({
      dominant_accent: AccentSchema.default('amber'),
      visual_hierarchy: z.array(z.string()).optional()
    })
    .default({ dominant_accent: 'amber' }),
  production: z
    .object({
      frame_mode: FrameModeSchema.default('static'),
      requires_deck_stage: z.boolean().default(false)
    })
    .default({ frame_mode: 'static', requires_deck_stage: false }),
  qa: z
    .object({
      risk: z.array(z.string()).default([]),
      required_checks: z.array(z.string()).default([])
    })
    .default({ risk: [], required_checks: [] })
});

export const DeckSchema = z.object({
  deck_meta: z.object({
    deck_id: z.string(),
    title: z.string(),
    audience: z.string(),
    theme_id: z.literal('lucida-n2'),
    aspect_ratio: AspectRatioSchema,
    frame_mode: FrameModeSchema
  }),
  slides: z.array(SlideSchema).min(1)
});

export type SlideSlots = z.infer<typeof SlideSlotsSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type Deck = z.infer<typeof DeckSchema>;
