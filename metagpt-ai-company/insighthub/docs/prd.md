# InsightHub Agent — PRD (MVP 1 ngày)

> Artifact Stage 1 (ProductManager). Nguồn: `AI_Hackathon_InsightHub_Agent_Brief.md`
> + `SRS_InsightHub_Agent.md` + `User_Stories_InsightHub_Agent.md`. Đây là bản
> **triage** — cắt SRS đầy đủ xuống scope chạy được trong 1 ngày.

## Original requirement

AI co-pilot gom dữ liệu Jira / WBS / Slack-Teams / GitHub / biên bản họp, đối
soát chéo, sinh **báo cáo tuần** truy vết được cho Front PM FPT Japan.

## Product goals

1. **Demo E2E chạy được** trên dữ liệu mẫu — `load → reconcile → report → export`.
2. **Zero hallucination** — mọi số/ticket trong báo cáo phải truy về nguồn.
3. **Đối soát chéo thật** — phát hiện ≥85% anomaly giám khảo gài (không phải forward LLM).

## User stories (MVP)

- Là Front PM, tôi chạy 1 lệnh → có báo cáo tuần đầy đủ 9 mục trong < 60s.
- Là Front PM, tôi click mọi con số → thấy nguồn (Jira key / commit / Slack / biên bản).
- Là PM, tôi nhận cảnh báo các tín hiệu rủi ro chéo nguồn (done-no-code, slippage…).

## Requirement pool

| Ưu tiên | Hạng mục | Rubric |
|---|---|---|
| **P0** | Ingest 5 nguồn ở chế độ file (Jira/WBS/Slack/GitHub/minutes) | Data Coverage 15 |
| **P0** | Reconcile + 15 anomaly rule, ≥85% precision | Reconciliation 15 |
| **P0** | Báo cáo tuần 9 mục sinh từ facts đã tính sẵn | Report Content 15 |
| **P0** | Citation từng fact + `traceability.json` + validator chặn bịa | Citation 10 |
| **P1** | Template engine — fill DOCX 1 template | Template 10 |
| **P1** | Export DOCX + Markdown | Report Content |
| **P1** | Audit log + connections.yaml (secret refs) | Architecture 5 |
| **P2** | Đa ngôn ngữ JP keigo (đổi prompt) | Tone 10 |

## Out of scope (MVP 1 ngày)

Live API/OAuth · báo cáo tháng · portfolio roll-up · conversational refinement ·
scheduled mode · review UI web · PDF/PPTX/Confluence · diff vs báo cáo trước.

## UI

CLI: `python -m insighthub generate --type weekly --lang en`. Không có web UI.

## G1 — cổng duyệt

Scope trên đã chốt → sang Stage 2 (system_design).
