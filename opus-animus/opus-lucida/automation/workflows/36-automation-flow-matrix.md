# Automation Flow Matrix
**Status:** Active v1  
**Role:** One-page matrix view of Lucida automation flow by step, tooling, inputs, outputs, gates, and retry lane

---

## 1. Purpose

Use this file when you want a compact operational view instead of reading the full prose flow.

This file is the fast scan companion to:

```text
automation/workflows/35-automation-gated-execution-flow.md
```

Rule:

```text
35 = detailed automation logic
36 = quick matrix for execution and review
```

---

## 2. Matrix

| Step | Phase | Tool / Runner | Main Inputs | Main Outputs | Gate | If Fail, Retry |
|---|---|---|---|---|---|---|
| 0.1 Topic Lock | Input readiness | `MAIN_AGENT` | strategy, topic candidates, learner pain | topic decision in active topic note or README | Manual decision | revisit topic choice |
| 0.2 Source-of-Truth Lock | Input readiness | `MAIN_AGENT` | active folder path, skeleton path, architecture plan, example bank path | locked path set | Gate A | fix missing paths / missing source files |
| 1.1 Situation Research | Example lane | `31-runner-example-lane` -> `research` | example system rules, persona map, grammar need, topic files | scene notes for candidates | none | rerun Situation Research |
| 1.2 Japanese Naturalness | Example lane | `31-runner-example-lane` -> `localization` | candidate scenes, grammar need, JP naturalness rules | `...example-candidates.md` | none | rerun Japanese Naturalness |
| 1.3 Vietnamese Naturalness | Example lane | `31-runner-example-lane` -> `localization` | candidate scenes, VN translation rules | `...example-candidates.md` | none | rerun Vietnamese Naturalness |
| 1.4 Pedagogy Fit | Example lane | `31-runner-example-lane` -> `pedagogy` | candidates, grammar affordance matrix, example QA | fit review notes | none | rerun Pedagogy Fit |
| 1.5 Curation | Example lane | `31-runner-example-lane` -> `curation`, then `MAIN_AGENT` | candidates, fit review, naturalness lines | `...approved-examples.md` | Gate B | rerun the weakest example sub-lane |
| 2.1 Skeleton QA | Lesson production | `32-runner-lesson-production` -> `qa` | `01-master-teaching-skeleton.md`, architecture, skeleton QA | review findings | Gate C | patch skeleton, then rerun Skeleton QA |
| 2.2 Slide Structure | Lesson production | `32-runner-lesson-production` -> `pedagogy` or `MAIN_AGENT` | skeleton, architecture, approved examples | `03-slide-deck.md` Structure Layer | none | rerun Slide Structure |
| 2.3 Slide Structure QA | Lesson production | `32-runner-lesson-production` -> `qa` | slide deck structure, slide QA, topic slide QA | review findings | Gate D | patch slide structure |
| 2.4 Slide Design | Lesson production | `32-runner-lesson-production` -> `design` or `MAIN_AGENT` | locked structure layer, design direction | `03-slide-deck.md` Design Layer | none | rerun Slide Design |
| 2.5 Slide Design QA | Lesson production | `32-runner-lesson-production` -> `qa` | design layer, slide QA, design direction | review findings | Gate E | patch slide design |
| 2.6 Script Polish | Lesson production | `32-runner-lesson-production` -> `localization` or `MAIN_AGENT` | skeleton, architecture, slide deck, approved examples | `02-script.md` | none | rerun Script Polish |
| 2.7 Script QA | Lesson production | `32-runner-lesson-production` -> `qa` | script, script QA | review findings | Gate F | patch script |
| 2.8 Slide / Script Sync QA | Lesson production | `32-runner-lesson-production` -> `qa` | slide deck, script, sync QA | sync review findings | Gate G | rerun narrowest lane: structure / design / script |
| 3.1 Worksheet Builder | Assessment | `33-runner-assessment` -> `pedagogy` | skeleton, architecture, slide deck, script, assessment spec | `production/worksheets/<topic>.md` | none | rerun Worksheet Builder |
| 3.2 Diagnostic Quiz Builder | Assessment | `33-runner-assessment` -> `pedagogy` | skeleton, architecture, script, assessment spec | `<topic>-diagnostic-quiz.md` | none | rerun Diagnostic Quiz Builder |
| 3.3 Answer / Trap QA | Assessment | `33-runner-assessment` -> `qa`, then `MAIN_AGENT` | worksheet, quiz, assessment spec, script | review findings | Gate H | patch worksheet and/or quiz |
| 3.4 Shorts / Repurposing | Assessment | `33-runner-assessment` -> `curation` | skeleton, script, assessment spec | `production/shorts/<topic>.md` | none | rerun Shorts Builder |
| 3.5 Assessment Merge | Assessment | `MAIN_AGENT` | worksheet, quiz, shorts | locked assessment set | Gate I | rerun the drifting asset lane |
| 4.0 HTML Runtime Build | Production | `34-runner-production` -> `deck_generator.py` | `03-slide-deck.md`, `08-production-frame-map.md`, HTML template | `wake-cluster-deck.html`, runtime support assets if needed | none | rerun deck generator / runtime build |
| 4.1 TTS / Pause Pass | Production | `34-runner-production` -> `localization` | script, architecture | `02-script.md` marker-only update | none | rerun TTS / Pause Pass |
| 4.2 Recording Brief Builder | Production | `34-runner-production` -> `curation` | script, slide deck, architecture | `production/recording/<topic>-recording-brief.md` | none | rerun Recording Brief Builder |
| 4.3 Publish Handoff Builder | Production | `34-runner-production` -> `curation` | script, worksheet, quiz, shorts | publish handoff file(s) | none | rerun Publish Handoff Builder |
| 4.4 Production Readiness | Production | `MAIN_AGENT` | script markers, recording brief, publish handoff, linked assets | locked production handoff state | Gate J | patch TTS markers, brief, or handoff |
| 4.5 Video Build / Publish | Production | `pipeline.py` + `38-audio-generation-sop` + manual review | `wake-cluster-deck.html`, `08-production-frame-map.md`, `02-script.md`, `.env` RVC config | `audio/`, `audio-rvc/`, `video/raw-<topic>.mp4` | Manual decision | rerun narrowest sub-step: runtime build / TTS / RVC / render |
| 5.1 Post-Video Decision Log | Maintenance | `34-runner-production` -> `qa`, then `MAIN_AGENT` | review findings, production notes, publish feedback | `post-video-decision-log.md` | Gate K | patch decision log or reopen local/global issue |

---

## 3. Lane View

```text
31-runner-example-lane
-> example-candidates.md
-> approved-examples.md

32-runner-lesson-production
-> 01-master-teaching-skeleton.md
-> 03-slide-deck.md
-> 02-script.md

33-runner-assessment
-> worksheet
-> diagnostic quiz
-> shorts pack

34-runner-production
-> script TTS markers
-> recording brief
-> publish handoff
-> post-video decision log
```

---

## 4. Reading Rule

Use this matrix in this order:

```text
1. find the current step
2. check which tool owns it
3. check which file should be written
4. check which gate must clear
5. if failed, rerun only the retry lane listed
```

If the matrix and the prose flow ever drift:

```text
35-automation-gated-execution-flow.md wins
36-automation-flow-matrix.md must be updated
```
