# AI Harness Reading List

## P0 — Must Study

### codebase-memory-mcp

- **Priority:** P0
- **Primary Category:** Codebase Memory & Structural Context
- **Document Type:** Tool / Reference Implementation
- **Maturity:** Production Candidate
- **Difficulty:** Intermediate → Advanced
- **Source:** GitHub
- **URL:** TBD

**Labels**

- Codebase Memory
- Knowledge Graph
- MCP
- Architecture
- Implementation
- Context Engineering
- Developer Tooling
- Token Optimization

**Why it matters**

This is a core candidate for the AI Harness Context Layer because it turns a codebase into a persistent queryable memory/graph. It should be evaluated as a primary backend for code context retrieval, especially for Codex / Claude Code workflows.

**Apply to Harness**

- Code Context Provider
- Persistent Code Memory
- Structural Query Layer
- MCP Tool Backend
- Token Reduction Strategy
- Agent Navigation over Large Repositories

**Expected output after reading / testing**

- Benchmark indexing speed and query quality on a real repo.
- Define how Harness routes code questions to codebase-memory-mcp versus normal grep/search.
- Decide whether it becomes a default Context Provider in the Harness.

---

### Microsoft GraphRAG

- **Priority:** P0
- **Primary Category:** Enterprise Knowledge Graph & RAG
- **Document Type:** Framework / Reference Architecture
- **Maturity:** Production-Oriented
- **Difficulty:** Advanced
- **Source:** GitHub / Microsoft Research
- **URL:** https://github.com/microsoft/graphrag

**Labels**

- GraphRAG
- Knowledge Graph
- RAG & Knowledge Layer
- Architecture
- Implementation
- Enterprise AI
- Evaluation
- Hallucination Mitigation

**Why it matters**

GraphRAG is a primary reference for the Harness Business Context Layer: requirements, BD documents, meeting notes, QA, decisions, and ontology-level retrieval. It is more suitable for document/enterprise knowledge than pure code understanding.

**Apply to Harness**

- Requirement / BD Knowledge Layer
- Entity and Relationship Extraction
- Ontology-Aware Retrieval
- Traceability between RD → BD → QA → Decision
- Grounded Answering with Evidence
- Hallucination Control

**Expected output after reading / testing**

- Design a BD Knowledge Graph pattern for requirement and design documents.
- Map GraphRAG entities/communities to BD traceability objects.
- Decide how GraphRAG complements codebase-memory-mcp rather than replacing it.

---

## P1 — Highly Recommended

### Building a RAG Pipeline for 10M+ Documents With Near-Zero Hallucination

- **Priority:** P1
- **Primary Category:** RAG & Knowledge Layer
- **Document Type:** Implementation Guide
- **Maturity:** Production
- **Difficulty:** Intermediate → Advanced
- **Source:** Medium / Level Up Coding
- **URL:** https://levelup.gitconnected.com/building-a-rag-pipeline-for-10m-documents-with-near-zero-hallucination-788e4b5b7f25

**Labels**

- RAG & Knowledge Layer
- Architecture
- Implementation
- Production
- Best Practices
- Evaluation
- Hallucination Mitigation
- Step-by-Step

**Why it matters**

This article is useful for designing the Retrieval Layer of the AI Harness / BD Harness. It should be treated not only as knowledge material, but as an applicable implementation pattern.

**Apply to Harness**

- Retrieval Layer
- Vector Search
- Hybrid Search
- Reranker
- Citation
- Confidence Gate
- Abstention
- Evaluation Pipeline
- Observability

**Expected output after reading**

- Extract a production checklist for Retrieval Layer implementation.
- Convert the article into a design document section for Harness Architecture.
- Map the pattern to BD traceability and hallucination-control requirements.

**Classification note**

Do not add a separate `RAG` label because it is already covered by `RAG & Knowledge Layer`.

---

## P2 — Candidate / Test Before Adoption

### langchain-ai/openwiki

- **Priority:** P2 — Candidate P1 after hands-on test
- **Primary Category:** Agent Documentation & Codebase Memory
- **Document Type:** Tool / Reference Implementation
- **Maturity:** Early Production / Emerging
- **Difficulty:** Intermediate
- **Source:** GitHub
- **URL:** https://github.com/langchain-ai/openwiki

**Labels**

- Agent Documentation
- Codebase Memory
- Architecture
- Implementation
- Automation
- CI Workflow
- Context Engineering
- Developer Tooling

**Why it matters**

OpenWiki is directly relevant to the AI Harness because it generates and maintains agent-facing documentation for a codebase. It is not just a reading resource; it is a practical tool pattern for keeping repository knowledge synchronized with code changes.

**Apply to Harness**

- Codebase Documentation Layer
- Agent Context Layer
- AGENTS.md / CLAUDE.md synchronization
- CI-based documentation update workflow
- Repository onboarding for coding agents
- Long-term codebase memory
- Developer workflow automation

**Expected output after reading / testing**

- Evaluate whether OpenWiki should be adopted as-is, cherry-picked, or used only as a design reference.
- Extract a pattern for auto-maintained `openwiki/` documentation inside Harness-managed repositories.
- Test compatibility with Codex / Claude Code / local repo workflow.
- Define rules for when generated wiki content becomes trusted context versus auxiliary context.

**Classification note**

Do not classify this under `RAG & Knowledge Layer` as the primary category. It is closer to `Agent Documentation & Codebase Memory`: a repo-local context maintenance tool for coding agents.
