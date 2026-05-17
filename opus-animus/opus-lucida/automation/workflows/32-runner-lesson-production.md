# Lesson Production Runner Pack
**Status:** Active v1  
**Role:** Copy-paste prompt pack for core lesson-production steps after topic and example truth are locked

---

## 1. Purpose

Use this file when the main agent wants bounded subagents for the core production path:

```text
skeleton QA
slide structure
slide design
script polish
slide/script sync QA
```

This pack is for execution, not strategy.

---

## 2. When To Use

Use this pack when:

- the lesson skeleton already exists;
- output architecture is already locked or near-locked;
- the team wants repeatable subagent handoffs for slide/script work;
- the example bank or approved examples are already available when needed.

Do not use this pack to:

- redefine grammar truth from scratch;
- replace the main agent as final owner;
- let downstream assets change lesson scope casually.

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
DESIGN_DIRECTION = production/02-assets/design-briefs/lucida-slide-design-direction.md
SKELETON_QA = production/03-qa/criteria/01-skeleton-qa-criteria.md
SLIDE_QA = production/03-qa/criteria/03-slide-qa-criteria.md
SCRIPT_QA = production/03-qa/criteria/02-script-qa-criteria.md
SYNC_QA = production/03-qa/criteria/04-slide-script-sync-criteria.md
TOPIC_SLIDE_QA = production/03-qa/criteria/wake-slide-qa-criteria.md
SLIDE_ARCHITECTURE_RULE = production/01-rules/slide-system/01-slide-architecture-framework.md
SLIDE_TEMPLATE_LIBRARY = production/01-rules/slide-system/02-slide-template-library.md
SLIDE_PRODUCTION_RULES = production/01-rules/slide-system/03-slide-design-production-rules.md
SLIDE_FRAMEWORK_QA = production/01-rules/slide-system/04-slide-framework-qa-checklist.md
```

---

## 4. Spawn Order

Default order:

```text
1. Skeleton QA
2. Slide Structure
3. Slide Design
4. Script Polish
5. Slide/Script Sync QA
```

Parallel rule:

```text
Do not run Slide Design and Script Polish in parallel unless
Slide Structure is already locked.
```

---

## 5. Skeleton QA Runner

**Role family:** `qa`  
**Write mode:** `read_only`  
**Decision label:** `skeleton gate`

```text
Task:
Review the lesson skeleton for production readiness.

Read:
- SKELETON
- ARCHITECTURE
- SKELETON_QA

Do not change:
- files
- topic scope

Rules:
- Review findings first.
- Focus on truth, grammar logic, learner promise, examples, worked example plan, and diagnostic path.
- Flag blockers clearly.

Output format:
- Decision
- Top findings
- Required patches
- Production note
```

---

## 6. Slide Structure Runner

**Role family:** `pedagogy`  
**Write mode:** `single_file_writer`  
**Write scope:** `SLIDE_DECK`  
**Decision label:** `structure layer`

```text
Task:
Draft or revise the Slide Structure Layer from the locked skeleton and architecture.

Read:
- SKELETON
- ARCHITECTURE
- SLIDE_ARCHITECTURE_RULE
- SLIDE_TEMPLATE_LIBRARY
- SLIDE_FRAMEWORK_QA
- SLIDE_QA
- TOPIC_SLIDE_QA when available

Write scope:
- SLIDE_DECK

Do not change:
- grammar scope
- slide count if already locked
- architecture beat order

Rules:
- Every slide must have:
  Source link
  Phase
  Template
  Role
  On-screen
  Build / reveal
  Script beat
  Teaching check
- Use skeleton-to-slide mapping.
- If a slide cannot link to the skeleton, either remove it or flag that the skeleton must be updated first.
- Keep on-screen text as anchor, not narration.

Output format:
- updated Slide Structure Layer only
- note any unresolved structure risks
```

---

## 7. Slide Design Runner

**Role family:** `design`  
**Write mode:** `single_file_writer`  
**Write scope:** `SLIDE_DECK`  
**Decision label:** `design layer`

```text
Task:
Draft or revise the Design Layer for a locked slide structure.

Read:
- SLIDE_DECK
- DESIGN_DIRECTION
- SLIDE_TEMPLATE_LIBRARY
- SLIDE_PRODUCTION_RULES
- SLIDE_FRAMEWORK_QA
- SLIDE_QA
- TOPIC_SLIDE_QA when available

Write scope:
- SLIDE_DECK

Do not change:
- grammar meaning
- lesson promise
- slide order
- structure-layer teaching logic

Rules:
- Every slide should specify:
  Layout
  Visual elements
  Hierarchy / emphasis
  Motion / reveal notes
  Design-system link
- Public-facing headings should be learner-facing Vietnamese, not internal English production labels.
- Quiz slides must respect the current MVP rule: static before/after state unless multi-frame reveal timing has been implemented.
- Design should clarify teaching, not rescue weak structure.
- Japanese should remain visually legible and anchoring.

Output format:
- updated Design Layer only
- note any structure issues discovered during design
```

---

## 8. Script Polish Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `SCRIPT`  
**Decision label:** `spoken layer`

```text
Task:
Write or polish the script from the locked skeleton and slide deck.

Read:
- SKELETON
- ARCHITECTURE
- SLIDE_DECK
- SLIDE_ARCHITECTURE_RULE
- SLIDE_TEMPLATE_LIBRARY
- SCRIPT_QA

Write scope:
- SCRIPT

Do not change:
- slide count
- lesson scope
- major beat order
- slide logic

Rules:
- Keep one numbered block per slide.
- Write script from the slide architecture and template role, not as an independent essay.
- Use learner-facing terminology only.
- Keep spoken Vietnamese natural.
- Respect approved example roles:
  scene spine
  practical expansion
  optional comparison
  form micro-example
- Add or maintain pause/TTS markers without changing meaning.

Output format:
- updated SCRIPT
- note any unresolved naturalness or sync risks
```

---

## 9. Slide / Script Sync QA Runner

**Role family:** `qa`  
**Write mode:** `read_only`  
**Decision label:** `sync gate`

```text
Task:
Review slide/script synchronization after slide and script work is complete.

Read:
- SKELETON
- ARCHITECTURE
- SLIDE_DECK
- SCRIPT
- SYNC_QA

Do not change:
- files directly

Rules:
- Check slide count and numbering.
- Check role sync.
- Check on-screen text vs narration.
- Check reveal order vs spoken order.
- Check CTA sync.
- Check parser/TTS readiness when relevant.

Output format:
- Decision
- Findings
- Required patches
- Ready for recording: yes / no
```

---

## 10. Main Agent Merge Checklist

Before promoting outputs downstream, confirm:

```text
[ ] Skeleton has passed or is patch-safe
[ ] Slide Structure Layer is locked
[ ] Design Layer does not alter meaning
[ ] Script follows slide architecture
[ ] Example roles remain clear
[ ] Sync QA has no blocker
[ ] Recording/TTS notes are usable
```
