# RD — Push-Mode Daily Brief (Infra → Telegram)
**Date:** 2026-06-22
**Status:** 🟢 Implemented (2026-06-24, one-way MVP) — `run_push_brief.py` + `primus/telegram.py`; cần `.env` creds + đăng ký scheduler để bật
**Author:** Lê Chí Huy + Claude
**Phase:** v4 Phase 3 — chỉ làm SAU khi pull-mode ổn (đã build) + anti-annoyance (§3.7) bật trước khi push
**Nguồn plan:** [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md) §3.2, §3.4, §3.7, §7.2
**Phụ thuộc (cứng):** pull-mode `generate_brief` + `run_brief.py` (đã build); proactive store (Rector); traces (animus_core)

---

## 0. Problem Statement

**Vấn đề:** Brief hiện chỉ **pull** — user phải tự chạy `run_brief.py` / tự hỏi. Một assistant chủ động thật sự phải **tự bắn brief sáng** đúng giờ mà không cần được hỏi (v4 §3.4 push). Hiện chưa có kênh push nào (Telegram đã bị tắt system-wide trong Consilium).

**Hiện trạng:** `generate_brief()` chạy on-demand, in ra terminal. Không có scheduler tự kích hoạt, không có kênh gửi tới điện thoại. Anti-annoyance (§3.7) chưa được enforce ở tầng delivery.

**Mục tiêu:** Mỗi sáng (mặc định ~07:00 JST) Infra (Windows Task Scheduler) tự gọi brief → gửi tới Telegram của user. Vẫn **suggestion-only**, tôn trọng quiet hours + rate limit + relevance gate; nếu không có gì đáng ưu tiên thì **im lặng**, không spam.

---

## 1. Usage — Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Huy — nhận brief trên điện thoại buổi sáng |
| Device | Telegram (mobile) |
| Tần suất | 1 push sáng/ngày (mặc định 07:00 JST); không push ngoài quiet-hours window |
| Technical level | Đọc brief tiếng Việt; (MVP) không cần thao tác phức tạp |

### 1.2 Typical Flow

```
07:00 JST — Task Scheduler job `opus-morning-brief` trigger
   → run_push_brief.py
   → check: trong quiet hours? đã push hôm nay chưa? (rate limit)
   → generate_brief({origin: proactive_trigger, date: today})
   → nếu items rỗng (relevance gate) → KHÔNG gửi (im lặng), ghi trace, thoát
   → nếu có brief → gửi text tới Telegram chat của user
   → đánh dấu đã push hôm nay (Rector proactive store)
User mở Telegram lúc 7:05 → đọc brief → (MVP) mở app/pull để accept/snooze/dismiss
```

### 1.3 Example Interactions

**Ví dụ 1 — Happy path (push sáng):**
```
[Telegram 07:00] Primus:
Chào buổi sáng.
Bối cảnh hôm nay:
- Ngủ 7h; 2112 kcal / 78g đạm; đã tập 1 buổi (muay_thai).
Primus đề xuất:
1. [Ưu tiên] Hoàn tất review PR X (Rector — due tuần này)
2. Trưa nhiều đạm (Nexus/health)
3. Đi bộ 10' sau tối (micro-action)
— Trả lời /xong <số> để đánh dấu, /sau để hoãn.
```

**Ví dụ 2 — Im lặng (relevance gate, §3.7):**
```
Không có task due / health nudge / info relevant → KHÔNG gửi gì cả.
(Trace ghi: origin=proactive_trigger, output_kind=suppressed_empty.)
```

**Ví dụ 3 — Anti-annoyance (đã pull rồi):**
```
User đã tự chạy brief lúc 06:30 → 07:00 push thấy proactive store đã có set hôm nay
→ KHÔNG gửi push trùng (rate limit 1/ngày).
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-01 | Job scheduler (Windows Task Scheduler) `opus-morning-brief` chạy 1 lần/sáng, giờ cấu hình (mặc định 07:00 JST) | P0 | Infra; không cron |
| FR-02 | `run_push_brief.py`: gọi `generate_brief({origin:"proactive_trigger", date:today})` rồi gửi qua Telegram | P0 | Tái dùng pull-mode orchestrator |
| FR-03 | Gửi brief text tới Telegram chat của user (bot token + chat_id từ `.env`) | P0 | Kênh delivery |
| FR-04 | **Relevance gate:** nếu brief rỗng (không item) → KHÔNG gửi, ghi trace `suppressed_empty` | P0 | §3.7 im lặng, không bịa |
| FR-05 | **Rate limit:** tối đa 1 push sáng/ngày; nếu proactive store đã có set hôm nay (đã pull/push) → KHÔNG gửi trùng | P0 | §3.7; idempotent |
| FR-06 | **Quiet hours:** không gửi ngoài window cấu hình (mặc định 06:00–22:00 JST) | P0 | §3.7 |
| FR-07 | Mỗi lần push ghi trace (origin=proactive_trigger, output_kind=pushed\|suppressed_empty\|suppressed_quiet\|suppressed_ratelimited) | P0 | Observability §8.2 |
| FR-08 | Cấu hình (giờ push, quiet hours, chat_id, enable/disable) tập trung 1 chỗ (`.env` + `push_config`) | P1 | Dễ chỉnh |
| FR-09 | (Tương tác) lệnh Telegram `/xong <n>`, `/sau`, `/bỏ` cập nhật state item qua Rector | P2 | Sau MVP one-way |
| FR-10 | Lệnh chạy tay `run_push_brief.py --dry-run` (sinh + in, KHÔNG gửi) để test | P1 | An toàn khi setup |
| FR-11 | **Ranker reliability:** push unattended mặc định dùng heuristic ranker (`ANIMUS_BRIEF_NO_LLM=1`); cờ `--use-llm` để bật LLM ranker khi chạy tay | P1 | Tránh LLM hiccup làm degrade/drop brief lúc không có người trông |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-01 | Suggestion-only | Push KHÔNG tự thực thi action nào; chỉ gửi text đề xuất | P0 |
| NFR-02 | Không annoying | ≤1 push/ngày, tôn trọng quiet hours + dismiss memory; im lặng khi rỗng | P0 |
| NFR-03 | Idempotent | Chạy job 2 lần/sáng (retry) không gửi 2 brief | P0 |
| NFR-04 | Degrade khi Telegram lỗi | Lỗi gửi → retry 1x → log + thoát, KHÔNG crash job, KHÔNG mất proactive set | P0 |
| NFR-05 | Secret an toàn | Bot token/chat_id trong `.env`, không hardcode, không vào trace/log | P0 |
| NFR-06 | Latency | Job xong < ~60s (chấp nhận Claude CLI nếu rank LLM bật) | P1 |

---

## 4. Explicit Exclusions

- **Không** làm evening/weekly push ở MVP — chỉ **morning** brief. (Slot evening để Phase sau.)
- **Không** làm Telegram inline buttons / 2-chiều phức tạp ở MVP — one-way push trước (FR-09 là P2).
- **Không** push tới nhiều user/group — single user (chat_id của Huy).
- **Không** bật lại toàn bộ Telegram pipeline cũ của Consilium — chỉ 1 đường gửi brief riêng, tối giản.
- **Không** tự thực thi bất kỳ action nào từ push — giữ approval (§6).
- **Không** đổi logic `generate_brief` — push là lớp delivery bọc ngoài.

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | Bot Telegram: tạo **bot mới riêng** cho Primus hay reuse bot Consilium cũ (đang disabled)? | **Bot mới riêng** (`PRIMUS_BOT_TOKEN`) — tách khỏi pipeline cũ |
| Q2 | Giờ push mặc định? | 07:00 JST |
| Q3 | Quiet hours window? | 06:00–22:00 JST (không gửi ngoài khoảng) |
| Q4 | MVP có cần tương tác `/xong /sau /bỏ` (FR-09) ngay không, hay one-way trước? | **One-way trước**; tương tác để bản sau |
| Q5 | Nếu user CHƯA pull mà 07:00 tới: push tạo set mới — đúng chứ? (push là "lần pull đầu của ngày") | Đúng — push = first pull of the day; pull sau đó thấy đã có set |
| Q6 | Lưu config push ở đâu? | `.env` (secret) + `opus-rector/` hoặc `primus/push_config.json` (giờ/quiet hours) |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Push bọc ngoài `generate_brief`, không sửa core | Pull-mode đã test; push chỉ thêm trigger + delivery | Viết brief riêng cho push: trùng lặp, lệch logic |
| Windows Task Scheduler | Chuẩn repo (CLAUDE.md); không daemon | cron: không hợp Windows |
| Telegram | Đã có hạ tầng/thói quen; mobile-friendly | Email/desktop notif: kém tiện trên điện thoại |
| Bot mới riêng (Q1 default) | Tách Primus khỏi Consilium Telegram (đã disabled), tránh side-effect | Reuse bot cũ: dính state/luồng cũ |
| One-way push MVP | Ship nhanh + an toàn anti-annoy trước; tương tác là lớp sau | Inline buttons ngay: phức tạp callback + state |
| Relevance gate → im lặng | §3.7: thà không gửi còn hơn spam nudge rác | Luôn gửi "không có gì": vẫn là noise |
| Rate-limit qua proactive store có sẵn | Store đã idempotent 1/ngày; push tái dùng | Cờ riêng: thêm state thừa |

---

## 7. Definition of Done (RD scope = tài liệu, chưa code)

- [ ] User approve: morning-only, one-way push MVP, suggestion-only, các P0 FR + exclusions.
- [ ] 6 Open Questions có default được confirm/chỉnh (đặc biệt Q1 bot, Q2 giờ, Q4 one-way).
- [ ] Xác nhận creds Telegram (bot token + chat_id) sẽ cấp qua `.env`.

→ Sau approve: **SD** (delivery flow + `run_push_brief.py` contract + Telegram sender interface + Task Scheduler job + config schema) → **BD** (step ≤2h, smoke test; coding giao Codex) theo `dev-approach/sdd-process.md`. **Chưa code trước khi RD+SD+BD approve.**

---

*Push-Mode Daily Brief — RD v1 | 2026-06-22 | opus-animus v4 Phase 3*
