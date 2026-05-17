import fs from 'node:fs';
import path from 'node:path';
import Mustache from 'mustache';
import {
  agentRoot,
  fail,
  findBanned,
  getDeckTitle,
  getPhaseLabel,
  getLearningOperationLabel,
  getPlanPath,
  getTemplateLabel,
  isMain,
  normalizePlan,
  parseArgs,
  readJson,
  textFromValue,
  validateJson,
  writeText
} from './lib.js';
import { validateTemplate } from './validateTemplate.js';

Mustache.escape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function slotLength(value) {
  return textFromValue(value).replace(/\s+/g, ' ').trim().length;
}

function assertSlotValue(slide, slotName, rule) {
  const value = slide.slots[slotName];
  if (value == null || value === '') {
    throw Object.assign(new Error(`${slide.slide_id}: template '${slide.template_id}' requires slot '${slotName}'.`), { code: 2 });
  }
  if (rule.type === 'string' || rule.type === 'rich_jp') {
    if (typeof value !== 'string') {
      throw Object.assign(new Error(`${slide.slide_id}: slot '${slotName}' must be string.`), { code: 2 });
    }
  }
  if (rule.type === 'string[]' && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
    throw Object.assign(new Error(`${slide.slide_id}: slot '${slotName}' must be string array.`), { code: 2 });
  }
  if (rule.type === 'rows' && (!Array.isArray(value) || value.some((item) => typeof item !== 'object'))) {
    throw Object.assign(new Error(`${slide.slide_id}: slot '${slotName}' must be row array.`), { code: 2 });
  }
  if (rule.max_items && Array.isArray(value) && value.length > rule.max_items) {
    throw Object.assign(new Error(`${slide.slide_id}: slot '${slotName}' has ${value.length} items, max ${rule.max_items}.`), { code: 2 });
  }
  if (rule.max_chars && slotLength(value) > rule.max_chars) {
    throw Object.assign(new Error(`${slide.slide_id}: slot '${slotName}' has ${slotLength(value)} chars, max ${rule.max_chars}.`), { code: 2 });
  }
}

function renderSlide(slide, index, total) {
  const templateDir = path.join(agentRoot, 'templates', slide.template_id);
  validateTemplate(templateDir);
  const slotsMeta = readJson(path.join(templateDir, 'slots.json'));
  const required = slotsMeta.required_slots || {};
  const optional = slotsMeta.optional_slots || {};
  for (const [slot, rule] of Object.entries(required)) assertSlotValue(slide, slot, rule);
  for (const [slot, rule] of Object.entries(optional)) {
    if (slide.slots[slot] != null && slide.slots[slot] !== '') assertSlotValue(slide, slot, rule);
  }

  const bannedHits = findBanned(Object.values(slide.slots).map(textFromValue).join(' '));
  if (bannedHits.length) {
    throw Object.assign(new Error(`${slide.slide_id}: banned label detected: ${bannedHits.join(', ')}`), { code: 3 });
  }

  const template = fs.readFileSync(path.join(templateDir, 'template.html'), 'utf8');
  const accent = slide.design?.dominant_accent || slide.accent || 'amber';
  const view = {
    ...slide.slots,
    slide,
    slide_id: slide.slide_id,
    phase_label: getPhaseLabel(slide.phase),
    template_label: getTemplateLabel(slide.template_id),
    slide_number: String(slide.slide_number || index + 1).padStart(2, '0'),
    total_slides: total
  };
  const body = Mustache.render(template, view);
  return `<section class="slide accent-${accent}" data-slide-id="${slide.slide_id}" data-template-id="${slide.template_id}" data-duration="${slide.duration_sec || 8}">
  <header class="slide-topbar">
    <div><span class="slide-number">${String(slide.slide_number || index + 1).padStart(2, '0')}</span><span class="slide-template">${Mustache.escape(getTemplateLabel(slide.template_id))}</span></div>
    <div class="slide-operation">${Mustache.escape(getLearningOperationLabel(slide.learning_operation))}</div>
  </header>
  <main class="slide-body">
${body}
  </main>
  <footer class="slide-footer">
    <span>Lucida</span>
    <span>${Mustache.escape(getPhaseLabel(slide.phase))}</span>
    <span>${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
  </footer>
</section>`;
}

function loadCss(plan) {
  const cssFiles = [
    path.join(agentRoot, 'templates', 'theme.css'),
    path.join(agentRoot, 'templates', 'deck.css')
  ];
  const templateIds = [...new Set(plan.slides.map((slide) => slide.template_id))];
  for (const id of templateIds) {
    const css = path.join(agentRoot, 'templates', id, 'template.css');
    if (fs.existsSync(css)) cssFiles.push(css);
  }
  return cssFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n\n');
}

export function renderLane(lane) {
  const planPath = getPlanPath(lane);
  const raw = readJson(planPath);
  const plan = normalizePlan(raw, lane);
  validateJson('slide-plan.schema.json', plan, planPath);
  const slides = plan.slides.map((slide, index) => renderSlide(slide, index, plan.slides.length)).join('\n');
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${Mustache.escape(getDeckTitle(plan))}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800;900&family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
${loadCss(plan)}
  </style>
</head>
<body>
  <div class="deck" data-lane-id="${Mustache.escape(plan.lane_id)}">
${slides}
  </div>
</body>
</html>
`;
  const outPath = path.join(agentRoot, 'lessons', lane, 'final-deck.html');
  writeText(outPath, html);
  return outPath;
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  if (!args.lane) fail(4, 'Usage: node scripts/render.js --lane <lane-id>');
  try {
    const outPath = renderLane(args.lane);
    console.log(`Rendered ${outPath}`);
  } catch (error) {
    fail(error.code || 4, error.stack || error.message);
  }
}
