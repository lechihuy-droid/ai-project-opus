# TASK (Codex) — Sinh `portfolio.json` từ finance.db để 4 skill `/actio-*` chạy trên holdings thật

**Owner spec:** Claude (Opus) · **Thực thi:** Codex · **Ngày:** 2026-06-23
**Mục tiêu:** 4 skill cũ (`/actio-morning`, `/actio-portfolio`, `/actio-stock`, `/actio-tax`) đọc `data/portfolio.json` — file này **không tồn tại** nên skill đang chạy rỗng. 21 holdings thật đã nằm trong bảng `holding` của `finance.db`. Tạo script export gộp **holdings từ DB (market truth)** + **planning overlay (judgment)** → sinh `data/portfolio.json`. **KHÔNG sửa 4 skill** — chúng tự chạy thật khi file có data.

---

## 0. Context & ràng buộc

> ⚠️ FRESH START cho Codex: KHÔNG hỏi tiếp tục/bắt đầu mới, KHÔNG đọc ai/status.md hay handoff. Làm thẳng task này.

- Root: `C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio/`
- DB (gitignored, Layer A): `data/_local/finance.db`. Bảng `holding` cột: `snapshot_id, code, account_type, name, cls, qty, unit, avg_cost, cur_price, ccy, value_jpy, value_ccy, pl_jpy, pl_pct`. Bảng `fx_rate(snapshot_id, pair, rate, asof)`.
- `data/portfolio.json` **đã gitignored** (kiểm `.gitignore` có dòng `data/portfolio.json`) → đúng nơi ghi data thật, không leak.
- Python 3.11; set `PYTHONIOENCODING=utf-8` khi in tiếng Nhật.
- Schema đích = `data/portfolio.example.json` + `data/portfolio.schema.md` (đọc kỹ để khớp field name).
- **BẢO MẬT:** số thật chỉ ở file gitignored (`data/portfolio.json`, `data/_local/*`). File tracked (script, *.example.json) KHÔNG chứa số thật.

---

## 1. Deliverable A — Planning overlay (judgment fields DB không có)

DB chỉ có market data. Các field phán đoán phải nằm overlay riêng:
1. `data/portfolio-meta.example.json` (**tracked**, placeholder):
   ```json
   {
     "target_allocation": { "us_equity": 0.50, "jp_equity": 0.30, "cash_jpy": 0.10, "cash_usd": 0.10 },
     "accounts": {
       "nisa_growth": { "limit_yearly": 2400000, "limit_lifetime": 18000000, "used_yearly": 0, "used_lifetime": 0 },
       "nisa_tsumitate": { "limit_yearly": 1200000, "used_yearly": 0 },
       "tokutei": { "loss_carry": 0, "realized_gain_ytd": 0 },
       "ideco": { "monthly": 23000, "ytd": 0 }
     },
     "positions_meta": {
       "6501": { "thesis": "", "stop_loss": null, "target_1y": null, "added": null }
     },
     "watchlist": [],
     "note": "Planning overlay. Copy sang data/_local/portfolio-meta.json và điền thesis/stop_loss/target/quota thật."
   }
   ```
2. `data/_local/portfolio-meta.json` (**gitignored**, copy từ example để user điền sau). `positions_meta` key = mã holding (`code`).

---

## 2. Deliverable B — `data/export_portfolio.py`

Script đọc **snapshot mới nhất** trong `holding` + overlay `data/_local/portfolio-meta.json` → ghi `data/portfolio.json` đúng schema. Idempotent (ghi đè mỗi lần).

**Mapping holding → position:**
| portfolio.json field | Nguồn | Quy tắc |
|---|---|---|
| `ticker` | `holding.code` | |
| `market` | `holding.cls` | `JP`/`US`/`FUND` giữ nguyên |
| `name` | `holding.name` | |
| `qty` | `holding.qty` | |
| `avg_price_jpy` **hoặc** `avg_price_usd` | `holding.avg_cost` | nếu `ccy='JPY'`→`avg_price_jpy`; nếu `ccy='USD'`→`avg_price_usd` |
| `account` | `holding.account_type` | map: `NISA-growth→nisa_growth`, `NISA-tsumitate→nisa_tsumitate`, `taxable→tokutei`, khác/`-`→`tokutei` |
| `cur_price`, `value_jpy`, `pl_pct` | cùng tên trong holding | thêm vào position (extra, hữu ích cho skill, không phá schema) |
| `thesis`, `stop_loss`, `target_1y`, `added` | overlay `positions_meta[code]` | nếu thiếu → `thesis=""`, các field còn lại `null` |

**Top-level:**
- `owner`: "HUY"; `base_currency`: "JPY".
- `fx_rate`: lấy từ bảng `fx_rate` snapshot mới nhất (`pair='USDJPY'`) → `{ "USDJPY": <rate>, "updated": <asof|snapshot as_of> }`. Nếu không có → bỏ qua hoặc null.
- `target_allocation`, `accounts`, `watchlist`: copy nguyên từ overlay.
- `positions`: list từ holding (sort theo `value_jpy` desc).
- Thêm `generated_from`: "finance.db snapshot <as_of>" + `generated_at` timestamp để biết là file sinh tự động.

**CLI:** `python data/export_portfolio.py` → in tóm tắt (số positions, tổng value_jpy, đường dẫn ghi).

---

## 3. Chạy & Verify (tiếng Việt, PYTHONIOENCODING=utf-8)

1. Tạo overlay: copy example → `data/_local/portfolio-meta.json`.
2. Chạy `python data/export_portfolio.py`.
3. Xác nhận `data/portfolio.json`:
   - Tồn tại, JSON hợp lệ, `len(positions) == 21`.
   - Tổng `sum(value_jpy)` khớp `SELECT SUM(value_jpy) FROM holding WHERE snapshot_id=(SELECT MAX(id) FROM snapshot)` (≈ ¥3,848,658).
   - Top position = Hitachi (`6501`, market JP, account nisa_growth, value 952800).
   - Có ít nhất 1 US position với `avg_price_usd` (vd VOO) và JP position với `avg_price_jpy`.
4. Gitignore safety: `git -C C:/Users/HUY/workspace/ai-project-opus check-ignore opus-animus/opus-actio/data/portfolio.json` → IGNORED; `data/_local/portfolio-meta.json` → IGNORED; `data/portfolio-meta.example.json` + `data/export_portfolio.py` → tracked được (không số thật).
5. Báo cáo: in 3 position mẫu + tổng, xác nhận 4 skill giờ có data để đọc (KHÔNG cần sửa skill file).

---

## 4. Out of scope
- KHÔNG sửa 4 file skill `/actio-*` (chúng đọc `data/portfolio.json` sẵn — chỉ cần file tồn tại).
- KHÔNG sửa schema/views/ingest_*.py/categorize.py/snapshot tables.
- KHÔNG commit.
- KHÔNG điền số thật vào `positions_meta`/quota (để user tự điền `_local/portfolio-meta.json`).
- Chưa cần wire export vào `ingest_finance.py` (ghi chú "re-run export sau mỗi ingest" là đủ).
