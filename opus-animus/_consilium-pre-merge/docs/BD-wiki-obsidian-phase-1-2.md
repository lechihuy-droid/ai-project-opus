# BD — Wiki + Obsidian Phase 1-2
**Date:** 2026-04-29  
**Status:** 🟡 In progress  
**RD:** `RD-wiki-obsidian-karpathy.md`

---

## Scope

Phase 1-2 only:

1. Upgrade `personal-wiki/SCHEMA.md` into an Obsidian-friendly editorial constitution.
2. Dedupe `personal-wiki/INDEX.md` safely.
3. Document known duplicate/conflated concepts for later merge.

---

## Explicit Non-Scope

- Do not edit `raw/`.
- Do not bulk rewrite existing wiki pages.
- Do not change `wiki_ops/ingest.py`, `query.py`, `lint.py`, or `run_wiki.py`.
- Do not implement Hermes.

---

## Steps

| Step | Task | Smoke test | Status |
|---|---|---|---|
| 1 | Update dev approach with hybrid SDD rule | `Select-String dev-approach/README.md "Chọn Mức SDD"` | ✅ Done |
| 2 | Upgrade `SCHEMA.md` for Obsidian + concept-first wiki | Read file and verify required frontmatter/sections | ✅ Done |
| 3 | Dedupe `INDEX.md` without deleting pages | Ensure unique wikilinks per topic | ✅ Done |
| 4 | Add hygiene notes to this BD | Verify duplicate concepts are listed | ✅ Done |
| 5 | Update `TODO.md` status | `Select-String TODO.md "WIKI-3"` | ✅ Done |

---

## Hygiene Notes

Known conflated/duplicate clusters to review later:

- GitHub AI cluster:
  - `github-ai-tools.md`
  - `github-ai-tools-and-features.md`
  - `github-ai-features.md`
  - `github-ai-features-and-tools.md`
  - `github-ai-and-ml.md`
- Karpathy LLM Wiki cluster:
  - `karpathy-llm-wiki-pattern.md`
  - `karpathy-llm-wiki-pattern-explained.md`
  - `karpathy-llm-wiki-idea-file.md`
  - `llm-wiki-agent-research.md`
- Requirement-driven development cluster:
  - `requirement-driven-development.md`
  - `requirement-driven-development-for-e-commerce.md`

Do not merge these in Phase 1-2; only document them for a later controlled pass.
