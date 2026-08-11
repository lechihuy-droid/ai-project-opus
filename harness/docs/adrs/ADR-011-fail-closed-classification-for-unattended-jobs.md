# ADR-011 — Fail-Closed Command Classification, Scoped to Unattended Jobs

**Status:** Accepted
**Scope:** `harness/hub` — job approval (`services/verify.py`, `services/hooks.py`, `services/gitjobs.py`)
**Decision date:** 2026-08-11

## Context

`services/verify.py::rule_check` is the gate `gitjobs.approve()` calls before
launching any job. It classifies the job's command and any diff lines into
risk tiers (`read_only`, `write`, `execute`, `network`, `destructive`) via
`risk.classify_command`, and denies on a `destructive` tier unless
`allow_override` is set.

Before this decision, `_command_tiers()` filtered `risk.UNKNOWN` out of the
tier list before `rule_check` ever saw it (`return [tier for tier in tiers
if tier != risk.UNKNOWN]`). A command not already named in
`risk_tiers.json` produced no tier at all, so it could never match
`destructive`, `execute`, or `network` — the classifier failed open, and the
least recognizable command was the one most likely to be approved. This was
one of the four instances of the pattern ADR-012 documents.

The fix is not simply "deny on `UNKNOWN`." `rule_check` is called for two
structurally different kinds of job:

- **Interactive**: a job a person is watching, e.g. `gitjobs.approve()`
  called from the UI after a reviewer looks at the diff. `warn` is a
  meaningful outcome here — it surfaces in the approval UI as a flag, the
  human reads it, and decides.
- **Unattended**: a job with no human in the loop at the moment of approval.
  The only current source is `gitjobs.create_hook_job()`, called from
  `hooks.fire()` when a runtime event matches a registered hook — the
  command runs automatically, `warn` has no reader.

Denying every `UNKNOWN` command unconditionally, across both cases, was
considered and rejected. `risk_tiers.json`'s `command_tiers` map is
necessarily incomplete — it cannot enumerate every legitimate binary a
reviewed, interactive job might reasonably run. Making `UNKNOWN` an
unconditional `deny` would deny those jobs too, and the predictable operator
response to a workflow that suddenly stops working is to set
`allow_override` on it — which bypasses this check entirely and is a worse
outcome than the fail-open bug being fixed, because now a human has been
trained to route around the gate instead of the gate protecting them.

## Decision

`rule_check` computes `has_unknown = risk.UNKNOWN in tiers` and branches on
`job.get("unattended")`:

- `unattended` **and** `has_unknown` → `deny`, reason
  `"unclassified command in unattended job"` — unless `allow_override` is
  set, in which case the check does not block, but
  `governance.record_denial(...)` still runs, so the override leaves an
  audit trail rather than passing silently.
- Not `unattended` **and** `has_unknown`, with no other denial reason fired
  → falls through to `warn`, reason `"unclassified command"` — unchanged
  from the pre-existing behavior for interactive jobs.

`gitjobs.create_hook_job()` sets `record["unattended"] = True` on every job
it creates, so every hook-fired job is covered by construction — a hook
author does not opt into this, and cannot opt out of it by omission.

The tier-classification code has one adjacent correctness note worth
recording here rather than only as an inline comment: `risk.UNKNOWN` has no
entry in `risk.TIER_RANK`, and the pre-existing `warn` path
(`sorted(set(warn_tiers), key=lambda item: risk.TIER_RANK[item])`) would
raise `KeyError` if `UNKNOWN` reached it. `warn_tiers` is therefore built by
filtering to exactly `{"network", "execute"}`, and the `UNKNOWN` case is
handled as its own branch afterward (`if has_unknown: return {"decision":
"warn", ...}`) rather than being folded into the ranked set.

## Consequences

### Positive

- The chain that made the original finding exploitable — `hooks.py`
  accepting an unvalidated `command[0]` (closed separately, allowlisted via
  `HOOK_ALLOWED_COMMANDS`), reaching an approval gate that failed open on
  anything it didn't recognize — no longer has a working second stage even
  if the first one is ever reintroduced. The two fixes are independent
  defenses, not one fix relying on the other.
- Interactive workflows using commands outside `risk_tiers.json` keep
  working exactly as before; this ADR does not narrow what an interactive
  job can do, only what an unattended one can do unnoticed.
- `allow_override` remains available for the unattended case, but using it
  now produces a durable record via `governance.record_denial`, rather than
  the silent pass-through it would have been if this were bolted on without
  that call.

### Trade-offs

- The correctness of this design depends entirely on `unattended` being set
  accurately by every current and future caller of `gitjobs.create_job`.
  There is exactly one call site that sets it today
  (`create_hook_job`). A future code path that fires jobs without a human
  watching — a scheduled job, a webhook-triggered job outside the existing
  hooks system, anything similar — inherits fail-open behavior unless it
  also sets `unattended=True`. This ADR's guarantee is scoped to "jobs that
  correctly self-identify as unattended," not to the codebase as a whole.
- A legitimate hook command that happens to be missing from
  `risk_tiers.json`'s `command_tiers` map will be denied, not warned, the
  first time it fires. The operator's correct fix is adding it to
  `risk_tiers.json`, not reaching for `allow_override` — see ADR-012's
  trade-offs section for why `allow_override` combined with an interpreter
  or shell binary in `HOOK_ALLOWED_COMMANDS` specifically defeats this
  layer.

## References

- `harness/hub/services/verify.py` — `rule_check`, `_command_tiers`
- `harness/hub/services/gitjobs.py` — `create_hook_job`
- `harness/hub/services/hooks.py` — `_validate` (the independent first-stage fix)
- `harness/hub/tests/test_verify_rules.py` — unattended+unknown deny,
  interactive+unknown warn (regression guard), classified command still
  allows, override still records a denial
- ADR-012 — the general principle this is one instance of
