# Harness Capability and Tool Adapter Architecture

## Definition

A Harness capability is a stable, versioned, vendor-neutral contract for one
coherent externally observable ability that Harness may authorize for an
agent. The contract fixes actions, strict input/output schemas, effects,
policy requirements, evidence, and error semantics. A separate runtime binding
selects an adapter that translates the contract to a concrete external tool.

Replacing a provider must preserve the contract. An incompatible semantic or
schema change requires a new contract version.

## Layer boundaries

```text
Agent -> Skill -> Capability Registry -> Policy/Validation -> Adapter -> External Tool
```

- **Agent** receives only capabilities granted by its frozen runtime profile.
- **Skill** teaches when and why to use a capability and how to interpret its
  evidence. It contains no vendor invocation or credentials.
- **Capability** is the semantic promise and authorization boundary.
- **Binding** selects the adapter, vendor, transport, configuration references,
  and health check without changing the agent contract.
- **Adapter** translates canonical actions to vendor calls and normalizes
  results, errors, and evidence.
- **External tool** is an MCP server, API, browser runner, library, or process.

This is a ports-and-adapters boundary: the capability is the application port;
the Figma MCP, Playwright, or axe implementation is a replaceable adapter.

## Invocation pipeline

```text
resolve contract
  -> authorize agent grant
  -> validate canonical input
  -> resolve a configured binding
  -> invoke adapter with timeout
  -> normalize result or typed error
  -> validate canonical output
  -> return evidence with trace metadata
```

Credentials, clients, tenant identity, approval state, and policy context stay
in the runtime context. They must not be accepted from model-generated input or
placed in an agent prompt. Provider annotations are hints; Harness contract
effects and policy remain authoritative.

## Contract requirements

Each catalog entry declares:

1. stable `id` and `contract_version`;
2. intent, plane, and category;
3. narrow actions with strict JSON input and output schemas;
4. effects: read-only, destructive, idempotent, and open-world;
5. authorization and approval requirements;
6. network, filesystem, secret, timeout, and retry constraints;
7. canonical evidence and typed failure semantics;
8. a logical binding reference separate from contract semantics.

The canonical result distinguishes `succeeded`, `failed`, `refused`, and
`unavailable`. It includes schema-validated data, evidence/artifacts,
diagnostics, a trace ID, timing, and provider metadata. Contract validation
failures are not reported as upstream execution failures.

## Wave 1

| Capability | Canonical job | Initial binding | Agent grants |
| --- | --- | --- | --- |
| `design_context_fetch` | Fetch normalized design context | Figma MCP | implementation engineer, UI reviewer |
| `browser_visual_validation` | Capture and validate browser behavior | Playwright | implementation engineer, UI reviewer, E2E runner |
| `accessibility_validation` | Scan rendered UI accessibility | axe-core | UI reviewer, E2E runner |

Bindings are disabled until their adapter and configuration are explicitly
registered. A catalog entry is therefore not proof that an external integration
is installed or healthy.

For accessibility evidence, preserve `passes`, `violations`, `incomplete`, and
`inapplicable`. For visual comparisons, record browser, OS, viewport, font,
baseline, and tool versions because screenshots vary across environments.

## Target deterministic UI gate (next runtime wave)

The current Wave 1 runtime establishes contracts, authorization, adapter
dispatch, and normalized evidence. A subsequent workflow-engine change must
consume that evidence with the following deterministic gate; an LLM reviewer
must not invent or override the pass result.

```yaml
required:
  browser_test_passed: true
  console_error_count: 0
  responsive_check_passed: true
  axe_critical_violations: 0
  screenshot_created: true
```

Missing, stale, malformed, or unproven evidence fails closed. Reviewer prose
may explain a gate result but cannot override it.

## Current runtime constraints

- The Figma, Playwright, and axe bindings are intentionally unregistered and
  unconfigured; no external integration is claimed by this wave.
- Hub function-tool dispatch currently runs only for providers that advertise
  tool support. The existing Codex CLI and Claude CLI adapters do not, so
  `code` and `smart` workflow agents retain capability grants in their frozen
  profiles but cannot invoke them model-side yet. Use an explicit
  capability-node executor or add a provider tool bridge in the next wave.
- The workflow engine does not yet evaluate the deterministic UI gate above.

## Delivery plan

1. **Wave 1 — contract foundation (implemented):** versioned registry, strict
   schemas, independent capability grants, secret-free catalog API, adapter
   protocol, timeout/error normalization, origin policy, child-run grant
   lineage, model tool-schema bridge, fake-adapter tests, and the
   `harness-tool-builder` skill.
2. **Wave 2 — real bindings:** implement and security-review Figma MCP,
   Playwright, and axe adapters; add configuration and health checks; pin tool,
   browser, and baseline versions. Do not enable a binding until its credential,
   network, artifact, and redaction tests pass.
3. **Wave 3 — provider-independent workflow execution:** add explicit
   capability nodes so the workflow executor can call authorized capabilities
   even when the selected LLM provider has no function-tool loop. Persist the
   normalized result as an auditable artifact before sending derived context to
   an agent.
4. **Wave 4 — deterministic UI quality gate:** evaluate browser, console,
   responsive, screenshot, and axe evidence in code; fail closed on missing or
   stale evidence; add repair/retry routing with bounded idempotent retries.
5. **Wave 5 — app controls:** add capability grant/origin editors, binding
   health, invocation traces, and evidence links to the Hub UI without exposing
   credentials or vendor configuration to agents.

## Sources

- MCP tool contracts, validation, result schemas, and security:
  https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- MCP annotations and their untrusted-hint status:
  https://modelcontextprotocol.io/specification/2025-06-18/schema
- MCP transports:
  https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
- OpenAI Agents SDK tool pipeline:
  https://openai.github.io/openai-agents-python/tools/
- OpenAI local run context:
  https://openai.github.io/openai-agents-python/context/
- Ports and adapters:
  https://alistair.cockburn.us/hexagonal-architecture
- Figma MCP tools:
  https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/
- Playwright assertions and visual snapshots:
  https://playwright.dev/docs/test-assertions
  https://playwright.dev/docs/test-snapshots
- axe result model:
  https://github.com/dequelabs/axe-core/blob/develop/doc/API.md
