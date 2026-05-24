# Rethinking Agentic Search with Pi-Serini: Is Lexical Retrieval Sufficient?

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2605.10848
**Published:** 2026-05-12 15:48 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 3
**Relevance:** Pi-Serini về tìm kiếmlexical. -> Tăng cường khả năng tìm kiếm cho FleziPT

Does a lexical retriever suffice as large language models (LLMs) become more capable in an agentic loop? This question naturally arises when building deep research systems. We revisit it by pairing BM25 with frontier LLMs that have better reasoning and tool-use abilities. To support researchers asking the same question, we introduce Pi-Serini, a search agent equipped with three tools for retrieving, browsing, and reading documents. Our results show that, on BrowseComp-Plus, a well-configured lexical retriever with sufficient retrieval depth can support effective deep research when paired with more capable LLMs. Specifically, Pi-Serini with gpt-5.5 achieves 83.1% answer accuracy and 94.7% surfaced evidence recall, outperforming released search agents that use dense retrievers. Controlled ab
