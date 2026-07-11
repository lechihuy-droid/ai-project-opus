---
name: source-ingestor-cleaner
description: Use this skill to ingest and clean raw inputs before video planning, including scripts, URLs, GitHub repositories, PDFs, local files, screenshots, and image references. It automatically classifies each source as content truth, style reference, embeddable asset, context-only, or ignore, then produces clean-brief JSON for Remotion script-to-video workflows.
---

# Source Ingestor Cleaner

Turn messy inputs into a clean video brief. Run this before template mapping when the user provides URLs, GitHub repos, PDFs, screenshots, images, notes, or mixed raw material.

## Output Contract

Produce `clean-brief.json`.

Read when needed:

- `references/llm-prompt.md`: prompt for classifying and cleaning sources.
- `references/source-classification.md`: source usage rules.
- `references/clean-brief-schema.md`: JSON contract.

## Workflow

1. Inventory every input source.
2. Classify each source automatically:

```text
content_truth
style_reference
embed_asset
context_only
ignore
```

3. Extract useful text, claims, entities, mechanisms, examples, and caveats.
4. Extract visual direction from images without copying them unless they are safe assets.
5. Separate `visualReferences` from `usableAssets`.
6. Remove noise, duplicates, badges, boilerplate, install logs, and irrelevant repo files.
7. Produce `clean-brief.json` for `script-template-mapper`.

## Auto-Use Policy

Use source as `content_truth` when it supports factual claims or script accuracy.

Use source as `style_reference` when it mainly provides mood, layout, color, composition, typography, or animation ideas.

Use source as `embed_asset` only when the user supplied the file directly, it is local/project-owned, or the user clearly asks to put it in the video.

Use source as `context_only` when it helps understand the topic but should not appear in the video.

Use source as `ignore` when it is irrelevant, duplicated, low-signal, broken, or unsafe to use.

## Hard Rules

- Do not copy third-party images, logos, screenshots, or layouts into the video unless the user explicitly owns or approves them.
- Do not let raw source structure dictate video structure.
- Do not pass noisy repo README text directly to `script-template-mapper`.
- Always include `usage`, `confidence`, and `reason` for every source decision.

## Completion Criteria

- `clean-brief.json` contains cleaned narration basis, key claims, visual references, usable assets, constraints, and source decisions.
- Every raw source is accounted for.
- Images are classified as reference or asset.
- Downstream mapping can run without rereading the raw inputs unless confidence is low.
