# PExA: Parallel Exploration Agent for Complex Text-to-SQL

**Source:** arxiv-ai
**URL:** https://arxiv.org/abs/2604.22934
**Published:** 2026-04-29 04:00 UTC
**Topic:** AI

arXiv:2604.22934v1 Announce Type: new 
Abstract: LLM-based agents for text-to-SQL often struggle with latency-performance trade-off, where performance improvements come at the cost of latency or vice versa. We reformulate text-to-SQL generation within the lens of software test coverage where the original query is prepared with a suite of test cases with simpler, atomic SQLs that are executed in parallel and together ensure semantic coverage of the original query. After iterating on test case coverage, the final SQL is generated only when enough information is gathered, leveraging the explored test case SQLs to ground the final generation. We validated our framework on a state-of-the-art benchmark for text-to-SQL, Spider 2.0, achieving a new state-of-the-art with 70.2% execution accuracy.
