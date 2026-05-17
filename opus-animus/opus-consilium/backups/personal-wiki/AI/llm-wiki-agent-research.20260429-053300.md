---
title: "LLM Wiki Agent Research and Build Plan"
topic: AI
tags: [llm, wiki, karpathy]
sources: ["raw/articles/2026-04-26-module-c-wiki-agent-research.md"]
related: ["[[karpathy-llm-wiki-pattern-explained]]", "[[llm-agents]]"]
confidence: medium
created: 2026-04-28
updated: 2026-04-28
---

## Summary
The LLM Wiki Agent is a research project that aims to create a persistent and compounding knowledge base using large language models. The project is based on the idea of Karpathy's LLM Wiki pattern, which emphasizes the importance of curated and maintained knowledge graphs.

## Key points
- The LLM Wiki Agent uses a stateful approach, where each ingest operation enriches the existing wiki.
- The agent uses pre-built cross-references and source-level traceability to ensure the accuracy and reliability of the knowledge base.
- The project involves three main operations: ingest, query, and lint.

## Details
The ingest operation involves downloading or reading raw data, extracting key concepts and entities, and updating the wiki pages accordingly. The query operation involves synthesizing answers to user questions based on the knowledge base. The lint operation involves scanning the wiki for orphaned pages, contradictions, and stale pages.

## See also
- [[karpathy-llm-wiki-pattern]] — Karpathy LLM Wiki Pattern
- [[karpathy-llm-wiki-idea-file]] — Karpathy's LLM Wiki: The Complete Guide to His Idea File
- [[deepseek-v4]] — DeepSeek-V4: A Million-Token Context for Agents
- [[openai-microsoft-agi-clause]] — OpenAI Microsoft AGI Clause
- [[llm-agents-2025]] — LLM Agents in 2025
[[karpathy-llm-wiki-pattern-explained]]
[[llm-agents]]

## Sources
- https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- https://antigravity.codes/blog/karpathy-llm-wiki-idea-file
