# Calorie Base — 2200 kcal/ngày

> Source: `user-profile/body.json` + Mifflin-St Jeor formula

## Công thức

**Mifflin-St Jeor BMR (Male):**
```
BMR = 10 × weight_kg + 6.25 × height_cm − 5 × age + 5
    = 10 × 73.5 + 6.25 × 176 − 5 × 38 + 5
    = 735 + 1100 − 190 + 5
    = 1650 kcal/ngày
```

**TDEE (Total Daily Energy Expenditure):**
```
activity_level = moderately_active → factor = 1.55
TDEE = 1650 × 1.55 = 2557 kcal/ngày

Target = 2200 kcal → deficit = 357 kcal/ngày → giảm ~0.35 kg/tuần
```

## Protein target — 150 g/ngày

```
2.0 g/kg × 73.5 kg = 147 g → làm tròn 150 g
```
Mức cao trong khuyến nghị ISSN (1.6–2.2 g/kg): hỗ trợ giữ/tăng cơ khi giảm mỡ,
đồng thời là precursor testosterone.

## Dinh dưỡng hỗ trợ testosterone & năng lượng tình dục

| Nutrient | Target/ngày | Nguồn thực phẩm tốt |
|---|---|---|
| **Zinc** | ≥ 11 mg | Hàu, thịt bò, hạt bí đỏ, đậu |
| **Magnesium** | ≥ 400 mg | Hạt điều, hạnh nhân, rau bina, dark chocolate |
| **Vitamin D** | 2000 IU | Cá hồi, trứng, ánh nắng 15–20 phút/ngày |
| **Omega-3** | 1–2 g EPA+DHA | Cá hồi/thu/trích, hạt chia/lanh |
| **Selenium** | 55 µg | Hạt Brazil (1–2 hạt/ngày), hải sản, thịt gà |
| **Vitamin B6/B12** | per RDA | Thịt đỏ, cá, trứng, gan |
| **L-arginine** | 3–6 g | Thịt gia cầm, các loại hạt, đậu phộng |

**Lưu ý thực tế:**
- Zinc + Vitamin D là 2 micronutrient thiếu phổ biến nhất ở nam giới → ưu tiên bổ sung qua thực phẩm trước supplement
- Mỡ lành (omega-3, mono) cần thiết để sản xuất steroid hormone — **không** ăn low-fat
- Fat target hiện tại 70g/ngày là hợp lý, ưu tiên cá béo + dầu olive + avocado
- Ngủ đủ 7.5h: testosterone tổng hợp cao nhất trong giấc ngủ sâu — sleep là "supplement" miễn phí

## Tại sao không deficit sâu hơn?

- Testosterone giảm rõ rệt khi ăn < 1800 kcal ở nam giới
- Deficit 350–400 kcal (2200 từ TDEE 2557) là vùng an toàn: giảm mỡ + giữ testosterone + hồi phục tốt
- Nếu tăng tập hoặc hoạt động nhiều → ăn 2300–2400 kcal (giữ protein 150g)

## Cách update

1. Sửa `user-profile/body.json` khi cân nặng thay đổi
2. Tính lại TDEE theo công thức trên
3. Cập nhật `health-app/dashboard.html` dòng `CONFIG.target`
4. Cập nhật `health-app/instructions.md` section "Mục tiêu cá nhân"

> Roadmap 3.1 (Adaptive TDEE): khi đủ ≥14 ngày data cân liên tục, tính TDEE thực từ `Δkg/tuần × 7700 + avg_intake_14d` → tự động đề xuất target mới.
