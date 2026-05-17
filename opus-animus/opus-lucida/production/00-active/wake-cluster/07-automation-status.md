# Wake Cluster Automation Status
**Status:** Active runtime board  
**Date:** 2026-05-07  
**Topic:** `wake-cluster`

---

## 1. Purpose

This file is the canonical automation state for the active Wake pipeline.

Use it to answer:

```text
Where is the pipeline now?
Which gate is current?
What already passed?
What is blocked?
Which file was last updated?
What should rerun next if needed?
```

Do not rely on chat memory alone.

---

## 2. Status Legend

```text
NOT_STARTED
READY
RUNNING
PASS
REVISE
BLOCK
MANUAL
```

---

## 3. Current Snapshot

| Field | Value |
|---|---|
| Current phase | `Phase 4 - HTML video render` |
| Current step | `Step 4.6 HTML screen recording + audio merge` |
| Current gate | `Gate J — pending scripts build` |
| Overall decision | `RVC audio complete (17/17). Active production path: HTML screen recording + RVC WAV merge. Scripts cần build: compute_durations.py, screenrecord_slides.py, merge_audio.py` |
| Retry lane if reopened | `34-runner-production` |
| Last updated | `2026-05-06` |

---

## 4. Gate Board

| Gate | Step | Status | Main artifact | Latest decision note | Retry lane |
|---|---|---|---|---|---|
| Gate A | 0.2 Source-of-truth lock | `PASS` | active Wake folder | active topic folder and backbone files exist | n/a |
| Gate B | 1.5 Example curation | `PASS` | `wake-approved-examples.md` | primary spine + practical expansion + one micro trend support locked | `31-runner-example-lane` |
| Gate C | 2.1 Skeleton QA | `PASS` | `01-master-teaching-skeleton.md` | reviewed and synced to approved examples | `32-runner-lesson-production` |
| Gate D | 2.3 Slide Structure QA | `PASS` | `03-slide-deck.md` Structure Layer | 17-slide structure is stable enough for downstream work | `32-runner-lesson-production` |
| Gate E | 2.5 Slide Design QA | `READY` | `03-slide-deck.md` Design Layer | structure exists, but full design-layer execution is still pending | `32-runner-lesson-production` |
| Gate F | 2.7 Script QA | `PASS` | `02-script.md` | naturalness issues were patched; TTS markers added | `32-runner-lesson-production` |
| Gate G | 2.8 Slide / Script Sync QA | `PASS` | `02-script.md` + `03-slide-deck.md` | approved examples and wording are synced for current MVP | `32-runner-lesson-production` |
| Gate H | 3.3 Answer / Trap QA | `READY` | worksheet + diagnostic quiz | scene/state map and exercise review now exist; assessment assets can be generated | `33-runner-assessment` |
| Gate I | 3.5 Assessment merge | `NOT_STARTED` | worksheet + quiz + shorts | waiting for assessment outputs | `33-runner-assessment` |
| Gate J | 4.4 Production readiness | `READY_AFTER_ASSESSMENT` | HTML runtime + scene/state map + TTS markers + recording brief + publish handoff | Slide Build Step 4.0 is now the active HTML runtime build lane | `34-runner-production` |
| Gate K | 5.1 Post-video decision log | `NOT_STARTED` | decision log | publish review not reached | `34-runner-production` |

---

## 5. Current Artifact State

| Artifact | Status | Path |
|---|---|---|
| Teaching skeleton | `PASS` | `production/00-active/wake-cluster/01-master-teaching-skeleton.md` |
| Script | `PASS` | `production/00-active/wake-cluster/02-script.md` |
| Slide deck structure | `PASS` | `production/00-active/wake-cluster/03-slide-deck.md` |
| Slide deck design layer | `READY` | `production/00-active/wake-cluster/03-slide-deck.md` |
| Selected HTML design source | `LOCKED_REFERENCE` | `production/02-assets/design-prototypes/jlpt_n2_slide_engine_apple_keynote_manrope_final.html` |
| HTML runtime | `ACTIVE_RUNTIME_LAYER` | `production/00-active/wake-cluster/wake-cluster-deck.html` |
| Sprint 1 block runtime | `ACTIVE_RENDERED_01_05` | `production/00-active/wake-cluster/wake-cluster-deck-01-05.html` |
| Runtime prototype 01-02 | `ARCHITECTURE_PROOF` | `production/00-active/wake-cluster/wake-cluster-runtime-prototype-01-02.html` |
| Sprint naming convention | `LOCKED` | `production/00-active/wake-cluster/15-html-video-upgrade-plan.md` |
| RVC audio (17 files) | `PASS` | `production/00-active/wake-cluster/audio-rvc/rvc-slide-*.wav` |
| Slide PNG frames | `LEGACY_SUPPORT_OUTPUT` | `production/00-active/wake-cluster/frames/slide-*.png` |
| Slide durations JSON | `NOT_STARTED` | `production/00-active/wake-cluster/video/slide-durations.json` |
| HTML screen recording | `NOT_STARTED` | `production/00-active/wake-cluster/video/html-record-wake-cluster.mp4` |
| Output architecture | `PASS` | `production/00-active/wake-cluster/05-wake-mvp-output-architecture.md` |
| Worksheet / quiz spec | `PASS` | `production/00-active/wake-cluster/06-worksheet-quiz-operating-spec.md` |
| Scene/state timing map | `PASS` | `production/00-active/wake-cluster/08-production-frame-map.md` |
| Exercise review | `PASS` | `production/00-active/wake-cluster/09-exercise-review.md` |
| Worksheet | `NOT_STARTED` | `production/worksheets/wake-cluster.md` |
| Diagnostic quiz | `NOT_STARTED` | `production/00-active/wake-cluster/wake-cluster-diagnostic-quiz.md` |
| Shorts pack | `NOT_STARTED` | `production/shorts/wake-cluster.md` |
| Recording brief | `NOT_STARTED` | `production/recording/wake-cluster-recording-brief.md` |
| Publish handoff | `NOT_STARTED` | `production/publish/wake-cluster-publish-handoff.md` |
| Post-video decision log | `NOT_STARTED` | `production/00-active/wake-cluster/post-video-decision-log.md` |

---

## 6. Next Recommended Runs

Ordered next actions:

```text
1. Build HTML video render scripts (Step 4.6):
   -> compute_durations.py      (WAV → slide-durations.json)
   -> screenrecord_slides.py    (Playwright record HTML deck)
   -> merge_audio.py            (concat WAV + merge vào video)
   SOP: automation/workflows/39-html-video-generation-sop.md

2. Run Step 4.6 pipeline:
   -> slide-durations.json
   -> html-record-wake-cluster.mp4
   -> raw-wake-cluster.mp4

3. 33-runner-assessment (có thể chạy song song với bước 1-2):
   -> Worksheet Builder
   -> Diagnostic Quiz Builder
   -> Shorts / Repurposing Builder

4. 34-runner-production:
   -> Recording Brief Builder
   -> Publish Handoff Builder
```

---

## 7. Latest Notes

```text
- Wake example bank is already locked and synced downstream.
- Script has TTS pause markers and is usable for downstream audio prep.
- Scene/state timing map now links slides, reveal states, script cues, and exercise follow-up.
- Exercise review patched the worksheet / quiz spec with source-frame alignment.
- Slide Build Step 4.0 has shifted from Canva/manual export to HTML runtime generation.
- Reveal milestones are still valid; they now describe renderable HTML scene/state timing.
- Legacy PNG exports may still exist for inspection, but they are no longer the target production contract.
- TODO later: define direct runtime video render hooks so scene/state timing can be executed without screenshot compatibility constraints.
- Selected design source is now locked at `production/02-assets/design-prototypes/jlpt_n2_slide_engine_apple_keynote_manrope_final.html`.
- The selected design source is not a direct drop-in runtime deck because it uses `section.screen`; the active runtime layer still needs a dedicated scene/state render contract.
- MVP adaptation rule: extract visual system and components from the selected design source, but keep `wake-cluster-deck.html` ready for direct runtime rendering.
- 2026-05-06: `wake-cluster-deck.html` was adapted into a 17-slide Apple/Manrope production runtime candidate.
- Legacy note: `screenshot_slides.py` exported 17/17 frames successfully after Playwright/Chromium permission escalation, but that path is now support-only.
- Visual review note: slide 03 long Japanese pattern cards wrap across lines; acceptable for MVP, but can be refined before final runtime render.
- 2026-05-06: Project-wide Lucida slide system was approved and documented in `production/01-rules/slide-system/`.
- Next slide step: use `14-wake-slide-process-review.md` plus the slide-system acceptance process to patch remaining high-value template gaps before locking runtime render behavior.
- 2026-05-06: Added `05-slide-change-impact-policy.md` and `13-wake-slide-traceability-matrix.md` to enforce SDD-style traceability and change impact.
- 2026-05-06: Patched MVP deck for Slide 03, Slides 06-09, Slide 13, and Slide 14 based on the traceability remap.
- 2026-05-06: Legacy screenshot export still runs successfully as a support path. Human visual review of the runtime deck is the next gate before audio lock.
- 2026-05-06: RVC voice conversion complete — 17/17 slides converted via HF Space `chihuy/lucida` (FastAPI endpoint). Output: `audio-rvc/rvc-slide-*.wav`.
- 2026-05-06: Assembly approach confirmed: HTML screen recording (Playwright) + RVC WAV merge (ffmpeg). SOP: `39-html-video-generation-sop.md`. PNG assembly path demoted to legacy fallback.
- 2026-05-06: Three new scripts needed before pipeline can run: `compute_durations.py`, `screenrecord_slides.py`, `merge_audio.py`.
- 2026-05-06: Verified Slides 01-05 against the new HTML runtime process in `16-wake-html-runtime-pilot-review-01-05.md`; the main issue found was state-map drift, not teaching-logic failure.
- 2026-05-06: Rendered Sprint 1 runnable block HTML `wake-cluster-deck-01-05.html` using the new `--start / --end` deck generator flow.
- 2026-05-06: Built `wake-cluster-runtime-prototype-01-02.html` as the first script-driven runtime proof with timed reveal and slide transition behavior.
- Main blocker for true end-to-end automation is not lesson truth anymore;
  it is unfinished downstream asset generation.
- Dedicated criteria files for worksheet / diagnostic quiz / recording-publish
  still remain future hardening work, not immediate blockers.
```

---

## 8. Update Rule

Whenever a gate is cleared or reopened, update:

```text
- Current snapshot
- Gate board
- Current artifact state
- Next recommended runs
```

Do not update this file for tiny wording edits unless they change gate status or retry path.
