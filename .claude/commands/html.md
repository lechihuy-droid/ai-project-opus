---
description: Tạo output HTML structured (report/diagram/plan/so sánh) bằng bộ html-kit
argument-hint: [mô tả thứ cần tạo]
---

Tạo deliverable HTML cho yêu cầu sau bằng **html-kit**:

$ARGUMENTS

---

# html-kit — quy ước dựng HTML

Asset (link external, **KHÔNG inline / re-output** trừ khi user nói "self-contained / 1 file").
Đọc skill gốc + asset tại `html-kit/`: `styles.css`, `diagram.js`, `template.html`, `demo.html`, `SKILL.md`.

## Khi nào dùng format nào
| Use case | Component chính |
|---|---|
| Report, sprint review, post-mortem | cards + table + timeline |
| So sánh options / trade-off | `compare` 2 cột + cards |
| Code review, PR writeup | `diff` + `details` |
| Architecture / API flow | diagram `flow` / `sequence` |
| Plan / roadmap | timeline + table + `callout` |
| Research / explainer | `tabs` + `details` |
| Presentation | `slide` deck |

## Workflow
1. Copy `template.html` làm khung. Giữ nguyên `<head>`: script apply-before-paint + 2 dòng link asset + nút `theme-toggle`.
2. Link external: `<link rel="stylesheet" href="./styles.css">` và `<script src="./diagram.js" defer></script>`
3. Viết **semantic HTML** trong `<main>` bằng component class có sẵn. Không tự đẻ CSS.
4. Diagram: JSON trong `data-chart`, KHÔNG vẽ SVG tay.
5. Màu: chỉ token `var(--...)`, **không hard-code hex** (kể cả style inline).
6. Dark mode + print đã built-in, không thêm gì.

## Component class
`badge` · `badge green/red/gray/navy` · `card` + `card-grid` · `compare` + `col-head` · `callout` + `callout warn/risk` · `timeline` + `time` · `tabs` + `tab-btn` + `tab-panel` · `details/summary` · `diff-add/diff-del/diff-ctx` · `slide` + `slide-nav` · `diagram` + `diagram-caption` · `text-muted/text-small/text-right` · `mt-1..3 / mb-1..3`
Tabs cần JS `showTab(event,id)` (có trong template). Token inline hay dùng: `--heading --text --text-muted --accent --green --red --teal`.

## Diagram — JSON only
**Flow** — shape `rect`|`io`|`diamond`|`terminal`:
`{"type":"flow","nodes":[{"id":"s","label":"Start","shape":"terminal"}],"edges":[{"from":"s","to":"d","label":"Yes"}]}`
**Sequence** — `"return":true` → mũi tên teal nét đứt:
`{"type":"sequence","actors":["Client","API"],"steps":[{"from":"Client","to":"API","msg":"POST /login"}]}`
Layout tự tính — chỉ cấp nodes/edges hoặc actors/steps.

## Output mode
- **Linked (mặc định):** giao kèm 3 file asset. Rẻ token, deterministic.
- **Self-contained:** khi user nói "1 file" → inline nội dung `styles.css` vào `<style>` và `diagram.js` vào `<script>` ở bước cuối.

## Rules cứng
- KHÔNG re-output `styles.css`/`diagram.js` ở chế độ linked.
- Semantic HTML, tái dùng class, không tự đẻ CSS.
- Diagram JSON only, không SVG tay.
- Màu = token, không hex.
- Phân vân → đối chiếu `demo.html`.
