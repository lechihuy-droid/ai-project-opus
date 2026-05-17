# Production Runner Pack
**Status:** Active v1  
**Role:** Copy-paste prompt pack for TTS, recording brief, publish handoff, and post-video maintenance

---

## 1. Purpose

Use this file when the main agent wants bounded subagents for:

```text
TTS / pause pass
recording brief
publish handoff
post-video decision log
```

This pack is for execution, not strategy.

---

## 2. When To Use

Use this pack when:

- the script is already content-stable;
- slide/script sync has already passed or is nearly clean;
- the team is preparing audio, recording, or publish handoff.

Do not use this pack to:

- rewrite grammar explanations;
- change slide order;
- repair major lesson-logic problems that belong upstream.

---

## 3. Shared Variables

Replace these once before running:

```text
TOPIC_SLUG = wake-cluster
TOPIC_FOLDER = production/00-active/wake-cluster/
SKELETON = production/00-active/wake-cluster/01-master-teaching-skeleton.md
ARCHITECTURE = production/00-active/wake-cluster/05-wake-mvp-output-architecture.md
SLIDE_DECK = production/00-active/wake-cluster/03-slide-deck.md
SCRIPT = production/00-active/wake-cluster/02-script.md
QUIZ_TARGET = production/00-active/wake-cluster/wake-cluster-diagnostic-quiz.md
WORKSHEET_TARGET = production/worksheets/wake-cluster.md
SHORTS_TARGET = production/shorts/wake-cluster.md
RECORDING_BRIEF = production/recording/wake-cluster-recording-brief.md
DECISION_LOG = production/00-active/wake-cluster/post-video-decision-log.md
SLIDE_PRODUCTION_RULES = production/01-rules/slide-system/03-slide-design-production-rules.md
SLIDE_FRAMEWORK_QA = production/01-rules/slide-system/04-slide-framework-qa-checklist.md
```

---

## 4. Spawn Order

Default order:

```text
1. TTS / Pause Pass
2. Recording Brief Builder
3. Publish Handoff Builder
4. Post-Video Decision Log Curator
```

Parallel rule:

```text
Recording Brief and Publish Handoff may run in parallel
only after the script is already stable.
```

---

## 5. HTML Runtime Build Runner (Step 4.0)

**Role family:** `execution`  
**Write mode:** `scoped_multi_file_writer`  
**Write scope:** `wake-cluster-deck.html`, runtime support assets if required  
**Decision label:** `slide build`

```text
Task:
Build the lesson runtime from `03-slide-deck.md` as a scene/state HTML deck that can be rendered directly into video with synced audio and timing.

Gate required before running:
- Gate G (Slide / Script Sync QA) must be cleared.
- 03-slide-deck.md Structure / Design Layer must be stable enough for MVP rendering.

Read:
- SLIDE_DECK (Design Layer — visual spec for each slide)
- DESIGN_DIRECTION (lucida-slide-design-direction.md)
- SLIDE_PRODUCTION_RULES
- SLIDE_FRAMEWORK_QA
- 08-production-frame-map.md when reveal states need scene/state timing mapping

Tooling:
- deck_generator.py (Jinja2): 03-slide-deck.md -> wake-cluster-deck.html

Write scope:
- production/00-active/<topic>/wake-cluster-deck.html
- runtime support assets only if the HTML deck requires them for direct render

Do not change:
- slide content or wording
- teaching order

Rules:
- Runtime deck must remain renderable as a deterministic scene/state sequence.
- Resolution target remains 1920x1080 (16:9) unless the project architect changes platform format.
- Logical slide numbering must still match script numbering exactly.
- Reveal logic should be representable as explicit scene/state milestones, not hidden script-only intent.
- Quiz / reveal slides must remain understandable both as teaching slides and as timed runtime states.
- If a slide needs multiple visual beats inside one script segment, timing must be declared in the scene/state map rather than improvised during render.

Parallel note:
- This step may run in parallel with Step 4.1 (TTS / Pause Pass)
- Both are independent - HTML runtime build and audio generation are separate write scopes

Success means:
- wake-cluster-deck.html is generated from the locked deck spec
- runtime structure matches the locked slide count
- scene/state hooks are stable enough for timed render
- no blank or placeholder slides

If revise:
- Fix generator/template/design issues, re-export only the affected slide(s)

If block:
- Design Layer has unresolved issues → return to Gate E (Slide Design QA)
- Script slide count changed → return to Gate G (Sync QA)
```

---

## 6. TTS / Pause Pass Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `SCRIPT`  
**Decision label:** `tts pacing pass`

```text
Task:
Refine TTS and pacing markers in the script without changing content.

Read:
- SCRIPT
- ARCHITECTURE

Write scope:
- SCRIPT

Do not change:
- wording
- grammar meaning
- slide count
- teaching order

Rules:
- Only add, remove, or refine TTS markers and pause cues.
- Respect the TTS marker legend inside the script.
- Improve breathing points, reveal timing, and quiz pacing.
- Preserve bilingual audio lanes: Vietnamese narration goes to VieNeu, long Japanese example sentences stay Japanese for VOICEVOX, and only short grammar labels inside Vietnamese narration may be adapted to learner-safe phonetics by the audio adapter.
- Flag any line that would become mixed Japanese + Vietnamese phonetics; do not manually convert full Japanese sentences into Vietnamese phonetics.

Output format:
- updated SCRIPT with TTS markers
- note any places still risky for TTS
```

---

## 6. Recording Brief Builder Runner

**Role family:** `curation`  
**Write mode:** `single_file_writer`  
**Write scope:** `RECORDING_BRIEF`  
**Decision label:** `recording handoff`

```text
Task:
Generate or revise the recording brief for the lesson.

Read:
- SCRIPT
- SLIDE_DECK
- ARCHITECTURE

Write scope:
- RECORDING_BRIEF

Do not change:
- lesson wording
- lesson truth

Rules:
- Summarize recording intent per section.
- Note pacing-sensitive slides, retrieval moments, and CTA tone.
- Keep it useful for human voice or TTS-assisted production.

Output format:
- recording brief
- list of timing-sensitive beats
- list of pronunciation-risk lines if needed
```

---

## 7. Publish Handoff Builder Runner

**Role family:** `curation`  
**Write mode:** `scoped_multi_file_writer`  
**Write scope:** `SHORTS_TARGET`, lesson publish notes, or a local handoff file chosen by the main agent  
**Decision label:** `publish pack`

```text
Task:
Prepare publish-facing handoff material from the locked lesson assets.

Read:
- SCRIPT
- WORKSHEET_TARGET
- QUIZ_TARGET
- SHORTS_TARGET when it exists

Write scope:
- chosen publish handoff file(s)

Do not change:
- lesson truth
- CTA promise

Rules:
- Keep title / description / CTA aligned with the actual asset offer.
- Do not promise missing assets.
- Reuse the same learner pain and promise from the lesson.

Output format:
- publish handoff draft
- CTA lines
- description / pinned-comment candidates if requested
```

---

## 8. Post-Video Decision Log Curator

**Role family:** `qa`  
**Write mode:** `single_file_writer`  
**Write scope:** `DECISION_LOG`  
**Decision label:** `maintenance log`

```text
Task:
Capture what should be learned or updated after production or publish review.

Read:
- SCRIPT
- SLIDE_DECK
- relevant runner packs
- any review findings provided by the main agent

Write scope:
- DECISION_LOG

Do not change:
- historical lesson truth

Rules:
- Record what worked, what failed, and what should update rules or prompts.
- Separate topic-specific fixes from global process lessons.
- Keep entries short and actionable.

Output format:
- date
- issue
- local fix
- global rule update suggestion
```

---

## 9. Audio Generation Runner (Step 4.5)

**Role family:** `execution`  
**Write mode:** `scoped_multi_file_writer`  
**Write scope:** `audio/`, `audio-rvc/`, `video/`  
**Decision label:** `audio generation`  
**Full SOP:** `automation/workflows/38-audio-generation-sop.md`

```text
Task:
Run audio adapter → bilingual TTS → RVC → Assembly pipeline to produce raw-<topic>.mp4.

Gate required before running:
- Gate J (Production Readiness) must be cleared by MAIN_AGENT.

Read:
- SCRIPT (content-locked, do not change)
- wake-cluster-deck.html
- 08-production-frame-map.md
- .env (GRADIO_API_URL, RVC params)

Write scope:
- production/00-active/<topic>/audio/02-script.vieneu-tts.md
- production/00-active/<topic>/audio/slide-*.mp3
- production/00-active/<topic>/audio-rvc/rvc-slide-*.wav  (if RVC active)
- production/00-active/<topic>/video/raw-<topic>.mp4

Do not change:
- script content
- slide runtime structure
- any upstream artifacts

Bilingual audio contract:
- VieNeu reads Vietnamese narration and short grammar labels adapted by the terms-only profile.
- VOICEVOX reads long Japanese example sentences in Japanese.
- `wake_vi` / `wake_vi_terms` is allowed for short labels; `wake_vi_all` is legacy/debug only and must not be used for final audio.
- If the adapted script contains mixed strings such as Japanese sentence text with `quà kê` inserted inside it, stop and fix segmentation before generation.

Execution (active path — HTML screen recording):
  # Full HTML record path (sau khi scripts build xong):
  python automation/video/pipeline.py <topic> --skip-screenshot --skip-tts --html-record

  # Manual step-by-step:
  python automation/video/compute_durations.py <topic>/audio-rvc --out <topic>/video/slide-durations.json
  python automation/video/screenrecord_slides.py <topic>/wake-cluster-deck.html <topic>/video/slide-durations.json <topic>/video/html-record-<topic>.mp4
  python automation/video/merge_audio.py <topic>/video/html-record-<topic>.mp4 <topic>/audio-rvc <topic>/video/raw-<topic>.mp4

  Full SOP: automation/workflows/39-html-video-generation-sop.md

  Legacy fallback (PNG path):
  python automation/video/pipeline.py <topic> --skip-screenshot --skip-tts

Success means:
- video/raw-<topic>.mp4 exists
- audio pacing passes human review
- VI/JP code-switching sounds natural
- runtime timing passes human review

If revise:
- pacing off → tune BREATH_MS / PARA_PAUSE in tts_agent.py, rerun TTS
- voice wrong → change VOICEVOX_SPEAKER or VI_RATE, rerun TTS
- RVC artifacts → tune RVC_INDEX_RATE in .env, rerun --skip-tts
- render error → fix runtime timing or render hooks, rerun the narrowest step

If block:
- script content broken → Gate G (Slide/Script Sync QA)
- runtime deck missing or unstable -> return to Step 4.0

Status update target:
- production/00-active/<topic>/07-automation-status.md
```

---

## 10. Main Agent Merge Checklist

Before promoting outputs downstream, confirm:

```text
[ ] TTS markers are clear and grep-friendly
[ ] Recording brief matches the script
[ ] Publish handoff does not overpromise
[ ] Decision log captures both local and global lessons
[ ] Audio pacing reviewed — VI/JP transitions sound natural
[ ] raw-<topic>.mp4 exists and plays without error
[ ] 07-automation-status.md updated with current gate and decision
```
