import fs from 'node:fs';
import path from 'node:path';
import { agentRoot, fail, findBanned, isMain, parseArgs } from './lib.js';

function stripTags(html) {
  return html.replace(/<script[^>]*>[^]*?<\/script>/gi, ' ').replace(/<style[^>]*>[^]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

export function runBannedQa(lane) {
  const deckPath = path.join(agentRoot, 'lessons', lane, 'final-deck.html');
  if (!fs.existsSync(deckPath)) return [{ severity: 'critical', slide_id: null, message: `missing deck ${deckPath}` }];
  const html = fs.readFileSync(deckPath, 'utf8');
  const findings = [];
  const sections = html.split(/<section class="slide /).slice(1);
  for (const section of sections) {
    const id = section.match(/data-slide-id="([^"]+)"/)?.[1] || '(unknown)';
    for (const term of findBanned(stripTags(section))) {
      findings.push({ severity: 'critical', slide_id: id, banned_term: term, message: `banned label detected: ${term}` });
    }
  }
  return findings;
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  if (!args.lane) fail(4, 'Usage: node scripts/qa-bannedlabel.js --lane <lane-id>');
  console.log(JSON.stringify(runBannedQa(args.lane), null, 2));
}
