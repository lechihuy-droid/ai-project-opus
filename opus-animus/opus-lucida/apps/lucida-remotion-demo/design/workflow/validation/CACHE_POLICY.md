# Cache Policy

Cache keys must include all semantically relevant input hashes, schema versions, policy versions, worker/model versions, prompt versions, and taxonomy versions.

## Rules
- never reuse cache across incompatible schema or policy versions
- prefer scene-level cache for planning and rendering
- script/audio changes invalidate timing and all dependent artifacts
- caption-effect-only changes invalidate caption rendering, not scene planning
- cache hits are recorded in provenance
- restricted media and sensitive prompts follow private-storage retention policy
- manual approval does not transfer to a materially changed artifact