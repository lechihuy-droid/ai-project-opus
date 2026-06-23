# retirement.json - Schema

Retirement / Financial Independence (FI) inputs ma `/actio-retire` doc de tinh FIRE number, 年金 offset, va gap. File that: `data/_local/retirement.json` (gitignored). Template: `data/retirement.example.json` (tracked, placeholder; khong chua so du, thu nhap, dong gop, hay 年金 uoc tinh that).

## Root

| Field | Type | Required | Notes |
|---|---:|---:|---|
| `retire_target_age` | int | yes | Tuoi muc tieu nghi huu / dat FI. |
| `life_expectancy` | int | yes | Tuoi ky vong song (horizon ket thuc cua corpus). |
| `annual_expense_retire_jpy` | int | yes | Chi phi/nam khi nghi huu, real terms (gia tri hom nay). |
| `kosei_nenkin_est_annual_jpy` | int | yes | 厚生年金 (kosei nenkin) uoc tinh/nam. |
| `kosei_nenkin_start_age` | int | yes | Tuoi bat dau nhan 年金. Default `65`. |
| `real_return_pct` | number | yes | Loi suat thuc ky vong cua danh muc (da tru lam phat). |
| `inflation_pct` | number | yes | Lam phat gia dinh. |
| `safe_withdrawal_rate_pct` | number | yes | Safe Withdrawal Rate (SWR). Default `3.5`. |
| `idecho_monthly_jpy` | int | no | Dong iDeCo/thang. |
| `nisa_monthly_jpy` | int | no | Dong NISA tsumitate/thang. |
| `current_invested_source` | string | yes | Nguon lay von dau tu hien co. Mac dinh `"finance.db v_networth_true / invested_total"`. KHONG ghi so o day. |
| `note` | string | no | Privacy/data-quality caveat. |

## Analysis rules (cho `/actio-retire`)

- Doc `retirement.json` + `client-profile.json` + `goals.json` + `investment-policy.json` truoc khi tinh.
- Lay `invested_total` + true net worth tu `finance.db` snapshot moi nhat — KHONG hardcode.
- **Core corpus** = `(annual_expense_retire_jpy − kosei_nenkin_est_annual_jpy) / (safe_withdrawal_rate_pct/100)` — corpus nuoi phan chi phi 年金 khong ganh, tu `kosei_nenkin_start_age` tro di.
- **Bridge corpus** = chi phi DAY DU (chua tru 年金) cho giai doan `retire_target_age → kosei_nenkin_start_age`. Neu `retire_target_age >= kosei_nenkin_start_age` → bridge = 0.
- **FIRE number** = core + bridge.
- Project `invested_total` + dong gop hang thang toi `retire_target_age` o `real_return_pct` (FV annuity, real terms) → projected corpus → gap.
- Neu `annual_expense_retire_jpy <= kosei_nenkin_est_annual_jpy` → core_corpus <= 0; chi can bridge; ghi ro "年金 du phu chi phi dai han".
- Output co sensitivity theo `real_return_pct` va `safe_withdrawal_rate_pct` (dai gia tri), khong dua mot con so tuyet doi gia chac.
- Account placement uu tien: iDeCo (employee 厚生年金) → NISA tsumitate → 特定 (taxable), theo `investment-policy.implementation`.
- Never write client balances, exact income, exact contributions, or exact 年金 amounts into tracked files.
