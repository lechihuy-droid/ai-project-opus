---
name: harness-tool-builder
description: Design, implement, review, and test a Harness capability contract and vendor adapter without leaking vendor logic into agents or skills.
---

# Harness Tool Builder

Use this skill when adding an MCP tool, API, browser runner, database connector,
or local executor to Harness.

## Workflow

1. Define one coherent user-visible ability. Choose a stable semantic capability
   ID; do not put the current vendor in the ID.
2. Classify the trust boundary, data sensitivity, side effects, approval need,
   network/filesystem access, idempotency, and retry safety.
3. Add a versioned capability contract with narrow actions and strict JSON
   input/output schemas. Reject unknown input properties unless the external
   protocol genuinely requires an open object.
4. Define canonical status, typed errors, diagnostics, evidence, artifacts,
   trace metadata, timeout, and provider metadata before writing an adapter.
5. Add the vendor binding separately. Keep transport, credentials, environment
   references, vendor action names, and health checks out of agent manifests.
6. Implement the smallest adapter that maps canonical actions to the vendor and
   normalizes every result. Never let the model supply credentials, tenant IDs,
   approval state, or unrestricted filesystem paths.
7. Grant the capability explicitly to the least-privileged agent profile. An
   absent or empty capability list means deny; it is not a wildcard.
8. Expose only granted capability actions to the model. Authorize and validate
   again at invocation time; tool discovery is not authorization.
9. Test contract loading, schema rejection, denied grants, unavailable binding,
   timeout, adapter exception normalization, output validation, evidence shape,
   and a fake-adapter happy path. Add a workflow regression when a profile uses
   the capability.
10. Verify with fresh commands and report the exact command, exit status, and
    evidence. Never claim an external tool is integrated merely because its
    manifest exists.

## Review questions

- Can Figma be replaced by Penpot, or one MCP transport by another, without
  changing the agent profile?
- Does the contract describe an observable ability rather than a vendor API?
- Are effects and approvals authoritative in Harness rather than copied from
  untrusted provider hints?
- Are retries bounded and limited to safe/idempotent actions?
- Are structured outputs validated after adapter normalization?
- Can an auditor connect the agent grant, invocation, binding, result, and
  evidence through one trace ID?
- Does a missing adapter/configuration fail closed as `unavailable`?

## Do not

- Put Figma, shadcn, Playwright, axe, or another vendor call inside an agent
  prompt or skill procedure.
- Reuse `allowed_tools` as capability authorization.
- install packages, enable MCP servers, read secrets, or call external networks
  merely because a skill or adapter suggests it;
- trust model-supplied paths, identity, policy, or approval fields;
- auto-retry destructive, non-idempotent, or open-world actions;
- reduce accessibility evidence to only a violation count;
- use reviewer prose as a deterministic quality gate.

See `docs/CAPABILITY-TOOL-ARCHITECTURE.md` and
`capabilities/capability_catalog.yaml` for the canonical contract and examples.
