# G02 — Script Timing and Caption Lock

**Verb:** Align

## Input
- validated `ProjectSpec`
- frozen `ApprovedScript`
- `VoiceTrack` or approved TTS configuration
- caption policy and FPS

## Worker
TTS/recording adapter, forced aligner, caption chunker, frame converter. GPT may suggest chunk boundaries or emphasis only; it cannot alter script text. Codex has no runtime role.

## Transform
- generate or register voice audio
- align sentences and words to audio
- create caption chunks
- bind caption effects from registered presets
- convert timecodes to frames

## Output
- `VoiceTrack`
- `TimedScript`
- `CaptionPlanDraft`

## Verify
- script/audio hashes match declared versions
- 100% sentence coverage
- no added, removed, reordered, or overlapping text
- word timings stay inside sentence timings
- chunks satisfy reading and line-length policies

## Failure routing
Audio mismatch requires rerecord/TTS regeneration or a new script revision. Timing defects retry deterministic alignment before human review.