---
title: "Automated Ontology Generation with LLMs"
aliases: []
topic: AI
tags: ["ontology-generation", "llms", "multi-agent-approach"]
status: seed
confidence: medium
sources: ["https://arxiv.org/abs/2604.23090"]
related: ["[[large-language-models-debugging]]", "[[llm-wiki-agent-research]]"]
applied: []
open_questions: ["How can this approach be applied to improve the efficiency of ontology generation in OPUS ANIMUS?"]
created: 2026-05-19
updated: 2026-05-19
---

# Automated Ontology Generation with LLMs

## Summary
Automated ontology generation from unstructured text is a central challenge in knowledge engineering. Recent studies have shown promise in using large language models (LLMs) for this task, but the architectural design choices driving generation quality remain unclear.

## Key Points
- A multi-agent LLM approach can be used for automated ontology generation.
- The approach involves decomposing ontology construction into four artifact-driven roles: Domain Expert, Manager, Coder, and Qualifier.
- The study establishes a single-agent LLM baseline and identifies key failure modes such as poor Ontology Design Pattern compliance, structural redundancy, and ineffective iterative repair.

## Why It Matters
Automated ontology generation is crucial for efficient knowledge engineering, and LLMs have the potential to revolutionize this field. Understanding the architectural design choices driving generation quality can help improve the performance of LLMs in this task.

## Details
The multi-agent approach involves four roles, each with a specific responsibility in the ontology generation process. The Domain Expert provides domain-specific knowledge, the Manager oversees the process, the Coder generates the ontology, and the Qualifier evaluates the generated ontology. This approach can help address the limitations of single-agent LLMs and improve the quality of generated ontologies.

## Application To OPUS ANIMUS
The automated ontology generation approach can be applied to improve the efficiency of knowledge engineering in OPUS ANIMUS. By using LLMs to generate ontologies, OPUS ANIMUS can reduce the time and effort required for knowledge engineering and improve the quality of the generated ontologies.

## Open Questions
- How can the multi-agent approach be integrated with existing knowledge engineering tools and workflows in OPUS ANIMUS?
- What are the potential limitations and challenges of using LLMs for automated ontology generation in OPUS ANIMUS?

## Applied

## See Also
- [[large-language-models-debugging]]
- [[llm-wiki-agent-research]]

## Sources
- https://arxiv.org/abs/2604.23090