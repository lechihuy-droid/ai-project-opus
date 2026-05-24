# RD — Wiki + Obsidian + Karpathy LLM Wiki
**Date:** 2026-04-29  
**Status:** 🔵 Draft — review trước khi build  
**Scope:** `personal-agent/personal-wiki/`, `wiki_ops/`, Obsidian workflow

---

## 0. Problem Statement

`personal-wiki/` hiện đã có cấu trúc Karpathy-style (`raw/` → `personal-wiki/` → query/lint), nhưng output vẫn còn giống article archive: `INDEX.md` có duplicate, nhiều page chồng lấn concept, và chưa có workflow human review trong Obsidian.

Mục tiêu là biến wiki thành **compiled knowledge base**: mỗi page là một concept sống, có backlinks, open questions, applied tracking, và được review/synthesis định kỳ trong Obsidian.

---

## 1. Usage

### 1.1 Daily/Weekly Flow

```text
External sources / files / notes
→ raw/                         # immutable source
→ wiki_ops.ingest              # LLM compile/update concept page
→ personal-wiki/               # Obsidian vault
→ human review in Obsidian     # edit, link, merge, think
→ run_wiki.py reflect/lint     # synthesis + quality checks
→ query/connect/decide         # ask compiled memory
```

### 1.2 Obsidian Role

Obsidian là **thinking UI**, không thay thế OPUS ANIMUS:

- đọc lại pages
- xem backlinks/graph
- phát hiện orphan/duplicate concepts
- viết reflection/synthesis
- chỉnh thủ công các page quan trọng

### 1.3 Hermes Role

Hermes **không nằm trong implementation scope hiện tại**. Hermes chỉ là future natural-language control layer sau khi CLI operations ổn định.

Future mapping:

```text
natural language
→ Hermes intent
→ run_wiki operation
```

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-WO-01 | Update `SCHEMA.md` thành Obsidian-friendly editorial constitution | P0 |
| FR-WO-02 | Frontmatter hỗ trợ `aliases`, `status`, `confidence`, `sources`, `related`, `applied`, `open_questions` | P0 |
| FR-WO-03 | Quy định một wiki page = một concept, không phải một article | P0 |
| FR-WO-04 | Ingest phải ưu tiên update/merge existing page trước khi tạo page mới | P0 |
| FR-WO-05 | Dedupe `INDEX.md` và giảm page trùng/chồng lấn hiện có | P0 |
| FR-WO-06 | Lint flag pages thiếu frontmatter, orphan, broken links, missing open questions, missing applied tracking | P1 |
| FR-WO-07 | Reflection template tạo `Personal/reflection-YYYY-WW.md` | P1 |
| FR-WO-08 | Query modes tương lai: `ask`, `connect`, `decide`, `review`, `used` có contract rõ | P2 |
| FR-WO-09 | Research Radar tương lai có thể đọc `open_questions` làm input | P2 |

---

## 3. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-WO-01 | Không sửa nội dung trong `raw/`; raw là immutable source |
| NFR-WO-02 | Mọi thay đổi behavior/schema phải update docs cùng lượt làm |
| NFR-WO-03 | Wiki pages phải đọc tốt trong Obsidian without plugins |
| NFR-WO-04 | Không thêm dependency lớn trước khi Phase 1-2 ổn định |
| NFR-WO-05 | Không implement Hermes trong scope WIKI-3 |

---

## 4. Explicit Exclusions

- Không build Hermes skill layer trong WIKI-3.
- Không thay Content Collector bằng pipeline mới.
- Không xóa `raw/` hoặc rewrite raw articles.
- Không productize Obsidian vault cho multi-user.
- Không chạy bulk LLM rewrite toàn bộ wiki trước khi có BD và backup strategy.

---

## 5. Proposed Phases

### Phase 1 — Obsidian-Friendly Schema

- Update `personal-wiki/SCHEMA.md`
- Define page lifecycle: `seed`, `evergreen`, `needs-review`, `archived`
- Add required sections: `Summary`, `Key Points`, `Why It Matters`, `Details`, `Application To OPUS ANIMUS`, `Open Questions`, `Applied`, `See Also`, `Sources`

### Phase 2 — Wiki Hygiene

- Dedupe `INDEX.md`
- Identify duplicate/conflated pages
- Normalize frontmatter for existing pages
- Run lint and document remaining issues

### Phase 3 — Concept-First Ingest

- Update ingest prompt/logic to inspect `INDEX.md`
- Prefer update existing page over create new page
- Add merge/update decision to ingest result

### Phase 4 — Reflection Workflow

- Add reflection template
- Ensure `run_wiki.py reflect` produces Obsidian-readable synthesis
- Include pages to revisit and open questions

### Phase 5 — Applied Knowledge Tracking

- Add `Applied` section support
- Extend lint for unapplied pages
- Keep `/wiki used` aligned with schema

### Phase 6 — Query Modes

- Define contracts for `connect`, `decide`, `review`
- Implement only after schema + hygiene are stable

### Phase 7 — Research From Open Questions

- Extract open questions from wiki pages
- Feed Research Radar/Collector later

### Phase 8 — Hermes Backlog Only

- Wrap stable wiki operations only after Phase 1-7 have stable contracts
- Keep this as backlog until explicitly approved

---

## 6. Documentation Gate

Before any code/schema implementation:

1. This RD must be reviewed/approved.
2. Create a BD for the chosen phase.
3. Each implementation step must update the matching doc:
   - `TODO.md` for priority/status
   - `SCHEMA.md` for wiki schema
   - `docs/SA-system-architecture.md` for data flow/boundary changes
   - this RD or a BD when scope changes

---

## 7. Open Questions

| # | Question | Default |
|---|---|---|
| Q1 | Có dùng Obsidian plugin nào không? | Không, plain Markdown first |
| Q2 | Có bulk rewrite toàn bộ page hiện tại không? | Không, làm hygiene có kiểm soát |
| Q3 | Reflection note nằm ở đâu? | `Personal/reflection-YYYY-WW.md` |
| Q4 | Hermes có vào scope không? | Không, backlog only |

