# Predicting Performance of Symbolic and Prompt Programs with Examples

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.21515
**Published:** 2026-05-22 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

arXiv:2605.21515v1 Announce Type: new 
Abstract: LLM prompting is widely used for naturally stated tasks, yet it is unreliable it may succeed on a few test cases but fail at deployment time. We study performance prediction: given a program, either symbolic (e.g. Python) or a prompt executed on an LLM, and a few in-domain examples, predict its performance on unseen tasks from the same domain. We use a simple coin-flip model, treating each pass/fail program execution as a Bernoulli random variable, whose success probability is the programs unknown performance. In this model, performance depends entirely on: 1) the observed execution outcomes on test cases, and 2) a prior over performances. We compile empirical performance priors from a corpus of diverse programs and tasks, and find that perf
