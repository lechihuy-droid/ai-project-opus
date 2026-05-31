# BD — Build Plan: Opus Nexus UI/UX — Phase 3 (Today bento redesign)
**Date:** 2026-05-30
**Status:** ✅ Done — implemented by Codex (commits 51a57d7…34b834e on main)
**Ref:** `docs/PLAN-uiux-transformation.md` §8.1 (màu OLED) + §8.2 (bento bất đối xứng) + §7.1 (đính chính), mockup `docs/mockup-today-redesign.html` (đã duyệt), `docs/BD-phase1-foundation.md` (token), `docs/BD-phase2-navigation.md`
**Estimate:** ~2.5–3.5 giờ
**Target file:** `health-app/dashboard.html` (single file)
**Người code:** Codex (`codex exec`) — Claude viết BD/brief, KHÔNG tự code (theo CLAUDE.md routing).

> **Phase 3 = redesign khối "Vita Snapshot" trong Today** thành **bento 2-cột bất đối xứng** + **insight color-by-status**. Áp dụng "Size = Hierarchy" (§8.2) và nguyên lý màu OLED (§8.1: số = trắng trung tính, màu rực chỉ ở bar/ring/icon). **CHỈ đụng HTML/CSS/render** — KHÔNG đụng JS logic data/API/validation. Giữ dark-bento identity, không thêm CDN.

---

## Quyết định đã LOCKED (user chốt 2026-05-30)
1. **Ring Protein/Steps = `conic-gradient` CSS** theo mockup (emoji giữa ring + số/% bên cạnh — layout `ringwrap`). KHÔNG dùng `renderRing()` SVG cho Today. (Ghi chú: Vita tab vẫn giữ `renderRing()` SVG — chấp nhận 2 kiểu ring ở 2 nơi khác nhau.)
2. **Scope = CHỈ Today §8.2 + insight color-by-status.** KHÔNG làm empty-state CTA §8.3 (để Phase sau).
3. **Số liệu = trắng trung tính** (`--vita-text`); màu rực chỉ ở track-bar / ring / icon emoji (§8.1).
4. **Ngôn ngữ nhãn người-đọc = tiếng Việt** (giữ như hiện tại: "Năng lượng / Protein / Vận động / Giấc ngủ / Nhận xét hôm nay"). Brand/nav tiếng Anh (đã chốt Phase 2).

---

## Phạm vi chính xác

**Điểm sửa DUY NHẤT trong render:** `renderToday()` (`dashboard.html:587–621`) — thay khối `snapshot` (`metric-grid`, dòng 596–602) bằng bento bất đối xứng; và `renderInsight()` (`:1875–1899`) — truyền status để đổi màu viền. CSS thêm mới trong `<style>`.

**KHÔNG đụng:** `brief-card` greeting (`:605–608`), `renderCalendarContext` (`:617`), `renderTaskContext` (`:619`), `buildVitaSnapshot` (giữ nguyên; chỉ ĐỌC thêm `cHealth` để dựng chuỗi sleep — xem Step 3), `renderMetricHeroCard` (Today thôi không dùng nữa nhưng GIỮ hàm — Vita/khác có thể dùng; xác nhận grep), `renderRing`, mọi hàm Vita tab.

**Scope guard (KHÔNG làm ở P3):** empty-state CTA §8.3, radius cleanup toàn cục §E.20, đổi global `.bento` (4-col) — Today dùng grid riêng để không ảnh hưởng nơi khác. KHÔNG đụng `loadModule/reload/validate*/approve*/parse*/totalKcal/totalMacro` logic.

---

## Dữ liệu sẵn có (đọc, không sửa logic)
- `buildVitaSnapshot()` (`:572`) trả: `{ shown, isToday, kcal, protein, fiber, sleep, steps }`. `steps` đã là đơn vị "k" (chia 1000). `sleep` = `shown.sleep_hours`.
- `TARGET` (`:423` qua CONFIG): `kcal 2200, protein 130, steps 8000, sleep 7.5`.
- `cHealth` = mảng log đã load (range hiện tại), mỗi phần tử có `date`, `sleep_hours`. Dùng để dựng **mini-bars 7 ngày** cho card Giấc ngủ.
- Helper format có sẵn: `fmt`, `fmtFull`, `greeting()`, `esc()`.

---

## Token tái dùng (Phase 1) — KHÔNG hardcode lại
`--vita-text` (số trắng) · `--vita-muted`/`--vita-faint` (phụ) · `--vita-energy`/`--vita-warn` (track kcal gradient) · `--vita-protein` (ring protein) · `--vita-steps` (ring steps) · `--vita-sleep` (sleep bars) · `--vita-good`/`--vita-warn`/`--vita-bad` (insight status) · `--vita-surface`/`--vita-line` · `--vita-radius-lg`(18) / `--vita-radius-md`(14) · `--vita-gap`(8) · `--fs-cap`(11)/`--fs-body`(13).

---

## Build Steps (ordered; mỗi step = 1 commit nhỏ)

### Step 0 — Baseline
- [ ] Mở `dashboard.html` 390–430px, screenshot Today (có data + no-data) trước khi sửa.
- [x] **Đã verify:** `renderMetricHeroCard` CHỈ dùng ở `renderToday` (`:598–601`). Sau P3 → **dead code**. Theo CLAUDE.md (Surgical Changes): **GIỮ nguyên hàm, KHÔNG xoá**, chỉ ghi chú "unused sau Phase 3" cho lần dọn sau.
- [x] **Đã verify:** `cHealth` sort **desc** theo date (`:491` `b.date.localeCompare(a.date)`) → `cHealth.slice(0,7).reverse()` cho thứ tự cũ→mới. Phần tử có `sleep_hours`.
**Smoke:** App render bình thường.
**Est:** 15m

---

### Step 1 — CSS: Today snapshot bento (hero / ring / sleep) + insight status
**Mục tiêu:** Có sẵn class, chưa đổi render (reload chưa khác).
**Files:** thêm block CSS mới trong `<style>`, đặt ngay TRƯỚC `/* ── Hero Calories card ── */` (`:123`) hoặc gom 1 block "Today snapshot v2". KHÔNG sửa `.bento` global, `.metric-grid`, `.hero-cal`, `.ring-grid` (giữ cho nơi khác).
**CSS cần thêm (mô tả, Codex viết chuẩn):**
- `.snap-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:var(--vita-gap); }`
- `.sb { background:var(--vita-surface); border-radius:var(--vita-radius-lg); padding:14px; position:relative; overflow:hidden; }`  (card snapshot; tách khỏi `.b` global để không kế thừa `min-height:92px`).
- `.sb.span2 { grid-column:span 2; }`
- `.sb-label { font-size:var(--fs-cap); font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:var(--vita-muted); margin-bottom:7px; }`
- `.sb-val { font-size:30px; font-weight:800; line-height:1; letter-spacing:-.5px; color:var(--vita-text); }` (SỐ TRẮNG — §8.1)
- `.sb-unit { font-size:var(--fs-body); font-weight:600; color:var(--vita-muted); margin-left:3px; }`
- `.sb-ico { position:absolute; top:13px; right:14px; font-size:17px; opacity:.85; }`
- **Hero kcal:** `.sb-hero { display:flex; flex-direction:column; gap:10px; }` · `.sb-hero-sub { font-size:var(--fs-body); color:var(--vita-muted); font-weight:600; }` · `.track { height:7px; background:rgba(255,255,255,.07); border-radius:4px; overflow:hidden; }` · `.track > i { display:block; height:100%; border-radius:4px; background:linear-gradient(90deg,var(--vita-energy),var(--vita-warn)); }` (MÀU CHỈ Ở BAR)
- **Ring (conic-gradient):**
  - `.ringwrap { display:flex; align-items:center; gap:12px; }`
  - `.ring { position:relative; width:58px; height:58px; border-radius:50%; flex-shrink:0; background:conic-gradient(var(--c) calc(var(--p)*1%), rgba(255,255,255,.07) 0); }`
  - `.ring::after { content:""; position:absolute; inset:6px; border-radius:50%; background:var(--vita-surface); }` (khoét lỗ giữa → vành 6px)
  - `.ring i { position:absolute; inset:0; display:grid; place-items:center; font-size:15px; z-index:1; }` (emoji giữa)
  - `.ringtxt .sb-val { font-size:22px; }` · `.ringtxt small { font-size:var(--fs-cap); color:var(--vita-muted); font-weight:600; display:block; margin-top:2px; }`
  - Khi val=0 (chưa log): `--c` = `var(--vita-faint)`, `--p:0` → vành xám rỗng (xử lý ở render).
- **Sleep mini-bars:** `.bars { display:flex; align-items:flex-end; gap:5px; height:42px; margin-top:4px; }` · `.bars > span { flex:1; border-radius:3px 3px 0 0; background:var(--vita-sleep); opacity:.85; }` (cao theo % so với max của chuỗi; MÀU CHỈ Ở BAR)
- **Insight color-by-status (B.6/§8.1):**
  - `.insight2 { margin-top:var(--vita-gap); border-radius:var(--vita-radius-md); padding:13px 14px; background:var(--vita-surface); border-left:3px solid var(--vita-good); }`
  - `.insight2.warn { border-left-color:var(--vita-warn); }` · `.insight2.bad { border-left-color:var(--vita-bad); }`
  - `.insight2 .ih { font-size:var(--fs-cap); font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--vita-good); margin-bottom:6px; display:flex; gap:6px; align-items:center; }`
  - `.insight2.warn .ih { color:var(--vita-warn); }` · `.insight2.bad .ih { color:var(--vita-bad); }`
  - `.insight2 p { font-size:var(--fs-body); color:var(--vita-text); line-height:1.5; font-weight:500; }`
  - `.insight2 .ih-tips { margin-top:8px; display:flex; flex-direction:column; gap:4px; }` · `.insight2 .ih-tip { font-size:12px; color:var(--vita-muted); line-height:1.45; }` (giữ kiểu chunk bullet như `renderInsightCard` cũ khi >1 tip)
**Smoke:** Reload → KHÔNG đổi gì (class chưa dùng). Console sạch.
**Est:** 45m

---

### Step 2 — Render: thay `metric-grid` snapshot bằng bento bất đối xứng
**Mục tiêu:** Today Snapshot = Kcal hero `span2` · Protein ring · Steps ring · Sleep `span2` (§8.2).
**Files:** `renderToday()` (`:596–613`) — thay biến `snapshot` + chèn vào output.
**Việc làm:**
- [ ] Tính trong `renderToday` (đọc dữ liệu, không sửa logic):
  - `kcalPct = TARGET.kcal>0 ? Math.min(100, kcal/TARGET.kcal*100) : 0`; `kcalRemain = TARGET.kcal - kcal`.
  - `proteinPct = Math.min(100, protein/TARGET.protein*100)`; `stepsPct = Math.min(100, steps/(TARGET.steps/1000)*100)` (steps đã là "k", target/1000).
- [ ] Dựng `snapshot` mới = `<div class="snap-grid"> … </div>` gồm 4 card (xem "Markup mẫu" bên dưới). SỐ dùng `--vita-text`; track/ring/bars/emoji mang màu.
- [ ] Card "chưa log" (val=0): hiển thị `—` (tái dùng tinh thần `renderEmptyMetric`), ring `--p:0`/`--c:var(--vita-faint)`, track width 0, sub = "chưa log".
- [ ] GIỮ nguyên `<div class="stitle">Vita Snapshot</div>` + nút "Xem chi tiết Vita →" + các stitle Lịch/Việc cần làm phía sau.
**Markup mẫu (Codex bám sát, thay số bằng biến):**
```html
<div class="snap-grid">
  <!-- Kcal hero -->
  <div class="sb span2 sb-hero">
    <span class="sb-ico">🔥</span>
    <div><div class="sb-label">Năng lượng</div>
      <span class="sb-val">${kcal? kcal.toLocaleString() : '—'}</span><span class="sb-unit">/ ${TARGET.kcal.toLocaleString()} kcal</span></div>
    <div class="sb-hero-sub">${kcal? `${kcalRemain>0?`Còn lại ${kcalRemain.toLocaleString()} kcal`:`Vượt ${(-kcalRemain).toLocaleString()} kcal`} · ${kcalPct.toFixed(0)}% mục tiêu` : 'chưa log'}</div>
    <div class="track"><i style="width:${kcalPct}%"></i></div>
  </div>
  <!-- Protein ring -->
  <div class="sb">
    <div class="sb-label">Protein</div>
    <div class="ringwrap">
      <div class="ring" style="--c:${protein? 'var(--vita-protein)':'var(--vita-faint)'};--p:${proteinPct}"><i>💪</i></div>
      <div class="ringtxt"><span class="sb-val">${protein? Math.round(protein) : '—'}</span><span class="sb-unit">g</span><small>${protein? `${proteinPct.toFixed(0)}% · ${TARGET.protein}g`:'chưa log'}</small></div>
    </div>
  </div>
  <!-- Steps ring -->
  <div class="sb">
    <div class="sb-label">Vận động</div>
    <div class="ringwrap">
      <div class="ring" style="--c:${steps? 'var(--vita-steps)':'var(--vita-faint)'};--p:${stepsPct}"><i>👟</i></div>
      <div class="ringtxt"><span class="sb-val">${steps? steps.toFixed(1).replace('.',',') : '—'}</span><span class="sb-unit">k</span><small>${steps? `${stepsPct.toFixed(0)}% · ${(TARGET.steps/1000)}k`:'chưa log'}</small></div>
    </div>
  </div>
  <!-- Sleep wide (Step 3 điền bars) -->
  <div class="sb span2">…</div>
</div>
```
**Smoke:** Today render bento: kcal hàng ngang dài có track màu; 2 ring conic protein/steps có emoji giữa + số trắng bên cạnh; số liệu trắng; layout 390px không vỡ; card chưa-log hiện "—". Nút/stitle phía sau nguyên vẹn.
**Est:** 50m

---

### Step 3 — Card Giấc ngủ: mini-bars 7 ngày (đọc `cHealth`)
**Mục tiêu:** Sleep = `span2` mini-bars trend + "tối qua" + "TB" (§8.2).
**Files:** `renderToday()` — phần card sleep; có thể thêm 1 helper render thuần đọc dữ liệu (KHÔNG sửa state).
**Việc làm:**
- [ ] Lấy chuỗi 7 ngày gần nhất từ `cHealth`: `const sleepSeries = cHealth.slice(0,7).reverse().map(l => l.sleep_hours||0);` (cHealth sort desc theo date — xác nhận ở Step 0; nếu desc thì `.slice(0,7).reverse()` cho thứ tự cũ→mới).
- [ ] `sleepAvg = ` trung bình các ngày >0 (1 chữ số thập phân); `sleepLast = snap.sleep` (tối qua).
- [ ] `maxSleep = Math.max(...sleepSeries, TARGET.sleep)` để scale chiều cao bar = `(v/maxSleep*100)%` (min ~6% để bar 0 vẫn thấy vạch mảnh, hoặc ẩn).
- [ ] Markup:
```html
<div class="sb span2">
  <span class="sb-ico">😴</span>
  <div class="sb-label">Giấc ngủ · 7 ngày</div>
  <div style="display:flex;align-items:baseline;gap:6px">
    <span class="sb-val">${sleepLast? sleepLast.toFixed(1).replace('.',',') : '—'}</span>
    <span class="sb-unit">h tối qua${sleepAvg? ` · TB ${sleepAvg.toFixed(1).replace('.',',')}h`:''}</span></div>
  <div class="bars">${sleepSeries.map(v=>`<span style="height:${v?Math.max(6,v/maxSleep*100):4}%"></span>`).join('')}</div>
</div>
```
- [ ] Nếu `cHealth` rỗng/không có sleep → bars rỗng hoặc ẩn, "—".
**Smoke:** Card sleep hiện 7 cột tím cao thấp theo dữ liệu thật; "tối qua" + "TB" đúng; rỗng → "—", không lỗi.
**Est:** 30m

---

### Step 4 — Insight color-by-status (B.6)
**Mục tiêu:** Viền/nhãn insight đổi theo trạng thái (good xanh lá / warn vàng / bad đỏ).
**Files:** `renderInsight()` (`:1875–1899`) + có thể chỉnh chữ ký `renderInsightCard` HOẶC render trực tiếp class `.insight2`.
**Cách (đơn giản, không đụng logic tính tips):**
- [ ] Trong `renderInsight`, sau khi gom `tips`, xác định `status`:
  - `bad` nếu có cảnh báo nặng (vd `protein < TARGET.protein*0.4` → đã có nhánh, đặt cờ); 
  - `warn` nếu `tips.length > 0` (có điểm cần lưu ý);
  - `good` nếu `tips.length === 0`.
  (Chỉ ĐỌC các biến đã tính — không thêm rule dinh dưỡng mới.)
- [ ] Render khối `.insight2 ${status}`:
  - tiêu đề `Nhận xét hôm nay` + icon theo status (`✅` good / `⚠️` warn / `🔴` bad);
  - body: `tips.length===0` → "Đang đi đúng hướng hôm nay 🌿"; `===1` → tip đó; `>1` → "N điểm cần lưu ý hôm nay" + `.ih-tips` bullet list.
- [ ] **Quyết định hàm:** ưu tiên render thẳng `.insight2` trong `renderInsight` (Today). GIỮ `renderInsightCard` cũ nếu còn nơi khác gọi (grep xác nhận). Nếu chỉ Today gọi → có thể thay, nhưng AN TOÀN hơn là thêm path mới, không xoá.
**Smoke:** Có thiếu sót (vd protein thấp) → insight viền vàng/đỏ + nhãn đổi màu; mọi thứ ổn → viền xanh lá "đúng hướng"; số/chữ vẫn trắng đọc rõ.
**Est:** 30m

---

### Step 5 — Integration test (regression)
**Test cases:**
- [ ] Happy (430px, có data): Today = bento bất đối xứng đúng §8.2; số trắng; track/ring/bars/emoji mang màu; insight đổi màu theo status.
- [ ] Chưa log hôm nay (chỉ có ngày cũ): card hiện "—"/ring rỗng/bars theo lịch sử; không lỗi.
- [ ] Empty (chưa data): `renderToday` nhánh `!snap` giữ nguyên thông điệp cũ; không vỡ.
- [ ] Đo: không text <11px (giữ chuẩn P1); tap "Xem chi tiết Vita →" vẫn ≥44px; bento không tràn ở 390px.
- [ ] Vita tab / Calendar / Approval KHÔNG đổi (chỉ Today thay đổi).
- [ ] Static: `node -e "new Function(<inline JS>)"` parse OK; grep `metric-grid` không còn trong `renderToday` (đã thay), `renderMetricHeroCard` vẫn tồn tại nếu nơi khác dùng.
- [ ] So baseline Step 0 — chỉ khác khối snapshot + insight.
**Est:** 30m

---

## Rollback
- Single file. `git checkout health-app/dashboard.html`. Mỗi step 1 commit → revert lẻ. Step 2 (đổi render snapshot) là điểm rủi ro chính.

## Checklist trước khi Done
- [ ] Today snapshot = bento 2-col bất đối xứng (kcal hero span2 / protein ring / steps ring / sleep span2 bars).
- [ ] Ring = conic-gradient (emoji giữa + số bên cạnh); KHÔNG dùng renderRing ở Today.
- [ ] Số liệu trắng trung tính; màu CHỈ ở track/ring/bars/icon (§8.1).
- [ ] Sleep mini-bars 7 ngày từ `cHealth`; "tối qua" + "TB".
- [ ] Insight color-by-status (good/warn/bad) viền + nhãn.
- [ ] KHÔNG đụng JS data/API/validate/approve/parse; chỉ render + CSS.
- [ ] KHÔNG đổi `--vita-bg/surface`, `.bento` global, Vita/Calendar/Approval; không thêm CDN.
- [ ] Không text <11px (giữ E.17); tap target giữ ≥44px (F.21).
- [ ] BD doc updated (các step ✅) sau khi Codex xong.

---

## Brief cho Codex (tóm tắt giao việc)
> Implement Phase 3 theo BD này trên `health-app/dashboard.html` (single file, no-CDN). CHỈ sửa: thêm CSS block "Today snapshot v2" + viết lại biến `snapshot` trong `renderToday()` (`:596–613`) + card sleep (đọc `cHealth`) + `renderInsight()` color-by-status (`:1875–1899`). KHÔNG đụng JS logic data/API/validation, không đổi Vita/Calendar/Approval/global `.bento`. Bám mockup `docs/mockup-today-redesign.html` (cột "Bản đề xuất"). Số = trắng (`--vita-text`), màu chỉ ở bar/ring/bars/icon. Commit nhỏ theo từng Step; chạy `node -e "new Function(<inline JS>)"` để check syntax; báo lại các Step đã ✅ + ảnh chụp Today trước/sau.

---

*Opus Nexus UI/UX — BD Phase 3 v1 | 2026-05-30 | giao Codex*
