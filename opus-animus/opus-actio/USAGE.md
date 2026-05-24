# opus-actio — Suggest Cách Dùng

Workflow gợi ý kết hợp **core skills** (Anthropic) + **3 custom JP skills** cho retail investor US + JP.

> Disclaimer: Skill draft analyst work — KHÔNG phải investment advice. Verify trước khi giao dịch.

---

## MVP-A: Claude Code-first (current — 2026-05-20)

**Triết lý:** Không build mobile app riêng, không burn Claude API metered. Dùng Claude Code Pro (flat-fee subscription) như engine, gõ slash commands trong terminal.

### 4 slash commands chính

| Command | Mục đích | Args |
|---|---|---|
| `/actio-morning` | Daily brief: US close + JP open + intel macro | (none) |
| `/actio-stock <ticker>` | Deep dive 1 ticker: verdict + targets + risks + tax | ticker |
| `/actio-portfolio` | Allocation snapshot + rebalance + risk flags | (none) |
| `/actio-tax <ticker> [amount]` | NISA / 特定 / iDeCo decision | ticker, amount |

### Setup MVP-A (one-time)

1. **Copy portfolio template:**
   ```powershell
   Copy-Item C:/Users/HUY/AI/opus-animus/opus-actio/data/portfolio.example.json `
             C:/Users/HUY/AI/opus-animus/opus-actio/data/portfolio.json
   ```
2. Edit `data/portfolio.json` với holdings thật (xem `data/portfolio.schema.md`).
3. (Optional) Register EDINET API key cho `actio-stock` JP filings.

### Daily routine gợi ý

| Time (JST) | Command | Output |
|---|---|---|
| 07:30 | `/actio-morning` | Overnight US close + JP earnings hôm nay |
| Trước trade | `/actio-stock <ticker>` | Phân tích trước khi đặt lệnh |
| Trước trade JP | `/actio-tax <ticker>` | Account decision |
| Chủ nhật | `/actio-portfolio` | Weekly review |

### Tại sao MVP-A?

- **0 API cost** — chạy trong Claude Code Pro flat-fee, không qua API metered
- **0 deploy effort** — không cần Vercel, không cần proxy server
- **Reuse infrastructure** — opus-consilium intel pipeline đã chạy daily 05:30 JST
- **Migrate dễ** — nếu muốn mobile sau, MVP-B sẽ build static viewer đọc cache, vẫn dùng cùng skills

### MVP-B (planned: tuần sau ~2026-05-27)

- Cron Task Scheduler: chạy `claude /actio-morning` 06:00 JST daily → ghi `data/cache/morning-YYYY-MM-DD.md`
- Static HTML viewer ở `opus-actio/viewer/index.html` → đọc cache, render cards
- Mobile view qua localhost hoặc Cloudflare Tunnel
- Vẫn 0 API metered

---

## Workflow 1: Theo dõi earnings cty JP

**Khi nào:** quarterly window (`jp-fiscal-calendar` báo earnings sắp release)

```
User: "Toyota 7203 sắp ra Q1 earnings, prep cho tôi"

[jp-fiscal-calendar]
→ Toyota FY=Apr-Mar, expected Q1 release ~2026-08-07 (TDnet 決算短信)

[edinet-fetcher]
→ Pull Q4 FY2025 Yuho (latest) + last 4 quarterly filings
→ Extract revenue/op-income trend, segment breakdown

[equity-research/earnings-preview] (core skill)
→ Build expectations: consensus, your model, key drivers (北米販売台数, 為替前提)
→ Output: earnings preview note với 3 scenarios

[equity-research/thesis] (core skill)
→ Update thesis tracker với pre-earnings position
```

**Output:** 1-page preview note + checklist các metric cần watch khi release.

---

## Workflow 2: Quyết định mua US stock — account nào?

**Khi nào:** trước khi đặt lệnh

```
User: "Mua $5K SCHD, để account nào?"

[jp-tax-account]
→ SCHD = US dividend ETF, yield ~3.5%
→ Decision: 特定口座 (源泉徴収あり)
→ Reason: NISA mất 10% US withholding (~$17.5/year on $500 div), 特定口座 claim được qua 確定申告
→ Effective tax: NISA 10% vs 特定口座+credit ~20.3%
→ Break-even: nếu user không file 確定申告 → NISA tốt hơn

Result table:
| Account       | After-tax yield | Note |
|---------------|----------------|------|
| NISA 成長     | 3.15%          | Tax-free JP nhưng mất 10% US |
| 特定 (no file)| 2.51%          | Bị double-tax |
| 特定 + 確定申告| 2.79%          | Claim credit → tốt nhất nếu file |
```

---

## Workflow 3: Screen ideas hàng tuần (cross-market)

**Khi nào:** Chủ nhật morning routine

```
User: "Screen ý tưởng tuần này: US value + JP small cap quality"

[equity-research/screen] (core skill)
→ US: P/E < 15, FCF yield > 6%, ROIC > 12%
→ JP: P/B < 1.2, ROE > 10%, cash/MCap > 30% (cash-rich theme)

[edinet-fetcher] cho mỗi JP candidate
→ Pull latest Yuho → verify cash position, segment quality
→ Filter: loại các 仕手株 / cyclical bottom traps

[equity-research/initiate] (core skill)
→ Top 3 candidates → initiation note (1-page each)

[jp-fiscal-calendar]
→ Đánh dấu next earnings date cho từng cty → set thesis-tracker alert
```

---

## Workflow 4: Year-end tax planning (Tháng 12)

**Khi nào:** Mid-December trước cuối năm thuế

```
User: "Year-end tax check"

[jp-tax-account]
→ Audit holdings:
  - Loss-harvest candidates trong 特定口座 (lỗ hiện tại > ¥500K?)
  - 損益通算 setup nếu có gain ở broker khác
  - 繰越控除 status (lỗ năm trước còn carry?)
  - NISA quota usage: 成長 ¥X / ¥2.4M used, つみたて ¥Y / ¥1.2M used

→ Action items:
  1. Sell [X stock] tại 特定口座 → realize ¥Z loss để offset gain
  2. Buy back sau 1 ngày (no wash-sale rule ở JP — legal!)
  3. Fill remaining NISA quota với [Y stock] trước 12/30

→ Estimated tax saving: ¥W
```

---

## Workflow 5: M&A / activist event JP

**Khi nào:** TDnet alert hoặc news cty target hold

```
User: "Toyota Industries 6201 bị TOB rồi đúng không?"

[edinet-fetcher] doc_type=extraordinary
→ Pull 公開買付届出書 (TOB notification) + 意見表明報告書 (target opinion)
→ Extract: TOB price, premium %, conditions, deadline

[equity-research/catalysts] (core skill)
→ Update catalyst calendar:
  - TOB price ¥XYZ vs spot ¥ABC = N% premium
  - Acceptance deadline: YYYY-MM-DD
  - Risk: counter-bid? Antitrust review?

[jp-tax-account]
→ Nếu tender → capital gain in 特定口座 = 20.315% tax
→ Nếu hold qua delisting → cash-out tax-treated khác (確定申告 mandatory)
```

---

## Workflow combo nhanh (slash commands gợi ý)

Sau khi cài plugin core, gõ trong Claude:

| Command | Workflow |
|---|---|
| `/earnings-preview 7203` | Toyota Q-ahead preview (auto-resolve fiscal qua jp-fiscal-calendar) |
| `/screen us-value` | US value screen → 5 ideas |
| `/screen jp-quality` | JP small-cap quality screen (xài EDINET cho fundamentals) |
| `/morning-note` | Daily: gainers/losers US+JP + earnings hôm nay + thesis updates |
| `/tax-check eoq` | Quarterly tax-status review (loss-harvest opportunity, NISA quota) |

---

## Setup ban đầu

1. **Clone Anthropic plugins:**
   ```powershell
   cd C:/Users/HUY/AI/opus-animus/opus-actio
   git clone --depth=1 https://github.com/anthropics/financial-services.git _ext
   Copy-Item -Recurse _ext/plugins/vertical-plugins/equity-research ./plugins/
   Copy-Item -Recurse _ext/plugins/vertical-plugins/financial-analysis ./plugins/
   Remove-Item -Recurse -Force _ext
   ```

2. **Register EDINET API key (free):**
   - https://disclosure2.edinet-fi.go.jp/weee0020.aspx → register → copy Subscription-Key
   - Save vào `C:/Users/HUY/AI/opus-animus/.env`:
     ```
     EDINET_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

3. **Test workflow 1** với Toyota 7203 → verify end-to-end pipeline.

---

## Khi nào cần bổ sung custom skill nữa?

- **TDnet fetcher** — nếu cần earnings reactions real-time (TDnet release nhanh hơn EDINET 30-90 ngày)
- **JP broker API** — SBI / Rakuten / Monex để pull position list tự động
- **Holiday-aware scheduler** — adjust earnings windows quanh Golden Week, Obon, Year-end
- **Tobashi / window-dressing detector** — analyze Q4 vs Q1+Q2+Q3 sum để spot accounting anomalies
