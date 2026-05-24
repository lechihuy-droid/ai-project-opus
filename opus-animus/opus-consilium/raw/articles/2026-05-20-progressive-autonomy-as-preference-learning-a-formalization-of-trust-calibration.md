# Progressive Autonomy as Preference Learning: A Formalization of Trust Calibration for Agentic Tool Use

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2605.19151
**Published:** 2026-05-20 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.19151v1 Announce Type: new 
Abstract: We formalize trust calibration for agentic tool use (deciding when an automated agent's proposed action may execute autonomously versus require human approval) as a preference-learning problem. A policy gateway maintains a Gaussian-process posterior over a latent human risk-tolerance function, observed through a probit likelihood on binary approve/deny feedback, and escalates to the human exactly where the approval outcome is most uncertain. We show this is structurally an instance of Preferential Bayesian Optimization, inheriting its inference machinery (approximate Gaussian-process classification) and its sample-efficiency argument (uncertainty-targeted querying), while differing in objective: classifying an action space into allow/block/a
