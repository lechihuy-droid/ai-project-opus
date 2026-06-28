# Review Brief: Opus Nexus UI/UX

> **Dành cho:** Codex + user pair review session  
> **Mục tiêu:** Rà soát toàn bộ UI/UX của `health-app/dashboard.html`, chỉ ra vấn đề và đề xuất cải thiện — **không viết code ngay**, output là danh sách findings trước.  
> **File duy nhất cần xem:** `health-app/dashboard.html` (~2257 dòng)

---

## 1. Bối cảnh app

**Opus Nexus** là single-file SPA chạy trên mobile (bookmark iPhone). Không có backend — mọi thứ là HTML + CSS + JS thuần, mở thẳng bằng browser là chạy được.

**4 view chính** (nav tab ở đầu trang):
| View | Mục đích |
|---|---|
| Today | Brief hằng ngày: Vita snapshot + Calendar context + Tasks |
| Vita | Health / Workout / Finance dashboard từ GitHub data |
| Calendar | Upcoming events + Calendar Context card + Plan My Week |
| Actions | Paste LLM JSON → validate → preview proposal cards → approve → insert Google Calendar/Tasks |

**Stack visual:** Dark bento (Apple Health/Fitness inspired), iOS-like dark theme, mobile-first (max-width ~430px trên phone). CSS design tokens trong `:root` dùng prefix `--vita-*`.

---

## 2. Design System

### CSS Tokens (`:root`, dòng 14–65)
```css
/* Surface */
--vita-bg:             #090A0F   /* page background */
--vita-surface:        #151720   /* card */
--vita-surface-2:      #1D202B   /* nested card */
--vita-surface-raised: #242735   /* elevated / selected */
--vita-line:           rgba(255,255,255,.08)

/* Text */
--vita-text:  #F7F8FA
--vita-muted: #9BA1AE
--vita-faint: #5F6675

/* Macro colors */
--vita-energy:  #FF453A   /* kcal / red */
--vita-protein: #0A84FF   /* blue */
--vita-carb:    #FF9F0A   /* orange */
--vita-fat:     #BF5AF2   /* purple */
--vita-fiber:   #30D158   /* green */

/* Utility colors */
--vita-water:  #5AC8FA   /* teal */
--vita-sleep:  #8E7CFF   /* lavender */
--vita-steps:  #FFD60A   /* yellow */
--vita-good:   #30D158   /* success / active */
--vita-warn:   #FF9F0A
--vita-bad:    #FF453A

/* Radius */
--vita-radius-sm: 10px
--vita-radius-md: 14px
--vita-radius-lg: 18px
--vita-radius-xl: 24px
--vita-gap:      8px
--vita-page-pad: 12px
```

### Key CSS classes

| Class | Dòng | Mô tả |
|---|---|---|
| `.bento` | 98 | 4-col grid cho bento cells |
| `.b` | 99 | Bento cell: surface bg, radius-lg, padding 14px, min-height 92px |
| `.b-val` | 106 | Metric value: 28px, 800 weight |
| `.ring-grid` | 127 | 4-col ring grid (macro rings) |
| `.ring-cell` | 128 | Ring + label cell, radius-md |
| `.macro-card` | 138 | Full-width macro bar card |
| `.insight-card` | 148 | Insight / advice card |
| `.brief-card` | 254 | Today view card (generic surface) |
| `.nav-tab` | 250 | Top nav pill button; `.active` → green bg, black text |
| `.mtab` | 87 | Sub-tab (Health/Workout/Finance); `.active` → green border-bottom |
| `.action-btn` | 257 | Full-width button, rgba white bg |
| `.secondary-btn` | 260 | Teal variant |
| `.proposal-card` | 279 | Proposal item: flex row, border, `.selected` → green border, `.approved` → dim |
| `.cal-event` | 308 | Calendar event row in Calendar tab |

---

## 3. Cấu trúc render từng view

### Today (dòng 513–545)
```
renderToday()
  ├── Vita snapshot: bento grid 4 cells (kcal/protein/sleep/steps vs target)
  ├── renderInsight()         → insight card (nhận xét hôm nay)
  ├── [button] Xem chi tiết Vita →
  ├── renderCalendarContext(compact=true)   → calendar summary card
  └── renderTaskContext()     → task count + overdue badges
```

### Calendar (dòng 972–981)
```
renderCalendarTab()
  ├── renderCalendarContext(compact=false)  → full calendar context card
  ├── [list] calEvents (tối đa 12): renderCalendarEvent(ev)
  └── [button] Plan My Week →
```

### Actions (dòng 1036–1172)
```
renderActionsTab()
  ├── [textarea] Paste JSON proposal
  ├── [button] Validate
  ├── renderProposalPreview()
  │     └── pendingProposals.map → renderProposalCard(ev, selected, idx)
  │           ├── checkbox | icon | title/time/type
  │           ├── [button] ✓ Approve (per-item)
  │           └── [button] ✎ Sửa → renderProposalEditor(ev, idx)
  ├── [counter] X sự kiện chờ duyệt
  └── [button] Duyệt tất cả (chỉ khi >1 pending)
```

### Plan My Week (dòng 1284–1493, trong Actions tab)
```
renderPlanMyWeek()
  ├── [button] ✨ Plan My Week
  └── [textarea] prompt output → copy
      buildPlanPrompt(ctx)
        ├── THÓI QUEN THỰC TẾ (habits từ history)
        ├── LỊCH TUẦN (events)
        ├── KHUNG GIỜ TRỐNG (free slot map)
        └── HARD RULES
```

---

## 4. Câu hỏi review cần trả lời

Codex và user cùng nhau đi qua từng nhóm. Với mỗi issue: **severity** (🔴 blocker / 🟠 friction / 🟡 polish) + **đề xuất cụ thể**.

### A. Navigation & Information Architecture
1. 4 tab (Today / Vita / Calendar / Actions) — tên có rõ không? User mới có hiểu Actions làm gì không?
2. Today view có đủ "brief" không hay quá nhiều thông tin?
3. Sub-tab Vita (Health / Workout / Finance) + range tab (7/14/30/90) — 2 tầng tab có gây confusion không?
4. "Plan My Week" nằm trong Actions tab — placement có intuitive không hay nên lên Calendar?

### B. Today View
5. Vita snapshot (4 bento cells: kcal/protein/sleep/steps) — data density OK không? Missing goals progress visual?
6. `renderInsight()` card ngay dưới — người dùng có đọc không hay bị skip?
7. Calendar context compact card — đủ thông tin hay quá tóm tắt?
8. Task context card — badge "quá hạn" có nổi bật đủ không?

### C. Proposal / Actions UX
9. Workflow: paste JSON → Validate → xem cards → Approve — friction ở đâu? Có cần confirm step không?
10. Per-item Approve button vs batch Approve — layout có clear không? Hai button có confusing không?
11. Card `.approved` (dim + "Đã thêm") — user có biết action đã thành công không?
12. Edit proposal (`renderProposalEditor`) — form có usable không trên mobile?
13. Error state khi validate fail — hiển thị đủ rõ không?

### D. Calendar Tab
14. Event list — density, time format, icon/type label có readable không?
15. Calendar Context card (busy level / free windows) — thông tin có actionable không?
16. Khi chưa connect Google Calendar — empty state có hướng dẫn đủ không?

### E. Visual & Typography
17. Font sizes: `10px` label, `12px` body, `13px` action-btn, `28px` metric — scale có consistent không?
18. Color usage: 8+ màu khác nhau (energy/protein/carb/fat/fiber/water/sleep/steps) — có overload không?
19. `.nav-tab.active` dùng `--vita-good` (green, #30D158) làm active indicator — dùng green cho "active" có semantically đúng không (vs selected/focused)?
20. Card radius: `radius-sm`=10 / `md`=14 / `lg`=18 / `xl`=24 — sử dụng có nhất quán không?

### F. Mobile-first
21. Touch target size — `.nav-tab` padding 8px 4px, `.action-btn` padding 11px — đủ 44px touch target chưa?
22. Scroll behavior — content page có bị navbar che không?
23. Textarea paste (Actions tab) — height mặc định, keyboard pop-up có đẩy layout không?

### G. Tone & Labels
24. Mix tiếng Việt / tiếng Anh — có nhất quán không? (VD: "Today" tab vs "Nhận xét hôm nay" card)
25. "Duyệt tất cả" vs "✓ Approve" — 2 language trong cùng flow có OK không?

---

## 5. Cách mở app để xem

```bash
# Option 1 — trực tiếp trên browser
open health-app/dashboard.html   # macOS
# hoặc drag file vào browser address bar

# Option 2 — local server (tránh CORS nếu test với GitHub data)
cd health-app && python3 -m http.server 8080
# mở: http://localhost:8080/dashboard.html
```

Để test không cần data thật: app render được ngay khi mở — nếu chưa có PAT/Google auth, sẽ hiện empty states. Đủ để review UI layout/visual.

---

## 6. Output mong đợi

Sau review, Codex output một **findings list** theo format:

```
## Findings

### 🔴 Blockers
- [A.1] Tab "Actions" tên không rõ → đổi thành "Proposals" hoặc thêm tooltip
  File: dashboard.html dòng 346

### 🟠 Friction
- [C.9] Workflow paste JSON thiếu clear button sau validate thành công
  File: dashboard.html dòng 1036 (renderActionsTab)

### 🟡 Polish
- [E.20] .bento cell dùng radius-lg (18px) nhưng ring-cell dùng radius-md (14px) — không nhất quán
  File: dashboard.html dòng 99 vs 129
```

Sau khi user đọc và chọn những issue muốn fix → Codex mới bắt đầu implement.

---

## 7. Scope constraint

- **Chỉ review** HTML/CSS/render functions — không đụng JS logic (API calls, data processing, validation rules).
- Mọi thay đổi sau này phải nằm trong `health-app/dashboard.html` (single file).
- Không thêm external CDN dependency.
- Giữ dark bento visual identity — không đổi màu nền hay design language.
