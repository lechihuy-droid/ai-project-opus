# Detecting Clinical Discrepancies in Health Coaching Agents: A Dual-Stream Memory and Reconciliation Architecture

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.27045
**Published:** 2026-05-01 04:00 UTC
**Topic:** AI

arXiv:2604.27045v1 Announce Type: new 
Abstract: As Large Language Model (LLM) agents transition from single-session tools to persistent systems managing longitudinal healthcare journeys, their memory architectures face a critical challenge: reconciling two imperfect sources of truth. The patient's evolving self-report is current but prone to recall bias, while the Electronic Health Record (EHR) is medically validated but frequently stale. General-purpose agent memory systems optimize for coherence by overwriting older facts with the user's latest statement, a pattern that risks safety failures when applied to clinical data. We introduce a Dual-Stream Memory Architecture that strictly separates the patient narrative from the structured clinical record (FHIR), governed by a dedicated Reconc
