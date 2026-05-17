# reward-lens: A Mechanistic Interpretability Library for Reward Models

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2604.26130
**Published:** 2026-04-30 04:00 UTC
**Topic:** AI

arXiv:2604.26130v1 Announce Type: new 
Abstract: Every RLHF-trained language model is shaped by a reward model, yet the mechanistic interpretability toolkit -- logit lens, direct logit attribution, activation patching, sparse autoencoders -- was built for generative LLMs whose primitives all project onto a vocabulary unembedding. Reward models replace that with a scalar regression head, breaking each tool. We present reward-lens, an open-source library that ports this toolkit to reward models, organised around one observation: the reward head's weight vector $w_r$ is the natural axis for every interpretability question. The library provides a Reward Lens, component attribution, three-mode activation patching, a reward-hacking probe suite, TopK SAE feature attribution, cross-model compariso
