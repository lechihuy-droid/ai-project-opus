# RD — Slide Compiler Agent (JLPT N2)
**Date:** 2026-05-13
**Status:** 🟡 User-approved v0.4 — pending Codex sign-off for Phase 4 (implementation)
**Author:** Claude (session 2026-05-13)
**Supersedes:** `RD-od-mcp-renderer-migration.md`
**Planning owner:** Claude (RD + SD + BD)
**Implementation owner:** Codex (Phase 4)

**Architecture mantra:** `Claude plans. Node renders. OD previews. Playwright validates.`

**Changelog:**
- v0.4 (2026-05-13): renamed "Slide Compiler Agent"; OD MCP confirmed read-only (not in render path); Custom Slide Renderer MCP added as v2 backlog; consolidated to single master template structure (`templates/n2-master/`).
- v0.3 (2026-05-13): Q1, Q5, Q6 locked. RD user-approved. Proceeding to SD + BD.
- v0.2 (2026-05-13): scope confirmed — agent feeds Lucida video pipeline, replaces React renderer.
- v0.1 (2026-05-13): initial draft framed agent as parallel/alternative artifact.

---

## 0. Problem Statement

**Vấn đề:** Lucida hiện chia 2 hệ thống rời rạc cho deck production: (a) skeleton + script bằng Markdown, (b) React renderer cần typed JSON đã digest. Giữa 2 hệ thống không có pipeline tự động — phải tự convert content sang JSON trước khi render. Đồng thời React + Vite + TS stack nặng cho output cuối là HTML+PNG+audio+video.

**Hiện trạng:**
- Lucida React renderer (`apps/schema-html-prototype/`) cần `wake-typed-deck.json` đã digested
- Bước skeleton/script → typed JSON đang làm thủ công hoặc qua language generation runner
- Wake cluster 17-slide deck đã verified end-to-end (Playwright export PASS, audio sync PASS)
- MVP spike (`apps/jlpt-n2-slides/templates/n2-master/sample-template.html`) chứng minh substitution-renderer path khả thi

**Mục tiêu:** Build agent (Claude orchestrator + OD MCP design layer + QA loop) đọc thẳng Lucida skeleton/script và emit HTML deck feed Playwright → PNG → audio sync → video pipeline. Agent **thay** React renderer cho mọi lane (Wake + future). React app archive vào `99-archive/`.

**Locked decision được preserve:**
- "LLM/agents output typed JSON only" → Claude orchestrator emit `lesson.json` + `slide-plan.json` (typed, no HTML)
- "Renderer owns HTML/CSS" → Agent's substitution engine fit role này; template HTML files own layout
- "JSON does not contain raw HTML" → giữ nguyên

---

## 1. Usage — Agent Chạy Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Lucida author + Claude/Codex agent điều khiển |
| Trigger | `node scripts/runAgent.js --lane <lane-id> --mode <ingest|plan|render|qa|fix|all>` |
| Tần suất | Per-lesson: ingest 1 lần, render+QA loop nhiều lần đến publish-ready |
| Output cuối | HTML deck → feed Playwright → PNG → audio + video (giống hiện tại) |

### 1.2 Agent Structure

```
JLPT N2 Slide Agent
├── Claude Orchestrator
│   ├── đọc skeleton/script từ opus-lucida/production/00-active/<lane>/
│   ├── tạo lesson.json (digest content)
│   ├── tạo slide-plan.json (assign template_id từ Lucida template library)
│   ├── review logic bài giảng
│   └── điều khiển MCP qua prompts/00..04-*.md
│
├── Open Design MCP (design + render layer)
│   ├── tạo template — HTML + slots.json + CSS (preview qua OD daemon)
│   ├── render HTML deck — Mustache substitute slide-plan → final-deck.html
│   ├── sửa layout — apply qa-report fixes
│   └── export artifact — self-contained HTML feed Playwright
│
└── QA Loop
    ├── layout QA — overflow, hierarchy, safe-zone (rule-based script)
    ├── teaching QA — pedagogy, naturalness (Claude review)
    ├── skeleton mapping QA — every slide ↔ skeleton section
    └── final publish check — verdict + score, gate Playwright export
```

### 1.3 End-to-end Usage Flow

```
Bước 1: User chốt lane (vd wake-cluster) có skeleton + script ổn
Bước 2: Mode 0 (Ingest) — Claude reads:
        - production/00-active/<lane>/01-master-teaching-skeleton.md
        - production/00-active/<lane>/02-script.md
        - production/01-rules/slide-system/02-slide-template-library.md
        - production/01-rules/slide-system/10-banned-preferred-language-dictionary.md
        → emit lessons/<lane>/lesson.json
Bước 3: User review lesson.json → approve
Bước 4: Mode 1 (Plan) — Claude maps lesson → slides:
        → emit lessons/<lane>/slide-plan.json
Bước 5: User review slide-plan.json → approve
Bước 6: Mode 2 (Render) — Substitution engine:
        - Load templates/<template_id>/{template.html, slots.json}
        - Substitute slots từ slide-plan
        → emit lessons/<lane>/final-deck.html
Bước 7: Mode 3 (QA) — Claude + rule-based checks:
        → emit lessons/<lane>/qa-report.md với verdict + fix list
Bước 8: Mode 4 (Fix) — Apply qa-report fixes, re-emit final-deck.html
Bước 9: Loop 7-8 max 3 iterations đến verdict PASS / PASS_WITH_NOTES
Bước 10: Playwright export final-deck.html → PNG frames vào production/00-active/<lane>/frames/
Bước 11: Audio + video pipeline tiếp tục như hiện tại (không thay)
```

### 1.4 Example Interactions

**Ví dụ 1 — Wake regeneration sau migration:**
```
Input:  production/00-active/wake-cluster/01-master-teaching-skeleton.md + 02-script.md
Command: node scripts/runAgent.js --lane wake-cluster --mode all
Output: lessons/wake-cluster/{lesson.json, slide-plan.json, final-deck.html, qa-report.md}
        + production/00-active/wake-cluster/frames/slide-*.png (via Playwright)
Gate:   17 PNG visual review = match pre-migration baseline
```

**Ví dụ 2 — Slot drift fail-fast:**
```
Trigger: slide-plan template_id="minimal_pair" thiếu slot "pattern_b"
Output:  Renderer exit ≠ 0 với:
         "lessons/wake-cluster/slide-plan.json:slides[10]:
          template 'minimal_pair' requires slot 'pattern_b'.
          See templates/minimal_pair/slots.json:8-10."
```

**Ví dụ 3 — Banned label hard gate:**
```
Trigger: slide-plan on-screen text chứa "Core Method" (banned EN label)
Output:  Mode 3 QA emit BLOCK verdict trước khi đi tới final-deck.html
         qa-report cite line + slide_id + suggested replacement từ
         12-vietnamese-jlpt-n2-explanation-pattern-bank.md
```

---

## 2. Functional Requirements

### 2.1 Claude Orchestrator

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-ORC-001 | Read Lucida skeleton + script từ `production/00-active/<lane>/` (read-only) | P0 | Skeleton/script không bị agent ghi đè |
| FR-ORC-002 | Emit `lesson.json` với: lesson_title, grammar_points[], examples[], comparisons[], practices[], cta. Schema validated bằng JSON Schema | P0 | |
| FR-ORC-003 | Emit `slide-plan.json` với mỗi slide: slide_id, phase, template_id, slots{}, source_section, duration_sec, on_screen_text_budget | P0 | template_id phải tồn tại trong Lucida library v2 |
| FR-ORC-004 | Pre-render review: flag missing grammar points, duplicate slides, dense slides, banned labels — emit vào qa-report trước khi render | P0 | Early gate |
| FR-ORC-005 | Drive OD MCP qua `prompts/00..04-*.md`. Mỗi prompt có input/output schema + pass condition | P0 | |
| FR-ORC-006 | Hard gate banned-preferred dictionary (`10-banned-*.md`) — fail nếu slide-plan chứa banned EN label | P0 | |
| FR-ORC-007 | Honor 3-view labels lock: `Ý nghĩa - Dạng - Cách dùng` (không EN, không alternative VI) | P0 | |

### 2.2 OD MCP — Design + Render Layer

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-MCP-001 | Template authoring trong `templates/<template_id>/`: `template.html` + `slots.json` + optional `template.css` | P0 | OD daemon = preview khi tạo template mới |
| FR-MCP-002 | Substitution renderer: Mustache đọc slide-plan + template HTML → final-deck.html với mỗi slide là 1 `<section>` | P0 | ~150-200 LOC Node script |
| FR-MCP-003 | Validate: tất cả `{{slot}}` trong template.html phải khai báo trong slots.json (catch drift) | P0 | |
| FR-MCP-004 | Fail-fast nếu slide-plan thiếu required slot — exit ≠ 0 với slide_id + missing slot name + line reference | P0 | Thay thế TS compiler errors |
| FR-MCP-005 | Layout fix mode: nhận qa-report → apply chỉ patches listed, không redesign, không đổi tokens | P0 | Mode 4 strict |
| FR-MCP-006 | Export self-contained: inline CSS, Google Fonts qua `<link>`, images base64 if <50KB | P0 | |
| FR-MCP-007 | Mỗi `<section>` emit `data-slide-id`, `data-template-id`, `data-duration` | P0 | Cho Playwright frame export + audio sync |
| FR-MCP-008 | Output HTML tương thích Playwright deterministic screenshot: fixed 1280×720 logical, no animation during screenshot phase | P0 | Video pipeline contract |

### 2.3 QA Loop

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-QA-001 | Layout QA: char-budget overflow, single-accent rule, safe-zone padding ≥ 40px | P0 | Reuse `04-slide-framework-qa-checklist.md` |
| FR-QA-002 | Teaching QA: 4 grammar points cleanly separated, examples natural, comparisons real | P0 | Reuse `03-slide-qa-criteria.md` |
| FR-QA-003 | Skeleton mapping QA: every slide có `source_section` trỏ về anchor tồn tại trong skeleton | P0 | Tương đương `13-wake-slide-traceability-matrix.md` |
| FR-QA-004 | Final publish check: verdict (PASS / PASS_WITH_NOTES / REVISE / BLOCK) + score /10 | P0 | Match Lucida vocab |
| FR-QA-005 | qa-report.md format: verdict, critical, major, minor, exact fix list theo slide_id | P0 | Drives Mode 4 |
| FR-QA-006 | QA loop max 3 iterations — sau đó escalate user, không tự nới gate | P1 | |

### 2.4 Migration — Wake Re-verify + React Decommission

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-MIG-001 | Port hết 8 layout TSX components hiện có sang `templates/<template_id>/` (HeroTitle, KeyMessage, TwoColumn, ComparisonTable, FigureFocus, SectionDivider, Summary, Wake-specific group) | P0 | ~422 LOC TSX → HTML+CSS+slots.json |
| FR-MIG-002 | Wake 17-slide deck phải pass visual review pre/post migration: PNG export so sánh với baseline (`production/00-active/wake-cluster/frames/`) | P0 | **Hard gate** |
| FR-MIG-003 | Refactor Playwright export script (`apps/schema-html-prototype/scripts/exportScreenshots.ts`) → chạy từ agent's final-deck.html | P0 | |
| FR-MIG-004 | Archive `apps/schema-html-prototype/` → `99-archive/schema-html-prototype-pre-mcp/` với note rollback steps | P0 | Backup, không xóa |
| FR-MIG-005 | Update Lucida canonical docs: `ai/status.md` (renderer = agent), `02-slide-template-library.md`, `06-slide-template-acceptance-process.md`, `20-lesson-production-sop.md`, `11-current-operating-flow.md` | P0 | Doc-sync rule |
| FR-MIG-006 | Zod schemas của old React app (`src/schema/*.ts`) — port sang JSON Schema trong agent hoặc archive cùng React app | P1 | Decide trong SD |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | End-to-end run time (Mode 0..4 trên 1 lane) | < 60s không tính LLM thinking | P1 |
| NFR-002 | Render time | < 2s cho 17-slide deck | P0 |
| NFR-003 | Wake gate preservation | 17/17 PNG visual review match pre-migration baseline | P0 |
| NFR-004 | Banned label enforcement | Auto-detect ≥ 95% banned terms trước khi emit deck | P0 |
| NFR-005 | Reproducibility | Cùng skeleton + script = cùng `lesson.json` (deterministic); cùng `slide-plan.json` = cùng `final-deck.html` byte-identical | P0 |
| NFR-006 | Agent dependency footprint | Node + 1-2 npm (Mustache + JSON Schema validator). No Vite, no React, no TS runtime | P1 |
| NFR-007 | Skeleton/script content read-only | Agent không write `production/00-active/<lane>/` (verify bằng git diff) | P0 |
| NFR-008 | Audio sync compatibility | Frame export PNG naming + `data-slide-id` match downstream `audio/slide-*.mp3` convention | P0 |

---

## 4. Explicit Exclusions

- **Không** generate audio, video, hay subtitle — reuse existing pipeline (`automation/workflows/38-audio-generation-sop.md`)
- **Không** ghi vào `opus-lucida/production/00-active/<lane>/` skeleton/script (read-only consumer)
- **Không** thêm slide type mới — chỉ port `template_id` đã có trong Lucida library v2
- **Không** support animation/reveal trong v1 (`1 logical slide = 1 PNG frame = 1 audio segment`)
- **Không** support 3:4 vertical trong v1 — 16:9 only
- **Không** xoá `apps/schema-html-prototype/` — archive vào `99-archive/`, giữ rollback path
- **Không** build CrewAI hay multi-agent framework — 1 Claude session điều khiển, OD MCP là tool
- **Không** thay đổi `wake-slide-plan.json` hay `wake-typed-deck.json` format (Wake re-gen sẽ tạo `lessons/wake-cluster/` mới, không đè cũ)
- **Không** build Custom Slide Renderer MCP trong v1 — Node scripts trực tiếp đủ cho MVP. MCP wrapper deferred v2 backlog (xem §6 Design Decisions).
- **Không** dùng OD MCP trong render path — OD MCP read-only, chỉ cho preview + inspection. LLM cũng không trong render path (vi phạm NFR-005).

---

## 5. Open Questions

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | `<agent-root>` đặt ở đâu? | **CONFIRMED**: `opus-lucida/apps/slide-agent/` |
| Q2 | `lesson.json` schema: JSON Schema thuần hay Zod? | JSON Schema — đơn giản, không TS runtime, validator npm có sẵn |
| Q3 | Substitution engine: Mustache vs Handlebars vs Eta? | Mustache.js — logic-less, đủ cho slot substitution |
| Q4 | Output dùng cho gì? | **CONFIRMED**: feed video pipeline. Replace React renderer. |
| Q5 | Lane migration order — Wake trước hay lane mới trước? | **CONFIRMED**: lane mới trước → agent stable → apply test cho Wake (visual review gate FR-MIG-002) |
| Q6 | React app fate khi agent stable? | **CONFIRMED**: archive vào `99-archive/schema-html-prototype-pre-mcp/`, không delete |
| Q7 | Playwright config — share file hay agent có copy riêng? | Agent có `apps/slide-agent/playwright.config.ts` riêng, đơn giản hóa từ bản hiện tại. |
| Q8 | Wake re-gen visual review tolerance — pixel-perfect hay visual review thường? | Visual review thường — pixel-perfect khắt khe quá, fonts có thể render khác minimal. |
| Q9 | Cleanup `apps/_archive-jlpt-n2-slides-v2-mis-scoped/` (folder bị lock) | Sau khi user đóng OD daemon, xóa folder. Không liên quan agent này. |
| Q10 | Codex sign-off bao giờ? | Trước khi sang Phase 2 (SD). Bạn forward RD cho Codex; Codex review + comment trong session sau. |

---

## 6. Design Decisions

| Quyết định | Lý do | Đã cân nhắc thay thế |
|---|---|---|
| Agent thay React renderer (full migration) | Stack React+Vite+TS nặng cho output là static HTML+PNG. Agent đơn giản hóa: Markdown skeleton → JSON → HTML. Cùng lúc giải quyết "skeleton → typed JSON" thủ công. | Parallel-only: user đã refuse (chọn "all lanes use agent"). |
| Substitution engine + Mustache | Templates stable, slot substitution đủ. Logic-less templates tránh logic creep. | Handlebars/Eta: helpers overkill; React: stack đã muốn bỏ. |
| Locked decision "Renderer owns HTML/CSS" giữ nguyên | Agent's substitution engine fit role này; template HTML files own layout. Không cần unlock. | Unlock: thay đổi không cần thiết, làm contract Lucida lỏng hơn. |
| Tách `lesson.json` (digest) khỏi `slide-plan.json` | Hai bước review riêng — content trước, slide mapping sau. Match user spec. | Gộp: dễ miss issue ở 1 layer. |
| Archive React app, không xóa | Rollback path nếu agent regression. Chi phí lưu giữ thấp. | Delete: risk cao nếu Wake regression không phát hiện ngay. |
| OD MCP authoring + preview, không runtime | OD daemon value-add chính là PREVIEW khi authoring template. Render production thì Node script đơn giản, deterministic, không phụ thuộc daemon. | OD daemon làm render: phụ thuộc daemon up, không deterministic. |
| Lane mới trước, Wake migrate sau (Q5 default) | Lower risk: agent stable trên lane mới rồi mới đụng Wake gate đã verified. | Wake trước: tốc độ cao hơn nhưng risk Wake regression sớm. |
| Honor banned dict + 3-view labels lock | Output feed cùng video pipeline → phải match Lucida language contract. | Skip: output drift, lãng phí công. |
| **OD MCP read-only, Node renders** | OD MCP tools không có write capability. Render path phải deterministic (NFR-005). LLM trong render = non-deterministic + token-expensive + CI-unfriendly. | OD daemon as renderer: không support `{{slot}}` substitution; phụ thuộc daemon up. Claude as renderer: vi phạm NFR-005. |
| **Custom Slide Renderer MCP deferred v2** | MVP không cần — Node scripts đơn giản đủ. Custom MCP cho phép Claude gọi `render_deck` tool natively nhưng overhead build + maintain MCP server không justify ở v1. | v1 build now: tăng surface area, delay Wake gate. Never build: agent UX kém hơn cho Codex/Claude khi mature. |
| **Consolidated `templates/n2-master/`** | 1 folder cho master template family thay vì 8 folders per template_id. Match MVP spike pattern. Variants giữ trong `template.html` (Mustache partials hoặc `<template>` blocks). | Per-template-id folders: stronger encapsulation nhưng tăng file count + nav cost cho 8-10 templates. |

---

## 7. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Wake 17-slide regression sau migration | Medium | **High** | FR-MIG-002 hard gate visual review. Q5 default: migrate lane mới trước → agent stable → mới đụng Wake. Chạy A/B parallel trong migration session. |
| Mất TS template-field check → silent slot drift | High | Medium | FR-MCP-003 + FR-MCP-004 fail-fast validator. Test suite chạy mỗi PR. |
| Mustache không đủ cho Wake-specific layouts (TSX 245 LOC) | Medium | Medium | Q3 escape hatch: chuyển Handlebars partial nếu gặp template phức tạp. Decide khi gặp. |
| Codex reject migration | Low-Medium | **High** | RD này submit Codex review trước Phase 2. Block code work nếu Codex từ chối. |
| Audio sync break: PNG frame timing không match audio segment | Low | **High** | NFR-008 contract: data-slide-id + frame naming match. Test audio sync trên 1 lane trước Wake. |
| Banned label false-negative | Medium | Medium | FR-ORC-006 + dict lookup; manual QA Loop bổ sung. |
| Migration scope creep (port hết Wake-specific) | High | Medium | FR-MIG-001 chỉ port 8 components hiện có; không thêm. Backlog mọi feature mới. |
| OD MCP read-only constraint khi authoring | Low | Low | Workflow tested trong MVP: Claude (Write tool) emit files, OD daemon đọc filesystem. |

---

## 8. Estimated Effort

| Phase | Estimate |
|---|---|
| Phase 2 (SD) — schemas + module contracts + Mustache decisions | 3-4h |
| Phase 3 (BD) — ordered build steps + test plan | 2h |
| Phase 4 — Orchestrator (Claude prompts 00..04) | 3-4h |
| Phase 4 — Substitution renderer + slot validator | 4-5h |
| Phase 4 — Port 8 layout components TSX → HTML+slots.json | 6-10h |
| Phase 4 — QA Loop (rule-based scripts + Claude review prompts) | 3-4h |
| Phase 4 — Playwright export refactor | 2h |
| Phase 4 — Wake regeneration + visual review gate | 3-4h |
| Phase 4 — Doc sync (5+ canonical files) | 2-3h |
| Phase 4 — Archive React app + rollback notes | 1h |
| **Total** | **29-39h, 3-4 focused sessions** |

---

## 9. Acceptance Criteria

Agent v1 + migration được coi là **DONE** khi:

1. ✅ `node scripts/runAgent.js --lane wake-cluster --mode all` emit 4 files (lesson.json, slide-plan.json, final-deck.html, qa-report.md)
2. ✅ Wake 17-slide PNG export (qua agent) pass visual review so với pre-migration baseline (FR-MIG-002)
3. ✅ Audio sync trên Wake hoạt động: existing `audio/slide-*.mp3` align với new frames qua data-slide-id
4. ✅ 8 template_id port xong, mỗi cái có template.html + slots.json + validator pass
5. ✅ qa-report.md có verdict + score; banned-label check pass; 3-view labels VI lock honored
6. ✅ React app archived vào `99-archive/schema-html-prototype-pre-mcp/` với README rollback steps
7. ✅ 5+ Lucida canonical docs updated trong cùng commit (FR-MIG-005)
8. ✅ Smoke test: slide-plan thiếu slot → renderer exit ≠ 0 với error đúng slide_id
9. ✅ Codex sign-off trên `ai/handoff-codex.md` + update `ai/status.md` renderer entry
10. ✅ 1 lane mới (không phải Wake) chạy agent end-to-end, render → frames → audio → video PASS

---

## 10. Phase Gate

> RD này phải được approve bởi **user + Codex** trước khi sang Phase 2 (SD).

**Blockers cho approval:**
- Q1, Q5, Q6 — user chốt (Q4 đã confirm)
- **Codex sign-off** vì agent thay React renderer (production-critical decision)
- Codex confirm: locked decision "Renderer owns HTML/CSS" được preserve clean (agent substitution engine = renderer role)
- User confirm cost estimate ~30h worth it

**Handoff Codex:**
1. User forward RD này cho Codex
2. Codex review trong session sau
3. Codex update `ai/handoff-codex.md` với verdict (approve / request changes / reject)
4. Nếu approve → Claude/Codex sang Phase 2 (SD)

---

## 11. What Changed vs RD v0.1 (this same file's older version)

| Aspect | v0.1 (parallel/alt artifact) | v0.2 (this — full migration via agent) |
|---|---|---|
| Output use case | Alternative artifact, không feed pipeline | **Feed video pipeline, replace React renderer** |
| Lucida impact | Read-only, không đụng runtime | Replace runtime; React archive |
| Codex sign-off | Informational | **Required** |
| Wake gate | Không đụng | **Phải re-verify visual review post-migration** |
| FR groups | 3 (Orchestrator, MCP, QA) | 4 (+ Migration) |
| Cost estimate | 18-26h | **29-39h** |
| Roll-back | Easy (delete agent folder) | Medium (restore from 99-archive) |
| Risk level | Low | **Medium-High** |

v0.1 framing không còn đúng vì user đã chọn "tất cả lane dùng agent, bỏ React renderer".

---

*opus-lucida — RD v0.2 (JLPT N2 Slide Agent — full migration) | 2026-05-13*
