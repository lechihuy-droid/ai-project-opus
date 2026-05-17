# BD — Wiki + Obsidian Phase 3: Concept-First Ingest
**Date:** 2026-04-29  
**Status:** 🟡 In progress  
**RD:** `RD-wiki-obsidian-karpathy.md`

---

## Scope

Update `wiki_ops/ingest.py` so ingest behaves like a Karpathy-style compiled wiki operation:

- Read `SCHEMA.md` and `INDEX.md`.
- Ask the LLM to choose `create` or `update`.
- Prefer updating an existing concept page when the source overlaps.
- Create a new page only for a distinct concept.
- Keep `INDEX.md` deduped when ingest runs.

---

## Explicit Non-Scope

- Do not add Hermes.
- Do not add new CLI commands.
- Do not bulk rewrite existing wiki pages.
- Do not modify `raw/` files except normal ingest save behavior.
- Do not change query/reflect/lint behavior in this phase.

---

## Interface Contract

`run_ingest(source: str, verbose: bool = True) -> dict`

Returns:

```python
{
    "status": "ok" | "error",
    "action": "create" | "update",
    "page_path": "AI/example.md",
    "topic": "AI",
    "filename": "example.md",
    "dry_run": false,
    "backup_path": "backups/personal-wiki/AI/example.20260429-120000.md" | None,
}
```

LLM JSON contract:

```json
{
  "action": "create",
  "topic": "AI",
  "filename": "concept-name.md",
  "title": "Concept Name",
  "tags": ["tag"],
  "content": "... full markdown page ...",
  "backlink_pages": ["related-page.md"]
}
```

For updates, `filename` must be the existing page filename from `INDEX.md`.

---

## Steps

| Step | Task | Smoke test | Status |
|---|---|---|---|
| 1 | Document Phase 3 ingest contract | Read this BD + SD contract section | ✅ Done |
| 2 | Update `SD-interface-contract.md` with Module C ingest contract | `Select-String ... "Concept-first ingest"` | ✅ Done |
| 3 | Update `ingest.py` prompt and save logic for `create/update` | `python -m py_compile wiki_ops/ingest.py` | ✅ Done |
| 4 | Make `_update_index()` dedupe-safe | Script confirms no duplicate links in `INDEX.md` after no-op update | ✅ Done |
| 5 | Update `TODO.md` status | `Select-String TODO.md "Phase 3"` | ✅ Done |
| 6 | Normalize LLM config/docs to Groq runtime | `Select-String config.yaml "provider: groq"` | ✅ Done |
| 7 | Add ingest `--dry-run` CLI path | `python -m py_compile run_wiki.py wiki_ops/ingest.py` | ✅ Done |
| 8 | Backup existing page before update writes | Inspect `_backup_page()` and smoke compile | ✅ Done |
| 9 | Harden Groq JSON output for ingest dry-run | `python -m py_compile wiki_ops/ingest.py` | ✅ Done |
| 10 | Avoid duplicating files already inside `raw/` | Dry-run shows `Using existing raw` for raw source path | ✅ Done |
| 11 | Reduce ingest token budget after Groq TPD limit | Compile + next dry-run after quota resets | ✅ Done |
| 12 | Disable scheduled collector auto-ingest during review | `config.yaml collect.auto_ingest: false` | ✅ Done |

---

## Safety Rules Added

- `run_wiki.py ingest --dry-run <source>` calls the LLM and reports the planned `create/update` action without writing raw/page/index/log/backlinks.
- Real `action: update` writes a timestamped backup outside the Obsidian vault at `personal-agent/backups/personal-wiki/...`.
- `INDEX.md` updates remain dedupe-safe and preserve `Hygiene Queue`.
- Groq JSON responses are requested with JSON mode when available and stripped from markdown/prose defensively before `json.loads`.
- Existing files under `raw/` are used in place; ingest does not create a second dated raw copy for them.
- Candidate context is ranked by source overlap and capped to reduce Groq token pressure.
- Content Collector now defaults to saving raw + reading list only; automatic wiki ingest is disabled by `collect.auto_ingest: false` until concept-first updates are approved.

---

## Live-Test Notes

- Dry-run with `karpathy-llm-wiki-pattern` succeeded and selected `update: AI/karpathy-llm-wiki-pattern.md`.
- First live ingest attempt was blocked by Groq TPD rate limit before any wiki write happened.
- No page/index/log/backlink write occurred during the blocked live attempt.
- Scheduled collector appears to have updated several pages earlier at 05:30-05:37; backups were created. Review before accepting those updates as canonical.
