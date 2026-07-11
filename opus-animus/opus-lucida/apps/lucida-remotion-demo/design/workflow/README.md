# Lucida Workflow Architecture

This directory is the canonical home for Lucida workflow specifications, artifact contracts, validation policies, and governance rules.

## Structure

- `create/` — gate-by-gate Create Workflow specifications.
- `contracts/` — versioned input/output artifact contracts.
- `validation/` — cross-gate verification, retry, cache, and failure-routing policies.
- `governance/` — events, state machines, versioning, and artifact lifecycle.

## Architectural rule

Workflow documents define **when and why transformations run**. Contract documents define **what data is accepted and produced**. Validation documents define **how correctness is proven**. Governance documents define **how state, ownership, versioning, and auditability are managed**.

Legacy documents in `design/` remain historical references until their content has been fully migrated and validated here.