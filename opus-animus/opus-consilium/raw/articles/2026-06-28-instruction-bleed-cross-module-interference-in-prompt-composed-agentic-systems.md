# Instruction Bleed: Cross-Module Interference in Prompt-Composed Agentic Systems

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2606.26356
**Published:** 2026-06-27 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Instruction Bleed: prompt cac module agent gay nhieu cheo lan nhau. -> Doc de tranh loi khi ghep nhieu skill/prompt trong he agent cua ban; thu kiem tra interference.

arXiv:2606.26356v1 Announce Type: new
Abstract: Practitioners of prompt-composed agentic systems report a recurring failure mode: editing one prompt module silently shifts the behavior of others despite no shared variable or executable dependency. We formalize this as compositional behavioral leakage (CBL): interference between modules sharing a context window. CBL is enabled by architectural non-isolation: transformer self-attention provides no formal boundary between concatenated modules. We probe CBL on a deployed job-evaluation agent (Claude Sonnet 4.6, 144 trials) through a reusable three-channel protocol that perturbs non-focal modules along volume, content, and form. Only the content channel produces a detectable paired effect (Cohen's d = 0.63, bootstrap 95% CI excluding zero); no
