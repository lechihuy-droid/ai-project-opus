import { z } from 'zod';

export const ContentBundleSchema = z.object({
  content_bundle_id: z.string(),
  source_type: z.enum(['article', 'transcript', 'markdown', 'technical_doc', 'pdf_derived']),
  title: z.string(),
  audience: z.string().optional(),
  objective: z.string().optional(),
  chunks: z.array(
    z.object({
      chunk_id: z.string(),
      text: z.string(),
      section_path: z.string().optional(),
      importance_score: z.number().min(0).max(1).optional()
    })
  ),
  figures: z
    .array(
      z.object({
        figure_id: z.string(),
        caption: z.string().optional(),
        src: z.string().optional()
      })
    )
    .default([])
});

export type ContentBundle = z.infer<typeof ContentBundleSchema>;
