# IMPL — Opus Nexus Transformation (Code Plan)

> Companion to `docs/PLAN-opus-nexus-transformation.md` (product plan).
> This file is the **concrete code implementation plan**. No code is edited yet.
> Source of truth for the app: `health-app/dashboard.html`.

---

## 0. Reality check — 3 deviations from the product plan

Đối chiếu plan với code thật trong repo. Cần biết trước khi code:

1. **App thật là `health-app/dashboard.html` (≈1023 dòng), KHÔNG phải `index.html`.**
   - Plan §16 nói "single-file `index.html`". Trong repo, `health-app/index.html` (510 dòng, light theme) là **bản cũ đã bỏ**. Bản đang chạy là `dashboard.html` (dark bento: rings, insight, PR tracker, streak).
   - CI `.github/workflows/sync-dashboard.yml` copy `health-app/dashboard.html` → `opus-vita/index.html` mỗi lần push `main`. Vậy `dashboard.html` **chính là** "index.html" mà plan nhắc tới, sau khi deploy.
   - → **Tất cả code đi vào `health-app/dashboard.html`.** Đề xuất: xoá `health-app/index.html` để tránh nhầm (chỉ flag, làm ở PR riêng nếu user đồng ý).

2. **Phase 0 (schema compatibility) gần như ĐÃ XONG.**
   - `dashboard.html` đã có: `getItemGrams()` (`grams ?? amount_g`), `getItemMacro()` (`key ?? key_g`), `getMealMacro()` (`total_key ?? total_key_g`), `validateHealthLog()` (console.warn schema lệch). Empty-state xử lý qua `avg()` lọc `>0`.
   - → Phase 0 rút còn **verify + vá lỗ hổng nhỏ** (workout/finance chưa dual-key; meal-item render còn dùng trực tiếp `it.grams`/`it.protein`).

3. **CI auto-deploy lên repo public `opus-vita` ngay khi merge vào `main`** (không có staging).
   - → Toàn bộ dev trên branch `claude/opus-nexus-plan-3z1Jv`. Chỉ merge `main` khi một phase đã test xong. Mỗi lần merge = một lần deploy public.

---

## 1. Implementation Phases (theo MVP cutline §14)

Thứ tự: **Phase 0 → 1 → 2 (một phần) → 3 → 4 → 5 (paste-based)**. Phase 6–7 hoãn.

| Phase | Mục tiêu | Effort | Phụ thuộc |
|---|---|---|---|
| 0 | Stabilize Vita (verify schema, empty states) | ~0.5 ngày | — |
| 1 | Rename shell → Opus Nexus + nav 4 view + Today | ~1 ngày | 0 |
| 2 (partial) | Design primitives (card components tái dùng) | ~1 ngày | 1 |
| 3 | Google Calendar read-only + Calendar Context | ~2 ngày | 2 |
| 4 | Calendar action assistant (paste → validate → approve → insert) | ~2 ngày | 3 |
| 5 | Plan My Week (paste-based LLM JSON) | ~1.5 ngày | 4 |

---

## 2. Files to edit / add

### Edit
| File | Thay đổi |
|---|---|
| `health-app/dashboard.html` | **Toàn bộ feature code** (single-file app: HTML + CSS `<style>` + JS `<script>`). |

### Add (data, đọc qua `ghGet`)
| File | Khi | Nội dung |
|---|---|---|
| `user-profile/goals.json` | Phase 5 | schema §7 — goals[] |
| `user-profile/preferences.json` | Phase 5 | language, timezone, workout_time_windows, ... |
| `user-profile/constraints.json` | Phase 5 | no_calendar_auto_write, approval_required, ... |

### Không tạo trong MVP
`nexus-plans/`, `nexus-actions/` (plan §6 "consider"); calendar events **không** lưu GitHub (§6, §15).

### Flag (không tự sửa)
- `health-app/index.html` — bản cũ, nên xoá ở PR riêng.
- `health-app/instructions.md`, `health-app/roadmap.md` — cập nhật branding "opus-vita → Opus Nexus / Vita module" sau khi Phase 1 merge.

---

## 3. Functions to add / change (trong `dashboard.html`)

Ký hiệu: ➕ thêm mới · ✏️ sửa · ♻️ refactor từ code có sẵn.

### Phase 0 — Stabilize
- ✏️ `renderHealth()` / `renderDayAcc()` — đổi meal-item render từ `it.grams`,`it.protein` sang `getItemGrams(it)`, `getItemMacro(it,'protein')` (canonical dual-key cho cả phần hiển thị).
- ➕ `renderEmptyMetric(label)` — trả HTML "— chưa log" cho water/steps/weight = 0 (thay vì hiện `0.0L`/`0k`).
- ✏️ `validateHealthLog()` — mở rộng cảnh báo cho `carb`/`fat` (hiện chỉ check grams + protein).

### Phase 1 — Nexus shell
- ➕ `renderNav()` — 4 nút top-level `Today | Vita | Calendar | Actions`.
- ➕ `showView(view)` — set `currentView`, toggle active, gọi `renderContent()`.
- ➕ `renderToday()` — Daily brief + Vita snapshot + Calendar snapshot (placeholder cho tới P3) + Action queue (placeholder cho tới P4).
- ➕ `buildVitaSnapshot()` — kcal/protein/sleep/steps của ngày mới nhất vs `TARGET`.
- ✏️ `renderContent()` — rẽ nhánh theo `currentView` trước; khi `vita` mới gọi `showTab` logic cũ (health/workout/finance).
- ✏️ `showTab()` — chỉ còn quản sub-tab trong Vita.
- ➕ state: `let currentView = 'today';`
- ✏️ Boot: mặc định mở `today`.
- ✏️ HTML: `<title>`, PAT-screen logo, topbar `<h1>` → `🌐 Opus Nexus`.

### Phase 2 (partial) — Design primitives
- ➕ `renderMetricHeroCard(label, val, unit, target, color)`
- ♻️ `renderInsightCard(title, tips[])` — tách generic từ `renderInsight()` hiện có.
- ➕ `renderProposalCard(ev, selected)` — dùng lại ở P4/P5.
- ➕ `renderEmptyMetric()` — (đã tạo ở P0, đưa vào hệ component).
- CSS: `.nav-tabs/.nav-tab`, `.brief-card`, `.insight-card`, `.metric-hero`, `.proposal-card`, `.proposal-select`, `.action-btn`.

### Phase 3 — Calendar read
- ➕ `initGapiClient()` — `gapi.load('client')` + `gapi.client.init({apiKey, discoveryDocs})`.
- ➕ `initTokenClient()` — `google.accounts.oauth2.initTokenClient({client_id, scope, callback})`.
- ➕ `connectCalendar()` — `tokenClient.requestAccessToken()` (read scope), lưu cờ `nexus_cal_connected`.
- ➕ `loadCalendarEvents(days=14)` — `gapi.client.calendar.events.list({calendarId:'primary', timeMin:now, timeMax:now+days, singleEvents:true, orderBy:'startTime'})`.
- ➕ `summarizeCalendar(events)` — `{busyLevel, eatingOutRisk, lateEvents, freeWindows}`.
- ➕ `renderCalendarContext()` — card từ summary.
- ➕ `renderCalendarTab()` — connect status + upcoming + summary + nút **Plan My Week** (wire ở P5).
- ➕ state: `let gToken=null, calEvents=[], gapiReady=false`.
- ✏️ `CONFIG.google = { clientId, apiKey, discoveryDoc, scopes }`.
- ✏️ `<head>`: thêm `apis.google.com/js/api.js` + `accounts.google.com/gsi/client`.

### Phase 4 — Action assistant
- ➕ `renderActionsTab()` — textarea paste JSON + nút Validate + khu preview.
- ➕ `parseProposals(text)` — `JSON.parse` + shape check (`summary`, `events[]`).
- ➕ `validateProposal(ev, existing)` — rules §9 (xem mục 5).
- ➕ `renderProposalPreview(proposals)` — list `renderProposalCard` + checkbox + lỗi validate.
- ➕ `approveSelected()` — loop `insertCalendarEvent` cho proposal đã tick.
- ➕ `insertCalendarEvent(ev)` — `gapi.client.calendar.events.insert` + `extendedProperties.private.source='opus-nexus'`, `type`.
- ✏️ scope nâng lên `calendar.events` (re-consent khi user lần đầu approve).
- ➕ state: `let pendingProposals=[], selectedIdx=new Set()`.

### Phase 5 — Plan My Week
- ➕ `loadUserProfile()` — `ghGet` 3 file `user-profile/*.json`, cache `let profile`.
- ➕ `buildWeekContext()` — gộp calendar summary + health/workout/finance summary + profile.
- ➕ `buildPlanPrompt(ctx)` — sinh prompt LLM (text) để user copy.
- ➕ `renderPlanMyWeek()` — nút ✨, hiện prompt + textarea paste JSON kết quả → tái dùng `parseProposals`/`renderProposalPreview`/`approveSelected` của P4.
- ✏️ wire nút "Plan My Week" ở `renderCalendarTab()`.

---

## 4. State model (sau khi xong)

```js
let currentView   = 'today';          // today | vita | calendar | actions
let currentTab    = 'health';         // sub-tab trong Vita
let currentRange  = 7;
let PAT           = localStorage.getItem('ov_pat') || '';
// Vita data (giữ nguyên)
let cHealth=[], cWorkout=[], cFinance=[], healthIdx=[], workoutIdx=[], financeIdx=[];
// Calendar (P3/P4) — in-memory, KHÔNG lưu GitHub
let gapiReady=false, gToken=null, calEvents=[];
// Proposals (P4/P5)
let pendingProposals=[], selectedIdx=new Set();
// Profile (P5)
let profile=null;
```

localStorage chỉ giữ: `ov_pat`, cờ `nexus_cal_connected`. **Không** lưu OAuth token, **không** lưu calendar events.

---

## 5. Validation rules (Phase 4 — §9)

`validateProposal(ev, existing)` trả `{ok, errors[]}`:

```
- title required (non-empty)
- start required
- end required
- new Date(start) < new Date(end)
- type ∈ ALLOWED_TYPES
- duration = end - start ≤ 3h  (ngoại lệ: type === 'sleep_protection')
- no overlap: với mọi e ∈ existing(calEvents), KHÔNG (start < e.end && end > e.start)
- timezone: nếu thiếu offset → mặc định +09:00 (Asia/Tokyo)
```

```js
const ALLOWED_TYPES = ['workout','walk','meal_prep','sleep_protection','hydration',
  'recovery','weekly_review','deep_work','study','personal_admin'];
```

**Control gate (§15):** LLM chỉ sinh proposal JSON; app validate; chỉ `events.insert` **sau khi user tick + bấm Approve**. Event Nexus tạo gắn `extendedProperties.private.source='opus-nexus'`.

---

## 6. Risk list

| # | Risk | Mức | Giảm thiểu |
|---|---|---|---|
| R1 | Merge `main` = deploy public ngay (CI sync `opus-vita`) | 🔴 Cao | Dev trên branch; chỉ merge khi phase test xong; mỗi PR = 1 phase |
| R2 | OAuth `clientId/apiKey` lộ trong file tĩnh public | 🔴 Cao | Dùng OAuth Web client + **Authorized JS origins** giới hạn domain; apiKey **HTTP referrer restriction**; KHÔNG bỏ secret thật. Để placeholder, user tự điền + restrict |
| R3 | Single-file 1023 dòng phình to khó maintain | 🟠 TB | Tách section bằng comment banner; component hoá (Phase 2) trước khi thêm feature |
| R4 | Google API quota / chưa cấp consent / popup blocked | 🟠 TB | App phải chạy bình thường khi calendar chưa kết nối (graceful fallback) |
| R5 | Sai timezone (user ở Asia/Tokyo, data có +09:00) | 🟠 TB | Mặc định Asia/Tokyo; test event qua nửa đêm + DST |
| R6 | Overlap check sai khi event all-day (`date` vs `dateTime`) | 🟠 TB | Chuẩn hoá all-day → bỏ qua trong overlap hoặc xử lý riêng |
| R7 | `index.html` cũ gây nhầm lẫn / sync nhầm | 🟡 Thấp | Xoá ở PR riêng sau khi confirm |
| R8 | PAT trong localStorage (đã tồn tại) | 🟡 Thấp | Ngoài scope transformation; giữ nguyên hành vi hiện tại |
| R9 | `events.insert` lỗi giữa chừng khi approve nhiều event | 🟡 Thấp | Insert tuần tự, report từng cái pass/fail, không rollback (Calendar không có transaction) |

---

## 7. Test checklist

### Phase 0
- [ ] Mở app với data hiện có (3 ngày health / 1 workout / 0 finance) → không vỡ.
- [ ] Console không warn với schema canonical; warn đúng khi field thiếu.
- [ ] water/steps/weight = 0 hiện "chưa log", không hiện `0`.
- [ ] Meal item render đúng cả khi dùng `amount_g`/`protein_g` lẫn `grams`/`protein`.

### Phase 1
- [ ] Title + topbar = `🌐 Opus Nexus`.
- [ ] 4 view chuyển được; Vita giữ 3 sub-tab health/workout/finance chạy y như cũ.
- [ ] Today hiện Vita snapshot đúng số (kcal/protein/sleep/steps vs target).
- [ ] Boot mở `today`.

### Phase 2
- [ ] Thêm 1 insight/metric card mới chỉ bằng gọi hàm, không inline-style.
- [ ] Card render đúng trên width 430px (mobile).

### Phase 3
- [ ] Chưa kết nối calendar → app vẫn chạy đủ Vita.
- [ ] Connect → đọc được 14 ngày tới từ `primary`.
- [ ] Calendar Context hiện busy level / eating-out / late / free windows hợp lý.
- [ ] Revoke/đóng popup → không crash.

### Phase 4
- [ ] Paste JSON hợp lệ → preview đúng số event.
- [ ] JSON sai (thiếu title/start>end/type lạ/overlap/duration>3h) → báo lỗi đúng, không cho approve.
- [ ] Approve chỉ insert event đã tick.
- [ ] Event tạo ra có `extendedProperties.private.source='opus-nexus'` (kiểm tra trên Google Calendar).
- [ ] Không có auto-write (không insert nếu không bấm approve).

### Phase 5
- [ ] `user-profile/*.json` load được; thiếu file → fallback default, không crash.
- [ ] Plan My Week sinh prompt chứa đủ context (calendar + health + workout + profile).
- [ ] Paste JSON kết quả → tái dùng pipeline P4 (validate → preview → approve).

### Regression (mọi phase)
- [ ] 3 tab Vita cũ không đổi hành vi.
- [ ] App vẫn là **single `dashboard.html`**, mở trực tiếp bằng browser chạy được.
- [ ] PAT flow (nhập / reset / sync) không đổi.

---

## 8. Minimal first PR scope

**PR #1 = Phase 0 + Phase 1** (identity + shell, zero external dependency, zero secret).

Lý do gộp 0+1:
- Phase 0 nhỏ (verify + vá nhẹ), tự nó không đáng 1 PR.
- Phase 1 không thêm Google/secret → an toàn deploy public ngay khi merge.
- Cho ra **giá trị nhìn thấy được** (app thành "Opus Nexus" có Today) mà không rủi ro OAuth.

Phạm vi PR #1:
1. `dashboard.html`: schema canonical ở meal render + `renderEmptyMetric` (P0).
2. `dashboard.html`: rename branding + `renderNav/showView/renderToday/buildVitaSnapshot` + rẽ nhánh `currentView` (P1).
3. **Không** đụng Google API, **không** thêm file data, **không** xoá `index.html`.

Out of scope PR #1: Phase 2–5, OAuth, `user-profile/`, xoá file cũ, cập nhật `instructions.md`/`roadmap.md`.

Exit để merge: hết checklist Phase 0 + Phase 1 + Regression.

> Các PR sau: PR #2 = Phase 2; PR #3 = Phase 3; PR #4 = Phase 4; PR #5 = Phase 5. Mỗi PR test xong mới merge (vì merge = deploy public).

---

## 9. Non-goals (giữ nguyên từ plan §14)

Không làm trong giai đoạn này: backend · React migration · bỏ GitHub PAT loading · lưu calendar event vào GitHub · auto-write calendar · medical checkup · OCR · autonomous agent · notification/push · sửa/xoá calendar event.
