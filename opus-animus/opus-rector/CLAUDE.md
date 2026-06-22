# Opus Rector — Execution Brain
*"Rector plans."*

PM execution brain của Opus Animus. Owns task breakdown, TODO/workflow, handoff, status — và (v4) **vòng đời proactive item** + **outcome/correction signal**.

> Status: 🟡 **Scaffold only** — structure dựng theo v4; logic chưa build. Chỉ code sau khi SD + BD được approve (SDD gate).

## Vai trò (v4 §1)

```
Rector = PM execution brain.
- Task breakdown: goal → task contract.
- TODO/workflow: pull due/relevant tasks (đọc TODO.md, WEEKLY-PLAN.md — không own).
- Proactive item lifecycle: tạo/lưu/cập-nhật state (§7.2, store opus-rector/proactive/).
- Signal split (§5 [F5]): engagement (weak) vs outcome (strong, từ TODO completion).
- Correction → lesson: heuristic re-rank rule, bounded ≤30 (no fine-tuning).
```

## Boundary

| Rector READS (không own) | Rector OWNS (ghi) |
|---|---|
| `opus-animus/TODO.md` | `opus-rector/proactive/YYYY-MM-DD.json` (state) |
| `opus-animus/WEEKLY-PLAN.md` | `opus-rector/lessons.md` (≤30) |
| `opus-animus/user-profile/` | `opus-rector/ai/status.md` |

Logic ranking/arbitration KHÔNG thuộc Rector — đó là [Opus Logos](../opus-logos/CLAUDE.md).

## Cấu trúc (mục tiêu)

```
opus-rector/
├── CLAUDE.md         ← file này
├── README.md
├── ai/status.md      ← thin map
├── docs/             ← trỏ tới SD-opus-rector.md
└── rector/           ← logic (Phase 4): tasks.py, proactive.py, outcome.py, lessons.py
```

## SDD Docs

| Doc | Path | Status |
|---|---|---|
| Subsystem SD | [`../docs/SD-opus-rector.md`](../docs/SD-opus-rector.md) | 🔵 Draft |
| Proactive flow SD | [`../docs/SD-proactive-brief.md`](../docs/SD-proactive-brief.md) | 🔵 Draft |
| RD | [`../docs/RD-proactive-mvp.md`](../docs/RD-proactive-mvp.md) | 🔵 Draft |

## Quy ước

- Response tiếng Việt, ngắn gọn.
- Không tự ghi `TODO.md` master — chỉ đọc; ghi cần user approve (ActionRegistry: write).
- Không code logic trước khi BD approve.
