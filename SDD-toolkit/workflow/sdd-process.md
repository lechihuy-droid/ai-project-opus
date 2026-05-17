# SDD Process — Spec-Driven Development
**Version:** 1.0 | **Date:** 2026-04-28

---

## Tổng Quan

SDD là phương pháp phát triển phần mềm trong đó **spec là nguồn sự thật**, không phải code.

```
Idea → Discovery → Requirements → Design → Build Plan → Implementation → Review
        Phase 0      Phase 1       Phase 2    Phase 3      Phase 4        Phase 5
```

Mỗi phase có **gate** — không sang phase tiếp khi chưa qua gate.

---

## Phase 0 — Discovery (30 phút)

**Mục tiêu:** Align về vấn đề trước khi viết bất kỳ doc nào.

**Output:** Problem statement 2-3 câu được confirm.

**Câu hỏi cần trả lời:**
1. Vấn đề cụ thể là gì? (triệu chứng vs root cause)
2. Ai gặp vấn đề này? Khi nào? Ở đâu?
3. Thành công trông như thế nào? (definition of done)
4. Constraint là gì? (thời gian, chi phí, tech stack)

**Dấu hiệu Phase 0 chưa xong:**
- "Cần một cái gì đó để..." (vague)
- Chưa biết ai là user
- Không có definition of done

**Gate 0 → 1:** User confirm problem statement.

---

## Phase 1 — Requirements (1-4 giờ)

**Mục tiêu:** Document đầy đủ cái cần build, cái không build, và câu hỏi còn mở.

**Output:** `docs/RD-{name}.md` với status Approved.

**Template:** `templates/RD-template.md`

**Thứ tự viết:**
1. Usage trước (Section 1) — nếu không mô tả được usage thì requirements chưa rõ
2. FR/NFR (Section 2-3) — derive từ usage
3. Explicit Exclusions (Section 4) — viết ngay sau FR
4. Open Questions (Section 5) — liệt kê, confirm với user

**Kiểm tra RD đủ chưa:**
- [ ] Mỗi FR có thể test được (có pass/fail rõ ràng)
- [ ] Có ít nhất 1 Explicit Exclusion
- [ ] Open Questions đã được confirm (hoặc có default rõ)
- [ ] Usage section có ví dụ cụ thể, không chỉ mô tả abstract

**Gate 1 → 2:** User approve RD.

---

## Phase 2 — Design (1-3 giờ)

**Mục tiêu:** Quyết định architecture và interface contracts trước khi code.

**Output:** `docs/SD-system-design.md` + interface contracts.

**Template:** `templates/SD-system-design.md`

**Thứ tự viết:**
1. Data flow (Section 2) — từ input đến output, step by step
2. Component breakdown (Section 3) — boundary của mỗi piece
3. Interface contracts (Section 4) — function signatures, inputs, outputs
4. Technology decisions + lý do (Section 7)

**Quy tắc design:**
- Chỉ design tới mức boundary — không viết implementation detail
- Mỗi component có input/output/side effects rõ ràng
- Technology decision PHẢI có "không chọn X vì..."

**Gate 2 → 3:** User approve SD.

---

## Phase 3 — Build Plan (30 phút - 1 giờ)

**Mục tiêu:** Break implementation thành steps có thể verify riêng lẻ.

**Output:** `docs/BD-{name}.md` với ordered steps.

**Template:** `templates/BD-build-plan.md`

**Nguyên tắc:**
- Mỗi step nhỏ nhất có thể (30 phút - 2 giờ)
- Mỗi step có smoke test command cụ thể
- Step N không depend vào output của step N+1
- Step 0 luôn là verify/spike nếu có assumption chưa proven

**Gate 3 → 4:** User confirm build plan.

---

## Phase 4 — Implementation

**Mục tiêu:** Build theo BD, không improvise scope.

**Rules:**
- Làm theo thứ tự steps trong BD
- Chạy smoke test sau mỗi step
- Mark step ✅ trong BD khi xong
- Nếu gặp blocker → báo user, không tự quyết scope change
- Nếu phát hiện FR không khả thi → flag ngay, không âm thầm skip

**Khi nào update doc:**
- FR thay đổi → update RD trước khi code
- Design thay đổi → update SD trước khi code
- Không bao giờ để code outpace spec

---

## Phase 5 — Review

**Mục tiêu:** Verify implementation đúng spec.

**Checklist:**
- [ ] Đọc lại từng FR trong RD — có implementation không?
- [ ] Chạy smoke tests theo BD
- [ ] Check NFR (performance, reliability, idempotency)
- [ ] Không có P0 FR bị skip
- [ ] Docs updated (SD phản ánh actual implementation)

**Output:** Sign-off hoặc list items cần fix.

---

## Khi Nào Dùng SDD Full vs Lightweight

| Scenario | Process |
|---|---|
| Feature mới có nhiều dependency | Full SDD (Phase 0-5) |
| Bug fix rõ nguyên nhân | Chỉ cần BD (Phase 3-4) |
| Spike / proof of concept | Phase 0-1 + code draft |
| Thay đổi nhỏ (< 2 giờ) | Phase 1 inline trong conversation |
| Refactor thuần kỹ thuật | Không cần RD, chỉ cần description |

---

## Lessons Learned từ Dự Án Thực Tế

**personal-agent (Module C):**
- Pattern: RD doc → interface contract → build plan by milestone → tested incrementally
- Bài học: Explicit Exclusions ngăn không build Linker Agent sớm — tiết kiệm 2+ giờ

**sier-project:**
- Pattern: Source ingestion → AS-IS → Gap analysis → RD → BD (waterfall Japanese offshore)
- Bài học: Traceability (FR có source_id) quan trọng vì khách sẽ hỏi "requirement này đến từ đâu"

**PMP-Quiz-App:**
- Pattern: Feature list → build → test in browser
- Bài học: Thiếu RD → scope creep (home redesign v2 blank screen do không define rendering contract)

---

## Tham Khảo & Nguồn Cảm Hứng

- [GitHub Spec Kit](https://github.com/github/spec-kit) — Spec-Driven Development cho AI agents
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) — Multi-agent SDD framework
- [cc-sdd](https://github.com/gotalab/cc-sdd) — Minimal SDD harness cho Claude Code
- [Phase2 — RDD](https://phase2online.com/2022/01/20/requirement-driven-development/) — Requirement-driven development fundamentals
