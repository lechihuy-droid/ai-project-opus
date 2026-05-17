# SD — System Design
**Project:** Personal AI Agent (CrewAI + Groq)
**Date:** 2026-04-26
**Status:** 🟢 Phase 2 Build — DONE & TESTED

---

## 1. Architecture Overview

```mermaid
graph TD
    subgraph TRIGGER["Trigger Layer"]
        TS[Windows Task Scheduler<br/>6:00 ICT daily]
        CLI[CLI<br/>python run_research.py]
    end

    subgraph MOD_A["Module A — ResearchCrew"]
        R[Researcher Agent]
        W[Writer Agent]
    end

    subgraph MOD_B["Module B — Direct Pipeline"]
        RW[read_wiki()]
        LLM[Groq LLM call<br/>llama-3.3-70b]
        PUB[publish()]
        TGS[send_message()]
    end

    subgraph SOURCES["Input Sources"]
        RSS[RSS Feeds]
        YF[yfinance API]
        WS[Web Search]
    end

    subgraph OUTPUT["Output"]
        WIKI[(wiki/*.md)]
        LOG[(logs/*.md)]
        TELE[Telegraph<br/>telegra.ph]
        TGMSG[Telegram Message<br/>→ iPhone]
    end

    CLI --> MOD_A
    TS --> MOD_B

    RSS --> R
    YF --> R
    WS --> R

    R --> W
    W --> WIKI
    W --> TELE

    RW --> WIKI
    RW --> LLM --> PUB --> TELE
    PUB --> TGS --> TGMSG
    LLM --> LOG
```

---

## 2. Module A — Sequence Diagram (ResearchCrew)

```mermaid
sequenceDiagram
    actor User
    participant Script as run_research.py
    participant Researcher
    participant Writer
    participant Wiki as wiki/*.md
    participant Telegraph

    User->>Script: python run_research.py AI
    Script->>Researcher: kickoff(topic, sources_config)

    activate Researcher
    Researcher->>Researcher: fetch RSS feeds (48h filter, max 5/source)
    Researcher->>Researcher: call yfinance (if JP_STOCK)
    Researcher->>Researcher: web_search(query)
    Researcher-->>Writer: raw_content[]
    deactivate Researcher

    activate Writer
    Writer->>Writer: synthesize & format markdown
    Writer->>Wiki: save YYYY-MM-DD-{topic}.md
    Writer->>Telegraph: publish(title, content)
    Telegraph-->>Writer: telegraph_url
    Writer-->>Script: done(output_path, telegraph_url)
    deactivate Writer

    Script-->>User: "Saved wiki/ ... Telegraph: https://telegra.ph/..."
```

> **Note:** ResearchCrew chạy tối đa 3 lần nếu gặp Groq rate limit (backoff 60s/lần).

---

## 3. Module B — Sequence Diagram (Direct Pipeline)

```mermaid
sequenceDiagram
    participant Scheduler as Windows Task Scheduler
    participant Script as run_daily.py
    participant Wiki as wiki/*.md
    participant Groq as Groq SDK
    participant Telegraph
    participant TG as Telegram Bot
    actor iPhone

    Scheduler->>Script: trigger at 06:00 ICT

    Script->>Wiki: read_wiki("AI") → latest *-AI.md
    Script->>Wiki: read_wiki("JP_STOCK") → latest *-JP_STOCK.md

    alt wiki_contents not empty
        Script->>Groq: chat.completions.create(prompt + wiki[:2000/topic])
        Groq-->>Script: brief_text (< 400 words)
        Script->>Script: write logs/YYYY-MM-DD.md
        Script->>Telegraph: publish("Brief YYYY-MM-DD", brief_text)
        Telegraph-->>Script: telegraph_url
        Script->>TG: send_message(link + brief summary)
    else no wiki data
        Script->>TG: send_message("Chua co data hom nay...")
    end

    TG-->>iPhone: push notification

    note over Script,TG: On any exception:<br/>send_error(module, err) — max 1/hr, dedup same error type
```

---

## 4. Data Flow Diagram

```mermaid
flowchart LR
    subgraph IN["Input"]
        I1[RSS Feeds]
        I2[yfinance]
        I3[Web Search]
    end

    subgraph PROCESS["Processing"]
        RC["ResearchCrew\n(Module A)"]
        DP["Direct Pipeline\n(Module B)"]
    end

    subgraph STORE["Storage"]
        W["wiki/\nYYYY-MM-DD-{topic}.md"]
        L["logs/\nYYYY-MM-DD.md"]
    end

    subgraph OUT["Output"]
        TG["Telegram → iPhone"]
        TE["Telegraph\ntelegra.ph"]
    end

    I1 & I2 & I3 --> RC
    RC --> W & TE
    W --> DP
    DP --> L & TG & TE
```

---

## 5. File & Folder Structure

```
personal-agent/
├── crews/
│   ├── research/
│   │   ├── agents.py         ← Researcher + Writer agents (Groq LLM)
│   │   ├── tasks.py          ← research_task, write_task
│   │   └── crew.py           ← ResearchCrew class + retry logic
│   └── daily/
│       ├── agents.py         ← (không dùng — Module B bypass CrewAI)
│       └── tasks.py          ← (không dùng — Module B bypass CrewAI)
├── tools/
│   ├── rss_tool.py           ← fetch RSS, 48h filter, max 5/source
│   ├── yfinance_tool.py      ← fetch ^N225 (TOPIX unavailable)
│   ├── search_tool.py        ← web search (duckduckgo-search, todo: → ddgs)
│   ├── wiki_tool.py          ← read/write wiki files
│   └── telegraph_tool.py     ← direct requests to api.telegra.ph
├── utils/
│   ├── config.py             ← load config.yaml, resolve paths
│   └── telegram.py           ← send_message(), send_error() (anti-spam)
├── wiki/                     ← knowledge base output
│   └── YYYY-MM-DD-{topic}.md
├── logs/                     ← daily brief logs
│   └── YYYY-MM-DD.md
├── docs/
│   ├── RD-requirements.md
│   ├── SD-system-design.md   ← this file
│   └── SD-interface-contract.md
├── .telegraph_token          ← Telegraph access token (auto-created)
├── .last_error.json          ← anti-spam state cho send_error()
├── config.yaml               ← source list, schedule, LLM config
├── run_research.py           ← entrypoint Module A
├── run_daily.py              ← entrypoint Module B (Task Scheduler)
└── requirements.txt
```

---

## 6. Tech Stack

| Layer | Technology |
|---|---|
| Crew Orchestration | CrewAI (Module A only) |
| LLM | Groq `llama-3.3-70b-versatile` (free tier) |
| RSS Parsing | `feedparser` |
| Stock Data | `yfinance` — chỉ `^N225` (TOPIX không hỗ trợ) |
| Web Search | `duckduckgo-search` (todo: migrate → `ddgs`) |
| Telegraph | Direct `requests` to `api.telegra.ph` |
| Telegram | Direct `requests` to `api.telegram.org` (Bot API) |
| Scheduler | Windows Task Scheduler → `run_daily.py` 6:00 ICT |
| Storage | Local filesystem (`wiki/`, `logs/`) |
| Config | `config.yaml` + `.env` |
