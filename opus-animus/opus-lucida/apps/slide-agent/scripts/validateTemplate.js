import fs from 'node:fs';
import path from 'node:path';
import { agentRoot, extractTemplateTokens, fail, isMain, parseArgs, readJson, validateJson } from './lib.js';

export function validateTemplate(templateDir) {
  const templatePath = path.join(templateDir, 'template.html');
  const slotsPath = path.join(templateDir, 'slots.json');
  if (!fs.existsSync(templatePath) || !fs.existsSync(slotsPath)) {
    throw Object.assign(new Error(`${templateDir}: expected template.html and slots.json`), { code: 1 });
  }
  const template = fs.readFileSync(templatePath, 'utf8');
  const slots = readJson(slotsPath);
  validateJson('slots.schema.json', slots, slotsPath);
  const declared = new Set([
    ...Object.keys(slots.required_slots || {}),
    ...Object.keys(slots.optional_slots || {})
  ]);
  const used = extractTemplateTokens(template);
  const missing = [...used].filter((slot) => !declared.has(slot));
  const unused = [...declared].filter((slot) => !used.has(slot));
  if (missing.length || unused.length) {
    throw Object.assign(
      new Error(`${templateDir}: slot drift. Used but undeclared: ${missing.join(', ') || '(none)'}. Declared but unused: ${unused.join(', ') || '(none)'}.`),
      { code: 1 }
    );
  }
  return true;
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  const target = args._ || process.argv.find((arg, idx) => idx > 1 && !arg.startsWith('--'));
  const dirs = target
    ? [path.resolve(process.cwd(), target)]
    : fs.readdirSync(path.join(agentRoot, 'templates')).map((name) => path.join(agentRoot, 'templates', name)).filter((entry) => fs.statSync(entry).isDirectory());
  try {
    for (const dir of dirs) validateTemplate(dir);
    console.log(`Template validation PASS (${dirs.length})`);
  } catch (error) {
    fail(error.code || 1, error.message);
  }
}
