# Standard Process - Teaching Lane MVP
**Status:** Active production workflow
**Project:** `opus-lucida`
**Date:** 2026-05-14
**Scope:** Public sample / single lesson video
**Current example:** `wake cluster`

---

## 0. Purpose

This file summarizes the process we just used to turn one grammar topic into a usable MVP teaching lane:

```text
topic
-> reviewed teaching skeleton
-> typed lesson/slide JSON
-> slide-agent render
-> slide/script sync
-> PNG frame export
-> worksheet
-> audio / render
```

The goal is to make the process repeatable for future JLPT N2 videos.

Project continuity should be tracked through:

```text
ai/status.md
ai/handoff-claude.md      # khi Claude là current owner
```

---

## 1. Core Rule

Governing standard:

```text
strategy/standards/01-lucida-lesson-architecture-standard.md
```

This workflow is the operational version of that standard for one MVP video.

Three output review gates:

```text
production/03-qa/criteria/00-three-output-review-gates.md
production/03-qa/criteria/01-skeleton-qa-criteria.md
production/03-qa/criteria/02-script-qa-criteria.md
production/03-qa/criteria/03-slide-qa-criteria.md
production/03-qa/criteria/04-slide-script-sync-criteria.md
production/03-qa/criteria/wake-slide-qa-criteria.md
```

The backbone flow is:

```text
Skeleton -> Typed JSON -> Slide Agent HTML -> PNG Frames -> Sync / Render -> Video
```

Language generation rule:

```text
Any artifact that creates learner-facing Vietnamese
must pass through:
teaching logic
-> learner-facing rewrite
-> banned-language self-check
-> final artifact
```

Use these rule files upstream, not only at review time:

```text
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

More precisely:

```text
Teaching skeleton = teaching truth
Output architecture = beat truth
Slide structure layer = visual teaching logic
Slide design layer = visual execution spec
Script = spoken teaching layer
Slide/script sync = production readiness truth
Video = production truth
```

Do not generate slide directly from topic alone.

Do not generate video from slide alone.

The correct dependency is:

```text
01-master-teaching-skeleton.md
-> 02-script.md
-> apps/slide-agent/lessons/<lane>/lesson.json
-> apps/slide-agent/lessons/<lane>/slide-plan.json
-> apps/slide-agent/lessons/<lane>/final-deck.html
-> production/00-active/<lane>/frames/slide-*.png
-> slide/script sync
-> recording / video
```

Do not use the outdated dependency:

```text
skeleton -> script -> slide -> video
```

That older flow makes slide design too reactive and often weakens the visual teaching structure.

### Two-layer operating model

Lucida production should separate:

```text
Front-end learner ecosystem
Back-end AI production engine
```

Front-end:

```text
video / shorts / worksheet / quiz / email feedback / course path
```

The learner-facing system may use AI for personalized explanation, but it should be rule-anchored:

```text
learner answer
-> pre-tagged trap type
-> approved explanation template / knowledge base
-> AI explains the tagged error in coach-like language
-> link to exact review asset
```

Do not ask learner-facing AI to infer grammar errors from scratch in the MVP.

Back-end:

```text
Codex / LLMs generate drafts from reviewed teaching truth
human teacher reviews Japanese accuracy and production decisions
```

Use AI aggressively backstage, but split work into prompts by asset.

---

## 2. Canonical Folder

For each active MVP video, create an active topic folder:

```text
production/00-active/<topic-slug>/
```

For the current MVP:

```text
production/00-active/wake-cluster/
```

It contains:

```text
README.md
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
05-<topic-slug>-mvp-output-architecture.md
06-worksheet-quiz-operating-spec.md
```

This is the canonical folder.

Older working folders may keep stubs or handoff files, but `production/00-active/<topic-slug>/` is the place to inspect when deciding what is active.

---

## 2.5 Reference Resources

Reference resources are not mandatory production steps.

They are reusable support layers that can be consulted when a production artifact needs better input.

### Example Intelligence Bank

Path:

```text
production/02-assets/example-intelligence/
```

Use when:

- skeleton examples feel stiff, generic, or textbook-like;
- slide examples need a more relatable situation;
- Vietnamese translations sound unnatural;
- a lesson needs topic candidates that fit the learner persona;
- shorts need more current / SNS-friendly angles.

Do not use it to:

- change grammar scope;
- override the skeleton;
- add unsupported lesson beats;
- force trends into a lesson where they do not fit.

Rule:

```text
Example bank = reference layer
Skeleton = teaching truth
Output architecture = beat truth
```

### Subagent System Architecture

Path:

```text
automation/workflows/30-subagent-governance.md
```

Use when:

- splitting one lesson into multiple bounded agent tasks;
- deciding whether a task should be research, pedagogy, localization, design, curation, or QA;
- assigning write scope and review scope before parallel work starts.

Rule:

```text
Main agent = orchestration and final merge
Subagents = bounded workers with explicit contracts
```

### Language Generation Runner Pack

Path:

```text
automation/workflows/30-language-generation-runner-pack.md
```

Use when:

- skeleton, slide, or script language feels too stiff;
- learner-facing phrasing must be generated at scale;
- CTA / quiz explanation wording needs the same voice contract;
- the team wants reusable copy-paste subagent handoffs for language work.

Rule:

```text
language generation should follow a shared contract,
not ad-hoc rewriting
```

### Example Runner Pack

Path:

```text
automation/workflows/31-runner-example-lane.md
```

Use when:

- the example lane needs a repeatable copy-paste execution pack;
- multiple subagents must stay aligned on input scope and output shape;
- the main agent wants fast reuse without rewriting prompts from scratch.

Rule:

```text
Runner pack = execution layer
Subagent architecture = governance layer
```

### Lesson Production Runner Pack

Path:

```text
automation/workflows/32-runner-lesson-production.md
```

Use when:

- the lesson already has a skeleton and architecture;
- the team wants bounded subagents for slide/script work;
- the goal is to align agent roles with the core production steps.

Rule:

```text
Use this pack for:
Skeleton QA
Slide Structure
Slide Design
Script Polish
Slide/Script Sync QA
```

### Assessment Runner Pack

Path:

```text
automation/workflows/33-runner-assessment.md
```

Use when:

- the lesson truth is stable enough to generate learner-facing assets;
- the team wants bounded subagents for worksheet, quiz, and shorts;
- the goal is to align agent roles with assessment and repurposing steps.

Rule:

```text
Use this pack for:
Worksheet Builder
Diagnostic Quiz Builder
Answer / Trap QA
Shorts / Repurposing Builder
```

### Production Runner Pack

Path:

```text
automation/workflows/34-runner-production.md
```

Use when:

- the lesson is already content-stable;
- the team is preparing TTS, recording, publish handoff, or maintenance logging.

Rule:

```text
Use this pack for:
TTS / Pause Pass
Recording Brief
Publish Handoff
Post-Video Decision Log
```

### Automation Gated Execution Flow

Path:

```text
automation/workflows/35-automation-gated-execution-flow.md
```

Use when:

- designing an automated end-to-end lesson pipeline;
- deciding which steps may run automatically and which must stop at review gates;
- standardizing retries and lane restarts.

Rule:

```text
runner packs define lane execution
35-automation-gated-execution-flow.md defines cross-lane automation behavior
35-automation-gated-execution-flow.md is also the canonical tool-to-artifact map
36-automation-flow-matrix.md is the quick execution table
37-automation-execution-contract.md defines lane run contract and status semantics
```

---

## 3. Process Overview

```text
Step 1  - Topic lock
Step 2  - Teaching skeleton draft
Step 3  - Teaching skeleton review
Step 4  - Output architecture lock
Step 5  - Slide structure layer generation
Step 6  - Slide structure QA
Step 7  - Slide design layer generation
Step 8  - Slide design QA
Step 9  - Script generation / polish
Step 10 - Script QA
Step 11 - Slide / script sync QA
Step 12 - Import / update active topic folder
Step 13 - Worksheet generation
Step 14 - Quiz / diagnostic generation
Step 15 - Shorts / repurposing generation
Step 16 - Recording brief
Step 17 - Video production
Step 18 - Post-video decision log
```

---

## 4. Step Details

### Step 1 - Topic Lock

**Goal:** Choose the topic and public angle.

**Output:**

```text
topic lock
```

**For wake cluster:**

```text
ã‚ã‘ã ãƒ»ã‚ã‘ã§ã¯ãªã„ãƒ»ã‚ã‘ãŒãªã„ãƒ»ã‚ã‘ã«ã¯ã„ã‹ãªã„
```

**Gate:**

- public hook exists;
- learner pain point is clear;
- topic can produce video + worksheet + shorts.
- opening angle can hit pain point in the first 3-5 seconds.

---

### Step 2 - Teaching Skeleton Draft

**Goal:** Create the teaching truth before writing script.

**Output:**

```text
01-master-teaching-skeleton.md
```

**Must include:**

- topic lock;
- audience;
- pain point;
- video promise;
- hook core;
- story core;
- big idea;
- `Nghia - Hinh - Dung`;
- common Vietnamese learner mistake;
- minimal pair / contrast;
- worked example plan;
- JLPT trap map;
- comparison core;
- `Dau hieu chon mau`;
- practice core;
- worksheet contract;
- shorts contract;
- review gates.

**Gate:**

- skeleton is rich enough to generate script, slide, worksheet, and shorts.
- skeleton includes enough metadata to generate tagged quiz answers and diagnostic feedback.

**Optional reference resource:**

When examples feel stiff, generic, or too textbook-like, reference:

```text
production/02-assets/example-intelligence/
```

Use the bank to find persona-fit situations, natural Vietnamese phrasing, and grammar-affordance candidates.

Do not treat the bank as a mandatory process step.

The skeleton remains the teaching truth.

The example bank is a reusable reference layer.

---

### Step 3 - Teaching Skeleton Review

**Goal:** Review skeleton before downstream generation.

**Criteria file:**

```text
production/03-qa/criteria/01-skeleton-qa-criteria.md
```

**Prompt file:**

```text
production/01-chatgpt-handoff/02-review-prompts/03-review-skeleton.md
```

**Output:**

```text
reviewed teaching skeleton
```

**Decision:**

- if review improves skeleton, use reviewed version as active skeleton;
- if review only raises minor issues, patch skeleton manually;
- do not move to script until skeleton is acceptable.

**Wake decision:**

We used ChatGPT-reviewed skeleton as the active skeleton.

---

### Step 4 - Output Architecture Lock

**Goal:** Lock the lesson beat map before generating slide or final script.

**Input:**

```text
01-master-teaching-skeleton.md
strategy/standards/01-lucida-lesson-architecture-standard.md
```

**Output:**

```text
05-<topic-slug>-mvp-output-architecture.md
```

**Must lock:**

```text
slide count
slide order
slide role
timing range
worked example location
diagnostic practice location
CTA location
MVP-specific decisions
```

**Rule:**

If script or slide later needs to add/remove/reorder major beats, update this architecture file first.

---

### Step 5 - Slide Structure Layer Generation

**Goal:** Build the slide structure layer from skeleton + output architecture.

This step decides what each slide teaches before deciding how it looks.

The structure layer answers:

```text
What does the learner need to understand / decide on this slide?
```

**Input:**

```text
01-master-teaching-skeleton.md
05-<topic-slug>-mvp-output-architecture.md
```

**Optional reference resource:**

```text
production/02-assets/example-intelligence/
```

Use only when a slide needs more relatable examples, more natural Vietnamese, or a better situation frame.

Do not let the example bank change grammar scope or slide order.

**Output:**

```text
03-slide-deck.md structure layer
```

**Skeleton-to-slide mapping rule:**

```text
Skeleton Hook Core         -> Opening / Hook Quiz
Skeleton Audience Promise  -> Topic intro / dual promise
Skeleton Story Core        -> Situation / context slide
Skeleton Big Idea          -> Framework / mantra slide
Skeleton Grammar Core      -> Grammar cards
Skeleton Comparison Core   -> Comparison boards
Skeleton Clue Map          -> Clue map / exam tool slide
Skeleton Practice Core     -> Worked example / diagnostic practice
Skeleton Worksheet Promise -> CTA / next action
```

**This layer owns:**

- source link to skeleton / architecture beat;
- slide role;
- on-screen text;
- teaching sequence;
- script beat;
- teaching check;
- exam / real-life transfer promise where relevant.

**This layer does not own:**

- final color palette;
- final typography;
- decorative illustration style;
- finished Canva/PPT layout.

**Required structure fields:**

```text
Source link:
Role:
On-screen:
Build / reveal:
Script beat:
Teaching check:
```

**Gate:**

Do not move to design layer if slide structure cannot be traced back to skeleton / output architecture.

---

### Step 6 - Slide Structure QA

**Goal:** Check whether the slide structure is pedagogically correct before design work.

**Criteria file:**

```text
production/03-qa/criteria/03-slide-qa-criteria.md
production/03-qa/criteria/wake-slide-qa-criteria.md
```

**Review dimensions:**

- source alignment;
- teaching accuracy;
- slide role clarity;
- on-screen text as teaching anchor;
- build / reveal logic;
- worked example / diagnostic logic;
- exam and real-life transfer promise.

**Decision rule:**

```text
Pass -> move to design layer
Pass with minor revisions -> patch directly, then move to design layer
Pass with revisions -> patch structure first
Block -> return to skeleton / output architecture
```

---

### Step 7 - Slide Design Layer Generation

**Goal:** Turn each teaching beat into a buildable visual slide.

This layer answers:

```text
How should the learner see the idea?
```

It must link to:

```text
production/02-assets/design-briefs/lucida-slide-design-direction.md
production/02-assets/design-briefs/lucida-n2-html-design-rules.md when generating HTML prototypes
03-slide-deck.md Slide Structure Layer
```

It owns:

- layout pattern;
- visual elements;
- hierarchy / emphasis;
- component choice;
- color / accent usage;
- motion / reveal notes;
- screenshot or board-readiness;
- reusable component naming.

It does not own:

- changing grammar meaning;
- changing slide order;
- adding new teaching beats;
- adding unsupported promises.

**Required design fields:**

```text
Design layer:
- Layout:
- Visual elements:
- Hierarchy / emphasis:
- Motion / reveal notes:
- Design-system link:
```

**Design rules:**

- design layer must trace back to the Lucida program design direction;
- Japanese examples should be visual anchors;
- rich slides may use layered reveal instead of removing useful information;
- avoid plain text-only slides unless intentionally used as a visual reset;
- design should make a learning operation visible: contrast, clue, speaker action, trap, form, real-life situation, exam decision, recap, or CTA.

---

### Step 8 - Slide Design QA

**Goal:** Check whether the design layer is buildable and aligned with Lucida program direction.

**Criteria file:**

```text
production/03-qa/criteria/03-slide-qa-criteria.md
production/02-assets/design-briefs/lucida-slide-design-direction.md
```

**Review dimensions:**

- cognitive load;
- visual / build readiness;
- program design alignment;
- reusable component fit;
- Japanese / Vietnamese hierarchy;
- motion / reveal readability.

**Decision rule:**

```text
Pass -> move to script polish / sync
Pass with minor revisions -> patch, then move on
Pass with revisions -> patch design layer first
Fail -> return to slide structure or design direction
```

---

### Step 9 - Script Generation / Polish

**Goal:** Generate or rewrite the spoken teaching layer from skeleton + output architecture + reviewed slide deck.

**Input:**

```text
01-master-teaching-skeleton.md
05-<topic-slug>-mvp-output-architecture.md
03-slide-deck.md
```

**Output:**

```text
02-script.md
```

**Rule:**

Script must be written slide-by-slide.

Each script block should correspond to the same slide number in `03-slide-deck.md`.

Do not add or remove slides from the script unless `05-<topic-slug>-mvp-output-architecture.md` is updated first.

**Bilingual audio lane rule:**

`02-script.md` may mix Vietnamese teaching narration and Japanese example sentences, but the writing must preserve enough structure for audio dispatch:

- Vietnamese narration is the `voice_vi` lane and is read by VieNeu.
- Long Japanese example sentences are the `voice_ja` lane and must stay in Japanese for VOICEVOX JP.
- Short grammar labels used inside Vietnamese narration may be written as learner-safe Vietnamese phonetics during the audio adapter step, e.g. `わけ` -> `quà kê`.
- Do not pre-convert full Japanese sentences into Vietnamese phonetics inside the canonical script.
- If a line is pronunciation-sensitive, keep the Japanese original and add TTS markers or production notes; do not replace the sentence with a phonetic approximation.

**YouTube opening rule:**

- The script should not start with a long greeting or channel introduction.
- The first 3-5 seconds should hit learner pain point, a real situation, or a contrast.
- Greeting/teacher intro may appear after the viewer understands why the topic matters.
- Good opening rhythm: pain point -> short example/contrast -> grammar logic twist -> video promise.

---

### Step 10 - Script QA

**Goal:** Check whether script is accurate, teachable, and aligned with the slide architecture.

**Criteria file:**

```text
production/03-qa/criteria/02-script-qa-criteria.md
```

**Review dimensions:**

- grammar accuracy;
- speaker action logic;
- script follows slide count and slide role;
- hook / flow / CTA;
- worked example think-aloud;
- audio/TTS readiness.

---

### Step 11 - Slide / Script Sync QA

**Goal:** Confirm slide and script are synchronized sibling outputs.

**Criteria file:**

```text
production/03-qa/criteria/04-slide-script-sync-criteria.md
```

**Must pass before audio/video:**

```text
slide count = script slide blocks
slide number = script block number
slide role = script role
on-screen text = explained by narration
reveal order = narration order
worked example logic = same in both files
diagnostic reveal = same in both files
CTA promise = same in both files
```

---

### Step 12 - Import / Update Active Topic Folder

**Goal:** Keep the canonical active topic folder current.

**Folder:**

```text
production/00-active/<topic-slug>/
```

**Files:**

```text
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
05-<topic-slug>-mvp-output-architecture.md
06-worksheet-quiz-operating-spec.md
README.md
```

**Rule:**

When in doubt, inspect the active topic folder first.

---

### Patch Slide Deck / Script When QA Finds Issues

**Goal:** Fix major/critical issues found in slide QA, script QA, or sync QA.

**Current wake QA findings:**

```text
1. Slide 14 should explicitly explain why わけだ is wrong for blank 2.
2. Slide 15 should avoid "đính chính nhẹ" as the main contrast label.
3. Script should be rewritten/polished slide-by-slide from the reviewed deck.
```

**Patch target:**

```text
production/00-active/wake-cluster/03-slide-deck.md
production/00-active/wake-cluster/02-script.md
```

**Gate:**

- no critical issue;
- no major issue blocking recording.

---

### Step 13 - Worksheet Generation

**Goal:** Create teaching-lane support asset.

**Input:**

```text
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
```

**Output:**

```text
production/worksheets/<topic>.md
```

**Worksheet must include:**

- quick review table;
- `Nghia - Hinh - Dung`;
- `Dau hieu chon mau`;
- JLPT-style practice;
- workplace situation practice;
- minimal pair drills;
- answer key;
- trap metadata;
- progressive fading.

**Rule:**

Worksheet is not just a summary. It must help learners choose the correct pattern.

Worksheet should support the front-end diagnostic loop:

```text
practice answer
-> trap tag
-> explanation
-> review recommendation
```

---

### Step 14 - Quiz / Diagnostic Generation

**Goal:** Create a rule-anchored quiz that can diagnose learner errors.

**Input:**

```text
01-master-teaching-skeleton.md
strategy/standards/01-lucida-lesson-architecture-standard.md
production/00-active/<topic-slug>/05-<topic-slug>-mvp-output-architecture.md
worksheet / quiz spec if available
```

**Output:**

```text
production/00-active/<topic-slug>/<topic>-diagnostic-quiz.md
```

**Must include:**

- 10-20 questions;
- correct answer;
- wrong answer explanations;
- trap tag for each wrong option;
- recommended review asset;
- email / feedback angle.

**Trap tag set:**

```text
Plausible
Prejudicial
Polyconceptual
Pragmatic
Peripheral
Form_error
Clue_missed
Speaker_action_missed
```

**Rule:**

AI may personalize explanation later, but the answer key and trap tags must be pre-authored and reviewed.

---

### Step 15 - Shorts / Repurposing Generation

**Goal:** Turn the long-form lesson into traffic and review assets.

**Output:**

```text
3-5 shorts scripts
thumbnail angles
worksheet CTA snippets
email review snippets
```

**Asset sources:**

- pain point / common mistake;
- minimal pair;
- one worked-example step;
- trap reveal;
- recap mantra.

---

### Step 16 - Recording Brief

**Goal:** Prepare to record video efficiently.

**Input:**

```text
02-script.md
03-slide-deck.md
```

**Output:**

```text
production/recording/<topic>-recording-brief.md
```

**Must include:**

- estimated timing by slide;
- emphasis points;
- where to pause;
- where to reveal answer;
- CTA timing;
- notes for editing.

---

### Step 17 - Video Production

**Goal:** Turn script + slide into recorded lesson.

**Input:**

```text
01-master-teaching-skeleton.md
02-script.md
03-slide-deck.md
recording brief
```

**Output:**

```text
video sample
```

**Video QA checks:**

- grammar accurate;
- pacing watchable;
- slide text readable;
- examples visible;
- CTA natural;
- no mismatch between narration and slide.

---

### Step 18 - Post-video Decision Log

**Goal:** Learn from the sample and improve process.

**Output:**

```text
analytics/decisions/<topic>-decision-log.md
```

**Record:**

- what worked;
- what was confusing;
- what should change in skeleton template;
- what should change in script prompt;
- what should change in slide QA;
- whether topic is reusable as lead magnet / paid lesson.

---

## 5. Standard Folder Pattern For New Topic

For a new topic:

```text
production/00-active/<topic-slug>/
â”œâ”€â”€ README.md
â”œâ”€â”€ 01-master-teaching-skeleton.md
â”œâ”€â”€ 02-script.md
â””â”€â”€ 03-slide-deck.md
```

For MVP lessons, also include:

```text
05-<topic-slug>-mvp-output-architecture.md
06-worksheet-quiz-operating-spec.md
```

Related outputs:

```text
production/worksheets/<topic-slug>.md
production/00-active/<topic-slug>/<topic-slug>-diagnostic-quiz.md
production/shorts/<topic-slug>.md
production/03-qa/reports/<topic-slug>-slide-qa.md
production/recording/<topic-slug>-recording-brief.md
analytics/decisions/<topic-slug>-decision-log.md
```

---

## 6. What We Learned From Wake Cluster

### Lesson 1 - Skeleton must be reviewed before script

If skeleton is weak, every downstream asset inherits the weakness.

### Lesson 2 - Output architecture prevents drift

Before final script or slide work, lock slide count, slide order, worked example location, diagnostic practice location, and CTA location.

### Lesson 3 - Slide and script are sibling outputs

Slide deck should not be merely derived from a finished script.

Script should not casually invent beats that the slide deck cannot support.

Both should come from skeleton + output architecture, then pass sync QA.

### Lesson 4 - Slide deck needs its own QA

A correct script does not automatically produce a good video slide.

Slide QA must catch:

- ambiguous mappings;
- too much text;
- answer reveal timing;
- visual intent mismatch.

### Lesson 5 - Spine folder reduces confusion

Moving the three backbone artifacts into one folder makes the production state easier to inspect.

### Lesson 6 - Worksheet should wait until slide/script sync

If worksheet is generated before script/slide stabilizes, it will need rework.

---

## 7. Wake Snapshot

```text
Topic lock: done
Teaching skeleton: reviewed and active
Output architecture: active
Slide structure layer: active
Slide design layer: pending
Slide structure/design QA criteria: updated
Script: active and synced to current approved examples
Slide-script sync: active
Worksheet: pending
Diagnostic quiz: pending
Recording brief: pending
Video: pending
Runner packs 21/22/23/24: active
```

Canonical files:

```text
production/00-active/wake-cluster/01-master-teaching-skeleton.md
production/00-active/wake-cluster/02-script.md
production/00-active/wake-cluster/03-slide-deck.md
production/00-active/wake-cluster/05-wake-mvp-output-architecture.md
production/00-active/wake-cluster/06-worksheet-quiz-operating-spec.md
```

This snapshot is a living example, not the source of truth for the project-wide architecture.

Keep Wake-specific production detail here only when it helps validate or refine the workflow.

---

## 8. Operational Rule For This File

Keep this file as:

```text
detailed lesson-production SOP
repeatable across topics
specific enough to execute
```

Do not let this file become:

```text
the top-level project architecture map
a backlog dump
a stale Wake-only diary
```

If the content is:

```text
project-wide and stable -> 10-project-architecture-map.md
lesson-specific and active -> production/00-active/<topic>/
subagent execution detail -> automation/workflows/31-34-*.md
```

When Wake status changes, update only the snapshot lines that still help validate the process.
