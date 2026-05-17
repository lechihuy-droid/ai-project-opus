# Example Subagent Prompts
**Status:** Active  
**Role:** Prompt contracts for subagents working on the example lane

---

## 1. Shared Rules For All Example Subagents

Every example subagent should obey:

```text
scene first
do not invent from grammar alone
do not use support translation as public narration
do not force trend into weak grammar fit
naturalness beats novelty
keep scene-example roles separate from form-only micro-examples
```

Input files to reference when relevant:

```text
00-example-system-rules.md
01-persona-map.md
04-grammar-affordance-matrix.md
05-natural-vietnamese-translation-rules.md
06-example-qa-criteria.md
08-label-taxonomy.md
09-llm-retrieval-contract.md
10-example-creation-process.md
```

---

## 2. Situation Research Subagent

### Task

Find scene candidates, not full polished examples.

### Prompt

```text
Task:
Find 3-5 candidate scenes for this grammar need.

Rules:
- Start from the grammar action, not the grammar label alone.
- Return scenes before full sentences.
- Prioritize shelf life, persona fit, and emotional clarity.
- Do not optimize for meme value.
- Do not write Japanese lines unless needed as a rough seed.

Output format:
- Scene ID
- Situation
- Who is speaking to whom
- Emotional tension
- Why this scene fits
- Risk
- Suggested role: spine / practical expansion / comparison / trend support / form micro-example
```

---

## 3. Japanese Naturalness Subagent

### Task

Turn scene candidates into natural Japanese lines.

### Prompt

```text
Task:
Write or revise Japanese lines so they sound like real utterances in the stated scene.

Rules:
- Scene first, dialogue second.
- Keep register consistent inside the line.
- Do not write lines that exist only to showcase the grammar.
- If the line sounds textbook or over-explanatory, rewrite it.
- If unsure, prefer simpler spoken Japanese over overly literary phrasing.

Output format:
- Scene ID
- Japanese natural line
- Register note
- Why this sounds natural
- Risk note if still imperfect
- Role note: scene line or form micro-example
```

---

## 4. Vietnamese Naturalness Subagent

### Task

Produce public-facing Vietnamese and support translation as separate layers.

### Prompt

```text
Task:
Write a natural Vietnamese public-facing line and a separate support translation.

Rules:
- Public-facing Vietnamese must sound spoken.
- Support translation may be more literal.
- Do not let the two lines collapse into near-duplicates.
- Avoid textbook Vietnamese and translated grammar wording.
- If the line feels written rather than spoken, rewrite it.

Output format:
- Scene ID
- Vietnamese public-facing line
- Vietnamese support translation
- Tone note
- Why the public line sounds natural
- Role note: scene line or form micro-example
```

---

## 5. Pedagogy Fit Subagent

### Task

Check whether a natural example still teaches the right thing.

### Prompt

```text
Task:
Review these example candidates for pedagogy fit.

Rules:
- Reject examples that are interesting but weak for the grammar logic.
- Score grammar fit, exam transfer, real-life transfer, and trap value.
- Naturalness does not excuse weak grammar fit.
- Do not rewrite for style unless the issue directly affects teaching logic.
- Call out when a line should remain only a form micro-example instead of replacing a scene line.

Output format:
- Scene ID
- Grammar fit score
- Exam transfer score
- Real-life transfer score
- Trap / contrast value
- Verdict: primary / backup / support / shorts-only / reject
- Reason
- Role note: scene line / form micro-example / comparison-only
```

---

## 6. Curation Subagent

### Task

Shortlist and store the approved set.

### Prompt

```text
Task:
Select the final example set for this lesson.

Rules:
- Approve one primary spine.
- Approve one practical expansion if needed.
- Allow at most one trend-aware support example.
- Do not approve duplicates that do the same job.
- Move weak patterns to negative example notes if useful.
- If a form-focused micro-example is useful, keep it clearly labeled as a micro-example, not as a replacement for the scene spine.

Output format:
- Primary spine
- Practical expansion
- Optional support example
- Why this mix is balanced
- What was rejected and why
```
