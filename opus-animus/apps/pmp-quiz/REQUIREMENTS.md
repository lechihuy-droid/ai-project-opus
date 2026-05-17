# PMP Quiz App — Requirements

## Mục tiêu
App ôn thi PMP cá nhân, offline-first, chạy trên máy i5-8250U/8GB RAM.

## Decisions đã chốt
| Bước | Lựa chọn |
|---|---|
| 1. Mode | Luyện tập + Ôn câu sai (exam simulation = Phase 2) |
| 2. UI | Single question / màn hình |
| 3. Feedback | Instant (hiện đúng/sai + giải thích ngay) |
| 4. Features MVP | F1 điểm · F3 lịch sử · F5 domain stats · F8 ôn câu sai · F-AI giải thích |
| 5. Dữ liệu | PDF ExamTopics → 1385 câu parse (97.7% / 1417) |
| 6. Stack | Vanilla HTML + ES modules + Python http.server (pivot từ Vite vì máy chưa có Node) |
| F-AI | Cách 1: pre-generate offline bằng claude.ai Pro |

## User stories (MVP)
1. Là người học, tôi chọn số câu (5-1385), hệ thống random và bắt đầu quiz.
2. Với mỗi câu: chọn A/B/C/D → thấy ngay đáp án đúng + giải thích → bấm Next.
3. Câu sai tự động thêm vào "Ôn câu sai"; câu đúng trong chế độ ôn được xóa khỏi danh sách đó.
4. Xem tổng điểm + phân tích theo domain (People/Process/Business).
5. Xem lịch sử các phiên (thời gian, điểm, mode).
6. Xem thống kê tổng + breakdown theo domain.

## Data schema (`data/questions.json`)
```json
{
  "id": 1,
  "question": "…",
  "options": { "A": "…", "B": "…", "C": "…", "D": "…" },
  "correct": "A",
  "domain": "Process",           // pre-classify bằng heuristic, có thể ghi đè bởi Claude
  "explanation": null            // null → fallback text; sinh sau bằng batch_explain
}
```

## Cấu trúc thư mục
```
PMP-Quiz-App/
├── index.html                     # entry
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── app.js                 # controller + routing
│       ├── quiz.js                # state machine
│       ├── domain.js              # heuristic classifier
│       ├── storage.js             # localStorage wrapper
│       └── views.js               # DOM rendering
├── data/
│   ├── questions.json             # 1385 câu (parsed)
│   ├── raw.txt                    # pdftotext output
│   └── explanations/
│       └── batch_NNN.json         # giải thích pre-gen từ claude.ai
├── scripts/
│   ├── parse_pdf.py               # PDF → JSON
│   ├── batch_explain.py           # in prompt cho mỗi batch
│   └── merge_explanations.py      # merge batch_*.json → questions.json
├── prototype/index.html           # prototype 12-câu cũ (tham khảo UI)
└── REQUIREMENTS.md                # file này
```

## Chạy
```bash
cd PMP-Quiz-App
python -m http.server 8000
# mở http://localhost:8000
```

## Workflow pre-generate giải thích (dùng Claude Pro)
```bash
python scripts/batch_explain.py --count        # xem tổng số batch (70)
python scripts/batch_explain.py 1              # in prompt batch #1 (20 câu)
# → Copy prompt → paste vào claude.ai → Claude trả JSON
# → Lưu JSON vào data/explanations/batch_001.json
python scripts/merge_explanations.py           # merge vào questions.json
# → Làm 70 batch × ~2 phút ≈ 2.5 giờ
```

## Phase 2 (sau MVP)
- Mode (b): Exam simulation 180 câu / 230 phút + timer
- F2 Timer trong exam mode
- F4 Bookmark thủ công
- F7 Biểu đồ tiến độ theo thời gian
- F9 Shuffle vị trí đáp án (đang có shuffle câu)
- F11 Ghi chú cá nhân mỗi câu
- "Hỏi sâu hơn" — call Claude API realtime (Cách 3 Hybrid)
- Parse thêm 31 câu drag-drop/hotspot bị skip

## Tech rationale — vì sao vanilla thay vì Vite/Next
- Máy không có Node.js, cài thêm = thêm nặng
- Không cần HMR cho solo user
- 1385 câu JSON load một lần < 1.5s trên máy cùi
- Deploy = copy folder → zero config
- Nếu sau muốn tới Next.js, cấu trúc modules hiện tại chuyển qua dễ

## Rủi ro & lưu ý
- **Bản quyền**: nội dung câu hỏi xuất từ ExamTopics → **CHỈ dùng cá nhân**, không deploy public.
- **Heuristic domain** (`domain.js`) không chính xác 100% — sẽ cải thiện khi merge batch giải thích từ Claude (Claude sẽ override `domain`).
- **31 câu bị skip** ở parser: drag-drop/hotspot không có A-D options — bỏ qua ở MVP.
