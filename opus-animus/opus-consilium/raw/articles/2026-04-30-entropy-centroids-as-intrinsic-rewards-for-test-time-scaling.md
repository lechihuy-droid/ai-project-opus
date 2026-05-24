# Entropy Centroids as Intrinsic Rewards for Test-Time Scaling

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.26173
**Published:** 2026-04-30 04:00 UTC
**Topic:** AI

arXiv:2604.26173v1 Announce Type: new 
Abstract: An effective way to scale up test-time compute of large language models is to sample multiple responses and then select the best one, as in Grok Heavy and Gemini Deep Think. Existing selection methods often rely on external reward models, which requires training a strong reward model and introduces additional computation overhead. As an alternative, previous approaches have explored intrinsic signals, such as confidence and entropy, but these signals are noisy with naive aggregation. In this work, we observe that high-entropy tokens tend to cluster into consecutive groups during inference, providing a more stable notion of model uncertainty than individual tokens. Together, these clusters reveal temporal patterns of model uncertainty through
