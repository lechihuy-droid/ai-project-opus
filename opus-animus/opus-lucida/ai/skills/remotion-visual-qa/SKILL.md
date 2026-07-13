---
name: remotion-visual-qa
description: Use this skill to validate a rendered Remotion vertical video or still frames for content-template fit, subtitle continuity, safe areas, card overlap, arrow alignment, visual density, and render readiness. Use after rendering a Remotion explainer or when the user reports mismatched arrows, overlapping visuals, bad subtitle timing, or scenes that do not match narration.
---

# Remotion Visual QA

Validate the output visually and structurally before calling the video done.

## Inputs

```text
video-map.json
rendered mp4 path
still frames
Remotion app path
```

Read when needed:

- `references/qa-prompt.md`: visual review prompt.
- `references/frame-checklist.md`: concrete checks and fixes.

## Workflow

1. Export still frames at scene starts and midpoints.
2. Inspect frames visually.
3. Compare visible template against `video-map.json`.
4. Check subtitle continuity.
5. Check safe area and overlap.
6. Report pass/fail with exact fixes.
7. Patch renderer/data if needed, then re-render.

## Mandatory Checks

- Scene template matches narration intent.
- Subtitle is visible and not blank during active narration.
- Cards/nodes do not overlap.
- Arrows connect correct visual anchors.
- Diagram does not sit too high on screen.
- Text is readable on mobile.
- No visual object enters subtitle safe zone.
- Render completed without warnings that affect output.

## Brand QA (khi video-map có `brand` block)

Trước khi review bằng mắt, đọc `brand-check.json` (output của `npm run validate:brand`) — các vi phạm máy đã bắt được thì không cần soi lại, tập trung vào phần cần mắt người. Checklist theo `docs/market-research/12-quality-gates.md`:

- **Gate 3 — Recognition:** 3–5 giây đầu có ≥2 tín hiệu nhận diện (series label, core palette, typography, evidence badge language). Video vẫn nhận ra là Lucida nếu che logo.
- **Gate 4 — Visual consistency:** dark editorial base giữ nguyên; accent < ~10% frame; một dominant idea mỗi frame; icon/node/card cùng visual family; không neon rainbow / particle noise / progress bar.
- **Gate 5 — Motion meaning:** mỗi animation có chức năng (reveal/trace/focus); không zoom liên tục; metric có đủ hold time để đọc.
- **Non-negotiable (fail bất kể điểm):** claim vượt quá bằng chứng; subtitle sai timing rõ rệt; visual mất nhận diện Lucida; CTA gây sợ hãi không kèm agency; asset không rõ nguồn/bản quyền.

Ghi kết quả theo scorecard 8 gate của doc 12 (điểm /100); < 80 = phải sửa trước khi user duyệt.

## Completion Criteria

- Representative still frames inspected.
- Issues are either fixed or explicitly reported.
- Final answer includes output path and validation commands.
