---
title: "Karpathy's LLM Wiki: The Complete Guide to His Idea File"
topic: AI
tags: [llm, karpathy, wiki, knowledge-base]
sources: ["2026-04-28-2026-04-27-karpathy-llm-wiki-idea-file.md"]
related: ["[[karpathy-llm-wiki-pattern]]", "[[karpathy-llm-wiki-pattern-explained]]", "[[llm-wiki-agent-research]]"]
confidence: medium
created: 2026-04-28
updated: 2026-04-28
---

## Summary
Karpathy's viral tweet about LLM Knowledge Bases got a follow-up: a GitHub gist that lays out the full architecture. We go through it word by word — every concept, every tool, every technique — with implementation examples and code. The idea is to use LLMs to build personal knowledge bases for various topics of research interest.

## Key points
- Karpathy's LLM Knowledge Bases concept uses LLMs to build personal knowledge wikis instead of just generating code.
- The system consists of a `raw/` directory for raw source documents and an LLM that incrementally compiles them into a structured wiki.
- The wiki is a collection of interlinked `.md` files with summaries, backlinks, and concept articles.

## Details
The original tweet described Karpathy's shift from spending tokens on code to spending tokens on knowledge. He outlined a system where raw source documents get dropped into a `raw/` directory, and an LLM incrementally compiles them into a structured wiki. The wiki is a collection of interlinked `.md` files with summaries, backlinks, and concept articles.

## See also
- [[gpt-5-release-rumours]] — GPT-5 Release Rumours
[[karpathy-llm-wiki-pattern]]
[[karpathy-llm-wiki-pattern-explained]]
[[llm-wiki-agent-research]]

## Sources
- C:\\Users\\HUY\\AI\\OPUS ANIMUS\\personal-agent\\raw\\articles\\2026-04-27-karpathy-llm-wiki-idea-file.md
