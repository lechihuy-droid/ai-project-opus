# Lucida Current Operating Flow
**Status:** Canonical v0.2  
**Date:** 2026-05-14  
**Role:** One-file summary of the current Lucida project flow, source-of-truth chain, and active production process

---

## 1. Purpose

Use this file to answer:

```text
Lucida currently works in what order?
Which folders own which layer?
Which files are canonical?
What is the active end-to-end production path?
```

This file is the project-level flow summary.

---

## 2. Lucida Flow Structure

```text
Lucida
├─ Strategy layer
│  ├─ positioning
│  ├─ business plan
│  └─ product direction
├─ Standard layer
│  └─ reusable lesson architecture rules
├─ Method layer
│  ├─ lesson method
│  ├─ grammar 3-view
│  └─ slide method
├─ Lesson production layer
│  ├─ teaching skeleton
│  ├─ slide architecture
│  ├─ script
│  ├─ worksheet / quiz spec
│  └─ assessment follow-up
├─ Slide-system layer
│  ├─ architecture framework
│  ├─ template library
│  ├─ language style guide
│  ├─ QA checklist
│  └─ acceptance process
├─ QA layer
│  ├─ skeleton QA
│  ├─ script QA
│  ├─ slide QA
│  └─ sync QA
├─ Automation layer
│  ├─ lane governance
│  ├─ lesson-production runners
│  ├─ assessment runner
│  └─ production runner
└─ Active topic lane
   └─ wake-cluster
```

---

## 3. Canonical Project Files

### 3.1 Project direction

```text
README.md
ai/status.md
ai/handoff-claude.md
10-project-architecture-map.md
strategy/standards/01-lucida-lesson-architecture-standard.md
```

### 3.2 Teaching method

```text
framework/lesson-method/02-framework-lesson-method.md
framework/grammar-3-view/03-framework-3-view-grammar.md
framework/slide-method/04-slide-method-guideline.md
```

### 3.3 Lesson production SOP

```text
automation/workflows/20-lesson-production-sop.md
automation/workflows/30-subagent-governance.md
automation/workflows/30-language-generation-runner-pack.md
automation/workflows/31-runner-example-lane.md
automation/workflows/32-runner-lesson-production.md
automation/workflows/33-runner-assessment.md
automation/workflows/34-runner-production.md
automation/workflows/35-automation-gated-execution-flow.md
automation/workflows/36-automation-flow-matrix.md
automation/workflows/37-automation-execution-contract.md
automation/workflows/38-audio-generation-sop.md
```

### 3.4 Slide-system rules

```text
production/01-rules/slide-system/01-slide-architecture-framework.md
production/01-rules/slide-system/02-slide-template-library.md
production/01-rules/slide-system/03-slide-design-production-rules.md
production/01-rules/slide-system/04-slide-framework-qa-checklist.md
production/01-rules/slide-system/05-slide-change-impact-policy.md
production/01-rules/slide-system/06-slide-template-acceptance-process.md
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
production/01-rules/slide-system/11-notebooklm-language-bank-starter-pack.md
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
automation/workflows/30-language-generation-runner-pack.md
```

### 3.5 QA criteria

```text
production/03-qa/criteria/00-three-output-review-gates.md
production/03-qa/criteria/01-skeleton-qa-criteria.md
production/03-qa/criteria/02-script-qa-criteria.md
production/03-qa/criteria/03-slide-qa-criteria.md
production/03-qa/criteria/04-slide-script-sync-criteria.md
production/03-qa/criteria/wake-slide-qa-criteria.md
```

---

## 4. Canonical End-To-End Production Flow

Current Lucida production should follow this chain:

```text
Topic choice
-> approved examples
-> teaching skeleton
-> slide architecture
-> script
-> slide-system review
-> scene/state timing map
-> worksheet / quiz operating spec
-> HTML runtime
-> audio / voice pipeline
-> timed video render
-> publish handoff
-> post-video decision log
```

More concretely:

```text
01-master-teaching-skeleton.md
-> 02-script.md
-> apps/slide-agent/lessons/<lane>/lesson.json
-> apps/slide-agent/lessons/<lane>/slide-plan.json
-> apps/slide-agent/lessons/<lane>/final-deck.html
-> production/00-active/<lane>/frames/slide-*.png
-> audio/slide-*.mp3
-> rendered video output
```

Important rule:

```text
Slides are not derived from script as passive illustrations.
Script and slide must both derive from the teaching skeleton and slide architecture.
```

---

## 5. Current Slide Creation Flow

Use this exact process:

```text
Skeleton
-> phase map
-> template choice
-> learner-facing generation contract
-> learner-facing Vietnamese pass
-> required template fields
-> learning-function integrity check
-> slide-agent render
-> Playwright frame export
-> acceptance review
-> patch
-> lock downstream assets
```

This process is owned by:

```text
production/01-rules/slide-system/06-slide-template-acceptance-process.md
```

Language quality for learner-facing Vietnamese is owned by:

```text
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

Important language rule:

```text
Any text shown to the learner in video output
must use learner-facing Japanese-study Vietnamese,
not internal system/process/template language.
```

Project continuity rule:

```text
ai/status.md = live project state (project-wide, owner-agnostic)
ai/handoff-claude.md = resume cho Claude
Do not rely on ad-hoc context files as the primary live handoff system
once ai/ folder exists.
```

---

## 5b. Remotion Script-To-Video Lane (hiện trạng — 2026-07-12)

Lane này (`apps/lucida-remotion-demo/`) chạy theo flow skill-orchestrated:

```text
raw script + raw sources
-> source-ingestor-cleaner   -> clean-brief.json
-> script-template-mapper    -> video-map.json
-> [GATE] validate:videomap + user review/approve
-> remotion-video-builder    -> mp4 + still frames
-> remotion-visual-qa        -> patch / re-render
```

Owner của flow: `ai/skills/remotion-script-to-video/SKILL.md`.

Hiện trạng cần biết (không phải bug, là gap đã ghi nhận):

```text
- Video render ra KHÔNG có audio track — audio/TTS pipeline chưa nối,
  chờ RD riêng trước khi build.
- Caption timing chia đều tuyến tính theo số từ, không dùng WhisperX
  word-timestamp; WhisperX hiện chỉ là tool STT rời.
- Template catalog 81 id nhưng chỉ ~9 adapter thực trong
  src/templateRegistry.tsx (nhiều id alias cùng adapter).
- Bộ spec design/workflow/G00–G12 là roadmap, CHƯA implement —
  xem apps/lucida-remotion-demo/design/workflow/README.md.
```

---

## 6. Active Wake Lane

The current active topic lane is:

```text
production/00-active/wake-cluster/
```

Canonical Wake files:

```text
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
05-wake-mvp-output-architecture.md
06-worksheet-quiz-operating-spec.md
07-automation-status.md
08-production-frame-map.md
09-exercise-review.md
11-slide-phase-template-map.md
13-wake-slide-traceability-matrix.md
14-wake-slide-process-review.md
wake-cluster-deck.html
frames/slide-*.png
apps/slide-agent/lessons/wake-cluster/final-deck.html
```

Role of the most important Wake files:

```text
01 = teaching truth
02 = narration truth
03 = slide architecture and on-screen truth
08 = production bridge between slide, script, and exercise
13 = slide-to-source traceability
14 = process-level review decision
07 = current automation runtime board
```

---

## 7. Current Project Flow Tree

```text
Project flow
├─ 1. Strategy and standards
│  ├─ business / positioning
│  └─ lesson architecture standard
├─ 2. Teaching method
│  ├─ lesson method
│  ├─ Nghia - Hinh - Dung
│  └─ slide method
├─ 3. Topic production
│  ├─ examples
│  ├─ skeleton
│  ├─ slide deck
│  ├─ script
│  ├─ frame map
│  └─ worksheet / quiz spec
├─ 4. Slide-system control
│  ├─ framework
│  ├─ templates
│  ├─ Vietnamese voice guide
│  ├─ QA
│  └─ acceptance process
├─ 5. Automation
│  ├─ runners 31-34
│  ├─ gated execution
│  ├─ audio SOP
│  └─ execution contract
└─ 6. Production output
   ├─ HTML deck
   ├─ PNG frames
   ├─ audio
   ├─ MP4
   └─ publish / review loop
```

---

## 8. Current Outdated-File Rule

Treat a process file as outdated if:

```text
- its main recommendation is already superseded by a newer canonical process file
- its state assumptions are no longer true in the current pipeline
- its decisions were folded into a newer review or acceptance file
```

Do not keep multiple near-duplicate process files active in the same lane.

---

## 9. Final Rule

When in doubt, follow this source-of-truth order:

```text
Project standard
-> teaching skeleton
-> slide-system rules
-> active topic lane files
-> automation status board
```
