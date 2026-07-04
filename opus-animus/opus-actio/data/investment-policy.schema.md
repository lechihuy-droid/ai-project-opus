# investment-policy.json - Schema

Investment Policy Statement (IPS) ma actio doc truoc khi review danh muc. File that: `data/_local/investment-policy.json` (gitignored). Template: `data/investment-policy.example.json` (tracked, placeholder; khong chua so du, thu nhap, holdings, hay target tien that).

## Root

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `risk` | object | yes | Capacity/tolerance policy inputs. |
| `bucket_targets` | object | yes | Asset allocation target theo goal bucket: `preservation`, `balanced`, `growth`. |
| `constraints` | object | yes | Hard limits for concentration and portfolio construction. |
| `rebalance` | object | yes | Drift threshold, review cadence, and tax-aware ordering. |
| `implementation` | object | no | Preferred account/product rails and philosophy. |
| `note` | string | no | Privacy/data-quality caveat. |

## risk

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `capacity` | enum | yes | `low`, `medium`, or `high`: objective ability to take risk. |
| `tolerance` | enum | yes | `conservative`, `moderate`, or `aggressive`: emotional willingness to take risk. |
| `policy_note` | string | no | How to reconcile capacity vs tolerance. |

## bucket_targets

Each bucket contains target fractions that should sum to approximately `1.0`.

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `equity` | number | yes | Target equity fraction, `0.0` to `1.0`. |
| `bond` | number | yes | Target bond/fixed-income fraction, `0.0` to `1.0`. |
| `cash` | number | yes | Target cash fraction, `0.0` to `1.0`. |
| `note` | string | no | Intended horizon or goal examples for the bucket. |

## constraints

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `max_single_name_pct` | number | yes | Maximum percent of investable portfolio in one single-name security. Broad index funds are not single-name. |
| `max_sector_pct` | number | yes | Maximum percent of investable portfolio in one sector. Broad index funds may be grouped as `broad_index` unless holdings look-through data exists. |
| `core_satellite` | string | no | Core/satellite construction rule. |

## rebalance

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `drift_threshold_pct` | number | yes | Rebalance trigger in percentage points versus bucket target. |
| `cadence` | string | yes | Review cadence, for example `quarterly_review`. |
| `tax_order` | string | yes | Tax-aware order of operations to mention in output. |

## implementation

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `equity_core` | string | no | Preferred equity core rail. |
| `retirement` | string | no | Preferred retirement account rail. |
| `overflow` | string | no | Taxable overflow rail. |
| `philosophy` | string | no | Plain-language investment philosophy. |

## Analysis rules

- Read policy, profile, and goals before judging the portfolio.
- For growth-bucket drift, compare current invested assets against `bucket_targets.growth`.
- Flag `single-name > constraints.max_single_name_pct`; the current `data/portfolio.json` should flag Hitachi if unchanged.
- Flag `sector > constraints.max_sector_pct` when sector data or a documented local mapping exists.
- Explain risk capacity vs tolerance explicitly; capacity can permit more risk than tolerance, but tolerance caps behavior that the client cannot hold through drawdowns.
- Never write client balances, exact income, exact holdings, or exact goal amounts into tracked policy files.
