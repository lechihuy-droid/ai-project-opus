# RD — Nexus Finance Module Improvements
**Date:** 2026-06-10
**Status:** 🔵 Draft
**Author:** Claude (research từ codebase + personal-finance artifacts)

---

## 0. Problem Statement

**Vấn đề:** Tab Tài chính của Opus Nexus được build theo giả định VND-first (budget, parse rules, formatter), nhưng user sống ở Nhật và toàn bộ giao dịch thực tế là JPY. Kết quả: budget bars vô nghĩa (¥620 so với ngân sách 3.000.000), số liệu hiển thị sai đơn vị, và module gần như không dùng được.

**Hiện trạng:** `finance-data/` mới có 1 ngày log (2026-06-01, 2 giao dịch JPY). Trong khi đó layer hoạch định `personal-finance/` (plan v0, storage policy, snapshot 2026-06) đã khá hoàn chỉnh nhưng **hoàn toàn tách rời** khỏi Nexus — dashboard không biết gì về emergency fund, buckets, hay các khoản chưa phân loại (~¥230k/tháng).

**Mục tiêu:** Biến tab Tài chính từ "tracker VND bị bỏ hoang" thành module JPY-first dùng được hằng ngày, có pipeline log tin cậy, và kết nối với layer hoạch định tài chính cá nhân (snapshot, emergency fund, buckets) — đúng nguyên tắc của Nexus: *turn personal context into plans and approved actions*.

---

## 1. Hiện trạng chi tiết (Findings từ codebase)

### 1.1 Kiến trúc hiện tại

```
Chat (Claude + ảnh hóa đơn)
  → ghi finance-data/YYYY-MM-DD.json + index.json   (LLM tự edit 2 file)
  → dashboard.html tab Tài chính (renderFinance/drawFinance, ~60 dòng)
       - Card tháng này: thu nhập / chi tiêu / tiết kiệm
       - Bar chart chi tiêu/ngày (chia 1000, nhãn "nghìn")
       - Budget bars theo BUDGET hardcode
       - 20 giao dịch gần nhất

personal-finance/   (tách rời, không nối với dashboard)
  - PERSONAL_FINANCE_PLAN_JP_v0.md   — framework CFP-style, 12-month roadmap
  - FINANCE_DATA_STORAGE_POLICY.md   — 2-layer privacy (exact local, range trên GitHub)
  - snapshots/2026-06-finance-snapshot.md — thu nhập ¥500k–550k, rent ¥49k,
    khối chưa phân loại: SMCC ~¥120–130k, transfer ~¥100k, Mercari trả góp ¥15k/th
```

### 1.2 Các vấn đề phát hiện

| # | Vấn đề | Vị trí | Mức độ |
|---|---|---|---|
| P1 | **Currency mismatch**: `BUDGET` hardcode VND (food 3.000.000…) nhưng giao dịch thực là JPY (620, 360). Budget bar luôn ~0% | `dashboard.html:3018` | 🔴 Blocker |
| P2 | Field `currency` có trong schema nhưng **bị bỏ qua hoàn toàn** khi aggregate — JPY + VND cộng thẳng vào nhau | `renderFinance()` :3030 | 🔴 Blocker |
| P3 | Formatter `vnd()` (`k`/`tr`) + nhãn chart "Chi tiêu / ngày (nghìn)" sai đơn vị với JPY | :3260, :3072 | 🔴 |
| P4 | `instructions.md` dạy Claude parse VND-first (`45k = 45,000 VND`), budget VND — nguồn gốc của P1/P2 | `health-app/instructions.md` §Finance | 🔴 |
| P5 | Categories dashboard (food/transport/…) **không map** với 4 buckets của consultant snapshot (Fixed needs / Variable living / Family transfer / Saving-investment); không có `payment_method` → không giải được bài toán "khối SMCC ¥120–130k chưa phân loại" | schema + snapshot §6 | 🟡 |
| P6 | Log finance qua chat = LLM tự edit 2 file (data + index.json) — dễ lỗi merge/quên index; pipeline `nexus-commands` chỉ có `add_event`/`add_task`, **không có `add_transaction`** | `scripts/exec-command.js` | 🟡 |
| P7 | **Mâu thuẫn privacy**: storage policy cấm lưu lương chính xác trên GitHub, nhưng `instructions.md` hướng dẫn log income với amount chính xác vào `finance-data/` | policy §1 vs instructions §Finance | 🟡 |
| P8 | Roadmap Phase 4 (multi-currency, recurring, net worth, safe-to-spend, savings goals) chưa start | `health-app/roadmap.md` | ⚪ planned |

---

## 2. Usage — Người dùng dùng thế nào

### 2.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Le Huy — sống tại Nhật, thu nhập JPY, có nghĩa vụ/kế hoạch VND |
| Device | iPhone (chat Claude/ChatGPT) + dashboard PWA-style trên mobile/desktop |
| Tần suất | Log vài giao dịch/ngày qua chat hoặc ảnh hóa đơn; xem dashboard hằng ngày; review tháng 1 lần |
| Technical level | Cao — chấp nhận JSON-on-GitHub, không cần UI nhập liệu |

### 2.2 Typical Usage Flow (sau cải tiến)

```
Bước 1: User gửi ảnh hóa đơn FamilyMart cho Claude (hoặc gõ "trưa 620 yen hirohiro")
Bước 2: Claude parse JPY-first → commit lệnh add_transaction vào nexus-commands/
Bước 3: GitHub Actions validate + merge vào finance-data/YYYY-MM-DD.json + index.json
Bước 4: User mở Nexus → tab Tài chính: chi tiêu tháng theo ¥, budget pace,
        breakdown theo payment method (Rakuten/SMCC/PayPay/cash), safe-to-spend
Kết quả: Cuối tháng, Nexus draft sẵn snapshot (đã sanitize thành range)
        cho personal-finance/snapshots/ — user duyệt rồi commit
```

### 2.3 Example Interactions

**Ví dụ 1 — Happy path (log chi tiêu):**
```
Input:  "combini sáng 360 yen, thẻ rakuten"
Output: ✅ Đã lưu — expense 08:55
        🍜 ファミリーマート  ¥360 (Rakuten Card)
        Tháng này food: ¥18.2k / ¥60k (30%)
```

**Ví dụ 2 — Edge case (income, privacy rule):**
```
Input:  "lương về 392,000"
Output: ✅ Đã lưu — income (đã làm tròn theo privacy policy)
        💰 Lương tháng 6  ¥390k (rounded)
        → Số chính xác không lưu lên GitHub (FINANCE_DATA_STORAGE_POLICY)
```

**Ví dụ 3 — Cuối tháng:**
```
Input:  [User bấm "📊 Monthly Finance Review" trên dashboard]
Output: Prompt context (tổng theo bucket, % budget, khoản recurring sắp đến hạn)
        → user paste sang LLM → nhận draft snapshot sanitized + action items
```

---

## 3. Functional Requirements — theo 4 phase

### Phase F0 — JPY-first foundation (fix blockers P1–P4) — *bắt buộc trước mọi thứ*

| ID | Requirement | Verify |
|---|---|---|
| F0.1 | Đổi primary currency thành **JPY**: `BUDGET` theo ¥ (số liệu thật — chờ user chốt, xem Open Questions), formatter mới `yen()` (`¥620`, `¥18.2k`, `¥1.2M`), nhãn chart "Chi tiêu / ngày (¥ nghìn)" | Mở tab Tài chính với data 2026-06-01 → hiện ¥620/¥360, budget bar % đúng |
| F0.2 | Aggregate **currency-aware**: chỉ cộng JPY vào tổng tháng; giao dịch VND (nếu có) hiển thị riêng hoặc quy đổi theo manual rate, không bao giờ cộng thẳng | Tạo file test 1 giao dịch VND → tổng JPY không đổi |
| F0.3 | Update `instructions.md` §Finance: JPY-first parse (`620`, `620円`, `¥620`, `1.2万 = 12,000`), `currency:"JPY"` mặc định; VND chỉ khi nói rõ "k/tr/vnd" | Log thử "ăn trưa 850" → JSON ra `amount: 850, currency: "JPY"` |
| F0.4 | Budget mặc định JPY khởi tạo từ snapshot 2026-06 (rent ~49k → bills; điện ~10k; …) — đánh dấu `// user TBD` chỗ chưa chốt | Budget bars hiển thị số ¥ hợp lý |

**Effort:** S (~nửa ngày code + update prompt). Đây là bug fix theo nghĩa SDD — có thể làm ngay sau khi RD này được approve phần số liệu budget.

### Phase F1 — Logging pipeline tin cậy (P6, P7)

| ID | Requirement | Verify |
|---|---|---|
| F1.1 | Thêm action **`add_transaction`** vào nexus-command pipeline: LLM commit lệnh JSON → `exec-command.js` (hoặc script mới `exec-finance.js`) validate + **merge server-side** vào `finance-data/YYYY-MM-DD.json` + tự update `index.json` | Commit lệnh test → file ngày được merge đúng, index cập nhật, lệnh archive vào `processed/` |
| F1.2 | Schema v2 cho transaction: thêm `payment_method: cash\|rakuten_card\|smcc\|paypay\|bank\|mercari\|other` và `bucket: fixed\|variable\|family_transfer\|saving_invest` (map tự động từ category, override được) | Log mới có 2 field; file cũ (không có field) vẫn render bình thường |
| F1.3 | **Privacy rule cho income**: income làm tròn về 10k gần nhất trước khi ghi GitHub (hoặc chỉ ghi range) — sửa cả `instructions.md` lẫn validation pipeline. Giải quyết mâu thuẫn P7 | Log "lương 392,000" → file lưu 390000 + flag `rounded: true` |
| F1.4 | Recurring registry `finance-data/recurring.json`: rent, điện, Mercari trả góp (còn n kỳ), subscription AI, 住民税/国民健康保険 theo lịch JP | Dashboard đọc được; xem F2.3 |

**Effort:** M (~2–3 ngày). F1.1 tái dùng pattern nexus-command có sẵn (workflow + validate + archive).

### Phase F2 — Dashboard upgrades (P5, P8 / roadmap Phase 4)

| ID | Requirement | Verify |
|---|---|---|
| F2.1 | **Budget pace**: ngoài spent/budget, hiện pace MTD ("ngày 10/30 — đã dùng 55% budget food ⚠️") | Số % pace khớp công thức ngày |
| F2.2 | **Breakdown theo payment_method** + theo bucket (fixed/variable/family/saving) — trực tiếp giải bài toán "SMCC ¥120–130k là gì" của snapshot | Card breakdown hiện đúng tổng từng method |
| F2.3 | **Bills & recurring sắp tới**: đọc `recurring.json`, hiện "sắp đến hạn 7 ngày tới" + tổng fixed còn lại trong tháng | Thêm 1 recurring đến hạn 3 ngày tới → xuất hiện trên card |
| F2.4 | **Safe-to-spend**: thu nhập (range) − fixed còn lại − saving target → "còn tiêu được ~¥X đến cuối tháng" | Số khớp tính tay |
| F2.5 | **Savings goals + ETA**: `finance-data/goals.json` (quỹ khẩn cấp, vé về VN…) — progress + ETA theo surplus trung bình | Card goal hiện % + ETA |

**Effort:** M (~3–4 ngày, thuần frontend trong dashboard.html). F2.4/F2.5 cần ≥1 tháng data sạch — build sau khi F0+F1 chạy được vài tuần.

### Phase F3 — Nối với layer hoạch định personal-finance

| ID | Requirement | Verify |
|---|---|---|
| F3.1 | **Monthly Finance Review** (paste-flow giống Plan My Week): nút trên dashboard build context (tổng theo bucket — đã sanitize thành range theo storage policy, % budget, recurring, goals) → prompt → user paste kết quả LLM → draft `snapshots/YYYY-MM-finance-snapshot.md` | Bấm nút → prompt chứa range, KHÔNG chứa số dư/lương chính xác |
| F3.2 | Traffic-light card trên dashboard lấy từ snapshot hiện hành: emergency fund months, savings rate vs target 25%, trạng thái NISA/iDeCo | Card đổi màu đúng theo snapshot |
| F3.3 | Gate logic theo plan v0: chỉ hiện nudge "đầu tư/NISA" khi emergency fund ≥ 3 tháng & không có nợ lãi cao (đúng §8.1 plan v0) | EF < 3 tháng → không có nudge đầu tư |

**Effort:** M (~2–3 ngày). Phụ thuộc F2 + snapshot có dữ liệu thật.

---

## 4. Non-goals

- **Không** backend server, không React — giữ single-file SPA (đúng non-goals của IMPL doc).
- **Không** tích hợp API ngân hàng/Moneytree/Zaim — input vẫn chat-first qua ảnh/text.
- **Không** lưu số dư tài khoản, lương chính xác, số thẻ lên GitHub (storage policy là luật).
- **Không** đưa lời khuyên đầu tư cụ thể ("mua quỹ X") trong app — chỉ gate/nudge theo framework đã approve ở plan v0.
- **Không** tự build tỷ giá real-time phức tạp — manual rate trong config là đủ cho mức dùng hiện tại.

---

## 5. Open Questions (cần user chốt trước khi code F0)

1. **Budget JPY thực tế từng category?** Đề xuất khởi điểm từ snapshot: food ¥60k, transport ¥10k, shopping ¥30k, bills ¥75k (rent 49k + điện 10k + phone/net ~16k?), entertainment ¥20k, health ¥10k, other ¥20k — đúng/sai?
2. **Có còn log VND không?** (chi tiêu khi về VN, chuyển tiền gia đình). Nếu có → giữ dual-currency F0.2; nếu không → đơn giản hóa, reject non-JPY.
3. **Income privacy**: chọn làm tròn 10k (giữ được savings rate gần đúng) hay chỉ lưu range/không lưu income vào finance-data (snapshot lo phần income)?
4. **`add_transaction` qua pipeline (F1.1) hay giữ kiểu LLM edit file trực tiếp?** Pipeline an toàn hơn (validate + merge server-side) nhưng thêm độ trễ ~30s của Actions.
5. Khoản **transfer ~¥100k** trong snapshot thuộc bucket nào (family_transfer? saving?) — ảnh hưởng phân loại mặc định.

---

## 6. Thứ tự thực hiện đề xuất

```
F0 (fix JPY)  → verify: tab Tài chính hiển thị đúng với data thật      [~0.5 ngày]
F1 (pipeline) → verify: log từ iPhone end-to-end không sờ tay vào file [~2-3 ngày]
   ── thu thập 3-4 tuần data sạch ──
F2 (dashboard)→ verify: budget pace/breakdown/bills đúng số            [~3-4 ngày]
F3 (planning) → verify: monthly review ra snapshot sanitized           [~2-3 ngày]
```

Theo routing trong CLAUDE.md: sau khi RD này được **APPROVE** → viết SD/BD cho từng phase → giao Codex implement. F0 đủ nhỏ để coi là bug fix, có thể đi thẳng BD ngắn.
