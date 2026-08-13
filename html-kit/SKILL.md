---
name: html-kit
description: Create polished, self-contained HTML deliverables — reports, comparisons, explainers, post-mortems, PR/code writeups, architecture & sequence diagrams, plans, and slide decks — using the bundled McKinsey-style kit (token CSS + deterministic JSON diagrams, dark mode, print). Use whenever the user wants structured visual output instead of plain markdown. Triggers: /html, "tạo HTML", "làm report/plan/so sánh dạng HTML", "vẽ diagram/sequence".
---

# HTML Kit

**Một skill duy nhất** cho mọi output HTML structured. Gộp 3 năng lực (document, diagram, plan) trên cùng một bộ asset. Triết lý: **deterministic** (diagram render từ JSON, không vẽ SVG tay) + **token-rẻ** (CSS link external, không inline) + McKinsey-style, sẵn **dark mode** và **print**.

## Khi nào dùng

| Use case | Component chính |
|---|---|
| Report, sprint review, post-mortem | cards + table + timeline |
| So sánh options / trade-off | `compare` 2 cột + cards |
| Code review, PR writeup | `diff` + `details` |
| Architecture / API flow | diagram `flow` / `sequence` |
| Plan / roadmap | timeline + table + `callout` |
| Research / explainer | `tabs` + `details` |
| Presentation | `slide` deck |

**Không dùng** khi user chỉ cần văn bản ngắn, một đoạn trả lời, hoặc dữ liệu để paste tiếp — markdown thường là đủ.

## Asset (bundled — KHÔNG re-output)

| File | Vai trò |
|---|---|
| `styles.css` | Design system + semantic token + dark + print. **Không bao giờ in lại trong HTML.** |
| `diagram.js` | Render `flow` + `sequence` từ JSON. SVG ăn màu theo theme qua class `dg-*`. |
| `template.html` | Khung tối giản: đã có theme toggle + apply-before-paint. **Bắt đầu từ đây.** |
| `demo.html` | Ví dụ đầy đủ (gold standard) — soi cách dùng mọi component. |

## Workflow

1. Copy `template.html` làm khung. Giữ nguyên `<head>`: script apply-before-paint + 2 dòng link asset + nút `theme-toggle`.
2. Link asset external (đừng inline):
   ```html
   <link rel="stylesheet" href="./styles.css">
   <script src="./diagram.js" defer></script>
   ```
3. Viết **semantic HTML** trong `<main>` bằng component class có sẵn (xem bên dưới). Không viết CSS mới trừ khi component chưa có.
4. Diagram: nhúng JSON vào `data-chart`, KHÔNG vẽ SVG tay (xem schema).
5. Màu: chỉ dùng token `var(--...)`, **không hard-code hex** — kể cả style inline. Nhờ vậy dark mode + print tự đúng.
6. Dark mode & print đã built-in; không thêm gì.

## Component class — tham chiếu nhanh

`badge` · `badge green/red/gray/navy` · `card` + `card-grid` · `compare` + `col-head` · `callout` + `callout warn/risk` · `timeline` + `time` · `tabs` + `tab-btn` + `tab-panel` · `details/summary` · `diff-add/diff-del/diff-ctx` · `slide` + `slide-nav` · `diagram` + `diagram-caption` · `text-muted/text-small/text-right` · `mt-1..3 / mb-1..3`

Tabs cần JS `showTab(event,id)` (đã có trong template). Token màu hay dùng inline: `--heading --text --text-muted --accent --green --red --teal`.

## Diagram — JSON only

**Flowchart** — shape: `rect` | `io` | `diamond` | `terminal`:
```html
<div class="diagram" data-chart='{
  "type": "flow",
  "nodes": [{"id":"s","label":"Start","shape":"terminal"},
            {"id":"d","label":"OK?","shape":"diamond"}],
  "edges": [{"from":"s","to":"d","label":"Yes"}]
}'></div>
```

**Sequence** — `"return": true` → mũi tên teal nét đứt:
```html
<div class="diagram" data-chart='{
  "type": "sequence",
  "actors": ["Client","API","DB"],
  "steps": [{"from":"Client","to":"API","msg":"POST /login"},
            {"from":"API","to":"Client","msg":"200 OK","return":true}]
}'></div>
```
Layout (level, vị trí) tự tính — chỉ cung cấp nodes/edges hoặc actors/steps.

## Output mode

- **Linked (mặc định):** giao kèm 3 file asset. Rẻ token, deterministic, dễ sửa. Dùng cho nội bộ.
- **Self-contained:** khi cần gửi 1 file lẻ cho người ngoài → inline nội dung `styles.css` vào `<style>` và `diagram.js` vào `<script>` ở bước cuối. Chỉ làm khi user yêu cầu "1 file" / "self-contained".

## Rules (cứng)

- KHÔNG re-output `styles.css` / `diagram.js` ở chế độ linked.
- Semantic HTML; tái dùng class có sẵn, không tự đẻ CSS.
- Diagram: JSON only, không SVG tay.
- Màu: token `var(--...)`, không hex.
- Đối chiếu `demo.html` khi phân vân cách dùng component.
