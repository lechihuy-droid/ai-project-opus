# RD — Open Design MCP Renderer Migration
**Date:** 2026-05-13
**Status:** ⛔ Superseded by `RD-jlpt-n2-slide-agent.md` (2026-05-13)
**Author:** Claude (session 2026-05-13)

> **Pivot note:** Sau MVP spike (sample-template.html), scope chuyển từ "replace Lucida React renderer" sang "agent độc lập đọc Lucida content + dùng OD MCP làm design layer". Không còn migration. RD mới khác hoàn toàn về scope, risk, và acceptance criteria. File này giữ lại cho lịch sử.

---

## 0. Problem Statement

**Vấn đề:** Lucida runtime hiện dùng React 19 + Vite + Zod + Playwright cho slide rendering (`apps/schema-html-prototype/`). Stack này nặng so với output thực tế = static HTML slides + PNG frames + audio + video. Khi template library đã ổn định (8 layout, ~422 LOC TSX), maintenance overhead của TS/React/Vite không còn justify được lợi ích so với HTML thuần.

**Hiện trạng:**
- 8 layout components TSX (~422 LOC) + 3 renderer files (~76 LOC) + 5 Zod schemas (~207 LOC)
- Wake cluster 17-slide đã verified end-to-end (validate PASS, build PASS, Playwright export 17/17, QA PASS)
- Vite dev server `:4177` chỉ phục vụ designer iteration trong giai đoạn build template
- Locked decision (`ai/status.md`): "Renderer owns HTML/CSS, JSON does not contain raw HTML"

**Mục tiêu:** Thay React renderer bằng Open Design MCP-based HTML template + substitution renderer. Giảm phụ thuộc React/Vite/TS cho rendering layer trong khi giữ:
- Typed JSON contract (Zod validation cho data)
- Wake 17-slide PASS gate
- Playwright PNG export pipeline
- Acceptance process v0.2 (06-slide-template-acceptance-process.md)

---

## 1. Usage — Designer và Lesson Author Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Lucida author (1 người: chủ project) + Claude/Codex agent |
| Device / môi trường | Windows 11, OD daemon chạy local, Claude Code CLI |
| Tần suất dùng | Per-lesson: 1-2 lần/lesson. Template authoring: hiếm (templates đã đủ) |
| Technical level | Có code, hiểu HTML/CSS, không cần TS/React expert |

### 1.2 Typical Usage Flow — Tạo lesson mới (post-migration)

```
Bước 1: Author lock teaching skeleton (01-master-teaching-skeleton.md)
Bước 2: Author/Claude tạo slide-plan.json (phase → template_id assignment)
Bước 3: Substitution renderer:
        - Validate JSON với Zod
        - Match mỗi slide → template HTML trong templates/<template_id>/
        - Substitute {{slots}} từ typed deck data
        - Output 1 file final-deck.html
Bước 4: OD daemon preview HTML (hoặc browser thường)
Bước 5: Playwright export PNG frames từ HTML file
Bước 6: Audio + video pipeline tiếp tục như cũ
Kết quả: 17-slide deck PASS gate giống flow cũ
```

### 1.3 Typical Usage Flow — Sửa template (hiếm)

```
Bước 1: Author mở templates/<template_id>/template.html trong OD daemon
Bước 2: Iterate HTML/CSS visually
Bước 3: Update slot manifest (templates/<template_id>/slots.json) nếu thay required field
Bước 4: Regenerate test deck → Playwright re-verify
Bước 5: Update 02-slide-template-library.md với contract mới
```

### 1.4 Example Interactions

**Ví dụ 1 — Happy path: render Wake deck:**
```
Input:  wake-slide-plan.json + wake-typed-deck.json
Command: node scripts/renderDeck.js wake
Output: production/00-active/wake-cluster/wake-cluster-deck.html
        (17 sections, mỗi section có data-slide-id + data-template-id)
```

**Ví dụ 2 — Edge case: thiếu slot bắt buộc:**
```
Input:  typed-deck.json thiếu `pattern_b` cho slide dùng template "minimal_pair"
Output: Renderer exit 1 với error
        "Slide 11 (minimal_pair): missing required slot 'pattern_b'.
         See templates/minimal_pair/slots.json:lines 8-10."
```

**Ví dụ 3 — Template authoring spike:**
```
Input:  Author mở templates/grammar_card/template.html trong OD daemon
        Đổi CSS layout từ vertical sang 3-column
Output: OD daemon live reload hiển thị mới
        Author chạy: node scripts/renderDeck.js wake để verify regression
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-REN-001 | Substitution renderer phải đọc typed JSON (validated Zod) + load template HTML matching `template_id` + emit final HTML deck file | P0 | Core thay React renderer |
| FR-REN-002 | Renderer phải fail-fast khi slot bắt buộc thiếu trong typed deck, exit code ≠ 0, log slide_id + missing slot name | P0 | Replaces TS compiler errors |
| FR-REN-003 | Renderer phải emit `data-slide-id`, `data-template-id`, và `data-duration-sec` (nếu có) trên mỗi `<section>` | P0 | Required cho Playwright frame export + QA traceability |
| FR-REN-004 | Renderer phải validate language rules: nếu output HTML chứa banned label tiếng Anh ("Hook", "Reveal", "Core Method") → emit warning với slide_id | P0 | Enforces banned-preferred dictionary tự động |
| FR-TPL-001 | Mỗi template phải có cấu trúc: `templates/<template_id>/template.html` + `slots.json` (required/optional slots với type) + optional `template.css` | P0 | Replaces TSX component contract |
| FR-TPL-002 | Slot syntax = Mustache `{{slot_name}}`. Hỗ trợ array iteration `{{#items}}…{{/items}}` cho repeating slots (vd choices, bullets) | P0 | Đủ cho 8 layouts hiện có |
| FR-TPL-003 | Template phải pass validation: tất cả slot trong template.html xuất hiện trong slots.json và ngược lại | P0 | Catch drift |
| FR-PORT-001 | Migration phải port hết 8 layout TSX hiện có sang template HTML+CSS tương đương, không mất template field | P0 | HeroTitle, KeyMessage, TwoColumn, ComparisonTable, FigureFocus, SectionDivider, Summary, Wake-specific |
| FR-PORT-002 | Wake 17-slide deck phải pass acceptance review sau migration (so sánh PNG export pre/post bằng pixel diff hoặc visual review) | P0 | Hard gate |
| FR-EXP-001 | Playwright export script phải refactor để chạy từ HTML file output thay vì spawn Vite + React app | P0 | `scripts/exportScreenshots.ts` rewrite |
| FR-EXP-002 | Output PNG resolution, frame count, naming convention giữ nguyên với hiện tại | P0 | Downstream audio/video pipeline không đổi |
| FR-DOC-001 | Update locked decision trong `ai/status.md`: "Renderer owns HTML/CSS" → "Renderer = substitution engine; templates own HTML/CSS" | P0 | |
| FR-DOC-002 | Update `06-slide-template-acceptance-process.md`: §11.5 OD Visual Mockup Pass → trở thành step thường xuyên (không còn optional cho template mới) | P0 | OD MCP giờ là primary template authoring tool |
| FR-DOC-003 | Update `02-slide-template-library.md`: mỗi template entry link tới `templates/<template_id>/` thay vì TSX file | P0 | |
| FR-DOC-004 | Update `automation/workflows/20-lesson-production-sop.md`: thay command `npm run dev/build` bằng `node scripts/renderDeck.js <topic>` | P0 | |
| FR-MAINT-001 | Schema layer (Zod) giữ nguyên cho data validation (deck.ts, layout.ts, contentBundle.ts, qa.ts) | P1 | Không phải rewrite |
| FR-MAINT-002 | Cleanup: `apps/schema-html-prototype/src/{layouts,renderer}/` archive sang `99-archive/schema-html-prototype-pre-mcp/` thay vì xoá | P1 | Backup nếu cần rollback |
| FR-TEST-001 | Vitest tests trong `apps/schema-html-prototype/tests/` adapt sang test substitution renderer | P1 | 4/4 + 13/13 phải pass tương đương |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | Render time | < 2s cho 17-slide Wake deck | P0 |
| NFR-002 | Migration không phá Wake gate | 17/17 PNG match visual review post-migration | P0 |
| NFR-003 | Renderer dependency footprint | Node + 1-2 npm packages (Mustache hoặc Handlebars). Không Vite, không React | P1 |
| NFR-004 | Designer iteration loop | Edit template.html → OD daemon hiển thị < 1s | P1 |
| NFR-005 | Type safety | Mất TS template-field check; bù lại bằng FR-TPL-003 template validator | P1 |
| NFR-006 | Backward compat | typed JSON schemas giữ nguyên — Wake decks không cần re-author | P0 |

---

## 4. Explicit Exclusions

- **Không** xoá `apps/schema-html-prototype/` — archive vào `99-archive/` thay vì xoá, để có rollback path
- **Không** thay đổi typed JSON schemas (Zod) — chỉ thay rendering layer
- **Không** thêm template mới trong migration — port 1-1 từ 8 layouts hiện có
- **Không** support animation/reveal — MVP rule "1 logical slide = 1 PNG frame" giữ nguyên
- **Không** đụng audio/video pipeline — chỉ HTML render layer thay đổi
- **Không** migrate language generation runner pack (`30-language-generation-runner-pack.md`) — không liên quan rendering
- **Không** rewrite Wake slide content — port template, không port data
- **Không** support React component nested trong template HTML — pure HTML + Mustache only

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | Mustache vs Handlebars vs viết tay substitution? | Mustache.js (zero-logic templates, đơn giản, well-known) |
| Q2 | Template validator chạy lúc nào: build time hay render time? | Render time — fail-fast khi đang render deck |
| Q3 | OD MCP có cần thay đổi gì để serve cả `templates/` và rendered output? | Không — OD daemon đọc HTML từ filesystem, multi-project được |
| Q4 | Đặt `templates/` ở đâu: `apps/schema-html-prototype/templates/` hay `production/01-rules/slide-system/templates/`? | `apps/render/templates/` — folder mới, gọn tách bạch khỏi rules MD và khỏi app cũ |
| Q5 | Tên app/folder mới cho substitution renderer? | `apps/render/` (replace dần `apps/schema-html-prototype/`) |
| Q6 | Cleanup `apps/_archive-jlpt-n2-slides-v2-mis-scoped/` (folder bị lock ở opus-animus level) timing? | Sau khi Codex approve RD này; làm trong cùng session migration |
| Q7 | Banned-label check (FR-REN-004) làm warning hay hard fail? | Warning ở v1, hard fail ở v2 sau khi confidence |
| Q8 | Có cần keep React renderer parallel song song để A/B compare trong migration không? | Có, trong 1 session migration để verify Wake 17-slide match |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Substitution renderer (Mustache) thay vì React | Templates đã stable (đủ rồi, chỉ maintain). React/Vite/TS friction > savings. HTML thuần đủ diễn đạt layout cho slide tĩnh. | React: type safety đắt; phải build/HMR; designer cần biết TSX. Vanilla template literal: phải tự viết substitution logic, dễ buggy với array iteration. |
| Mustache thay vì Handlebars | Mustache là logic-less. Slide không cần conditional/helpers phức tạp. Đơn giản = ít risk. | Handlebars: helpers + partials hữu ích nhưng overkill cho slide tĩnh; rủi ro template logic creep. |
| Slot manifest JSON riêng (slots.json) | Cho phép FR-TPL-003 validator catch drift giữa template.html và contract. Replaces TS compile-time check. | Inline frontmatter trong HTML: khó parse, lẫn comment với contract. Single source-of-truth file rõ ràng hơn. |
| Archive React app, không xoá | Rollback path nếu migration fail. Chi phí lưu giữ thấp. | Xoá hẳn: risk cao nếu Wake regression không phát hiện ngay. |
| Migration đụng cả docs (FR-DOC-001..004) | Locked decision "Renderer owns HTML/CSS" sẽ mâu thuẫn nếu không update. Lucida governance yêu cầu sync docs cùng turn. | Defer docs: vi phạm `opus-animus/CLAUDE.md` doc-sync rule. |
| Banned-label check trong renderer (FR-REN-004) | Vốn là vấn đề chung — banned dictionary đã exist nhưng không enforce tự động. Migration là cơ hội thêm gate. | Bỏ qua: vẫn lệ thuộc review thủ công, lặp lại sai. |
| Folder mới `apps/render/` thay vì cải tạo trong `apps/schema-html-prototype/` | Tách rạch ròi pre/post migration. Dễ rollback. Tên `render` mô tả role chính xác hơn. | Cải tạo in-place: lẫn lộn React + Mustache code trong cùng tree, debug khó. |

---

## 7. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wake 17-slide regression sau migration | Medium | High | FR-PORT-002 hard gate: visual review pre/post. Q8: chạy parallel A/B trong migration session |
| Mất type safety → silent template field drift | High | Medium | FR-TPL-003 + FR-REN-002 fail-fast. Validator chạy mỗi render. |
| Designer học curve OD MCP | Low | Low | OD MCP đã setup. HTML/CSS skill phổ thông hơn TSX. |
| Mustache không đủ biểu đạt cho 1 template phức tạp (Wake-specific 245 LOC) | Medium | Medium | Q1 fallback: nếu Mustache không đủ → escape hatch là partial Handlebars helper. Decide khi gặp. |
| Locked decision update bị Codex reject | Low | High | Pre-emptive: RD này submit Codex review trước khi code. Block code work nếu Codex từ chối. |
| OD daemon không stable cho production rendering | Low | Medium | Substitution renderer là Node script, không phụ thuộc OD daemon. OD chỉ dùng để PREVIEW. |

---

## 8. Migration Cost Estimate

| Hạng mục | Estimate |
|---|---|
| Port 8 layout components TSX → HTML+CSS+slots.json | 6-10h |
| Build substitution renderer (~150-250 LOC) | 3-4h |
| Refactor Playwright export | 2h |
| Re-generate + verify Wake 17-slide PASS | 2-3h |
| Adapt Vitest tests | 1-2h |
| Update canonical docs (5+ files) | 2h |
| Archive `apps/schema-html-prototype/` + create `apps/render/` | 1h |
| **Total** | **17-24h focused work** |

Realistic: 2-3 focused sessions.

---

## 9. Acceptance Criteria

Migration được coi là **DONE** khi:

1. ✅ `apps/render/` chạy được; `node scripts/renderDeck.js wake` emit valid HTML deck
2. ✅ Wake 17-slide PNG export pass visual review so với pre-migration baseline
3. ✅ Playwright tests 4/4 + 13/13 pass (hoặc tương đương sau adapt)
4. ✅ Tất cả Zod schemas còn nguyên, không bị tổn thương
5. ✅ Docs FR-DOC-001..004 updated trong cùng PR/commit
6. ✅ `apps/schema-html-prototype/` archived vào `99-archive/` với note rollback
7. ✅ `06-slide-template-acceptance-process.md` bump v0.2 → v1.0 reflect OD = primary tool
8. ✅ Smoke test: tạo 1 fake slide-plan với template thiếu slot → renderer exit ≠ 0 với error đúng slide_id
9. ✅ Codex sign-off trên `ai/handoff-codex.md`

---

## 10. Phase Gate

> RD này phải được approve bởi user + Codex (current owner) trước khi sang Phase 2 (SD).

**Blockers cho approval:**
- Q1-Q8 phải có default hoặc confirm
- Codex confirm unlock locked decision "Renderer owns HTML/CSS"
- User confirm migration cost ~20h worth it given "templates đã đủ, chỉ maintain"

---

*opus-lucida — RD v0.1 | 2026-05-13*
