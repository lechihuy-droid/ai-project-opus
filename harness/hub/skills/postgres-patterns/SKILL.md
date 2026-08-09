---
name: postgres-patterns
description: Apply PostgreSQL schema, query, index, transaction, observability, and security patterns using measured evidence.
---

# PostgreSQL Patterns

Use this skill for PostgreSQL design or performance review.

1. Model invariants with types, constraints, keys, and explicit ownership.
2. Design queries and indexes together from observed access patterns and cardinality.
3. Inspect query plans and runtime evidence before recommending optimization.
4. Keep transactions short, define isolation needs, and handle retries and locking deliberately.
5. Use least-privilege roles, parameterized queries, row-level security where appropriate, and secret-safe logs.
6. Plan vacuum, statistics, connection limits, backups, restore tests, and migration monitoring.

Never run DDL, tune a live database, or create an index without an approved environment, impact estimate, rollback plan, and fresh verification.
