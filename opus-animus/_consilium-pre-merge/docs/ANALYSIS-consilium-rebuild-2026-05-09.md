# Consilium Rebuild — Analysis & Proposed Architecture
**Date:** 2026-05-09

## 2026-05-14 Implementation Note

This is now a historical analysis. Phase 1 was implemented with a slightly different product shape than proposed here.

Implemented:
- Content Collector now has an LLM goal filter in `tools/collect_tool.py`.
- `config.yaml` now prioritizes AI market moves, AI-SDLC, GitHub tools, enterprise adoption, governance, and workflow automation.
- Collector writes `Goal-Score` and `Relevance` into `raw/articles/`.
- Opus Home has an `Intel` tab backed by `api/intel.py`.
- The current user review loop is dashboard-first, not Telegram-first.

Not implemented / intentionally deferred:
- Automatic wiki promotion is disabled by `collect.auto_ingest: false`.
- Digest engine is deterministic API enrichment in `api/intel.py`, not a Claude subagent.
- Business Knowledge and LLM daily reviews are optional sidecar JSON files under `logs/`.

Active map: `docs/SD-home-intel-collector-map.md`.
**Status:** Design phase — pending confirmation
**Session context:** Phân tích toàn diện trước khi rebuild

---

## 1. Mục Tiêu Tối Thượng (từ North Star)

Opus Animus không phải RSS reader. Nó là **vòng lặp chuyển hóa tri thức → con người**:

```
INPUT → PROCESS → STORE → REFLECT → CONNECT → INSIGHT → APPLY → OUTPUT → FEEDBACK
```

**Hiện tại chỉ có:** `INPUT → STORE → QUERY` — 1/3 vòng lặp.

---

## 2. As-Is Diagram — Thực Trạng

```
╔══════════════════════════════════════════════════════════════════╗
║                    INFORMATION SOURCES                           ║
║                                                                  ║
║  RSS feeds        Web search       File drop       Telegram      ║
║  (8 sources)      (DuckDuckGo)     (raw/inbox/)    (/wiki url)   ║
╚═══════╤══════════════╤═════════════════╤═══════════════╤═════════╝
        │              │                 │               │
        ▼              ▼                 ▼               ▼
╔═══════════════╗  ╔══════════╗   ╔══════════════╗  ╔══════════╗
║ Content       ║  ║ Module A ║   ║ markitdown   ║  ║ Module C ║
║ Collector     ║  ║ Research ║   ║ agent        ║  ║ Wiki     ║
║ (auto 05:30)  ║  ║ (MANUAL) ║   ║ (auto)       ║  ║ (auto)   ║
╚═══════╤═══════╝  ╚════╤═════╝   ╚══════╤═══════╝  ╚════╤═════╝
        │               │                │               │
        ▼               ▼                ▼               │
   raw/articles/   wiki/ ←──── ❌    raw/articles/       │
        │          (EPHEMERAL)     papers/ notes/         │
        │               │                │               │
        │               ▼                ▼               │
        │          Telegraph        raw/ folder ──────────┘
        │          (publish)             │               │
        │               │               ▼               ▼
        │               ▼         personal-wiki/    personal-wiki/
        │          Module B            (brain)          (brain)
        │          Daily Brief             │
        │          (MANUAL) ←── ❌         │
        │               │    reads         │
        │               │  ephemeral       │
        └───────────────┼──────────────────┘
                        ▼
                    Telegram
                   (output only)
```

### 3 điểm gãy chính

| # | Điểm gãy | Hệ quả |
|---|---|---|
| ❌1 | Module A → `wiki/` ephemeral | Knowledge mất sau mỗi run |
| ❌2 | Module B đọc ephemeral, không query real wiki | Brief không compound |
| ❌3 | Content Collector collect 38 articles/ngày, không filter | Không đọc được, không có giá trị |

### Vấn đề căn bản

**38 articles/ngày mà budget chỉ 2-30 phút = không đọc được gì = 0 giá trị.**
Hệ thống đang collect cho cảm giác productive, không phải để học.

---

## 3. Phân Tích Module

| Module | Vai trò thiết kế | Thực trạng | Vấn đề |
|---|---|---|---|
| **Module A** ResearchCrew | Deep research → wiki → publish | 🟡 Manual | Output ephemeral, knowledge mất |
| **Module B** Daily Brief | Query wiki → Telegram | 🟡 Manual | Đọc ephemeral, không compound |
| **Module C** Wiki Agent | Ingest/query/lint/poll | ✅ Running | Thiếu input từ A và B |
| **Content Collector** | Batch RSS → raw/ → wiki | ✅ Running | Volume quá cao, không filtered |
| **Research Radar** | GitHub + arXiv → wiki | ⬜ Chưa xong | Deprioritize |

### Mapping với GOALS

```
GOALS.md — 4 tracks:
  PMP         → apps/pmp-quiz (OK, riêng biệt)
  Tài chính   → Module A JP_STOCK → ephemeral → LOST ❌
  Sự nghiệp   → Module A AI research → ephemeral → LOST ❌
  Sức khỏe    → không có module nào ❌
```

---

## 4. User Constraints (đã confirm)

| Constraint | Giá trị |
|---|---|
| Input priority | External automated (RSS/web) |
| L3 Product | Pending — tập trung skill trước |
| Goal chính | AI Engineering → Presales / Forward Deployed Engineer |
| Time budget | 2-30 phút/ngày để đọc |
| Volume target | ~5 items/ngày max (thay vì 38) |

---

## 5. Proposed Architecture — Collect Layer

```
╔══════════════════════════════════════════════════════════════════════╗
║                    GOAL FILTER (anchor)                              ║
║         "Tôi đang build AI Engineering skill"                        ║
║         Primary: AI/LLM/Agents | Secondary: Finance/Investing        ║
╚═════════════════════════════╤════════════════════════════════════════╝
                              │ tất cả sources phải qua filter này
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   TIER 1 — Primary     TIER 2 — Curator    TIER 3 — On-demand
   (daily, auto)        (weekly, auto)      (manual trigger)
   ─────────────────    ─────────────────   ─────────────────
   Anthropic blog       The Batch           Claude research
   OpenAI blog          (Andrew Ng)         khi hỏi về X
   arXiv cs.AI top 3    Import.ai
   Papers w/ Code       (Jack Clark)        Telegram forward
   trending             Interconnects       bài hay gặp
                        (Nathan Lambert)
                        Simon Willison

   ~3 items/ngày        ~5 items/tuần       khi cần
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                              ▼
              ╔═══════════════════════════════╗
              ║     LLM FILTER + SCORE        ║
              ║  "Cái này có giúp tôi build   ║
              ║   AI Engineering skill không?" ║
              ║                               ║
              ║  Score 1-5:                   ║
              ║  5 = actionable, apply được   ║
              ║  3 = good to know             ║
              ║  1 = noise → DROP             ║
              ╚═══════════════╤═══════════════╝
                              │ chỉ giữ score ≥ 3
                              ▼
                    ┌─────────────────────┐
                    │   raw/ (immutable)  │
                    │   ~5 items/ngày max │
                    └──────────┬──────────┘
                               │
                               ▼
                    ╔══════════════════════╗
                    ║   DIGEST ENGINE      ║
                    ║  (Claude subagent)   ║
                    ║                      ║
                    ║  Input: raw item     ║
                    ║  Output:             ║
                    ║  - 3 key insights    ║
                    ║  - 1 thing to try    ║
                    ║  - links to wiki     ║
                    ╚══════════╤═══════════╝
                               │
                               ▼
                    ╔══════════════════════╗
                    ║   personal-wiki/     ║
                    ║   (compound brain)   ║
                    ║                      ║
                    ║  knowledge grows     ║
                    ║  mỗi ngày            ║
                    ╚══════════╤═══════════╝
                               │
                               ▼
              ╔════════════════════════════════╗
              ║     MORNING BRIEF (Telegram)   ║
              ║     2-5 phút đọc               ║
              ║                                ║
              ║  "Hôm nay 3 điều quan trọng:"  ║
              ║  1. [insight] → apply: [how]   ║
              ║  2. [insight] → apply: [how]   ║
              ║  3. [insight] → apply: [how]   ║
              ║                                ║
              ║  + 1 câu hỏi để suy ngẫm       ║
              ╚════════════════════════════════╝
```

---

## 6. Before/After

| | Hiện tại | Sau rebuild |
|---|---|---|
| Volume | ~38 articles/ngày | ~5 items/ngày |
| Filter | Không có | Goal-aligned LLM score ≥ 3 |
| Sources | RSS tổng hợp, mixed quality | Tier 1 primary + Tier 2 curator |
| Output | Dump ra Telegram | 3 insights + 1 action |
| Time cần | Không đọc được | 2-5 phút/ngày |
| Knowledge | Mất sau mỗi run | Vào wiki, compound mỗi ngày |

---

## 7. Sources Cần Verify

| Source | Tier | Status |
|---|---|---|
| Anthropic blog | 1 | Cần verify RSS URL |
| OpenAI blog | 1 | Cần verify RSS URL |
| arXiv cs.AI top 3 | 1 | ✅ có API |
| Papers with Code trending | 1 | Cần verify |
| The Batch (Andrew Ng) | 2 | Cần verify RSS URL |
| Import.ai (Jack Clark) | 2 | Cần verify RSS URL |
| Interconnects (Nathan Lambert) | 2 | ✅ đang có |
| Simon Willison | 2 | ✅ đang có |

---

## 8. Broken Loops Cần Fix (sau collect layer)

| Loop | Fix |
|---|---|
| [CONS-2] Module A → wiki | Save to raw/research/ + gọi wiki ingest trước publish |
| [CONS-3] Module B → real wiki | Dùng wiki query thay vì đọc ephemeral wiki/ folder |
| [NS-3] Reflection layer | consilium-reflector weekly → reflection-YYYY-WW.md |

---

## 9. Proposed Subagents

```
~/.claude/agents/
├── consilium-researcher.md  → topic → web research → raw/research/ → wiki ingest
├── consilium-briefer.md     → query wiki → compose morning brief (3 insights + 1 action)
└── consilium-reflector.md   → scan wiki tuần này → weekly reflection note
```

Module C (ingest/lint/poll) giữ nguyên Python + Groq — deterministic, token-heavy, cần free tier.

---

## 10. Build Sequence

```
Phase 1 — Fix collect layer (session này):
  [ ] Confirm proposed architecture
  [ ] Verify RSS URLs sources mới
  [ ] Rebuild config.yaml: Tier 1 + Tier 2, remove low-quality sources
  [ ] Add LLM filter + score vào Content Collector

Phase 2 — Fix broken loops:
  [ ] [CONS-2] Module A → raw/research/ → wiki ingest
  [ ] [CONS-3] Module B → query real wiki

Phase 3 — Subagents:
  [ ] consilium-researcher.md
  [ ] consilium-briefer.md
  [ ] consilium-reflector.md

Phase 4 — Reflection layer:
  [ ] [NS-3] Weekly synthesis → personal-wiki/Personal/reflection-YYYY-WW.md
```

---

*Analysis by Claude Sonnet 4.6 | Session 2026-05-09*
*Ref: CONS-REBUILD trong TODO.md*
