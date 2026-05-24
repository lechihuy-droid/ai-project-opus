---
name: edinet-fetcher
description: Fetch Japanese corporate filings (有価証券報告書, 四半期報告書, 臨時報告書) from EDINET API for any TSE-listed company. Use when user asks about Japanese stock filings, earnings reports, or financial disclosures from Japan.
---

# EDINET Fetcher

Pull filings từ **EDINET** (金融庁 Electronic Disclosure System) — hệ thống công bố báo cáo tài chính bắt buộc của Nhật, tương đương SEC EDGAR của Mỹ.

## When to use

- User hỏi về báo cáo tài chính / earnings của cty Nhật (vd: Toyota 7203, Sony 6758, Keyence 6861)
- Cần input filing JP cho skill `equity-research/earnings` hoặc `financial-analysis/3-statement-model`
- Cần check 臨時報告書 (extraordinary report) cho M&A, insider trading, material events

## Inputs

- `ticker` (4-digit JP securities code, vd: `7203`) hoặc `edinet_code` (vd: `E02144`)
- `doc_type`: một trong `annual` (有価証券報告書 / Yuho), `quarterly` (四半期報告書), `extraordinary` (臨時報告書), `semiannual` (半期報告書)
- `period`: optional, format `YYYY-MM` hoặc `YYYY-Qn`

## API endpoint

```
GET https://api.edinet-fi.go.jp/api/v2/documents.json?date=YYYY-MM-DD&type=2
```

- `type=1` = metadata only, `type=2` = include filing list
- Auth: `Subscription-Key` header (free tier, register tại disclosure2.edinet-fi.go.jp/weee0020.aspx)
- Document download: `GET /api/v2/documents/{docID}?type=1` (PDF) hoặc `type=5` (CSV/XBRL)

## Workflow

1. Resolve `ticker` → `edinet_code` qua bảng mapping (cached local CSV: `data/edinet-codes.csv`)
2. Query documents.json filter theo `secCode` + `docTypeCode` (120=Yuho, 140=Quarterly, 160=Extraordinary, 150=Semiannual)
3. Pick latest filing match `period` (hoặc latest nếu không specify)
4. Download XBRL package (`type=1` zip) — parse `XBRL/PublicDoc/*.xbrl` cho structured data
5. Extract main financial statements + MD&A section (経営者による財政状態及び経営成績の分析)
6. Return: `{filing_date, period, doc_url, financials: {revenue, op_income, net_income, eps, ...}, mdna_text}`

## Output format

```yaml
ticker: 7203
company: トヨタ自動車株式会社
filing_type: quarterly
period: 2026-Q1  # JP fiscal year start Apr
filing_date: 2026-08-08
doc_url: https://disclosure2.edinet-fi.go.jp/...
currency: JPY
financials:
  revenue: 11_500_000_000_000  # 11.5T yen
  operating_income: 1_350_000_000_000
  net_income: 980_000_000_000
  eps: 71.5
  shares_outstanding: 13_700_000_000
mdna_summary: "Q1 売上高は前年同期比+8.2%..."
```

## Notes

- EDINET only covers JP-incorporated entities. ADR Mỹ của cty Nhật (vd TM = Toyota ADR) → vẫn fetch qua 4-digit JP code 7203, không phải ADR ticker
- 適時開示 (timely disclosure / press release) ở **TDnet**, không phải EDINET — cần skill riêng nếu cần
- Fiscal year mặc định Apr–Mar; cty exception: Fast Retailing (9983) = Sep-Aug, Nintendo (7974) = Apr-Mar standard
- Liên kết với [[jp-fiscal-calendar]] để xác định `period` đúng

## Failure modes

- EDINET API rate limit: 10 req/sec → backoff exponential
- XBRL schema thay đổi hàng năm — cần version detection từ `taxonomyVersion` element
- Cty mới IPO trong 90 ngày → có thể chưa có Yuho, fallback sang 目論見書 (prospectus)
