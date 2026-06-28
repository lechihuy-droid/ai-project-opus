# Context Resume - Wake Cluster MVP
**Status:** Legacy context log
**Date:** 2026-05-07
**Project:** `opus-lucida`
**Topic:** `wake cluster`

## Note

```text
This file is no longer the primary live handoff system.
Use:
- ai/status.md
- ai/handoff-claude.md (Claude)

Keep this file only as a legacy context log.
```

---

## 0. Latest Checkpoint - 2026-05-07

Current language-generation decision:

```text
Do not rely on late manual wording cleanup as the main method.
Lucida now has an upstream learner-facing language contract.
Any future skeleton / slide / script generation should read that contract before drafting.
```

New canonical language files:

```text
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
production/01-rules/slide-system/11-notebooklm-language-bank-starter-pack.md
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
automation/workflows/30-language-generation-runner-pack.md
```

Key language decisions now locked:

```text
Public 3-view method:
- Ý nghĩa
- Dạng
- Cách dùng

Default speaker-intent prompt:
- Ở câu này, người nói đang muốn nói gì?

Avoid as public defaults:
- Nghĩa - Hình - Dụng
- Meaning / Form / Usage
- Người nói đang làm gì?
```

Wake lane files updated in this round:

```text
production/00-active/wake-cluster/01-master-teaching-skeleton.md
production/00-active/wake-cluster/02-script.md
production/00-active/wake-cluster/03-slide-deck.md
production/00-active/wake-cluster/08-production-frame-map.md
production/00-active/wake-cluster/11-slide-phase-template-map.md
production/00-active/wake-cluster/16-wake-html-runtime-pilot-review-01-05.md
production/00-active/wake-cluster/18-language-runner-smoke-test.md
production/00-active/wake-cluster/wake-cluster-deck.html
production/00-active/wake-cluster/wake-cluster-deck-01-05.html
```

Runtime / slide-design status:

```text
Sprint 1 HTML exists and has been regenerated multiple times.
Slides 03-05 were upgraded beyond plain text:
- Slide 03 = promise split-card board
- Slide 04 = story board
- Slide 05 = method board

Whole-deck shell was unified so slides no longer split into two visual systems as strongly as before.
```

Language runner status:

```text
Smoke test already applied on Wake Slide 05.
Result: PASS
Reason:
- less system-like wording
- reusable public phrasing
- better spoken script tone
```

Best next action:

```text
Use automation/workflows/30-language-generation-runner-pack.md
to apply the same language-generation contract to:
1. one grammar card block
2. one CTA block

Then review whether the runner pack is strong enough to become the default bounded lane for all future lesson-generation work.
```

Do not reopen the old question of whether NotebookLM should be the core production path.

Current decision:

```text
NotebookLM = optional support layer
Repo-native pattern bank + generation spec + runner pack = core scalable path
```

---

## 0A. Older Checkpoint - 2026-05-01

Current MVP decision:

```text
Keep 17 slides.
Do not add a new worked-example slide.
Slide 14 = Worked Example Retrieval.
Slide 15 = Diagnostic Practice.
Slide 17 = CTA Worksheet / Diagnostic Quiz.
```

The research/review has already been applied into process/rule files. Do not re-discuss from scratch unless the user asks.

New/updated rule files:

```text
10-project-architecture-map.md
strategy/standards/01-lucida-lesson-architecture-standard.md
automation/workflows/20-lesson-production-sop.md
automation/workflows/35-automation-gated-execution-flow.md
automation/workflows/36-automation-flow-matrix.md
automation/workflows/37-automation-execution-contract.md
production/03-qa/criteria/wake-slide-qa-criteria.md
production/00-active/wake-cluster/05-wake-mvp-output-architecture.md
production/00-active/wake-cluster/06-worksheet-quiz-operating-spec.md
production/00-active/wake-cluster/07-automation-status.md
production/00-active/wake-cluster/08-production-frame-map.md
production/00-active/wake-cluster/09-exercise-review.md
production/02-assets/design-briefs/lucida-n2-html-design-rules.md
```

Important architectural decisions:

```text
Rule layer != MVP/output layer.
Rule files define reusable standards.
Output files define the concrete Wake MVP.
Script should not carry long QA rationale.
Script = shootable narration + on-screen text + speaker note.
Skeleton/architecture = why, rule, scope, accuracy, QA.
Slide deck spec = presentation truth.
Worksheet/quiz spec = diagnostic truth.
```

Applied to script/deck:

```text
02-script.md
- Removed long Final direction / terminology / scope notes.
- Added short Production Contract.
- Slide 14 upgraded to Worked Example Retrieval with think-aloud solving.
- Slide 15 upgraded to Diagnostic Practice with trap tag.
- Slide 17 upgraded to Worksheet + Diagnostic Quiz CTA.

03-slide-deck.md
- Slide 14/15/17 renamed and aligned with the same roles.
- Slide 14 visual intent = clue -> speaker action -> eliminate wrong option -> answer reveal.
- Slide 15 visual intent = diagnostic reveal with trap label.
- Slide 17 visual intent = diagnosis plus practice, not generic PDF CTA.
```

Current best next action:

```text
Review 02-script.md end-to-end for natural spoken Vietnamese and pacing.
Then sync any wording changes back into 03-slide-deck.md.
After that, generate the actual Wake worksheet + diagnostic quiz from 06-worksheet-quiz-operating-spec.md.
```

TODO later:

```text
Example bank:
- add label blocks back into the root situation banks
- so LLM/subagents can retrieve directly from evergreen / seasonal source files, not only lesson-specific approved files

Agent / process architecture:
- runner packs now exist for:
  - 31-runner-example-lane.md
  - 32-runner-lesson-production.md
  - 33-runner-assessment.md
  - 34-runner-production.md
- automation docs now exist for:
  - 35-automation-gated-execution-flow.md
  - 36-automation-flow-matrix.md
  - 37-automation-execution-contract.md
- active status board:
  - production/00-active/wake-cluster/07-automation-status.md
- frame / exercise bridge:
  - production/00-active/wake-cluster/08-production-frame-map.md
  - production/00-active/wake-cluster/09-exercise-review.md
- design generation:
  - use production/02-assets/design-briefs/lucida-n2-html-design-rules.md when asking Gemini / Claude to generate HTML prototypes
- video MVP frame rule:
  - use one PNG per logical slide for MVP assembly
  - keep reveal states in 08-production-frame-map.md for design/script/exercise logic
  - later upgrade generator / screenshot / assembly if true multi-frame reveal timing is needed
- slide MVP implementation rule:
  - do not build deck_generator.py first unless needed
  - for Wake MVP, prefer hardcoded deck data + reusable HTML layouts
  - create / refine deck-data.js and wake-cluster-deck.html first
  - once 17-slide MVP works, abstract into Jinja/generator for future lessons
- when scaling beyond Wake, add dedicated QA criteria files for:
  - worksheet QA
  - diagnostic quiz QA
  - recording / publish QA
- then map those criteria back into the runner packs so assessment and production lanes are as strict as skeleton / slide / script lanes
```

Do not start building Canva/HTML/PPT yet unless user explicitly switches back to visual production. The current focus is lesson quality, script, slide text, worksheet/quiz.

---

## 1. Current Direction

Public/sample video dau tien:

```text
わけだ・わけではない・わけがない・わけにはいかない
```

Internal test case / video 2 candidate:

```text
kai / gai / temade
```

Core product direction:

```text
N2 Grammar De Hieu - 4 Tuan Nen Tang
```

Lucida positioning:

> Khong chi hoc nghia. Hoc cach dung dung.

---

## 2. Active Source Files

Use these as the current backbone:

```text
production/00-active/wake-cluster/01-master-teaching-skeleton.md
production/00-active/wake-cluster/02-script.md
production/00-active/wake-cluster/03-slide-deck.md
production/00-active/wake-cluster/05-wake-mvp-output-architecture.md
production/00-active/wake-cluster/06-worksheet-quiz-operating-spec.md
```

Brand and process rules:

```text
strategy/standards/01-lucida-lesson-architecture-standard.md
strategy/positioning/02-brand-voice.md
automation/workflows/20-lesson-production-sop.md
production/03-qa/criteria/wake-slide-qa-criteria.md
```

---

## 3. Biggest Current Problem

The MVP has good structure and promising visuals, but the content risks feeling:

- too definition-heavy;
- too flat / monotonous;
- not enough like a real teacher solving JLPT questions;
- too dependent on Gemini image generation;
- hard to voice naturally with TTS if Japanese pronunciation is weak.

The next pass should prioritize teaching quality and voice, not more visual polish.

---

## 4. New Script / Teaching Rule

The script must sound like:

> A Japanese coach with teaching experience, N1, and real Japan work/life experience, sitting next to the learner and helping them solve N2 logically.

Do not write like a textbook.

Every grammar point should be explained as:

```text
Nguoi noi dang lam gi?
-> Nghia cot loi
-> Hinh thuc / cau truc
-> Cach dung / sac thai
-> Tin hieu chon dap an
-> Bay de nham
```

Core mantra:

```text
Dung nhin chu wake.
Hay hoi: nguoi noi dang lam gi?
```

---

## 5. Wake Cluster Teaching Decisions

Fast mapping:

```text
わけではない = dang dinh chinh / sua hieu nham
わけがない = dang bac bo kha nang manh
わけにはいかない = bi rang buoc nen khong the lam
わけだ = di den ket luan hop ly
```

Slide-friendly catchphrases:

```text
わけではない -> khong phai vay dau
わけがない -> lam gi co chuyen
わけにはいかない -> bi troi nen khong the
わけだ -> thao nao
```

Exam-signal layer:

```text
わけではない -> 誤解 / そういう意味じゃない / 別に / phu dinh mem
わけがない -> 絶対 / ありえない / そんなこと / khong doi nao
わけにはいかない -> 締切 / 責任 / ルール / 立場 / 社会人として
わけだ -> co du kien truoc / ly do -> ket luan / thao nao / hoa ra
```

---

## 6. YouTube Opening Rule

Do not start with a long greeting or channel intro.

3-5 seconds first:

```text
Ban da bao gio gap cam giac nay chua?

Hoc den N2 roi,
nhin chu nao cung quen,
nhung khi phai chon dap an thi lai phan van.
```

Then show the twist:

```text
Cung la wake,
nhung moi mau lai co mot mach logic khac nhau.
```

Greeting/teacher intro may come after the hook, not as the first sentence.

---

## 7. Gemini / Canva Decision

Gemini is useful, but quota and editability are constraints.

New production rule:

```text
Gemini = optional visual concept / hero image only
HTML deck = reusable editable production template
Markdown slide spec = content truth
Playwright screenshot = frame export
```

Do not generate every slide as a fresh Gemini image.

Current MVP slide build path:

```text
03-slide-deck.md
-> deck_generator.py (Jinja2)
-> wake-cluster-deck.html
-> screenshot_slides.py (Playwright)
-> frames/slide-*.png
-> pipeline.py
-> audio + assembly -> MP4
```

Step 4.0 Slide Build is now `AUTO_RUN`, not Canva/manual.

Reveal milestones remain valid, but MVP assembly should export one PNG per logical slide.

Do not implement multi-frame reveal timing yet.

Future upgrade:

```text
flatten reveal states into multiple production frames
or upgrade assembly_agent.py to support multiple visual frames inside one audio segment
```

Reusable HTML component groups needed:

- hook contrast;
- quiz before reveal;
- answer reveal;
- 4-logic map;
- story context;
- Nghia - Hinh - Dung;
- grammar card;
- exam signal card;
- comparison map;
- practice question;
- recap;
- CTA worksheet.

---

## 8. TTS / Voice Decision

Risk:

- TTS may read Japanese badly;
- bilingual Vietnamese + Japanese can sound robotic;
- voice may feel stiff like Google Translate.

Needed pipeline:

```text
script
-> voice script adapter
-> pronunciation-safe Japanese
-> TTS generation
-> audio QA
-> timing map
-> video assembly
```

Decision rule:

- If one multilingual voice reads Japanese naturally enough, use one voice for MVP.
- If Japanese pronunciation is bad, split into `voice_vi` and `voice_ja`.
- If both sound stiff, use TTS only for draft timing and record human voice for final sample.

---

## 9. Immediate Next Actions

Recommended next order:

1. Human-review the regenerated MVP frames from `production/00-active/wake-cluster/frames/slide-01.png` to `slide-17.png`.
2. If frame review passes, lock the current 17 frames for audio.
3. If frame review requests changes, classify impact using `05-slide-change-impact-policy.md` before patching.
4. Keep MVP rule: one logical slide = one PNG frame = one audio segment.
5. Generate or prepare audio from `02-script.md`, then assemble with the 17 exported frames.
6. Generate Wake worksheet and diagnostic quiz after slide/script sync remains stable.

New canonical slide system:

```text
production/01-rules/slide-system/01-slide-architecture-framework.md
production/01-rules/slide-system/02-slide-template-library.md
production/01-rules/slide-system/03-slide-design-production-rules.md
production/01-rules/slide-system/04-slide-framework-qa-checklist.md
production/01-rules/slide-system/05-slide-change-impact-policy.md
```

Approved slide flow:

```text
Skeleton
-> Slide Architecture
-> Slide Template / Wireframe
-> Script
-> Slide Design
-> Audio / Video
```

Wake MVP traceability:

```text
production/00-active/wake-cluster/13-wake-slide-traceability-matrix.md
```

Latest frame state:

```text
17/17 frames exported successfully after patching Slide 03, Slides 06-09, Slide 13, and Slide 14.
Decision: ready for human visual review before audio lock.
```

Latest slide MVP state:

```text
Selected design source:
production/02-assets/design-prototypes/jlpt_n2_slide_engine_apple_keynote_manrope_final.html

Production deck:
production/00-active/wake-cluster/wake-cluster-deck.html

Rendered frames:
production/00-active/wake-cluster/frames/slide-01.png ... slide-17.png
```

Note:

```text
The selected design source uses section.screen, so it is not used directly.
The production deck keeps deck-stage compatibility for screenshot_slides.py.
```

---

## 10. Do Not Forget

- Skeleton = teaching truth.
- Script = narration truth.
- Slide deck = presentation truth.
- Video = production truth.

Flow:

```text
01-master-teaching-skeleton.md
-> 02-script.md
-> 03-slide-deck.md
-> wake-cluster-deck.html
-> frames/slide-*.png
-> audio
-> video assembly
```

If script changes meaningfully, sync slide deck and worksheet.
