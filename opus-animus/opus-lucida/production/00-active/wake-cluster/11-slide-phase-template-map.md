# Wake Slide Phase / Template Map
**Status:** Active for MVP visual revision  
**Date:** 2026-05-06  
**Purpose:** Make each slide's role, skeleton link, visual template, and quiz/reveal behavior explicit.

---

## 1. MVP Constraint

Current production rule:

```text
1 logical slide = 1 PNG frame = 1 audio segment
```

Therefore, quiz reveal timing cannot be animated inside the current MVP frame pipeline.

MVP solution:

```text
Quiz slides must show a clear static before/after structure:
- Before reveal: question / options / what learner should think about
- After reveal: answer / reason / trap explanation
```

Future upgrade:

```text
Split quiz slides into multiple production frames or upgrade assembly timing.
```

---

## 2. Template Families

| Template | Use when | Required visual logic |
|---|---|---|
| `Hook Contrast` | Opening the pain point | Real sentence first, grammar highlight second, no long theory |
| `Quiz Before / After` | Hook quiz or diagnostic practice | Show question, choices, answer state, and trap reason clearly |
| `Promise Board` | Topic and outcome | Tie exam speed + real-life usage to the lesson |
| `Story Context` | Practical scene | Show situation, constraint, and natural Japanese line |
| `Method Board` | Teaching framework | Show `Ý nghĩa - Dạng - Cách dùng` + guiding question |
| `Grammar Card` | One grammar point | Pattern, speaker action, meaning, form, example |
| `Comparison Pair` | Minimal pair | Two cards, one contrast axis, one trap warning |
| `Clue Map` | Exam decision training | Before clue, after clue, speaker action |
| `Worked Example` | Think-aloud solving | Step 1 read clue, Step 2 eliminate trap, Step 3 answer |
| `Recap Map` | End summary | One-screen memory map |
| `CTA Diagnostic` | Lead magnet | Problem, worksheet, quiz, review loop |

---

## 3. Slide Map

| Slide | Phase | Skeleton source | Template | Output role |
|---|---|---|---|---|
| 01 | Hook | §3 Hook Core | Hook Contrast | Create tension: same `わけ`, different logic |
| 02 | Hook Quiz | §3 Hook Quiz | Quiz Before / After | Let learner try, then give quick payoff |
| 03 | Promise | §2 Audience and Promise | Promise Board | State N2 + real-life outcomes |
| 04 | Story | §4 Story Core | Story Context | Ground `わけではない` and `わけにはいかない` in real use |
| 05 | Method | §5-6 Big Idea / Terminology | Method Board | Introduce `Ý nghĩa - Dạng - Cách dùng` |
| 06 | Core Grammar | §7 GP1 | Grammar Card | Teach `わけではない` |
| 07 | Core Grammar | §7 GP2 | Grammar Card | Teach `わけにはいかない` |
| 08 | Core Grammar | §7 GP3 | Grammar Card | Teach `わけだ` |
| 09 | Core Grammar | §7 GP4 | Grammar Card | Teach `わけがない` |
| 10 | Compare | §5 Big Idea | Recap / Logic Map | Convert four patterns into four speaker actions |
| 11 | Minimal Pair | §8 Contrast | Comparison Pair | Soft correction vs strong denial |
| 12 | Minimal Pair | §8 Contrast | Comparison Pair | Possibility judgment vs constrained action |
| 13 | Exam Transfer | §9 JLPT Clue Map | Clue Map | Turn understanding into exam behavior |
| 14 | Worked Example | §10 Worked Example | Worked Example | Re-solve the hook with clue/trap reasoning |
| 15 | Diagnostic Practice | §11 Practice | Quiz Before / After | Show answer review and trap type |
| 16 | Recap | §12 Summary | Recap Map | Lock final memory map |
| 17 | CTA | §2 Worksheet Promise | CTA Diagnostic | Send to worksheet + diagnostic quiz |

---

## 4. Heading Rule

Do not use vague English production labels on learner-facing frames.

Use Vietnamese phase labels:

```text
Hook tình huống
Quiz thử chọn
Chủ đề & mục tiêu
Tình huống thực tế
Cách học nhóm わけ
Mẫu 1 / Mẫu 2 / Mẫu 3 / Mẫu 4
So sánh nhanh
Bản đồ dấu hiệu
Giải đề từng bước
Luyện chẩn đoán
Tóm tắt
Worksheet & Quiz
```
