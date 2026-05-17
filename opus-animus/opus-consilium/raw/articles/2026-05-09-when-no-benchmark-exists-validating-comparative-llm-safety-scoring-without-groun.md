# When No Benchmark Exists: Validating Comparative LLM Safety Scoring Without Ground-Truth Labels

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.06652
**Published:** 2026-05-09 17:32 UTC
**Topic:** AI
**Tier:** 1
**Goal-Score:** 4
**Relevance:** Nghiên cứu về đánh giá an toàn LLM -> Cung cấp thông tin cho CTO về tầm quan trọng của AI governance trong SDLC.

Many deployments must compare candidate language models for safety before a labeled benchmark exists for the relevant language, sector, or regulatory regime. We formalize this setting as benchmarkless comparative safety scoring and specify the contract under which a scenario-based audit can be interpreted as deployment evidence. Scores are valid only under a fixed scenario pack, rubric, auditor, judge, sampling configuration, and rerun budget. Because no labels are available, we replace ground-truth agreement with an instrumental-validity chain: responsiveness to a controlled safe-versus-abliterated contrast, dominance of target-driven variance over auditor and judge artifacts, and stability across reruns.
  We instantiate the chain in SimpleAudit, a local-first scoring instrument, and val | 👍 2
