# Opus Nexus — Vita Module: Roadmap

> Vita là health/workout/finance module của Opus Nexus. AI-logged via chat, JSON-on-GitHub backend. Dashboard: `health-app/dashboard.html` → auto-deploy sang `opus-vita/index.html`.

---

## Nguyên tắc

- **Chat-first**: input qua Claude (ảnh + text), KHÔNG build UI nhập liệu
- **Static dashboard**: chỉ render data, không cần backend
- **JSON-on-GitHub**: dữ liệu là single source of truth, version control luôn
- **Tăng adherence > tăng feature**: streak/insight đáng giá hơn 10 chart đẹp

---

## Phase 1 ✅ DONE (2026-05-28)
> Quick wins (display-only, no new input)

| # | Feature | Status |
|---|---------|--------|
| 1.1 | Streak counter (badge topbar) | ✅ |
| 1.2 | Weekly summary card (this 7d vs prev 7d) | ✅ |
| 1.3 | PR tracker (heaviest weight + 1RM Epley) | ✅ |
| 1.4 | Today card (kcal/protein/nước/bước/ngủ vs target) | ✅ |
| 1.5 | Empty states với gợi ý action | ✅ |

**Shipped commits:** `b7623c8` feat(dashboard): Phase 1

---

## Phase 2 — TODO (next up)
> Schema extend — enrich data khi log, value ngay khi xem

- [ ] **2.1 Micronutrients** — extend meal item schema: `fiber, calcium, iron, magnesium, zinc, vit_d, vit_b12, omega3`. Display: bar "5/8 vi chất đạt" hoặc heatmap tuần
- [ ] **2.2 RPE per workout set** — thêm field `rpe` (1-10) vào exercise. Display: avg RPE/session, trend chart
- [ ] **2.3 Mood/energy tag** — thêm `mood: 1-5`, `energy: 1-5` vào daily log. Display: vẽ chung với meals/sleep để tìm trigger
- [ ] **2.4 Fasting window** — auto-compute từ `meals[0].time` đến `meals[last].time`, hiển thị actual vs 16:8 target
- [ ] **2.5 Cập nhật instructions.md** — Claude prompt: tự extract vi chất khi log ảnh; hỏi RPE sau workout; gợi ý mood tag tối

**Verify:** log 1 bữa mới → JSON có ≥5 vi chất; log workout → có RPE; cuối ngày có mood.

**Effort tổng:** ~1 tuần (chủ yếu schema + Claude prompt, ít UI mới)

---

## Phase 3 — TODO (sau Phase 2, cần ≥4 tuần data)
> Cross-module intelligence — phát hiện pattern, không chỉ hiển thị raw

- [ ] **3.1 Adaptive TDEE** — tính TDEE thực từ trend cân (Δkg/tuần × 7700) + avg intake 14 ngày → đề xuất calo target tuần tới
- [ ] **3.2 Volume per muscle group** — exercise → muscle DB (chest/back/legs/shoulders/arms/core). Tổng sets/tuần per muscle. So với MEV/MAV/MRV
- [ ] **3.3 Muscle heatmap SVG** — body front/back, tô màu theo volume 7 ngày. Phát hiện muscle bỏ quên
- [ ] **3.4 ACWR load balance** — aerobic (muay thai rounds × duration × RPE) vs anaerobic (tonnage). Cảnh báo ACWR > 1.5 (chấn thương)
- [ ] **3.5 Correlation insights** — card "💡 Insight tuần này": "Ngủ < 6h → kcal +X%", "Tập muay thai → cân -Yg sáng sau", "Cuối tuần chi tiêu +Z%"

**Verify:** sau 4 tuần log đầy đủ → insight card hiện ≥2 pattern thực.

**Effort tổng:** ~2 tuần. Phụ thuộc Phase 2.5 (exercise DB) và data ≥30 ngày.

---

## Notes / Decisions ghi nhớ

- **Phase 1 → 2 gap:** Phase 2 cần Claude prompt update (instructions.md). Đây là leverage cao nhất vì 1 lần update prompt → mọi log sau đều có data mới.
- **Không build UI nhập liệu** trong bất kỳ phase nào. Mọi input qua chat.
- **Exercise → muscle DB** (Phase 3.2): build dạng JSON tĩnh trong dashboard, không gọi API ngoài.
- **Skip nếu data thưa:** TDEE/correlation cần ≥14-30 ngày liên tục, đừng vội build khi chưa đủ data.

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
