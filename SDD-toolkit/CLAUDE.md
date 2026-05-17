# SDD Toolkit — Claude Code Instructions
**Version:** 1.0 | **Date:** 2026-04-28

Bộ quy tắc này áp dụng cho mọi dự án sử dụng SDD (Spec-Driven Development).
Khi có CLAUDE.md riêng của project → project CLAUDE.md override, nhưng các nguyên tắc này vẫn giữ.

---

## Triết Lý Cốt Lõi

> **Spec là contract. Code là implementation. Requirements là source of truth.**

1. Không bao giờ implement trước khi có RD được approve
2. Khi requirements mơ hồ → hỏi, không assume
3. Khi design thay đổi → cập nhật doc trước khi code
4. Mọi quyết định thiết kế phải có lý do ghi lại (not "what" but "why")

---

## SDD Phases & Phase Gates

```
Phase 0: Discovery      → output: Problem Statement được confirm
Phase 1: Requirements   → output: RD-*.md được approve           ← GATE 1
Phase 2: Design         → output: SD-*.md + Interface Contract    ← GATE 2
Phase 3: Build Plan     → output: BD-*.md với ordered steps       ← GATE 3
Phase 4: Implementation → code theo BD, không improvise scope
Phase 5: Review         → verify từng FR trong RD có implementation
```

**GATE = user confirm "okay, let's build" trước khi sang phase tiếp theo.**

Claude không tự chuyển phase. User mới có quyền approve gate.

---

## Phase 0 — Discovery

Khi bắt đầu project mới hoặc feature mới:

1. Hỏi 3 câu trước khi viết bất kỳ doc nào:
   - "Vấn đề cụ thể bạn muốn giải quyết là gì?"
   - "Ai dùng, dùng ở đâu, dùng khi nào?"
   - "Thành công trông như thế nào? (definition of done)"
2. Tóm tắt lại bằng 2-3 câu để confirm trước khi sang Phase 1

---

## Phase 1 — Requirements (RD Doc)

Dùng template `templates/RD-template.md`.

**Cấu trúc bắt buộc:**
- Section 0: Problem Statement
- Section 1: Usage (user dùng thế nào — trước khi nói hệ thống làm gì)
- Section 2: Functional Requirements (table với ID, Priority)
- Section 3: Non-Functional Requirements
- Section 4: Explicit Exclusions (cái gì KHÔNG làm — tránh scope creep)
- Section 5: Open Questions (cần confirm trước khi build)
- Section 6: Design Decisions (lý do cho mỗi decision quan trọng)

**Quy tắc viết FR:**
- FR-ID format: `FR-{module}-{3-digit}` (vd: `FR-COL-001`)
- Mỗi FR: 1 câu, động từ + đối tượng + điều kiện
- Priority: P0 (must), P1 (should), P2 (nice-to-have)
- Explicit Exclusions quan trọng không kém FR — ghi rõ để tránh scope creep

---

## Phase 2 — Design

Dùng template `templates/SD-system-design.md` + `templates/SD-interface-contract.md`.

**SD doc:**
- Architecture overview (diagram nếu cần — Mermaid)
- Data flow (step-by-step)
- Technology decisions + lý do
- Không thiết kế chi tiết implementation — chỉ boundaries

**Interface Contract:**
- Mỗi module/component: inputs, outputs, side effects
- Function signatures (không cần full code)
- Error cases

---

## Phase 3 — Build Plan

Dùng template `templates/BD-build-plan.md`.

**Nguyên tắc:**
- Steps ordered theo dependency — không step nào dùng output của step sau
- Mỗi step có test command để verify (smoke test per step)
- Estimate thời gian thực tế, không optimistic
- Ghi rõ file nào tạo mới, file nào sửa

---

## Phase 4 — Implementation

**Quy tắc khi implement:**
- Implement đúng FR, không thêm feature ngoài scope
- Khi gặp technical blocker → báo user, không tự quyết scope change
- Comment chỉ khi "why" không hiển nhiên — không comment "what"
- Sau mỗi step trong BD → mark `✅` trong BD doc

---

## Phase 5 — Review

Sau khi implement xong:
1. Đọc lại từng FR trong RD
2. Verify có implementation tương ứng
3. Chạy test/smoke test theo BD
4. List bất kỳ FR nào chưa được implement (nếu có)

---

## Quy Ước Naming

| Loại | Tên file | Ví dụ |
|---|---|---|
| Requirements & Design | `RD-{name}.md` | `RD-requirements.md`, `RD-content-collector.md` |
| System Design | `SD-{name}.md` | `SD-system-design.md`, `SD-interface-contract.md` |
| Build Plan | `BD-{name}.md` | `BD-build-plan.md`, `BD-module-c.md` |
| Backlog | `BACKLOG.md` | `BACKLOG.md` |
| User Guide | `USER-GUIDE-{feature}.md` | `USER-GUIDE-module-c.md` |

---

## Khi Nào Hỏi User

Hỏi khi:
- Requirement mơ hồ hoặc có thể hiểu 2 cách
- Có trade-off quan trọng (performance vs simplicity, etc.)
- Scope không rõ ràng (feature X có bao gồm edge case Y không)
- Có rủi ro kỹ thuật cần user biết

Không hỏi khi:
- Quyết định implementation detail thuần túy (naming, code style)
- Quyết định đã có precedent trong codebase
- Exploratory questions có thể tự research

---

## Anti-Patterns

| Anti-Pattern | Tại Sao Tránh |
|---|---|
| Code trước, doc sau | Doc mô tả code đã viết = không còn là spec nữa |
| FR quá vague ("system phải nhanh") | Không test được, không biết bao giờ xong |
| Không ghi Explicit Exclusions | Scope creep từ "cái này dễ thêm vào thôi" |
| Update code mà không update SD | Contract bị outdated, next session mất context |
| Big bang implementation | Không có smoke test per step → debug khó hơn |
