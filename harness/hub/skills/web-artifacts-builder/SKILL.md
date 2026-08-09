---
name: web-artifacts-builder
description: Specify complex interactive web artifacts with explicit state, component, data, accessibility, and verification contracts.
---

# Web Artifacts Builder

Use this skill for a multi-component prototype or interactive artifact.

1. Define the artifact purpose, audience, inputs, outputs, navigation, and state transitions.
2. Choose the smallest architecture that supports the interaction; avoid framework ceremony for static output.
3. Specify component boundaries, data ownership, error states, and accessibility behavior.
4. Reuse an approved design system and existing components before adding dependencies.
5. Define build, lint, typecheck, and interaction evidence required for acceptance.

Do not install npm packages, run scaffolds, or delete build output unless the agent has an approved execution tool and the exact workspace scope is verified.
