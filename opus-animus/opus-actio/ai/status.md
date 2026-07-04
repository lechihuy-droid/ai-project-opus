# STATUS - opus-actio
**Updated:** 2026-07-05
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

### Plan v3.1 — review 2 vòng + bảo hiểm (2026-07-04, chiều)
- ✅ `data/_local/review-plan-v3-2026-07.md` — review trung/dài hạn: quan điểm plan + verify toán độc lập + đánh giá 生命保険 + 2 vòng phản biện (山崎元-style, FP協会/CFP-style) + final
- ✅ 3 sửa chính xác: **DCA pool ¥3.68M → ¥6.08M** (trừ EF 2 lần) · FI-age deploy-idle ~48 → ~50 · **FIRE thiếu điều kiện housing** (mortgage 35y trả tới ~75, đoạn 60→75 ≈ ¥21M ngoài FIRE — quyết định năm 14 khi hết 控除)
- ✅ Bảo hiểm chốt (mục 1.5 plan): 死亡 không mua (0 dependents) · 医療 không mua (高額療養費+EF) · 就業不能 tự bảo hiểm (option 掛け捨て) · nhà: 団信+火災 bắt buộc, 地震 khuyến nghị mạnh (vào gate 2.2) · 年金 10-year rule ~2027
- ✅ `plan-v3.md` bump v3.1 (changelog trong header) + `plan-config.json` (dca.total 6,080,000, tranche title) — API nhận ngay, UI DCA hiển thị theo
- ✅ Codex repo chores: toggle ¥↔万 trong PlanView (verify: Total ¥277,148 → 28万) + 2 commit: `5166f19` plan cockpit v3, `00b686b` harness hub
- ✅ Chờ thân chủ (đã trả lời 2026-07-05): vn_obligations=**có ¥30k/th VN** · ¥200k/tháng **có gồm rent** · bảo hiểm 1.5 → yêu cầu thêm khuyến nghị 就業不能保険

### Plan v3.2 — cập nhật theo trả lời thân chủ (2026-07-05)
- ✅ Chi phí thật 200k→**230,000** (200k sinh hoạt+rent + 30k remittance VN) — cập nhật `client-profile.json` (monthly_expense, profile.vn_obligations)
- ✅ EF 12 tháng 2.4M→**2.76M**; savings/tháng 277,148→**247,148** (savings rate 58%→52%, vẫn ✅) — cập nhật `goals.json`
- ✅ Waterfall + DCA tính lại: bond 30k→15k, DCA đệm 24,148→9,148 (tổng 247,148); DCA tranche one-off 6.08M→**5.72M** — cập nhật `plan-config.json` (version 3.2), thêm oneoff `insurance_review`
- ✅ Verify API sống ngay không cần code: `cashflow.expense=230000, savings_rate_pct=51.8` (actio.py đã đọc `client-profile.cashflow_jpy.monthly_expense` sẵn ở dòng ~290) · waterfall API = 247,148 · dca.total=5,723,123 · UI hiển thị đúng encoding (収入保障保険 v.v. — mojibake chỉ là artifact print Python trên console, không phải lỗi thật)
- ⚠️ **Known lag:** `idle_cash_beyond_ef`/`ef_buffer_12mo` trong finance.db vẫn baked theo EF cũ 2.4M (raw snapshot 202606, theo rule immutable không sửa raw/) — sẽ tự đúng khi ingest snapshot tháng kế tiếp; hiện phải trừ thủ công +360k khi tính DCA pool (đã làm trong plan-v3.md)
- ✅ Bảng NW Y1–Y5 (PHẦN II) và khối 3-năm dài hạn (PHẦN III) trong `plan-v3.md` **tính lại hoàn toàn chính xác** (thấp hơn bảng v3.1 ~4–15%, do remittance + recompute rigorous hơn — kết luận tổng thể không đổi, pool vẫn >> FIRE mọi kịch bản)
- ✅ Bảo hiểm 1.5 đổi quyết định: **死亡 → đổi sang MUA** 収入保障保険 (~¥40k/th benefit, 15-20y, ước phí ¥1-2k/th) — vì remittance làm PV nghĩa vụ ~¥5.9M (~37% NW) không còn bỏ qua được; **就業不能保険 KHUYẾN NGHỊ mua** mức khiêm tốn (~¥150k/th benefit, chờ 18mo khớp 傷病手当金, ước phí ¥3-5k/th) — review/hủy khi invested pool ≥20-25M (~Y2-Y3)
- ✅ `plan-v3.md` bump v3.2 (changelog đầy đủ trong header)
- ⬜ Còn mở: remittance kéo dài bao lâu (ảnh hưởng retirement expense nếu tiếp tục sau 60) · xin báo giá thật 2 gói bảo hiểm (`insurance_review` deadline 2026-09-30) · commit các thay đổi này khi user yêu cầu

### KPI status engine refactor (2026-07-05, chiều)
- User đưa refactor prompt lớn (6 phase: status band, next-action banner, group 4 nhóm, format compact, a11y, xoá FI card trùng). Claude làm Phase 0 discovery trước khi giao Codex — phát hiện 3 mismatch với giả định đề bài (không JS test framework, verdict tính ở backend không phải frontend, currency card là string đã format sẵn không phải số thô) + xác nhận 3 bug thật (drift không bao giờ lên breach dù vượt gần 2× ngưỡng; DTI 34.2%/35% hiện "ok" sai; contrib 0% trước ngày lương hiện "violation" sai thay vì pending) — hỏi user 3 quyết định phạm vi trước khi code (currency fix ở backend, áp 4-state cho cả 12 KPI, test bằng pytest có sẵn).
- ✅ Viết `docs/BD-kpi-status-refactor.md` — BD chi tiết cho Codex: `kpi_status.py` (pure fn 4 kind: threshold_band/count_step/day_severity/boolean_flip), pytest, wire 12 KPI trong `actio.py`, `_fmt_compact()`, `next_action` + `action_templates` trong plan-config, `nisa_lifetime` (N/A + TODO, không bịa số), PlanView 4 nhóm + banner + icon/aria-label + bỏ card `fi` trùng hero.
- ✅ Codex implement xong, không commit/push. Claude verify độc lập:
  - `pytest opus-consilium/api/tests/ -v` → **10/10 pass** (kể cả `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1` — plugin `hydra` cài global không tương thích Python 3.11, phải tắt autoload khi chạy pytest cho project này từ giờ)
  - Đọc lại `kpi_status.py` + diff `actio.py` khớp 100% BD
  - Restart `run_dashboard.py` (load code mới) → curl xác nhận **3 bug đã fix với data thật**: drift 9.4pp→**breach** (trước max chỉ warn) · DTI 34.2%/35%→**warn** (trước "ok" sai) · contrib 0%→**pending** (trước "violation" sai, vì hôm nay 07-05 chưa tới payday_day=25)
  - Browser verify: banner Next Action hiện đúng breach cao nhất (idle_cash), 4 nhóm Foundation/Structure/Growth/Governance render đúng, card `fi` đã biến mất khỏi grid (chỉ còn ở hero badge), NISA lifetime card hiện "N/A" + note TODO (không bịa số), `aria-label="breach"` có trên DOM, console sạch, số tài chính (net worth/FIRE/waterfall) không đổi so với trước refactor
  - 1 lần gặp "renderer frozen"/"page still loading" trên tab cũ — xác nhận chỉ là glitch của công cụ browser automation (tab mới render bình thường ngay), không phải bug code
- ⬜ TODO còn lại (đã ghi trong BD/next_action payload): nguồn dữ liệu NISA lifetime thật, báo giá bảo hiểm — chưa liên quan file này. Chưa commit thay đổi Phase-refactor này.

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
