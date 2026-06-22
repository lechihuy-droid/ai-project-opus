# STATUS — opus-logos
**Updated:** 2026-06-22
**Current owner:** Claude
**Lifecycle:** 🟢 Built (MVP — wired into proactive brief)

## Objective

Strategy Brain theo v4: rank + conflict arbiter (precedence cố định) + decision log + outcome-driven tuning.

## State

- `logos/rank.py` (LLM-injectable + heuristic fallback), `arbiter.py` (precedence safety/health>deadline>goal>pref, no contradictory pair survives), `decide.py` (append DECISION-LOG), `tune.py` (outcome-weighted rules ≤30) — built, 8 pytest pass.
- Wired vào `primus/brief.py` (rank → arbitrate). Package root `opus-logos/` (import `logos.*`).

## Next step (map, not memory)

→ Bật LLM rank thật (Claude CLI) thay heuristic fallback; calibrate; mở rộng conflict detection ngoài health-vs-deadline.

## Owns (SoT)

- `opus-animus/DECISION-LOG.md` — strategic decisions (§7.2)
- `opus-logos/ranking-rules.md` — re-rank heuristics (≤30)
