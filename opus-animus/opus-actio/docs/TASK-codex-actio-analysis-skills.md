# TASK (Codex) — 3 slash command phân tích tài chính actio (đọc từ finance.db)

**Owner spec:** Claude (Opus) · **Thực thi:** Codex · **Ngày:** 2026-06-22
**Mục tiêu:** Tạo 3 slash command `/actio-spending`, `/actio-networth`, `/actio-house` — markdown prompt (KHÔNG phải code Python) đọc số liệu thật từ `finance.db` (Layer A) và xuất phân tích tiếng Việt. Đây là lớp "skill phân tích/đánh giá tài sản" trên nền data đã ingest.

---

## 0. Context & ràng buộc (đọc kỹ)

- Repo root: `C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio/`
- DB (SQLite, **gitignored** qua `data/_local/`): `data/_local/finance.db`
- Command đặt ở **global**: `C:/Users/HUY/.claude/commands/actio-{spending,networth,house}.md` (giống 4 lệnh `/actio-*` sẵn có — KHÔNG nằm trong repo).
- Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Console Windows = cp1252 → mọi lệnh in tiếng Nhật/emoji phải set `PYTHONIOENCODING=utf-8`, nếu không crash UnicodeEncodeError.
- **Style chuẩn** (bám sát `C:/Users/HUY/.claude/commands/actio-portfolio.md`): frontmatter `--- description / argument-hint ---`, mục `## Steps`, `## Output structure` (emoji bullet), `## Constraints` (tiếng Việt, terse, có disclaimer dòng cuối "Không phải lời khuyên đầu tư").
- **BẢO MẬT (FINANCE_DATA_STORAGE_POLICY):** số thật chỉ ở `data/_local/` (đã gitignore). Command markdown = tracked-able nhưng KHÔNG được hardcode số dư/net worth thật vào file. Command chỉ chứa **query + cách trình bày**; số thật do runtime đọc từ DB.
- **Cách đọc DB trong command:** command chỉ thị Claude chạy query qua Bash, ví dụ mẫu (Codex nhúng nguyên văn query vào từng command):
  ```bash
  cd C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio && \
  PYTHONIOENCODING=utf-8 python -c "import sqlite3,json; c=sqlite3.connect('data/_local/finance.db'); c.row_factory=sqlite3.Row; print(json.dumps([dict(r) for r in c.execute('''<SQL>''')], ensure_ascii=False))"
  ```
- Nếu `data/_local/finance.db` không tồn tại → command phải báo "Chưa có DB. Chạy `python data/ingest_cards.py` + `ingest_finance.py` trước." và dừng.

---

## 1. `/actio-spending [YYYYMM]` — phân tích chi tiêu tháng

**Frontmatter:** `description: Actio — spending review (category vs budget + cảnh báo + uncategorized)`, `argument-hint: "[YYYYMM]"`.

**Steps (command chỉ thị):**
1. Xác định tháng: nếu có `$ARGUMENTS` (YYYYMM) → dùng; nếu rỗng → `SELECT MAX(source_month) FROM card_txn`. **Cảnh báo nếu tháng đó là tháng partial** (so sánh với ngày hiện tại — tháng đang chạy thì data chưa đủ; nêu rõ "tháng chưa kết thúc").
2. Đọc budget: `data/_local/budget.json` (key `monthly_jpy`). Nếu không có → fallback `data/budget.example.json` và ghi chú "đang dùng budget placeholder".
3. Query (nhúng nguyên văn, thay `:m` bằng tháng đã chọn):
   - Theo category: `SELECT category, total, n FROM v_spending_by_category WHERE source_month='<m>' ORDER BY total DESC`
   - Tổng tháng + theo thẻ: `SELECT card, n, total FROM v_spending_monthly WHERE source_month='<m>'`
   - Top merchant: `SELECT merchant, category, n, total FROM v_top_merchants WHERE merchant IN (SELECT merchant FROM card_txn WHERE source_month='<m>') ORDER BY total DESC LIMIT 10` *(hoặc filter theo tháng trong subquery)*
   - Uncategorized tháng đó: `SELECT merchant, COUNT(*) n, SUM(amount_jpy) total FROM card_txn WHERE source_month='<m>' AND category='other' GROUP BY merchant ORDER BY total DESC`

**Output structure:**
- 💴 **Tổng chi tháng `<m>`:** tổng JPY + split theo thẻ (rakuten/smcc) + số giao dịch.
- 📊 **Theo category vs budget:** bảng `category | actual | budget | % | trạng thái`. Tính % = actual/budget. Đánh dấu ⚠️ nếu >100%, 🟡 nếu 80–100%, ✅ nếu <80%.
- 🏪 **Top 5–10 merchant** tháng đó.
- ❓ **Uncategorized (`other`):** list merchant + tiền, gợi ý category để user thêm rule vào `data/categorize.py`.
- ⚡ **1–3 action** cụ thể (mục vượt budget → đề xuất hạ; merchant other lớn → phân loại).

**Constraints:** tiếng Việt terse; KHÔNG fetch gì online; disclaimer cuối.

---

## 2. `/actio-networth` — đánh giá net worth & phân bổ tài sản

**Frontmatter:** `description: Actio — net worth + allocation + concentration risk`, `argument-hint: ""`.

**Steps:**
1. Đọc snapshot mới nhất: `SELECT s.as_of, n.* FROM networth n JOIN snapshot s ON s.id=n.snapshot_id ORDER BY s.as_of DESC LIMIT 1`.
2. Phân bổ đầu tư: `SELECT * FROM pf_summary WHERE snapshot_id=(SELECT MAX(id) FROM snapshot)` (jp_equity / us_equity / funds, unrealized_pl_pct, dividends).
3. Cash theo account: `SELECT a.name, a.type, b.balance_jpy FROM balance b JOIN account a ON a.id=b.account_id WHERE b.snapshot_id=(SELECT MAX(id) FROM snapshot) ORDER BY b.balance_jpy DESC`.
4. Concentration: `SELECT code, name, cls, account_type, value_jpy, pl_pct FROM holding WHERE snapshot_id=(SELECT MAX(id) FROM snapshot) ORDER BY value_jpy DESC LIMIT 8`. Tính tỷ trọng từng holding trên `invested_total`.

**Output structure:**
- 🏦 **Net worth (`as_of`):** tổng + cash_total / invested_total + % allocation cash vs invested.
- 💰 **Cash breakdown:** theo account; nêu **idle_cash_beyond_ef** (tiền nhàn rỗi vượt quỹ khẩn cấp 12 tháng) — đây là số dư có thể đưa vào quỹ mục tiêu.
- 📈 **Đầu tư:** JP / US / funds split, unrealized P/L %, dividends.
- 🛡️ **Risk flags:**
  - Concentration: holding nào > 20% invested_total (kỳ vọng Hitachi ~24–25%) → ⚠️.
  - Cash-heavy: alloc_cash_pct cao (kỳ vọng ~76%) → nêu cơ hội phí cơ hội với mục tiêu dài hạn, nhưng đối chiếu mục tiêu mua nhà ngắn hạn (cash đúng cho horizon 1–2 năm).
- ⚡ **1–3 action** (vd: giảm concentration Hitachi; quyết định idle cash → quỹ nhà vs đầu tư).

**Constraints:** đối chiếu horizon — KHÔNG khuyên đổ hết cash vào equity vì có mục tiêu mua nhà ngắn hạn (xem `/actio-house`). Tiếng Việt terse; disclaimer cuối.

---

## 3. `/actio-house` — tiến độ quỹ mua nhà & ETA

Mục tiêu: ước lượng còn bao lâu đạt quỹ mua nhà, dựa trên savings rate.
**Vấn đề dữ liệu:** income KHÔNG có trong DB (chỉ có spending + 1 snapshot net worth). → cần config.

**Tạo thêm 2 file:**
- `data/goals.example.json` (**tracked**, placeholder):
  ```json
  {
    "monthly_income_jpy": 500000,
    "house_fund_target_jpy": 50000000,
    "house_horizon_months": 24,
    "current_fund_source": "idle_cash_beyond_ef",
    "note": "Placeholder. Copy sang data/_local/goals.json và điền số thật."
  }
  ```
- `data/_local/goals.json` (**gitignored**, copy từ example — Codex tạo bản copy, để user tự điền số thật; KHÔNG bịa income thật).

**Frontmatter:** `description: Actio — house fund progress + savings rate ETA`, `argument-hint: ""`.

**Steps:**
1. Đọc `data/_local/goals.json` (income, target, horizon, current_fund_source). Nếu thiếu → báo user điền `goals.json` rồi dừng.
2. Current fund: nếu `current_fund_source='idle_cash_beyond_ef'` → lấy `idle_cash_beyond_ef` từ networth; nếu `='cash_total'` → lấy cash_total. (mặc định idle_cash_beyond_ef).
3. Avg monthly spending: từ các **tháng đầy đủ** (loại tháng partial/đang chạy): `SELECT source_month, SUM(amount_jpy) t FROM card_txn GROUP BY source_month`. Lấy trung bình ~3–6 tháng gần nhất đã hoàn tất. Lưu ý card_txn chỉ là chi tiêu thẻ — ghi chú rõ "chưa gồm tiền mặt/chuyển khoản trực tiếp", nên surplus là **ước lượng trần**.
4. Tính: `surplus_thang = monthly_income - avg_spending`; `gap = target - current_fund`; `eta_months = ceil(gap / surplus_thang)` (nếu surplus ≤ 0 → cảnh báo không đạt).

**Output structure:**
- 🏠 **Mục tiêu:** target JPY + horizon mong muốn (tháng).
- 💪 **Hiện trạng:** current fund (nguồn) + % đã đạt so target.
- 📉 **Savings rate ước lượng:** income − avg spending = surplus/tháng, savings rate %. Ghi rõ caveat data thẻ.
- ⏳ **ETA:** số tháng tới target theo surplus hiện tại; so với horizon mong muốn → 🟢 kịp / 🔴 trễ + thiếu bao nhiêu/tháng.
- ⚡ **Action:** nếu trễ → cần tăng surplus ¥X/tháng hoặc kéo dài horizon; gợi ý dùng idle cash sẵn có.

**Constraints:** nêu rõ giả định & caveat (spending chỉ từ thẻ, income từ config). Tiếng Việt terse; disclaimer cuối.

---

## 4. Verify & report (bắt buộc, tiếng Việt)

1. Chạy thử 3 command query bằng python sqlite3 (PYTHONIOENCODING=utf-8) — paste output thật mẫu cho mỗi cái (KHÔNG paste số net worth thật vào file command, chỉ trong report cho user xem chạy được).
2. `/actio-spending` không arg → tự lấy tháng mới nhất; có arg `202606` → đúng tháng đó.
3. Xác nhận 3 file command tồn tại ở `C:/Users/HUY/.claude/commands/`.
4. Xác nhận `data/goals.example.json` tracked, `data/_local/goals.json` IGNORED (`git -C C:/Users/HUY/workspace/ai-project-opus check-ignore opus-animus/opus-actio/data/_local/goals.json`).
5. Xác nhận KHÔNG có số tài chính thật bị hardcode trong 3 file command hay `goals.example.json`.

---

## 5. Out of scope (đừng làm)
- KHÔNG sửa schema/views (đã xong ở task trước).
- KHÔNG đụng `ingest_*.py`, `categorize.py`, bảng snapshot.
- KHÔNG commit; KHÔNG build dashboard HTML (việc sau).
- KHÔNG fetch live price/online.
