# ProjectSpec Contract

Normalized immutable production request created by G01.

## Required
- project and source-request IDs/hashes
- platform, aspect ratio, resolution, FPS, duration policy
- language, output, audio, and caption modes
- brand, rights, safety, renderer, and asset-source policy versions
- creative and motion budgets

## Invariants
- all defaults are resolved
- aspect ratio and dimensions are consistent
- duration is feasible for the approved script
- all referenced policies exist at explicit versions
- downstream gates must not reinterpret raw user aliases or defaults