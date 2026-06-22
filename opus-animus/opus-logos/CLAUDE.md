# Opus Logos — Strategy Brain
*"Logos thinks."*

Strategic reasoning brain của Opus Animus. Owns priority, roadmap, decision, stop-list — và (v4) là **ranker** + **arbiter cuối cùng** của brief (§3.3) + **tuner** ranking từ outcome signal (§5).

> Status: 🟡 **Scaffold only** — structure dựng theo v4; logic chưa build. Chỉ code sau khi SD + BD được approve (SDD gate).

## Vai trò (v4 §1, §3.3, §5)

```
Logos = strategic reasoning brain.
- Rank: xếp ưu tiên proactive item theo goal-alignment + năng lượng/lịch hôm nay.
- Arbiter (§3.3 [F4]): brief KHÔNG chứa 2 đề xuất mâu thuẫn.
    precedence CỐ ĐỊNH: safety/health > hard deadline > goal priority > preference.
    resolve + nêu trade-off.
- Decide: strategic decision / stop-list → ghi DECISION-LOG.md.
- Tune (§5): re-rank heuristic từ OUTCOME signal (> engagement). No fine-tuning.
```

## Boundary

| Logos READS | Logos OWNS (ghi) |
|---|---|
| `opus-animus/user-profile/` | `opus-animus/DECISION-LOG.md` |
| outcome signal (Rector) | `opus-logos/ranking-rules.md` (≤30) |
| Nexus context (health+calendar) | `opus-logos/ai/status.md` |

Task pull + proactive state KHÔNG thuộc Logos — đó là [Opus Rector](../opus-rector/CLAUDE.md).

## Cấu trúc (mục tiêu)

```
opus-logos/
├── CLAUDE.md         ← file này
├── README.md
├── ai/status.md      ← thin map
├── docs/             ← trỏ tới SD-opus-logos.md
└── logos/            ← logic (Phase 4): rank.py, arbiter.py, decide.py, tune.py
```

## SDD Docs

| Doc | Path | Status |
|---|---|---|
| Subsystem SD | [`../docs/SD-opus-logos.md`](../docs/SD-opus-logos.md) | 🔵 Draft |
| Proactive flow SD | [`../docs/SD-proactive-brief.md`](../docs/SD-proactive-brief.md) | 🔵 Draft |
| RD | [`../docs/RD-proactive-mvp.md`](../docs/RD-proactive-mvp.md) | 🔵 Draft |

## Quy ước

- Response tiếng Việt, ngắn gọn.
- Arbiter precedence là CỐ ĐỊNH, deterministic — không để LLM tự quyết thứ tự precedence.
- Mọi strategic decision phải vào DECISION-LOG.md, không sống chỉ trong chat (§7.3).
- Không code logic trước khi BD approve.
