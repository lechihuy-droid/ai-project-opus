# Prompt — Dán thẳng vào Codex (toàn bộ nội dung dưới đây)

---

```
Bạn là một senior UI/UX engineer đang pair review với tôi.

## Nhiệm vụ

Đọc file `health-app/dashboard.html` trong repo này, sau đó trả lời 25 câu hỏi review bên dưới.
Chưa fix gì cả — chỉ output findings list. Tôi sẽ chọn issue rồi mới implement.

---

## Context: Opus Nexus

Single-file SPA chạy trên mobile (iPhone bookmark). Không có backend.
Toàn bộ code nằm trong `health-app/dashboard.html` (~2257 dòng): HTML + CSS trong `<style>` + JS trong `<script>`.

**4 view** (nav tabs đầu trang, dòng 345–348):
- **Today** — brief hằng ngày: Vita snapshot + Calendar context + Tasks
- **Vita** — Health / Workout / Finance dashboard đọc từ GitHub JSON
- **Calendar** — upcoming events + Calendar Context card + nút Plan My Week
- **Actions** — paste LLM JSON → validate → preview proposal cards → approve → ghi Google Calendar/Tasks

**Visual:** Dark bento (Apple Health/Fitness inspired), iOS dark theme, mobile-first ~430px.

---

## Design System

**CSS tokens** (`:root`, dòng 14–65):
```css
--vita-bg:             #090A0F    /* page bg */
--vita-surface:        #151720    /* card */
--vita-surface-2:      #1D202B    /* nested card */
--vita-surface-raised: #242735    /* elevated/selected */
--vita-line:           rgba(255,255,255,.08)

--vita-text:  #F7F8FA
--vita-muted: #9BA1AE
--vita-faint: #5F6675

--vita-energy:  #FF453A   /* kcal */
--vita-protein: #0A84FF
--vita-carb:    #FF9F0A
--vita-fat:     #BF5AF2
--vita-fiber:   #30D158
--vita-water:   #5AC8FA
--vita-sleep:   #8E7CFF
--vita-steps:   #FFD60A
--vita-good:    #30D158   /* success / active state */
--vita-warn:    #FF9F0A
--vita-bad:     #FF453A

--vita-radius-sm: 10px
--vita-radius-md: 14px
--vita-radius-lg: 18px
--vita-radius-xl: 24px
--vita-gap:       8px
--vita-page-pad:  12px
```

**Key CSS classes:**
| Class | Dòng | Mô tả |
|---|---|---|
| `.bento` | 98 | 4-col grid cho bento cells |
| `.b` | 99 | Bento cell: surface bg, radius-lg, padding 14px, min-height 92px |
| `.b-val` | 106 | Metric value: 28px font, weight 800 |
| `.ring-grid` | 127 | 4-col ring grid (macro rings) |
| `.ring-cell` | 128 | Ring + label, radius-md |
| `.macro-card` | 138 | Full-width macro progress bar card |
| `.insight-card` | 148 | Insight/advice card |
| `.brief-card` | 254 | Today view generic card |
| `.nav-tab` | 250 | Top nav pill; `.active` → green bg (#30D158), black text |
| `.mtab` | 87 | Sub-tab Health/Workout/Finance; `.active` → green border-bottom |
| `.action-btn` | 257 | Full-width button, rgba white bg |
| `.secondary-btn` | 260 | Teal variant |
| `.proposal-card` | 279 | Proposal item: flex row, border; `.selected` → green border; `.approved` → dim |
| `.cal-event` | 308 | Calendar event row |

---

## Render map (để navigate nhanh)

```
renderToday()          dòng 513
  ├── bento 4 cells: kcal / protein / sleep / steps vs target
  ├── renderInsight()                 → "Nhận xét hôm nay" card
  ├── [button] Xem chi tiết Vita →
  ├── renderCalendarContext(compact=true)
  └── renderTaskContext()             → open tasks + overdue badges

renderCalendarTab()    dòng 972
  ├── renderCalendarContext(compact=false)
  ├── calEvents list (tối đa 12): renderCalendarEvent(ev)  dòng 983
  └── [button] Plan My Week →

renderActionsTab()     dòng 1036
  ├── [textarea] paste JSON
  ├── [button] Validate
  ├── renderProposalPreview()         dòng 1174
  │     └── renderProposalCard(ev, selected, idx)  dòng 606
  │           ├── checkbox | icon | title / time / type
  │           ├── [button] ✓ Approve  (per-item)
  │           └── [button] ✎ Sửa → renderProposalEditor(ev, idx)  dòng 646
  ├── counter "X sự kiện chờ duyệt"
  └── [button] Duyệt tất cả  (chỉ khi >1 pending)

renderPlanMyWeek()     dòng 1284
  ├── [button] ✨ Plan My Week
  └── [textarea] generated LLM prompt → user copy
```

---

## 25 câu hỏi review

Với mỗi câu: đọc code thật tại dòng tương ứng, đưa ra nhận xét + severity + đề xuất cụ thể.
Severity: 🔴 blocker (broken UX) / 🟠 friction (gây khó dùng) / 🟡 polish (minor).

### A. Navigation & Information Architecture
1. 4 tab Today/Vita/Calendar/Actions — tên có tự giải thích không? User mới có hiểu "Actions" làm gì không?
2. Today view (dòng 513–545) có đúng là "brief" không, hay quá dày thông tin cho màn hình đầu tiên?
3. Vita có 2 tầng tab: `.mtab` (Health/Workout/Finance, dòng 87) + `.rtab` range (7/14/30/90, dòng 91) — hai tầng tab có gây confusion layout không?
4. Plan My Week nằm trong Actions tab (dòng 1284) — placement có intuitive không hay nên đưa lên Calendar tab?

### B. Today View
5. Bento 4 cells (kcal/protein/sleep/steps) — mỗi cell chỉ hiện số và label, không có progress bar/ring vs target — thiếu visual progress không?
6. `renderInsight()` card (dòng 1801) đặt ngay sau bento — card text có bị bury không? User thực tế có đọc không?
7. `renderCalendarContext(compact=true)` ở Today — compact version có đủ thông tin actionable không?
8. `renderTaskContext()` dòng 944 — badge "quá hạn" có đủ nổi bật không (màu, size)?

### C. Proposal / Actions UX
9. Workflow paste JSON → Validate → cards → Approve: đọc code từ dòng 1036 đến 1174 — friction lớn nhất ở bước nào?
10. Layout proposal card (dòng 279, 606): có cả per-item "✓ Approve" lẫn batch "Duyệt tất cả" — hai button có conflict/confuse nhau không?
11. `.proposal-card.approved` (dòng 290): opacity .75, text "Đã thêm" — feedback này có đủ clear về success không?
12. `renderProposalEditor` dòng 646: edit form inline trong card — trên mobile 430px có usable không?
13. Error display sau validate fail — tìm trong renderActionsTab/renderProposalPreview và đánh giá visibility.

### D. Calendar Tab
14. `renderCalendarEvent(ev)` dòng 983: time format, icon, type label — readable trên small screen không?
15. `renderCalendarContext` dòng 900: busy level / free windows text — có actionable không hay chỉ descriptive?
16. Empty state khi `gapiReady=false` hoặc chưa connect — hướng dẫn user có đủ không?

### E. Visual & Typography
17. Font scale: 10px label → 12px body → 13px action-btn → 28px metric → 42px hero-cal — scale có hài hòa không? Có size nào quá nhỏ cho mobile không?
18. 8 màu semantic (energy/protein/carb/fat/fiber/water/sleep/steps) cùng xuất hiện — có overload không, hay mỗi màu có role rõ ràng đủ để user nhớ?
19. `.nav-tab.active` dùng `--vita-good` (#30D158, green) làm active state (dòng 251) — dùng "good/success" color cho "selected tab" có semantically đúng không?
20. Radius usage: `.b` dùng `radius-lg` (18px, dòng 99), `.ring-cell` dùng `radius-md` (14px, dòng 129), `.brief-card` dùng `radius-lg` (dòng 254) — có nhất quán không?

### F. Mobile-first
21. `.nav-tab` padding `8px 4px` (dòng 250), `.action-btn` padding `11px` (dòng 257) — tính computed height, đủ 44px touch target iOS guideline chưa?
22. Topbar (navbar) là `position: sticky` hoặc `fixed`? Tìm dòng 76–84. Content có bị che bởi navbar không khi scroll?
23. Textarea trong Actions tab — height mặc định bao nhiêu? Khi keyboard mobile popup, layout có bị đẩy/cắt không?

### G. Tone & Labels
24. Thống kê labels: bao nhiêu chỗ dùng tiếng Anh, bao nhiêu tiếng Việt trong UI text (không tính code). Mix có nhất quán không?
25. Trong cùng approve flow: button per-item là "✓ Approve" (English), batch là "Duyệt tất cả" (Vietnamese) — có nên đồng nhất không và theo hướng nào?

---

## Output format

```
## Findings

### 🔴 Blockers
- [A.X] <vấn đề> → <đề xuất>
  dashboard.html dòng <N>

### 🟠 Friction
- [B.X] <vấn đề> → <đề xuất>
  dashboard.html dòng <N>

### 🟡 Polish
- [C.X] <vấn đề> → <đề xuất>
  dashboard.html dòng <N>
```

Đưa ra **tất cả** findings theo từng câu. Sau đó tóm tắt: top 3 issue đáng fix nhất theo impact/effort.
Không implement gì — chỉ list findings. Tôi sẽ chọn rồi mới bảo fix.

---

## Constraints khi fix sau này

- Chỉ sửa HTML/CSS/render functions — không đụng JS logic (API calls, data processing, validation rules).
- Toàn bộ thay đổi nằm trong `health-app/dashboard.html` (single file).
- Không thêm external CDN.
- Giữ dark bento identity — không đổi color scheme hay design language tổng thể.
```
