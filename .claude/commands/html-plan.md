---
description: Dựng trang plan / roadmap / build-plan dạng HTML bằng html-kit
argument-hint: [mô tả kế hoạch / phạm vi cần plan]
---

Dựng trang **plan** cho yêu cầu sau bằng html-kit:

$ARGUMENTS

---

# Quy tắc dựng plan

Asset (link external, KHÔNG re-output): `html-kit/styles.css` (+ `diagram.js` nếu cần sơ đồ).
Bắt đầu từ `template.html`. Semantic HTML + component có sẵn, không đẻ CSS.

## Cấu trúc gợi ý
1. **Header** — `doc-header` + `badge` loại (Plan/Roadmap/BD) + mục tiêu 1 dòng (`lead`).
2. **Mục tiêu & phạm vi** — đoạn ngắn + `callout risk` cho "ngoài scope".
3. **Các bước** — mỗi bước nêu **hành động → verify** (theo phong cách BD):
   dùng `timeline` (theo thứ tự thời gian) hoặc `table` (Bước · Việc · Verify · Owner · Trạng thái).
4. **Milestone** — `card-grid` các mốc lớn kèm `badge` trạng thái.
5. **Rủi ro & quyết định** — `details/summary` hoặc `callout warn`.
6. (tùy chọn) **Sơ đồ phụ thuộc** — 1 khối `.diagram` type `flow` nếu các bước có nhánh/điều kiện.

## Ví dụ khối "bước → verify"
```html
<table>
  <thead><tr><th>Bước</th><th>Việc</th><th>Verify</th><th>Trạng thái</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>Tách màu diagram ra CSS var</td><td>0 hex trong diagram.js</td><td><span class="badge green">Done</span></td></tr>
    <tr><td>2</td><td>Thêm dark mode + print</td><td>Toggle đổi theme, print ép light</td><td><span class="badge gray">Pending</span></td></tr>
  </tbody>
</table>
```

## Trạng thái chuẩn
`badge green` = Done · `badge` (xanh mặc định) = In progress · `badge gray` = Pending · `badge red` = Blocked.

## Lưu ý
- Mỗi bước phải có tiêu chí **verify cụ thể, kiểm được** — không để "làm xong thì biết".
- Plan = kế hoạch, KHÔNG code trong đây; nếu cần diagram thì JSON-only.
- Phân vân cách dùng component → đối chiếu `demo.html`.
