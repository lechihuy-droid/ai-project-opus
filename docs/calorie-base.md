# Calorie Base — 2200 kcal/ngày

> Source: `user-profile/body.json` + Mifflin-St Jeor formula

## Công thức

**Mifflin-St Jeor BMR (Male):**
```
BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age + 5
    = 10 × 73.5 + 6.25 × 170 − 5 × 30 + 5
    = 735 + 1062.5 − 150 + 5
    = 1652.5 kcal/ngày
```

**TDEE (Total Daily Energy Expenditure):**
```
activity_level = lightly_active → factor = 1.375
TDEE = 1652.5 × 1.375 = 2272 kcal/ngày → làm tròn 2200
```

## Tại sao 2200 chứ không phải deficit thấp hơn?

- Mục tiêu: 73.5 kg → 66 kg (−7.5 kg)
- Deficit nhẹ ~200–300 kcal/ngày (từ TDEE 2272): đủ để giảm 0.2–0.3 kg/tuần mà không mất cơ
- Deficit quá sâu (< 1800 kcal) với mức tập gym → nguy cơ mất cơ, hồi phục kém

## Protein target — 130 g/ngày

```
1.8 g/kg × 73.5 kg ≈ 130 g
```
Mức khuyến nghị khi vừa giảm mỡ vừa giữ/tăng cơ (ISSN guidelines: 1.6–2.2 g/kg).

## Cách update

1. Sửa `user-profile/body.json` khi cân nặng / điều kiện sống thay đổi
2. Tính lại TDEE theo công thức trên
3. Cập nhật `health-app/dashboard.html` dòng `CONFIG.target.kcal`
4. Cập nhật `health-app/instructions.md` section "Mục tiêu cá nhân"

> Roadmap 3.1 (Adaptive TDEE): khi đủ ≥14 ngày data liên tục, tính TDEE thực từ `Δkg/tuần × 7700 + avg_intake_14d` → tự động đề xuất target mới.
