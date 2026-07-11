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

## Workflow

1. Prefer `clean-brief.json` when available; otherwise use the raw script.
2. Segment by meaning, not by paragraph length.
3. Assign exactly one primary intent per scene.
4. Read `apps/remotion-templates/template-catalog.json`.
5. Choose one cataloged `templateId` per scene.
6. Use `visualReferences` as style guidance and `usableAssets` only as explicit embed candidates.
7. Extract only visual content needed by that template.
8. Keep long narration in `subtitle.text`, not in card labels.
9. Add `reason` to explain why the template fits the scene.
10. Validate duration, density, and object count.

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

## Completion Criteria

- `video-map.json` is valid JSON.
- Every scene has `id`, `intent`, `templateId`, `templateRole`, `content`, `style`, `motion`, `durationSec`, `subtitle`, and `reason`.
- Total duration matches the requested target within 10%.
- Template choices are varied when the script has varied intents.
