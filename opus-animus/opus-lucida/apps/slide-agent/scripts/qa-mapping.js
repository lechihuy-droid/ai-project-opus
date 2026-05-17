import fs from 'node:fs';
import path from 'node:path';
import { fail, getPlanPath, isMain, normalizePlan, parseArgs, readJson, repoRoot } from './lib.js';

function slugifyHeading(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
}

function anchorsFromSkeleton(markdown) {
  const anchors = new Set();
  for (const line of markdown.split(/\r?\n/)) {
    const explicit = [...line.matchAll(/\{#([^}]+)\}/g)];
    for (const match of explicit) anchors.add(match[1]);
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) anchors.add(slugifyHeading(heading[1].replace(/\{#.+?\}/g, '').trim()));
  }
  return anchors;
}

export function runMappingQa(lane) {
  const skeletonPath = path.join(repoRoot, 'production', '00-active', lane, '01-master-teaching-skeleton.md');
  const plan = normalizePlan(readJson(getPlanPath(lane)), lane);
  const findings = [];
  if (!fs.existsSync(skeletonPath)) {
    return [{ severity: 'critical', slide_id: null, message: `missing skeleton ${skeletonPath}` }];
  }
  const anchors = anchorsFromSkeleton(fs.readFileSync(skeletonPath, 'utf8'));
  for (const slide of plan.slides) {
    const source = slide.source_section || slide.skeleton_link || '';
    const anchor = source.includes('#') ? source.split('#').pop() : '';
    const sectionNumber = anchor.match(/^(\d+)-/)?.[1];
    const hasSectionAlias = sectionNumber && [...anchors].some((item) => item.startsWith(`${sectionNumber}-`));
    const hasPrefixAlias = [...anchors].some((item) => item.startsWith(anchor.replace(/^\d+-/, '')));
    if (!anchor || (!anchors.has(anchor) && !hasSectionAlias && !hasPrefixAlias)) {
      findings.push({ severity: 'major', slide_id: slide.slide_id, source_section: source, message: `source anchor not found: ${anchor || '(none)'}` });
    }
  }
  return findings;
}

if (isMain(import.meta.url)) {
  const args = parseArgs();
  if (!args.lane) fail(4, 'Usage: node scripts/qa-mapping.js --lane <lane-id>');
  console.log(JSON.stringify(runMappingQa(args.lane), null, 2));
}
