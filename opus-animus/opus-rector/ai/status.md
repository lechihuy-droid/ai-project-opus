# STATUS — opus-rector
**Updated:** 2026-06-22
**Current owner:** Claude
**Lifecycle:** 🟢 Built (MVP — wired into proactive brief)

## Objective

Execution Brain theo v4: task pull + proactive item lifecycle + signal split + correction lessons.

## State

- `rector/tasks.py` (pull_due_tasks), `proactive.py` (single-writer store, atomic), `outcome.py` (engagement/outcome split), `lessons.py` (cap 30) — built, 12 pytest pass.
- Wired vào `primus/brief.py`; proactive set lưu `opus-rector/proactive/{date}.json`.
- Package root: `opus-rector/` (import `rector.*` qua conftest).

## Next step (map, not memory)

→ Tune: real ranking signal + top-N cap cho brief; wire `user-profile/` cho relevance gate; outcome diff từ TODO completion thật.

## Owns (SoT)

- `opus-rector/proactive/YYYY-MM-DD.json` — proactive item-set + state (§7.2)
- `opus-rector/lessons.md` — re-rank heuristics (≤30)
