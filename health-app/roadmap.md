# opus-vita — Roadmap

> Personal health/workout/finance dashboard, AI-logged via chat, JSON-on-GitHub backend.

---

## Nguyên tắc

- **Chat-first**: input qua Claude (ảnh + text), KHÔNG build UI nhập liệu
- **Static dashboard**: chỉ render data, không cần backend
- **JSON-on-GitHub**: dữ liệu là single source of truth, version control luôn
- **Tăng adherence > tăng feature**: streak/insight đáng giá hơn 10 chart đẹp

---

## Phase 1 — Quick wins (display-only, no new input)
> Mục tiêu: tận dụng data đã có, không đổi schema phức tạp

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 1.1 | **Streak counter** — số ngày log liên tiếp, hiển thị badge trên topbar | XS | High |
| 1.2 | **Weekly summary card** — avg kcal/protein/ngủ/steps 7 ngày + so sánh tuần trước | S | High |
| 1.3 | **PR tracker workout** — auto detect heaviest weight + 1RM ước tính per bài, badge "🏆 PR" | S | High |
| 1.4 | **Today card** — hiển thị nổi bật ngày hôm nay (kcal target progress, water, steps ring) | S | Med |
| 1.5 | **Empty states đẹp** — khi chưa log, gợi ý hành động cụ thể thay vì "😶 Chưa có" | XS | Med |

**Verify:** mở dashboard trên iPhone → thấy streak, weekly summary, PR badge.

---

## Phase 2 — Schema extend (cần Claude log thêm field)
> Mục tiêu: enrich data khi log, value ngay khi xem

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 2.1 | **Micronutrients** — extend meal item schema: thêm `fiber, calcium, iron, magnesium, zinc, vit_d, vit_b12, omega3` | M | High |
| 2.2 | **RPE per workout set** — thêm field `rpe` (1-10) vào exercise | S | High |
| 2.3 | **Mood tag** — thêm `mood: 1-5` vào daily log, vẽ chung với meals/sleep | S | Med |
| 2.4 | **Fasting window** — auto-compute từ giờ bữa đầu/cuối, hiển thị actual vs 16:8 | S | Med |
| 2.5 | **Cập nhật instructions.md** — Claude tự nhớ vi chất khi extract từ ảnh, hỏi RPE sau workout | S | High |

**Verify:** log 1 bữa mới → JSON có đủ vi chất; log workout → có RPE.

---

## Phase 3 — Cross-module intelligence
> Mục tiêu: phát hiện pattern, không chỉ hiển thị raw data

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 3.1 | **Adaptive TDEE** — tính TDEE thực từ trend cân + intake 14 ngày, đề xuất calo tuần tới | M | High |
| 3.2 | **Volume per muscle group** — map exercise → muscle, biểu đồ tuần. Cần exercise DB | L | High |
| 3.3 | **Muscle heatmap SVG** — body front/back tô màu theo volume 7 ngày | M | Med |
| 3.4 | **ACWR load balance** — track aerobic (muay thai) vs anaerobic (tonnage), cảnh báo > 1.5 | M | High |
| 3.5 | **Correlation insights** — sleep ↔ kcal, training ↔ cân, weekend ↔ chi tiêu. Hiển thị card "💡 Insight tuần này" | M | High |

**Verify:** sau 4 tuần data → insight card hiện ít nhất 2-3 pattern thực.

---

## Phase 4 — Finance module (build proper)
> Hiện tại finance gần như chưa dùng. Build khi cần.

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 4.1 | **Multi-currency JPY ↔ VND** — tỷ giá auto từ public API, hiển thị 2 chiều | M | High |
| 4.2 | **Recurring transactions** — schema `recurring.json`, auto-flag khi đến hạn | M | High |
| 4.3 | **Bill reminders JP** — 国民健康保険, 住民税, gas, điện, rent | S | Med |
| 4.4 | **Net worth** — schema `assets.json` (cash JP/VN, NISA, vàng), biểu đồ tháng | M | High |
| 4.5 | **Safe-to-spend hôm nay** — sau khi trừ bills sắp tới + savings goals | M | Med |
| 4.6 | **Savings goals + ETA** — vé về VN, quỹ khẩn cấp, progress + dự đoán | M | Med |

---

## Phase 5 — Polish & sharing
> Sau khi 1-4 chạy ổn ít nhất 1 tháng

- Export PDF tháng (cho bác sĩ, PT)
- Dark mode
- iOS PWA (install on home screen)
- Share view read-only cho gia đình/bạn bè (token riêng)

---

## Roadmap timeline (đề xuất)

```
Phase 1 ──── 1 tuần  ──── ✨ user thấy value ngay
Phase 2 ──── 1 tuần  ──── (yêu cầu vài lần log mới để có data)
Phase 3 ──── 2 tuần  ──── (cần ≥4 tuần data trước khi insight có nghĩa)
Phase 4 ──── 2 tuần  ──── (khi nào start log finance)
Phase 5 ──── tuỳ    ──── (when stable)
```

**Tổng:** ~6 tuần để hoàn thiện core, sau đó iterate.
