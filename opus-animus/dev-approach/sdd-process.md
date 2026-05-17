# SDD Process Reference
**Áp dụng cho project này** | Gốc: `C:/Users/HUY/AI/SDD-toolkit/workflow/sdd-process.md`

---

## Phase 0 — Discovery

**Output:** Problem statement 2-3 câu, confirmed.

Hỏi trước khi viết doc:
1. Vấn đề cụ thể là gì? (symptom vs root cause)
2. Ai dùng, khi nào, ở đâu?
3. Done = gì? (definition of done)

**Gate 0→1:** User confirm problem statement.

---

## Phase 1 — Requirements (RD)

**Template:** `templates/RD.md` → lưu vào `opus-consilium/docs/RD-{name}.md`

Thứ tự bắt buộc:
1. **Usage trước** — nếu không viết được usage example cụ thể → requirements chưa đủ rõ
2. FR/NFR — derive từ usage, mỗi FR testable
3. Explicit Exclusions — ít nhất 1, tránh scope creep
4. Open Questions — list + confirm default

**Gate 1→2:** User approve RD.

---

## Phase 2 — Design (SD)

**Template:** `templates/SD.md`

Chỉ design tới mức boundary — không viết implementation detail:
- Data flow step-by-step
- Interface contracts (function signature + input/output)
- Technology decision + lý do không chọn alternative

**Gate 2→3:** User approve SD.

---

## Phase 3 — Build Plan (BD)

**Template:** `templates/BD.md`

Rules:
- Mỗi step ≤ 2 giờ
- Mỗi step có smoke test command
- Step N không dùng output step N+1
- Step 0 = verify assumption nếu có unknown

**Gate 3→4:** User confirm BD.

---

## Phase 4 — Implementation

- Follow BD step theo thứ tự
- Smoke test sau mỗi step → mark ✅ trong BD
- Gặp blocker → báo user, không tự scope change
- Design change → update SD trước khi code

---

## Phase 5 — Review

- Cross-check từng P0 FR có implementation
- Tất cả smoke tests pass
- Docs không outdated

---

## Khi Nào Dùng Full SDD vs Lightweight

| Scenario | Process |
|---|---|
| Module mới | Full Phase 0-5 |
| Feature mới có > 3 components | Full Phase 1-4 |
| Integration point mới | Phase 2 (SD/interface contract) + Phase 3-4 |
| Fix bug rõ nguyên nhân | BD inline + Phase 4 |
| Config change (thêm RSS source) | Không cần doc, ghi BACKLOG |
| Refactor < 2 giờ | Mô tả ngắn + Phase 4 |
