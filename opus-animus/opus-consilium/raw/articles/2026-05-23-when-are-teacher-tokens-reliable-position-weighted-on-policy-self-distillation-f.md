# When Are Teacher Tokens Reliable? Position-Weighted On-Policy Self-Distillation for Reasoning

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.21606
**Published:** 2026-05-22 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.21606v1 Announce Type: new 
Abstract: On-policy self-distillation (OPSD) trains a student on its own rollouts using a privileged teacher, but its standard objective weights all generated tokens equally, implicitly treating the privileged teacher target as equally reliable at every student-visited prefix. Existing entropy-based OPD methods relax this uniformity by modulating token-level supervision with teacher entropy, but high teacher entropy in reasoning has an ambiguous reliability meaning: it can reflect either non-viable uncertainty or benign solution diversity. To identify this phenomenon, we introduce a branch-viability diagnostic. Specifically, we record next-token alternatives from the privileged-answer teacher prompt, force each alternative after the student prompt plu
