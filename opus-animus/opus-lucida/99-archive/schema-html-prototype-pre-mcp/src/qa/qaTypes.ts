import type { QaIssue, QaStatus } from '../schema';

export type SlideQaResult = {
  slide_id: string;
  status: QaStatus;
  issues: QaIssue[];
};

export type DeckQaReport = {
  deck_id: string;
  status: QaStatus;
  issues: QaIssue[];
  slides: SlideQaResult[];
};
