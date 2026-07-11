# Workflow Versioning

## Version independently
- workflow definition
- gate contract
- artifact schema
- taxonomy and policy
- model and prompt
- deterministic worker/tool
- style, motion, component, asset, and renderer packages

## Rules
- canonical artifacts are immutable; changes create new versions
- breaking schema changes require a major version
- compatible additive changes require a minor version
- corrective metadata changes require a patch version
- every artifact records producer and dependency versions
- historical runs remain reproducible against pinned versions
- migrations create new artifacts and preserve lineage; they do not rewrite audit history