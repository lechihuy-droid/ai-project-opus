---
name: script-template-mapper
description: Use this skill to analyze a long video script, split it into intent-based scenes, choose the best Remotion template archetype for each scene, and produce a validated video-map JSON contract before any React/Remotion implementation. Use for technical explainers, AI/LLM content, Vietnamese shorts, diagram videos, template selection, or when visuals do not map well to narration.
---

# Script Template Mapper

Convert a cleaned brief or narration into a template-ready JSON plan. Do not write React here.

## Output Contract

Produce `video-map.json` with:

```text
video metadata
scenes[]
scene intent
cataloged templateId
templateRole
render content
subtitle/narration
reason for mapping
visual density and constraints
```

Read these references when needed:

- `references/llm-prompt.md`: prompt to send to an LLM for mapping.
- `references/template-taxonomy.md`: template choices and mapping rules.
- `references/video-map-schema.md`: required JSON structure.
- `apps/lucida-remotion-demo/design/visual-library/index.json`: reusable visual families.
- `apps/lucida-remotion-demo/design/motion-library/index.json`: reusable motion presets.
- `apps/lucida-remotion-demo/design/directors/selection-rules.json`: scoring, continuity, and hard constraints.
- `apps/lucida-remotion-demo/design/prompts/select-style.md`: style-director prompt for mapping script + clean brief to JSON.

## Workflow

1. Prefer `clean-brief.json` when available; otherwise use the raw script.
2. Segment by meaning, not by paragraph length.
3. Assign exactly one primary intent per scene.
4. Read `apps/remotion-templates/template-catalog.json`.
5. Read the Lucida design director files in `apps/lucida-remotion-demo/design/`.
6. Choose one visual family and one cataloged `templateId` per scene.
7. Prefer `templateId` values supported by `src/templateRegistry.tsx` when a runnable video is required immediately.
8. Assign `layout` per scene (xem "Layout Selection" bên dưới) — chọn theo scene intent, rồi kiểm tra anti-monotony rules trên toàn video trước khi chốt.
9. Use `visualReferences` as style guidance and `usableAssets` only as explicit embed candidates.
10. Extract only visual content needed by that template.
11. Keep long narration in `subtitle.text`, not in card labels.
12. Add `reason` to explain why the template and layout fit the scene.
13. Validate duration, density, object count, and continuity.

## Theme Skin

- `theme.skin` (optional) chọn UI skin cho toàn video: `"premium-gold"` (default, editorial vàng champagne) hoặc `"modern-terminal"` (khung cửa sổ terminal, mono font, phosphor green/ANSI, typing + cursor).
- Chọn `"modern-terminal"` khi content là ai_news / dev / code-heavy / tool-focused; giữ default cho content editorial/premium.

## Scene Intent Set

Use only these intents unless the user explicitly extends the schema:

```text
hook
problem
comparison
process
system_architecture
list
use_case
takeaway
quote
code_explanation
```

## Brand Block (bắt buộc khi input có series/brand)

Khi approved-script hoặc clean-brief mang `series` (flow FLOW_V1 S0), video-map phải có:

```json
"brand": { "id": "lucida-ai-v1", "series": "<series từ approved-script>", "contractRef": "docs/market-research/11-pipeline-contract.md" }
```

- `id` cố định — không bịa brand mới. Series lấy từ upstream, không tự đổi.
- Sau khi sinh video-map, chạy `npm run validate:videomap` (tự gọi brand check khi có brand block) và sửa violations trước khi trình user duyệt.

## Hard Rules

- Do not map every scene to a diagram.
- Do not choose raw template filenames directly; choose a known `templateId`.
- `templateId: "diagram"` is allowed only for explicit entity/relationship scenes.
- Do not embed images marked only as `style_reference`.
- Use diagram templates only when the scene has entities and relationships.
- Use list/card templates for enumerations.
- Use hero/kinetic type for hooks and punchlines.
- Use code panel only when code or execution is central to the explanation.
- Keep each scene under 5 visual objects unless the template explicitly supports more.

## Layout Selection

`layout` là field per-scene mới trong `video-map.json`, ORTHOGONAL với `templateId`: `templateId` quyết định component nào render nội dung, `layout` quyết định bố cục vĩ mô (title/content/negative space) trên canvas 9:16. Bắt buộc gán `layout` cho mọi scene song song với `templateId` — thiếu layout = mapping chưa xong.

7 archetype (batch 1 implement 5 cái đầu ✅, còn lại planned — chỉ dùng archetype ✅ cho video runnable ngay):

```text
top-title ✅ (default, legacy)
  kicker+title trên đầu, content stage giữa, caption dưới
  dùng cho: process, list dài

center-stage ✅
  không có header riêng, content nằm giữa màn hình, title tích hợp trong content
  dùng cho: hook, quote, stat

oversized-type ✅
  typography khổng lồ full-bleed tràn viền màn hình, content là chi tiết nhỏ bên dưới/chồng lên
  dùng cho: hook, takeaway, punchline

bottom-statement ✅
  visual/diagram chiếm 2/3 phía trên, một câu statement lớn ở dưới cùng
  dùng cho: system_architecture, comparison

full-bleed-visual ✅
  diagram/panel phủ toàn màn hình, label nổi trực tiếp trên visual, không có vùng title riêng
  dùng cho: diagram, split

side-rail (planned)
  rail title dọc/hẹp bên trái, content chảy bên phải, bất đối xứng

stacked-cards (planned)
  card xếp lớp giữa màn hình, title là tag nhỏ trên card trên cùng
```

Anti-monotony rules (được `scripts/validate-video-map.mjs` cảnh báo nếu vi phạm):

- Không 2 scene liên tiếp dùng cùng `layout`.
- Video có ≥5 scene phải có ≥3 `layout` khác nhau.
- Scene intent `hook` và `takeaway` nên dùng layout "premium" (`oversized-type` / `center-stage`), tránh `top-title`.
- Giữ nhịp: xen kẽ scene text-dominant và visual-dominant thay vì gộp cụm cùng loại liên tiếp.

## Catalog vs Registry Reality

- Catalog có 81 `templateId` nhưng `src/templateRegistry.tsx` chỉ có ~9 adapter thực; nhiều `templateId` alias về CÙNG một adapter (vd: `bounce-text`, `glitch-text`, `chapter-title`, `title-split` đều render bằng HeroTitleAdapter).
- "Đa dạng template" phải tính theo **adapter thực**, không theo tên `templateId` — chọn 4 templateId khác tên nhưng cùng adapter thì video vẫn đơn điệu.
- Danh sách templateId → adapter được implement thật: xem `apps/lucida-remotion-demo/src/template-registry-map.json`.

## Completion Criteria

- `video-map.json` is valid JSON.
- Chạy `npm run validate:videomap` (trong `apps/lucida-remotion-demo/`) và PASS trước khi bàn giao cho `remotion-video-builder`.
- Every scene has `id`, `intent`, `templateId`, `templateRole`, `layout`, `content`, `style`, `motion`, `durationSec`, `subtitle`, and `reason`.
- Total duration matches the requested target within 10%.
- Template choices are varied when the script has varied intents — varied theo adapter thực (xem Catalog vs Registry Reality), không chỉ theo tên templateId.
- `layout` tuân thủ anti-monotony rules ở "Layout Selection"; `npm run validate:videomap` sẽ warn (không block) nếu vi phạm — đọc warning và sửa trước khi bàn giao nếu còn thời gian.
