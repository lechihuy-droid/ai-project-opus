---
name: claude-api
description: Plan and review Claude API integrations, tool use, streaming, context management, and provider-safe application boundaries.
---

# Claude API Integration

Use this skill for an Anthropic/Claude integration in Harness.

1. Confirm current provider documentation, model identifier, limits, and pricing before making time-sensitive claims.
2. Separate provider routing, request construction, streaming events, tool execution, and persistence.
3. Validate tool inputs and outputs independently of model text.
4. Define timeout, retry, cancellation, truncation, and partial-stream behavior.
5. Keep credentials in the provider boundary and redact request, response, and telemetry fields.
6. Test mocked success, tool calls, refusals, malformed events, rate limits, and provider outages.

Produce a provider-neutral contract where possible. Never expose API keys or assume network access merely because the integration is described.
