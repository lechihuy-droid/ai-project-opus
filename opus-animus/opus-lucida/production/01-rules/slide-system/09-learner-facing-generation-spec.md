# Learner-Facing Generation Spec
**Status:** Active v0.1  
**Date:** 2026-05-07  
**Scope:** All Lucida skeleton, script, slide-deck, CTA, worksheet-explanation, and quiz-explanation generation  
**Role:** Upstream generation contract so learner-facing Vietnamese is natural from the first draft, not only after review

---

## 1. Purpose

This file exists to solve the scale problem:

```text
If language quality depends on late manual rewriting,
Lucida will not scale.
```

Therefore the generation chain must produce:

```text
logic that is correct
and learner-facing language that already sounds teachable
```

Not:

```text
logic first
unnatural wording later
manual cleanup forever
```

---

## 2. Core Rule

Generation must separate:

```text
logic note
teaching note
learner-facing slide text
spoken script text
trap wording
```

Do not let one register leak into another.

Most common failure:

```text
internal logic labels
-> copied into slide text
-> copied into script narration
```

---

## 3. Required Upstream Chain

Every generation pass should follow:

```text
topic truth
-> teaching logic
-> learner-facing rewrite
-> banned-language self-check
-> final artifact
```

Do not use this weak chain:

```text
topic
-> one-pass draft
-> human cleans tone by hand
```

---

## 4. Generation Layers

### 4.1 Skeleton

Skeleton may contain concise logic wording,
but must also preserve a clear learner-facing path.

Required:

```text
- grammar truth
- speaker logic
- trap logic
- comparison logic
- one possible public phrasing for key teaching moves
```

Fail if:

```text
- skeleton stores only technical labels
- no natural public phrasing exists for later script/slide generation
```

### 4.2 Script

Script must sound like a teacher speaking once, clearly.

Required:

```text
- spoken rhythm
- teacher-led guidance
- contrast wording learners can use
- answer-choice relevance
```

Fail if:

```text
- sounds like notes read aloud
- uses framework labels as narration
- repeats slide text without adding thinking guidance
```

### 4.3 On-Screen Text

On-screen text must be the most learner-facing layer.

Required:

```text
- short
- scannable
- concrete
- natural in spoken Vietnamese
```

Fail if:

```text
- uses internal labels
- sounds like metadata
- requires narration to become understandable
```

---

## 5. Mandatory Language Sources

Every generation run that creates learner-facing Vietnamese must consult:

```text
07-vietnamese-explanation-style-guide.md
08-learner-facing-language-audit-checklist.md
10-banned-preferred-language-dictionary.md
12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

If the task includes method-board or 3-view wording,
also consult:

```text
framework/grammar-3-view/03-framework-3-view-grammar.md
```

---

## 6. 3-View Rule

When the 3-view method appears publicly,
the default labels are:

```text
Ý nghĩa
Dạng
Cách dùng
```

Supporting prompts:

```text
Ý nghĩa: ở đây, mẫu này dùng để nói ý gì?
Dạng: mẫu này đi với dạng nào?
Cách dùng: thường dùng trong tình huống nào? nghe có sắc thái gì?
```

Do not default to:

```text
Nghĩa - Hình - Dụng
Meaning / Form / Usage
```

---

## 7. Agent / Subagent Contract

Any agent or subagent that generates learner-facing content must receive:

```text
Task
Input files
Write scope
Public language rule
Banned wording source
Preferred wording source
Output format
```

Minimum language contract:

```text
Read:
- 07-vietnamese-explanation-style-guide.md
- 08-learner-facing-language-audit-checklist.md
- 10-banned-preferred-language-dictionary.md
- 12-vietnamese-jlpt-n2-explanation-pattern-bank.md

Do:
- generate natural learner-facing Vietnamese
- separate logic note from public phrasing
- prefer spoken-teacher wording

Do not:
- use internal framework labels in public text
- use banned wording without rewrite
- output unresolved system-language placeholders
```

---

## 8. Recommended Output Schema

When possible, generate in this structure:

```text
Teaching logic:
Public phrasing:
On-screen text:
Script narration:
Trap wording:
```

Why:

```text
logic can stay precise
while public language stays natural
```

This structure should be preferred for:

```text
skeleton sections
grammar card drafts
comparison slide drafts
worked example drafts
CTA drafts
```

---

## 9. Self-Check Before Finalizing

The generator should check:

```text
1. Would a real N2 teacher say this?
2. Would the learner understand it on first read?
3. Did any banned wording survive?
4. Does the line help the learner think, choose, or contrast?
5. Is there a shorter, more natural Vietnamese version?
```

If `3` is yes:

```text
rewrite before returning output
```

---

## 10. Prompt-Level Rule

Prompt writers should include:

```text
preferred labels
banned labels
good/bad examples
required output schema
self-review instruction
```

Do not rely on:

```text
“make it natural”
```

That instruction alone is too weak.

---

## 11. Scale Rule

At small scale,
manual rewrite can rescue a draft.

At Lucida scale,
manual rewrite should only be:

```text
final polish
or spot correction
```

Not:

```text
the main language-production method
```

---

## 12. Update Rule

When a new unnatural pattern is found:

```text
1. add it to 10-banned-preferred-language-dictionary.md
2. update the audit checklist if needed
3. update any runner pack or subagent handoff that still permits it
```
