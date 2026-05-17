# RD — {Project/Feature Name}
**Date:** {YYYY-MM-DD}
**Status:** 🔵 Draft | 🟡 In Review | 🟢 Approved
**Author:** {name}

---

## 0. Problem Statement

<!-- 2-3 câu. Vấn đề gì? Hiện tại đang xảy ra gì? Tại sao cần giải quyết bây giờ? -->

**Vấn đề:** ...

**Hiện trạng:** ...

**Mục tiêu:** ...

---

## 1. Usage — Người Dùng Dùng Thế Nào

> Viết section này TRƯỚC section FR. Nếu không thể mô tả usage cụ thể → requirements chưa đủ rõ.

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | |
| Device / môi trường | |
| Tần suất dùng | |
| Technical level | |

### 1.2 Typical Usage Flow

```
Bước 1: User làm gì
Bước 2: System phản hồi gì
Bước 3: User làm tiếp gì
Kết quả: User nhận được gì
```

### 1.3 Example Interactions

<!-- Ít nhất 2-3 ví dụ cụ thể (command, UI action, API call...) -->

**Ví dụ 1 — Happy path:**
```
Input:  ...
Output: ...
```

**Ví dụ 2 — Edge case:**
```
Input:  ...
Output: ...
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-001 | System phải... | P0 | |
| FR-002 | System phải... | P0 | |
| FR-003 | System nên... | P1 | |
| FR-004 | System có thể... | P2 | |

**Priority:**
- P0 = Must have (release blocker nếu thiếu)
- P1 = Should have (important nhưng có workaround)
- P2 = Nice to have (future consideration)

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Performance | Chạy xong trong < Xs | P0 |
| NFR-002 | Reliability | Xử lý lỗi gracefully, không crash | P0 |
| NFR-003 | Idempotency | Chạy nhiều lần không duplicate | P1 |
| NFR-004 | Cost | Groq calls < N/run | P1 |

---

## 4. Explicit Exclusions

> Ghi rõ cái gì KHÔNG build. Quan trọng không kém FR để tránh scope creep.

- **Không** làm X — lý do: ...
- **Không** làm Y — để sau khi Z ổn định
- **Không** hỗ trợ platform Z — out of scope MVP

---

## 5. Open Questions

> Cần confirm trước khi build. Mỗi question có default nếu không confirm.

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | ... | ... |
| Q2 | ... | ... |

---

## 6. Design Decisions

> Lý do cho mỗi quyết định thiết kế quan trọng. "Why not" quan trọng hơn "why".

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Dùng X thay vì Y | ... | Y: phức tạp hơn, không cần thiết ở scale này |
| Không dùng LLM cho bước Z | Performance — chạy < 2 phút | LLM: overkill + tốn quota |

---

*{Project} — RD v{version} | {date}*
