# portfolio.json — Schema

File chính: `data/portfolio.json` (copy từ `portfolio.example.json` và edit). Đừng commit version có holdings thật.

## Top-level fields

| Field | Type | Note |
|---|---|---|
| `owner` | string | Tên user (optional) |
| `base_currency` | `"JPY"` \| `"USD"` | Currency tổng hợp |
| `fx_rate` | object | `{USDJPY, updated}` — manual update khi cần |
| `target_allocation` | object | Decimal fractions, sum ≈ 1.0 |
| `accounts` | object | JP tax account state (NISA quota, 特定 loss carry, iDeCo YTD) |
| `positions` | array | Holdings hiện tại |
| `watchlist` | array | Tickers đang theo dõi nhưng chưa hold |

## Position object

| Field | Required | Note |
|---|---|---|
| `ticker` | yes | "7203" cho JP, "AAPL" cho US |
| `market` | yes | `"JP"` \| `"US"` |
| `name` | yes | Company name display |
| `qty` | yes | Số shares |
| `avg_price_jpy` \| `avg_price_usd` | yes | Avg cost theo currency của market |
| `account` | yes | `"nisa_growth"` \| `"nisa_tsumitate"` \| `"tokutei"` \| `"ideco"` |
| `added` | yes | YYYY-MM-DD |
| `thesis` | yes | 1 dòng tại sao hold |
| `stop_loss` | optional | Manual stop level |
| `target_1y` | optional | 1-year price target |

## Update workflow

1. Sau khi trade → manual edit `portfolio.json`
2. `/actio-portfolio` để re-check allocation
3. Khi thị trường biến động lớn → update `stop_loss` + `target_1y`
4. End of year → reset `accounts.*.used_yearly` về 0, archive YTD numbers

## Privacy

`portfolio.json` là local-only, không commit Git. `.gitignore` đã loại.
