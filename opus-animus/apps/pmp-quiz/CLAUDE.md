# PMP Quiz App

Vanilla JS SPA giúp ôn thi PMP — không có build tool, không có backend, state lưu ở localStorage.

## Chạy & deploy local
```bash
cd "C:/Users/HUY/AI/OPUS ANIMUS/apps/pmp-quiz"
python -m http.server 8000
```
Mở http://localhost:8000/. Không mở file:// trực tiếp (fetch module sẽ fail).

## Stack
- Vanilla ES modules (không build, không bundler)
- CSS thuần (`assets/css/styles.css`)
- Data: `data/questions.json` (1385 câu, đã annotate domain)
- Persistence: `localStorage` only

## Cấu trúc
- `index.html` — shell (topbar + `<main id="view">`)
- `assets/js/app.js` — router + state máy, gọi render
- `assets/js/views.js` — **pure render functions**, nhận data + handlers
- `assets/js/plan.js` — tính phase (Coverage/Review/Mock/Taper), generate schedule
- `assets/js/storage.js` — localStorage wrappers + computeStats/weakestDomain/last7DaysActivity
- `assets/js/quiz.js` — Quiz state machine (practice/review mode)
- `assets/js/domain.js` — gắn domain cho câu hỏi

Router state: `{ route, quiz, pendingPick, lastSession }`. Routes: `home | settings | setup-practice | quiz | result | history | stats`.

## Quy ước code
- Views là pure: chỉ nhận data + handlers, không gọi storage/import lung tung
- `el(tag, attrs, children)` helper trong `views.js` — children có thể là string/Node/array, `null` tự filter
- Không thêm comment mô tả "what" — chỉ comment "why" khi không hiển nhiên
- Vietnamese trong UI copy, English trong code/identifier
- Không tạo file .md tài liệu mới trừ khi user yêu cầu

## Trạng thái tính năng

### Đã xong
- **Home redesign (v2)**: hero navy gradient + countdown + smart CTA + ring progress · stacked coverage bar · today task list (checkbox + time estimate) · 7-day heatmap · weak-domain card · mode-mini row (3 nút)
- **Auto-schedule**: settings screen — chọn ngày thi → auto-fill dailyGoal gợi ý + hiển thị roadmap 4 phase với ngày cụ thể
- **Smart CTA**: `pickPrimaryCta()` trong views.js chọn action theo phase + goal status
- **Mock exam 60 câu**: dùng `startPractice(60)` qua `onStartMock`
- **Domain drill**: `startDomain(domain, 15)` cho weak domain

### Issue đang open
- **Home trắng sau redesign**: user báo màn hình home blank sau khi apply redesign v2. Đã thêm try/catch trong `render()` (app.js) để lỗi hiện ra thay vì blank. Chưa xác nhận root cause — cần user hard-reload (Ctrl+Shift+R) + check DevTools Console. Nghi ngờ: browser cache hoặc runtime error trong renderHome.

### Ý tưởng chưa làm
- Flashcard mode, bookmark câu hỏi, ghi chú cá nhân
- Dark mode, keyboard shortcut, search câu hỏi
- Export/import progress
- Phân tích điểm yếu theo subdomain (hiện mới level domain)

## Convention giao tiếp
- User ưu tiên tiếng Việt
- Response ngắn gọn, kết quả trước
- Hỏi xác nhận trước khi làm thay đổi lớn (ambiguous scope)
- Exploratory questions → 2-3 câu recommendation, không implement ngay
