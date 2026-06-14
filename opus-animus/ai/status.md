# STATUS - opus-animus
**Updated:** 2026-06-14
**Current owner:** Codex (MEM-1 built; awaiting Claude review)

## Active sub-systems

| Sub-system | Status | Note |
|---|---|---|
| CONS / News Research Tool | Active | Local dashboard + Intel/FDE/Reading views at `http://127.0.0.1:8765` |
| CONS / Content Collector | Active | Daily 05:30 JST — collect → synthesis → wiki ingest |
| CONS / Weekly Synthesizer | Active | Chủ nhật 06:00 JST — Task Scheduler `opus-weekly-research` |
| CONS / Module C Wiki | Running | wiki-poll (5min) + wiki-lint-weekly |
| CONS / FDE Research Tab | Active | Dashboard tab theo dõi FDE model adoption, 8 actor groups |
| HOME Dashboard | Active | FastAPI + React, `run_dashboard.py` → localhost:8765 |
| LUCIDA / Wake Lane | Paused | Previous handoff in `opus-lucida/ai/handoff-codex.md` |

## Current objective

> **MEM-1 / Cross-Session Memory (`recall`)**: Built by Codex on 2026-06-14. `opus-consilium/run_recall.py` now indexes `ai/sessions`, `ai/handoff-*`, `ai/status.md`, `personal-wiki/INDEX.md`, and `opus-lucida/ai/*.md` into SQLite FTS5 at `memory/recall.db` (gitignored), with ranked snippets, `--json`, `--limit`, and `--kind`. Step 0→6 smoke tests + U-1..U-9 / IT-1..IT-5 / EC-1..EC-3 pass. Awaiting Claude review/merge.
>
> *Đã xong:* **CONS-LLM-MIGRATION** — Groq → Claude CLI, hoàn thành 2026-05-20 (chi tiết phần Current state bên dưới).
> *Đã chốt:* **Hermes** → No-Go (2026-06-11, xem `docs/EVAL-hermes-agent-integration.html`).

## Current state (2026-05-20)

- **Zero Groq dependency** trong pipeline chính — tất cả filter/synthesis dùng Claude CLI.
- Migrated: `tools/collect_tool.py`, `run_weekly.py`, `run_daily.py`, `skills/intent_classifier.py`, `wiki_ops/ingest.py`, `wiki_ops/query.py`, `wiki_ops/reflect.py`, `wiki_ops/context_compressor.py`, `wiki_ops/skill_curator.py`, `wiki_ops/telegram_handler.py`, `tools/research_radar_tool.py`.
- Helper centralized: `utils/llm.py` — `claude_cli()` + `claude_cli_json()`.
- Voice transcription (Groq Whisper) đã xóa khỏi Telegram handler — bot text-only.
- CrewAI còn trong `crews/` + `tools/*.py` (BaseTool) — legacy Module A, chạy tay, không ảnh hưởng pipeline.
- FDE tab dashboard: 5 sub-tabs, tier scoring (Tier 1 = AI lab × consulting cross-actor), 8 actor groups.

## Next step

1. **[MEM-1]** Claude review diff → merge.
2. Sau MEM-1: Phase 1(a) Skills hoá 3 pipeline (RD riêng), rồi Phase 2 Hooks + Curator.
3. (Tồn đọng) Xem xét `crews/` + Module A có cần giữ hay xóa hẳn; backlog `opus-consilium/docs/BACKLOG.md`.

## Constraints

- Do not edit files in `opus-consilium/raw/`; raw sources are immutable.
- Use Python 3.11 at `C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe`.
- Windows Task Scheduler là production scheduler.
- Mọi LLM call dùng `utils/llm.py:claude_cli_json()` — không dùng Groq.
