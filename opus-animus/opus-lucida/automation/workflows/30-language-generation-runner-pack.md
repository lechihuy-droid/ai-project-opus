# Language Generation Runner Pack
**Status:** Active v0.1  
**Date:** 2026-05-07  
**Role:** Copy-paste runner pack for agents/subagents that generate learner-facing Vietnamese for skeletons, slides, scripts, CTA copy, and quiz explanation

---

## 1. Purpose

Use this runner pack when the main agent wants to generate:

```text
public phrasing
slide copy
script copy
trap wording
CTA wording
```

without letting system/framework language leak into learner-facing output.

This pack is not for grammar truth discovery.

It is for:

```text
language shaping
public phrasing generation
learner-facing rewrite
```

---

## 2. When To Use

Use this pack when:

```text
- skeleton logic is already known
- slide structure exists or is being drafted
- script needs natural Vietnamese
- CTA or quiz explanation feels too stiff
- output must be reusable at scale
```

Do not use this pack to:

```text
- redefine lesson scope
- change grammar truth
- invent new lesson beats
- replace architecture review
```

---

## 3. Shared Variables

Replace these once before running:

```text
TOPIC_SLUG = wake-cluster
TOPIC_FOLDER = production/00-active/wake-cluster/
SKELETON = production/00-active/wake-cluster/01-master-teaching-skeleton.md
SLIDE_DECK = production/00-active/wake-cluster/03-slide-deck.md
SCRIPT = production/00-active/wake-cluster/02-script.md
LANG_STYLE = production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
LANG_AUDIT = production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
LANG_SPEC = production/01-rules/slide-system/09-learner-facing-generation-spec.md
LANG_DICT = production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
LANG_PATTERN_BANK = production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

---

## 4. Mandatory Language Contract

Every runner below inherits this contract.

```text
Read:
- LANG_STYLE
- LANG_AUDIT
- LANG_SPEC
- LANG_DICT
- LANG_PATTERN_BANK

Do:
- separate logic note from public phrasing
- use spoken-teacher Vietnamese
- prefer reusable Lucida phrasing patterns
- rewrite banned wording before returning output

Do not:
- leave internal framework labels in public-facing text
- use Meaning / Form / Usage publicly
- use Nghĩa - Hình - Dụng publicly
- use Người nói đang làm gì? as the default learner prompt

If the 3-view method appears publicly, use:
- Ý nghĩa
- Dạng
- Cách dùng
```

---

## 5. Spawn Order

Recommended order:

```text
1. Skeleton Public Phrasing
2. Slide Copy Builder
3. Script Spoken Layer
4. CTA / Quiz Copy Builder
5. Language QA
```

If the task is smaller:

```text
Slide Copy Builder + Script Spoken Layer
```

may be run after structure is stable.

---

## 6. Skeleton Public Phrasing Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `SKELETON`  
**Decision label:** `public phrasing layer`

```text
Task:
Revise the skeleton so key teaching moves include natural learner-facing public phrasing,
while preserving grammar truth and architecture logic.

Read:
- SKELETON
- LANG_STYLE
- LANG_AUDIT
- LANG_SPEC
- LANG_DICT
- LANG_PATTERN_BANK

Write scope:
- SKELETON

Do not change:
- grammar truth
- lesson scope
- required comparisons
- worked example logic

Rules:
- Keep technical logic if needed,
  but add or rewrite public-facing phrasing so downstream slide/script generation has natural language to inherit.
- Rewrite any banned learner-facing phrasing.
- If a method prompt appears, use current Lucida defaults.

Output format:
- updated skeleton
- short note listing which public phrasing blocks were improved
```

---

## 7. Slide Copy Builder Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `SLIDE_DECK`  
**Decision label:** `on-screen language layer`

```text
Task:
Write or revise on-screen Vietnamese so it sounds natural, scannable, and learner-facing.

Read:
- SKELETON
- SLIDE_DECK
- LANG_STYLE
- LANG_AUDIT
- LANG_SPEC
- LANG_DICT
- LANG_PATTERN_BANK

Write scope:
- SLIDE_DECK

Do not change:
- slide count if already locked
- grammar truth
- architecture beat order
- template function

Rules:
- On-screen text must be short and easy to scan.
- Use learner-facing labels only.
- If a line sounds like metadata or framework naming, rewrite it.
- Prefer phrase-bank defaults where they fit.
- Keep Japanese anchored and readable.

Output format:
- updated on-screen text in SLIDE_DECK
- short note listing any lines that still feel borderline and why
```

---

## 8. Script Spoken Layer Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `SCRIPT`  
**Decision label:** `spoken-teacher layer`

```text
Task:
Write or revise the spoken Vietnamese script so it sounds like a real N2 teacher explaining once, clearly.

Read:
- SKELETON
- SLIDE_DECK
- SCRIPT
- LANG_STYLE
- LANG_AUDIT
- LANG_SPEC
- LANG_DICT
- LANG_PATTERN_BANK

Write scope:
- SCRIPT

Do not change:
- lesson scope
- slide order
- grammar truth
- architecture logic

Rules:
- Speak like a teacher, not like a document.
- Add thinking guidance, not just restatement of slide text.
- Use natural comparison language and trap-warning language.
- If a line is grammatically correct but sounds written, rewrite it.
- Prefer short, spoken clauses over abstract labels.

Output format:
- updated SCRIPT
- short note listing any lines where wording had to be heavily rewritten
```

---

## 9. CTA / Quiz Copy Builder Runner

**Role family:** `localization`  
**Write mode:** `scoped_multi_file_writer`  
**Write scope:** `SLIDE_DECK`, `SCRIPT`, quiz/worksheet explanation blocks when present  
**Decision label:** `study-guidance layer`

```text
Task:
Write or revise CTA language and quiz explanation language so it feels like study guidance,
not marketing or metadata.

Read:
- SLIDE_DECK
- SCRIPT
- LANG_STYLE
- LANG_AUDIT
- LANG_SPEC
- LANG_DICT
- LANG_PATTERN_BANK

Write scope:
- learner-facing CTA / quiz explanation blocks only

Do not change:
- offer scope
- worksheet truth
- assessment logic

Rules:
- CTA should read like the next study step.
- Quiz explanation should sound like teacher feedback, not answer-key notes.
- Use phrase-bank defaults for trap warning and study guidance.

Output format:
- updated CTA / quiz wording
- short note listing key changes
```

---

## 10. Language QA Runner

**Role family:** `qa`  
**Write mode:** `read_only`  
**Decision label:** `language gate`

```text
Task:
Audit learner-facing Vietnamese for naturalness, banned wording, and Lucida-style consistency.

Read:
- SKELETON
- SLIDE_DECK
- SCRIPT
- LANG_STYLE
- LANG_AUDIT
- LANG_SPEC
- LANG_DICT
- LANG_PATTERN_BANK

Do not change:
- files directly

Rules:
- Findings first.
- Flag banned wording that survived.
- Flag lines that still sound too system-like or too written.
- Prioritize on-screen text and spoken script over internal notes.

Output format:
- Decision: PASS / REVISE / BLOCK
- Findings
- Quick rewrite direction
- Ready for downstream generation: yes / no
```

---

## 11. Copy-Paste Handoff Template

Use this exact block when spawning an agent:

```text
Task:
<insert runner task>

Read:
- <topic file 1>
- <topic file 2>
- production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
- production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
- production/01-rules/slide-system/09-learner-facing-generation-spec.md
- production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
- production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md

Write scope:
<insert write scope>

Do not change:
- grammar truth
- lesson scope
- architecture logic

Language contract:
- separate logic note from public phrasing
- use spoken-teacher Vietnamese
- rewrite banned wording before returning output
- if the 3-view method appears publicly, use Ý nghĩa - Dạng - Cách dùng

Output:
<insert output format>
```

---

## 12. Main Agent Merge Checklist

Before accepting output from a language-generation runner:

```text
[ ] banned wording removed
[ ] on-screen lines are scan-friendly
[ ] script sounds spoken
[ ] CTA sounds like study guidance
[ ] 3-view labels are correct
[ ] no obvious system-language leakage remains
```

---

## 13. Update Rule

If a new recurring language task appears:

```text
1. add a new runner here
2. link it to the current language contract
3. update the pattern bank or dictionary if needed
```
