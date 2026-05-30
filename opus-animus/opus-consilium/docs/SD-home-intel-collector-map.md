# SD - Home Intel Collector Map
**Date:** 2026-05-14  
**Status:** Active  
**Scope:** Maps the latest Content Collector implementation to the Opus Home Intel experience.

---

## 1. Purpose

The Content Collector is now the upstream data producer for the Opus Home `Intel` tab.

It still collects articles into `raw/articles/`, but the main product surface is Opus Home, not Telegram or automatic wiki ingest. The current product loop is:

```
external sources -> raw article files -> Intel API enrichment -> Opus Home dashboard -> user action
```

`personal-wiki/` remains the long-term brain. Current `config.yaml` has `collect.auto_ingest: false`, so raw articles are reviewed through `run_wiki.py audit-research` before they become durable wiki pages. Telegram delivery is disabled system-wide.

---

## 2. Runtime Flow

```
config.yaml
  collect
  collect_sources
        |
        v
run_collect.py
        |
        v
tools/collect_tool.py
  fetch_all_sources()
  dedupe_articles()
  goal_align_filter()
  rank_top()
  format_reading_list()
  save_raw_articles()
        |
        v
raw/articles/YYYY-MM-DD-{slug}.md
        |
        v
api/data.py
  list_articles()
        |
        v
api/intel.py
  enrich category / signals / actors / business impact / action
        |
        v
dashboard/index.html
  SimpleIntelView
```

---

## 3. Article Contract

Collector writes Markdown files in `raw/articles/`.

Required metadata consumed by Home Intel:

```md
# Title

**Source:** openai-news
**URL:** https://...
**Published:** 2026-05-13 10:00 UTC
**Topic:** AI
**Tier:** 0
**Source-Kind:** market_news
**Goal-Score:** 5
**Relevance:** Concrete takeaway. -> Specific reader action.

Summary text...
```

Important fields:

| Field | Producer | Consumer | Purpose |
|---|---|---|---|
| `Source` | `save_raw_articles()` | `api/data.py`, `api/intel.py` | Source ranking and category bias |
| `Topic` | `config.yaml` | Dashboard labels | AI / COMPETITOR / JP_STOCK grouping |
| `Tier` | `config.yaml` | Collector ranking | Source quality prior |
| `Source-Kind` | `config.yaml` | Intel hot-market ranking | Marks official/market sources |
| `Goal-Score` | `goal_align_filter()` | Intel importance | 1-5 action relevance score |
| `Relevance` | `goal_align_filter()` | Intel why/action text | Human-readable reason to read or skip |

---

## 4. API Surface

| Endpoint | Owner | Use |
|---|---|---|
| `/api/articles` | `api/articles.py` | Raw recent articles for Reading/Intel views |
| `/api/intel/reports` | `api/intel.py` | Available daily reports |
| `/api/intel/report` | `api/intel.py` | Full deterministic daily report |
| `/api/intel/simple` | `api/intel.py` | Main Home Intel market summary |
| `/api/intel/github-repos` | `api/intel.py` | Weekly GitHub Trending AI repo scan |
| `/api/intel/articles/{slug}/mark-used` | `api/intel.py` | Mark item as used |
| `/api/intel/articles/{slug}/mark-unused` | `api/intel.py` | Mark item as unused |

State:

| File | Purpose |
|---|---|
| `logs/intel_state.json` | Used/unused status keyed by article slug |
| `logs/intel_reviews/YYYY-MM-DD.json` | Optional LLM-written daily market review |
| `logs/business_briefs/YYYY-MM-DD.json` | Optional Business Knowledge section |
| `personal-wiki/Research/research-source-map.md` | Source map for collector, Intel, weekly, and research surfaces |
| `personal-wiki/Research/intel-to-wiki-promotion.md` | Rules for promoting Intel signals into durable wiki hubs |

---

## 5. Dashboard Surface

The active Home Intel UI is `SimpleIntelView` in `dashboard/index.html`.

Tabs:

| Tab | Data Source | Purpose |
|---|---|---|
| Market | `/api/intel/simple` | Latest AI market changes, summary, action list, business brief |
| GitHub Repos | `/api/intel/github-repos` | Weekly trending repos reranked for AI-SDLC / FDE relevance |

The older `IntelView` still exists in the file, but the sidebar currently routes `intel` to `SimpleIntelView`.

---

## 6. Current Operating Rules

- Run collector with the Python 3.11 interpreter used by the project:

```bash
C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe run_collect.py
```

- Do not assume `python run_collect.py` uses the right environment.
- `collect.auto_ingest` is currently `true`; raw articles may become seed pages automatically.
- Treat `raw/articles/` as the durable event log for Intel.
- Treat `api/intel.py` as deterministic synthesis, not source collection.
- Business brief generation is separate from collect; collect only provides source material.
- Treat Intel synthesis as provisional until promoted into the right hub page.

---

## 7. Open Gaps

| Gap | Current State | Next Decision |
|---|---|---|
| LLM-written daily Intel review | Optional JSON in `logs/intel_reviews/` | Decide whether to add a generation command |
| Business Knowledge brief | Manual/sidecar JSON | Decide generation cadence and owner |
| Wiki promotion | Defined in `personal-wiki/Research/intel-to-wiki-promotion.md` | Add tooling or dashboard affordance for a pending promotion queue |
| Web search sources | Listed as pending in config comments | Add implementation only if RSS is insufficient |
