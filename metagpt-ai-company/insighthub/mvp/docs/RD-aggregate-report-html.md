# RD — Aggregate Report HTML Export

**Date:** 2026-05-23
**Status:** ⚫ Superseded — sẽ merge vào RD hợp nhất "HTML Dashboard Report (per-run primary + aggregate index)" sau UI review
**Author:** HUY (planning: Claude / Opus 4.7)
**Feature ID:** F-AGG-HTML-01
**Parent product:** InsightHub Reporting Co-pilot (MVP)

> **Update 2026-05-23:** RD này được viết khi giả định output chính vẫn là DOCX/PDF và HTML
> chỉ là "viewer gom output". Sau pivot owner chốt (dual track, HTML dashboard = primary
> McKinsey-style, DOCX = secondary cho ký), RD này obsolete. RD hợp nhất sẽ viết sau khi xong
> `UI-REVIEW-report-output.md`. **Không implement file này.**

---

## 0. Problem Statement

**Hiện trạng output MVP** (sau Wave 1–4 + CR-001/002):

- Mỗi lần chạy `python -m insighthub generate --type T --lang L --out DIR` sinh ra 1 thư mục với
  4–6 artifact: `{T}.docx`, `{T}.md`, `{T}.pdf`, `traceability.json`, `audit_log.md`, optionally
  `diff.md`, `history/`, `projects/` (portfolio).
- Repo hiện có ≥ 8 thư mục output song song: `output/`, `output-monthly/`, `output-evm-atlas/`,
  `output-evm-portfolio/`, `output-test-weekly-{en,ja,vn}/`, `output-test-portfolio/`,
  `output-test-template-compact/`, `output-variant/`.
- Tổ hợp `(type × lang × scope)` đang nở: weekly × {en,ja,vn} = 3; monthly × {en,ja,vn} = 3;
  portfolio × {en,ja,vn} = 3 → ≥ 9 bộ artifact để demo/UAT/judge review.

**Pain point (user kể):** DM / DMpm khó tracking vì:

1. Phải mở từng thư mục để biết "run này có tạo PDF không, validation pass chưa".
2. Không có single landing page để judge/stakeholder so sánh weekly vs monthly, hoặc JA vs EN
   side-by-side.
3. `audit_log.md` + `traceability.json` mỗi run nằm rời, không liên kết với artifact .docx/.md
   tương ứng.

**Mục tiêu:** Sau mỗi lần generate (hoặc qua 1 lệnh aggregate riêng), tạo **1 file HTML duy nhất**
gom toàn bộ output đã có sẵn vào một viewer có tab. File này là artifact **tách biệt khỏi core
pipeline** — chỉ consume artifact đã sinh, không sửa business logic.

**Non-problem:** Không phải tool tạo report mới, không phải dashboard live, không phải web app.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Primary user | DM / DMpm review output MVP trước demo / UAT / judge handoff |
| Secondary user | Judge / stakeholder mở 1 link để xem toàn bộ kết quả |
| Device | Laptop, mở file `.html` bằng browser (Chrome/Edge) — không cần server |
| Tần suất | Sau mỗi batch generate (typically end-of-day hoặc trước demo) |

### 1.2 User Story chính

> **Là** DM review MVP output,
> **tôi muốn** mở 1 file HTML duy nhất sau khi batch generate xong,
> **để** xem toàn bộ weekly/monthly/portfolio × ngôn ngữ trong 1 viewer có tab, biết run nào
> pass validation, có link mở artifact gốc khi cần.

### 1.3 User Flow

1. User chạy batch generate như hiện tại (nhiều invocation `python -m insighthub generate ...`
   ra nhiều thư mục `output*/`).
2. User chạy 1 lệnh aggregate: `python -m insighthub aggregate --scan ./ --out ./report.html`
   (CLI flag chốt ở open question Q3).
3. Tool scan các thư mục output, đọc artifact, build 1 file HTML self-contained (link CSS/JS
   external tới `html-kit`).
4. User mở `report.html` → thấy tab navigation, mỗi tab là 1 report group.
5. Trong tab, user thấy: metadata run (timestamp, lang, source dir), preview markdown render,
   bảng KPI/traceability, link tới file gốc `.docx/.pdf/.md`.

---

## 2. Functional Requirements

### 2.1 Input Contract

- Input = các thư mục output đã tồn tại. Tool **không generate report mới**, không gọi LLM,
  không validate lại facts.
- Tool nhận diện 1 thư mục là "output bundle" nếu chứa **ít nhất 1** trong: `weekly.md`,
  `monthly.md`, `portfolio.md`.
- Per bundle, tool đọc (best-effort, optional):
  - `{type}.md` → render markdown làm preview chính
  - `{type}.docx`, `{type}.pdf` → expose dưới dạng download link (relative path)
  - `traceability.json` → render bảng citations / allowed_keys / allowed_numbers
  - `audit_log.md` → render block markdown, hiển thị validation pass/fail
  - `diff.md` (weekly only) → tab phụ trong bundle
  - `history/` → liệt kê snapshot timestamps (chỉ count, không deep-render)
  - `projects/` (portfolio) → list sub-bundle (atlas/beacon...)

### 2.2 Output Contract

| Field | Giá trị |
|---|---|
| File name | `report.html` (default) — override bằng `--out` |
| Location | Configurable; default = cwd nơi gọi lệnh |
| Encoding | UTF-8, BOM-less |
| Self-contained | **No** — link `../html-kit/styles.css` + `../html-kit/diagram.js` qua relative path. Override bằng `--inline-assets` ở v2 (out of scope v1). |
| Dependencies runtime | Chỉ stdlib + `markdown` package (đã có trong requirements) |
| Side effects | Không sửa thư mục output gốc, không tạo file phụ |
| Idempotent | Chạy lại nhiều lần → cùng output (trừ timestamp metadata trong header) |

### 2.3 Information Architecture (IA)

**Cấp 1 — Top-level tab:**

- `Weekly` (bắt buộc nếu có ≥1 weekly bundle)
- `Monthly` (bắt buộc nếu có ≥1 monthly bundle)
- `Portfolio` (bắt buộc nếu có ≥1 portfolio bundle)
- `Overview` (bắt buộc, always-on) — bảng index toàn bộ bundle: type / lang / source dir /
  validation status / timestamp / link
- `Diff` (optional, chỉ hiện nếu có ≥1 bundle có `diff.md`)

**Cấp 2 — Trong tab type (vd Weekly):**

- Sub-tab theo `lang`: `EN | JA | VN`. Chỉ hiện sub-tab có data.
- Trong sub-tab lang: list các bundle (nếu nhiều bundle cùng `type×lang`, vd `output/` vs
  `output-test-weekly-en/`) — collapse được, header là tên thư mục.

**Cấp 3 — Trong bundle card:**

- Section 1: Metadata (source dir, mtime của `.md`, validation status từ audit_log)
- Section 2: Report content (render `{type}.md` → HTML)
- Section 3: Traceability table (từ `traceability.json`)
- Section 4: Audit log (collapsible)
- Section 5: Download links (.docx, .pdf, .md)

**Grouping decision (chốt v1):** **Primary by type, secondary by lang.** Lý do: judge/DM hỏi
"weekly report đâu" trước, mới hỏi "có bản tiếng Nhật không". Tab `Overview` cover case cross-cut.

### 2.4 CLI Interface

```
python -m insighthub aggregate \
  --scan ./ \
  [--out report.html] \
  [--include "output*"] \
  [--exclude "output-variant"] \
  [--title "InsightHub Demo 2026-05-23"]
```

- `--scan`: thư mục gốc để tìm bundle (default = cwd)
- `--include` / `--exclude`: glob filter trên tên thư mục
- `--out`: output path
- `--title`: hiển thị ở header HTML

**Không có flag `--lang` / `--type`** — aggregate là consume tất cả, filter bằng `--include`.

### 2.5 Rendering Rules

- Markdown render: dùng `markdown` package (đã có), enable extensions `tables`, `fenced_code`.
- Citation tokens `[source:key]` trong markdown: render thành `<span class="badge gray">` (giữ
  raw text, không resolve URL ở v1).
- Validation status badge: derive từ `audit_log.md` — nếu có dòng chứa "violations" hoặc
  "blocked" → badge đỏ; nếu "validation passed" → badge xanh; else gray "unknown".
- Tab navigation: dùng class `tabs` + `tab-btn` + `tab-panel` của `html-kit/styles.css`.
- Không inline base64 cho .docx/.pdf — chỉ link relative.

### 2.6 Acceptance Criteria

1. Chạy `aggregate --scan ./mvp` trên repo hiện tại → tạo `report.html`, mở được trong Chrome,
   không lỗi console.
2. File HTML hiển thị đúng các top-level tab: Overview + (Weekly/Monthly/Portfolio nếu có).
3. Mỗi bundle có đủ 5 section (metadata, content, traceability, audit, downloads).
4. Validation badge đúng với nội dung `audit_log.md` (manual spot-check 3 bundle).
5. Download link mở được file `.docx/.pdf/.md` gốc (relative path đúng).
6. Re-run lệnh sau khi thêm 1 thư mục output mới → file HTML cập nhật, bundle mới xuất hiện.
7. **Không** chạm vào file trong thư mục output gốc.
8. **Không** làm fail bất kỳ test nào trong `mvp/tests/`.
9. Toàn bộ artifact .md gốc hiển thị đúng tiếng Nhật/Việt (UTF-8, không mojibake).

---

## 3. Non-Goals (v1)

- Không generate report mới, không gọi LLM, không sửa pipeline.
- Không host web server, không live reload, không upload đi đâu.
- Không inline CSS/JS/font (token cost) — link external `html-kit`.
- Không diff giữa 2 bundle khác type (so weekly vs monthly).
- Không cấp permission/auth — file mở local.
- Không build PDF từ HTML aggregate.
- Không sửa `validate.py`, không weaken validation hiện có.
- Không thêm dependency mới ngoài `markdown` (đã có).

---

## 4. Affected Modules — Đánh giá ảnh hưởng MVP

| Module | Ảnh hưởng | Lý do |
|---|---|---|
| `insighthub/__main__.py` | **Add subcommand** `aggregate` | Cần CLI entrypoint mới. Không sửa `generate`. |
| `insighthub/aggregate.py` (new) | **New file** | Toàn bộ logic scan + render |
| `insighthub/templating.py` | Không động | Aggregate dùng template HTML riêng |
| `insighthub/export.py` | Không động | Pipeline cũ độc lập |
| `insighthub/validate.py` | Không động | |
| `mvp/templates/aggregate.html` (new) | **New file** | HTML shell với tab skeleton, jinja-render |
| `requirements.txt` | Không động | `markdown` đã có |
| `mvp/tests/test_aggregate.py` (new) | **New file** | Structural + smoke test |
| Existing tests | Không sửa | Aggregate không nằm trong code path của generate |

**Blast radius:** Khu trú trong 3 file mới + 1 dòng subcommand trong `__main__.py`. Risk thấp.

---

## 5. Test Plan (preview, chi tiết ở BD)

- **T1 — Empty scan:** scan thư mục rỗng → exit 0, file HTML có Overview tab nhưng bảng rỗng,
  không crash.
- **T2 — Single bundle:** scan `mvp/output/` → đúng 1 tab Weekly, 1 bundle card.
- **T3 — Full repo:** scan `mvp/` → đủ Weekly/Monthly/Portfolio tab, sub-tab lang đúng.
- **T4 — Bad bundle:** thư mục thiếu `traceability.json` → bundle vẫn render, section đó hiển
  thị "n/a".
- **T5 — Validation badge:** mock `audit_log.md` có/không violations → badge đúng màu.
- **T6 — UTF-8:** bundle JA → tiếng Nhật render đúng.
- **T7 — Regression:** chạy full pytest suite hiện tại → không gãy.

---

## 6. Open Questions — Cần owner chốt trước khi sang SD

| # | Câu hỏi | Default đề xuất |
|---|---|---|
| **Q1** | Aggregate là CLI riêng (`insighthub aggregate`) hay tự động chạy cuối mỗi `generate`? | **CLI riêng.** Lý do: tách biệt khỏi core pipeline (theo ràng buộc user), tránh ảnh hưởng UAT đang pass. |
| **Q2** | File HTML có cần self-contained (inline CSS/JS) không? | **Không (v1).** Link relative tới `html-kit/`. Self-contained dời v2 nếu cần ship qua email. |
| **Q3** | Có cần snapshot version / timestamp trong filename (`report-2026-05-23.html`) không? | **Không (v1).** Overwrite `report.html`. User tự versioning bằng git nếu cần. |
| **Q4** | Scope grouping ưu tiên: type-first hay lang-first? | **Type-first** (đã chốt ở §2.3). Cần owner confirm. |
| **Q5** | Có cần expose `history/` của weekly diff (timeline view) không? | **Không (v1).** Chỉ count snapshot. Timeline view dời v2. |
| **Q6** | Có cần support multi-project portfolio (`projects/atlas`, `projects/beacon`) ở v1 không? | **Có, nhưng read-only list.** Render từng project là sub-card trong bundle Portfolio. Không cross-link. |
| **Q7** | Owner muốn aggregate có chế độ "compare 2 bundle" (vd EN vs JA side-by-side) v1 không? | **Không.** Tab independent. Compare dời v2. |
| **Q8** | Có cần i18n cho UI chrome (tab label, section header) không? | **Không (v1).** UI chrome English-only. Content giữ nguyên ngôn ngữ gốc. |

---

## 7. Đề xuất scope v1 tối thiểu (recommend cho owner)

**MUST (v1):**

- CLI `python -m insighthub aggregate --scan ./ --out report.html`
- Scan glob, nhận diện bundle qua `{type}.md`
- 4 tab top-level: Overview, Weekly, Monthly, Portfolio (chỉ hiện tab có data)
- Sub-tab lang trong mỗi type tab
- 5 section trong mỗi bundle card (metadata / content / traceability / audit / downloads)
- Validation badge từ `audit_log.md`
- Link external `html-kit` CSS/JS
- 7 test case ở §5
- Update `mvp/README.md` thêm section "Aggregate output"

**SHOULD (v1.1, nếu còn budget):**

- `--title` flag
- Filter bằng `--include` / `--exclude`

**DEFER (v2+):**

- Self-contained HTML (inline CSS/JS)
- Timeline view cho `history/`
- Side-by-side compare 2 bundle
- i18n UI chrome
- Watch mode (auto-rerun khi thư mục output thay đổi)
- PDF export của aggregate

---

## 8. Risks

| # | Risk | Mức | Mitigation |
|---|---|---|---|
| R1 | Markdown render trong HTML khác markdown trong `.docx` → judge confusion | Thấp | Footer mỗi bundle: "preview only, xem `.docx` gốc cho bản chính thức" |
| R2 | Relative path `../html-kit/styles.css` gãy nếu user copy `report.html` ra chỗ khác | Trung | Document rõ trong README; v2 hỗ trợ `--inline-assets` |
| R3 | Bundle naming chồng chéo (vd 2 thư mục cùng `output/` ở 2 cấp) | Thấp | Hiển thị full relative path trong card header |
| R4 | Performance khi scan nhiều bundle | Rất thấp | <20 bundle ở MVP, không lo |

---

## 9. Approval

Owner sign-off cần thiết để sang SD:

- [ ] Đồng ý problem statement + scope v1 ở §7
- [ ] Trả lời Q1–Q8 (hoặc accept default)
- [ ] Confirm grouping type-first ở §2.3

→ Sau approve, Claude viết SD-aggregate-report-html.md → BD → giao Codex implement.
