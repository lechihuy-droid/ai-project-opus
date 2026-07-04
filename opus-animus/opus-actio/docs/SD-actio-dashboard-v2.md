# SD + TASK — Actio dashboard v2 (advisory cockpit) — FRONTEND ONLY

**Owner spec:** Claude (Opus) · **Thực thi:** Codex · **Ngày:** 2026-06-24
**Loại:** UI rework. Backend `/api/actio/overview` ĐÃ XONG (contract mới bên dưới) — KHÔNG sửa backend.

> ⚠️ FRESH START: KHÔNG hỏi tiếp tục/mới, KHÔNG đọc ai/status.md. Đọc file này + làm thẳng.

## 0. Mục tiêu (theo review chuyên gia tài chính)
Trang hiện là "balance-sheet viewer". Nâng thành "advisory cockpit". Sửa 6 lỗi:
1. **Framing equity** — hiện tô đỏ "equity 94.4% vs 85% ⚠" (chỉ là *sleeve* = 24% tài sản) → người đọc tưởng over-risk, dễ xui bán cổ phiếu. PHẢI hiển thị allocation **2 cấp**: household (equity ~23%) làm chính + sleeve phụ; KHÔNG tô đỏ drift; thay bằng cảnh báo **idle cash drag** (warn, không đỏ) kèm phí cơ hội ¥/năm.
2. **Action panel** lên ĐẦU (sau hero) — render `actions` synthesized.
3. **Goal funding** đã netted tuần tự ở backend; thêm dòng `surplus_cash`.
4. **Mortgage scenario** panel mới.
5. **FIRE** show dải `fire_range`/`proj_range`, bỏ false precision.
6. **Spending variance** (delta vs avg + spike), **FX**, **Protection**, **NW trend**, **staleness badge**.

## 1. File + phạm vi sửa
File DUY NHẤT: `C:/Users/HUY/workspace/ai-project-opus/opus-animus/apps/opus-home/index.html`.
Thay **chỉ** khối từ comment `// ── Actio helpers ─────` cho tới hết `function ActioView() { ... }` (ngay trước `// ── Loading`). Giữ nguyên mọi thứ khác. Có thể giữ/mở rộng helpers `yen`, `man`, `PRIO`, `StatRow`. Tái dùng component có sẵn: `Card`, `Label`, `GoldBar` (pct 0..1), `Badge` (variant warn/danger/ok), `StatusDot`, `Loading`. JSX babel, dark theme dùng CSS vars (`--gold`,`--text`,`--muted`,`--verdigris`,`--warn`,`--danger`,`--elevated`,`--border-subtle`,`--dim`,`--text-soft`). Giữ `ACTIO_WORKFLOWS` const + section reference collapse ở cuối. Tiếng Việt terse.

## 2. Contract — `/api/actio/overview` (sample THẬT)
```json
{
 "ok": true, "as_of": "2026-06-21",
 "staleness": {"as_of":"2026-06-21","age_days":3,"stale":false},
 "balance": {"true_net_worth":15931781,"total_liabilities":0,"cash_total":12083123,
   "invested_total":3848658,"idle_cash_beyond_ef":9683123,"cash_pct":75.8,"invested_pct":24.2,
   "alloc_household":{"equity":22.8,"bond":1.3,"cash":75.8},
   "alloc_sleeve":{"equity":94.4,"bond":5.6,"cash":0.0},
   "accounts":[{"name":"SMBC ...","type":"bank","balance_jpy":10352466}, ...]},
 "cashflow": {"income":560000,"expense":200000,"savings":360000,"savings_rate_pct":64.3,
   "risk_capacity":"high","risk_tolerance":"moderate"},
 "opportunity": {"idle_cash":9683123,"assumed_real_return_pct":4.0,"annual_cost":387324,"note":"..."},
 "goals": [{"id":"emergency","name":"Emergency fund","priority":"must_not_fail","target":1200000,
   "funded":1200000,"pct":100.0,"horizon_months":0,"monthly_needed":0,"on_track":true}, ...],
 "surplus_cash": 5883123,
 "ips": {"max_single_name_pct":10,
   "violations":[{"code":"6501","name":"Hitachi","pct":24.8},{"code":"7011","name":"Mitsubishi Heavy Industries","pct":10.2}],
   "alloc_sleeve":{"equity":94.4,"bond":5.6,"cash":0.0},
   "alloc_household":{"equity":22.8,"bond":1.3,"cash":75.8},
   "growth_target":{"equity":85.0,"bond":15.0,"cash":0.0},
   "drift_pp":{"equity":9.4,"bond":-9.4},
   "positions":[{"code":"6501","name":"Hitachi","cls":"JP","value":952800,"pct":24.8,"single_stock":true}, ...]},
 "retire": {"age":38,"retire_age":60,"core":25714285,"bridge":12000000,"fire_number":37714285,
   "projected_at_retire":59671010,"surplus":21956725,"fi_age":54,"contrib_monthly":123000,
   "swr_pct":3.5,"real_return_pct":4.0,"nenkin_annual":1500000,"on_track":true,
   "fire_range":[34500000,42000000],"proj_range":[52446714,68092024]},
 "mortgage": {"price":45000000,"down_payment_pct":0,"loan":45000000,"closing_costs":3600000,
   "rate_pct":0.6,"term_years":35,"monthly_payment":118813,"tax_credit_yr1":315000,
   "post_purchase_cash":8483123,"dti_pct":21.2,"payment_plus_expense":318813,"cashflow_after":241187,"note":"..."},
 "spending": {"months":[{"source_month":"202607","total":137198}, ...],"latest_month":"202607",
   "latest_total":137198,"prev_avg":194280,"delta_vs_avg_pct":-29.4,
   "categories":[{"category":"travel","total":113040,"n":8}, ...],
   "category_delta":[{"category":"travel","total":113040,"delta":50000,"spike":false}, ...]},
 "protection": {"life_insurance":null,"medical_insurance":"shakai","disability_income":"shakai_shoubyou_teate",
   "pension_enrolled":"kosei_nenkin","pension_since":2017,"gaps":["life_insurance"]},
 "fx": {"usd_invested":2118560,"usd_invested_pct":55.0,"base_currency":"JPY","repatriation_plan":"none","note":"..."},
 "trend": [{"as_of":"2026-06-21","true_net_worth":15931781}],
 "review_due": [{"skill":"retire","cadence":"annual","overdue_days":null,"cmd":"/actio-retire"}, ...],
 "actions": [{"rank":1,"kind":"deploy","title":"Deploy idle cash ...","why":"..."}, ...]
}
```

## 3. Layout (thứ tự = visual hierarchy, fix lỗi #1)
1. **Hero (Card gold):** `yen(balance.true_net_worth)` lớn + `man()` + `nợ yen(total_liabilities)` + `as_of`. Nếu `staleness.stale` → `<Badge variant="danger">dữ liệu cũ {age_days}d</Badge>`. Bên phải: `cash_pct% / invested_pct%` + GoldBar(invested_pct/100) + dòng `capacity {risk_capacity} · tolerance {risk_tolerance}`.
2. **⚡ Action ngay (Card gold, NGAY sau hero):** list `actions` — mỗi item: số `rank` (gold), `title` (bold), `why` (muted nhỏ). Đây là điểm nhấn chính.
3. **Allocation 2 cấp (Card):** chính = `alloc_household` (3 dòng equity/bond/cash với GoldBar). Dưới: dòng nhỏ muted `"Trong sleeve đầu tư: equity {alloc_sleeve.equity}% (vs mục tiêu growth {ips.growth_target.equity}%) — chỉ là {invested_pct}% tài sản, KHÔNG phải household over-risk."`. Rồi **callout warn** (KHÔNG đỏ): `"Idle cash {yen(opportunity.idle_cash)} ở ~0% → phí cơ hội ~{yen(opportunity.annual_cost)}/năm @ {opportunity.assumed_real_return_pct}%."`.
4. **Grid 2 cột: Balance + Cashflow** (giữ StatRow như cũ). Balance thêm dòng `Surplus cash (sau goals): yen(surplus_cash)`. Cashflow giữ savings rate bar.
5. **Goals (Card):** mỗi goal: tên + Badge(PRIO[priority]) + `yen(funded)/yen(target)` + GoldBar(pct/100) + dòng nhỏ `{pct}% · {monthly_needed>0? "cần "+yen(monthly_needed)+"/th "+(on_track?"✓":"⚠"):"đủ ✓"}`.
6. **Grid 2 cột: Retire + IPS.**
   - Retire: Badge ok `FI @{fi_age}`. StatRow: `FIRE (SWR {swr_pct}%)` = `yen(fire_number)` + sub `dải {man(fire_range[0])}–{man(fire_range[1])}`; `Dự phóng @{retire_age}` = `yen(projected_at_retire)` + sub `dải {man(proj_range[0])}–{man(proj_range[1])}`; `Thặng dư` = `yen(surplus)` (verdigris nếu ≥0). Dòng nhỏ: `core {man(core)} + bridge {man(bridge)} · đóng {yen(contrib_monthly)}/th · 年金 {man(nenkin_annual)}/năm từ 65 · real {real_return_pct}%`.
   - IPS: tiêu đề "Concentration (trong sleeve)". Nếu `violations` rỗng → "Không vi phạm ✓" (verdigris). Nếu có → mỗi violation: tên + code + `{pct}%` màu **warn (amber, KHÔNG danger-red)**, kèm 1 dòng muted `"vượt trần {max_single_name_pct}% — concentration trong sleeve, không phải household risk"`. KHÔNG hiển thị drift_pp như cảnh báo đỏ.
7. **Mortgage scenario (Card, nếu `mortgage`):** Label "Kịch bản vay nhà (minh hoạ)". StatRow: `Giá nhà` yen(price); `Vay (full {100-down_payment_pct}%)` yen(loan); `諸費用 ({...}%)` yen(closing_costs); `Trả/tháng @ {rate_pct}% × {term_years}y` yen(monthly_payment); `DTI` `{dti_pct}%` (warn nếu >30 — ở đây 21%); `住宅ローン控除 năm 1` yen(tax_credit_yr1) (verdigris); `Tiền mặt sau mua` yen(post_purchase_cash); `Cashflow sau trả góp` yen(cashflow_after) (verdigris nếu >0). Dòng note muted = `mortgage.note`.
8. **Grid 3 cột nhỏ: Spending + FX + Protection.**
   - Spending: Label `Chi tiêu — {latest_month}`. Dòng tổng: `{yen(latest_total)}` + Badge(`delta_vs_avg_pct<=0?"ok":"warn"`) `{delta_vs_avg_pct}% vs avg`. List `categories.slice(0,5)`: category ×n → yen(total); nếu category nằm trong `category_delta` có `spike:true` → thêm ` 🔺` đỏ.
   - FX: Label "Tỷ giá". `USD đầu tư {fx.usd_invested_pct}%` = yen(usd_invested); dòng note muted `fx.note`; `repatriation: {repatriation_plan}`.
   - Protection: Label "Bảo vệ". Dòng: y tế `medical_insurance`, thu nhập tàn tật `disability_income`, hưu `pension_enrolled` (từ `pension_since`). Nếu `gaps` không rỗng → Badge warn `thiếu: {gaps.join(", ")}`.
9. **NW trend (Card):** nếu `trend.length>=2` → vẽ list/sparkline đơn giản (as_of → yen) + delta đầu-cuối. Nếu `<2` → muted "Chỉ 1 snapshot ({as_of}) — cần snapshot thứ 2 để có xu hướng."
10. **Review due (Card):** giữ như cũ (chip `cmd` + cadence + overdue).
11. **Skill reference collapse** (`<details>` + `ACTIO_WORKFLOWS`) + disclaimer cuối `Số liệu từ finance.db (local) · Không phải lời khuyên đầu tư`.

## 4. Verify
- `useEffect` fetch `/api/actio/overview`; `err`/`Loading` states giữ.
- Mọi field optional phải guard (`mortgage &&`, `retire &&`, `trend.length`).
- Không format cứng số thật vào JSX (lấy từ API). KHÔNG đỏ cho equity drift.
- File vẫn parse (babel) — không phá JSX khác.

## 5. Out of scope
- KHÔNG sửa backend, KHÔNG sửa file khác, KHÔNG commit.
