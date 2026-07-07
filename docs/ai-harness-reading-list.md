# AI Harness Reading List

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

### langchain-ai/openwiki

- **Priority:** P1
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
