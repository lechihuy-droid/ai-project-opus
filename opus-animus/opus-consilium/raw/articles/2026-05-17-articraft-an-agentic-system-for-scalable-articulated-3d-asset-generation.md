# Articraft: An Agentic System for Scalable Articulated 3D Asset Generation

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.15187
**Published:** 2026-05-17 13:42 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Articraft giúp tạo tài sản 3D với hệ thống agentic -> đọc và lưu để nghiên cứu sau

A bottleneck in learning to understand articulated 3D objects is the lack of large and diverse datasets. In this paper, we propose to leverage large language models (LLMs) to close this gap and generate articulated assets at scale. We reduce the problem of generating an articulated 3D asset to that of writing a program that builds it. We then introduce a new agentic system, Articraft, that writes such programs automatically. We design a programmatic interface and harness to help the LLM do so effectively. The LLM writes code against a domain-specific SDK for defining parts, composing geometry, specifying joints, and writing tests to validate the resulting assets. The harness exposes a restricted workspace and interface to the LLM, validates the resulting assets, and returns structured feed
