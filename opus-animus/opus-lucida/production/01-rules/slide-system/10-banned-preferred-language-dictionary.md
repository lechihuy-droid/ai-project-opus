# Banned And Preferred Language Dictionary
**Status:** Active v0.1  
**Date:** 2026-05-07  
**Scope:** Learner-facing Vietnamese for Lucida lesson generation, script writing, slide writing, CTA writing, and quiz explanation  
**Role:** Fast rewrite dictionary used by humans, prompts, agents, and future lint tooling

---

## 1. Purpose

This file turns language review from:

```text
case-by-case taste discussion
```

into:

```text
repeatable rewrite decisions
```

Use it during:

```text
generation
self-check
review
prompt writing
subagent handoff
lint rule design
```

---

## 2. How To Use

If a banned phrase appears in learner-facing output:

```text
rewrite it before finalizing
```

The preferred phrase is not always the only correct option,
but it defines Lucida's current default direction.

---

## 3. Method Labels

| Banned / weak | Preferred default |
|---|---|
| `Nghĩa - Hình - Dụng` | `Ý nghĩa - Dạng - Cách dùng` |
| `Meaning / Form / Usage` | `Ý nghĩa - Dạng - Cách dùng` |
| `Ngữ nghĩa - Văn phạm - Ngữ dụng` | `Ý nghĩa - Dạng - Cách dùng` |
| `Hình` | `Dạng` |
| `Dụng` | `Cách dùng` |

Supporting prompt lines:

```text
Ý nghĩa: ở đây, mẫu này dùng để nói ý gì?
Dạng: mẫu này đi với dạng nào?
Cách dùng: thường dùng trong tình huống nào? nghe có sắc thái gì?
```

---

## 4. Speaker-Logic Prompts

| Banned / weak | Preferred default |
|---|---|
| `Người nói đang làm gì?` | `Ở câu này, người nói đang muốn nói gì?` |
| `Speaker action là gì?` | `Ở đây, câu này đang nghiêng về ý nào?` |
| `Logic của người nói là gì?` | `Nghe đến đây thì nên hiểu theo hướng nào?` |

---

## 5. Comparison Language

| Banned / weak | Preferred default |
|---|---|
| `phủ định một nhận định` | `đính chính lại cách hiểu` |
| `bác bỏ khả năng rất mạnh` | `không thể nào lại như thế` |
| `soft correction` | `gỡ lại cách hiểu` |
| `strong denial` | `bác rất mạnh` |
| `possibility judgment` | `phán đoán về khả năng` |
| `constrained action` | `bị ràng buộc nên không làm được` |

---

## 6. Slide / Template Labels

| Banned / weak | Preferred default |
|---|---|
| `Hook` | `Tình huống mở đầu` |
| `Hook Quiz` | `Thử chọn nhanh` |
| `Promise Board` | `Bài này giúp gì?` |
| `Method Board` | `Cách nhìn để phân biệt` |
| `Clue Map` | `Dấu hiệu để chọn` |
| `Worked Example` | `Giải từng bước` |
| `Diagnostic Practice` | `Luyện xem mình hay nhầm ở đâu` |
| `Recap` | `Tổng kết nhanh` |

---

## 7. CTA Language

| Banned / weak | Preferred default |
|---|---|
| `Download worksheet now` | `Nếu hiểu bài rồi mà vào đề vẫn còn lưỡng lự...` |
| `Practice bundle` | `Bài tập để luyện tiếp` |
| `Lead magnet` | `Worksheet + quiz để tự kiểm lại` |
| `Diagnostic asset` | `Quiz để xem mình hay nhầm ở đâu` |

---

## 8. Abstract / System Phrases

| Banned / weak | Preferred default |
|---|---|
| `decision rule` | `gặp câu này thì nên nghĩ theo bước nào` |
| `clue-driven` | `nhìn dấu hiệu để chọn` |
| `logic map` | `mạch ý của câu` |
| `production note` | remove from learner-facing output |
| `metadata label` | remove from learner-facing output |
| `framework label` | rewrite into teaching language |

---

## 9. Good Defaults For Reuse

These are safe, reusable Lucida-style lines:

```text
Đừng nhìn chữ わけ trước.
Ở câu này, người nói đang muốn nói gì?
Chỗ này không phải nói về khả năng.
Ở đây người nói đang đính chính lại cách hiểu.
Một bên là gỡ lại cách hiểu.
Một bên là bác rất mạnh: không thể nào lại như thế.
Nếu vào đề vẫn còn lưỡng lự...
```

---

## 10. Prompt Writer Note

When writing prompts for agents/subagents,
include:

```text
preferred default wording from this file
banned wording from this file
at least 2 good/bad examples if the task creates public-facing text
```

---

## 11. Update Rule

When a new weak phrase appears:

```text
1. add it to this dictionary
2. add a preferred default
3. update any active lesson still using it
```
