# Opus Nexus — Implementation Status

## Stack
- Single-file SPA: `health-app/dashboard.html` (HTML + CSS + vanilla JS, no build, no CDN)
- Data source: GitHub repo (this repo) via REST API (PAT auth)
- External: Google Calendar + Google Tasks (OAuth, read + approval-gated write)
- Icons: inline SVG `<symbol>` sprite (custom set — `#i-sunrise`, `#i-vita-shield`, `#i-calendar-days`, `#i-shield-check`, `#i-opus-mark`, macro/metric icons). No CDN.

## Navigation (Phase 2)
Bottom tab bar (`.botnav`) — 4 views, active = blue `--vita-active #0A84FF`:

| Tab | `currentTab` | Nội dung |
|---|---|---|
| Today | `today` | Daily brief + bento snapshot + insight + nutrition + calendar context + tasks |
| Vita | `vita` | Sub-mode: Health Coach / Workout / Finance (`currentMode`); segmented range filter |
| Calendar | `calendar` | Read-only 7-day view + summary |
| Approval | `actions` | Paste LLM JSON → validate → approve → write to Google (badge đếm pending) |

- FAB "Plan My Week" → scroll tới khối Plan My Week trong Approval.
- Vita sub-controls (mod-tabs + range) render trong content qua `renderVitaControls()`.

## Central dispatch
- `renderContent()` (≈line 2298) — dispatcher theo `currentTab`; gọi `updateApprovalBadge()` đầu tiên.
  - `today` → `renderToday()` + `afterRenderToday()`
  - `calendar` → `renderCalendarTab()`
  - `actions` → `renderActionsTab()`
  - `vita` → `renderVitaControls()` + `renderHealth(currentMode)` + `afterRenderVita()`
- State globals: `currentTab`, `currentMode`, `currentRange`, `cHealth`, `calEvents`, `gTasks`, `pendingProposals`, `selectedIdx`.
- No framework — DOM string templating + `innerHTML`.

## What works

### Today (Phase 3 — bento §8.2)
- `renderTodayBento()` / `renderTodaySnapshotCard()` — bento 2-col bất đối xứng:
  kcal hero `span2` + track bar · protein/steps conic-gradient ring · sleep `span2` 7 mini-bars.
- `renderInsight()` → `.insight2` color-by-status (border-left green/amber/red theo good/warn/bad).
- `renderNutritionToday()` — tổng kết dinh dưỡng hôm nay.
- Số liệu trung tính (§8.1 OLED); màu chỉ ở track/ring/bars/icon.

### Vita
- **Health Coach** (`renderHealthCoach`) — đọc 7 ngày gần nhất, nêu điểm cần chú ý (protein/ngủ/vận động) + số liệu. *(REQ: `docs/REQ-vita-health-coach-ux.md`)*
- **Workout** (`renderWorkout`) — streak (`renderStreakCard`), workout feed (`renderWorkoutFeed`), Strava card, activity rings, micro-bars, heat strip, inline workout detail.
- **Finance** (`renderFinance`) — placeholder.
- `renderNutritionHistory()` — lịch sử dinh dưỡng group theo tuần (kcal/ngày TB, nhịp tuần, protein/fiber signal, ngày lệch nhất); meal summary-first (macro strip, diagnosis, top món), collapsed mặc định.

### Calendar
- Read-only 7-day view + summary (busy level, giờ kín lịch, nguy cơ ăn ngoài, sự kiện về trễ).
- Empty/no-token states → CTA tiles (Phase 4): "Kết nối Google Calendar →" / "Plan My Week →".

### Approval (Phase 4 — proposal UX §7.2)
- Paste JSON → `validateProposalInput()` → preview → approve (per-item hoặc batch) → write Google.
- `.proposal-card.selected` → elevation (surface-raised + shadow), bỏ nền green.
- Per-item approve = ghost outline; batch approve = sticky primary blue (`.proposal-sticky-bar`).
- `.proposal-card.approved` → collapse animation (`max-height: 44px`).
- Clear button reset textarea/preview.

## Visual system (Phase 1 — Foundation)
- Type scale: `--fs-cap 11 / --fs-body 13 / --fs-title 15 / --fs-metric 28`; không text <11px.
- Màu: `--vita-active #0A84FF` (blue) = active; `--vita-good` (green) = success only; số trung tính.
- Touch target ≥44px (`--tap-min`).
- Safe-area: `viewport-fit=cover` + `env(safe-area-inset-*)` + PWA meta.

## Phases (UI/UX transform)
See `docs/PLAN-uiux-transformation.md` + per-phase BD docs.
- Phase 1 Foundation — ✅
- Phase 2 Navigation — ✅
- Phase 3 Today bento — ✅ (+ nutrition history grouped-by-week, custom icon set)
- Phase 4 Proposal/Calendar UX — ✅
- Vita Health Coach — ✅ (`docs/REQ-vita-health-coach-ux.md`, `docs/REQ-vita-health-workout-next-ux.md`)

## Known issues / tech debt
- **Duplicate function definitions** — `renderHealth(mode)` và `renderHealthCoach()` mỗi cái định nghĩa 2 lần (do các commit "apply/rerun Vita copy patch" áp patch trùng). JS hợp lệ (bản sau ghi đè) nhưng là dead code → nên dọn 1 lần.
- Visual verify trên thiết bị thật chưa chạy (app cần PAT + Google API).

*Updated: 2026-05-31*
