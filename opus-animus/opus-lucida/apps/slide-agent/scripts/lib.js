import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

export const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const repoRoot = path.resolve(agentRoot, '..', '..');

export function isMain(metaUrl) {
  return path.resolve(fileURLToPath(metaUrl)) === path.resolve(process.argv[1] || '');
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, 'utf8');
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export function loadSchema(name) {
  return readJson(path.join(agentRoot, 'schemas', name));
}

export function validateJson(schemaName, data, label) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(loadSchema(schemaName));
  if (validate(data)) return;
  const details = validate.errors.map((err) => `${err.instancePath || '/'} ${err.message}`).join('; ');
  throw Object.assign(new Error(`${label} failed ${schemaName}: ${details}`), { code: 2 });
}

export function normalizePlan(raw, lane) {
  if (raw.lane_id && raw.slides) return raw;
  if (raw.deck_meta && raw.slides) {
    return {
      lane_id: lane || raw.deck_meta.deck_id?.replace(/-v\d+$/, '') || 'wake-cluster',
      source_lesson: '',
      deck_meta: raw.deck_meta,
      slides: raw.slides.map((slide) => ({
        ...slide,
        source_section: slide.source_section || slide.skeleton_link,
        duration_sec: slide.duration_sec || 8
      }))
    };
  }
  return raw;
}

export function getPlanPath(lane) {
  const local = path.join(agentRoot, 'lessons', lane, 'slide-plan.json');
  if (fs.existsSync(local)) return local;
  const wakeTyped = path.join(repoRoot, 'production', '00-active', lane, 'wake-typed-deck.json');
  if (fs.existsSync(wakeTyped)) return wakeTyped;
  return local;
}

export function getDeckTitle(plan) {
  return plan.deck_meta?.title || plan.lesson_title || plan.lane_id;
}

export function getPhaseLabel(phase) {
  const labels = {
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
  return labels[phase] || phase;
}

export function getLearningOperationLabel(operation) {
  const labels = {
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
  return labels[operation] || operation || '';
}

export function getTemplateLabel(templateId) {
  const labels = {
    hero_title: 'Mở bài',
    section_divider: 'Chuyển phần',
    key_message: 'Ý chính',
    two_column: 'Hai hướng nhìn',
    comparison_table: 'Bảng so sánh',
    figure_focus: 'Trọng tâm',
    summary: 'Tổng kết',
    quiz_before_after: 'Thử chọn nhanh',
    grammar_card: 'Nắm từng mẫu',
    grammar_card_v2: 'Nắm từng mẫu',
    minimal_pair: 'Cặp dễ nhầm',
    clue_map: 'Dấu hiệu để chọn',
    worked_example: 'Giải từng bước',
    diagnostic_practice: 'Luyện chẩn đoán',
    cta_diagnostic: 'Luyện tiếp'
  };
  return labels[templateId] || templateId;
}

export function extractTemplateTokens(templateText) {
  const cleaned = templateText.replace(/\\\{\{[^]*?\}\}/g, '');
  const tokens = new Set();
  const builtIns = new Set(['slide', 'slide_id', 'phase_label', 'template_label', 'slide_number', 'total_slides', 'label', 'value', 'note']);
  const tagPattern = /\{\{\s*([#\/\^&{!]?)\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*\}?\}\}/g;
  let match;
  while ((match = tagPattern.exec(cleaned))) {
    const marker = match[1];
    const name = match[2];
    if (marker === '/' || marker === '!') continue;
    if (name === '.' || builtIns.has(name)) continue;
    tokens.add(name.split('.')[0]);
  }
  return tokens;
}

export function textFromValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(textFromValue).join(' ');
  if (typeof value === 'object') return Object.values(value).map(textFromValue).join(' ');
  return String(value);
}

export function loadBannedTerms() {
  const dictPath = path.join(repoRoot, 'production', '01-rules', 'slide-system', '10-banned-preferred-language-dictionary.md');
  if (!fs.existsSync(dictPath)) return [];
  const md = fs.readFileSync(dictPath, 'utf8');
  const terms = [];
  for (const line of md.split(/\r?\n/)) {
    if (!line.includes('|')) continue;
    const cols = line.split('|').map((part) => part.trim()).filter(Boolean);
    for (const col of cols.slice(0, 2)) {
      const value = col.replace(/`/g, '').trim();
      if (/^[A-Za-z][A-Za-z /-]{2,40}$/.test(value) && !/^(Banned|Preferred|Use|Avoid|Term|English)$/i.test(value)) {
        terms.push(value);
      }
    }
  }
  return [...new Set([...terms, 'Core Method', 'Payoff', 'Reveal', 'Diagnostic Practice', 'Decision rule', 'speaker action'])];
}

export function findBanned(text, terms = loadBannedTerms()) {
  const hits = [];
  for (const term of terms) {
    const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) hits.push(term);
  }
  return hits;
}

export function fail(code, message) {
  console.error(message);
  process.exit(code);
}
