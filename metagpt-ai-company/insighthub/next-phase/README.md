# Phase 2 — v2 Direction (Web App)

Sau khi MVP (Phase 1, đường Copilot/VS Code) chạy ổn, đây là hướng triển khai
diện rộng cho FPT Japan: **web application standalone**.

> Phase 2 hiện ở dạng **docs-only**. Chưa code. Pipeline Python từ `mvp/` được
> tái dùng nguyên (không viết lại), chỉ thay tầng UX và hạ tầng triển khai.

## Khác biệt với MVP

| Khía cạnh | MVP (Phase 1, `mvp/`) | Phase 2 (web) |
|---|---|---|
| Cách giao | Bộ MCP tool + prompt nạp vào Copilot của PM | App web standalone — deploy AWS/Azure/on-prem |
| LLM runtime | License Copilot có sẵn — không cần key | Endpoint LLM duyệt riêng (Bedrock / Azure OpenAI / Anthropic) — secret manager |
| UX review | VS Code editor + Copilot Chat | Split-pane review UI (React/Vue) tự xây, citation clickable |
| Conversational refinement | Copilot Chat native | Chat widget tự xây gọi LLM |
| Đa người dùng / RBAC | Không (1 PM, chạy local) | Có — SSO/SAML, role PM/DM/Admin/Viewer |
| Scheduled mode | Yếu (VS Code là interactive) | Native — cron / Celery Beat |
| Live API connector | Stub functional (httpx, mocked test) — `mvp/insighthub_mcp/adapters/api_adapter.py` | OAuth/token thật, secret manager, rate-limit handling |
| Audit log | File markdown | DB append-only (CloudWatch / Datadog / ELK) |
| Portfolio | CLI `--type portfolio` | Dashboard tương tác |

## Spec gốc (đầy đủ — tham khảo)

- **`SRS_InsightHub_Agent.md`** — Software Requirements Specification: FR (FR-CONN, FR-RECON, FR-ANOM, FR-RGEN, FR-TMPL, FR-LANG, FR-REVIEW, FR-EXPORT, FR-SCHED, FR-AUDIT), NFR, data model. Mô tả full sản phẩm web.
- **`User_Stories_InsightHub_Agent.md`** — 30 user story chia 9 epic, Given/When/Then, business rule, MoSCoW priority.

(SRS được viết theo kiến trúc Concept A web. MVP (`mvp/`) cố ý cắt scope và đổi
sang Concept B. Khi xây Phase 2, tham chiếu lại SRS làm contract.)

## Phần tái dùng từ MVP (không viết lại)

- Pipeline Python: `datasource → reconcile → anomalies → facts → validate → export`
- Anti-hallucination validator (cốt lõi — `mvp/insighthub/validate.py`)
- i18n + đa template engine (`mvp/insighthub/i18n.py`, `mvp/templates/registry.yaml`)
- 16 rule anomaly + bug metric (`mvp/insighthub/anomalies.py`, `reconcile.py`)
- Monthly/portfolio/diff modules (`mvp/insighthub/monthly.py`, `portfolio.py`, `diff.py`)
- MCP server architecture (`mvp/insighthub_mcp/`) — có thể giữ làm internal protocol giữa frontend/backend, hoặc bỏ.

## Phần cần xây mới ở Phase 2

| | Việc |
|---|---|
| 1 | Web frontend (React/Vue) — split-pane review UI, table-of-contents, inline edit, conversational chat |
| 2 | Backend API (FastAPI / Express) bọc pipeline Python |
| 3 | Database (PostgreSQL): audit log append-only, mapping Jira↔WBS persist, edit history, schedule config |
| 4 | Auth: SSO SAML/OAuth + JWT session, RBAC (Admin/PM/DM/Viewer) |
| 5 | Secret manager: AWS Secrets / Azure Key Vault / Vault — không hardcode token |
| 6 | Live API adapters: hoàn thiện từ MVP stub — OAuth, rate-limit, retry |
| 7 | Scheduled mode: Celery Beat / cron, retry với backoff |
| 8 | Deploy: Docker + IaC, observability (logs/metrics/traces) |

Tham khảo brief gốc: `../brief/AI_Hackathon_InsightHub_Agent_Brief.md` §4 (NFR), §8 (rubric — Phase 2 nhắm điểm Architecture/Security 5/5, Review UX 5/5, Scheduled, Portfolio).
