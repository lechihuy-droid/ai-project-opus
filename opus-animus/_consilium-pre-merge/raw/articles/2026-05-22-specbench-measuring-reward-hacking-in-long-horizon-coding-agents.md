# SpecBench: Measuring Reward Hacking in Long-Horizon Coding Agents

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.21384
**Published:** 2026-05-21 20:30 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3

As long-horizon coding agents produce more code than any developer can review, oversight collapses onto a single surface: the automated test suite. Reward hacking naturally arises in this setup, as the agent optimizes for passing tests while deviating from the users true goal. We study this reward hacking phenomenon by decompose software engineering tasks into three parts: (i) a natural language description of the specification (ii) visible validation tests that exercise specified features in isolation, and (iii) held-out tests that compose those same features to simulate real-world usage. Based on the specification and the visible validation test suites, a genuine agent would be able to generate a solution that can also pass all of the held-out tests. Therefore we use the gap in pass rate | 👍 3
