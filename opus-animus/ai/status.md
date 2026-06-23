# STATUS - opus-animus
**Updated:** 2026-06-22
**Current owner:** Claude

> **v4 governance:** [`docs/OPERATING-MODEL-OPUS-ANIMUS-v4.md`](../docs/OPERATING-MODEL-OPUS-ANIMUS-v4.md) · architecture [`docs/SA-system-architecture.md`](../docs/SA-system-architecture.md). Proactive daily brief (pull-mode) MVP built — run `python opus-animus/run_brief.py`.

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
| RECTOR / Execution brain | 🟢 Built MVP | `opus-rector/` — task pull + proactive store (single-writer) + signals |
| LOGOS / Strategy brain | 🟢 Built MVP | `opus-logos/` — rank + arbiter (precedence) + decision-log + tune |
| PRIMUS / Proactive brief | 🟢 Built MVP | `run_brief.py` pull-mode; eval foundation `animus_core/` + `evals/` |

## Current objective

> **CONS-LLM-MIGRATION**: Migrate toàn bộ LLM calls từ Groq → Claude CLI (`claude.cmd -p`). **Hoàn thành 2026-05-20.**

## Current state (2026-05-20)

- **Zero Groq dependency** trong pipeline chính — tất cả filter/synthesis dùng Claude CLI.
- Migrated: `tools/collect_tool.py`, `run_weekly.py`, `run_daily.py`, `skills/intent_classifier.py`, `wiki_ops/ingest.py`, `wiki_ops/query.py`, `wiki_ops/reflect.py`, `wiki_ops/context_compressor.py`, `wiki_ops/skill_curator.py`, `wiki_ops/telegram_handler.py`, `tools/research_radar_tool.py`.
- Helper centralized: `utils/llm.py` — `claude_cli()` + `claude_cli_json()`.
- Voice transcription (Groq Whisper) đã xóa khỏi Telegram handler — bot text-only.
- CrewAI còn trong `crews/` + `tools/*.py` (BaseTool) — legacy Module A, chạy tay, không ảnh hưởng pipeline.
- FDE tab dashboard: 5 sub-tabs, tier scoring (Tier 1 = AI lab × consulting cross-actor), 8 actor groups.

## Next step

1. Kiểm tra pipeline thực tế: chạy `python run_collect.py --dry-run` → verify không còn Groq error.
2. Xem xét `crews/` + Module A có cần giữ hay xóa hẳn.
3. Tiếp tục backlog theo `docs/BACKLOG.md`.

## Constraints

- Do not edit files in `opus-consilium/raw/`; raw sources are immutable.
- Use Python 3.11 at `C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe`.
- Windows Task Scheduler là production scheduler.
- Mọi LLM call dùng `utils/llm.py:claude_cli_json()` — không dùng Groq.
