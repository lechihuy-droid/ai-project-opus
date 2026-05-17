# NotebookLM Language Bank Starter Pack
**Status:** Active v0.1  
**Date:** 2026-05-07  
**Scope:** Use NotebookLM as a support layer to mine natural Vietnamese explanation patterns for Lucida JLPT N2 production  
**Role:** Exact upload plan + prompt pack for building reusable language banks from NotebookLM outputs

---

## 1. Purpose

Use this file when Lucida needs better learner-facing Vietnamese at scale,
and we want NotebookLM to help mine:

```text
teacher-like phrasing
comparison wording
trap-warning wording
worked-example wording
CTA study guidance
```

NotebookLM is not the final owner of truth.

Use it as:

```text
source mining
phrase extraction
pattern grouping
rewrite assistance
```

Do not use it as:

```text
final canonical wording owner
final script truth
final slide truth
```

Canonical truth still lives in Lucida repo files.

---

## 2. Recommended Notebook Name

Create one notebook:

```text
Lucida VN N2 Language Bank
```

Optional later notebooks:

```text
Lucida Contrast Wording Bank
Lucida CTA And Study Guidance Bank
Lucida Worked Example Voice Bank
```

Start with one notebook first.

---

## 3. Upload Strategy

Do not upload everything at once.

Use this order:

```text
Phase A. Lucida rule sources
Phase B. One strong lesson lane
Phase C. Good / bad contrast examples
Phase D. Optional external/reference teaching material
```

---

## 4. Phase A - Upload These Lucida Rule Files First

Upload these first:

```text
production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
production/01-rules/slide-system/09-learner-facing-generation-spec.md
production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
framework/lesson-method/02-framework-lesson-method.md
framework/grammar-3-view/03-framework-3-view-grammar.md
```

Why:

```text
NotebookLM needs Lucida's tone contract before it starts mining phrases.
```

---

## 5. Phase B - Upload These Wake Files Next

Upload these next:

```text
production/00-active/wake-cluster/01-master-teaching-skeleton.md
production/00-active/wake-cluster/02-script.md
production/00-active/wake-cluster/03-slide-deck.md
production/00-active/wake-cluster/14-wake-slide-process-review.md
production/00-active/wake-cluster/16-wake-html-runtime-pilot-review-01-05.md
```

Why:

```text
Wake is the current best active sample for Lucida phrasing and slide language direction.
```

---

## 6. Phase C - Upload Good / Bad Contrast Material

If available, add:

```text
production/01-chatgpt-handoff/03-raw-returns/scripts/wake-script-chatgpt-v1.md
lessons/samples/05-sample-internal-test-case.md
production/03-qa/criteria/wake-slide-qa-criteria.md
production/03-qa/reports/01-review-sample-video-content.md
```

Use this phase only after Phase A and B.

Why:

```text
NotebookLM can compare rougher language against current Lucida rules and stronger drafts.
```

---

## 7. Optional External / Reference Material

Only add this if you already trust the source.

Good candidates:

```text
- teacher notes you personally like
- Vietnamese N2 explanation transcripts
- concise JLPT explanation docs with natural tone
```

Avoid:

```text
- generic SEO blog posts
- machine-translated grammar summaries
- random Facebook notes without quality control
```

---

## 8. Do Not Upload These First

Avoid starting with:

```text
full research dumps
archive folders
low-quality brainstorm notes
old process docs that were superseded
```

Why:

```text
They dilute the language signal and make NotebookLM summarize the wrong register.
```

---

## 9. Exact First Upload Set

If you want the shortest working start,
upload only these 10 files first:

```text
1. production/01-rules/slide-system/07-vietnamese-explanation-style-guide.md
2. production/01-rules/slide-system/08-learner-facing-language-audit-checklist.md
3. production/01-rules/slide-system/09-learner-facing-generation-spec.md
4. production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
5. framework/lesson-method/02-framework-lesson-method.md
6. framework/grammar-3-view/03-framework-3-view-grammar.md
7. production/00-active/wake-cluster/01-master-teaching-skeleton.md
8. production/00-active/wake-cluster/02-script.md
9. production/00-active/wake-cluster/03-slide-deck.md
10. production/00-active/wake-cluster/16-wake-html-runtime-pilot-review-01-05.md
```

That is enough for version 1.

---

## 10. Prompt Pack

Use these prompts in order.

### Prompt 1 - Tone extraction

```text
From these sources, extract the most natural Vietnamese teaching lines that sound like a real JLPT N2 teacher. Group them by function, not by source file.
```

### Prompt 2 - Hook bank

```text
Find the strongest Vietnamese phrasing patterns for:
1. opening a learner pain point
2. introducing a confusing contrast
3. making the learner want to keep watching

Return them as reusable phrase patterns, not long paragraphs.
```

### Prompt 3 - Speaker-intent bank

```text
Extract the most natural ways to ask the learner what the speaker is trying to say in a sentence. Avoid internal framework language. Return only concise prompts a teacher could put on screen or say out loud.
```

### Prompt 4 - Comparison bank

```text
From these sources, extract the best Vietnamese phrases for comparing two close grammar patterns. Focus on lines that help learners distinguish intent, nuance, or strength. Return grouped patterns such as:
- one side is...
- the other side is...
- easy to confuse because...
```

### Prompt 5 - Trap-warning bank

```text
Extract the most useful Vietnamese trap-warning lines for JLPT N2 learners. Focus on cases where a Vietnamese translation sounds close but the actual grammar logic is different.
```

### Prompt 6 - Worked-example bank

```text
Extract natural Vietnamese lines for guiding a learner through a worked example:
- read the blank
- look for the clue
- identify what the speaker is doing
- eliminate the attractive wrong answer
- lock the final answer
```

### Prompt 7 - CTA bank

```text
Extract natural Vietnamese study-guidance lines for CTAs. Focus on phrases that sound like the next study step, not marketing copy.
```

### Prompt 8 - Bad to good rewrites

```text
Using the rule files and active Wake files, list the wording patterns that sound too system-like, stiff, or over-frameworked. For each one, propose a more natural Lucida-style rewrite and explain why it is better.
```

### Prompt 9 - 3-view phrasing bank

```text
Extract the best Vietnamese ways to explain the 3-view method for N2 grammar in learner-facing language. Prefer short labels and short guiding questions that work on slides.
```

### Prompt 10 - Consolidation prompt

```text
Consolidate everything into a reusable Vietnamese explanation bank with these sections:
- hook phrasing
- speaker-intent prompts
- comparison lines
- trap warnings
- worked-example prompts
- CTA study guidance
- 3-view teaching lines

For each section, give:
1. when to use
2. strong phrase patterns
3. weak phrase patterns to avoid
```

---

## 11. What To Save Back Into Lucida

Do not copy NotebookLM output raw into active files.

Convert it into canonical repo files such as:

```text
production/01-rules/slide-system/12-vietnamese-jlpt-n2-explanation-pattern-bank.md
production/01-rules/slide-system/13-good-bad-rewrite-bank.md
production/01-rules/slide-system/14-wake-gold-reference-phrasing.md
```

Start with only one if needed.

Recommended first file:

```text
12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

---

## 12. Cleanup Rule Before Repo Import

Before importing NotebookLM output into repo:

```text
1. remove duplicates
2. remove phrases that still sound too abstract
3. align wording with 10-banned-preferred-language-dictionary.md
4. keep only reusable patterns
5. separate learner-facing lines from internal notes
```

---

## 13. Fast Evaluation Rule

The NotebookLM run is useful only if it produces:

```text
- reusable phrase patterns
- natural comparison lines
- natural trap-warning lines
- teacher-like CTA guidance
```

It is not useful if it mostly produces:

```text
- summaries of the files
- long explanatory paragraphs
- restated frameworks with no phrasing value
```

---

## 14. Suggested First Session

For the first NotebookLM session:

```text
1. Upload the 10-file starter set
2. Run prompts 1, 3, 4, 5, 8, 10
3. Save the best outputs into notes
4. Export / copy the notes
5. Turn them into one Lucida pattern-bank file
```

Do not try to solve everything in one sitting.

---

## 15. Downstream Link

Anything learned from this NotebookLM process should feed back into:

```text
07-vietnamese-explanation-style-guide.md
08-learner-facing-language-audit-checklist.md
09-learner-facing-generation-spec.md
10-banned-preferred-language-dictionary.md
subagent handoff contracts
```

That is how NotebookLM becomes a support layer for scale,
not just a one-off experiment.
