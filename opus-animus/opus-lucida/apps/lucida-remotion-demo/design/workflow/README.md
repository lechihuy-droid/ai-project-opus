# Lucida Workflow Architecture

- **Status:** roadmap / aspirational — toàn bộ G-gate spec trong thư mục này CHƯA được implement trong code
- **Date:** 2026-07-12
- **Scope:** workflow specifications, artifact contracts, validation policies, governance rules cho pipeline create-video
- **Role:** rule / policy (định hướng tương lai)
- **Owner layer:** project architect
- **Parent:** `opus-lucida/10-project-architecture-map.md`, `opus-lucida/11-current-operating-flow.md`
- **Supersedes:** (none)
- **Superseded by:** (none)

File này trả lời câu hỏi: **spec pipeline lý tưởng (G00–G12) khác gì với code đang chạy thật, và phần nào đã/chưa tồn tại?**

> **Flow production active (approved 2026-07-14):** xem [`FLOW_V1.md`](FLOW_V1.md) — flow S0–S6 nối market research → script → audio → mapping → render → QA → publish, kèm map G-gate → stage và milestones M1–M5. G00–G12 giữ vai trò north star, không implement full ở v1.

## Implementation Status (spec vs code thực tế)

Toàn bộ spec dưới đây mô tả **pipeline mục tiêu** với approval gates, immutable artifacts, checksums, state machine. **Code hiện tại KHÔNG có các cơ chế đó.** Thực tế đang chạy là flow skill-orchestrated đơn giản (xem `opus-lucida/11-current-operating-flow.md` và `ai/skills/remotion-script-to-video/SKILL.md`).

| Gate spec | Tương đương trong code hiện tại | Trạng thái |
|---|---|---|
| G00–G01 (init/normalize) | `source-ingestor-cleaner` skill → `clean-brief.json` | Một phần (agent-driven, không có ProjectEnvelope/state machine) |
| G02 (script timing) | Không có — caption timing chia đều tuyến tính trong `templateRegistry.tsx` | Chưa có |
| G03–G07 (brief/story/scene/resource) | `script-template-mapper` skill → `video-map.json` | Một phần (gộp thành 1 bước LLM, không có approval record) |
| G08–G09 (binding/VideoSpec) | `video-map.json` + `src/data.ts` (TS cast) + `scripts/validate-video-map.mjs` | Một phần (JSON-Schema validate, không immutable/versioned) |
| G10 (preview) | `npm run qa:stills` (still frames per scene) | Một phần |
| G11 (render) | `npm run render` → `scripts/render-run.mjs` (spawnSync `remotion render`) | Một phần — KHÔNG có ApprovalRecord gate, checksum, audio mux (video hiện tại không có audio track) |
| G12 (publish) | Không có | Chưa có |
| `contracts/` (VoiceTrack, ApprovalRecord, …) | Không có artifact nào được sinh/validate theo contract này | Chưa có |
| `governance/`, `validation/` (state machine, retry, cache) | Không có | Chưa có |

Mỗi file spec trong `create/`, `contracts/`, `governance/`, `validation/` đều có banner `Status: roadmap` ở đầu file.

## Structure

- `create/` — gate-by-gate Create Workflow specifications.
- `contracts/` — versioned input/output artifact contracts.
- `validation/` — cross-gate verification, retry, cache, and failure-routing policies.
- `governance/` — events, state machines, versioning, and artifact lifecycle.

## Reading order

1. [`create/CREATE_WORKFLOW.md`](create/CREATE_WORKFLOW.md)
2. The relevant gate in `create/`
3. Contracts named by that gate
4. Shared validation policies
5. Governance rules

The gate/artifact ownership map is [`contracts/ARTIFACT_INDEX.md`](contracts/ARTIFACT_INDEX.md).

## Architectural rule

Workflow documents define **when and why transformations run**. Contracts define **what data is accepted and produced**. Validation documents define **how correctness is proven**. Governance documents define **how state, ownership, versioning, and auditability are managed**.

Superseded workflow documents live in [`../history/workflow/`](../history/workflow/). They are retained for audit and migration context only.
