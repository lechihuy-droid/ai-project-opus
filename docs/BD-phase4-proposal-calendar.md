# BD — Build Plan: Opus Nexus UI/UX — Phase 4 (Proposal UX + Calendar Empty State)

**Date:** 2026-05-31
**Status:** Draft — awaiting user approval before Codex implement
**Ref:** `docs/PLAN-uiux-transformation.md` §7.2, §8.3, §C.10, §C.11, §D.16
**Target file:** `health-app/dashboard.html` (single file)
**Depends on:** Phase 3 merged into feature branch first

---

## Scope

| Item | PLAN ref | Done? |
|---|---|---|
| `.selected` → elevation (surface raised + shadow, not green) | §7.2 / C.10 | ❌ |
| `.approved` → collapse animation | §7.2 / C.11 | ❌ |
| Per-item approve → ghost style (vs batch primary) | §7.2 / C.10 | ❌ |
| Batch "Approve" → `position:sticky` bottom | §7.2 / C.10 | ❌ |
| Clear button | §7.2 / C.9 | ✅ already at line 1120 — NO-OP |
| Calendar "Not connected" → styled CTA tile | §8.3 / D.16 | ⚠️ has basic btn, needs visual upgrade |
| Calendar `cal-empty` → Plan My Week CTA | §8.3 / D.16 | ❌ |

---

## Locked Decisions

- **Proposal selected = elevation** (không phải green checked). Green chỉ dành cho "success/good" (§8.1 OLED principle). Selected = "đang được nâng lên để duyệt" → surface raised + shadow.
- **Per-item approve = ghost**; batch approve = primary (filled). Phân tầng visual rõ theo C.10.
- **Collapse approved** = CSS max-height transition, không dùng JS remove node (để user thấy "đã xử lý" rồi biến mất nhẹ nhàng).
- **Cal CTA**: "Kết nối Calendar" button đã tồn tại (line 989, `onclick="connectCalendar()"`). Phase 4 chỉ upgrade visual thành "CTA tile" kiểu bento, không thay đổi logic.
- **Không đụng**: JS validation/API/data logic, approval flow (runApproval, approveSelected), Clear logic.

---

## Build Steps

### Step 1 — Proposal selected: elevation CSS (line 316)
**Mục tiêu:** Card được chọn trông "nổi lên" thay vì "xanh lá".
**Thay đổi CSS** (dòng 316):
```css
/* Trước: */
.proposal-card.selected { border-color: rgba(48,209,88,.55); background: rgba(48,209,88,.08); }

/* Sau: */
.proposal-card.selected {
  background: var(--vita-surface-raised);
  box-shadow: 0 4px 18px rgba(0,0,0,.38), 0 0 0 1.5px rgba(255,255,255,.11);
  transform: translateY(-2px);
  transition: transform .2s ease, box-shadow .2s ease;
}
```
**Smoke test:** Tick vào 1 proposal → card nổi lên nhẹ, không còn màu xanh lá.

---

### Step 2 — Per-item Approve: ghost style (line 324)
**Mục tiêu:** Per-item approve rõ ràng là secondary vs batch primary (§C.10).
**Thay đổi CSS** (dòng 324):
```css
/* Trước: */
.proposal-approve { flex-shrink: 0; background: rgba(48,209,88,.16); color: var(--vita-good); border: none; border-radius: 8px; min-height: var(--tap-min); padding: 0 11px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; }

/* Sau: */
.proposal-approve {
  flex-shrink: 0;
  background: transparent;
  color: var(--vita-good);
  border: 1px solid rgba(48,209,88,.45);
  border-radius: 8px;
  min-height: var(--tap-min);
  padding: 0 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
.proposal-approve:active { background: rgba(48,209,88,.12); }
```
**Smoke test:** Per-item approve = outline ghost; batch button (Step 3) = filled blue — phân tầng rõ.

---

### Step 3 — Approved: collapse animation CSS (line 326)
**Mục tiêu:** Sau khi approve, card thu gọn thay vì dim nguyên chiều cao (§C.11).
**Thay đổi CSS** (dòng 326):
```css
/* Thêm vào .proposal-card chung: */
.proposal-card {
  /* hiện tại */
  display: flex; gap: 11px; align-items: flex-start;
  background: var(--vita-surface); border: 1px solid var(--vita-line);
  border-radius: var(--vita-radius-lg); padding: 13px;
  /* thêm: */
  overflow: hidden;
  max-height: 300px;
  transition: max-height .35s ease, opacity .25s ease, padding .3s ease;
}

/* Approved: thu gọn */
.proposal-card.approved {
  max-height: 44px;
  opacity: .55;
  padding-top: 11px;
  padding-bottom: 11px;
  border-color: rgba(48,209,88,.2);
  background: transparent;
}
```
**Lưu ý:** `.proposal-card.approved` render vẫn giữ nguyên markup (`.proposal-ok ✓` đã có ở line 332). Khi collapsed chỉ thấy hàng đầu (title + ✓).
**Smoke test:** Approve 1 item → card collapse xuống ~44px, thấy "✓ Title", mượt mà.

---

### Step 4 — Sticky batch Approve button (renderProposalPreview, line 1252–1259)
**Mục tiêu:** Batch approve dính ở đáy khi cuộn danh sách proposal dài (§C.10).

**CSS mới** (thêm vào block CSS, sau `.proposal-card.editing`):
```css
.proposal-sticky-bar {
  position: sticky;
  bottom: calc(var(--vita-gap) + 82px + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  padding: 10px 0;
}
.proposal-sticky-bar .action-btn {
  background: var(--vita-active);
  color: #fff;
  box-shadow: 0 4px 16px rgba(10,132,255,.35);
}
.proposal-sticky-bar .action-btn:disabled {
  background: rgba(255,255,255,.08);
  color: var(--vita-faint);
  box-shadow: none;
}
```

**JS thay đổi** trong `renderProposalPreview()` (line 1252–1259):
```js
/* Trước: */
const batchBtn = pending.length > 1
  ? `<button class="action-btn" onclick="approveSelected()" style="margin-top:var(--vita-gap)" ${selectedIdx.size ? '' : 'disabled'}>Approve ${selectedIdx.size} mục đã chọn</button>`
  : '';
return `<div class="stitle">Preview · ${validCount}/${pending.length} chờ duyệt</div>
  <div style="display:flex;flex-direction:column;gap:var(--vita-gap)">
    ${pendingProposals.map((ev, idx) => renderProposalCard(ev, selectedIdx.has(idx), idx)).join('')}
  </div>
  ${batchBtn}`;

/* Sau: */
const batchBtn = pending.length > 1
  ? `<div class="proposal-sticky-bar">
       <button class="action-btn" onclick="approveSelected()" ${selectedIdx.size ? '' : 'disabled'}>
         Duyệt ${selectedIdx.size || ''} mục đã chọn
       </button>
     </div>`
  : '';
return `<div class="stitle">Preview · ${validCount}/${pending.length} chờ duyệt</div>
  <div style="display:flex;flex-direction:column;gap:var(--vita-gap)">
    ${pendingProposals.map((ev, idx) => renderProposalCard(ev, selectedIdx.has(idx), idx)).join('')}
  </div>
  ${batchBtn}`;
```
**Smoke test:** Có ≥2 proposals → cuộn danh sách → "Duyệt N mục" dính ở đáy trên bottom nav. Khi chưa chọn item nào → button disabled + grey. Khi chọn ≥1 → button active + blue.

---

### Step 5 — Calendar "Not connected" CTA tile (renderCalendarContext, line 985–991)
**Mục tiêu:** Upgrade từ brief-card đơn giản → CTA tile kiểu bento, visual weight rõ hơn (§8.3/D.16).

**JS thay đổi** (line 985–991, block `if (!gToken)`):
```js
/* Trước: */
if (!gToken) {
  return `<div class="brief-card">
    <span class="status-pill">Not connected</span>
    <div style="font-size:13px;color:var(--vita-muted);margin-top:10px">Kết nối read-only để Nexus hiểu nhịp tuần.</div>
    <button class="action-btn" onclick="connectCalendar()" style="margin-top:10px">Kết nối Calendar</button>
    ${calError ? `<div class="proposal-errors">${esc(calError)}</div>` : ''}
  </div>`;
}

/* Sau: */
if (!gToken) {
  return `<div class="brief-card" style="text-align:center;padding:22px 16px">
    <div style="font-size:28px;margin-bottom:10px">📅</div>
    <div style="font-size:15px;font-weight:800;margin-bottom:6px">Chưa kết nối Calendar</div>
    <div style="font-size:13px;color:var(--vita-muted);line-height:1.55;margin-bottom:14px">
      Kết nối read-only để Nexus đọc nhịp tuần và gợi ý đúng thời điểm.
    </div>
    <button class="action-btn" onclick="connectCalendar()" style="background:var(--vita-active);color:#fff;max-width:240px;margin:0 auto">
      Kết nối Google Calendar →
    </button>
    ${calError ? `<div class="proposal-errors" style="margin-top:10px">${esc(calError)}</div>` : ''}
  </div>`;
}
```
**Smoke test:** Không có gToken → tile bento centered, emoji lớn, button xanh rõ ràng, text ngắn gọn.

---

### Step 6 — Calendar `cal-empty`: Plan My Week CTA (line 1002–1006)
**Mục tiêu:** Khi connected nhưng lịch trống 7 ngày → khuyến khích lên kế hoạch thay vì text thụ động (§8.3/D.16).

**JS thay đổi** (line 1002–1005, block `if (!s.timed)`):
```js
/* Trước: */
if (!s.timed) {
  return `${header}
    <div class="cal-empty">📅 Lịch trống 7 ngày tới${s.allDay ? ` (${s.allDay} sự kiện cả ngày)` : ''}.<br>Chưa có gì để Nexus phân tích — cứ lên kế hoạch thoải mái.</div>
  </div>`;
}

/* Sau: */
if (!s.timed) {
  return `${header}
    <div class="cal-empty">
      <div>📅 Lịch trống 7 ngày tới${s.allDay ? ` (${s.allDay} sự kiện cả ngày)` : ''}.</div>
      <div style="margin-top:4px">Chưa có gì để Nexus phân tích.</div>
      <button class="action-btn secondary-btn" onclick="goPlanWeek()" style="margin-top:12px;max-width:200px;margin-left:auto;margin-right:auto">Plan My Week →</button>
    </div>
  </div>`;
}
```
**Smoke test:** Connected + no timed events → thấy "Plan My Week →" CTA; click → scroll đến Plan My Week section trong Approval tab.

---

### Step 7 — Integration test (regression)
**Kiểm tra:**
- `node -e "new Function(...)"` với toàn bộ inline JS → phải OK
- Proposal list: selected nổi lên (shadow, no green), approved collapse (44px), per-item ghost, batch sticky blue
- Calendar no-token: tile CTA centered
- Calendar empty: có "Plan My Week →" button
- Các view Today/Vita/Calendar còn lại không regression
- Approval badge vẫn update đúng
- Clear button vẫn hoạt động (không đụng → nên vẫn OK)
**Estimate:** 30 min

---

## Brief cho Codex

> **Task:** Implement Phase 4 của Opus Nexus UI/UX transform trong `health-app/dashboard.html` theo đúng 6 bước trong BD này.
>
> **Constraint:**
> - Single file, no CDN, no JS logic change — chỉ CSS + renderProposalPreview + renderCalendarContext + cal-empty block
> - Sau mỗi batch sửa: chạy `node -e "new Function(require('fs').readFileSync('health-app/dashboard.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1])"` kiểm tra syntax
> - Commit nhỏ theo từng step
> - Line numbers trong BD là của feature branch (sau khi merge Phase 3 — confirm với actual file trước khi sửa)
>
> **Files:** `health-app/dashboard.html` (target), `docs/BD-phase4-proposal-calendar.md` (spec này)

---

*Opus Nexus UI/UX — BD Phase 4 v1 | 2026-05-31*
