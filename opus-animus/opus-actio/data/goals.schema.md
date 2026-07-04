# Goals Schema

`data/_local/goals.json` stores the client-specific goal portfolio. `data/goals.example.json` is a tracked placeholder with the same shape.

## Root

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `goals` | array | yes | List of financial goals. Order is not authoritative; analysis should sort by priority and horizon. |
| `monthly_savings_capacity_jpy` | integer or null | no | Optional override. If null, compute from profile income minus expense. |
| `note` | string | no | Free-form caveat for data quality or pending user input. |

## Goal

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `id` | string | yes | Stable machine id, lowercase snake/kebab style. Examples: `emergency`, `house`, `retirement`. |
| `name` | string | yes | Human-readable label. |
| `type` | string | yes | Goal category. Current expected values: `emergency`, `house`, `retirement`, `education`, `travel`, `other`. |
| `priority` | string | yes | One of `must_not_fail`, `important`, `aspirational`. |
| `target_jpy` | integer or null | yes | Target amount in JPY. Use null when the target is intentionally not estimated yet. |
| `target_note` | string | no | Explains target basis when target is approximate or scoped. |
| `horizon_months` | integer | yes | Months until funds are needed. Use `0` for already-required reserves such as emergency fund. |
| `risk_bucket` | string | yes | One of `preservation`, `balanced`, `growth`. Preservation fits short-horizon or must-not-fail money; growth fits long-horizon money. |
| `funding_source` | string | yes | Funding pool used by the goal, for example `cash`, `idle_cash_beyond_ef`, `invested`, or `future_savings`. |

## Analysis Rules

- Fund `must_not_fail` goals before lower-priority goals.
- Match horizon to risk bucket: short horizon implies preservation; long horizon can tolerate growth assets.
- Compare `monthly_needed` with savings capacity when `target_jpy` and `horizon_months` are both usable.
- Treat null targets as planning gaps, not as fully funded goals.
