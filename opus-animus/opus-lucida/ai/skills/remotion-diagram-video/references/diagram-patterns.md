# Diagram Pattern Reference

Use this reference after reading `SKILL.md` when deciding how to map script content into a visual diagram.

## Selection Table

| Content type | Use layout | Visual structure |
|---|---|---|
| "X causes Y" | cause-effect | left causes -> right result |
| "old way vs new way" | contrast | left old / right new |
| "step 1 -> step 2 -> step 3" | pipeline | horizontal or vertical steps |
| "central agent dispatches work" | hub-spoke | center/top orchestrator -> workers |
| "independent reviewers check output" | critique loop | output -> critic -> validated output |
| "three use cases" | use-case rows | 2-3 rows, each row is mini pipeline |
| "three principles" | summary grid | three cards with supporting nodes |
| "model routing" | router | classifier -> cheap model / expensive model |

## Scene Mapping Defaults

For technical AI explainers, prefer:

```text
hook              -> 3-node pipeline
problem           -> cause-effect or failure fan-in
old way           -> manual hub with several custom flows
solution          -> request -> planner -> generated code -> shell
subagents         -> orchestrator -> parallel workers
patterns          -> split between critique loop and routing
use cases         -> two-row or three-row pipelines
summary           -> 3 principle cards + reuse/read/audit nodes
```

## Node Rules

- Node label: 1-3 words.
- Node note: short technical clarification.
- Do not put full narration inside nodes.
- Prefer English labels for technical primitives only when compact: `JS workflow`, `Critic`, `Router`.
- Prefer Vietnamese for user-facing concepts: `Vấn đề`, `Giải pháp`, `Kiểm tra chéo`.
- If a node label wraps awkwardly, shorten the label instead of shrinking the whole diagram.

## Link Rules

- Use arrows only for real semantic flow.
- Do not draw arrows for decorative relation.
- Link label should be 1 word when possible: `plan`, `write`, `run`, `verify`, `route`.
- Compute arrow endpoints from node bounds.
- For fork layouts, connect one orchestrator to each worker.
- For rows, connect left to right inside each row.

## Vertical Video Zones

Use fixed zones:

```text
0-360px      header/title
430-1220px   diagram stage
1480-1840px subtitle bar
```

Keep at least 160px blank space between diagram stage and subtitle bar. If a scene needs more space, reduce node count or split the scene.

## Common Fixes

| Problem | Fix |
|---|---|
| Diagram too high | Increase diagram Y offset or stage top |
| Nodes overlap | Switch to rows or grid layout |
| Arrows miss nodes | Use edge-point calculation from node centers |
| Too much text | Move explanation to subtitle |
| Scene feels generic | Rename nodes to match the exact claim in narration |
| Subtitle competes with diagram | Shorten title/subtitle and keep narration in bottom bar |
