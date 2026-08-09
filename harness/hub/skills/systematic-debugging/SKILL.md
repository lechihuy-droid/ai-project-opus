---
name: systematic-debugging
description: Diagnose bugs and test failures through reproduction, boundary tracing, evidence-backed hypotheses, and focused regression verification.
---

# Systematic Debugging

Use this skill before proposing a fix for unexpected behavior.

1. Capture the exact symptom, environment, inputs, expected result, actual result, and complete error evidence.
2. Reproduce with the narrowest reliable command or interaction.
3. Trace data and control across boundaries; compare with a known-good path.
4. Form one hypothesis that predicts an observable result and test one variable at a time.
5. Fix the earliest confirmed faulty boundary, not the downstream symptom.
6. Add a regression test and run both focused and proportionate broader verification.

If reproduction or evidence is unavailable, report blocked or provisional findings. Never claim root cause from correlation alone.
