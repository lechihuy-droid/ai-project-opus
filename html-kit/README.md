# HTML Output Kit

Shared HTML/CSS/JS kit for self-contained structured output (report, diagram, plan, comparison...).

| File | Vai trò |
|---|---|
| `styles.css` | McKinsey-style shared stylesheet — **không bao giờ output lại trong HTML** |
| `diagram.js` | SVG renderer cho flowchart + sequence diagram từ JSON |
| `template.html` | Khung HTML tối giản với đầy đủ component examples |

**Token saving:** Link CSS externally thay vì inline `<style>` → tiết kiệm ~44% tokens.

```html
<link rel="stylesheet" href="./styles.css">
<script src="./diagram.js" defer></script>
```

## Khi nào dùng HTML

| Use case | Format |
|---|---|
| So sánh options, trade-off | Cards + compare 2 cột |
| Sprint report, incident post-mortem | Cards + timeline + table |
| Code review, PR writeup | Diff + annotated sections |
| Architecture, API flow | Flowchart / Sequence diagram |
| Research, explainer | Tabs + collapsible |
| Presentation | Slide deck |

## Diagram — JSON only, không viết SVG tay

**Flowchart** (shapes: `rect`, `diamond`, `terminal`):
```html
<div class="diagram" data-chart='{
  "type": "flow",
  "nodes": [{"id":"s","label":"Start","shape":"terminal"}, ...],
  "edges": [{"from":"s","to":"d","label":"Yes"}, ...]
}'></div>
```

**Sequence** (`"return": true` → dashed arrow):
```html
<div class="diagram" data-chart='{
  "type": "sequence",
  "actors": ["Client","API","DB"],
  "steps": [{"from":"Client","to":"API","msg":"POST /login"}, ...]
}'></div>
```

## CSS classes nhanh

`badge` `badge green/red/gray/navy` · `card` `card-grid` · `compare` · `callout` `callout warn/risk` · `timeline` · `tabs` + `tab-btn` + `tab-panel` · `details/summary` · `diff-add` `diff-del` `diff-ctx` · `diagram`
