---
name: mcp-builder
description: Design production MCP servers and tool adapters with typed contracts, least privilege, stable errors, and auditable tests.
---

# MCP Builder

Use this skill to design or review an MCP server or external tool adapter.

1. Define the user job, trust boundary, transport, authentication owner, and data classification.
2. Give each tool one narrow action with strict input and structured output schemas.
3. Declare read-only, destructive, idempotent, and open-world behavior accurately.
4. Validate and authorize server-side; never trust identity, tenant, path, or command values supplied by the model.
5. Use stable error codes, correlation IDs, timeouts, rate limits, and secret-safe logs.
6. Test schemas, authorization isolation, upstream failures, cancellation, retries, redaction, and transport behavior.

Do not install packages, start a server, access credentials, or call a network endpoint unless an approved Hub tool explicitly provides that capability.
