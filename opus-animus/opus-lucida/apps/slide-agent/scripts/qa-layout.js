import fs from 'node:fs';
import path from 'node:path';
import { agentRoot, fail, getPlanPath, isMain, normalizePlan, parseArgs, readJson, textFromValue } from './lib.js';

export function runLayoutQa(lane) {
  const plan = normalizePlan(readJson(getPlanPath(lane)), lane);
  const findings = [];
  for (const slide of plan.slides) {
    const slotsPath = path.join(agentRoot, 'templates', slide.template_id, 'slots.json');
    if (!fs.existsSync(slotsPath)) {
      findings.push({ severity: 'critical', slide_id: slide.slide_id, message: `missing template ${slide.template_id}` });
      continue;
    }
    const meta = readJson(slotsPath);
    const rules = { ...(meta.required_slots || {}), ...(meta.optional_slots || {}) };
    for (const [slot, rule] of Object.entries(rules)) {
      const value = slide.slots[slot];
      if (value == null) continue;
      const chars = textFromValue(value).replace(/\s+/g, ' ').trim().length;
      if (rule.max_chars && chars > rule.max_chars) {
        findings.push({ severity: 'major', slide_id: slide.slide_id, slot, message: `${slot} has ${chars} chars, max ${rule.max_chars}` });
      }
      if (rule.max_items && Array.isArray(value) && value.length > rule.max_items) {
        findings.push({ severity: 'major', slide_id: slide.slide_id, slot, message: `${slot} has ${value.length} items, max ${rule.max_items}` });
      }
    }
  }
  return findings;
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  if (!args.lane) fail(4, 'Usage: node scripts/qa-layout.js --lane <lane-id>');
  console.log(JSON.stringify(runLayoutQa(args.lane), null, 2));
}
