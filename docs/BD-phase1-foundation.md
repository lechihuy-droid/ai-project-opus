# BD — Build Plan: Opus Nexus UI/UX — Phase 1 (Foundation)
**Date:** 2026-05-30
**Status:** 🔵 Planning
**Ref:** `docs/PLAN-uiux-transformation.md` (review A–G + §7/§8 addenda), `docs/handoff-codex-uiux.md`
**Estimate:** ~2.5–3.5 giờ
**Target file:** `health-app/dashboard.html` (single file)

> **Phase 1 = nền tảng thuần CSS/token + render-level.** Không đụng bottom nav (Phase 2), không proposal collapse / FAB / keyboard-fix / 1-tap paste (Phase 2/3). Mục tiêu: gỡ 4 blocker nền tảng (E.17 type scale, E.18/E.19 màu, F.21 touch target, F.22 safe-area) mà KHÔNG đổi DOM logic / API / validation.

---

## Prerequisites
- [x] Plan approved — các quyết định đã LOCKED (PLAN §6).
- [ ] Mở được `health-app/dashboard.html` trên browser ở viewport 390–430px (Chrome DevTools device toolbar đủ).
- [ ] Chụp baseline screenshot 3 view (Today / Vita / Approval) **trước khi sửa** để so regression.

**Locked decisions liên quan Phase 1:**
- Active accent = **xanh dương** `#0A84FF` (gỡ green khỏi vai trò active).
- Màu OLED (§8.1): **số/chữ = trung tính**, màu rực **chỉ ở đồ hoạ** (bar/ring/icon/dot).
- Touch target tối thiểu **44px**.
- Safe-area: `viewport-fit=cover` + `env(safe-area-inset-*)`.

**Scope guard (KHÔNG làm ở P1):** bottom nav, icon Phosphor, segmented control, proposal elevation/collapse, sticky approve-all, insight color-by-status, FAB Plan My Week, keyboard-fix, 1-tap paste. (→ Phase 2/3.)

---

## Build Steps

### Step 0 — Baseline & verify token block
**Mục tiêu:** Xác nhận điểm sửa trước khi đụng.
**Việc làm:**
- [ ] Mở app, screenshot 3 view ở 430px (no-data + có data nếu có PAT).
- [ ] Xác nhận `:root` tokens ở dòng ~14–64; meta viewport dòng 5.
**Smoke test:** App render bình thường, ghi lại baseline.
**Estimate:** 15 min

---

### Step 1 — Thêm design tokens mới vào `:root` (dòng 14–64)
**Mục tiêu:** Có sẵn token cho type scale, active accent, tap target — chưa đổi UI.
**Files:** Sửa `health-app/dashboard.html` — block `:root`.
**Việc làm:**
- [ ] Thêm type scale: `--fs-cap:11px; --fs-body:13px; --fs-title:15px; --fs-metric:28px;`
- [ ] Thêm active accent (tách khỏi `--vita-good`): `--vita-active:#0A84FF;`
- [ ] Thêm nền tab active (Phase 2 sẽ dùng, khai báo sẵn — Sắc 3): `--vita-active-bg:linear-gradient(180deg,#322C52,#241F3D); --vita-active-glow:0 6px 18px rgba(80,60,160,.28);`
- [ ] Thêm tap target: `--tap-min:44px;`
- [ ] **Không** đổi `--vita-bg/surface/...` (giữ dark bento identity).
**Smoke test:** Reload → không có thay đổi thị giác (token chưa được dùng). Không lỗi console.
**Estimate:** 15 min

---

### Step 2 — Nâng cỡ chữ dưới ngưỡng (E.17)
**Mục tiêu:** Không còn text < 11px; thang chữ nhất quán.
**Files:** Sửa các rule CSS.
**Việc làm:**
- [ ] `.ring-lbl` 9px → 11px (dòng ~134).
- [ ] `.pr-new` 9px → 11px (dòng ~231).
- [ ] Rà soát toàn file các `font-size:9px|10px` ở text người-đọc → nâng lên ≥11px (giữ 10px cho `letter-spacing`-heavy uppercase label nếu cần, nhưng ưu tiên 11px).
- [ ] Body text 12px → dùng `--fs-body` (13px) ở các chỗ đọc dài (vd `.insight-text`, `.cal-sub`, `.proposal-time`).
**Smoke test:** Inspect → không rule text nào < 11px; đọc được ở khoảng cách cầm tay. Layout không vỡ (số 13px không tràn ô).
**Estimate:** 30 min

---

### Step 3 — Nguyên lý màu OLED: số trung tính, màu chỉ ở đồ hoạ (E.18/E.19/§8.1)
**Mục tiêu:** Giảm "vibrate"/quá tải màu; tách green khỏi "active".
**Files:** Sửa CSS + một số render function (in-scope: "review HTML/CSS/render").
**Việc làm:**
- [ ] `renderMetricHeroCard` (dòng ~569–584): bỏ `style="color:${color}"` ở `.metric-hero-val` → để số dùng `var(--vita-text)`; **giữ** `color` ở `.pfill` (bar) — màu chỉ còn ở thanh tiến độ. (dòng 581 vs 583)
- [ ] Rà các số liệu đang tô màu chức năng: `.da-kcal`, `.mi-kcal`, `.meal-g-kcal` (đang `var(--vita-good)`) → chuyển text về `var(--vita-text)`; giữ màu ở icon/badge/bar tương ứng.
- [ ] Bất kỳ chỗ active đang dùng `--vita-good` cho "đang chọn/active" (vd `.rtab.active` bg green dòng 92, `.mtab.active` border green dòng 88, `.nav-tab.active` dòng 251) → đổi sang `--vita-active`. (Lưu ý: `.nav-tab` sẽ bị thay ở Phase 2, nhưng đổi token vẫn đúng hướng.)
- [ ] **Giữ** green (`--vita-good`) cho status "good/success" (status-pill.good, badge.green, viền hoàn thành).
**Smoke test:** Số liệu hiển thị trắng; ring/bar/icon vẫn màu; tab active xanh dương; status "good" vẫn xanh lá. Không chỗ nào active còn xanh lá.
**Estimate:** 45 min

---

### Step 4 — Touch target ≥ 44px (F.21)
**Mục tiêu:** Mọi control chạm được đúng chuẩn iOS HIG.
**Files:** Sửa CSS các class button/tab.
**Việc làm:**
- [ ] `.proposal-edit` / `.proposal-approve` height 30px → `min-height:var(--tap-min)` (dòng ~286/288).
- [ ] `.mtab` (87), `.rtab` (91), `.sync-btn`/`.pat-btn` (83/84): tăng padding để vùng chạm ≥44px (giữ cỡ chữ; tăng padding dọc).
- [ ] `.action-btn` (257) đảm bảo `min-height:var(--tap-min)`.
- [ ] `.day-acc summary`, `.nav-tab` (250) — đảm bảo vùng chạm ≥44px.
- [ ] Không phá layout grid (range-row 4 nút vẫn 1 hàng).
**Smoke test:** DevTools đo từng control ≥ 44×44px; range-row/mod-tabs không xuống dòng.
**Estimate:** 30 min

---

### Step 5 — Safe-area + PWA meta (F.22)
**Mục tiêu:** Không bị notch/home-indicator iPhone đè; nền tảng cho bottom nav Phase 2.
**Files:** `<head>` + CSS `.topbar`/`.content`.
**Việc làm:**
- [ ] Meta viewport (dòng 5): thêm `viewport-fit=cover`.
- [ ] Thêm meta PWA (không CDN): `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=black-translucent`, `theme-color=#090A0F`.
- [ ] `.topbar` (dòng ~74–80): `padding-top: calc(12px + env(safe-area-inset-top));`
- [ ] `.content` (dòng ~95): `padding-bottom: calc(40px + env(safe-area-inset-bottom));`
- [ ] Thêm fallback `env(safe-area-inset-* , 0px)` để desktop không lệch.
**Smoke test:** Trên iPhone (hoặc simulator có notch): topbar không chui dưới notch; content cuối không bị home-indicator che. Desktop không đổi.
**Estimate:** 25 min

---

### Step 6 — Integration test (regression)
**Mục tiêu:** Đảm bảo không vỡ gì, đạt mục tiêu Phase 1.
**Test cases:**
- [ ] Happy: mở 430px có data → 3 view render đúng, số trắng, bar/ring màu, active xanh dương.
- [ ] Empty: chưa có PAT / chưa connect Google → empty states vẫn hiện, không lỗi.
- [ ] Error: nhập PAT sai / validate JSON lỗi → `.err` hiển thị bình thường.
- [ ] Đo: không text < 11px; mọi tap target ≥ 44px.
- [ ] So screenshot với baseline Step 0 — chỉ khác đúng các điểm trên, không regression layout.
**Estimate:** 30 min

---

## Rollback Plan
- Single file, không DB/migration. `git checkout health-app/dashboard.html` để revert.
- Mỗi step là 1 commit nhỏ → revert từng step nếu cần.

---

## Checklist Trước Khi Done
- [ ] Step 1–5 smoke tests pass.
- [ ] Type scale: không còn <11px (E.17).
- [ ] Màu: số trung tính, đồ hoạ giữ màu, active = xanh dương, green chỉ còn "good" (E.18/E.19).
- [ ] Tap target ≥44px (F.21).
- [ ] Safe-area + PWA meta (F.22).
- [ ] Không đổi `--vita-bg/surface`, không thêm CDN, không đụng JS API/validation/data.
- [ ] BD doc updated (các step ✅).

---

*Opus Nexus UI/UX — BD Phase 1 v1 | 2026-05-30*
