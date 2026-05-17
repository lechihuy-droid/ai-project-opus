import { z } from 'zod';

export const QaStatusSchema = z.enum(['PASS', 'PASS_WITH_NOTES', 'REVISE', 'BLOCK']);

export const QaIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(['note', 'warning', 'error']),
  message: z.string(),
  slide_id: z.string().optional(),
  selector: z.string().optional()
});

export const QaResultSchema = z.object({
  deck_id: z.string(),
  status: QaStatusSchema,
  issues: z.array(QaIssueSchema),
  slides: z.array(
    z.object({
      slide_id: z.string(),
      status: QaStatusSchema,
      issues: z.array(QaIssueSchema)
    })
  )
});

export type QaStatus = z.infer<typeof QaStatusSchema>;
export type QaIssue = z.infer<typeof QaIssueSchema>;
export type QaResult = z.infer<typeof QaResultSchema>;
