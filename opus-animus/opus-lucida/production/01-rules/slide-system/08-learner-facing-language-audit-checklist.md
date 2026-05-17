# Learner-Facing Language Audit Checklist
**Status:** Active v0.1  
**Scope:** Skeleton, script, slide deck, worksheet CTA, quiz explanation, and any on-video Vietnamese in Lucida JLPT N2 lessons  
**Role:** Fast audit checklist for catching unnatural, system-like, or too-academic Vietnamese before assets are locked

---

## 1. Purpose

Use this checklist when the lesson logic is already mostly correct,
but the language still feels:

```text
- stiff
- framework-heavy
- translated from internal notes
- unlike a real N2 teacher
```

This checklist exists to stop the common failure:

```text
Correct content
but unnatural teaching voice.
```

---

## 2. Core Rule

If the learner can see it or hear it in the final lesson,
it must sound like:

```text
a Japanese teacher guiding how to think
```

Not:

```text
a system label
a glossary entry
a production note
a translated framework
```

---

## 3. Where To Run It

Run this checklist on:

```text
1. 01-master-teaching-skeleton.md
2. 02-script.md
3. 03-slide-deck.md
4. worksheet/quiz explanation blocks
5. CTA copy
6. HTML output spot-check
```

Priority order:

```text
on-screen text
script narration
slide headings
teaching prompts
grammar explanation labels
CTA language
```

---

## 4. Pass / Revise / Block

```text
PASS
= language sounds natural enough to teach from directly

REVISE
= logic is fine, but wording still sounds too framework-like or too stiff

BLOCK
= public-facing text still sounds like metadata, internal labels, or literal translation
```

---

## 5. Fast Audit Questions

Ask these in order:

```text
1. Would a real N2 teacher actually say this out loud?
2. Would a learner understand it on first read?
3. Does this line help the learner choose, contrast, or understand?
4. Does it sound like teaching, not documentation?
5. Is there any shorter, more natural Vietnamese way to say the same thing?
```

If the answer to any of `1-4` is `no`,
mark `REVISE`.

If the line still contains obvious internal/system wording,
mark `BLOCK`.

---

## 6. Layer Checks

### 6.1 On-Screen Text

Must be:

```text
- short
- direct
- easy to scan
- learner-facing
- natural in spoken Vietnamese
```

Fail if:

```text
- uses English framework labels
- sounds like a slide template name
- sounds like teacher notes, not student-facing text
```

Example:

```text
Bad: Method Board
Bad: Worked Example
Bad: Decision Rule
Good: Cách nhìn để phân biệt
Good: Giải từng bước
Good: Dấu hiệu để chọn
```

### 6.2 Script Narration

Must be:

```text
- teacher-led
- spoken
- easy to follow when heard once
- concrete enough to support answer choice logic
```

Fail if:

```text
- too many abstract labels in a row
- sounds like written explanation rather than spoken teaching
- repeats the slide text without adding thinking guidance
```

### 6.3 Skeleton Notes

May be slightly more technical than script,
but should still preserve a usable public phrasing path.

Fail if:

```text
- skeleton only stores logic labels
- no learner-facing phrasing exists for key teaching moves
```

---

## 7. Banned Wording Patterns

These are not always wrong in internal research,
but they should not survive into learner-facing lesson text without rewrite.

```text
Người nói đang làm gì?
Nghĩa - Hình - Dụng
Meaning / Form / Usage
Decision rule
Clue map
Worked example
Diagnostic practice
Phủ định một nhận định
Bác bỏ khả năng rất mạnh
Speaker action
Logic map
Production note
```

Preferred rewrites:

```text
Ở câu này, người nói đang muốn nói gì?
Ý nghĩa - Dạng - Cách dùng
Dấu hiệu để chọn
Giải từng bước
Luyện xem mình hay nhầm ở đâu
Đính chính lại cách hiểu
Không thể nào lại như thế
```

---

## 8. 3-View Label Rule

When the 3-view method appears publicly,
prefer:

```text
Ý nghĩa
Dạng
Cách dùng
```

Do not default to:

```text
Nghĩa - Hình - Dụng
Meaning / Form / Usage
Ngữ nghĩa - Văn phạm - Ngữ dụng
```

Supporting prompts:

```text
Ý nghĩa: ở đây, mẫu này dùng để nói ý gì?
Dạng: mẫu này đi với dạng nào?
Cách dùng: thường dùng trong tình huống nào? nghe có sắc thái gì?
```

---

## 9. Speaker-Logic Prompt Rule

When asking the learner to identify intent,
prefer:

```text
Ở câu này, người nói đang muốn nói gì?
Ở đây, câu này đang nghiêng về ý nào?
Nghe đến đây thì nên hiểu theo hướng nào?
```

Avoid:

```text
Người nói đang làm gì?
Speaker action là gì?
Logic của người nói là gì?
```

---

## 10. Minimal Pair Language Check

For comparison slides,
check that the contrast sounds like something learners can actually use.

Good:

```text
Một bên là đính chính lại cách hiểu.
Một bên là bác rất mạnh: không thể nào lại như thế.
```

Weak:

```text
Soft correction vs strong denial.
Phủ định một nhận định vs bác bỏ khả năng mạnh.
```

Pass condition:

```text
The learner can say why A is not B in plain Vietnamese.
```

---

## 11. CTA Language Check

CTA must sound like the next study step,
not generic marketing.

Good:

```text
Nếu hiểu bài rồi mà vào đề vẫn còn lưỡng lự...
Quiz này sẽ chỉ ra bạn hay nhầm ở đâu.
```

Weak:

```text
Download worksheet now.
Practice bundle.
Lead magnet.
```

---

## 12. Audit Workflow

Use this order:

```text
Step 1. Highlight all headings
Step 2. Highlight all method labels
Step 3. Highlight all comparison labels
Step 4. Highlight all CTA lines
Step 5. Mark banned wording
Step 6. Rewrite into spoken-teacher phrasing
Step 7. Re-check against the 5 fast audit questions
```

---

## 13. Minimum Deliverable

A file passes this audit only if:

```text
- no obvious system/template labels remain in public-facing text
- the 3-view method uses `Ý nghĩa - Dạng - Cách dùng`
- teacher prompts sound spoken and natural
- contrast lines are concrete enough for JLPT learners
- CTA reads like study guidance, not metadata
```

---

## 14. Update Rule

When a new unnatural phrase is found:

```text
1. add it to the banned wording list
2. add a preferred rewrite
3. update the active lesson if the phrase is still live
```

This file should get stronger over time.
