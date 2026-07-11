> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

﻿# Workflow Artifact Index

| Artifact | Producer | Primary consumers | Contract |
|---|---:|---|---|
| `ProjectEnvelope` | G00 | G01, governance | [`PROJECT_ENVELOPE.md`](PROJECT_ENVELOPE.md) |
| `ProjectSpec` | G01 | G02–G09 | [`PROJECT_SPEC.md`](PROJECT_SPEC.md) |
| `VoiceTrack` | G02 | G09–G11 | [`VOICE_TRACK.md`](VOICE_TRACK.md) |
| `TimedScript` | G02 | G03–G10 | [`TIMED_SCRIPT.md`](TIMED_SCRIPT.md) |
| `CaptionPlanDraft` | G02 | G07–G10 | [`CAPTION_PLAN_DRAFT.md`](CAPTION_PLAN_DRAFT.md) |
| `CreativeBrief` | G03 | G04–G07 | [`CREATIVE_BRIEF.md`](CREATIVE_BRIEF.md) |
| `StoryPlan` | G04 | G05–G09 | [`STORY_PLAN.md`](STORY_PLAN.md) |
| `SceneRequirements` | G05 | G06–G07 | [`SCENE_REQUIREMENTS.md`](SCENE_REQUIREMENTS.md) |
| `ResourcePlan` | G06 | G07–G08 | [`RESOURCE_PLAN.md`](RESOURCE_PLAN.md) |
| `CreativePlan` | G07 | G08–G09 | [`CREATIVE_PLAN.md`](CREATIVE_PLAN.md) |
| `ImplementationPlan` | G08 | G09 | [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) |
| `VideoSpec` | G09 | G10–G11 | [`VIDEOSPEC.md`](VIDEOSPEC.md) |
| `PreviewBundle` | G10 | approval review | [`PREVIEW_BUNDLE.md`](PREVIEW_BUNDLE.md) |
| `IssueReport` | G10 | owning repair gates | [`ISSUE_REPORT.md`](ISSUE_REPORT.md) |
| `ApprovalRecord` | G10/reviewer | G11–G12 | [`APPROVAL_RECORD.md`](APPROVAL_RECORD.md) |
| `VideoArtifact` | G11 | G12 | [`VIDEO_ARTIFACT.md`](VIDEO_ARTIFACT.md) |
| `RenderReport` | G11 | G12 | [`RENDER_REPORT.md`](RENDER_REPORT.md) |
| `PublicationBundle` | G12 | publication targets | [`PUBLICATION_BUNDLE.md`](PUBLICATION_BUNDLE.md) |
