#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {groupAlignedWords, reconcileApprovedScript} from './voice-align.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const whisperx = JSON.parse(readFileSync(join(root, 'pipeline', 'fixtures', 'audio', 'whisperx-mock.json'), 'utf8'));
const approvedScript = JSON.parse(readFileSync(join(root, 'pipeline', 'fixtures', 'audio', 'approved-script.fixture.json'), 'utf8'));

const alignment = reconcileApprovedScript(approvedScript, whisperx);
assert.equal(alignment.totalWords, 21);
assert.equal(alignment.matchedWords, 20);
assert.equal(alignment.matchedWordRatio, 20 / 21);
assert.equal(alignment.missingTimestamps, 1);
const deliberatelyMissing = alignment.words[8];
assert.deepEqual({startMs: deliberatelyMissing.startMs, endMs: deliberatelyMissing.endMs}, {startMs: null, endMs: null});

const grouped = groupAlignedWords(alignment);
assert.equal(grouped.sentences.length, 3);
assert.equal(grouped.phrases.length, 4);
assert.equal(grouped.phrases[2].words.find((word) => word.startMs === null).endMs, null);
assert.equal(grouped.pauses.length, 2);
assert.ok(grouped.phrases.every((phrase) => phrase.words.length <= 12));

console.log('voice-align unit tests passed');
