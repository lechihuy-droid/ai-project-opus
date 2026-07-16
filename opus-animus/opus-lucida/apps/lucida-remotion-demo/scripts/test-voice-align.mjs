#!/usr/bin/env node

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildTimedScript, groupAlignedWords, parseArgs, reconcileApprovedScript} from './voice-align.mjs';

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
assert.ok(grouped.phrases[2].words.every((word) => Number.isFinite(word.startMs) && Number.isFinite(word.endMs)));
assert.equal(grouped.pauses.length, 2);
assert.ok(grouped.phrases.every((phrase) => phrase.words.length <= 12));

const allNullSentence = {
  sentences: [
    {sentenceId: 'sentence-001', segmentId: 'segment-001', text: 'Truoc.'},
    {sentenceId: 'sentence-002', segmentId: 'segment-002', text: 'Khong khop.'},
    {sentenceId: 'sentence-003', segmentId: 'segment-003', text: 'Sau.'},
  ],
  words: [
    {sentenceId: 'sentence-001', text: 'Truoc', punctuation: '.', startMs: 100, endMs: 200},
    {sentenceId: 'sentence-002', text: 'Khong', punctuation: '', startMs: null, endMs: null},
    {sentenceId: 'sentence-002', text: 'khop', punctuation: '.', startMs: null, endMs: null},
    {sentenceId: 'sentence-003', text: 'Sau', punctuation: '.', startMs: 800, endMs: 900},
  ],
};
const allNullGrouped = groupAlignedWords(allNullSentence, {durationMs: 1000});
const unmatchedPhrase = allNullGrouped.phrases[1];
assert.deepEqual(unmatchedPhrase.words.map(({startMs, endMs}) => ({startMs, endMs})), [
  {startMs: 200, endMs: 500},
  {startMs: 500, endMs: 800},
]);
assert.ok(allNullGrouped.phrases.every((phrase, index, phrases) => Number.isFinite(phrase.startMs)
  && Number.isFinite(phrase.endMs)
  && phrase.endMs >= phrase.startMs
  && (index === 0 || phrase.startMs >= phrases[index - 1].startMs)
  && (index === 0 || phrase.endMs >= phrases[index - 1].endMs)));

const timedScript = buildTimedScript({
  approvedScript: {scriptId: 'script-001', content: {voiceoverText: 'Truoc. Khong khop. Sau.'}, sentences: allNullSentence.sentences},
  whisperxJson: {segments: [{words: [{word: 'Truoc', start: 0.1, end: 0.2}, {word: 'Sau', start: 0.8, end: 0.9}]}]},
  voiceTrack: {scriptChecksum: 'sha256:test', durationMs: 1000},
  voiceChecksum: 'sha256:voice',
});
assert.equal(timedScript.alignment.missingTimestamps, 2);
assert.ok(timedScript.phrases.every((phrase) => Number.isFinite(phrase.startMs) && Number.isFinite(phrase.endMs)));

assert.deepEqual(parseArgs(['--run-id', 'run-001', '--script', 'input/approved.json', '--reuse-transcript', 'public/runs/run-001/audio/whisperx/voice.json']), {
  runId: 'run-001', script: 'input/approved.json', reuseTranscript: 'public/runs/run-001/audio/whisperx/voice.json',
});
assert.throws(() => parseArgs(['--run-id', 'run-001', '--script', 'input/approved.json', '--reuse-transcript']), /Missing value/);

console.log('voice-align unit tests passed');
