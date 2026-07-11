# Source Classification

## Decision Table

| Source | Default Usage | Promote To | Ignore When |
|---|---|---|---|
| User script | `content_truth` | n/a | duplicate draft |
| User notes | `content_truth` | `context_only` if rough | irrelevant |
| Official docs/article | `content_truth` | n/a | stale or unrelated |
| GitHub repo | `context_only` | `content_truth` for API/feature facts, `style_reference` for templates | unrelated files |
| Local PDF | `content_truth` | `style_reference` if design PDF | unreadable/duplicate |
| Local image | `style_reference` | `embed_asset` if user-owned/useful | low quality/irrelevant |
| Web image | `style_reference` | rarely `embed_asset` only with explicit permission | unclear license |
| Screenshot | `style_reference` | `embed_asset` if user wants it shown | contains private data |
| Logo/brand mark | `style_reference` | `embed_asset` only with explicit request | third-party mark |

## Image Rules

Default:

```text
image -> style_reference
```

Promote to `embed_asset` only when at least one condition is true:

```text
user says "put this image in the video"
image is local and clearly project-owned
image is generated for this project
image is a screenshot the user explicitly wants to show
```

Never infer permission from availability alone.

## GitHub Repo Rules

Extract:

```text
template names
component patterns
animation patterns
data shapes
useful file paths
constraints from README/docs
```

Ignore:

```text
badges
install boilerplate
unrelated examples
old issues
generated dist/build files
node_modules
```

## Confidence

Use `low` when source cannot be accessed, image ownership is unclear, claims are unverified, or usage intent is ambiguous.
