# VideoSpec Contract

Immutable execution contract compiled by G09.

## Required
- project/render configuration
- script, audio, and timing hashes
- scene timeline and transitions
- caption plan and caption cue references
- visual-beat mappings
- style, motion, component, asset, font, and audio bindings
- provenance and dependency graph

## Invariants
- schema and cross-references pass
- timeline is continuous and deterministic
- renderer receives no independent editable script copy
- every dependency is versioned and hash-addressed
- changes require a new VideoSpec version