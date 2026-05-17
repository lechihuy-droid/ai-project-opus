# Example Subagent Runner Pack
**Status:** Active  
**Role:** Copy-paste prompt pack for running the example lane with bounded subagents

---

## 1. Purpose

Use this file when the main agent wants to run the example lane quickly without rewriting subagent prompts from scratch.

This is not a strategy document.

It is an execution pack.

---

## 2. When To Use

Use this pack when:

- a lesson needs new or improved examples;
- examples feel textbook-like or unnatural;
- Japanese and Vietnamese lines need separate naturalness passes;
- the main agent wants one primary spine, one practical expansion, and at most one trend-aware support example.

Do not use this pack to:

- redefine grammar truth;
- change lesson architecture;
- let subagents invent new lesson beats.

---

## 3. Shared Variables

Replace these once before running:

```text
TOPIC_SLUG = wake-cluster
GRAMMAR_NEED = four wake patterns with correction / constraint / conclusion / strong denial
PERSONA_SLICE = Vietnamese N3->N2 learner preparing for JLPT and practical use
DELIVERABLE_GOAL = one primary spine, one practical expansion, at most one trend-aware support example
INPUT_FILES =
- production/02-assets/example-intelligence/00-example-system-rules.md
- production/02-assets/example-intelligence/01-persona-map.md
- production/02-assets/example-intelligence/04-grammar-affordance-matrix.md
- production/02-assets/example-intelligence/05-natural-vietnamese-translation-rules.md
- production/02-assets/example-intelligence/06-example-qa-criteria.md
- production/02-assets/example-intelligence/08-label-taxonomy.md
- production/02-assets/example-intelligence/09-llm-retrieval-contract.md
- production/02-assets/example-intelligence/10-example-creation-process.md
TOPIC_FILES =
- production/02-assets/example-intelligence/wake/wake-example-candidates.md
- production/02-assets/example-intelligence/wake/wake-approved-examples.md
FINAL_WRITE_TARGET = production/02-assets/example-intelligence/wake/wake-approved-examples.md
```

---

## 4. Spawn Order

Default order:

```text
1. Situation Research
2. Japanese Naturalness
3. Vietnamese Naturalness
4. Pedagogy Fit
5. Curation
```

For a small task, the main agent may merge:

```text
Vietnamese Naturalness + Curation
```

---

## 5. Situation Research Runner

**Role family:** `research`  
**Write mode:** `read_only`  
**Decision label:** `scene candidates`

```text
Task:
Find 3-5 candidate scenes for TOPIC_SLUG.

Shared context:
- GRAMMAR_NEED
- PERSONA_SLICE
- DELIVERABLE_GOAL

Read:
INPUT_FILES
TOPIC_FILES

Rules:
- Start from the grammar action, not the grammar label alone.
- Return scenes before full sentences.
- Prioritize shelf life, persona fit, and emotional clarity.
- Do not optimize for meme value.
- Do not write full Japanese teaching lines unless needed as a rough seed.
- Do not change any files.

Output format:
- Scene ID
- Situation
- Who is speaking to whom
- Emotional tension
- Why this scene fits
- Risk

Decision target:
Recommend which scene should become:
- primary spine
- practical expansion
- optional trend-aware support
```

---

## 6. Japanese Naturalness Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `wake-example-candidates.md`  
**Decision label:** `jp natural lines`

```text
Task:
Write or revise Japanese lines so they sound like real utterances in the selected scenes.

Shared context:
- GRAMMAR_NEED
- PERSONA_SLICE
- DELIVERABLE_GOAL

Read:
INPUT_FILES
TOPIC_FILES

Write scope:
- production/02-assets/example-intelligence/wake/wake-example-candidates.md

Do not change:
- grammar truth
- lesson structure
- label taxonomy

Rules:
- Scene first, dialogue second.
- Keep register consistent inside each line.
- Do not write lines that exist only to showcase the grammar.
- If the line sounds textbook or over-explanatory, rewrite it.
- If unsure, prefer simpler spoken Japanese.

Output format:
- Scene ID
- Japanese natural line
- Register note
- Why this sounds natural
- Risk note if still imperfect
```

---

## 7. Vietnamese Naturalness Runner

**Role family:** `localization`  
**Write mode:** `single_file_writer`  
**Write scope:** `wake-example-candidates.md`  
**Decision label:** `vn public/support lines`

```text
Task:
Write a natural Vietnamese public-facing line and a separate support translation for the selected scenes.

Shared context:
- GRAMMAR_NEED
- PERSONA_SLICE
- DELIVERABLE_GOAL

Read:
INPUT_FILES
TOPIC_FILES

Write scope:
- production/02-assets/example-intelligence/wake/wake-example-candidates.md

Do not change:
- Japanese logic
- grammar truth
- lesson structure

Rules:
- Public-facing Vietnamese must sound spoken.
- Support translation may be more literal.
- Do not let the two lines collapse into near-duplicates.
- Avoid textbook Vietnamese and translated grammar wording.
- If a line feels written rather than spoken, rewrite it.

Output format:
- Scene ID
- Vietnamese public-facing line
- Vietnamese support translation
- Tone note
- Why the public line sounds natural
```

---

## 8. Pedagogy Fit Runner

**Role family:** `pedagogy`  
**Write mode:** `read_only`  
**Decision label:** `fit verdict`

```text
Task:
Review the example candidates for pedagogy fit.

Shared context:
- GRAMMAR_NEED
- PERSONA_SLICE
- DELIVERABLE_GOAL

Read:
INPUT_FILES
TOPIC_FILES

Rules:
- Reject examples that are interesting but weak for the grammar logic.
- Score grammar fit, exam transfer, real-life transfer, and trap value.
- Naturalness does not excuse weak grammar fit.
- Do not rewrite for style unless the issue directly affects teaching logic.
- Do not change any files.

Output format:
- Scene ID
- Grammar fit score
- Exam transfer score
- Real-life transfer score
- Trap / contrast value
- Verdict: primary / backup / support / shorts-only / reject
- Reason
```

---

## 9. Curation Runner

**Role family:** `curation`  
**Write mode:** `single_file_writer`  
**Write scope:** `wake-approved-examples.md`  
**Decision label:** `approved mix`

```text
Task:
Select the final example set for TOPIC_SLUG and store it in FINAL_WRITE_TARGET.

Shared context:
- GRAMMAR_NEED
- PERSONA_SLICE
- DELIVERABLE_GOAL

Read:
INPUT_FILES
TOPIC_FILES

Write scope:
- FINAL_WRITE_TARGET

Do not change:
- grammar truth
- lesson structure
- source criteria

Rules:
- Approve one primary spine.
- Approve one practical expansion if needed.
- Allow at most one trend-aware support example.
- Do not approve duplicates that do the same job.
- Move weak patterns to negative example notes if useful.

Output format:
- Primary spine
- Practical expansion
- Optional support example
- Why this mix is balanced
- What was rejected and why
```

---

## 10. Main Agent Merge Checklist

Before merging or applying the result into skeleton / slide / script, confirm:

```text
[ ] One primary spine only
[ ] One practical expansion only
[ ] At most one trend-aware support example
[ ] Japanese line sounds scene-true
[ ] Vietnamese public line sounds spoken
[ ] Support translation is not reused as narration
[ ] No duplicate example jobs
[ ] No subagent changed grammar truth
[ ] Approved set is stored in FINAL_WRITE_TARGET
```
