# STATUS - opus-actio
**Updated:** 2026-05-20
**Current owner:** Claude

## Current objective

Workflow đầu tư cá nhân US + JP — **MVP-A: Claude Code-first** (0 API metered, dùng Pro flat-fee).

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

### Pending manual
- ⬜ Copy `portfolio.example.json` → `portfolio.json` và edit holdings thật
- ⬜ Register EDINET API key (manual tại disclosure2.edinet-fi.go.jp)

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
