---
name: jp-fiscal-calendar
description: Resolve Japanese corporate fiscal calendar — fiscal year-end, earnings release windows, ex-dividend dates (権利落ち), AGM dates (株主総会). Most JP companies use Apr-Mar fiscal year, but exceptions exist. Use when scheduling earnings reviews, dividend capture, or thesis-tracking for JP stocks.
---

# Japan Fiscal Calendar

Trả lời "khi nào cty Nhật ABC publish earnings", "ex-dividend khi nào", "AGM ngày nào". Handle fiscal year exceptions (Apr-Mar default nhưng ~30% cty khác).

## When to use

- Skill `equity-research/catalysts` cần earnings dates JP
- Thesis tracker cần next earnings window
- Dividend capture strategy → cần 権利付き最終日 (last day to hold for div)
- AGM voting / activist tracking

## Standard fiscal year mapping

| Quarter | Period (Apr-Mar FY) | Reporting window (決算発表) |
|---|---|---|
| **Q1** (第1四半期) | Apr – Jun | Late Jul – mid Aug |
| **Q2** (第2四半期 / 中間) | Jul – Sep | Late Oct – mid Nov |
| **Q3** (第3四半期) | Oct – Dec | Late Jan – mid Feb |
| **Q4 / FY** (本決算) | Jan – Mar | Late Apr – mid May |

- Deadline pháp lý: quarterly trong 45 ngày sau quarter-end; annual (Yuho) trong **3 tháng** sau FY-end
- Lệch deadline → đa số cty release trước deadline 1-2 tuần

## Fiscal year exceptions (Apr-Mar không phải universal)

| Pattern | Examples | FY end |
|---|---|---|
| **Jan-Dec** (calendar year) | nhiều cty manufacturing global, vd Murata 6981 sau 2021 | Dec |
| **Sep-Aug** | Fast Retailing 9983 (UNIQLO) | Aug |
| **Jul-Jun** | một vài retailer | Jun |
| **Apr-Mar** (default) | ~70% TSE: Toyota, Sony, Mitsubishi UFJ, etc. | Mar |

→ Always check EDINET filing `currentFiscalYearStartDate` element, đừng assume.

## Ex-dividend (権利落ち) logic

JP T+2 settlement. Để nhận dividend của period kết thúc ngày `D`:
- **権利付き最終日** = `D - 2` (last business day to BUY and still receive)
- **権利落ち日** = `D - 1` (price drops by div amount)
- **基準日** (record date) = `D` (cty fixes shareholder list)
- **配当支払日** (payment date) = ~2-3 tháng sau record date

Examples (FY ending Mar 31):
- FY full-year div: record date 31/3 → 権利付き最終日 ~29/3 (adjust for weekends)
- Mid-year (中間配当): record date 30/9 → 権利付き最終日 ~28/9

## AGM (定時株主総会)

- Phải tổ chức trong vòng **3 tháng** sau FY-end (Companies Act §296)
- Apr-Mar FY → AGM tập trung tuần cuối tháng 6 (gọi là **集中日**)
- 2026 expected peak AGM date: ~25/6/2026 (Thứ Năm) hoặc 26/6/2026 (Thứ Sáu)
- Voting deadline: 1 ngày trước AGM

## TDnet vs EDINET

| Source | Content | Timing |
|---|---|---|
| **TDnet** (適時開示) | Press release, earnings short-form (決算短信), guidance revision | Real-time, ~15:00 JST sau market close |
| **EDINET** | Yuho 有価証券報告書 (full annual), 四半期報告書 (full quarterly) | 30-90 ngày sau quarter end, dài chi tiết hơn |

→ Earnings reaction = TDnet 決算短信 (release đầu). Yuho release sau dùng cho deep model.

## Outputs

Query "Toyota next earnings":
```yaml
ticker: 7203
company: Toyota Motor Corporation
fiscal_year_end: 2026-03-31
next_event:
  type: Q1_earnings_release
  source: TDnet (決算短信)
  period: 2026-04-01 to 2026-06-30
  expected_release: 2026-08-07  # cty announce trước, hoặc estimate từ historical pattern
  expected_time: 13:00 JST (post-market)
upcoming:
  - 2026-08-07: Q1 決算短信 (TDnet)
  - 2026-08-15: Q1 四半期報告書 (EDINET, full detail)
  - 2026-09-29: 権利付き最終日 (mid-year div)
  - 2026-09-30: 中間配当基準日
  - 2026-11-06: Q2 決算短信
```

## Failure modes

- Cty thay đổi FY-end → check EDINET filing gần nhất, đừng dùng cached pattern
- 決算短信 release date không có rule cố định trong 45-day window → cần fetch từ TDnet pre-announcement hoặc IR page
- Holiday: 4/29 Showa, 5/3-5 Golden Week, 11/3 Bunka, 11/23 Kinrou → adjust business-day arithmetic
- Stock split / consolidation → ex-date có thể không phải `D - 1`

## Related

- [[edinet-fetcher]] — fetch filing sau khi date xác định
- [[jp-tax-account]] — 権利付き最終日 + holding period cho 配当控除 eligibility
