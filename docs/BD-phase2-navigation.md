# BD — Build Plan: Opus Nexus UI/UX — Phase 2 (Navigation)
**Date:** 2026-05-30
**Status:** 🔵 Planning
**Ref:** `docs/PLAN-uiux-transformation.md` (review A–G + §6 LOCKED + §7/§8 addenda), `docs/BD-phase1-foundation.md`, mockups `docs/mockup-bottom-nav-icons.html` + `docs/mockup-today-redesign.html`
**Estimate:** ~3–4 giờ
**Target file:** `health-app/dashboard.html` (single file)

> **Phase 2 = điều hướng.** Chuyển primary nav xuống **bottom tab bar** (icon Phosphor, active = icon Fill xanh + nền tím than nổi Sắc 3), gỡ "3-layer tab stack" ở Vita bằng **segmented control trong content**, đổi nhãn tab 4 → **"Approval"** + badge đếm. KHÔNG đụng JS data/API/validation; chỉ DOM structure + CSS + wiring show/hide (tái dùng `showView/showTab/setRange` đã có). Giữ dark-bento identity.

---

## Prerequisites

- [x] Phase 1 done (commits 2daa8ec…d8d66cc) — token `--vita-active`, `--vita-active-bg`, `--vita-active-glow`, `--tap-min`, type scale đã có sẵn (`dashboard.html:67–76`).
- [x] `viewport-fit=cover` + `env(safe-area-inset-*)` đã thêm ở Phase 1 (meta dòng 5; `.topbar:91`; `.content:107`).
- [x] Quyết định LOCKED (PLAN §6): bottom nav = CÓ; ngôn ngữ nav = **EN** (Today / Vita / Calendar / Approval); active = **xanh dương** `--vita-active` (#0A84FF); tab active = **Option 2** (icon Fill xanh) + **nền tím than NỔI Sắc 3** (`linear-gradient(180deg,#322C52,#241F3D)` + glow `0 6px 18px rgba(80,60,160,.28)` + inset top highlight + `translateY(-2px)`); icon set = **Phosphor inline SVG** (inactive = outline xám, active = Fill xanh); badge đếm trên Approval.
- [ ] Mở `health-app/dashboard.html` ở viewport 390–430px (Chrome DevTools); chụp baseline 4 view (Today / Vita / Calendar / Approval) trước khi sửa.

**Token Phase 1 tái dùng ở Phase 2:**
- `--vita-active` (#0A84FF) → màu icon Fill + nhãn tab active.
- `--vita-active-bg` (`linear-gradient(180deg,#322C52,#241F3D)`) → nền tím than tab active.
- `--vita-active-glow` (`0 6px 18px rgba(80,60,160,.28)`) → box-shadow glow tab active.
- `--vita-energy` (#FF453A) → nền badge số.
- `--tap-min` (44px) → bảo đảm vùng chạm mỗi tab ≥44px.
- `--vita-faint` → icon/nhãn inactive (xám).
- `env(safe-area-inset-bottom)` → padding đáy bottom nav + chừa chỗ ở `.content`.

**Scope guard (KHÔNG làm ở P2):** Today bento redesign (hero/ring/sleep — Phase 3 / §8.2), insight color-by-status, proposal elevation/collapse, sticky approve-all, calendar empty CTA, radius cleanup, PWA polish ngoài safe-area. **FAB "Plan My Week"** → xem Open Question #1 (chưa LOCKED, không build trong P2 trừ khi user chốt). KHÔNG đụng `loadModule/reload/validate*/approve*/parse*` hay bất kỳ logic data.

---

## Build Steps

Mỗi step = 1 commit nhỏ độc lập, ordered theo dependency (CSS nền → SVG symbols → DOM nav → wiring → gỡ stack Vita → segmented → padding → regression).

### Step 0 — Baseline & xác nhận điểm sửa
**Mục tiêu:** Khoá vị trí thật trước khi đụng.
**Việc làm:**
- [ ] Screenshot 4 view ở 430px.
- [ ] Xác nhận các điểm sẽ sửa:
  - Topbar nav HTML: `dashboard.html:356–361` (`.nav-tabs` + 4 `.nav-tab`, view ids `today/vita/calendar/actions`).
  - Mod-tabs HTML: `:362–366` (`#mod-tabs`, 3 `.mtab`).
  - Range-row HTML: `:367–372` (`#range-row`, 4 `.rtab`).
  - CSS: `.nav-tabs:261`, `.nav-tab:262`, `.nav-tab.active:263`; `.mod-tabs:98`, `.mtab:99`, `.mtab.active:100`; `.range-row:102`, `.rtab:103`, `.rtab.active:104`.
  - JS: `showView():467–476` (toggle nav-tab active + show/hide mod-tabs/range-row), `showTab():461–466`, `setRange():455–460`, `currentView:402`.
  - `.content:107` (padding-bottom hiện `calc(40px + env(safe-area-inset-bottom,0px))`).
  - Badge nguồn: `pendingProposals` (`:408`) — `pendingProposals.length` = số đếm Approval.
**Smoke test:** App render bình thường; ghi lại baseline.
**Estimate:** 15 min

---

### Step 1 — CSS bottom nav (`.botnav` + `.bn`) chưa gắn DOM
**Mục tiêu:** Có sẵn style bottom nav fixed + active Sắc 3 + badge, chưa đụng DOM (reload không đổi gì).
**Files:** Sửa `health-app/dashboard.html` — thêm block CSS mới (đặt sau `.nav-tab.active:263` để gom chung navigation).
**Việc làm (mô tả, không viết code thật):**
- [ ] `.botnav`: `position:fixed; left:0; right:0; bottom:0; max-width:430px; margin:0 auto;` (khớp `#app` `:83`); nền `rgba(13,14,20,.97)` + `backdrop-filter:blur(20px)`; `border-top:1px solid var(--vita-line)`; `display:flex; gap:2px`; `z-index:60` (trên `.topbar` z-50 `:87`); `padding:8px 8px calc(8px + env(safe-area-inset-bottom,0px))`.
- [ ] `.bn` (1 tab): `flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-height:var(--tap-min); padding:7px 2px; position:relative; background:none; border:none; border-radius:16px; cursor:pointer; font-family:inherit;`.
- [ ] `.bn svg` (icon, 24px): `stroke:var(--vita-faint); fill:none; stroke-width:1.9; transition:.2s;` (outline xám inactive).
- [ ] `.bn .bn-lbl`: `font-size:10px; font-weight:700; color:var(--vita-faint); letter-spacing:.2px;`.
- [ ] **Active (Option 2 + Sắc 3):** `.bn.active{ background:var(--vita-active-bg); box-shadow:var(--vita-active-glow), inset 0 1px 0 rgba(255,255,255,.08); transform:translateY(-2px); }` · `.bn.active svg{ stroke:var(--vita-active); fill:var(--vita-active); stroke-width:1.1; }` · `.bn.active .bn-lbl{ color:#7FB6FF; }` (xanh sáng cho contrast trên nền tím — theo mockup dòng 41–50).
- [ ] `.bn .badge` (số trên Approval): `position:absolute; top:2px; right:50%; transform:translateX(22px); min-width:17px; height:17px; padding:0 4px; border-radius:9px; background:var(--vita-energy); color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid var(--vita-bg);`. (Lưu ý: class `.badge` đã tồn tại cho workout `:187` — đặt scope hẹp `.bn .badge` để không xung đột; xác nhận selector specificity khi test.)
**Smoke test:** Reload → KHÔNG có thay đổi thị giác (chưa có DOM `.botnav`). Console không lỗi.
**Estimate:** 40 min

---

### Step 2 — Thêm Phosphor SVG `<symbol>` sprite (inline, no-CDN)
**Mục tiêu:** Có 4 icon dùng được qua `<use href="#...">`, chưa render nav.
**Files:** Sửa `health-app/dashboard.html` — thêm 1 `<svg width=0 height=0>` chứa `<symbol>` ngay sau `<div id="app">` mở (`:347`) hoặc trước `<div class="topbar">` (`:348`).
**Việc làm:**
- [ ] Thêm sprite ẩn với 4 symbol (lấy path từ mockup `docs/mockup-bottom-nav-icons.html:63–66`, hoặc thay bằng path Phosphor chính thức nếu user cung cấp):
  - `#i-home` (Today), `#i-vita` (Vita — pulse/heartbeat), `#i-cal` (Calendar), `#i-tray` (Approval — inbox/tray).
- [ ] `viewBox="0 0 24 24"` mỗi symbol; không set màu trong path (để CSS `.bn svg` quản).
- [ ] Lưu ý: mockup "fake fill" bằng tô `fill` lên icon line. Nếu dùng Phosphor thật, cân nhắc 2 symbol mỗi icon (outline + fill) và swap khi active — xem Open Question #2.
**Smoke test:** Inspect → 4 `<symbol>` tồn tại, sprite `width:0` không chiếm layout. App render như cũ.
**Estimate:** 30 min

---

### Step 3 — Thay `.nav-tabs` topbar → bottom nav DOM + đổi nhãn tab 4 "Approval"
**Mục tiêu:** Primary nav nằm ở đáy; topbar gọn lại; tab 4 đổi nhãn (A.1).
**Files:** Sửa `health-app/dashboard.html` — HTML.
**Việc làm:**
- [ ] **Xoá** `.nav-tabs` khỏi topbar (`:356–361`).
- [ ] **Thêm** `<nav class="botnav">` (4 `<button class="bn">`) ở cuối `#app`, NGAY SAU `<div class="content">…</div>` (sau `:377`), trước khi đóng `#app` `:377`. Mỗi nút giữ nguyên `onclick="showView(...)"` và id `nv-*` để JS hiện hữu không đổi:
  - `<button class="bn active" id="nv-today" onclick="showView('today')"><svg><use href="#i-home"/></svg><span class="bn-lbl">Today</span></button>`
  - `nv-vita` → `#i-vita`, label "Vita".
  - `nv-calendar` → `#i-cal`, label "Calendar".
  - `nv-actions` → `#i-tray`, label **"Approval"** + `<span class="badge" id="approval-badge" style="display:none"></span>`. **Giữ view id nội bộ = `actions`** (vì `showView('actions')`, `renderActionsTab`, `currentView==='actions'` `:500`, và các nút "→ Actions" `:552/980/992` đều dùng `actions`). Chỉ NHÃN hiển thị đổi thành "Approval".
- [ ] Giữ nguyên topbar `.tb-row1` (`:349–355`) — brand + Sync + PAT.
**Smoke test:** Reload → 4 tab ở đáy; tab Today active (nền tím + icon xanh); bấm tab đổi view đúng (showView chạy như cũ vì id `nv-*` giữ nguyên); topbar không còn hàng nav top. Tab 4 hiển thị "Approval".
**Estimate:** 35 min

---

### Step 4 — Badge đếm pending trên Approval (A.1)
**Mục tiêu:** Tab Approval hiện số proposal đang chờ; ẩn khi 0.
**Files:** Sửa `health-app/dashboard.html` — thêm 1 helper render badge + gọi ở các điểm pending thay đổi (KHÔNG đụng validate/approve logic, chỉ đọc `pendingProposals.length`).
**Việc làm:**
- [ ] Thêm hàm nhỏ `updateApprovalBadge()`: đọc `pendingProposals.length`; nếu >0 set `textContent` + `display:flex`, nếu =0 set `display:none`. (Thuần DOM, không sửa state.)
- [ ] Gọi `updateApprovalBadge()` ở cuối các hàm đã thay đổi `pendingProposals`: `validateProposalInput()` (sau khi set pendingProposals), `clearProposals()` (`:1287`), và sau mỗi approve (nơi pending bị rút). Chỉ THÊM lời gọi, không sửa logic bên trong.
- [ ] Gọi 1 lần khi init/render lần đầu để badge khớp state.
**Smoke test:** Paste JSON hợp lệ ở Approval → badge hiện số đúng = số item pending; Clear / approve hết → badge ẩn. Không lỗi console, validate/approve vẫn hoạt động y nguyên.
**Estimate:** 30 min

---

### Step 5 — Gỡ "3-layer tab stack" Vita: đưa mod-tabs + range vào content (A.3)
**Mục tiêu:** Topbar Vita không còn 2 hàng tab xếp chồng; chuyển vào content dưới dạng segmented control.
**Files:** Sửa `health-app/dashboard.html` — HTML topbar + render Vita + JS show/hide.
**Việc làm:**
- [ ] **Bỏ** việc đặt `#mod-tabs` (`:362–366`) và `#range-row` (`:367–372`) trong `.topbar`. Hai khối này hiện được `showView()` (`:473–474`) bật/tắt bằng `style.display`. Có 2 phương án — **xem Open Question #3** trước khi chọn:
  - **(A) Di chuyển vào content header của view Vita** (render trong `renderHealth/renderWorkout/renderFinance` hoặc 1 wrapper Vita). Cần kiểm: 3 hàm render Vita (`renderHealth:1669`, `renderWorkout`, `renderFinance`) có chia sẻ 1 header không — nếu không, chèn 1 khối segmented chung ở `renderContent()` nhánh Vita (`:501–504`) trước khi set innerHTML.
  - **(B) Giữ trong topbar nhưng gộp thành 1 segmented control 2 phần** (đỡ đụng render). Ít rủi ro hơn nhưng vẫn nằm topbar.
- [ ] Dù chọn A hay B: `showTab()` (`:461–466`) và `setRange()` (`:455–460`) phải vẫn tìm được `.mtab`/`.rtab` qua `querySelectorAll` + `#mt-<tab>`. Nếu di chuyển vào content (A) → đảm bảo các id `#mt-health/#mt-workout/#mt-finance` vẫn tồn tại sau mỗi render (vì content re-render khi reload).
- [ ] Cập nhật `showView()` (`:471–475`): nếu chọn A, bỏ 2 dòng toggle `#mod-tabs`/`#range-row` display (vì không còn ở topbar); nếu B, giữ nhưng trỏ tới container mới.
**Smoke test:** Vào Vita → mod-tabs + range vẫn bấm được, đổi module/range reload đúng data; topbar không còn 2 hàng chồng (A) hoặc gộp gọn 1 hàng (B). Today/Calendar/Approval không hiện sub-control.
**Estimate:** 45 min

---

### Step 6 — Segmented control styling cho range 7/14/30/90 (A.3 / §7.2)
**Mục tiêu:** Range trở thành segmented control iOS-style (phân biệt "lọc" vs "chuyển trang"), không phải 4 nút rời.
**Files:** Sửa `health-app/dashboard.html` — CSS `.range-row`/`.rtab` (`:102–104`), giữ DOM/JS.
**Việc làm:**
- [ ] `.range-row` (`:102`): bọc thành track segmented — nền `rgba(255,255,255,.05)`, `border-radius:10px`, `padding:3px`, `gap:0`.
- [ ] `.rtab` (`:103`): bỏ nền riêng, `background:transparent`, `border-radius:8px`; giữ `min-height:var(--tap-min)`.
- [ ] `.rtab.active` (`:104`): nền nổi `var(--vita-surface-raised)` + `box-shadow:0 1px 3px rgba(0,0,0,.3)`, chữ `var(--vita-text)` (giữ active = không bão hoà theo §8.1; KHÔNG dùng `--vita-active` đặc cho cả nút để tránh quá tải xanh — xem Open Question #4).
- [ ] `.mtab`/`.mtab.active` (`:99–100`): giữ nguyên kiểu underline xanh `--vita-active` (đã đúng từ Phase 1), chỉ chỉnh spacing nếu Step 5 di chuyển vị trí.
- [ ] Không phá: range-row 4 nút vẫn 1 hàng ở 390px.
**Smoke test:** Range hiển thị dạng pill segmented; nút active nổi nền raised; 4 nút 1 hàng không wrap; bấm vẫn reload đúng range.
**Estimate:** 30 min

---

### Step 7 — `.content` padding-bottom chừa chỗ bottom nav + safe-area
**Mục tiêu:** Nội dung cuối không bị bottom nav che; home-indicator iPhone không đè nav.
**Files:** Sửa `health-app/dashboard.html` — `.content:107`.
**Việc làm:**
- [ ] `.content` padding-bottom: từ `calc(40px + env(safe-area-inset-bottom,0px))` → `calc(72px + env(safe-area-inset-bottom,0px))` (≈ chiều cao `.botnav`: icon 24 + label + padding ~64–72px). Đo lại chiều cao thật của `.botnav` sau Step 3 rồi chốt số.
- [ ] `.botnav` padding-bottom đã gồm `env(safe-area-inset-bottom)` (Step 1) → home-indicator không đè.
- [ ] Kiểm desktop (no safe-area): fallback `,0px` giữ layout không lệch.
**Smoke test:** Cuộn xuống cuối mỗi view → item cuối không bị nav che; trên simulator có notch, nav không bị home-indicator đè; desktop không dư khoảng trống bất thường.
**Estimate:** 20 min

---

### Step 8 — Integration test (regression)
**Mục tiêu:** Không vỡ gì; đạt mục tiêu Phase 2.
**Test cases:**
- [ ] Happy (430px, có data): 4 tab đáy hoạt động; Today/Vita/Calendar/Approval render đúng; tab active = icon Fill xanh + nền tím Sắc 3 + nhích lên.
- [ ] Vita: mod-tabs + range bấm được, segmented active nổi raised, reload data đúng; không còn stack 2 hàng ở topbar.
- [ ] Approval: paste JSON → badge số đúng; validate/approve/clear vẫn chạy; badge cập nhật.
- [ ] Empty: chưa có PAT / chưa connect Google → empty states render, nav vẫn hiện, badge ẩn.
- [ ] Error: PAT sai / JSON lỗi → `.err`/`.proposal-errors` hiển thị bình thường.
- [ ] Đo: mỗi `.bn` ≥44×44px; range-row không wrap; content cuối không bị nav che.
- [ ] So baseline Step 0 — chỉ khác đúng các điểm trên, không regression layout/data.
- [ ] Static (nếu không có browser): `node -e "new Function(<inline JS>)"` parse OK; grep xác nhận `.nav-tabs` đã xoá, `.botnav` tồn tại, view id `actions` còn nguyên trong showView/renderActionsTab.
**Estimate:** 30 min

---

## Rollback Plan
- Single file, không DB/migration. `git checkout health-app/dashboard.html` để revert toàn bộ.
- Mỗi step = 1 commit nhỏ → `git revert <hash>` từng step. Đặc biệt Step 3 (DOM nav) và Step 5 (di chuyển Vita controls) là 2 điểm rủi ro cao nhất — commit riêng để revert độc lập.

---

## Checklist Trước Khi Done
- [ ] Step 1–7 smoke tests pass.
- [ ] Bottom nav 4 tab, fixed đáy, safe-area; active = Option 2 + Sắc 3 (token Phase 1 tái dùng, không hardcode lại màu).
- [ ] Nhãn tab 4 = "Approval" + badge đếm pending (ẩn khi 0); view id nội bộ vẫn `actions`.
- [ ] Vita không còn stack 2 hàng tab ở topbar; range = segmented control; showTab/setRange vẫn chạy.
- [ ] `.content` chừa chỗ nav; không che nội dung.
- [ ] Icon Phosphor inline, KHÔNG thêm CDN.
- [ ] KHÔNG đụng JS data/API/validate/approve/parse; chỉ DOM + CSS + wiring show/hide + helper badge thuần đọc state.
- [ ] Không đổi `--vita-bg/surface`; giữ dark-bento identity.
- [ ] BD doc updated (các step ✅).

---

## Open Questions — ĐÃ LOCKED (user chốt 2026-05-30)

1. **FAB "Plan My Week"** — ✅ **CÓ build.** FAB góc phải dưới (trên bottom nav, tránh đè tab); bấm → `showView('actions')` + scroll tới khối Plan My Week (thêm `id="plan-my-week"` vào `renderPlanMyWeek()`). KHÔNG mở bottom-sheet mới, KHÔNG đụng JS logic data. → **Step 9 mới.**
2. **Phosphor Fill thật vs fake-fill** — ✅ **Dùng path Phosphor chính thức** (icon agent đã lấy đủ Regular+Fill, MIT, viewBox `0 0 256 256`, `fill="currentColor"`). 2 symbol/icon (outline + fill), swap khi active. **Ngoại lệ Vita:** `pulse-fill` là hình card (nhảy hình) → giữ `pulse-regular`, active chỉ đổi màu `--vita-active` + tăng stroke-weight.
3. **Vị trí mod-tabs/range (Step 5)** — ✅ **Phương án A** (vào content header Vita). Hiện thực sạch: helper `renderVitaControls()` chèn ở nhánh Vita trong `renderContent():502–504` (1 điểm chèn), đọc `currentTab`/`currentRange` để set active. **KHÔNG đụng 3 hàm renderHealth/Workout/Finance.** Gỡ 2 dòng toggle `#mod-tabs`/`#range-row` trong `showView():473–474`.
4. **Màu range active** — ✅ **Nền raised trung tính** (`--vita-surface-raised` + shadow, chữ `--vita-text`), theo §8.1, tránh quá tải xanh.
5. **Nhãn nav** — ✅ Giữ **EN** (Today / Vita / Calendar / Approval).

> **Tinh chỉnh hiện thực (so với draft):** Badge — gọi `updateApprovalBadge()` **1 chỗ ở cuối `renderContent()`** (đọc `pendingProposals.filter(e=>!e.approved).length`) thay vì wire vào validate/clear/approve, vì cả 3 hàm đó đều kết thúc bằng `renderContent()`. Đơn giản & bao phủ đủ.

---

*Opus Nexus UI/UX — BD Phase 2 v1 | 2026-05-30*
