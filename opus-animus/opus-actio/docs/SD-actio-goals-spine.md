# SD + TASK (Codex) — Goal-based spine cho actio (`/actio-goals` + liabilities + cashflow)

**Owner spec:** Claude (Opus) · **Thực thi:** Codex · **Ngày:** 2026-06-23
**Loại:** SDD — System Design + Build task (áp dụng review chuyên gia: dựng *quy trình tư vấn*, không phải skill rời).

---

## 0. Rationale (vì sao build cái này, theo review)

Actio hiện phân tích **tài sản** và **mục tiêu** rời nhau → đó là "dashboard có persona", chưa phải advisory. Wealth advisory hiện đại (UBS goal-based) gắn *từng đồng vào một mục tiêu có horizon*: quỹ nhà (ngắn → bảo toàn), hưu (dài → tăng trưởng), khẩn cấp (thanh khoản). "76% cash" chỉ đánh giá đúng khi map vào mục tiêu.

Đồng thời thân chủ **sắp vay ¥45M** → bảng cân đối phải có **vế nợ** (liabilities), nếu không `/actio-networth` sẽ sai sau khi mua nhà.

→ Build theo thứ tự nền-trước: **(B0) liabilities + cashflow** → **(B1') goal-based spine `/actio-goals`**. IPS đầy đủ và FIRE number để task sau.

> ⚠️ FRESH START cho Codex: KHÔNG hỏi tiếp tục/bắt đầu mới, KHÔNG đọc ai/status.md hay handoff. Đọc file này + làm thẳng toàn bộ.

---

## 1. Context & ràng buộc

- Root: `C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio/`
- DB (gitignored): `data/_local/finance.db`; schema tracked: `data/schema.sql`
- Command global: `C:/Users/HUY/.claude/commands/` (giống `/actio-*` khác)
- Python 3.11; in tiếng Nhật/emoji → set `PYTHONIOENCODING=utf-8`
- Style skill bám `C:/Users/HUY/.claude/commands/actio-portfolio.md`: frontmatter `description`+`argument-hint`, `## Steps`, `## Output structure`, `## Constraints` (tiếng Việt, terse, disclaimer cuối).
- Persona/định nghĩa: đọc `ACTIO.md` (actio = chuyên gia). Hồ sơ thân chủ: `data/_local/client-profile.json`.
- **BẢO MẬT:** số thật chỉ ở `data/_local/`. File tracked (schema/script/*.example.json/skill .md) KHÔNG chứa số thật.

---

## 2. Deliverable A — Bảng `liabilities` (vế nợ của bảng cân đối)

Thêm vào `data/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS liabilities (
  id              INTEGER PRIMARY KEY,
  snapshot_id     INTEGER REFERENCES snapshot(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,      -- 'mortgage' | 'loan' | 'card_revolving' | 'other'
  name            TEXT,
  principal_jpy   INTEGER NOT NULL,   -- dư nợ còn lại
  rate_pct        REAL,
  term_months     INTEGER,
  monthly_payment_jpy INTEGER,
  start_date      TEXT,               -- 'YYYY-MM-DD'
  note            TEXT
);
```
- Hiện **0 dòng** (thân chủ chưa có nợ) — bảng sẵn cho mortgage sắp tới.
- Thêm view `v_networth_true`:
  ```sql
  CREATE VIEW v_networth_true AS
  SELECT n.snapshot_id,
         n.net_worth AS assets_net_worth,
         COALESCE((SELECT SUM(principal_jpy) FROM liabilities l WHERE l.snapshot_id=n.snapshot_id),0) AS total_liabilities,
         n.net_worth - COALESCE((SELECT SUM(principal_jpy) FROM liabilities l WHERE l.snapshot_id=n.snapshot_id),0) AS true_net_worth
  FROM networth n;
  ```
  (Khi chưa có nợ → true_net_worth = assets net worth. Khi mua nhà: thêm holding/asset nhà + dòng liabilities → đúng cả hai vế.)

---

## 3. Deliverable B — Multi-goal `goals.json` (tổng quát hoá, thay house-only)

Hiện `goals.json` chỉ có house. Nâng thành **portfolio mục tiêu**.

1. `data/goals.example.json` (**tracked**, placeholder) — ghi đè bản cũ, schema mới:
```json
{
  "goals": [
    {
      "id": "emergency",
      "name": "Emergency fund",
      "type": "emergency",
      "priority": "must_not_fail",
      "target_jpy": 1200000,
      "horizon_months": 0,
      "risk_bucket": "preservation",
      "funding_source": "cash"
    },
    {
      "id": "house",
      "name": "House down payment + fees",
      "type": "house",
      "priority": "important",
      "target_jpy": 5000000,
      "target_note": "Full-loan: target = down payment + 諸費用, KHONG phai gia nha",
      "horizon_months": 18,
      "risk_bucket": "preservation",
      "funding_source": "idle_cash_beyond_ef"
    },
    {
      "id": "retirement",
      "name": "Retirement / FI",
      "type": "retirement",
      "priority": "important",
      "target_jpy": null,
      "horizon_months": 324,
      "risk_bucket": "growth",
      "funding_source": "invested"
    }
  ],
  "monthly_savings_capacity_jpy": null,
  "note": "Placeholder. Copy sang data/_local/goals.json va dien target/horizon that. risk_bucket: preservation(<3y, cash/bond) | balanced(3-10y) | growth(>10y, equity)."
}
```
2. `data/_local/goals.json` (**gitignored**) — **migrate**: giữ giá trị thật cũ nếu có, map sang schema mới; điền 3 goal trên với placeholder để user chỉnh. (KHÔNG bịa số thật vào tracked example.)
3. `data/goals.schema.md` (tracked) — tài liệu field: id/name/type/priority(must_not_fail|important|aspirational)/target_jpy/horizon_months/risk_bucket/funding_source.

---

## 4. Deliverable C — `/actio-goals` skill (xương sống goal-based)

File: `C:/Users/HUY/.claude/commands/actio-goals.md`. Frontmatter `description: Actio — goal-based plan (buckets + funding + allocation match)`, `argument-hint: ""`.

**Steps (skill chỉ thị Claude):**
1. Check DB; đọc `data/_local/goals.json`, `data/_local/client-profile.json`.
2. Lấy số liệu (nhúng query, PYTHONIOENCODING=utf-8):
   - Net worth + cash/invested + EF: `SELECT * FROM networth ...` (latest)
   - Cash theo account (thanh khoản)
   - True net worth: `SELECT * FROM v_networth_true ...`
   - Holdings để biết equity hiện có
3. **Cashflow / savings capacity:** income từ `client-profile.cashflow_jpy.monthly_net_income_est`; expense từ `client-profile.cashflow_jpy.monthly_expense` (nếu null → trung bình `card_txn` 3-6 tháng + ghi caveat "chỉ chi thẻ, thiếu rent/mặt"). `savings_capacity = income - expense`.
4. **Goal-based allocation mapping (lõi):** phân bổ net worth vào các goal theo thứ tự priority + horizon:
   - emergency: cash tới target.
   - house: `idle_cash_beyond_ef` tới target.
   - retirement: `invested_total` + cash dư sau emergency+house.
   - Mỗi goal: % funded = funded/target; tháng còn lại; **monthly needed = (target-funded)/horizon_months** so với savings_capacity → on-track / behind.
5. **Mismatch check (giá trị tư vấn chính):** so `risk_bucket` khuyến nghị của goal vs tài sản đang tài trợ nó:
   - Tiền mục tiêu ngắn hạn (house/emergency) mà nằm trong equity → ⚠️ "rủi ro sai horizon".
   - Tiền hưu (dài) mà nằm cash 0% → ⚠️ "phí cơ hội".
   - EF vượt mức cần (so job_stability: high=6 tháng) → idle, đề xuất reallocate.

**Output structure:**
- 🎯 **Bảng mục tiêu:** `goal | priority | target | funded | %  | horizon | monthly needed vs capacity | trạng thái`.
- 🧭 **Goal-based allocation:** net worth map vào từng bucket; nêu tiền nào đang phục vụ mục tiêu nào.
- ⚠️ **Mismatch & idle:** sai horizon, EF thừa, cash dư nên đầu tư.
- ⚡ **1–3 action** theo priority (must_not_fail trước).

**Constraints:** đọc profile trước, không hỏi lại cái đã có; tiếng Việt terse; disclaimer cuối "Không phải lời khuyên đầu tư".

---

## 5. Deliverable D — `/actio-networth` thành liability-aware (sửa nhỏ)

Trong `C:/Users/HUY/.claude/commands/actio-networth.md`: thêm 1 bước đọc `v_networth_true` và hiển thị **true net worth = assets − liabilities** (khi có nợ). Khi chưa nợ thì bằng net worth cũ. KHÔNG phá phần còn lại.

---

## 6. Verify & report (tiếng Việt, PYTHONIOENCODING=utf-8)
1. `schema.sql` áp được: bảng `liabilities` + view `v_networth_true` tồn tại; `PRAGMA integrity_check`=ok. (Áp schema không phá data: chạy `sqlite3 finance.db < schema.sql` hoặc qua Python `executescript` — idempotent nhờ IF NOT EXISTS / DROP VIEW.)
2. `v_networth_true` trả `true_net_worth == assets_net_worth` (vì 0 liabilities) = ¥15,931,781.
3. `goals.example.json` tracked + `data/_local/goals.json` gitignored (`git check-ignore`).
4. `/actio-goals.md` tồn tại; chạy thử các query trong skill ra số hợp lý; in mẫu bảng mục tiêu (emergency ¥1.2M, house, retirement) + 1 mismatch (vd EF ¥2.4M > 6 tháng cần).
5. Không số thật trong file tracked.
6. Báo cáo: liệt kê file tạo/sửa + output mẫu thật.

---

## 7. Out of scope (task sau)
- IPS đầy đủ (risk capacity vs tolerance, target allocation số) — task riêng.
- FIRE number / `/actio-retire` projection — task riêng.
- Tự động trừ liabilities khi tính `networth` trong `ingest_finance.py` — chưa cần (chưa có nợ).
- KHÔNG commit. KHÔNG đụng `categorize.py`, `ingest_cards.py`, `export_portfolio.py`, snapshot tables.
