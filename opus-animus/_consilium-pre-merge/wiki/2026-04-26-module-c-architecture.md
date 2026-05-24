# Module C — Kiến Trúc Tổng Quan: Karpathy LLM Wiki + Hermes Skill
**Date:** 2026-04-26
**Status:** Architecture design

---

## 1. Hai Nhân Tố Và Vai Trò

Kiến trúc Module C được xây dựng từ 2 nhân tố bổ sung lẫn nhau — không thay thế:

| Nhân tố | Vai trò | Trả lời câu hỏi |
|---|---|---|
| **Karpathy LLM Wiki** | Memory layer — lưu trữ, tổ chức, duy trì kiến thức | *"Tôi biết gì về X?"* |
| **Hermes Skill** | Intelligence layer — hiểu ngôn ngữ tự nhiên, phối hợp tools, học theo thời gian | *"Người dùng muốn gì, và cần gọi tool nào?"* |

> **Core insight:** Karpathy Wiki làm cho kiến thức trở nên *persistent và có cấu trúc*. Hermes làm cho kiến thức đó trở nên *accessible và actionable* qua ngôn ngữ tự nhiên.

---

## 2. Kiến Trúc 3 Tầng

```
┌─────────────────────────────────────────────────────────────┐
│  TẦNG 3 — INTERFACE (Hermes Skill Layer)                    │
│                                                             │
│  Natural language parsing  ·  Intent classification         │
│  Context management        ·  Cross-skill orchestration     │
│  Learning loop             ·  Response generation           │
└─────────────────────┬───────────────────────────────────────┘
                      │ dispatches to
┌─────────────────────▼───────────────────────────────────────┐
│  TẦNG 2 — OPERATIONS (Karpathy Wiki Operations)             │
│                                                             │
│  ingest()   ·   query()   ·   lint()                        │
│  + auto-ingest từ Module A                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ reads/writes
┌─────────────────────▼───────────────────────────────────────┐
│  TẦNG 1 — STORAGE (Karpathy 3-layer)                        │
│                                                             │
│  raw/            personal-wiki/           SCHEMA.md         │
│  (immutable)     (compounding)            (LLM guide)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tầng 1 — Storage (Karpathy)

Không thay đổi so với Karpathy gốc. Đây là **ground truth** của hệ thống.

```
personal-agent/
├── raw/                          ← IMMUTABLE — nguồn thô, không bao giờ sửa
│   ├── articles/                 ← HTML/text clips
│   ├── papers/                   ← PDF khoa học
│   └── notes/                    ← Telegram notes, plain text
│
├── personal-wiki/                ← COMPOUNDING — LLM builds & maintains
│   ├── SCHEMA.md                 ← LLM reads before every operation
│   ├── INDEX.md                  ← tag map (compact, always passed to LLM)
│   ├── log.md                    ← ingest history
│   ├── AI/
│   │   ├── llm-agents.md
│   │   └── rag-vs-wiki.md
│   ├── Stock/
│   ├── Personal/
│   └── Tech/
```

**Invariants từ Karpathy:**
- `raw/` never modified after write
- `personal-wiki/` only written by LLM operations (ingest/lint), never manually
- `SCHEMA.md` is the single source of truth for LLM behavior

---

## 4. Tầng 2 — Operations (Karpathy)

3 operations core — đây là logic nghiệp vụ, độc lập với interface layer.

```
┌──────────────────────────────────────────────────────────┐
│                    INGEST PIPELINE                        │
│                                                           │
│  Input ──→ detect_type() ──→ markitdown() ──→ raw/        │
│                                   │                       │
│                         read SCHEMA + INDEX               │
│                                   │                       │
│                         Groq LLM call                     │
│                         "create wiki page"                │
│                                   │                       │
│                    ┌──────────────┴──────────────┐        │
│                    ▼                             ▼         │
│             personal-wiki/             update INDEX.md    │
│             {topic}/{slug}.md          + log.md           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    QUERY PIPELINE                         │
│                                                           │
│  Question ──→ LLM call 1: "which pages are relevant?"    │
│                   (reads INDEX.md only)                   │
│                          │                                │
│               read 2-4 relevant pages                     │
│                          │                                │
│               LLM call 2: "synthesize answer"             │
│                          │                                │
│               Answer + [[source links]]                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    LINT PIPELINE  (weekly)                │
│                                                           │
│  Scan all wiki pages ──→ check 5 rules ──→ lint_report.md │
│  [orphan] [broken-link] [contradiction] [stale] [schema]  │
└──────────────────────────────────────────────────────────┘
```

**Tầng 2 không biết gì về Hermes, Telegram, hay interface.** Có thể gọi trực tiếp từ CLI:
```bash
python run_wiki.py ingest <url>
python run_wiki.py query "what is RAG?"
python run_wiki.py lint
```

---

## 5. Tầng 3 — Interface (Hermes Skill)

Hermes là lớp **intelligence** ngồi trên Karpathy operations. Nó làm 4 việc Karpathy không làm:

### 5.1 Natural Language → Intent

Karpathy operations yêu cầu explicit commands (`ingest`, `query`, `lint`).
Hermes hiểu ngôn ngữ tự nhiên:

```
User: "lưu cái này lại nhé"       → intent: ingest (+ URL đính kèm)
User: "mày biết gì về transformer?" → intent: query
User: "tóm tắt tuần này"           → intent: lint + digest
User: "cái này liên quan gì đến bài hôm qua?"  → intent: query + context
```

**Intent classifier** (Hermes built-in):
```
inputs: [message_text, attachments, conversation_history]
outputs: {
  operation: "ingest" | "query" | "lint" | "digest" | "unknown",
  args: { url?, file?, question?, ... },
  confidence: float
}
```

### 5.2 Cross-Skill Orchestration

Hermes có thể kết hợp Module C với Module A và Module B:

```
User: "bài này nói về gì, và liên quan gì đến tin AI tuần này?"
  ↓
Hermes:
  Step 1 → wiki.query("topic of article X")          [Module C]
  Step 2 → read wiki/2026-04-26-AI.md                [Module A output]
  Step 3 → synthesize: "Article X relates to [Y] from this week's AI news"
  Step 4 → wiki.ingest(article X) + link to AI news  [Module C ingest]
```

Đây là điều **không thể làm với CLI pure** — cần intelligence layer để quyết định thứ tự và kết hợp.

### 5.3 Context Management

Hermes duy trì conversation context — các operation liên tiếp hiểu nhau:

```
User: "lưu bài này" → [ingest → AI/llm-agents.md]
User: "thêm tag practical-use vào"
  → Hermes biết "bài này" = llm-agents.md vừa ingest
  → update frontmatter tags

User: "có gì liên quan không?"
  → Hermes biết context → query với [[llm-agents]] làm seed
```

Karpathy Wiki thuần không có context — mỗi CLI call là stateless.

### 5.4 Learning Loop (long-term)

Hermes track patterns theo thời gian:
- User thường ingest chủ đề nào? → suggest auto-ingest sources
- Query nào thường trả về kết quả yếu? → flag pages cần enrich
- Orphan pages sau lint → suggest kết nối với topic nào

---

## 6. Full System Diagram

```mermaid
graph TD
    subgraph INPUT["Input Sources"]
        TG_MSG[Telegram message]
        TG_FILE[Telegram file / URL]
        MOD_A[Module A wiki output<br/>wiki/YYYY-MM-DD-AI.md]
        CLI[CLI direct<br/>run_wiki.py]
    end

    subgraph HERMES["Tầng 3 — Hermes Skill"]
        IC[Intent Classifier]
        CTX[Context Manager]
        ORCH[Skill Orchestrator]
        RESP[Response Generator]
    end

    subgraph OPS["Tầng 2 — Wiki Operations"]
        ING[ingest()]
        QRY[query()]
        LNT[lint()]
    end

    subgraph TOOLS["Tools"]
        MKD[markitdown_tool<br/>HTML/PDF → .md]
        GROQ[Groq SDK<br/>llama-3.3-70b]
        TGAPI[Telegram Bot API<br/>send_message]
    end

    subgraph STORAGE["Tầng 1 — Storage (Karpathy)"]
        RAW[raw/<br/>immutable sources]
        WIKI[personal-wiki/<br/>compounding knowledge]
        SCHEMA[SCHEMA.md<br/>LLM guide]
        IDX[INDEX.md<br/>compact tag map]
    end

    TG_MSG & TG_FILE --> IC
    IC --> CTX --> ORCH
    MOD_A --> ING
    CLI --> ING & QRY & LNT

    ORCH --> ING & QRY & LNT

    ING --> MKD --> RAW
    ING --> GROQ
    QRY --> GROQ
    LNT --> GROQ

    SCHEMA & IDX --> GROQ
    GROQ --> WIKI
    GROQ --> IDX

    RESP --> TGAPI

    ING & QRY & LNT --> RESP
```

---

## 7. MVP vs Full — Quyết Định Build

Hermes Skill layer **chưa cần thiết cho MVP**. Cần build theo thứ tự:

```
MVP (build ngay)              Full (sau khi MVP stable)
─────────────────             ──────────────────────────
Tầng 1 + Tầng 2               + Tầng 3 (Hermes)
Direct Groq SDK               Hermes intent classifier
CLI commands                  Natural language Telegram
Explicit /wiki <cmd>          Conversational input
Stateless operations          Context-aware session
```

**Lý do:** Giống quyết định Module B — bypass CrewAI để ship nhanh hơn. Tầng 1+2 đã đủ value. Hermes add thêm UX, không add core functionality.

**Trigger để add Hermes (tầng 3):**
- Tầng 1+2 ổn định ≥ 2 tuần
- Wiki đã có > 20 pages
- User thấy explicit commands (`/wiki ingest`, `/wiki query`) bất tiện

---

## 8. Hermes Skill Contract (khi implement)

```python
# skills/wiki_skill.py

class WikiSkill(HermesSkill):
    name = "personal_wiki"
    description = "Manage personal knowledge wiki — ingest sources, query knowledge, run maintenance"

    def run(self, intent: str, args: dict, context: ConversationContext) -> str:
        if intent == "ingest":
            result = ingest(args["source"])
            context.last_wiki_page = result["page_path"]
            return f"Saved to {result['page_path']}"

        elif intent == "query":
            result = query(args["question"], context=context)
            return result["answer"]

        elif intent == "lint":
            result = lint()
            return format_lint_report(result)

        elif intent == "digest":
            # combine lint + weekly summary
            lint_result = lint()
            digest = summarize_week(wiki_dir())
            return format_digest(lint_result, digest)
```

**Input/Output contract:**
```python
# Hermes → WikiSkill
{
  "intent": "ingest" | "query" | "lint" | "digest",
  "args": {
    "source": str | None,    # URL / file path / text
    "question": str | None,  # for query
  },
  "context": ConversationContext
}

# WikiSkill → Hermes
{
  "status": "ok" | "error",
  "response": str,           # human-readable result
  "metadata": {
    "page_path": str | None,
    "pages_read": list[str] | None,
    "issues_found": int | None,
  }
}
```

---

## 9. Sự Bổ Sung Giữa Hai Nhân Tố

```
                 Karpathy Wiki          Hermes Skill
                 ─────────────          ────────────
Strengths:       Structured storage     NL understanding
                 Cross-references       Context awareness
                 Compounding knowledge  Skill composition
                 Source traceability    Learning loop

Weaknesses:      Explicit commands      No persistence
                 Stateless              No knowledge base
                 No NL understanding    Answers from LLM
                                        (not compiled wiki)

Combined:        Wiki = long-term memory │ Hermes = smart interface
                 Hermes queries wiki     │ Wiki answers accurately
                 Hermes ingests wiki     │ Wiki grows over time
```

**Kết luận thiết kế:**
- Karpathy Wiki giải quyết vấn đề "LLM không nhớ gì" — thay bằng *curated knowledge graph*
- Hermes giải quyết vấn đề "CLI không thân thiện" — thay bằng *conversational interface*
- Kết hợp: hệ thống vừa *biết nhiều* (wiki) vừa *dễ dùng* (Hermes)

---

## 10. Phân Biệt Với Module A

```
Module A (ResearchCrew)              Module C (Personal Wiki Agent)
────────────────────────             ──────────────────────────────
Mục đích: thu thập tin tức           Mục đích: tích lũy kiến thức
Trigger: Task Scheduler tự động      Trigger: user-driven (Telegram)
Output: wiki/YYYY-MM-DD-{topic}.md   Output: personal-wiki/{topic}/{slug}.md
TTL: ephemeral (mỗi ngày overwrite)  TTL: permanent (không xóa)
LLM role: Researcher + Writer        LLM role: Librarian (compile + link)
Cross-ref: không                     Cross-ref: có, tự động
Scale: daily snapshots               Scale: compounding over months/years
Feed into: Module B (daily brief)    Feed into: self (query) + Module B (future)
```

---
*Sources: Karpathy Gist + Antigravity Codes + Starmorph + Build Plan BD-module-c-build-plan.md*
*Date: 2026-04-26*
