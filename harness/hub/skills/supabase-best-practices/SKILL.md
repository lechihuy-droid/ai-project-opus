---
name: supabase-best-practices
description: Design Supabase-backed data, auth, storage, and API flows with row-level security, migration discipline, and observable failure handling.
---

# Supabase Best Practices

Use this skill for a Supabase-backed application design or review.

1. Model tables, ownership, tenant boundaries, and lifecycle before writing client queries.
2. Make row-level security explicit and test allow and deny cases for every role.
3. Keep service-role credentials server-side; clients receive only intended public configuration.
4. Use reviewed migrations, indexes, constraints, and transaction boundaries.
5. Define auth refresh, storage policies, realtime consistency, retries, and error UX.

Never connect to or mutate a live project without a bound tool, explicit environment, authorization, backup/rollback plan, and verification evidence.
