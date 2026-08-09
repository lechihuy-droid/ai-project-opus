---
name: frontend-testing-debugging
description: Diagnose frontend runtime failures using reproduction, browser evidence, state tracing, and focused regression tests.
---

# Frontend Testing and Debugging

Use this skill when a UI behaves incorrectly or a frontend test fails.

1. Reproduce the exact route, viewport, user state, input, and timing.
2. Capture console errors, network requests, rendered state, and relevant component boundaries.
3. Trace data from request through state and render; compare with a known-good path.
4. Form one evidence-backed hypothesis and test one variable at a time.
5. Fix the earliest faulty boundary, add a focused regression test, then run broader checks.

Never patch CSS, waits, mocks, or assertions merely to hide the symptom. Report blockers when the runtime or browser is unavailable.
