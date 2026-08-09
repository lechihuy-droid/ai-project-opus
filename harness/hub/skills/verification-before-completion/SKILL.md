---
name: verification-before-completion
description: Enforce fresh evidence before any claim that work is complete, fixed, correct, deployed, or passing.
---

# Verification Before Completion

Use this skill at every completion gate.

1. Translate each requirement into observable evidence and the command, API call, artifact, or review that proves it.
2. Run fresh verification in the relevant environment; do not rely on memory or another agent's summary.
3. Read complete output, exit status, failure count, timestamps, and skipped checks.
4. Match evidence to every acceptance criterion and state what remains unverified.
5. Report `complete`, `failed`, or `blocked` truthfully with evidence references.

Lint does not prove runtime behavior, folder presence does not prove discovery, and copied files do not prove a skill works. Never soften missing evidence into a success claim.
