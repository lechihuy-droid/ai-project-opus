---
title: "Karpathy's LLM Wiki: The Complete Guide to His Idea File"
aliases: []
topic: AI
tags: ["llm", "karpathy", "wiki", "knowledge-base"]
status: evergreen
confidence: high
sources: ["https://antigravity.codes/blog/karpathy-llm-wiki-idea-file", "https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"]
related: ["[[karpathy-llm-wiki-pattern]]", "[[karpathy-llm-wiki-pattern-explained]]", "[[llm-wiki-agent-research]]"]
applied: ["Using LLMs to build personal knowledge bases for various topics of research interest"]
open_questions: ["How can we effectively use LLMs to build and maintain personal knowledge bases?", "What are the potential applications of LLM knowledge bases in different fields?"]
created: 2026-04-28
updated: 2026-05-31
---

# Karpathy's LLM Wiki: The Complete Guide to His Idea File

## Summary
Karpathy's viral tweet about LLM Knowledge Bases got a follow-up: a GitHub gist that lays out the full architecture. We go through it word by word — every concept, every tool, every technique — with implementation examples and code.

## Key Points
- Karpathy's LLM Knowledge Bases concept uses LLMs to build personal knowledge wikis instead of just generating code.
- The system consists of a `raw/` directory for raw source documents, a `wiki/` directory for compiled knowledge, and a `schema/` directory for defining the structure of the wiki.
- The LLM incrementally compiles the raw source documents into a structured wiki.

## Why It Matters
This concept matters because it has the potential to revolutionize the way we manage and utilize knowledge. By using LLMs to build personal knowledge bases, we can create a compounding effect of knowledge that can be applied to various fields and topics.

## Details
The Karpathy LLM Wiki pattern is based on the idea of using LLMs to maintain a wiki as a knowledge base. It involves creating a wiki page for each topic and using LLM to ingest, query, and lint the wiki pages. The system consists of three layers: `raw/`, `wiki/`, and `schema/`. The `raw/` directory contains the raw source documents, the `wiki/` directory contains the compiled knowledge, and the `schema/` directory defines the structure of the wiki.

## Application To OPUS ANIMUS
This concept can be applied to OPUS ANIMUS by using LLMs to build personal knowledge bases for various topics of research interest. This can help to create a compounding effect of knowledge that can be applied to various fields and topics.

## Open Questions
- How can we effectively use LLMs to build and maintain personal knowledge bases?
- What are the potential applications of LLM knowledge bases in different fields?

## Audit Note
- 2026-05-31 - Retained as evergreen because it supports the Consilium wiki-agent operating model and maps to the tech learning lane.

## Applied
- Used LLMs to build personal knowledge bases for various topics of research interest.

## See Also
- [[karpathy-llm-wiki-pattern]]
- [[karpathy-llm-wiki-pattern-explained]]
- [[llm-wiki-agent-research]]

## Sources
- https://antigravity.codes/blog/karpathy-llm-wiki-idea-file
- https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

## See also
- [[gpt-5-release-rumours]] — GPT-5 Release Rumours
