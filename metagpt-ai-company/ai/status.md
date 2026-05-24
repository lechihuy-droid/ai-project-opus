# STATUS — metagpt-ai-company
**Updated:** 2026-05-24
**Current owner:** Claude (since 2026-05-24)

## Active sub-systems

| Sub-system | Status | Note |
|---|---|---|
| MetaGPT wrapper (`scripts/`, `prompts/`, `config/`) | Stable | Setup xong, chưa chạm trong session này |
| InsightHub MVP (`insighthub/mvp/`) | W1-W4 đã code, chưa verify | Pipeline ra DOCX/PDF/MD; cần pytest + E2E lại |
| InsightHub MVP — HTML Dashboard Report | Discovery | RD cũ (`RD-aggregate-report-html.md`) đã superseded; pivot HTML-primary McKinsey-style; mockup target sẵn ở `mvp/docs/mockups/`; RD hợp nhất chưa viết |
| Output workspace (`workspace/`) | Stable | Không chạm |

## Current objective

> Chốt approach (UI-REVIEW trước hay RD thẳng), rồi viết RD hợp nhất "HTML Dashboard Report" cho InsightHub MVP theo pivot HTML-primary / DOCX-secondary.

## Constraints

- Keep upstream `MetaGPT/` clean — không sửa.
- Secrets chỉ ở `%USERPROFILE%/.metagpt/config2.yaml`.
- SDD bắt buộc: RD approve trước khi sang SD/BD/code (lessons từ `CLAUDE.md`).
- Coding/test → giao Codex; Claude viết RD/SD/BD và review.
- Không weaken anti-hallucination layer của pipeline hiện tại.

## Nếu bị gián đoạn

→ Đọc `ai/handoff-claude.md`
