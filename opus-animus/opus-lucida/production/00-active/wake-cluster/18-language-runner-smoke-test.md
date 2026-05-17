# Wake Language Runner Smoke Test
**Status:** Active v0.1  
**Date:** 2026-05-07  
**Scope:** Verify the new language-generation runner pack on one small Wake block before wider reuse  
**Role:** Lane review / runner verification  
**Parent:** `automation/workflows/30-language-generation-runner-pack.md`, `production/01-rules/slide-system/09-learner-facing-generation-spec.md`

---

## 1. Purpose

Test whether the new language-generation contract can improve copy quality
without changing lesson truth or structure.

Chosen block:

```text
Slide 05 - Method / big idea
```

Why this block:

```text
- high risk for framework leakage
- repeated often across future lessons
- easy to compare before/after
```

---

## 2. Runner Shape Simulated

Applied locally using the same contract as:

```text
Slide Copy Builder
Script Spoken Layer
Language QA
```

Required rule sources:

```text
07-vietnamese-explanation-style-guide.md
08-learner-facing-language-audit-checklist.md
09-learner-facing-generation-spec.md
10-banned-preferred-language-dictionary.md
12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

---

## 3. Before

Main problems:

```text
- `Người nói đang làm gì?` sounded too framework-like
- `Nghĩa - Hình - Dụng` was still surviving publicly
- script lines explained the method correctly, but still sounded too much like note language
```

---

## 4. After

Updated direction:

```text
Slide:
- `Ở câu này, người nói đang muốn nói gì?`
- `Ý nghĩa - Dạng - Cách dùng`
- `Hãy nhìn xem người nói đang muốn nhấn vào đâu.`

Script:
- `Mình nhìn mỗi mẫu qua 3 mặt: ý nghĩa, dạng, và cách dùng.`
- `Ở câu này, người nói đang muốn nói gì?`
- `Đang đính chính lại cách hiểu?`
```

---

## 5. Result

```text
Decision: PASS
```

Why:

```text
- language is less system-like
- method wording is more reusable
- script now sounds more spoken and teacher-led
- no lesson logic changed
```

Remaining note:

```text
The runner contract is useful,
but still benefits from human taste checks on especially visible lines.
```

---

## 6. Reuse Decision

Safe to reuse this runner pack for:

```text
- method slides
- grammar-card phrasing
- comparison prompts
- CTA study guidance
```

Next best test:

```text
Apply it to one grammar card block and one CTA block.
```

---

## 7. Follow-Up Test - Grammar Card + CTA

**Date:** 2026-05-09

Chosen blocks:

```text
Grammar card:
- Slide 06 - わけではない in 03-slide-deck.md

CTA:
- Slide 17 - Worksheet & quiz in 02-script.md
- synced CTA on-screen/script beat in 03-slide-deck.md
```

Applied runners:

```text
Slide Copy Builder
Script Spoken Layer
CTA / Quiz Copy Builder
Language QA
```

Result:

```text
Decision: PASS
```

Why:

```text
- Slide 06 no longer exposes the weak public label `Người nói đang:`
- Slide 06 now uses `Ý nghĩa`, `Dạng`, and `Cách dùng`
- CTA now reads as the learner's next study step, not a list of downloadable assets
- script and deck CTA wording are aligned
```

Remaining note:

```text
Some older comparison/script lines elsewhere still use weak wording such as
`Người nói đang:` and `phủ định một nhận định`.
Those should be handled in a later comparison-slide pass, not mixed into this small runner test.
```
