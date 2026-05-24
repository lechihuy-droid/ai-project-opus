---
title: Ingest Research Paper
category: wiki
tags: [ingest, pdf, research, arxiv]
status: active
created: 2026-05-01
uses: 1768
---

## When to use
Khi ingest academic paper từ arXiv URL hoặc file PDF.

## Procedure
1. Convert PDF → markdown (markitdown tự xử lý)
2. Extract và ưu tiên: title, authors, abstract, key contributions, methodology, results
3. Paper > 20 trang: summarize theo section, không cố đọc hết trong 2500 chars đầu
4. Category = "papers", không phải "articles"
5. Tags nên có: tên method/model chính, domain (NLP/CV/RL...), năm

## Notes
- Luôn extract "Key Contributions" dạng bullet points trong wiki page
- "Application To OPUS ANIMUS" section: liên kết với personal goals (AI research, stock, PMP)
- Nếu paper có code/repo: thêm link vào Sources section
- Tránh duplicate: check INDEX xem đã có page về method/topic đó chưa trước khi create
