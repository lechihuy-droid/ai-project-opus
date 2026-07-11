# Lucida Create Workflow v1.02 — Caption Sync Extension

## Status

This document is a **mandatory extension** to `CREATE_FLOW_v1.02.md`.

It introduces a first-class timing and caption synchronization gate for projects where the approved script must be displayed as closed captions, animated text, karaoke-style word highlighting, or sentence-synchronized typography.

The extension is inserted after project initialization and before story planning:

```text
ApprovedScript + ProjectConfig
  -> ProjectSpec
  -> AudioPreparation
  -> TimedScript + CaptionPlanDraft
  -> CreativeBrief
  -> StoryPlan
  -> SceneRequirements
  -> ResourcePlan
  -> CreativePlan
  -> ImplementationPlan
  -> VideoSpec
  -> PreviewBundle
  -> Approval
  -> VideoArtifact
```

The core rule is:

> Voice-over, captions, animated text, and visual beats must share one canonical timeline.

---

# 1. Input contract changes

The Create Workflow must receive an `ApprovedScript` that is sentence-addressable and immutable.

Minimum required structure:

```json
{
  "schemaVersion": "1.0",
  "scriptId": "script-ai-harness-001",
  "revision": 3,
  "status": "approved",
  "language": "vi",
  "content": {
    "voiceoverText": "..."
  },
  "sentences": [
    {
      "sentenceId": "sent-001",
      "segmentId": "seg-001",
      "order": 1,
      "text": "Một model mạnh chưa đủ để tạo ra một agent đáng tin cậy.",
      "locked": true
    }
  ],
  "editorialConstraints": {
    "allowedRewriteLevel": "none"
  },
  "approval": {
    "contentFrozen": true
  },
  "provenance": {
    "contentHash": "sha256:..."
  }
}
```

Required invariants:

- Sentence IDs are unique and stable across downstream artifacts.
- Sentence order matches `voiceoverText`.
- Text is frozen before timing starts.
- Any textual change creates a new script revision.
- Remotion components must never contain an independently edited copy of the script.

---

# 2. New gate — GX1 Script Timing and Caption Lock

## Purpose

Generate or register the final voice track, align the approved script to that audio, create caption chunks, and freeze a canonical frame timeline.

This gate does not select scene style, visual assets, layout components, or cinematic motion.

## Owner

Audio and Caption Timing module.

## Input artifacts

Required:

- validated `ProjectSpec`
- `ApprovedScript`
- `CaptionPolicy`
- renderer FPS

One of:

- `RecordedVoiceTrack`
- `GeneratedVoiceTrack`
- a request to generate TTS from the exact approved script

Optional:

- pronunciation dictionary
- speaker profile
- word-emphasis suggestions
- upstream subtitle segmentation hints

## Entry criteria

- `ApprovedScript.status` is `approved` or `approved-with-notes`.
- `approval.contentFrozen = true`.
- script content hash is valid.
- every sentence has a stable `sentenceId`.
- language is supported by the TTS/alignment path.
- FPS and target audio format are resolved.
- no unresolved script revision exists.

## Worker composition

Primary deterministic workers:

- text canonicalizer
- TTS adapter or audio registrar
- forced-alignment engine
- sentence and word timestamp normalizer
- caption chunker
- millisecond-to-frame converter
- timeline validator

Optional GPT worker:

- propose caption chunk boundaries
- propose emphasis words
- classify rhetorical emphasis

GPT restrictions:

- must not alter sentence text
- must not add, remove, paraphrase, translate, or reorder words
- must return only indexes or references into locked text
- cannot write timing values directly when forced-alignment evidence exists

Codex role:

- none during normal operation
- may implement or repair deterministic adapters, schemas, or Remotion caption components outside the running production job

## Transform

1. Register or generate the final voice audio.
2. Compute and verify the audio hash.
3. Align approved sentences and words to the audio.
4. Convert timestamps to canonical frame ranges.
5. Divide sentences into display-safe caption chunks.
6. Associate optional text-effect presets and emphasis spans.
7. Produce immutable timing and version metadata.

## Output artifacts

### `VoiceTrack`

```json
{
  "audioId": "voice-001",
  "scriptId": "script-ai-harness-001",
  "scriptRevision": 3,
  "uri": "object://...",
  "audioHash": "sha256:...",
  "durationMs": 91240,
  "sampleRate": 48000,
  "channels": 1,
  "status": "validated"
}
```

### `TimedScript`

```json
{
  "schemaVersion": "1.0",
  "scriptId": "script-ai-harness-001",
  "scriptRevision": 3,
  "scriptHash": "sha256:...",
  "audioId": "voice-001",
  "audioHash": "sha256:...",
  "fps": 30,
  "durationFrames": 2738,
  "sentences": [
    {
      "sentenceId": "sent-003",
      "text": "Một model mạnh chưa đủ để tạo ra một agent đáng tin cậy.",
      "startMs": 800,
      "endMs": 5200,
      "startFrame": 24,
      "endFrame": 156,
      "locked": true,
      "words": [
        {
          "wordIndex": 0,
          "text": "Một",
          "startMs": 800,
          "endMs": 1010
        }
      ]
    }
  ],
  "status": "validated"
}
```

### `CaptionPlanDraft`

```json
{
  "schemaVersion": "1.0",
  "sourceTimedScriptId": "timed-script-001",
  "mode": "burned-in",
  "syncPolicy": "word-aligned",
  "defaultStyleId": "lucida-caption-primary",
  "safeArea": "bottom-center",
  "maxLines": 2,
  "maxWordsPerChunk": 7,
  "chunks": [
    {
      "chunkId": "cap-003-a",
      "sentenceId": "sent-003",
      "wordStartIndex": 0,
      "wordEndIndex": 2,
      "text": "Một model mạnh",
      "startFrame": 24,
      "endFrame": 57,
      "effectPreset": "word-highlight",
      "emphasisWordIndexes": [2]
    }
  ],
  "status": "validated"
}
```

## Verification

### Script integrity

- `scriptHash` equals the approved script hash.
- Every displayed word maps to the approved text.
- No word is inserted, deleted, reordered, translated, or silently corrected.
- Sentence IDs and ordering are preserved.

### Audio integrity

- audio hash matches the registered voice track.
- duration metadata matches decoded media duration within tolerance.
- no clipping, invalid sample format, or unreadable audio file.

### Alignment integrity

- every required sentence has timestamps.
- every word timestamp is contained inside its sentence range.
- timestamps are monotonic.
- sentence and word ranges do not overlap illegally.
- final timestamp does not exceed audio duration.
- alignment confidence is above the configured threshold.

### Caption readability

- each chunk fits configured line and word limits.
- chunk duration exceeds the minimum readable duration.
- caption chunks do not overlap unless explicitly allowed.
- punctuation and phrase boundaries are respected when possible.
- safe-area policy is resolved.

### Frame integrity

- frame conversion uses the project FPS.
- start frame is less than end frame.
- all frame ranges fall inside video duration.
- rounding policy is deterministic and versioned.

## Exit criteria

- `VoiceTrack.status = validated`.
- `TimedScript.status = validated`.
- `CaptionPlanDraft.status = validated`.
- script, audio, and timeline hashes are frozen.
- zero unresolved high-severity alignment defects.
- all required sentences are covered.

## Retry policy

- media decoding error: retry once after deterministic normalization.
- low alignment confidence: retry with an alternate alignment model or adjusted language dictionary.
- caption chunk readability failure: deterministic merge/split repair.
- audio/script mismatch: do not retry creatively; block and route to re-recording or a new script revision.
- maximum automatic alignment attempts: two.

## Cache policy

Cache key:

```text
scriptHash
+ audioHash
+ fps
+ alignmentModelVersion
+ captionPolicyVersion
+ chunkerVersion
```

Changing only caption effects must not rerun voice generation or forced alignment.

## Human review

Mandatory when:

- alignment confidence is below the project threshold
- the speaker deviates from the locked script
- pronunciation notes are unresolved
- captions use aggressive animated typography
- regulated or high-value content requires transcript certification

Human reviewers may:

- move chunk boundaries within aligned sentence ranges
- change text-effect presets
- adjust emphasis word indexes
- approve minor alignment corrections

Human reviewers may not silently rewrite locked text.

## Failure routing

- script defect -> upstream script workflow, new `ApprovedScript` revision
- wrong recording -> voice regeneration or re-recording task
- unsupported language -> audio pipeline configuration task
- alignment engine failure -> alternate aligner or manual timing review
- caption policy conflict -> project configuration correction

## Metrics

- sentence coverage rate
- word alignment confidence
- caption overlap count
- unreadable-chunk rate
- average alignment correction per minute
- audio/script mismatch rate
- timing-gate cost and latency

## Events emitted

- `VOICE_TRACK_REGISTERED`
- `VOICE_TRACK_VALIDATED`
- `SCRIPT_ALIGNMENT_STARTED`
- `SCRIPT_ALIGNMENT_FAILED`
- `TIMED_SCRIPT_CREATED`
- `CAPTION_PLAN_DRAFT_CREATED`
- `CAPTION_TIMELINE_LOCKED`

---

# 3. Changes to Story Planning

Story Planning must consume `TimedScript`, not estimate scene timing from word counts when a final voice track exists.

Updated inputs:

- `ApprovedScript`
- `TimedScript`
- `CreativeBrief`
- `ProjectSpec`

Updated rules:

- scene boundaries should align with sentence or caption-chunk boundaries unless a deliberate overlap is declared
- scene duration derives from the canonical audio timeline
- every scene must reference at least one `sentenceId`
- every scene should declare which caption chunks it owns
- scene planning may merge sentences into one scene or span one sentence across multiple visual beats
- scene planning must not modify caption text or timestamps

Updated scene structure:

```json
{
  "sceneId": "scene-004",
  "startFrame": 24,
  "endFrame": 156,
  "sentenceIds": ["sent-003"],
  "captionChunkIds": ["cap-003-a", "cap-003-b", "cap-003-c"],
  "keyMessage": "A strong model is not sufficient for a reliable agent."
}
```

---

# 4. Visual beat synchronization

The Create Workflow must bind visuals to stable semantic cues rather than raw timestamps whenever possible.

Preferred mapping:

```text
captionChunkId or word cue
  -> visual beat
  -> resolved component action
  -> frame range from TimedScript
```

Example:

```json
{
  "sceneId": "scene-004",
  "visualBeats": [
    {
      "beatId": "beat-004-a",
      "trigger": {
        "captionChunkId": "cap-003-a"
      },
      "semanticAction": "introduce-model-node"
    },
    {
      "beatId": "beat-004-b",
      "trigger": {
        "captionChunkId": "cap-003-b"
      },
      "semanticAction": "show-reliability-gap"
    },
    {
      "beatId": "beat-004-c",
      "trigger": {
        "captionChunkId": "cap-003-c"
      },
      "semanticAction": "reveal-agent-system"
    }
  ]
}
```

This allows the audio to be re-aligned without losing the semantic relation between words and visuals.

---

# 5. Caption Motion Library

Animated captions must use registered, deterministic presets.

Initial preset candidates:

- `caption-fade`
- `caption-rise`
- `word-highlight`
- `word-by-word`
- `phrase-reveal`
- `keyword-scale`
- `keyword-color-accent`
- `karaoke-fill`
- `type-on`
- `impact-word`

Each preset must define:

```json
{
  "id": "word-highlight",
  "version": "1.0.0",
  "supports": ["word-timing"],
  "minChunkDurationMs": 700,
  "maxWords": 8,
  "parameters": {
    "highlightScale": {
      "minimum": 1.0,
      "maximum": 1.2,
      "default": 1.08
    },
    "inactiveOpacity": {
      "minimum": 0.3,
      "maximum": 1.0,
      "default": 0.55
    }
  },
  "reducedMotionFallback": "caption-fade"
}
```

GPT may recommend a preset from the registry, but it must not invent unregistered caption animation code during a production job.

---

# 6. VideoSpec changes

`CaptionPlan` and `AudioPlan` are first-class sections of `VideoSpec`.

```text
VideoSpec
├── ProjectSpec
├── CreativeBrief
├── StoryPlan
├── SceneRequirements
├── CreativePlan
├── ImplementationPlan
├── AudioPlan
├── CaptionPlan
├── VisualBeatPlan
└── RenderConfig
```

Minimum bindings:

```json
{
  "audioPlan": {
    "voiceTrackId": "voice-001",
    "audioHash": "sha256:..."
  },
  "captionPlan": {
    "sourceTimedScriptId": "timed-script-001",
    "captionPlanId": "caption-plan-001",
    "syncPolicy": "word-aligned"
  },
  "timeline": {
    "fps": 30,
    "durationFrames": 2738
  }
}
```

The compiler must reject a `VideoSpec` when script revision, audio hash, TimedScript revision, or caption-plan dependencies disagree.

---

# 7. Preview validation changes

Static preview checks:

- caption safe-area compliance
- maximum line count
- text overflow and clipping
- contrast and font availability
- visual hierarchy between captions and scene content

Motion preview checks:

- caption-to-audio synchronization
- word-highlight timing
- caption transition continuity
- readability under animated backgrounds
- simultaneous caption and scene-motion overload
- visual-beat triggers occur inside their referenced caption ranges

Audio-caption drift threshold must be project-configurable. A default warning threshold of two frames and failure threshold of four frames is recommended for 30 FPS output.

---

# 8. Revision and invalidation rules

After `TimedScript` is validated:

```text
script text: immutable
audio file: immutable
sentence IDs: immutable
word timestamps: immutable unless a new alignment revision is created
caption chunk boundaries: versioned and editable
caption effects: editable
visual-beat mappings: editable
```

Dependency behavior:

- caption-effect change -> invalidate caption preview only
- caption-chunk boundary change -> invalidate affected scene preview and caption plan
- visual-beat mapping change -> invalidate affected scene implementation and preview
- audio replacement -> invalidate TimedScript, StoryPlan timing, VideoSpec, all previews, and render
- script text change -> create a new ApprovedScript revision and rerun from project normalization/timing

No script text may be edited inside a Remotion component or caption rendering file.

---

# 9. Updated approval checkpoints

Mandatory human checkpoints for caption-led video:

1. Approve the locked script before audio generation.
2. Approve the voice track and TimedScript when alignment is uncertain.
3. Approve the StoryPlan and visual-beat mapping.
4. Approve a low-resolution captioned motion preview before final render.

An unattended policy may bypass checkpoints only when alignment confidence, content risk, and project policy all permit it.

---

# 10. Acceptance criteria for this extension

The extension is implemented when:

- `ApprovedScript`, `VoiceTrack`, `TimedScript`, and `CaptionPlan` schemas exist
- forced alignment produces sentence and word timestamps
- captions render from canonical IDs rather than duplicated text
- visual beats can trigger from caption chunks or word cues
- caption motion presets are deterministic and registered
- preview validation detects drift, overflow, and readability defects
- a script or audio revision invalidates only the correct dependent artifacts
- the final video can be reconstructed from versioned artifacts without consulting chat history
