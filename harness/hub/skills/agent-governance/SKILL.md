---
name: agent-governance
description: Define agent policy, tool permissions, trust boundaries, approvals, audit trails, and fail-closed governance controls.
---

# Agent Governance

Use this skill when an agent, workflow, tool, or MCP integration changes authority.

1. Identify actors, assets, trust boundaries, and the exact action being authorized.
2. Apply least privilege across tools, paths, network, secrets, budget, and write scope.
3. Require structured policy decisions with reason codes; deny missing or ambiguous capability declarations.
4. Put approval before irreversible or externally visible actions, not after execution.
5. Record actor, intent, inputs, policy version, decision, output reference, and verification evidence.
6. Test bypass attempts, prompt injection, confused deputy paths, replay, escalation, and audit completeness.

Do not treat model confidence as authorization. Governance gates must be deterministic and fail closed.
