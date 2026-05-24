# Learning Rate Transfer in Normalized Transformers

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.27077
**Published:** 2026-05-01 04:00 UTC
**Topic:** AI

arXiv:2604.27077v1 Announce Type: new 
Abstract: The Normalized Transformer, or nGPT (arXiv:2410.01131) achieves impressive training speedups and does not require weight decay or learning rate warmup. However, despite having hyperparameters that explicitly scale with model size, we observe that nGPT does not exhibit learning rate transfer across model dimension and token horizon. To rectify this, we combine numerical experiments with a principled use of alignment exponents (arXiv:2407.05872) to revisit and modify the $\mu$P approach to hyperparameter transfer (arXiv:2011.14522). The result is a novel nGPT parameterization we call $\nu$GPT. Through extensive empirical validation, we find $\nu$GPT exhibits learning rate transfer across width, depth, and token horizon.
