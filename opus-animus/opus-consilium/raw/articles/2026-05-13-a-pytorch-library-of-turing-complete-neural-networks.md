# A PyTorch Library of Turing-Complete Neural Networks

**Source:** arxiv-lg
**URL:** https://arxiv.org/abs/2605.08150
**Published:** 2026-05-12 04:00 UTC
**Topic:** AI
**Tier:** 3
**Goal-Score:** 4
**Relevance:** PyTorch Library của Turing-Complete Neural Networks. -> Có thể áp dụng cho FleziPT để tăng khả năng

arXiv:2605.08150v1 Announce Type: new 
Abstract: We present a PyTorch package that compiles neural networks and their weights from Turing machine descriptions, producing models that exactly simulate the specified machine without any training. Given a transition function and a set of terminal states, the package constructs a model whose forward pass corresponds to one step of the Turing machine. Two architectures are implemented, each realizing a different theoretical result: (1) a transformer with self-attention, cross-attention, and feedforward layers based on Wei, Chen, and Ma (2021), and (2) a recurrent network based on Siegelmann and Sontag (1995) that encodes the stack in a Cantor set. We develop the constructions from first principles, showing how ReLU networks implement Boolean circ
