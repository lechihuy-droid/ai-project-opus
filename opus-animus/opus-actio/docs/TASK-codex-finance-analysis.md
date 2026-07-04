# TASK (Codex) — Gom analysis cũ vào actio: phân loại chi tiêu + budget + analysis views

**Owner spec:** Claude (Opus) · **Thực thi:** Codex · **Ngày:** 2026-06-22
**Mục tiêu:** Tái dùng logic phân tích cũ (taxonomy + budget trong `health-app/instructions.md`) vào `opus-actio/finance.db`, bổ sung lớp analysis (category + budget + SQL views) cho bảng `card_txn`. KHÔNG viết slash-command markdown (việc đó Claude làm sau).

---

## 0. Context & ràng buộc (đọc kỹ)

- Project root: `C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio/`
- DB (SQLite, **gitignored** qua `data/_local/`): `data/_local/finance.db`
- Schema DDL (tracked): `data/schema.sql`
- Ingester thẻ hiện có (tracked): `data/ingest_cards.py` — đọc `data/_local/raw/cards/*.csv`, rebuild bảng `card_txn` (idempotent). KHÔNG phá hành vi này.
- Ingester snapshot tài sản (tracked): `data/ingest_finance.py` — **không đụng tới**.
- Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Console Windows = cp1252 → khi in tiếng Nhật phải set `PYTHONIOENCODING=utf-8` nếu không sẽ crash.
- **Nguồn logic tái dùng:** đọc `C:/Users/HUY/workspace/ai-project-opus/health-app/instructions.md` mục **"Finance Logging"** (taxonomy 7 category + budget). Adapt sang merchant tiếng Nhật của thẻ.
- **BẢO MẬT (FINANCE_DATA_STORAGE_POLICY):** số liệu thật chỉ ở `data/_local/` (đã gitignore). TUYỆT ĐỐI không `git add`/commit, không đưa số thật ra file tracked. File code/template/view = tracked được (không chứa số thật).
- `card_txn` schema hiện tại: `id, card, use_date, pay_date, merchant, user, pay_method, amount_jpy, fee_jpy, fx_note, source_file, source_month`.

---

## 1. Subtask A — Cột `category` + module phân loại

1. Thêm cột vào `card_txn` trong `data/schema.sql`: `category TEXT` (sau `fx_note`).
2. Tạo `data/categorize.py`: hàm `categorize(merchant: str) -> str` match **substring** (case-insensitive) theo SEED MAP §5. Không match → `"other"`.
3. Wire vào `data/ingest_cards.py`: khi insert mỗi row, set `category = categorize(merchant)`. Giữ idempotent (rebuild toàn bộ).
4. Chạy lại `ingest_cards.py`, rồi in **frequency list các merchant đang là `other`** (count + sum) để user tinh chỉnh rule sau.

**AC-A:** mọi row `card_txn` có `category` non-null; tỷ lệ `other` (theo số tiền) < 25%; danh sách `other` được in ra.

---

## 2. Subtask B — Budget config (JPY)

1. Tạo template tracked `data/budget.example.json`: object `{ "monthly_jpy": { "<category>": <int>, ... }, "note": "..." }`, dùng đúng tập category ở §5. Số = **placeholder** (xem §5 cột gợi ý), ghi note rõ "user tự chỉnh".
2. Copy thành `data/_local/budget.json` (file thật, **gitignored** vì nằm trong `_local/`). Đây là cái skill sẽ đọc.

**AC-B:** cả 2 file tồn tại, JSON hợp lệ, key category khớp §5; `git check-ignore` xác nhận `data/_local/budget.json` IGNORED, `data/budget.example.json` thì tracked.

---

## 3. Subtask C — Analysis SQL views (lớp tái dùng)

Thêm vào cuối `data/schema.sql` (đây là "analysis layer" để skill chỉ việc SELECT):

- `v_spending_monthly` — `card, source_month, COUNT(*) n, SUM(amount_jpy) total` group theo (card, month).
- `v_spending_by_category` — `source_month, category, SUM(amount_jpy) total, COUNT(*) n`.
- `v_top_merchants` — `merchant, category, COUNT(*) n, SUM(amount_jpy) total` order desc.
- `v_uncategorized` — các row `category='other'`: `merchant, COUNT(*) n, SUM(amount_jpy) total` group merchant order desc.
- `v_spending_vs_budget` — **không** join JSON (SQLite không đọc file JSON). Chỉ tạo view tổng actual theo `category` cho tháng gần nhất: `category, SUM(amount_jpy) actual`. (Phần so với budget để skill/Python ghép với `budget.json` — view chỉ lo "actual".)

Lưu ý: amount có thể NULL (1 row mercari trả góp) → views phải bỏ qua NULL khi SUM (SQLite tự bỏ NULL trong SUM, nhưng đừng để NULL phá COUNT logic).

**AC-C:** mỗi view chạy `SELECT * ... LIMIT 5` ra rows hợp lý; `PRAGMA integrity_check` = ok.

---

## 4. Verify & report (bắt buộc, tiếng Việt)

Sau khi xong, chạy query và report:
1. Phân bố `category`: `SELECT category, COUNT(*), SUM(amount_jpy) FROM card_txn GROUP BY category ORDER BY 3 DESC` (set PYTHONIOENCODING=utf-8).
2. % số tiền rơi vào `other`.
3. Danh sách merchant `other` (để user thêm rule).
4. Xác nhận gitignore: `git -C C:/Users/HUY/workspace/ai-project-opus status --porcelain` KHÔNG có gì trong `data/_local/`; file tracked mới chỉ gồm `schema.sql`, `categorize.py`, `ingest_cards.py`, `budget.example.json`.
5. Xác nhận bảng snapshot tài sản còn nguyên: `SELECT net_worth FROM networth` returns the expected private local snapshot; `SELECT COUNT(*) FROM holding` matches the expected local holding count.

---

## 5. SEED category map (đã rút từ merchant thật trong card_txn)

Tập category cuối: `transport, groceries, dining, shopping, bills, subscription, health, travel, entertainment, services, other`.
Match substring (cả half-width katakana lẫn full-width). Rule đầu khớp thắng; thứ tự ưu tiên như liệt kê.

| Category | Keyword (substring trong merchant) | Budget placeholder ¥/th |
|---|---|---|
| `transport` | `ICOCA`, `ＩＣＯＣＡ`, `JR`, `ＪＲ`, `エクスプレス`, `タイムズカー`, `ETC`, `ＥＴＣ`, `タクシー`, `ﾀｸｼｰ`, `GRAB` | 40000 |
| `bills` | `電力`, `電気`, `水道`, `ガス`, `カイジヨウ`, `海上`, `保険`, `NHK` | 25000 |
| `subscription` | `APPLE COM`, `OPENAI`, `CHATGPT`, `GOOGLE`, `ﾚｼﾞｪﾝﾄﾞ`, `レジェンド` | 6000 |
| `groceries` | `ｷﾞﾖｳﾑｽ`, `業務`, `ﾏﾝﾀﾞｲ`, `万代`, `ﾗｲﾌ`, `ライフ`, `ﾔﾏﾔ`, `食品`, `ﾏｰｹﾂﾄ`, `マーケット`, `ｽｰﾊﾟ` | 30000 |
| `dining` | `ｽﾞｼ`, `寿司`, `ﾏｸﾄﾞﾅﾙﾄﾞ`, `マクドナルド`, `ﾛｰｿﾝ`, `ローソン`, `ﾋﾞｽﾄﾛ`, `ﾍﾞﾝﾄ`, `弁当`, `ｶﾌｪ`, `珈琲` | 20000 |
| `health` | `薬局`, `ﾔﾂｷﾖｸ`, `病院`, `ｸﾘﾆﾂｸ`, `クリニック` | 10000 |
| `travel` | `TRIP.COM`, `ﾌﾞｯｷﾝｸﾞ`, `ブッキング`, `BOOKING`, `ﾎﾃﾙ`, `ホテル`, `航空`, `ﾗﾄﾞｶﾝ` | 20000 |
| `shopping` | `ﾒﾙｶﾘ`, `メルカリ`, `ﾄﾞﾝｷ`, `ドンキ`, `ﾑｼﾞﾙｼ`, `無印`, `ﾏﾙﾁﾒﾃﾞｲｱ`, `ﾖﾄﾞﾊﾞｼ`, `ｱﾐｼﾞﾏ` | 30000 |
| `services` | `ﾍｱ`, `ヘア`, `SQ*`, `ｶｽﾀﾑ` | 10000 |
| `entertainment` | `ｶﾗｵｹ`, `映画`, `ｹﾞｰﾑ`, `ゲーム` | 8000 |
| `other` | (fallback) | 20000 |

> Codex: nếu thấy merchant phổ biến chưa khớp, **không tự bịa** — để `other` và in ra để user quyết. Có thể bổ sung keyword hiển nhiên (vd thấy `WL *VUE*TESTING EXAM` → có thể thêm `education` nhưng hỏi/ghi note thay vì tự thêm category ngoài tập trên).

---

## 6. Out of scope (đừng làm)
- KHÔNG viết slash-command `/actio-spending` v.v. (Claude làm sau, dùng các view này).
- KHÔNG xoá/sửa `health-app/` (việc reconcile 2 hệ là task riêng).
- KHÔNG commit, KHÔNG đụng `ingest_finance.py` / bảng snapshot.
