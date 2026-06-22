# HANDOFF — opus-animus / pmp-quiz (Claude)
**Updated:** 2026-06-06
**Owner:** Claude
**Active task:** Bug fix — pmp-quiz storage.js (weak section merge side-effects)

## Đã làm trong session

- Phân tích logic tính "câu đã làm xong" toàn bộ app (storage.js, quiz.js, app.js, plan.js)
- Phát hiện 3 bugs xuất hiện sau khi merge weak section feature vào:
  1. `seenCount` dùng `totalAnswered` (gồm cả weak sessions) → "Chưa làm" có thể ra số âm
  2. `seenPct` có thể vượt 100% (không cap + tính cả weak repeats)
  3. `todayAnswered` count cả weak sessions → daily goal progress inflate
- Fix cả 3 bugs trong `storage.js:computeStats()` (5 dòng thay đổi)
- Viết 8 Node.js test cases, tất cả pass

## Exact next action

1. Hard reload app: mở `http://localhost:8765/pmp` → `Ctrl+Shift+R`
2. Nếu đã có data trong localStorage, kiểm tra Home screen:
   - Coverage bar "Chưa làm" phải là số dương
   - "Tiến độ toàn đề" không vượt quá 1385
   - Daily goal ring reflect đúng số câu regular practice hôm nay (không count weak)
3. Nếu muốn test với dữ liệu thật: mở DevTools Console, chạy:
   ```js
   JSON.parse(localStorage.getItem('pmp.history')).filter(s => s.mode?.startsWith('weak-')).length
   ```
   → số này là weak sessions đang bị exclude khỏi todayAnswered (đúng behavior sau fix)

## Files touched

- `C:\Users\HUY\workspace\ai-workspace\opus-animus\apps\pmp-quiz\assets\js\storage.js` — fix 3 bugs trong `computeStats()`

## Risks / cần kiểm tra

- `accuracy` metric vẫn tính cả weak sessions (`totalCorrect / totalAnswered`) — có thể hơi thấp hơn thực tế nếu user làm nhiều weak. Chưa fix vì không ảnh hưởng UI trực tiếp, cần xem xét sau.
- `last7DaysActivity()` (heatmap 7 ngày) vẫn count weak sessions — heatmap hiện số câu total including weak. Có thể là intentional (measure effort), nhưng inconsistent với `todayAnswered`. Chưa fix.

## Validation commands

```bash
# Run Node.js tests
node --input-type=module < test-storage-fix.js  # nếu muốn lưu test file

# Verify served file có fix
curl -s "http://localhost:8765/pmp/assets/js/storage.js" | grep -n "seenCount\|todayAnswered\|uniqueSeen"
# Expected output:
#   seenCount: uniqueSeen,
#   seenPct: Math.round((Math.min(uniqueSeen, totalQuestions) / totalQuestions) * 100),
#   history.filter((s) => ... && !s.mode?.startsWith("weak-"))
```
