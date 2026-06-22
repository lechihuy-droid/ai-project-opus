# RD — Proactive MVP (Daily Brief, Pull-Mode)
**Date:** 2026-06-21
**Status:** 🔵 Draft
**Author:** Lê Chí Huy + Claude
**Phase:** v4 Phase 2 (feature) — chỉ build SAU khi Eval Foundation (Phase 1) đứng vững
**Nguồn plan:** [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md) §3, §3.3–§3.7, §5, §6, §11 Phase 2
**Phụ thuộc (cứng):** [`RD-eval-foundation.md`](RD-eval-foundation.md) — traces (§8.2) + Typed Action Registry (§6.1) phải có trước.
**Scope quyết định (2026-06-21):** Logos & Rector build thành **subsystem first-class** (không phải lightweight stand-in). Thiết kế: [`SD-opus-logos.md`](SD-opus-logos.md), [`SD-opus-rector.md`](SD-opus-rector.md), [`SD-proactive-brief.md`](SD-proactive-brief.md).

---

## 0. Problem Statement

**Vấn đề:** Hệ thống hiện chỉ **trả lời khi được hỏi**. Một assistant "toàn năng" (north-star) phải **chủ động**: mỗi sáng nói cho user biết hôm nay nên tập trung gì, có gì đáng lưu ý về sức khỏe/lịch, deadline nào tới gần — gom từ nhiều subsystem thành **một** brief mạch lạc. Capability #10 (Proactive) trong §9 đang ⛔ "Not built".

**Hiện trạng:** Có dữ liệu rời rạc: `TODO.md`/`WEEKLY-PLAN.md` (task), `opus-nexus/health/` (sức khỏe), daily intel của Consilium. Nhưng không có thứ gom chúng lại; user phải tự mở từng nơi → dễ bỏ sót, không có "góc nhìn ưu tiên hôm nay".

**Mục tiêu:** Pull-mode daily brief — user hỏi *"Primus, hôm nay làm gì?"* (hoặc mở app) → nhận 1 brief: bối cảnh hôm nay + danh sách đề xuất đã xếp ưu tiên + hành động gợi ý. **Suggestion only — không bao giờ tự thực thi** (§3.1). Pull trước, push (Telegram) để sau (§3.4).

---

## 1. Usage — Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Huy — solo, đa mục tiêu (tài chính / sức khỏe / sự nghiệp / học) |
| Device / môi trường | Terminal hoặc Opus Home dashboard; tiếng Việt |
| Tần suất | 1 lần/sáng (pull on-demand). Rate limit: tối đa 1 morning brief + 1 evening review/ngày (§3.7) |
| Technical level | Đọc brief tiếng Việt, chọn accept/snooze/dismiss |

### 1.2 Typical Usage Flow

```
User: "Primus, hôm nay tôi nên tập trung gì?"   (pull trigger, origin=proactive_trigger nội bộ)
   → Infra/loop tạo intent_packet (expected_output = proactive_item set)
   → Rector  : pull task due/relevant từ TODO + WEEKLY-PLAN
   → Nexus   : thêm context sức khỏe + lịch hôm nay
   → Consilium: chèn thông tin mới high-signal khớp goal đang active
   → user-profile: bias theo goals/preferences/constraints
   → Logos   : xếp ưu tiên + ARBITRATE nếu mâu thuẫn (§3.3) + nêu trade-off
   → Primus  : ráp thành 1 brief (§3.5), mỗi item gắn requires_approval
   → ghi trace (L9) cho mỗi step; lưu proactive item-set vào opus-rector/proactive/
User: chọn [Chấp nhận tất cả] / [Chọn] / [Để sau] / [Bỏ qua]  → cập nhật state + outcome
```

### 1.3 Example Interactions

**Ví dụ 1 — Happy path (brief shape §3.5):**
```
Input: "Primus, hôm nay làm gì?"
Output:
  Chào buổi sáng.

  Bối cảnh hôm nay:
  - Lịch bận 10:00–17:00, tối có hẹn ăn ngoài.
  - Hôm qua protein thấp; ngủ tốt 7.5h.

  Primus đề xuất:
  1. [Ưu tiên] Hoàn tất review PR X        (Rector — due tuần này)
  2. Trưa ăn nhẹ, nhiều đạm                 (Nexus/health)
  3. Đi bộ 10' sau bữa tối                  (micro-action — ngày bận)

  [Chấp nhận tất cả] [Chọn] [Để sau] [Bỏ qua]
```

**Ví dụ 2 — Conflict arbitration (§3.3):**
```
Tình huống: Rector "deadline, push"  ⨯  Nexus "ngủ kém 2 đêm, nên nghỉ phục hồi"
Logos arbitrate theo precedence: safety/health > hard deadline > goal > preference
Output (KHÔNG ship cả hai mâu thuẫn):
  1. [Ưu tiên] Phục hồi: ngủ đủ tối nay        (Nexus/health — ưu tiên trên deadline mềm)
     ↳ Trade-off: lùi review PR X sang mai; deadline còn đệm 2 ngày.
```

**Ví dụ 3 — Anti-annoyance / silent (§3.7):**
```
Input: pull lần 2 trong ngày, không có item mới relevant
Output: "Không có gì mới cần ưu tiên thêm hôm nay. Brief sáng vẫn còn hiệu lực."
(Không bịa nudge — relevance gate; không re-surface item đã dismiss trong ngày.)
```

---

## 2. Functional Requirements

### Sinh & ráp brief
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-01 | Pull trigger: user hỏi "hôm nay làm gì" / mở app ⇒ sinh brief on-demand | P0 | Pull-mode only ở MVP |
| FR-02 | Rector pull task due/relevant từ `TODO.md` + `WEEKLY-PLAN.md` | P0 | Nguồn task |
| FR-03 | Nexus thêm context sức khỏe + lịch hôm nay vào brief | P0 | Đọc `opus-nexus/health/`, lịch (nếu có) |
| FR-04 | Consilium chèn thông tin mới high-signal **chỉ khi** khớp goal đang active | P1 | Relevance gate |
| FR-05 | Đọc `user-profile/` (goals/preferences/constraints) để bias ranking | P0 | §4; nếu chưa có profile → degrade, dùng GOALS.md |
| FR-06 | Logos xếp ưu tiên toàn bộ item theo goal-alignment + năng lượng/lịch hôm nay | P0 | Logos là ranker |
| FR-07 | **Conflict arbiter:** brief KHÔNG chứa 2 đề xuất mâu thuẫn; Logos resolve theo precedence `safety/health > hard deadline > goal > preference` và **nêu trade-off** | P0 | §3.3 [F4] |
| FR-08 | Ráp output đúng shape §3.5: greeting + "Bối cảnh hôm nay" + "Primus đề xuất" (đánh số) + action bar | P0 | 1 brief mạch lạc |

### Proactive item + state
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-09 | Mỗi đề xuất là 1 `proactive_item` đúng schema §3.6 (`id, trigger, source_subsystem, kind, title, reason, priority, suggested_action, requires_approval, state`) | P0 | `requires_approval=true` cho mọi external write |
| FR-10 | Lưu item-set + state vào `opus-rector/proactive/` (Rector owns) — là source of truth (§7.2 [F6]) | P0 | Không lưu trong status/chat |
| FR-11 | User action: accept / snooze / dismiss / "chọn" ⇒ cập nhật `state` của item | P0 | 4 nút §3.5 |
| FR-12 | Item dismiss được nhớ; **không re-surface item đã dismiss trong cùng ngày** | P0 | §3.7 |

### Safety, anti-annoyance, observability
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-13 | **Suggestion only:** không item nào tự thực thi; mọi action ngoài đều qua approval | P0 | §3.1 — nguyên tắc tối cao |
| FR-14 | Mọi action gắn class **từ Typed Action Registry** (§6.1), không từ LLM self-label | P0 | Phụ thuộc RD-eval-foundation FR-R* |
| FR-15 | Relevance gate: bỏ item không map tới goal active / task due; nếu rỗng ⇒ im lặng, không bịa nudge | P0 | §3.7 |
| FR-16 | Rate limit: ≤ 1 morning brief + 1 evening review/ngày (mặc định) | P0 | §3.7 |
| FR-17 | Mỗi step sinh brief ghi 1 **trace record** (L9, §8.2) | P0 | Phụ thuộc RD-eval-foundation FR-T* |
| FR-18 | Ghi **engagement signal** (accept/snooze/dismiss) cho mỗi item | P0 | §5 — weak signal |
| FR-19 | Ghi **outcome signal** (task có thực sự DONE không, lấy từ Rector/TODO completion) — tách khỏi engagement | P1 | §5 [F5]; outcome > engagement khi rank về sau |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-01 | Brief sinh đủ nhanh để dùng on-demand | < ~30s/brief (chấp nhận Claude CLI startup) | P1 |
| NFR-02 | Không tự thực thi side-effect | 0 external write không qua approval (audit qua trace) | P0 |
| NFR-03 | Degrade gracefully khi 1 subsystem thiếu dữ liệu | Vẫn ra brief từ phần có, nêu rõ phần thiếu (§10) | P0 |
| NFR-04 | Idempotent: pull nhiều lần/ngày không nhân bản item | Cùng ngày trả cùng item-set + delta, không duplicate | P0 |
| NFR-05 | Không annoying | Tôn trọng rate limit + dismiss memory; pull lần 2 không spam | P0 |
| NFR-06 | Đo được chất lượng | `proactive_precision` (outcome-weighted) + `false_nudge_rate` tính được từ trace §8.2 | P1 |

---

## 4. Explicit Exclusions

- **Không** làm push-mode / Telegram ở MVP — chỉ pull. Push là bước sau khi pull ổn (§3.4, §11 Phase 2 cuối).
- **Không** làm evening review / weekly review chi tiết — MVP tập trung **morning brief**. Evening chỉ giữ chỗ rate-limit (FR-16).
- **Không** build feedback re-ranking engine (§5 outcome→tuning) — MVP chỉ **ghi** signal (FR-18/19); việc tune ranking là Phase 3 ([`RD` riêng]).
- **Không** xây calendar integration mới — dùng lịch nếu đã có; nếu chưa, brief degrade (calendar wiring vẫn "planned" theo §9.1).
- **Không** medical diagnosis — health advice ở mức lifestyle (§6 mục 5).
- **Không** tự sửa `TODO.md`/`WEEKLY-PLAN.md` từ brief — chỉ đọc; ghi state proactive ở `opus-rector/proactive/`.
- **Không** build Eval Foundation ở đây — là dependency, đã có RD riêng.

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | Surface MVP: terminal CLI (`run_brief.py`) hay tab trong Opus Home dashboard trước? | **Terminal CLI trước** (nhanh, ít UI), nối dashboard sau |
| Q2 | ~~Logos/Rector lightweight hay full?~~ **ĐÃ CHỐT 2026-06-21: full subsystem.** Câu còn lại: rank engine MVP — heuristic thuần hay 1 call Claude-CLI? | Claude-CLI ranking có ràng buộc precedence trong prompt; rẻ vì 1 call/brief (xem SD-opus-logos §7) |
| Q3 | `opus-rector/proactive/` lưu dạng gì? 1 file/ngày JSON (`YYYY-MM-DD.json`) hay JSONL? | 1 file JSON/ngày (item-set + state) — dễ đọc/patch state |
| Q4 | Lấy "lịch hôm nay" từ đâu khi chưa có calendar wiring? | Từ `WEEKLY-PLAN.md` + mục lịch tay nếu có; nếu trống → bỏ dòng lịch, không bịa |
| Q5 | Outcome signal (FR-19): lấy "task DONE" từ đâu? | Diff completion trong `TODO.md`/Rector giữa hôm nay vs brief hôm trước |
| Q6 | "Active goal" để relevance gate (FR-15) đọc từ đâu? | `user-profile/goals.json` nếu có; fallback `GOALS.md` / `north-star.md` |
| Q7 | Evening review có vào MVP không hay chỉ giữ rate-limit slot? | Chỉ giữ slot; build evening sau morning ổn |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Pull trước, push sau | Pull = generated on-demand, dễ kiểm soát chất lượng & anti-annoy trước khi tự gửi (§3.4) | Push ngay: rủi ro spam khi chất lượng brief chưa ổn → loại |
| Logos là arbiter duy nhất, có precedence cố định | Brief không được ship 2 đề xuất mâu thuẫn; cần 1 nguồn quyết định (§3.3 [F4]) | Để cả 2 đề xuất cho user tự chọn: đẩy mâu thuẫn sang user, kém "assistant" → loại |
| Tách engagement vs outcome signal | accept ≠ useful; item accepted nhưng không DONE là tín hiệu *xấu hơn* (§5 [F5]) | Chỉ đo engagement: rank sai theo "click", không theo kết quả → loại |
| Proactive state ở `opus-rector/proactive/` (Rector single-writer); Nexus đọc qua API | SoT (§7.2 [F6]); **deviation khỏi v4** (`opus-nexus/proactive/`) để 1 writer sở hữu store — ghi DECISION-LOG | `opus-nexus/proactive/`: tách writer khỏi store → nhầm ownership · status.md/chat: §7.3 cấm |
| Action class từ registry (mượn từ Phase 1) | Safety gate deterministic, không phụ thuộc LLM self-label (§6.1) | LLM tự khai action_type: lỗ hổng an toàn → loại |
| Im lặng khi không có item relevant | Anti-annoyance; thà không nói còn hơn bịa nudge (§3.7) | Luôn ráp đủ N item: tạo nudge rác, giảm tin cậy → loại |
| MVP chỉ morning brief | Thu hẹp scope để ship được + đo được; evening/weekly thêm sau | Làm cả 3 brief ngay: scope creep, khó đo từng loại → loại |

---

## 7. Definition of Done (RD scope = chỉ tài liệu, chưa code)

- [ ] User approve: pull-mode morning brief, suggestion-only, các P0 FR & exclusion.
- [ ] 7 Open Questions có default được confirm/chỉnh (đặc biệt Q1 surface + Q3 storage).
- [ ] Xác nhận dependency: Eval Foundation (traces + registry) phải xong/đang chạy trước khi code feature này.

→ Sau approve: **SD** (data flow Rector→Nexus→Consilium→Logos→Primus + interface mỗi bước + schema `opus-rector/proactive/`) rồi **BD** (step ≤ 2h, mỗi step smoke test) theo `dev-approach/sdd-process.md`. **Chưa code trước khi RD+SD+BD approve.**

---

*Proactive MVP — RD v1 | 2026-06-21 | opus-animus v4 Phase 2*
