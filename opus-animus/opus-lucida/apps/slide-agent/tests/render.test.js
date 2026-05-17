import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { agentRoot, writeText } from '../scripts/lib.js';

const laneDir = path.join(agentRoot, 'lessons', 'sample');
const planPath = path.join(laneDir, 'slide-plan.json');
const fixturePlan = path.join(agentRoot, 'tests', 'fixtures', 'sample-slide-plan.json');

function runRender() {
  return spawnSync(process.execPath, ['scripts/render.js', '--lane', 'sample'], { cwd: agentRoot, encoding: 'utf8' });
}

test('render happy path emits sections', () => {
  fs.mkdirSync(laneDir, { recursive: true });
  fs.copyFileSync(fixturePlan, planPath);
  const result = runRender();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(laneDir, 'final-deck.html'), 'utf8');
  assert.match(html, /<section class="slide/);
  assert.match(html, /data-slide-id="sample-01"/);
});

test('missing required slot exits 2', () => {
  const plan = JSON.parse(fs.readFileSync(fixturePlan, 'utf8'));
  delete plan.slides[0].slots.title;
  writeText(planPath, JSON.stringify(plan, null, 2));
  const result = runRender();
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires slot 'title'/);
});

test('slot budget overflow exits 2', () => {
  const plan = JSON.parse(fs.readFileSync(fixturePlan, 'utf8'));
  plan.slides[0].slots.footer_cue = 'x'.repeat(90);
  writeText(planPath, JSON.stringify(plan, null, 2));
  const result = runRender();
  assert.equal(result.status, 2);
  assert.match(result.stderr, /max 80/);
});

test('banned label exits 3', () => {
  const plan = JSON.parse(fs.readFileSync(fixturePlan, 'utf8'));
  plan.slides[0].slots.footer_cue = 'Core Method';
  writeText(planPath, JSON.stringify(plan, null, 2));
  const result = runRender();
  assert.equal(result.status, 3);
  assert.match(result.stderr, /banned label/);
});
