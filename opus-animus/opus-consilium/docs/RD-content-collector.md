# RD — Content Collector Batch
## 2026-05-14 Latest Map - Collector Feeds Opus Home Intel

Status: implemented / supersedes the older Telegram-first + wiki-ingest design below.

This RD started as a Telegram reading-list + wiki-ingest design. The implemented latest version is different:

- `run_collect.py` is now the ingestion job for **AI Market Intel on Opus Home**.
- `collect.auto_ingest` is currently `false`; collector saves raw article files but does not automatically modify `personal-wiki/`.
- The LLM is used inside `goal_align_filter()` to score and annotate articles for the user's daily AI market radar.
- The web dashboard reads raw article metadata through `api/data.py` and builds Intel views through `api/intel.py`.
- Telegram reading list is still supported, but the primary user-facing UI is the Home dashboard `Intel` tab.

Latest flow:

```
config.yaml:collect_sources
        |
        v
run_collect.py
        |
        v
tools/collect_tool.py
  fetch_all_sources()
  dedupe_articles()
  goal_align_filter()
  save_raw_articles()
        |
        v
raw/articles/YYYY-MM-DD-{slug}.md
  Source / URL / Published / Topic / Tier
  Source-Kind / Goal-Score / Relevance
        |
        v
api/data.py:list_articles()
        |
        v
api/intel.py
  /api/intel/simple
  /api/intel/report
  /api/intel/github-repos
  /api/intel/articles/{slug}/mark-used
        |
        v
dashboard/index.html
  SimpleIntelView
  Market tab
  GitHub Repos tab
```

Current source strategy:
- Tier 0 official market moves: OpenAI, Anthropic, Microsoft, Azure, Google AI, AWS ML, NVIDIA.
- Tier 1/2 curated AI sources: TechCrunch AI, VentureBeat AI, Simon Willison, HuggingFace, Import AI, Interconnects, The Gradient.
- Research sources are demoted unless practically relevant: arXiv, HF papers.
- GitHub Trending is both collected into raw articles and fetched live by `/api/intel/github-repos` when the current week is requested.
- Competitor Intel sources are present in config for JP IT media, analyst feeds, and strategic AI-SDLC signals.

Current ranking/filtering:
- Config keyword filters reduce obvious noise before LLM scoring.
- `goal_align_filter()` uses Groq to assign `Goal-Score` 1-5 and `Relevance`.
- `score_article()` boosts hot market sources and product/platform moves, and penalizes generic research noise.
- `api/intel.py` adds dashboard-only categories, signals, actor map, business impact, recommended actions, confidence, and used/unused status.

Files that own the current behavior:
- `config.yaml`
- `run_collect.py`
- `tools/collect_tool.py`
- `api/data.py`
- `api/intel.py`
- `dashboard/index.html`
- `logs/intel_state.json`
- `logs/business_briefs/YYYY-MM-DD.json`

---

**Date:** 2026-04-28
**Status:** 🔵 Design — chờ review trước khi build
**Phụ thuộc:** Module C (wiki agent) ✅ Done

---

## 0. Vấn Đề Cần Giải Quyết

Module A (ResearchCrew) hiện tại:
- Fetch RSS → LLM synthesize → Telegraph publish (ephemeral, 48h window)
- Side effect: `_save_raw_article()` lưu vào `raw/articles/`

**Hai gap hiện tại:**
1. **Input quality thấp** — ArXiv blocked, HuggingFace/OpenAI ít bài mới, thiếu nguồn papers + deep-dive
2. **Không có reading list** — user không biết hôm nay có bài nào đáng đọc, phải mở Telegraph mới thấy tóm tắt

Content Collector giải quyết cả hai: mở rộng sources chất lượng cao + gửi reading list mỗi sáng.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 Hành Vi Hàng Ngày

```
5:30 sáng — user nhận Telegram:

📚 Reading List — 2026-04-28  ·  18 bài mới

1. [HF Papers] Scaling LLM Reasoning with Process Rewards
   paperswithcode.com/paper/...  ·  ★★★  agent + benchmark + code

2. [Simon Willison] Notes on using Claude for data analysis
   simonwillison.net/...  ·  ★★★  practical + llm

3. [Interconnects] Why RLHF still matters in 2026
   interconnects.ai/...  ·  ★★☆  rlhf + alignment

4. [Nikkei Asia] BOJ signals rate hold amid tariff uncertainty  
   asia.nikkei.com/...  ·  ★★☆  boj + japan

5. [ArXiv CL] GRPO vs PPO — empirical comparison
   arxiv.org/abs/...  ·  ★★☆  rlhf + training

Wiki: +4 pages  ·  /wiki ask <câu hỏi> để query
```

User có thể:
- Đọc bài nào quan tâm trực tiếp từ link
- `/wiki ask "what do I know about RLHF?"` để xem wiki đã có gì
- Không làm gì — raw articles vẫn được lưu và reading list vẫn được gửi. Wiki ingest tự động hiện đang tắt bằng `collect.auto_ingest: false` cho đến khi concept-first update workflow được review xong.

### 1.2 Trigger Thủ Công (khi cần)

```bash
python run_collect.py            # chạy full pipeline
python run_collect.py --dry-run  # fetch + rank nhưng không save, không gửi Telegram
python run_collect.py --no-ingest  # chỉ collect + notify, skip wiki ingest
```

### 1.3 Người Dùng Không Thấy / Không Cần Làm

- Không cần chọn bài để ingest — tất cả tự động vào `raw/`
- Không cần mở giao diện nào — Telegram là UI duy nhất
- Không cần review wiki output — chỉ đọc khi cần query

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-C01 | Fetch từ danh sách sources trong `config.yaml` section `collect_sources` | P0 |
| FR-C02 | Deduplicate: bỏ qua article đã có slug trong `raw/articles/` | P0 |
| FR-C03 | Lưu mỗi article thành file `raw/articles/YYYY-MM-DD-{slug}.md` | P0 |
| FR-C04 | Gọi `wiki_ops/ingest.py` để ingest tất cả file raw mới (batch mode) | P0 |
| FR-C05 | Rank top 5 articles bằng heuristic scoring (không dùng LLM) | P0 |
| FR-C06 | Gửi reading list lên Telegram 1 message duy nhất | P0 |
| FR-C07 | Support `--dry-run` flag: fetch + rank, không write file, không gửi Telegram | P1 |
| FR-C08 | Support `--no-ingest` flag: collect + notify, không chạy wiki ingest | P1 |
| FR-C09 | Papers sources (ArXiv, HF Papers): window 7 ngày thay vì 48h | P1 |
| FR-C10 | Log số articles fetched / saved / skipped / ingested | P1 |
| FR-C11 | Nếu fetch source lỗi: skip source đó, tiếp tục, không crash toàn batch | P0 |
| FR-C12 | Nếu Telegram gửi lỗi: log warning, không crash | P1 |

### Không trong scope (explicit exclusions)

- Không dùng LLM để rank hoặc tóm tắt trong collect pipeline
- Không replace Module A / ResearchCrew — hai pipeline độc lập, cùng write vào `raw/`
- Không filter theo user preference (chủ đề yêu thích) — để sau nếu cần
- Không download full HTML/PDF trong bước này (đó là OPT-2 riêng)

---

## 3. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Chạy xong trong < 2 phút (không có LLM call trong collect pipeline) |
| NFR-02 | Không làm chậm Module A — chạy trước 30 phút (05:30 vs 06:00) |
| NFR-03 | Idempotent: chạy nhiều lần trong ngày không tạo duplicate |
| NFR-04 | Groq tokens: 0 trong collect pipeline; wiki ingest dùng Groq bình thường |
| NFR-05 | Semantic Scholar API: cache response 24h vào `raw/` — không gọi lại trong ngày |

---

## 4. Source List & Config Design

### 4.1 Danh Sách Sources

Sources chia 3 tier theo signal quality:

**Tier 1 — High signal (practical, curated)**

| ID | Source | URL | Type | Topic | Window |
|---|---|---|---|---|---|
| `simon-willison` | Simon Willison's Blog | `https://simonwillison.net/atom/everything/` | rss | AI | 48h |
| `hf-papers` | HuggingFace Daily Papers | `https://huggingface.co/papers/rss` | rss | AI | 7d |
| `papers-with-code` | Papers With Code | `https://paperswithcode.com/latest.rss` | rss | AI | 7d |
| `import-ai` | Import AI (Jack Clark) | `https://jack-clark.net/feed/` | rss | AI | 7d |

**Tier 2 — Research depth**

| ID | Source | URL | Type | Topic | Window |
|---|---|---|---|---|---|
| `interconnects` | Interconnects (N. Lambert) | `https://www.interconnects.ai/feed` | rss | AI | 7d |
| `the-gradient` | The Gradient | `https://thegradient.pub/rss/` | rss | AI | 7d |
| `anthropic-news` | Anthropic News | `https://www.anthropic.com/news.rss` | rss | AI | 7d |
| `arxiv-cl` | ArXiv cs.CL | `http://export.arxiv.org/rss/cs.CL` | rss | AI | 7d |
| `arxiv-lg` | ArXiv cs.LG | `http://export.arxiv.org/rss/cs.LG` | rss | AI | 7d |

**Tier 3 — News/market (broader context)**

| ID | Source | URL | Type | Topic | Window |
|---|---|---|---|---|---|
| `nikkei-asia` | Nikkei Asia | `https://asia.nikkei.com/rss/feed/nar` | rss | JP_STOCK | 48h |
| `japan-times-biz` | Japan Times Business | `https://www.japantimes.co.jp/feed/business/` | rss | JP_STOCK | 48h |
| `bloomberg-jp` | Bloomberg Japan | `https://www.bloomberg.co.jp/feed/rss` | rss | JP_STOCK | 48h |

*Note: Semantic Scholar API (planned) — add sau khi verify API key, bỏ qua trong MVP*

### 4.2 Config Schema Mới

Thêm section vào `config.yaml`:

```yaml
collect:
  run_time: "05:30"           # Task Scheduler trigger
  max_articles_per_source: 10
  ingest_batch_limit: 15      # max pages ingest/lần — giới hạn Groq quota
  auto_ingest: false          # safety default while concept-first ingest is under review
  notify_top_n: 5

collect_sources:
  - id: simon-willison
    topic: AI
    tier: 1
    type: rss
    url: https://simonwillison.net/atom/everything/
    window_hours: 48
    enabled: true

  - id: hf-papers
    topic: AI
    tier: 1
    type: rss
    url: https://huggingface.co/papers/rss
    window_hours: 168     # 7 ngày
    enabled: true

  # ... (tất cả sources theo bảng trên)
```

---

## 5. Ranking Algorithm

Heuristic scoring — không dùng LLM, không gọi API.

```python
def score_article(article, source_config) -> int:
    score = 0

    # Tier bonus
    score += {1: 3, 2: 2, 3: 1}.get(source_config["tier"], 0)

    # Keyword match trong title (case-insensitive)
    AI_KEYWORDS = {"claude", "gpt", "llm", "agent", "reasoning",
                   "benchmark", "sota", "rlhf", "transformer", "fine-tun"}
    JP_KEYWORDS = {"nikkei", "boj", "日経", "topix", "yen", "jpy", "tariff"}
    title_lower = article["title"].lower()
    if any(kw in title_lower for kw in AI_KEYWORDS | JP_KEYWORDS):
        score += 2

    # Freshness: published trong 12h
    if article.get("age_hours", 99) <= 12:
        score += 1

    # Has code/repo signal
    if "github.com" in article.get("url", "") or \
       "paperswithcode" in article.get("url", ""):
        score += 1

    return score
```

Top 5 by score → Telegram. Tie-break: tier cao hơn trước, sau đó mới theo time.

---

## 6. Data Flow

```
config.yaml [collect_sources]
        │
        ▼
tools/collect_tool.py
  fetch_all_sources()
        │
        ├─ rss: feedparser (window_hours filter)
        └─ (future: semantic_scholar API)
        │
        ▼
  dedupe_articles()       ← check slug tồn tại trong raw/articles/
        │
        ▼
  save_raw_articles()     → raw/articles/YYYY-MM-DD-{slug}.md
        │
        ▼ (nếu không --no-ingest)
wiki_ops/ingest.py
  ingest_batch(limit=15)  → personal-wiki/{topic}/*.md
                          → INDEX.md update
        │
        ▼
  rank_top(n=5)
        │
        ▼
  send_telegram(reading_list)
```

---

## 7. Interface Contracts

### 7.1 `run_collect.py` Entry Point

```python
# run_collect.py
# python run_collect.py
# python run_collect.py --dry-run
# python run_collect.py --no-ingest

def main():
    args = parse_args()           # --dry-run, --no-ingest
    articles = fetch_all()        # → list[Article]
    new_articles = dedupe(articles)
    if not args.dry_run:
        save_raw(new_articles)
        if not args.no_ingest:
            ingest_batch(limit=config["collect"]["ingest_batch_limit"])
    top5 = rank_top(new_articles, n=5)
    if not args.dry_run:
        send_telegram(format_reading_list(top5, total=len(new_articles)))
    else:
        print(format_reading_list(top5, total=len(new_articles)))
```

### 7.2 Article Schema (internal dict)

```python
Article = {
    "title": str,
    "url": str,
    "summary": str,          # max 300 chars
    "published": datetime,
    "age_hours": float,
    "source_id": str,        # matches config id
    "topic": str,            # AI | JP_STOCK
    "slug": str,             # slugified title (used for dedup + filename)
}
```

### 7.3 `wiki_ops/ingest.py` — thêm `ingest_batch()`

```python
def ingest_batch(limit: int = 15) -> dict:
    """
    Scan raw/articles/ → ingest files chưa có trong INDEX.md.
    Returns: {"ingested": int, "skipped": int, "errors": int}
    """
```

Hàm này đọc INDEX.md để biết page nào đã ingest (dựa theo slug trong log.md).
Không ingest lại file đã xử lý.

---

## 8. Build Plan

### Step 0 — Verify RSS URLs (prerequisite)
```bash
python -c "
import feedparser
urls = [
    'https://simonwillison.net/atom/everything/',
    'https://huggingface.co/papers/rss',
    'https://paperswithcode.com/latest.rss',
    'https://jack-clark.net/feed/',
    'https://www.interconnects.ai/feed',
    'https://thegradient.pub/rss/',
    'https://www.anthropic.com/news.rss',
    'http://export.arxiv.org/rss/cs.CL',
    'http://export.arxiv.org/rss/cs.LG',
    'https://www.bloomberg.co.jp/feed/rss',
]
for url in urls:
    f = feedparser.parse(url)
    print(f'{len(f.entries):3d} entries — {url}')
"
```
Disable source nào trả về 0 entries.

### Step 1 — config.yaml: thêm `collect` + `collect_sources` section
Thêm tất cả sources đã verify vào `config.yaml`. Không sửa `sources` cũ.

### Step 2 — `tools/collect_tool.py`
Functions:
- `fetch_all_sources(config) -> list[Article]`
- `dedupe_articles(articles, raw_dir) -> list[Article]`
- `save_raw_articles(articles, raw_dir) -> int`  (returns count saved)
- `rank_top(articles, n) -> list[Article]`
- `format_reading_list(top_articles, total) -> str`

### Step 3 — `wiki_ops/ingest.py`: thêm `ingest_batch(limit)`
Scan `raw/articles/`, so sánh với `log.md` để tìm file chưa ingest.
Gọi `run_ingest(filepath)` cho từng file, dừng khi đạt limit.

### Step 4 — `run_collect.py`
Entry point nối các pieces. ~50 lines.

### Step 5 — Test thủ công
```bash
python run_collect.py --dry-run   # verify fetch + rank, không side effects
python run_collect.py --no-ingest # verify save raw + Telegram
python run_collect.py             # full pipeline
python run_wiki.py lint           # verify wiki được update đúng
```

### Step 6 — Task Scheduler
```
Task name:    content-collector
Program:      C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe
Arguments:    C:\Users\HUY\AI\WIKI\personal-agent\run_collect.py
Working dir:  C:\Users\HUY\AI\WIKI\personal-agent
Trigger:      Daily, 05:30
```

---

## 9. Open Questions (cần confirm trước khi build)

| # | Câu hỏi | Default nếu không confirm |
|---|---|---|
| Q1 | ResearchCrew có nên đọc từ `raw/` thay vì fetch lại? | Không — giữ Module A độc lập, tránh coupling |
| Q2 | Telegram reading list: gửi 1 message hay 1 message/topic (AI + JP_STOCK riêng)? | 1 message tổng hợp |
| Q3 | Nếu 0 bài mới (tất cả đã dedup): có gửi Telegram không? | Không gửi — tránh spam |
| Q4 | `ingest_batch` limit 15 pages/lần — có đủ không hay cần tăng? | 15 là safe cho Groq free tier |
| Q5 | Bloomberg JP RSS có access không (có thể cần subscription)? | Verify ở Step 0, disable nếu blocked |

---

## 10. Quyết Định Thiết Kế — Lý Do

| Quyết định | Lý do |
|---|---|
| Không replace ResearchCrew | Module A + Content Collector cùng viết vào `raw/` — hai pipeline độc lập, không coupling. Module A vẫn giữ synthesis → Telegraph flow. |
| Rank bằng heuristic, không LLM | Collect pipeline phải chạy < 2 phút. LLM call cho rank là overkill và tốn quota. Heuristic đủ tốt cho top-5 signal. |
| window_hours per source | Papers (7 ngày) vs news (48h) — cùng 1 pipeline nhưng filter riêng theo loại content. |
| `ingest_batch(limit=15)` thay vì ingest tất cả | Groq free tier bị rate limit. 15 pages/run × 2 LLM calls/page = 30 calls. Đủ để wiki tăng nhanh mà không bị throttle. |
| `log.md` là source of truth cho dedup ingest | Không cần database. `log.md` đã ghi mọi file đã ingest — check slug là đủ. |

---

*Content Collector — RD draft 2026-04-28*
*Pattern: requirement-driven, usage-first*
