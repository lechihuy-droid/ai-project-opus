#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync} from 'node:fs';
import {basename, dirname, extname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const MATCH_THRESHOLD = 0.85;
const MAX_PHRASE_WORDS = 12;
const PAUSE_BREAK_MS = 300;

export function normalizeWord(value) {
  return String(value ?? '')
    .normalize('NFC')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function tokenize(text) {
  const tokens = [];
  const matcher = /[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;
  let match;
  while ((match = matcher.exec(String(text ?? ''))) !== null) {
    const tail = String(text).slice(matcher.lastIndex);
    const punctuation = tail.match(/^\s*([.,;:!?]+)/u)?.[1] ?? '';
    tokens.push({text: match[0], normalized: normalizeWord(match[0]), punctuation});
  }
  return tokens;
}

function splitSentences(text) {
  const result = String(text ?? '').match(/[^.!?]+(?:[.!?]+|$)/gu) ?? [];
  return result.map((item) => item.trim()).filter(Boolean);
}

function scriptSentences(approvedScript) {
  const content = approvedScript?.content ?? {};
  const declaredSentences = approvedScript?.sentences ?? content.sentences;
  if (Array.isArray(declaredSentences) && declaredSentences.length > 0) {
    return declaredSentences.map((sentence, index) => ({
      sentenceId: sentence.sentenceId ?? sentence.id ?? `sentence-${String(index + 1).padStart(3, '0')}`,
      segmentId: sentence.segmentId ?? `segment-${String(index + 1).padStart(3, '0')}`,
      text: sentence.text ?? sentence.voiceoverText ?? '',
    }));
  }

  if (Array.isArray(content.segments) && content.segments.length > 0) {
    const sentences = [];
    for (const [segmentIndex, segment] of content.segments.entries()) {
      const segmentId = segment.segmentId ?? segment.id ?? `segment-${String(segmentIndex + 1).padStart(3, '0')}`;
      const source = segment.voiceoverText ?? segment.text ?? segment.narration ?? '';
      splitSentences(source).forEach((text, sentenceIndex) => {
        sentences.push({
          sentenceId: `${segmentId}-sentence-${String(sentenceIndex + 1).padStart(3, '0')}`,
          segmentId,
          text,
        });
      });
    }
    if (sentences.length > 0) return sentences;
  }

  return splitSentences(content.voiceoverText).map((text, index) => ({
    sentenceId: `sentence-${String(index + 1).padStart(3, '0')}`,
    segmentId: `segment-${String(index + 1).padStart(3, '0')}`,
    text,
  }));
}

function whisperWords(whisperxJson) {
  return (whisperxJson?.segments ?? []).flatMap((segment) => segment.words ?? []).map((word) => ({
    text: String(word.word ?? '').trim(),
    normalized: normalizeWord(word.word),
    startMs: Number.isFinite(word.start) ? Math.round(word.start * 1000) : null,
    endMs: Number.isFinite(word.end) ? Math.round(word.end * 1000) : null,
  })).filter((word) => word.normalized);
}

export function reconcileApprovedScript(approvedScript, whisperxJson) {
  const sentences = scriptSentences(approvedScript);
  const scriptWords = sentences.flatMap((sentence) => tokenize(sentence.text).map((word) => ({...sentence, ...word})));
  const transcriptWords = whisperWords(whisperxJson);
  const alignedWords = scriptWords.map((word) => ({...word, startMs: null, endMs: null}));
  let scriptIndex = 0;
  let transcriptIndex = 0;
  let matchedWords = 0;

  while (scriptIndex < scriptWords.length && transcriptIndex < transcriptWords.length) {
    const scriptWord = scriptWords[scriptIndex];
    const transcriptWord = transcriptWords[transcriptIndex];
    if (scriptWord.normalized === transcriptWord.normalized) {
      alignedWords[scriptIndex].startMs = transcriptWord.startMs;
      alignedWords[scriptIndex].endMs = transcriptWord.endMs;
      matchedWords += 1;
      scriptIndex += 1;
      transcriptIndex += 1;
      continue;
    }

    const nextTranscriptMatch = transcriptWords.findIndex((candidate, index) => index > transcriptIndex && candidate.normalized === scriptWord.normalized);
    const nextScriptMatch = scriptWords.findIndex((candidate, index) => index > scriptIndex && candidate.normalized === transcriptWord.normalized);
    const transcriptDistance = nextTranscriptMatch < 0 ? Number.POSITIVE_INFINITY : nextTranscriptMatch - transcriptIndex;
    const scriptDistance = nextScriptMatch < 0 ? Number.POSITIVE_INFINITY : nextScriptMatch - scriptIndex;
    if (transcriptDistance < Number.POSITIVE_INFINITY && transcriptDistance <= scriptDistance) {
      transcriptIndex += 1;
    } else {
      scriptIndex += 1;
    }
  }

  const totalWords = scriptWords.length;
  const missingTimestamps = alignedWords.filter((word) => word.startMs === null || word.endMs === null).length;
  return {
    sentences,
    words: alignedWords,
    matchedWords,
    totalWords,
    matchedWordRatio: totalWords === 0 ? 0 : matchedWords / totalWords,
    missingTimestamps,
  };
}

function firstTiming(words, key) {
  const timed = key === 'startMs' ? words.find((word) => word.startMs !== null) : [...words].reverse().find((word) => word.endMs !== null);
  return timed?.[key] ?? null;
}

export function fillMissingTimestamps(alignment, options = {}) {
  const durationMs = Number.isFinite(options.durationMs) ? Math.max(0, Math.round(options.durationMs)) : null;
  const words = alignment.words.map((word) => ({...word}));
  const fallbackDurationMs = durationMs ?? Math.max(0, ...words.map((word) => word.endMs ?? 0));
  let index = 0;

  while (index < words.length) {
    if (Number.isFinite(words[index].startMs) && Number.isFinite(words[index].endMs)) {
      index += 1;
      continue;
    }

    const runStart = index;
    while (index < words.length && (!Number.isFinite(words[index].startMs) || !Number.isFinite(words[index].endMs))) index += 1;
    const runEnd = index;
    const previous = words[runStart - 1];
    const next = words[runEnd];
    const lowerBound = Number.isFinite(previous?.endMs) ? previous.endMs : 0;
    const upperBound = Number.isFinite(next?.startMs) ? next.startMs : fallbackDurationMs;
    const startMs = Math.max(0, Math.min(lowerBound, fallbackDurationMs));
    const endMs = Math.max(startMs, Math.min(upperBound, fallbackDurationMs));
    const count = runEnd - runStart;

    for (let offset = 0; offset < count; offset += 1) {
      words[runStart + offset].startMs = Math.round(startMs + ((endMs - startMs) * offset) / count);
      words[runStart + offset].endMs = Math.round(startMs + ((endMs - startMs) * (offset + 1)) / count);
    }
  }

  let previousEndMs = 0;
  for (const word of words) {
    word.startMs = Math.max(previousEndMs, Math.min(word.startMs, fallbackDurationMs));
    word.endMs = Math.max(word.startMs, Math.min(word.endMs, fallbackDurationMs));
    previousEndMs = word.endMs;
  }

  return {...alignment, words};
}

export function groupAlignedWords(alignment, options = {}) {
  const timedAlignment = fillMissingTimestamps(alignment, {durationMs: options.durationMs});
  const maxWords = options.maxWords ?? MAX_PHRASE_WORDS;
  const pauseBreakMs = options.pauseBreakMs ?? PAUSE_BREAK_MS;
  const phrases = [];

  for (const sentence of timedAlignment.sentences) {
    const words = timedAlignment.words.filter((word) => word.sentenceId === sentence.sentenceId);
    let current = [];
    const flush = () => {
      if (current.length === 0) return;
      phrases.push({
        phraseId: `phrase-${String(phrases.length + 1).padStart(3, '0')}`,
        sentenceId: sentence.sentenceId,
        text: current.map((word, index) => `${word.text}${index === current.length - 1 ? word.punctuation : ''}`).join(' '),
        startMs: firstTiming(current, 'startMs'),
        endMs: firstTiming(current, 'endMs'),
        words: current.map((word) => ({text: word.text, startMs: word.startMs, endMs: word.endMs})),
      });
      current = [];
    };

    words.forEach((word, index) => {
      current.push(word);
      const next = words[index + 1];
      const pauseMs = word.endMs !== null && next && next.startMs !== null ? next.startMs - word.endMs : null;
      if (current.length >= maxWords || /[.,;:!?]/u.test(word.punctuation) || pauseMs >= pauseBreakMs || !next) flush();
    });
  }

  const timedSentences = timedAlignment.sentences.map((sentence) => {
    const words = timedAlignment.words.filter((word) => word.sentenceId === sentence.sentenceId);
    return {
      sentenceId: sentence.sentenceId,
      segmentId: sentence.segmentId,
      startMs: firstTiming(words, 'startMs'),
      endMs: firstTiming(words, 'endMs'),
    };
  });
  const pauses = timedSentences.slice(0, -1).flatMap((sentence, index) => {
    const nextSentence = timedSentences[index + 1];
    if (sentence.endMs === null || nextSentence.startMs === null || nextSentence.startMs <= sentence.endMs) return [];
    return [{afterSentenceId: sentence.sentenceId, durationMs: nextSentence.startMs - sentence.endMs}];
  });
  return {sentences: timedSentences, phrases, pauses};
}

export function buildTimedScript({approvedScript, whisperxJson, voiceTrack, voiceChecksum}) {
  const alignment = reconcileApprovedScript(approvedScript, whisperxJson);
  const grouped = groupAlignedWords(alignment, {durationMs: voiceTrack.durationMs});
  return {
    schemaVersion: '1.0',
    scriptId: approvedScript.scriptId ?? approvedScript.id,
    scriptRevision: approvedScript.scriptRevision ?? approvedScript.revision,
    scriptChecksum: voiceTrack.scriptChecksum,
    voiceChecksum,
    durationMs: voiceTrack.durationMs,
    sentences: grouped.sentences,
    phrases: grouped.phrases,
    pauses: grouped.pauses,
    alignment: {
      matchedWordRatio: alignment.matchedWordRatio,
      missingTimestamps: alignment.missingTimestamps,
    },
  };
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--run-id') args.runId = argv[++index];
    else if (argv[index] === '--script') args.script = argv[++index];
    else if (argv[index] === '--reuse-transcript') args.reuseTranscript = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!args.runId || !args.script) throw new Error('Usage: node scripts/voice-align.mjs --run-id <id> --script <approved-script.json> [--reuse-transcript <json>]');
  if (args.reuseTranscript === undefined && argv.includes('--reuse-transcript')) throw new Error('Missing value for --reuse-transcript');
  if (!/^[A-Za-z0-9._-]+$/u.test(args.runId)) throw new Error('Invalid --run-id');
  return args;
}

function findJsonFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? findJsonFiles(path) : extname(entry.name).toLowerCase() === '.json' ? [path] : [];
  });
}

function runCli() {
  const {runId, script, reuseTranscript} = parseArgs(process.argv.slice(2));
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const audioDir = join(root, 'public', 'runs', runId, 'audio');
  const voicePath = join(audioDir, 'voice.wav');
  const voiceTrackPath = join(audioDir, 'voice-track.json');
  const pythonPath = join(root, '.venv-whisperx', 'Scripts', 'python.exe');
  const scriptPath = resolve(root, script);
  const transcriptPath = reuseTranscript ? resolve(root, reuseTranscript) : null;
  const preflightPaths = [['voice.wav', voicePath], ['voice-track.json', voiceTrackPath], ['approved script', scriptPath]];
  if (transcriptPath) preflightPaths.push(['reused transcript', transcriptPath]);
  else preflightPaths.push(['WhisperX Python', pythonPath]);
  for (const [label, path] of preflightPaths) {
    if (!existsSync(path)) throw new Error(`Preflight failed: ${label} not found at ${path}`);
  }

  const approvedScript = JSON.parse(readFileSync(scriptPath, 'utf8'));
  const voiceTrack = JSON.parse(readFileSync(voiceTrackPath, 'utf8'));
  const expectedScriptChecksum = `sha256:${sha256(String(approvedScript?.content?.voiceoverText ?? ''))}`;
  if (voiceTrack.scriptChecksum !== expectedScriptChecksum) {
    throw new Error(`Preflight failed: scriptChecksum mismatch (voice-track=${voiceTrack.scriptChecksum}, approved-script=${expectedScriptChecksum})`);
  }

  let whisperxJson;
  if (transcriptPath) {
    whisperxJson = JSON.parse(readFileSync(transcriptPath, 'utf8'));
  } else {
    const whisperxDir = join(audioDir, 'whisperx');
    mkdirSync(whisperxDir, {recursive: true});
    // whisperx VAD/align in this venv emits bogus fixed timestamps (see docs/spike-vieneu-chunking.md);
    // faster-whisper word timestamps are used instead via scripts/fw-transcribe.py.
    const result = spawnSync(pythonPath, [
      join(root, 'scripts', 'fw-transcribe.py'), voicePath,
      '--language', 'vi', '--model', 'small',
      '--out', join(whisperxDir, 'voice.json'),
    ], {cwd: root, stdio: 'inherit', env: {...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1'}});
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`WhisperX exited with code ${result.status}`);

    const jsonFiles = findJsonFiles(whisperxDir).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    const preferred = jsonFiles.find((path) => basename(path, '.json') === basename(voicePath, extname(voicePath)));
    const generatedTranscriptPath = preferred ?? jsonFiles[0];
    if (!generatedTranscriptPath) throw new Error(`WhisperX did not create a JSON transcript in ${whisperxDir}`);
    whisperxJson = JSON.parse(readFileSync(generatedTranscriptPath, 'utf8'));
  }
  const alignment = reconcileApprovedScript(approvedScript, whisperxJson);
  if (alignment.matchedWordRatio < MATCH_THRESHOLD) {
    console.error(JSON.stringify({
      error: 'alignment_ratio_below_threshold',
      matchedWordRatio: alignment.matchedWordRatio,
      threshold: MATCH_THRESHOLD,
      matchedWords: alignment.matchedWords,
      totalWords: alignment.totalWords,
      missingTimestamps: alignment.missingTimestamps,
    }, null, 2));
    process.exitCode = 1;
    return;
  }

  const voiceChecksum = voiceTrack.checksum ?? voiceTrack.voiceChecksum ?? voiceTrack.audioChecksum ?? `sha256:${sha256(readFileSync(voicePath))}`;
  const timedScript = buildTimedScript({approvedScript, whisperxJson, voiceTrack, voiceChecksum});
  const outputPath = join(audioDir, 'timed-script.json');
  writeFileSync(outputPath, `${JSON.stringify(timedScript, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
}

const isEntryPoint = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
