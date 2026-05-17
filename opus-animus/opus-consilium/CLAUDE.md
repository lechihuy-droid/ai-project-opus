# Opus Consilium

## Latest Map - Content Collector / Home Intel (2026-05-14)

Content Collector hien tai la **AI Market Intel input layer** cho Opus Home, khong con chi la RSS -> wiki ingest.

```
collect_sources (config.yaml)
        |
        v
run_collect.py
        |
        v
tools/collect_tool.py
  fetch_all_sources()
  dedupe_articles()
  goal_align_filter()  # Groq score 1-5 + Vietnamese relevance note
  save_raw_articles()
        |
        v
raw/articles/YYYY-MM-DD-{slug}.md
  Source / URL / Topic / Tier / Source-Kind / Goal-Score / Relevance
        |
        v
api/data.py:list_articles()
        |
        v
api/intel.py
  /api/intel/simple
  /api/intel/report
  /api/intel/github-repos
        |
        v
dashboard/index.html
  Sidebar tab: Intel
  SimpleIntelView -> Market + GitHub Repos
```

Current operating rule:
- `collect.auto_ingest: false`; collect writes `raw/articles/`, but does not auto-write `personal-wiki/`.
- Home Intel is derived from raw article metadata, especially `Source-Kind`, `Goal-Score`, and `Relevance`.
- `logs/intel_state.json` stores used/unused status for Intel items.
- `logs/business_briefs/YYYY-MM-DD.json` optionally feeds the Business Knowledge block.
- Telegram notification remains supported by `run_collect.py`, but the primary review UI is now Opus Home.

Run command:

```bash
cd "C:/Users/HUY/AI/opus-animus/opus-consilium"
C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe run_collect.py
```

**"Telegram là UI. LLM là operator. Wiki là brain."** — Karpathy LLM Wiki pattern

Consilium là bộ não trung tâm của Opus Animus. Mọi input compile vào wiki. Mọi output query từ wiki.
Chạy Windows Task Scheduler, không cần 24/7, LLM = Groq free tier.

## Kiến Trúc (Karpathy-aligned)

```
INPUTS → raw/ (immutable) → personal-wiki/ (compounding brain)
├── Content Collector    → raw/articles/  → wiki ingest  ✅ running
├── Module A research    → raw/research/  → wiki ingest  ⬜ cần thêm
├── Research Radar       → raw/articles/  → wiki ingest  ⬜ chưa xong
└── markitdown-agent     → raw/inbox/     → wiki ingest  ✅ running

BRAIN = personal-wiki/ (Module C owns this)
├── Ingest: source → 10-15 pages updated, cross-refs maintained
├── Query:  question → wiki answer (filed back as new page nếu có giá trị)
└── Lint:   weekly → fix orphans, contradictions, gaps

OUTPUTS ← query wiki, không đọc raw
├── Module A  → wiki context → Telegraph article → Telegram
├── Module B  → wiki query  → daily brief       → Telegram
└── Research Radar → wiki + GitHub/arXiv → weekly report → Telegram
```

## Chạy

```bash
cd "C:/Users/HUY/AI/OPUS ANIMUS/opus-consilium"

python run_research.py AI          # Module A — research + Telegraph
python run_daily.py                # Module B — daily brief → Telegram
python run_wiki.py ingest <url>    # Module C — ingest URL vào wiki
python run_wiki.py query "<câu>"   # Module C — query wiki
python run_wiki.py lint            # Module C — weekly lint
python run_wiki.py poll            # Module C — poll Telegram (Task Scheduler)
```

## Stack

- LLM: Groq direct SDK (`llama-3.3-70b-versatile`) — GROQ_API_KEY trong .env
- Telegram: direct requests Bot API — TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
- Telegraph: direct requests api.telegra.ph — token lưu `.telegraph_token`
- PDF/HTML: markitdown library
- CrewAI: chỉ dùng trong Module A

## Cấu Trúc

```
opus-consilium/
├── run_research.py      ← Module A: research → raw/research/ → wiki → Telegraph
├── run_daily.py         ← Module B: query wiki → daily brief → Telegram
├── run_wiki.py          ← Module C: ingest / query / lint / poll
├── run_collect.py       ← Content Collector: batch RSS → raw/ → wiki
├── run_radar.py         ← Research Radar: GitHub + arXiv → wiki → Telegram
├── config.yaml          ← sources config
├── crews/               ← ResearchCrew (Module A)
├── tools/               ← rss, search, yfinance, telegraph, wiki, markitdown, research_radar_tool
├── wiki_ops/            ← ingest, query, lint, telegram_handler
├── utils/               ← config loader, telegram sender
├── personal-wiki/       ← THE BRAIN — đừng xóa, đừng sửa tay
│   ├── SCHEMA.md        ← editorial constitution (LLM reads this first)
│   ├── INDEX.md         ← catalog mọi page + 1-line summary
│   ├── log.md           ← append-only timeline (ingest/query/lint events)
│   └── AI/ Stock/ Tech/ Personal/
├── raw/                 ← immutable sources — đừng sửa
│   ├── articles/        ← RSS, web clips, research output
│   ├── research/        ← Module A deep research (NEW)
│   ├── papers/
│   ├── notes/
│   └── inbox/           ← markitdown-agent drop zone
└── docs/                ← SDD documentation
```

## Vai Trò Module (Karpathy-aligned)

### Module C — The Brain ✅ Running
**Vai trò:** PRIMARY. Owns personal-wiki/. Mọi pipeline khác feed vào đây.
- Karpathy pattern: raw/ (immutable) → personal-wiki/ (LLM-maintained, compounding)
- Operations: `ingest` (source → update 10-15 pages) | `query` | `lint` | `poll`
- Task Scheduler: `wiki-poll` (5 min), `wiki-lint-weekly` (Chủ nhật 06:00) ✅ fixed
- **Rule:** Chỉ Module C được ghi vào personal-wiki/. Không có ngoại lệ.

### Module A — Researcher + Wiki Writer 🟡 Manual
**Vai trò:** WRITER. Deep research → compile vào wiki → publish Telegraph.
- Topics: AI, JP_STOCK (config.yaml)
- Flow hiện tại: RSS → CrewAI research → `wiki/` folder (ephemeral) → Telegraph → Telegram
- Flow mục tiêu: RSS → CrewAI research → `raw/research/` → wiki ingest → Telegraph → Telegram
- **Gap:** research output chưa vào wiki → knowledge mất sau mỗi run ⚠️
- **Fix cần làm:** Sau research, gọi `run_wiki.py ingest raw/research/<file>` trước khi publish

### Module B — Wiki Reader + Broadcaster 🟡 Manual
**Vai trò:** READER. Query wiki → synthesize → Telegram. Không tạo knowledge mới.
- Flow hiện tại: đọc `wiki/` folder của Module A → tổng hợp → Telegram
- Flow mục tiêu: query `personal-wiki/` → daily brief → Telegram
- **Gap:** đọc output ephemeral của A, không query wiki thật → brief không compound ⚠️
- **Fix cần làm:** `run_daily.py` gọi `wiki query "tóm tắt AI và stock hôm nay"` thay vì đọc wiki/

### Content Collector — Auto Writer ✅ Running
**Vai trò:** AUTO-WRITER. Batch RSS → raw/articles/ → wiki (daily 05:30).
- Đúng pattern. Giữ nguyên.

### Research Radar — Auto Writer + Reader ⬜ In Progress
**Vai trò:** Fetch GitHub trending + arXiv → raw/ → wiki → weekly Telegram report.
- `tools/research_radar_tool.py` ✅ | `run_radar.py` ⬜ chưa xong

### Issues Đang Open
- ArXiv RSS bị block — disable trong config.yaml
- `the-batch` feed URL hỏng — disable trong config.yaml
- Module A research output không vào wiki (gap chính)
- Module B không query wiki thật (đọc ephemeral folder)

### Restructuring Gaps (cần RD/BD)
| Gap | Module | Fix |
|---|---|---|
| Research không vào wiki | A | Save to raw/research/ + gọi wiki ingest |
| Brief không query wiki | B | Dùng wiki query thay vì đọc wiki/ folder |
| wiki/ folder ephemeral | A/B | Deprecate sau khi A fix xong |

## SDD Docs

| Doc | Path | Status |
|---|---|---|
| Central Inbox | `docs/SD-central-inbox-routing.md` | Active |
| Naming | `docs/SD-opus-consilium-naming.md` | Active |
| Requirements | `docs/RD-requirements.md` | ✅ Done |
| System Design | `docs/SD-system-design.md` | ✅ Done |
| Interface Contract | `docs/SD-interface-contract.md` | ✅ Done |
| Home Intel Collector Map | `docs/SD-home-intel-collector-map.md` | Active |
| Module C Build Plan | `docs/BD-module-c-build-plan.md` | ✅ Done |
| Content Collector RD | `docs/RD-content-collector.md` | Implemented / historical with latest map |
| Backlog | `docs/BACKLOG.md` | ✅ Active |

## Quy Ước Code

- Views/handlers nhận data + callback — không gọi storage trực tiếp
- Tool classes kế thừa `BaseTool` (CrewAI) cho Module A, plain functions cho Module B/C
- Không hardcode path — dùng `utils/config.py` helpers
- `_save_raw_*()` functions trong tools là side effect hook để save vào raw/ trước khi ingest
- **Karpathy rule:** Chỉ wiki_ops/ingest.py được ghi vào personal-wiki/. Module A/B chỉ read.
- **Compounding rule:** Mọi knowledge có giá trị lâu dài phải vào wiki. Ephemeral output chỉ là delivery.

## Convention Giao Tiếp

- Response ngắn gọn, tiếng Việt
- Hỏi xác nhận trước khi sửa config.yaml hoặc thêm Task Scheduler
- Exploratory questions → 2-3 câu recommendation, không implement ngay
