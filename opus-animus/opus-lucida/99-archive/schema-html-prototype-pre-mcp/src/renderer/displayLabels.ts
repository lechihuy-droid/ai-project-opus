import type { LearningOperation, Phase } from '../schema';

export const phaseLabels: Record<Phase, string> = {
  Hook: 'Tình huống mở đầu',
  'Try First': 'Thử chọn nhanh',
  Promise: 'Bài này giúp gì?',
  Context: 'Tình huống thực tế',
  Method: 'Cách nhìn để phân biệt',
  'Grammar Core': 'Nắm từng mẫu',
  Contrast: 'So sánh dễ nhầm',
  'Exam Transfer': 'Dấu hiệu để chọn',
  'Worked Example': 'Giải từng bước',
  Practice: 'Luyện chẩn đoán',
  Recap: 'Tổng kết nhanh',
  CTA: 'Luyện tiếp'
};

export const learningOperationLabels: Record<LearningOperation, string> = {
  contrast: 'So sánh',
  clue_spotting: 'Tìm dấu hiệu',
  speaker_action: 'Ý người nói',
  trap_elimination: 'Loại bẫy',
  form_pattern: 'Nhìn dạng',
  real_life_situation: 'Tình huống thật',
  exam_decision: 'Chọn đáp án',
  diagnostic_feedback: 'Xem bẫy hay nhầm',
  recap: 'Tóm lại',
  cta: 'Luyện tiếp'
};

export function getPhaseLabel(phase: Phase): string {
  return phaseLabels[phase];
}

export function getLearningOperationLabel(operation: LearningOperation): string {
  return learningOperationLabels[operation];
}
