# Lucida Workflow Architecture

This directory is the canonical home for Lucida workflow specifications, artifact contracts, validation policies, governance rules, and runtime orchestration decisions.

## Structure

- `create/` — gate-by-gate Create Workflow specifications.
- `contracts/` — versioned input/output artifact contracts.
- `validation/` — cross-gate verification, retry, cache, and failure-routing policies.
- `governance/` — events, state machines, versioning, and artifact lifecycle.
- `N8N_CLI_ORCHESTRATION.md` — runtime architecture for n8n, Claude Code, Codex CLI, Whisper, FFmpeg, and Remotion without an LLM API dependency.

## Architectural rule

Workflow documents define **when and why transformations run**. Contract documents define **what data is accepted and produced**. Validation documents define **how correctness is proven**. Governance documents define **how state, ownership, versioning, and auditability are managed**. Runtime orchestration documents define **which executable worker owns each transformation and how it is invoked safely**.

Legacy documents in `design/` remain historical references until their content has been fully migrated and validated here.
