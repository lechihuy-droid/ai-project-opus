# G01 — Project Normalization

**Verb:** Normalize

## Input
- `CreateRequest`
- `ProjectEnvelope`
- registered policies and defaults

## Worker
Deterministic parser and validator. No GPT or Codex.

## Transform
- normalize platform, language, duration, aspect ratio, FPS, resolution, output format, caption/audio modes
- resolve explicit policy versions
- estimate script production feasibility
- freeze normalized request

## Output
- `ProjectSpec`

## Verify
- schema and enum validity
- duration/script feasibility
- aspect-ratio and resolution consistency
- brand, rights, renderer, and asset-source policies resolve successfully

## Failure routing
No automatic retry. Return conflicts to the requester or upstream script workflow.