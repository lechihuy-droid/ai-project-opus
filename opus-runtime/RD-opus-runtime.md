# RD — Opus Runtime (Track B: Governance layer cho agent)
**Date:** 2026-06-28
**Status:** 🔵 Draft — cần chốt Q1 (kiến trúc) trước khi sang SD
**Author:** Claude (Opus 4.8) — main session
**Liên quan:** Harness Hub (Track A) là lớp **O (Observability)**. Track B là lớp **G (Governance)**.

---

## 0. Problem Statement

**Vấn đề:** Harness Hub chỉ **quan sát** Claude Code/Codex qua log — không cầm cương được. Các tính năng kiểu Hermes (HITL gate chặn tool-call rủi ro, hot-swap quyền, rollback checkpoint, live chain-of-thought) đòi hỏi Hub **LÀ runtime chạy agent**, không phải đứng ngoài đọc log.

**Hiện trạng:** Đã có sẵn pattern "chạy agent như một job": Claude giao `codex exec` qua subprocess, stream stdout, review diff. Nhưng nó **ad-hoc**: không checkpoint, không gate, không rollback, không tổng hợp.

**Mục tiêu:** Một **runtime cục bộ** biến pattern đó thành **agent job có quản trị** — phê duyệt trước/giữa các pha, snapshot + rollback an toàn, kiểm soát phạm vi quyền, stream trực tiếp — và lộ ra trong Hub UI.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile
| Field | Giá trị |
|---|---|
| Người dùng | HUY — điều phối agent jobs trên máy local |
| Môi trường | Windows 11, local; agent = `codex exec` (và/hoặc Agent SDK) |
| Tần suất | Mỗi khi giao một task code/refactor cho agent |
| Technical level | Cao |

### 1.2 Typical Usage Flow (Option A — job orchestrator + git checkpoint)
```
B1: User tạo job trong Hub: chọn prompt/brief + scope (thư mục được phép sửa)
B2: Runtime tạo CHECKPOINT (git commit/tag) trước khi chạy
B3: [GATE] Hub hỏi "Approve chạy job này?" -> User Approve/Reject/Edit-brief
B4: Runtime chạy codex exec, STREAM stdout live + budget bar (steps/time)
B5: Xong -> Hub hiện DIFF agent đã sửa
B6: [GATE] User: Accept (commit) / Rollback (git reset về checkpoint) / Re-run
Kết quả: thay đổi của agent luôn có thể hoàn tác; mọi job có audit trail
```

### 1.3 Example Interactions
**Happy path:** giao job "refactor X" -> checkpoint -> approve -> agent chạy -> xem diff -> Accept.
**Rollback:** agent đi sai -> bấm Rollback -> `git reset --hard <checkpoint>` -> repo về nguyên trạng.
**Reject sớm:** review brief thấy sai scope -> Reject ở B3, agent không chạy.

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-001 | Tạo **agent job** từ brief + scope (thư mục cho phép sửa) | P0 | |
| FR-002 | **Checkpoint** trạng thái repo trước khi job chạy (git) | P0 | tag/commit-id lưu trong job record |
| FR-003 | **HITL gate** tại ranh giới pha: approve/reject/edit-brief trước khi chạy | P0 | per-job, qua Hub UI |
| FR-004 | **Live stream** stdout/stderr của agent + budget bar (steps/time/token nếu có) | P0 | tái dùng SSE của Hub |
| FR-005 | Hiện **diff** agent đã sửa sau khi chạy | P0 | git diff vs checkpoint |
| FR-006 | **Rollback** về checkpoint (git reset) hoặc **Accept** (giữ + commit) | P0 | nút trong Hub |
| FR-007 | **Scope/permission** giới hạn agent: chỉ sửa thư mục cho phép, sandbox flags | P0 | qua codex `-s`/cwd; cảnh báo nếu đụng ngoài scope |
| FR-008 | **Audit trail**: mỗi job lưu brief, checkpoint, kết quả, ai approve/reject, diff stat | P1 | jobs/<id>/ |
| FR-009 | Per-tool-call HITL (pause trước từng tool, approve/edit args) | P1/P2 | **CHỈ khả thi ở Option B (Agent SDK)** — xem Q1 |
| FR-010 | Hot-swap quyền tool lúc đang chạy | P2 | **chỉ Option B** |
| FR-011 | UI quản lý jobs trong Hub: list, detail, gate buttons | P0 | thêm route #/jobs |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Local-only | bind 127.0.0.1, không SaaS | P0 |
| NFR-002 | An toàn rollback | rollback không mất commit user (chỉ reset thay đổi của job) | P0 |
| NFR-003 | Không phá Hub hiện có | Track B là module thêm, Hub Track A vẫn chạy độc lập | P0 |
| NFR-004 | API key | Option A = KHÔNG cần; Option B = cần Anthropic API key | P0 (quyết định ở Q1) |

---

## 4. Explicit Exclusions
- **Không** chạy được per-tool HITL trên **Claude Code session tương tác** bạn gõ ở terminal — runtime chỉ quản job nó tự khởi chạy.
- **Không** SaaS observability / LangSmith / Helicone.
- **Không** multi-user, không cloud.
- **Không** tự ý commit/push lên remote — chỉ thao tác local; push vẫn do user.

---

## 5. Open Questions — Q1 LÀ NHÁNH KIẾN TRÚC PHẢI CHỐT

| # | Câu hỏi | Mặc định |
|---|---|---|
| **Q1** | **Engine nào?** (A) Job orchestrator quanh `codex exec` + git checkpoint, gate ở ranh giới pha + review diff. (B) Agent SDK runtime với permission callback per-tool (HITL thật + hot-swap + live CoT) — **cần API key**. | **A trước** (local, no-key, dựng được ngay, đạt 80% giá trị governance), B là nâng cấp sau nếu chấp nhận API key |
| Q2 | Checkpoint bằng git commit hay tag hay stash? | Commit ẩn trên branch tạm + lưu sha; rollback = reset về sha |
| Q3 | Job chạy trong worktree riêng hay repo chính? | Worktree riêng (cô lập, không đụng working tree user) — an toàn hơn |
| Q4 | Track B nằm trong Hub hay app riêng? | Module `opus-runtime/` + endpoints gắn vào Hub server (tái dùng UI/SSE) |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Option A làm trước | Local, no-key, tái dùng pattern codex-exec + SSE đã có; git cho rollback chắc chắn | B: mạnh hơn nhưng cần API key + tự viết agent loop, build lớn |
| Git làm cơ chế checkpoint/rollback | Đã có sẵn, đáng tin, diff đẹp | Snapshot thư mục thủ công: cồng kềnh, dễ sót |
| Chạy job trong **git worktree riêng** | Cô lập, không phá working tree đang dùng | Chạy thẳng repo chính: rủi ro xung đột với việc user đang làm |
| Gate ở **ranh giới pha + diff-review** (Option A) | Đây là điểm kiểm soát khả thi với codex exec (chạy autonomous 1 lần) | Per-tool gate: codex exec không expose hook -> bất khả với A |
| Gắn vào Hub server | Tái dùng SSE, UI, boundary; một cổng duy nhất | App riêng: trùng lặp hạ tầng |

**Giới hạn trung thực của Option A:** codex exec chạy autonomous tới khi xong, nên **không pause được giữa từng tool-call**. HITL của A là: gate **trước khi chạy** (approve brief/scope) + **sau khi chạy** (review diff → accept/rollback) + budget-cap (kill nếu vượt). Per-tool HITL (FR-009/010) **chỉ có ở Option B**.

---

## 7. Phân phase (sau khi chốt Q1 = A)
- **Phase 1:** Job model + git-worktree checkpoint + run codex exec + live stream + diff + accept/rollback (FR-001..007, 011).
- **Phase 2:** Audit trail + budget-cap kill + scope-violation warning (FR-008).
- **Phase 3 (nếu chọn B sau):** Agent SDK runtime + per-tool permission callback (FR-009/010) — RD bổ sung.

---

## 8. Routing
- RD/SD/BD + review: Opus main session.
- Implement + test: Codex.

---

*Opus Runtime — RD v1 (Draft) | 2026-06-28*
