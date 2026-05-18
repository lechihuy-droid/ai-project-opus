---
title: "Wiki Health Log"
aliases: []
topic: Personal
tags: [wiki, health, ingest]
status: seed
confidence: medium
sources: []
related: []
applied: []
open_questions: []
created: 2026-05-17
updated: 2026-05-19
---

# Wiki Health Log
*Tracks every ingest run — quality signal over time*

## Stats Snapshot
*Updated: 2026-05-17 22:52*

| Metric | Value |
|---|---|
| Total wiki pages | 35 |
| Topics | AI: 15 · Tech: 3 · Stock: 0 · Personal: 0 |
| Raw articles (processed) | 198 |
| processed.txt entries | 198 |

---

## Run History

| Date | Source | Fetched | Passed Filter | Saved to raw/ | Ingested | Wiki Pages After | Notes |
|---|---|---|---|---|---|---|---|
| 2026-04-28 06:35 | content-collector | — | — | ~15 | 15 | 18 | Initial batch, no filter, incl. arXiv noise |
| 2026-04-29 05:30 | content-collector | — | — | 0 | 5 | 18 | Re-ingest bug (dedup fail), fixed 2026-04-29 |

---

## Filter Config (per source)
Sources marked with `keyword_filter` in config.yaml — articles not matching are dropped before raw/.

| Source | Tier | Filter |
|---|---|---|
| simon-willison | 1 | none (trusted) |
| hf-blog | 1 | none (trusted) |
| import-ai | 1 | none (trusted) |
| anthropic-blog | 1 | none (trusted) |
| interconnects | 2 | none (trusted) |
| the-gradient | 2 | none (trusted) |
| arxiv-ai | 2 | keyword_filter active |
| arxiv-lg | 2 | keyword_filter active |
| nikkei-asia | 3 | keyword_filter active |
| 2026-05-12 00:43 | content-collector | 107 | 49 dropped | 58 | 28 | 0 | 21 | simon-willison:2→2; hf-blog:3→3; import-ai:1→1; interconnects:2→2; arxiv-ai:11→10; arxiv-lg:24→10; nikkei-asia:23→10; hf-papers:11→10; github-trending-ai:12→10; itmedia-enterprise:8→0; everest-group:10→0 |
| 2026-05-12 00:55 | content-collector | 121 | 49 dropped | 72 | 24 | 0 | 21 | openai-news:10→10; microsoft-official-blog:1→1; microsoft-azure-blog:2→2; simon-willison:3→3; hf-blog:3→3; import-ai:1→1; interconnects:2→2; arxiv-ai:11→10; arxiv-lg:24→10; nikkei-asia:23→10; hf-papers:11→10; github-trending-ai:12→10; itmedia-enterprise:8→0; everest-group:10→0 |
| 2026-05-13 00:51 | content-collector | 130 | 58 dropped | 72 | 31 | 0 | 21 | openai-news:10→10; simon-willison:6→6; hf-blog:4→4; import-ai:1→1; interconnects:1→1; arxiv-ai:15→10; arxiv-lg:24→10; nikkei-asia:16→10; hf-papers:14→10; github-trending-ai:13→10; itmedia-enterprise:16→0; everest-group:10→0 |
| 2026-05-13 01:14 | content-collector | 165 | 62 dropped | 103 | 39 | 0 | 21 | openai-news:10→10; microsoft-azure-blog:1→1; google-ai-blog:3→3; aws-ml-blog:12→10; nvidia-blog:6→6; techcrunch-ai:11→10; simon-willison:6→6; hf-blog:4→4; import-ai:1→1; interconnects:2→2; arxiv-ai:15→10; arxiv-lg:24→10; nikkei-asia:17→10; hf-papers:14→10; github-trending-ai:13→10; itmedia-enterprise:16→0; everest-group:10→0 |
| 2026-05-17 22:52 | content-collector | 112 | 37 dropped | 75 | 41 | 15 | 35 | openai-news:10→10; google-ai-blog:1→1; aws-ml-blog:13→10; nvidia-blog:5→5; techcrunch-ai:11→10; simon-willison:4→4; hf-blog:3→3; import-ai:1→1; interconnects:2→2; nikkei-asia:21→10; hf-papers:14→10; github-trending-ai:15→9; itmedia-enterprise:2→0; everest-group:10→0 |
