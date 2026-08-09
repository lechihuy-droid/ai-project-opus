---
name: database-migrations
description: Plan safe database schema and data migrations with compatibility phases, rollback strategy, observability, and zero-downtime checks.
---

# Database Migrations

Use this skill for a schema or data evolution plan.

1. Inventory readers, writers, constraints, volume, lock risk, and deployment order.
2. Prefer expand-and-contract: add compatible structure, backfill safely, switch traffic, validate, then remove old structure.
3. Make backfills resumable, bounded, observable, and idempotent.
4. Define rollback versus roll-forward behavior for every phase.
5. Verify schema, data reconciliation, application compatibility, performance, and backup/restore readiness.

Do not execute migration commands or destructive cleanup without explicit approval, a resolved target environment, backup evidence, and tested recovery path.
