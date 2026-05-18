# Personal Wiki Schema

This folder is both a Karpathy-style LLM Wiki and an Obsidian vault.

`raw/` stores immutable sources. `personal-wiki/` stores compiled knowledge. Obsidian is the thinking UI for reading, linking, editing, reviewing, and writing synthesis notes.

---

## Editorial Principles

1. One page = one concept, not one article.
2. Prefer updating or merging an existing concept page before creating a new page.
3. A good page explains why the concept matters to Huy or OPUS ANIMUS.
4. Sources support the page; they are not the page.
5. Every important page should create future action through `Applied` or `Open Questions`.
6. Keep Markdown plain and Obsidian-friendly. No plugin-specific syntax is required.

---

## Topics

- `AI/` — LLMs, agents, tools, papers, AI engineering, model releases
- `Stock/` — Nikkei, market analysis, macro economics, Japan economy, investing
- `Personal/` — reflections, decisions, goals, personal observations, synthesis
- `Tech/` — tools, frameworks, software methods, workflows, dev practices
- `Business/` — competitor business models, AI consulting models, SIer strategy, commercial positioning
- `FDE/` — Forward Deployed Engineer model, Japan IT transformation, outcome-based delivery, adoption radar, and playbooks

---

## File Naming

- Use kebab-case lowercase: `llm-agents.md`, `rag-vs-wiki.md`
- Name the concept, not the source or date.
- Use English filenames for stable links.
- Weekly reflection pages use: `Personal/reflection-YYYY-WW.md`

---

## YAML Frontmatter

Required on every concept page:

```yaml
---
title: "Page Title"
aliases: []
topic: AI | Stock | Personal | Tech | Business | FDE
tags: []
status: seed | evergreen | needs-review | archived
confidence: high | medium | low
sources: []
related: ["[[other-page]]"]
applied: []
open_questions: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Field meaning:

- `aliases`: alternate names Obsidian can resolve.
- `status`: lifecycle of the page.
  - `seed`: early note, useful but incomplete.
  - `evergreen`: stable concept page worth revisiting.
  - `needs-review`: unclear, duplicated, stale, or weakly sourced.
  - `archived`: kept for history but not active.
- `sources`: raw file paths or original URLs.
- `related`: explicit Obsidian wikilinks.
- `applied`: short action records or references to the `Applied` section.
- `open_questions`: research questions this page should feed back into the system.

---

## Page Structure

Use these sections for normal concept pages:

```markdown
# Page Title

## Summary
2-3 sentences describing the concept.

## Key Points
- The important facts or claims.

## Why It Matters
Why this concept matters to Huy, OPUS ANIMUS, career, investing, product, or thinking.

## Details
Full explanation, examples, tradeoffs, and source synthesis.

## Application To OPUS ANIMUS
How this concept could change the system, workflow, product direction, or personal practice.

## Open Questions
- Questions worth researching or revisiting.

## Applied
- YYYY-MM-DD — Used in: ...
  Result: ...

## See Also
- [[related-page]]

## Sources
- `raw/articles/...`
- Original URL
```

Short notes may start as `seed`, but important pages should eventually include all sections.

---

## Reflection Pages

Weekly reflections live in `Personal/` and use this structure:

```markdown
# Reflection YYYY-WW

## What I Learned

## What Changed My Thinking

## Connections I Noticed

## What I Should Apply

## Open Questions For Next Week

## Pages To Revisit
```

Reflection pages are synthesis, not source summaries.

---

## Cross-Reference Rules

- Use `[[page-name]]` syntax, filename without folder or extension.
- Every new concept page should link to at least one related page when a relation exists.
- When updating a page, check whether related pages should backlink to it.
- Prefer meaningful links in prose over dumping a long related list.
- Orphan pages are allowed as seeds, but evergreen pages should not stay orphaned.

---

## Ingest Rules

When ingesting a new source:

1. Read `INDEX.md` first.
2. Decide whether the source updates an existing concept or creates a new one.
3. If it overlaps an existing concept, update that page and append the source.
4. Create a new page only when the source introduces a distinct concept.
5. Add `Open Questions` when the source raises unresolved issues.
6. Add `Application To OPUS ANIMUS` when the source suggests a concrete system or personal workflow improvement.

---

## Lint Rules

Lint should flag:

- Missing frontmatter
- Broken `[[wikilinks]]`
- Orphan evergreen pages
- Duplicate or near-duplicate concept pages
- Pages older than 30 days with `status: seed`
- Pages without `Open Questions`
- Pages older than 60 days without `Applied`
- Contradictory claims across active pages

---

## Human Review Rules

Use Obsidian for weekly review:

1. Review new pages from the week.
2. Check graph/backlinks for orphan or duplicate concepts.
3. Promote useful pages from `seed` to `evergreen`.
4. Mark weak pages as `needs-review`.
5. Write or update the weekly reflection page.
6. Capture at least one action in `Applied` or one research prompt in `Open Questions`.
