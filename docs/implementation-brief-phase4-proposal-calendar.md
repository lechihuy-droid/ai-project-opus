# Implementation Brief: Opus Nexus UI/UX — Phase 4

**Date:** 2026-05-31
**Implementation owner:** Codex
**Branch:** `claude/focused-fermi-gBgE7` (đã merge `origin/main`, đã revert nav gold→blue)
**Target file:** `health-app/dashboard.html` (single file)
**Spec:** `docs/BD-phase4-proposal-calendar.md` (decision-complete)

---

## Next action (1 dòng)

Implement 6 steps trong `docs/BD-phase4-proposal-calendar.md` vào `health-app/dashboard.html`, commit nhỏ từng step, push lên `claude/focused-fermi-gBgE7` (KHÔNG push lên main).

---

## Trạng thái hiện tại của branch

| Phase | Trạng thái |
|---|---|
| P1 Foundation | ✅ Done (tokens, type scale, OLED color, tap target, safe-area) |
| P2 Navigation | ✅ Done (bottom nav `.botnav`/`.bn`, Phosphor sprite, FAB, segmented range) |
| P3 Today bento | ✅ Done — snap-grid 2-col, conic rings, sleep mini-bars, insight color-by-status |
| P3 extras (Codex) | ✅ Giữ — nutrition history grouped-by-week, meal summary-first |
| Nav gold theme | ❌ **Đã revert** về blue `--vita-active #0A84FF` (commit d2eebf5) |
| P4 Proposal/Calendar | ⏳ **Việc của bạn** |

> ⚠️ **QUAN TRỌNG — màu active = BLUE, không phải gold.** Phase 1 đã lock `--vita-active: #0A84FF`. Nav gold (#D8B85A) đã bị revert vì xung đột. Đừng tái áp gold trong Phase 4.

---

## Phải làm (6 steps, xem BD để có code chi tiết)

1. **`.proposal-card.selected`** → elevation (surface-raised + box-shadow + translateY), bỏ nền green. *(CSS ~line 316)*
2. **`.proposal-approve`** → ghost (transparent bg + border), per-item nhẹ hơn batch. *(CSS ~line 324)*
3. **`.proposal-card.approved`** → collapse animation (max-height transition). *(CSS ~line 326 + `.proposal-card` base)*
4. **Batch approve** → `position: sticky` đáy + primary blue `--vita-active`. *(JS `renderProposalPreview` ~line 1252)*
5. **Calendar "Not connected"** → CTA tile centered (emoji + title + blue button). *(JS `renderCalendarContext` block `if (!gToken)` ~line 985)*
6. **Calendar empty** → thêm "Plan My Week →" CTA gọi `goPlanWeek()`. *(JS block `if (!s.timed)` ~line 1002)*

> **Line numbers là tham khảo** — confirm bằng grep trên file thật trước khi sửa (file đã merge nên có thể lệch vài dòng).

---

## Constraints (bắt buộc)

- **Single file, no CDN.** Chỉ đụng CSS + 2 render functions (`renderProposalPreview`, `renderCalendarContext`) + block `cal-empty`.
- **KHÔNG đụng** JS logic: validation, `runApproval`/`approveSelected`/`approveOne`, `clearProposals`, parse/normalize, Google API.
- **Clear button đã có sẵn** (line ~1120) — KHÔNG làm lại (BD ghi NO-OP).
- **Màu:** active = blue `--vita-active`; green CHỈ cho "good/success" (§8.1 OLED). Số/chữ trung tính, màu chỉ ở graphic.
- **Branch:** push `claude/focused-fermi-gBgE7`, KHÔNG push main.

---

## Validation sau mỗi batch

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('health-app/dashboard.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);new Function(m[1]);console.log('JS OK');"
```

Smoke checklist (mỗi step có trong BD):
- Proposal: tick → card nổi lên (shadow, KHÔNG green); approve → collapse ~44px; per-item ghost outline; batch sticky blue đáy.
- Calendar no-token: tile CTA centered, button blue.
- Calendar empty: có "Plan My Week →" → click scroll tới Plan My Week.
- Regression: Today/Vita/Calendar khác không vỡ; approval badge vẫn đúng.

---

## Open items cho Claude review sau khi Codex xong

- [ ] Visual verify 3 view ở 430px (cần browser thật — Codex báo bị chặn `file://`).
- [ ] Confirm không tái xuất hiện màu gold/non-blue active.

---

*Opus Nexus UI/UX — Handoff Codex Phase 4 | 2026-05-31*
