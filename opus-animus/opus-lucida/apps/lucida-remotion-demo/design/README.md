# Lucida Design

This directory contains Lucida's design system, workflow specifications, runtime selection data, research, and planning documents.

## Start here

- [`workflow/README.md`](workflow/README.md) — canonical production workflow.
- [`workflow/create/CREATE_WORKFLOW.md`](workflow/create/CREATE_WORKFLOW.md) — G00–G12 create-flow overview.
- [`knowledge/DESIGN_LAYER.md`](knowledge/DESIGN_LAYER.md) — visual, motion, and cinematic design model.
- [`knowledge/ARCHITECTURE.md`](knowledge/ARCHITECTURE.md) — knowledge and retrieval architecture.
- [`planning/ROADMAP.md`](planning/ROADMAP.md) — implementation roadmap.
- [`history/HISTORY.md`](history/HISTORY.md) — decision and source history.

## Directory map

```text
design/
├── workflow/          canonical gates, contracts, validation, and governance
├── knowledge/         architecture, ingestion, and reference research
├── planning/          roadmap and resource backlog
├── history/           audit history and superseded workflow specifications
├── visual-library/    runtime visual-family registry and research
├── motion-library/    runtime motion-preset registry and research
├── directors/         deterministic selection rules
├── prompts/           bounded model-task prompts
└── schemas/           machine-readable design schemas
```

## Source-of-truth rules

1. `workflow/` is authoritative for production orchestration.
2. Operational registry, director, prompt, and schema paths remain stable.
3. `knowledge/` explains architecture and does not override workflow contracts.
4. `planning/` describes intended work, not implemented capability.
5. `history/` is audit context; do not implement from superseded specifications.
