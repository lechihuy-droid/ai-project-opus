# Assessment Runner Pack
**Status:** Active v1  
**Role:** Copy-paste prompt pack for worksheet, diagnostic quiz, and repurposing assets after lesson truth is locked

---

## 1. Purpose

Use this file when the main agent wants bounded subagents for:

```text
worksheet generation
diagnostic quiz generation
answer / trap QA
shorts / repurposing generation
```

This pack is for execution, not strategy.

---

## 2. When To Use

Use this pack when:

- the skeleton is already stable;
- slide/script architecture is already stable enough to extract practice and CTA assets;
- the lesson needs front-end learning assets that stay aligned with the teaching truth.

Do not use this pack to:

- redefine grammar meaning;
- invent a different lesson promise;
- generate random practice disconnected from the trap logic.

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
ASSESSMENT_SPEC = production/00-active/wake-cluster/06-worksheet-quiz-operating-spec.md
WORKSHEET_TARGET = production/worksheets/wake-cluster.md
QUIZ_TARGET = production/00-active/wake-cluster/wake-cluster-diagnostic-quiz.md
SHORTS_TARGET = production/shorts/wake-cluster.md
```

---

## 4. Spawn Order

Default order:

```text
1. Worksheet Builder
2. Diagnostic Quiz Builder
3. Answer / Trap QA
4. Shorts / Repurposing Builder
```

Parallel rule:

```text
Worksheet Builder and Diagnostic Quiz Builder may run in parallel
only if both are reading the same locked lesson truth.
```

---

## 5. Worksheet Builder Runner

**Role family:** `pedagogy`  
**Write mode:** `single_file_writer`  
**Write scope:** `WORKSHEET_TARGET`  
**Decision label:** `worksheet draft`

```text
Task:
Generate or revise the worksheet from the locked lesson truth.

Read:
- SKELETON
- ARCHITECTURE
- SLIDE_DECK
- SCRIPT
- ASSESSMENT_SPEC

Write scope:
- WORKSHEET_TARGET

Do not change:
- grammar scope
- lesson promise
- approved example roles

Rules:
- Keep worksheet aligned with Nghia - Hinh - Dung.
- Include clue map / comparison / progressive practice if the spec requires them.
- Reuse the lesson's approved examples instead of inventing unrelated ones.
- Keep explanation concise and learner-facing.

Output format:
- updated worksheet draft
- note any missing upstream truth that blocks worksheet quality
```

---

## 6. Diagnostic Quiz Builder Runner

**Role family:** `pedagogy`  
**Write mode:** `single_file_writer`  
**Write scope:** `QUIZ_TARGET`  
**Decision label:** `diagnostic quiz draft`

```text
Task:
Generate or revise the diagnostic quiz from the locked lesson truth.

Read:
- SKELETON
- ARCHITECTURE
- SCRIPT
- ASSESSMENT_SPEC

Write scope:
- QUIZ_TARGET

Do not change:
- grammar truth
- trap taxonomy logic already implied by the lesson

Rules:
- Wrong answers must be tempting for named reasons.
- Tag wrong answers when possible.
- Keep explanations tied to clue, logic, nuance, or form.
- Do not make the quiz harder than the lesson just to look advanced.

Output format:
- updated diagnostic quiz draft
- note trap distribution and any weak distractors
```

---

## 7. Answer / Trap QA Runner

**Role family:** `qa`  
**Write mode:** `read_only`  
**Decision label:** `assessment gate`

```text
Task:
Review worksheet and diagnostic quiz for pedagogy and trap quality.

Read:
- SKELETON
- SCRIPT
- ASSESSMENT_SPEC
- WORKSHEET_TARGET
- QUIZ_TARGET

Do not change:
- files directly

Rules:
- Check that practice aligns with the lesson promise.
- Check that wrong answers are plausible, not random.
- Check that explanations say why wrong answers look right.
- Check that the worksheet and quiz do not drift away from the approved examples and lesson logic.

Output format:
- Decision
- Findings
- Required patches
- Ready for learner-facing use: yes / no
```

---

## 8. Shorts / Repurposing Builder Runner

**Role family:** `curation`  
**Write mode:** `single_file_writer`  
**Write scope:** `SHORTS_TARGET`  
**Decision label:** `repurposing pack`

```text
Task:
Generate or revise the shorts / repurposing pack from the locked lesson.

Read:
- SKELETON
- SCRIPT
- ASSESSMENT_SPEC

Write scope:
- SHORTS_TARGET

Do not change:
- core lesson truth
- approved example roles

Rules:
- Each short should carry one insight only.
- Hook quickly.
- Prefer reusing one lesson scene cleanly over mixing many examples.
- Keep CTA snippets aligned with worksheet / diagnostic offer.

Output format:
- 3-5 short scripts or hooks
- worksheet CTA snippets
- note any angle that is shorts-only
```

---

## 9. Main Agent Merge Checklist

Before promoting outputs downstream, confirm:

```text
[ ] Worksheet matches lesson truth
[ ] Diagnostic quiz has named trap logic
[ ] Wrong answers are tempting for a reason
[ ] Shorts do not invent a different lesson
[ ] CTA wording stays aligned across worksheet / quiz / shorts
```
