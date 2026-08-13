---
description: Vẽ diagram (flowchart / sequence) dạng HTML bằng diagram.js của html-kit
argument-hint: [mô tả luồng / hệ thống cần vẽ]
---

Vẽ diagram cho yêu cầu sau bằng **html-kit** (`diagram.js` render SVG từ JSON):

$ARGUMENTS

---

# Quy tắc dựng diagram

Asset (link external, KHÔNG re-output): `html-kit/styles.css` + `html-kit/diagram.js`.
**JSON only — KHÔNG vẽ SVG tay.** Layout (level, vị trí, lifeline) do `diagram.js` tự tính.

## Bước
1. Chọn loại: **flow** (quy trình / quyết định / kiến trúc) hay **sequence** (trao đổi giữa các actor theo thời gian).
2. Nếu cần file mới: copy `template.html`, chỉ để 1 khối `.diagram` trong `<main>`. Nếu chèn vào doc sẵn có: thêm khối `.diagram` là đủ.
3. Đổ dữ liệu vào `data-chart`, thêm `<p class="diagram-caption">` chú thích nếu cần.

## Flowchart
Shape: `terminal` (bo tròn, mốc đầu/cuối) · `diamond` (quyết định) · `io` (input/output) · `rect` (mặc định, xử lý).
```html
<div class="diagram" data-chart='{
  "type":"flow",
  "nodes":[
    {"id":"start","label":"Bắt đầu","shape":"terminal"},
    {"id":"chk","label":"Hợp lệ?","shape":"diamond"},
    {"id":"do","label":"Xử lý","shape":"rect"},
    {"id":"end","label":"Kết thúc","shape":"terminal"}
  ],
  "edges":[
    {"from":"start","to":"chk"},
    {"from":"chk","to":"do","label":"Có"},
    {"from":"chk","to":"end","label":"Không"},
    {"from":"do","to":"end"}
  ]
}'></div>
```

## Sequence
`"return": true` → mũi tên hồi đáp (teal, nét đứt). `from`/`to` phải trùng tên trong `actors`.
```html
<div class="diagram" data-chart='{
  "type":"sequence",
  "actors":["Client","API","DB"],
  "steps":[
    {"from":"Client","to":"API","msg":"POST /login"},
    {"from":"API","to":"DB","msg":"SELECT user"},
    {"from":"DB","to":"API","msg":"row","return":true},
    {"from":"API","to":"Client","msg":"200 + token","return":true}
  ]
}'></div>
```

## Lưu ý
- `id` node phải unique; `edges.from/to` trỏ đúng `id`.
- Flow đi từ trên xuống theo thứ tự phụ thuộc; cycle vẫn vẽ được (có chặn lặp vô hạn).
- Màu diagram theo token trong `styles.css` (tự đổi theo dark theme).
- Chèn `<script src="./diagram.js" defer></script>` một lần cuối `<head>`; diagram tự render khi load.
