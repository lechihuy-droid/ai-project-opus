# When Does Combining Language Models Help? A Co-Failure Ceiling on Routing, Voting, and Mixture-of-Agents Across 67 Frontier Models

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2606.27288
**Published:** 2026-06-27 16:07 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Khảo sát 67 model: routing/voting/mixture-of-agents bị trần co-failure, gộp model không luôn thắng single. -> Read để hiệu chỉnh kỳ vọng multi-agent của mình.

Multi-model LLM systems such as routing, voting, cascades, fusion, and mixture-of-agents are used to beat single-model accuracy. We show that their gain is capped by a quantity the field rarely reports. For any policy whose output is one member model answer, accuracy cannot exceed one minus beta, where beta is the rate at which every model is wrong on the same query. In contrast, the usual diagnostic, average pairwise error correlation rho, cannot identify beta: error laws with identical marginals and pairwise correlations can have different all-wrong rates. A Clopper-Pearson bound on beta gives a finite-sample certificate on the largest gain any router, vote, or cascade could deliver before training a router.
  Across 67 models from 21 providers, a tetrachoric-calibrated single-factor mod | 👍 3
