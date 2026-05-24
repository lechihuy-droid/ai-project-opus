# Operationalizing Document AI: A Microservice Architecture for OCR and LLM Pipelines in Production

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.18818
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.18818v1 Announce Type: new 
Abstract: Academic research tends to focus on new models for document understanding creating a wide gap in the literature between model definition and running models at production scale. To close that gap, we present a microservice architecture that encapsulates pipelines of multiple models for classification, optical character recognition (OCR), and large language model structured field extraction as well as our experience running this pipeline on thousands of multi-page documents per hour. We describe our primary design decisions, including a hybrid classification, separation of GPU-bound inference from CPU-bound orchestration, use of asynchronous processing for the many IO-bound operations in the pipeline, and an independent, horizontal scaling str
