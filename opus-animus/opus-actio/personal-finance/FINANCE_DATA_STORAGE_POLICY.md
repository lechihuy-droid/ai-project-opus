# Finance Data Storage Policy

**Project:** Personal Finance Plan Japan
**Owner:** Le Huy
**Created:** 2026-06-02
**Purpose:** Define how financial data should be stored safely for the personal finance planning project.

---

## 1. Core Rule

Do **not** store sensitive exact financial information in GitHub.

GitHub may store:

- planning framework
- rounded ranges
- derived metrics
- decisions
- action plans
- review history
- assumptions

GitHub should not store:

- exact bank balances
- account numbers
- card numbers
- MyNumber or tax identifiers
- employer salary slips
- insurance policy numbers
- exact family personal details
- passwords, tokens, broker login data

---

## 2. Two-Layer Storage Model

### Layer A — Private Local Data

Store exact numbers only in a local/private place controlled by the user.

Recommended options:

- local spreadsheet on personal computer
- encrypted note or password manager note
- private household budget app
- offline CSV file

This layer can contain exact values such as:

```text
Net salary: ¥xxx,xxx
Rent: ¥xx,xxx
Cash balance: ¥x,xxx,xxx
NISA balance: ¥xxx,xxx
Debt: ¥xxx,xxx
```

This layer is the source for detailed calculations.

### Layer B — GitHub Project Artifact

Store only safe planning summaries in GitHub.

Example:

```text
Monthly net income: ¥350k–¥450k
Monthly expense: ¥220k–¥280k
Emergency fund status: 3–6 months
Savings rate: 20–30%
Debt: none
NISA status: opened, monthly contribution started
Risk profile: balanced
```

This layer is used for AI review, action planning, and historical tracking.

---

## 3. Data Granularity Rule

Use ranges instead of exact numbers.

| Data type | Store exact? | Store in GitHub as |
|---|---:|---|
| Salary | No | range, e.g. `¥350k–¥450k/month` |
| Expense | No | range, e.g. `¥220k–¥280k/month` |
| Savings | No | range, e.g. `¥1.0M–¥1.5M` |
| Debt | No | bracket, e.g. `none / <¥500k / ¥500k–¥1M / ¥1M+` |
| NISA amount | No | contribution range or status |
| iDeCo amount | No | contribution range or status |
| Net worth | No | range or direction trend |
| Account number | Never | do not store |
| Tax ID / MyNumber | Never | do not store |

---

## 4. Recommended File Structure

```text
opus-animus/opus-actio/personal-finance/
  PERSONAL_FINANCE_PLAN_JP_v0.md
  FINANCE_DATA_STORAGE_POLICY.md
  snapshots/
    2026-06-finance-snapshot.md
  reviews/
    2026-06-review.md
  decisions/
    2026-06-nisa-ideco-decision.md
```

### Snapshot file

A snapshot records the user’s financial state using ranges.

### Review file

A review records observations and action items.

### Decision file

A decision file records why a financial decision was made.

---

## 5. Monthly Snapshot Template

```markdown
# Finance Snapshot — YYYY-MM

## 1. Income / Expense

- Monthly net income range: TBD
- Monthly expense range: TBD
- Monthly surplus range: TBD
- Savings rate range: TBD

## 2. Assets / Liabilities

- Cash reserve range: TBD
- Investment balance range: TBD
- Debt bracket: TBD
- Net worth trend: up / flat / down

## 3. Japan Accounts

- NISA status: not opened / opened / active monthly / paused
- iDeCo status: not opened / active / not suitable now / unknown
- Pension/employer DC status: TBD

## 4. Risk / Liquidity

- Emergency fund months: <3 / 3–6 / 6–12 / 12+
- Job stability: low / medium / high
- Dependents: yes / no / partial
- Japan stay assumption: <3 years / 3–5 years / 5–10 years / permanent

## 5. Goals

- 1-year priority: TBD
- 3-year priority: TBD
- 5–10 year priority: TBD

## 6. Consultant Notes

- Diagnosis:
- Key risk:
- Next action:
```

---

## 6. Decision Log Template

```markdown
# Finance Decision — YYYY-MM-DD — Topic

## Decision

TBD

## Context

TBD

## Options considered

1. Option A
2. Option B
3. Option C

## Reasoning

TBD

## Risk

TBD

## Review date

TBD
```

---

## 7. Update Workflow

### When user shares data in chat

1. Convert exact numbers into ranges.
2. Calculate derived indicators if needed.
3. Avoid copying sensitive raw data into GitHub.
4. Update the monthly snapshot or plan artifact.
5. Commit the sanitized version only.

### Example

User says:

```text
Lương sau thuế khoảng 392,000 yên, chi phí khoảng 250,000 yên.
```

Store in GitHub as:

```text
Monthly net income range: ¥350k–¥400k
Monthly expense range: ¥240k–¥260k
Estimated surplus range: ¥90k–¥160k
Savings rate range: 23–40%
```

---

## 8. Privacy Principle

The project artifact should be useful enough for planning, but not detailed enough to expose the user’s exact financial life if the repository or chat history is reviewed later.
