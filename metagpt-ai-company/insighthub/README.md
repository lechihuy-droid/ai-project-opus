# InsightHub Reporting Co-pilot

AI Reporting Co-pilot dự thi **FPT Japan AI Hackathon 2026** — tự gom dữ liệu
Jira/WBS/Slack/GitHub/biên bản họp, đối soát chéo, phát hiện bất thường, và
soạn báo cáo trạng thái cho khách hàng (mặc định **tiếng Nhật keigo**).

## Cấu trúc

| Folder | Mô tả |
|---|---|
| **`mvp/`** | **Phase 1 — đang dùng.** Concept B: agent chạy trong VS Code + GitHub Copilot (Claude Sonnet). Không cần API key LLM riêng. Code đã chạy E2E, có pytest 16/16, đầy đủ SDD docs (RD/SD/BD/CR-001/CR-002), 4 wave hoàn tất. |
| **`next-phase/`** | **Phase 2 — định hướng.** Concept A: web app standalone (per SRS gốc). Docs-only: SRS, User Stories, roadmap để mở rộng MVP thành sản phẩm production. |
| **`brief/`** | Đề bài hackathon gốc — brief v1.0. |

## Quick start (MVP)

```
cd mvp
# Mặc định JP, không cần LLM (template-only fallback):
python -m insighthub generate --type weekly --no-llm
# Hoặc qua VS Code + Copilot (chính): mở mvp/ trong VS Code → Start MCP server → Copilot Chat agent + Sonnet
```

Chi tiết: `mvp/README.md` · spec ở `mvp/docs/` (RD · SD · BD · BD-waves · CR-001 · CR-002 · Test Plan · concept-comparison.html).

## Roadmap 2 phase

```
Phase 1 (MVP)  →  Phase 2 (production v2)
VS Code+Copilot   web app standalone
1 PM local        đa người dùng / RBAC / SSO
zero key          endpoint LLM duyệt riêng
file mode         live API
```

MVP đã đặt nền: pipeline Python, MCP server, anti-hallucination validator, đa
template, monthly, portfolio — Phase 2 tái dùng nguyên các phần này, chỉ thay
tầng UX và triển khai.
