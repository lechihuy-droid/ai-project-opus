# SA — Opus Ecosystem (toàn cảnh)
**Date:** 2026-06-24
**Status:** 🟢 Current
**Scope:** Bản đồ cấp cao **toàn bộ hệ sinh thái Opus** trong repo `ai-project-opus` (+ sibling `opus-vita`). Chi tiết nội bộ agent: [`SA-opus-animus-v2.md`](SA-opus-animus-v2.md). Governance: [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md).

> Đây là map "có gì, ở đâu, kết nối thế nào" — không phải spec implementation. Mỗi project có CLAUDE.md/RD/SD riêng.

---

## 1. Tổng quan — 4 tầng

```
Opus = 1 meta-workspace (opus-animus) + các workspace sản phẩm + tầng dùng chung + data planes.
```

| Tầng | Là gì | Thành phần |
|---|---|---|
| **A. Agent core (Primus)** | Bộ não AI điều phối (v4) | `animus_core/` + `primus/` · `opus-consilium/` · `opus-logos/` · `opus-rector/` |
| **B. Workspace sản phẩm / vertical** | Năng lực theo lĩnh vực Primus/người dùng gọi | **`opus-actio/`** (tài chính) · `opus-lucida/` (content) · `apps/` (học) |
| **C. Interface & life (Nexus)** | Mặt tiếp xúc + sức khỏe/đời sống | `health-app/` · `health-data/` · `workout-data/` · `nexus-commands/` · sibling `opus-vita/` |
| **D. Shared layers + data** | Dùng chung + nguồn dữ liệu | `opus-fabrica/` · `SDD-toolkit/` · `html-kit/` · `user-profile/` · `ai/traces/` · `finance-data/` |

---

## 2. Bản đồ

```
                                   ┌─────────────────────────────┐
        người dùng  ──────────────▶│   PRIMUS (opus-animus core) │  điều phối, không tự thực thi
                                   │  animus_core + primus       │
                                   └───┬───────┬───────┬─────────┘
                  ┌────────────────────┘       │       └────────────────────┐
                  ▼                            ▼                            ▼
        ┌──────────────┐            ┌──────────────────┐          ┌──────────────────┐
        │  CONSILIUM   │            │  LOGOS · RECTOR  │          │   NEXUS (life)   │
        │ information  │            │ strategy · exec  │          │ health-app +     │
        │ wiki/intel   │            │ rank/arbiter/task│          │ health/workout + │
        └──────────────┘            └──────────────────┘          │ nexus-commands   │
                  │  Primus định tuyến tới vertical khi cần        └──────────────────┘
       ┌──────────┴───────────┬───────────────────────┐
       ▼                      ▼                       ▼
 ┌──────────┐          ┌──────────────┐        ┌──────────────┐
 │  ACTIO   │          │   LUCIDA     │        │    apps/     │
 │ tài chính │          │  content     │        │ jlpt · pmp   │
 │ US+JP đầu tư│        │ JLPT/video   │        │ (học)        │
 └──────────┘          └──────────────┘        └──────────────┘

 Shared: opus-fabrica (markitdown + agent dùng chung) · SDD-toolkit · html-kit
 Data planes: user-profile/ · ai/traces/ · health-data+workout-data · finance-data/personal-finance · opus-rector/proactive
```

---

## 3. Tầng A — Agent core (Primus)
Chi tiết: [`SA-opus-animus-v2.md`](SA-opus-animus-v2.md).

| Subsystem | Folder | Vai trò | Trạng thái |
|---|---|---|---|
| Primus orchestration | `animus_core/`, `primus/` | controller loop, traces, action registry, eval, router, daily brief | ✅ Built MVP |
| Consilium | `opus-consilium/` | information brain: collector, wiki, intel, FDE | ✅ Running |
| Logos | `opus-logos/` | strategy: rank, conflict arbiter, decision-log, tune | ✅ Built MVP |
| Rector | `opus-rector/` | execution: task pull, proactive store, signals | ✅ Built MVP |

Daily brief (pull + push) gom Rector (task) + Nexus (health) + Consilium (intel) → rank/arbitrate → đề xuất, suggestion-only.

---

## 4. Tầng B — Vertical workspaces

### 4.1 Opus Actio — tài chính / đầu tư  ⭐ (thêm vào SA lần này)
`opus-animus/opus-actio/` — *"actio: cổ phần / cổ phiếu"*. Workflow đầu tư cá nhân **chứng khoán Mỹ + Nhật** + wealth/tax.

```
opus-actio/
├── plugins/        ← Anthropic financial-services (vendored)
│   ├── equity-research/    earnings · thesis · screen · model-update · morning-note · sector · catalysts
│   ├── financial-analysis/ DCF · comps · 3-statement · audit-xls
│   └── wealth-management/  client-report · rebalance · TLH · financial-plan · proposal
├── skills/         ← custom JP (repo gốc thiếu)
│   ├── edinet-fetcher/     fetch filing EDINET (JP)
│   ├── jp-tax-account/     NISA / 特定口座 / iDeCo
│   └── jp-fiscal-calendar/ lịch tài khóa JP
├── data/           ← portfolio.schema.md + portfolio.example.json (+ finance.db, gitignored)
└── docs/, ai/status.md
```

**Surface người dùng** — slash skills `actio-*`: `morning` (US close + JP open brief), `portfolio`, `stock` (deep-dive 1 ticker), `tax`, `networth`, `spending`, `goals`, `ips`, `retire`, `review`, `house`.
**Data:** dữ liệu tài chính thật (Layer A) → `finance.db` (SQLite, gitignored); `finance-data/` + `personal-finance/` ở repo root.
**Disclaimer:** output là draft analyst work, **không** phải investment advice.
**Quan hệ với Primus:** Actio là vertical Primus có thể định tuyến tới (intent tài chính), và là nguồn cho daily brief mảng tiền (tương lai — chưa wire vào brief).

### 4.2 Opus Lucida — content / monetization
`opus-animus/opus-lucida/` — sản xuất nội dung (JLPT/video), workspace thương mại hóa (`Lucida` của v4). 🟡 Partial (pipeline + beta docs).

### 4.3 apps/ — ứng dụng học độc lập
`opus-animus/apps/`: `jlpt-n2-slides` (slide N2), `pmp-quiz` (đã retire — thi xong 2026-06).

---

## 5. Tầng C — Nexus (interface & life)
`Nexus` của v4 = mặt tiếp xúc + sức khỏe/đời sống. Hiện hiện thực rải ở repo root:

| Thành phần | Vai trò |
|---|---|
| `health-app/` | Dashboard sức khỏe (UI: dashboard.html, charts, roadmap) — chính là app "vita" |
| `health-data/{date}.json` | Log sức khỏe ngày (sleep, kcal/protein, steps, weight…) — **đã wire vào brief** qua `primus/vita.py` |
| `workout-data/{date}.json` | Log tập luyện (sessions, type, duration, streak) — đã wire vào brief |
| `nexus-commands/` | NL → Google Calendar/Tasks: commit JSON → GitHub Actions ghi calendar/task |
| sibling `opus-vita/` | Bản app health tách riêng (frontend/deploy) |

Primus đọc `health-data` + `workout-data` (read-only) để dựng "Bối cảnh hôm nay" trong brief.

---

## 6. Tầng D — Shared layers + data planes

| Thành phần | Vai trò |
|---|---|
| `opus-fabrica/` | Tầng agent/tool/skill **dùng chung** nhiều workspace (vd `markitdown-agent` convert file→md). Không chứa SoT business |
| `SDD-toolkit/` | Phương pháp SDD (RD/SD/BD templates, checklist, scaffold) |
| `html-kit/` | Bộ HTML/CSS/JS self-contained cho output (McKinsey-style) |
| `user-profile/` | goals / preferences / constraints (L8) — bias ranking + relevance toàn agent |
| `ai/traces/` | Run traces (L9) — eval/observability |
| `metagpt-ai-company/` | Thử nghiệm multi-agent (insighthub MVP) — tách biệt, không thuộc luồng Primus chính |

---

## 7. Build status (toàn ecosystem)

| Khối | Trạng thái |
|---|---|
| Primus core (eval/Logos/Rector/brief pull+push) | ✅ Built MVP (78 tests) |
| Consilium (collector/wiki/intel/FDE) | ✅ Running |
| Nexus health/workout → brief | ✅ Wired (`vita.py`); calendar qua nexus-commands |
| **Actio** (đầu tư US+JP, wealth, JP tax) | ✅ Vận hành qua skills; chưa wire vào daily brief |
| Lucida (content) | 🟡 Partial |
| apps (jlpt-n2-slides) | 🟡 Partial · pmp-quiz retired |
| Fabrica / SDD-toolkit / html-kit | ✅ Dùng chung |

---

## 8. Pointer tới doc từng project

- Agent core: [`SA-opus-animus-v2.md`](SA-opus-animus-v2.md), [`OPERATING-MODEL-OPUS-ANIMUS-v4.md`](OPERATING-MODEL-OPUS-ANIMUS-v4.md)
- Actio: `opus-actio/CLAUDE.md`, `opus-actio/USAGE.md`, `opus-actio/data/portfolio.schema.md`
- Lucida: `opus-lucida/docs/RD-beta-launch.md`, `SD-beta-architecture.md`
- Consilium: `opus-consilium/CLAUDE.md`
- Nexus: `health-app/roadmap.md`, `nexus-commands/README.md`

---

*Opus Ecosystem — SA v1.0 | 2026-06-24*
