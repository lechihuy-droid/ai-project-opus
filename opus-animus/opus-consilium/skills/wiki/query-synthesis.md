---
title: Query Synthesis
category: wiki
tags: [query, synthesis, answer]
status: active
created: 2026-05-01
uses: 0
---

## When to use
Khi tổng hợp câu trả lời từ nhiều wiki pages, đặc biệt khi question cross nhiều topics.

## Procedure
1. Ưu tiên pages có confidence: high hoặc evergreen trong frontmatter
2. Nếu các pages mâu thuẫn nhau: nêu rõ conflict, không tự chọn một bên
3. Cite bằng [[page-slug]], không dùng tên file
4. Câu trả lời: kết luận trước, detail sau (BLUF — Bottom Line Up Front)
5. Nếu wiki không đủ thông tin: nói rõ gap, đừng hallucinate

## Notes
- Max 4 pages đọc mỗi query (token budget)
- Nếu question về "hôm nay" hoặc "gần đây": check page updated date trong frontmatter
- Personal questions (goals, health, finance): ưu tiên Personal/ topic
