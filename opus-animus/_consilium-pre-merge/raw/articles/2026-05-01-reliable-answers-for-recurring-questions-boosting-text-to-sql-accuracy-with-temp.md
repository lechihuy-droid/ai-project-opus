# Reliable Answers for Recurring Questions: Boosting Text-to-SQL Accuracy with Template Constrained Decoding

**Source:** hf-papers
**URL:** https://huggingface.co/papers/2604.28028
**Published:** 2026-05-01 20:30 UTC
**Topic:** AI

Large language models (LLMs) have revolutionized Text-to-SQL generation, allowing users to query structured data using natural language with growing ease. Yet, real-world deployment remains challenging, especially in complex or unseen schemas, due to inconsistent accuracy and the risk of generating invalid SQL. We introduce Template Constrained Decoding (TeCoD), a system that addresses these limitations by harnessing the recurrence of query patterns in labeled workloads. TeCoD converts historical NL-SQL pairs into reusable templates and introduces a robust template selection module that uses a fine-tuned natural language inference model to match or reject queries efficiently. Once the template is selected, TeCoD enforces it during SQL generation through grammar-constrained decoding, implem
