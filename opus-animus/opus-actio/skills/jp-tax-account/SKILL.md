---
name: jp-tax-account
description: Apply Japanese tax rules for individual investor accounts — NISA (新NISA), iDeCo, 特定口座, 一般口座. Handle dividend/capital gains tax, foreign tax credit for US holdings, and account-allocation strategy. Use when user asks about JP investment taxes, NISA optimization, or which account to buy in.
---

# Japan Tax Account Skill

Áp dụng thuế Nhật cho retail investor — quyết định mua trong account nào, tính thuế cổ tức / capital gain, foreign tax credit cho US stock.

## When to use

- User hỏi "mua trong NISA hay 特定口座?"
- Tính thuế cổ tức Mỹ (10% US withholding + 20.315% JP) → foreign tax credit
- Optimize portfolio allocation giữa NISA / iDeCo / taxable
- Year-end planning: 損益通算 (loss offset), 繰越控除 (loss carryforward 3 năm)

## Account types (2024+ rules)

### 新NISA (2024-)
- **成長投資枠** (Growth slot): ¥2.4M/year, lifetime cap ¥12M trong slot này
- **つみたて投資枠** (Tsumitate slot): ¥1.2M/year, lifetime cap ¥6M, chỉ buy funds approved by FSA
- **Total lifetime cap: ¥18M**
- Hold forever, gain + dividend **tax-free**
- Sell → restore quota next year (rolling cap)
- **US stocks: được phép trong 成長投資枠**, nhưng US withholding 10% trên dividend **không refund** được (vì NISA không nộp thuế JP để claim credit)

### iDeCo (個人型確定拠出年金)
- Contribution **deductible** khỏi income tax + resident tax (lớn nhất ¥816K/year cho 自営業, ¥276K cho 会社員 không có DC)
- Lock đến 60 tuổi
- Tại retirement: 退職所得控除 hoặc 公的年金等控除 — generous tax brackets
- Phù hợp cho long-term retirement, KHÔNG phù hợp money cần dùng sớm

### 特定口座 (Tokutei, w/ tax withholding)
- Broker tự withhold 20.315% (15.315% income + 5% resident) trên gain + dividend
- KHÔNG cần file 確定申告 nếu chỉ có income này
- Có thể opt-in 確定申告 để dùng foreign tax credit hoặc loss offset across brokers

### 一般口座 (General)
- DIY tax — tự tính, tự file. Hầu như không nên dùng trừ khi có lý do đặc biệt

## Decision rules

```
IF asset = JP dividend-paying stock AND horizon > 5y:
    → NISA 成長投資枠 (avoid 20.315% on dividend forever)
IF asset = US dividend stock (vd VYM, SCHD):
    → 特定口座 (vì US 10% withholding refundable qua foreign tax credit; NISA mất phần này)
IF asset = US growth stock no dividend (vd GOOGL, NVDA):
    → NISA 成長投資枠 (no dividend = no withholding loss; gain tax-free)
IF asset = global index fund (eMAXIS Slim 全世界, S&P500):
    → つみたて投資枠 first (¥1.2M), overflow → 成長投資枠
IF age < 50 AND extra cashflow:
    → max iDeCo first (deduction + lock OK), then NISA
```

## Tax calculation cases

### Case 1: JP stock in 特定口座
```
Gross dividend: ¥10,000
Tax withheld (20.315%): ¥2,031
Net: ¥7,969
→ Không cần file gì
```

### Case 2: US stock in 特定口座
```
Gross dividend: $100
US withholding (10%, treaty): $10
After US: $90
JP withholding on $90 @ 20.315%: $18.28
Net: $71.72
→ File 確定申告 + Form 外国税額控除明細書 → claim back portion of $10
→ Effective tax ≈ 20.315% only (US withholding refunded as JP credit)
```

### Case 3: Loss offset
- Lỗ ¥500K trong 特定口座 A + Lãi ¥800K trong 特定口座 B
- Default: 2 broker withhold riêng → bị over-withheld
- Fix: 確定申告 với 損益通算 → net ¥300K, refund part of tax
- Loss > gain → carry forward 3 năm với điều kiện file 確定申告 hàng năm

## Outputs

Khi user query "mua X trong account nào":
```yaml
ticker: VYM
asset_class: us_dividend_etf
recommended_account: 特定口座 (源泉徴収あり)
reason: |
  VYM yield ~3%, US withholding 10% chiếm % đáng kể của return.
  Trong NISA, mất luôn 10% này (không claim được foreign tax credit).
  Trong 特定口座, claim được qua 確定申告 → effective tax 20.315%.
alternative: NISA 成長投資枠 nếu user không muốn file 確定申告 hàng năm
expected_after_tax_yield:
  在NISA: 2.70%  # 3% × 0.9 (US WH)
  在特定: 2.39%  # 3% × 0.9 × 0.79685 (JP)
  在特定+credit: ≈2.65%
```

## Failure modes

- Rule thay đổi (e.g. 新NISA bắt đầu 2024) — verify hàng năm
- Treaty rate US-JP cho dividend = 10% (cá nhân), 0% cho qualified pension — không nhầm với 30% default
- Capital gain (KHÔNG phải dividend) của US stock: 0% US withholding, 20.315% JP only
- 配当控除 (JP dividend credit) chỉ apply cho JP stock — không cho foreign

## Related

- [[edinet-fetcher]] — lấy filing JP để check dividend policy
- [[jp-fiscal-calendar]] — ex-div date, 権利付き最終日 cho JP stock
