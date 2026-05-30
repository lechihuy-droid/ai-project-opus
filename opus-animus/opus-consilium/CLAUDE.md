# Opus Consilium

## Latest Map - Content Collector / Home Intel (2026-05-18)

Content Collector là **AI Market Intel input layer** cho Opus Home. LLM synthesis (Claude CLI) tự động sinh daily brief + weekly report. FDE research tab theo dõi Forward Deployed Engineer model adoption.

```
DAILY (05:30 JST) — Task Scheduler
collect_sources (config.yaml)
        |
        v
run_collect.py
        |
        v
tools/collect_tool.py
  fetch_all_sources()
  dedupe_articles()
  goal_align_filter()    # Claude CLI score 1-5 + Vietnamese relevance note (batch 20)
  save_raw_articles()
  daily_synthesis()      # Claude CLI via subprocess stdin → JSON report
        |
        v
raw/articles/YYYY-MM-DD-{slug}.md          ← immutable sources
logs/intel_reviews/YYYY-MM-DD.json         ← daily Claude synthesis
        |
        v
wiki_ops/ingest.py                         # gated by audit-research
        |
        v
personal-wiki/                             ← compounding brain
        |
        v
api/data.py:list_articles()
        |
        v
api/intel.py
  /api/intel/simple       ← daily brief (llm_review từ intel_reviews/)
  /api/intel/report       ← article-level report
  /api/intel/github-repos ← trending repos
  /api/intel/weekly       ← weekly synthesis (logs/weekly/YYYY-Www.json)
  /api/intel/fde          ← FDE concepts + actors + articles
  /api/intel/fde/news     ← daily news tagged by actor group (8 groups)
        |
        v
dashboard/index.html
  Sidebar: Intel | FDE | Reading | ...
  Intel tab → SimpleIntelView
    sub-tab: Market   ← daily Claude brief
    sub-tab: Weekly   ← weekly synthesis report
    sub-tab: GitHub   ← trending repos
  FDE tab → FDEView
    sub-tab: Daily News    ← FDE model adoption news, filter by actor
    sub-tab: Key Concepts  ← Delta/Echo, Bootcamp, Ontology, AI FDE...
    sub-tab: Adoption Map  ← Palantir → OpenAI → Anthropic → SIer
    sub-tab: FDE Articles  ← raw articles filtered by FDE keywords
    sub-tab: Research Queue← priority reading list

WEEKLY (Chủ nhật 06:00 JST) — Task Scheduler
run_weekly.py
  load_week_articles()   # đọc raw/articles/ 7 ngày qua
  group_by_topic()       # AI / competitor / market / other
  weekly_synthesis()     # Claude CLI → logs/weekly/YYYY-Www.json
  send_telegram()        # optional notify
```

Current operating rule:
- `collect.auto_ingest: false` — collect ghi `raw/articles/`; wiki ingest đi qua `run_wiki.py audit-research`.
- **All LLM calls dùng Claude CLI** (`claude.cmd -p`) qua subprocess stdin — không cần API key:
  - `goal_align_filter()` — score + Vietnamese relevance note (batch 20)
  - `daily_synthesis()` — daily brief JSON
  - `weekly_synthesis()` — weekly report JSON (Task Scheduler `opus-weekly-research`, Chủ nhật 06:00 JST)
  - `intent_classifier._llm_classify()` — Telegram intent fallback
  - `wiki_ops/ingest.py` — compile source → wiki page JSON
  - `wiki_ops/query.py` — find pages (array) + synthesize answer
  - `wiki_ops/reflect.py` — weekly reflection text
  - `wiki_ops/context_compressor.py` — compress long sources trước ingest
  - `wiki_ops/skill_curator.py` — merge/archive overlapping skills
  - `wiki_ops/telegram_handler.py:_run_consilium_brief()` — decision brief
  - `run_daily.py:write_brief()` — morning brief text
  - `tools/research_radar_tool.py:round2_llm_score()` — batch score GitHub/arXiv items
- Helper: `utils/llm.py` — `claude_cli(prompt, timeout)` và `claude_cli_json(prompt, timeout, expect)` — reusable cho mọi LLM call.
- Trade-off: Claude CLI có ~30-60s startup overhead → goal_filter 100 articles mất 5-8 phút. Chấp nhận để có chất lượng note + zero external API dependency.
- **Groq đã bị remove hoàn toàn** khỏi tất cả file trừ `crews/` (CrewAI legacy, chạy tay).
- Voice transcription (Groq Whisper) đã bị xóa khỏi `telegram_handler.py` — bot chỉ nhận text message.
- Home Intel là primary review UI. Telegram chỉ notify, không hiển thị nội dung đầy đủ.
- `logs/intel_state.json` stores used/unused status for Intel items.
- FDE news feed tự cập nhật hàng ngày khi collect chạy — không cần config thêm.

Run command:

```bash
cd "C:/Users/HUY/workspace/ai-workspace/opus-animus/opus-consilium"
python run_collect.py              # daily collect + synthesis + wiki ingest
python run_weekly.py               # weekly synthesis (thường qua Task Scheduler)
python run_weekly.py --dry-run     # preview, no save
python run_dashboard.py            # Opus Home dashboard (localhost:8765)
```

**"Telegram là UI. LLM là operator. Wiki là brain."** — Karpathy LLM Wiki pattern

Consilium là bộ não trung tâm của Opus Animus. Mọi input compile vào wiki. Mọi output query từ wiki.
Chạy Windows Task Scheduler, không cần 24/7. LLM synthesis = Claude CLI (không cần API key riêng).

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
cd "C:/Users/HUY/workspace/ai-workspace/opus-animus/opus-consilium"

python run_research.py AI          # Module A — research + Telegraph
python run_daily.py                # Module B — daily brief → Telegram
python run_wiki.py ingest <url>    # Module C — ingest URL vào wiki
python run_wiki.py query "<câu>"   # Module C — query wiki
python run_wiki.py lint            # Module C — weekly lint
python run_wiki.py poll            # Module C — poll Telegram (Task Scheduler)
```

## Stack

- LLM (all filter + synthesis): Claude CLI (`claude.cmd -p`) via subprocess stdin — session auth, không cần API key
  - Helper: `utils/llm.py` — `claude_cli()` + `claude_cli_json()` — dùng cho toàn bộ project
  - **Zero Groq dependency** — tất cả wiki_ops, collect, daily, weekly, radar đều dùng Claude CLI
- Telegram: direct requests Bot API — TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (text only, no voice)
- Telegraph: direct requests api.telegra.ph — token lưu `.telegraph_token`
- PDF/HTML: markitdown library
- CrewAI: **legacy chỉ trong `crews/` + `tools/*.py` (BaseTool base class)** — Module A manual trigger, không chạy tự động. Tools (rss, search, yfinance, telegraph, wiki) dùng `BaseTool` nhưng hoạt động độc lập.
- Dashboard: FastAPI + React (CDN) — localhost:8765

## Cấu Trúc

```
opus-consilium/
├── run_research.py      ← Module A: research → raw/research/ → wiki → Telegraph
├── run_daily.py         ← Module B: query wiki → daily brief → Telegram
├── run_wiki.py          ← Module C: ingest / query / lint / poll
├── run_collect.py       ← Content Collector: batch RSS → raw/ → synthesis → wiki
├── run_weekly.py        ← Weekly Synthesizer: 7-day articles → Claude → logs/weekly/
├── run_dashboard.py     ← Opus Home: FastAPI server (localhost:8765)
├── run_radar.py         ← Research Radar: GitHub + arXiv → wiki → Telegram
├── config.yaml          ← sources config (auto_ingest: false; audit-gated)
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
**Vai trò:** AUTO-WRITER. Batch RSS → raw/articles/ → Claude synthesis → wiki (daily 05:30).
- `daily_synthesis()` gọi Claude CLI → `logs/intel_reviews/YYYY-MM-DD.json`
- `auto_ingest: false` — wiki ingest được gate bằng `run_wiki.py audit-research`
- Telegram: reading list notification, nội dung đầy đủ xem trên Opus Home

### Weekly Synthesizer — Auto Writer ✅ Running
**Vai trò:** Tổng hợp 7 ngày articles → Claude → strategic report.
- `run_weekly.py` — chạy Chủ nhật 06:00 JST (Task Scheduler: `opus-weekly-research`)
- Output: `logs/weekly/YYYY-Www.json` — 5 sections: tóm tắt / top5 / signals / actors / action plan
- API: `/api/intel/weekly` — dashboard hiển thị sub-tab Weekly trong Intel tab

### FDE Research Tab — Dashboard Module ✅ Running
**Vai trò:** Research hub theo dõi Forward Deployed Engineer model adoption.
- API: `/api/intel/fde` — concepts, actors, articles
- API: `/api/intel/fde/news` — daily news tagged by 8 actor groups (filter: Palantir, OpenAI, Anthropic, Microsoft, Google, Consulting+AI, SIer Japan, FDE Model)
- Dashboard: sidebar tab "FDE" → 5 sub-tabs: Daily News / Key Concepts / Adoption Map / FDE Articles / Research Queue
- News feed tự update mỗi ngày khi collect chạy — không cần config thêm

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
| Daily+Weekly Synthesis | CLAUDE.md Latest Map (2026-05-18) | ✅ Implemented |
| FDE Research Tab | CLAUDE.md Latest Map (2026-05-18) | ✅ Implemented |
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
