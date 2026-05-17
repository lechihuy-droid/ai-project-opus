import path from 'node:path';
import { agentRoot, fail, isMain, parseArgs, writeText } from './lib.js';
import { renderLane } from './render.js';
import { runLayoutQa } from './qa-layout.js';
import { runMappingQa } from './qa-mapping.js';
import { runBannedQa } from './qa-bannedlabel.js';

function writeQaReport(lane, findings) {
  const critical = findings.filter((item) => item.severity === 'critical');
  const major = findings.filter((item) => item.severity === 'major');
  const minor = findings.filter((item) => item.severity === 'minor');
  const verdict = critical.length ? 'BLOCK' : major.length ? 'REVISE' : 'PASS';
  const score = critical.length ? 5 : major.length ? 7 : 10;
  const lines = [
    `# QA Report - ${lane}`,
    `**Verdict:** ${verdict}`,
    `**Score:** ${score}/10`,
    '',
    '## Critical',
    ...(critical.length ? critical.map((item) => `- slide_id \`${item.slide_id}\`: ${item.message}`) : ['- None']),
    '',
    '## Major',
    ...(major.length ? major.map((item) => `- slide_id \`${item.slide_id}\`: ${item.message}`) : ['- None']),
    '',
    '## Minor',
    ...(minor.length ? minor.map((item) => `- slide_id \`${item.slide_id}\`: ${item.message}`) : ['- None']),
    '',
    '## Exact Fix List',
    ...(findings.length ? findings.map((item, idx) => `${idx + 1}. {slide_id: "${item.slide_id}", patch: "${item.message}"}`) : ['- None'])
  ];
  const outPath = path.join(agentRoot, 'lessons', lane, 'qa-report.md');
  writeText(outPath, `${lines.join('\n')}\n`);
  return { verdict, outPath };
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  if (!args.lane) fail(4, 'Usage: node scripts/runAgent.js --lane <lane-id> --mode render|qa|all');
  const mode = args.mode || 'all';
  try {
    if (mode === 'render' || mode === 'all') renderLane(args.lane);
    if (mode === 'qa' || mode === 'all') {
      if (mode === 'qa') renderLane(args.lane);
      const findings = [...runLayoutQa(args.lane), ...runMappingQa(args.lane), ...runBannedQa(args.lane)];
      const result = writeQaReport(args.lane, findings);
      console.log(`QA ${result.verdict}: ${result.outPath}`);
    }
  } catch (error) {
    fail(error.code || 4, error.stack || error.message);
  }
}
