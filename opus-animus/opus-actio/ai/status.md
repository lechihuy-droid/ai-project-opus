# STATUS - opus-actio
**Updated:** 2026-07-04
**Current owner:** Claude

## Current objective

**Plan Cockpit** — lớp vận hành plan tài chính v3 (theo dõi hành động, không chỉ chẩn đoán).

### Plan v3 + app rebuild (2026-07-04)
- ✅ `data/_local/plan-v3.md` — plan 3 chân trời gắn 15 tiêu chuẩn chuyên gia (S1–S15) + KPI contract; thay plan-v2
- ✅ `docs/REVIEW-app-vs-plan-v3.md` — đánh giá app vs plan (5✅/3🟡/4🔴 — thiếu execution tracking)
- ✅ `docs/PLAN-app-rebuild.md` + SDD: `RD-plan-cockpit.md` / `SD-plan-cockpit.md` / `BD-plan-cockpit.md`
- ✅ `data/_local/plan-config.json` — tham số plan cho backend
- ✅ Codex implement BD (backend /api/actio/plan v2 + plan-state + PlanView tab)
- ✅ Claude verify (2026-07-04): kpis[12] đúng verdict · waterfall 5 bậc khớp config · DTI @current 24.9% / @stress 34.2% (gate_ok) · checklist persist qua reload + restart server (plan-state.json) · đổi plan-config.json → API đổi theo (không cần restart) · 3 tab nội bộ THÁNG/5 NĂM/TỚI HƯU render, toggle 3/4/5% chạy · tab Actio cũ nguyên vẹn, console sạch · không số thật trong diff tracked
- ✅ Bug fix (Codex): `actio_overview()` retire dict thiếu `nenkin_start_age` → bridge years=0; đã thêm field, bridge card giờ 5 năm / 年金 từ 65 (restart run_dashboard.py để nhận code — đã restart)

## Objective trước — MVP-A: Claude Code-first (0 API metered, dùng Pro flat-fee).

## State

### Core infrastructure (done)
- ✅ Sub-project scaffold
- ✅ 3 custom JP skill (`edinet-fetcher`, `jp-tax-account`, `jp-fiscal-calendar`)
- ✅ Tab "Actio" trong opus home dashboard
- ✅ Core plugin cloned: `equity-research` (9c/9s), `financial-analysis` (7c/13s), `wealth-management` (6c/6s)

### MVP-A (done 2026-05-20)
- ✅ 4 slash command tại `~/.claude/commands/`:
  - `/actio-morning` — daily brief
  - `/actio-stock <ticker>` — single ticker deep dive
  - `/actio-portfolio` — allocation + rebalance review
  - `/actio-tax <ticker> [amount]` — NISA/特定/iDeCo decision
- ✅ Portfolio schema: `data/portfolio.example.json` + `data/portfolio.schema.md`
- ✅ `.gitignore` loại file thật + cache + node_modules
- ✅ USAGE.md updated với MVP-A section
- ✅ Overview HTML: `docs/OVERVIEW-after-finopt.html`

### Finance DB — Layer A real data (done 2026-06-22)
- ✅ Gom `personal-finance/_local` (số liệu thật) vào opus-actio, xoá nguồn cũ
- ✅ SQLite `data/_local/finance.db` — snapshot-based, 7 bảng (snapshot / fx_rate / account / balance / holding / pf_summary / networth)
- ✅ `data/schema.sql` (DDL, tracked) + `data/ingest_finance.py` (build script, tracked)
- ✅ Raw layer immutable: `data/_local/raw/{YYYYMM}{networth,portfolio}.json` → build ra finance.db
- ✅ `.gitignore` khoá `data/_local/` → Layer A không thể commit (FINANCE_DATA_STORAGE_POLICY)
- ✅ Snapshot đầu: 2026-06 — range-level net-worth snapshot, holdings, and cash accounts verified locally
- **Thêm tháng:** bỏ JSON vào `data/_local/raw/` → `python data/ingest_finance.py YYYYMM`
- ✅ **Spending ledger (2026-06-22):** bảng `card_txn` + `data/ingest_cards.py` — nạp giao dịch thẻ từ private card sources verified locally, từ `data/_local/raw/cards/*.csv` (2025-02→2026-06). Idempotent, rebuild mỗi lần chạy.
- ✅ Repo paths aligned to `C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio/`
- ✅ Root finance compatibility copies removed; Actio is now canonical for `finance-data/` and `personal-finance/`.
- ⬜ (next) Đổ thêm snapshot tháng kế để bật query trend net-worth/allocation (phục vụ quỹ mua nhà)
- ⬜ (defer) Bảng transaction ledger CHỨNG KHOÁN (mua/bán) — chưa có data trade history

### Pending manual
- ⬜ Copy `portfolio.example.json` → `portfolio.json` và edit holdings thật
- ⬜ Register EDINET API key (manual tại disclosure2.edinet-fi.go.jp)
- ⚠️ Check external slash commands in `~/.claude/commands/`: if they still point to an old path, update them to `C:/Users/HUY/workspace/ai-project-opus/opus-animus/opus-actio/`.

## Next step — MVP-B (planned ~2026-05-27)

1. Tạo `tools/run_actio_batch.py` — wrapper gọi `claude` CLI subprocess với prompt template
2. Setup Task Scheduler: 06:00 JST daily → `python run_actio_batch.py morning`
3. Output ghi vào `data/cache/morning-YYYY-MM-DD.md` + `.json`
4. Static HTML viewer `viewer/index.html` đọc cache, render cards (reuse html-kit)
5. (Optional) Cloudflare Tunnel để truy cập viewer từ iPhone
6. Vẫn 0 API metered — Claude Code Pro CLI làm engine

## Deferred (chờ MVP-B chạy thực tế)
- ⏸ FINOPT Vite + React PWA (Vercel deploy) — chỉ build nếu MVP-B không đủ
- ⏸ `risk-manager` custom skill — scope sau khi xem real usage
- ⏸ Yahoo Finance proxy server — chỉ cần nếu user muốn live quote trong viewer

## Constraints

- KHÔNG hardcode credentials — `.env` only
- Skills markdown, không phải code Python; trigger-based invocation
- Disclaimer: not investment advice
- **MVP rule:** mọi feature mới phải verify 0 API metered cost trước khi build
