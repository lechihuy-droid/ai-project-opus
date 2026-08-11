# ADR-012 — Allowlist Is the Default for Every Execution or Access Boundary

**Status:** Accepted
**Scope:** `harness/` — eval runner, hub backend
**Decision date:** 2026-08-11

## Context

An architecture and security audit of `harness/` (5 parallel subsystem
reviews, 2026-08-10) found three independent, high/critical-severity
findings that turned out to be the same modeling error, written by
different sessions at different times with no shared code between them:

| # | Location | Denylist / fail-open mechanism | What got through |
|---|---|---|---|
| 1 | `run_harness.py` command boundary | `DANGEROUS_COMMAND_TOKENS` — word-boundary regex over a fixed set of literal strings (`rm`, `del`, ...) | `shutil.rmtree`, `os.remove`, any Python API call — the blacklist only recognizes shell command names, not code |
| 2 | `hub/services/hooks.py` shell action | No check on `command[0]` at all beyond "non-empty list of strings" | Any binary on the host |
| 3 | `hub/services/verify.py` `rule_check` | `_command_tiers()` filtered `risk.UNKNOWN` out of the tier list before the decision, so an unrecognized binary produced no `destructive`/`execute`/`network` tier and defaulted to `allow` | Any binary not already named in `risk_tiers.json` — the *less* recognizable the command, the more freely it passed |

None of these were single-line oversights. Each was a deliberately built
mechanism — a specific set literal, a specific filter, a specific
classification step — that shared the same structural flaw: it enumerated
what was known to be bad and let everything else through by default.
A blacklist can only be as complete as the set of attacks its author
already thought of; the fix in each case was not "add more entries" but
"invert which side is the default."

A fourth instance surfaced during remediation of #1 itself. The first pass
at closing `run_harness.py`'s boundary replaced the executable-name
allowlist with `INLINE_CODE_FLAGS = {"-c", "-m", "--command"}` — a denylist
of known-bad interpreter flags, matched by exact token equality. Direct
adversarial testing against the implementation (not just unit tests written
alongside it) found it still passed `-cimport shutil` (value attached to the
flag), `-Ic` (clustered short flags), and bare `-` (read code from stdin) —
the same shape of gap as #1, reintroduced one level down while fixing #1.
That a denylist regenerated *during the act of removing a denylist*, on a
boundary that had just been named as the case study for why they fail, is
the strongest evidence for treating this as a standing rule rather than a
one-off code review comment.

## Decision

Every boundary in `harness/` that decides whether a command, binary, or
action is allowed to run enumerates what is **permitted** and denies
everything else by default. A blacklist may exist alongside an allowlist as
a secondary, defense-in-depth signal (fast rejection with a clearer error
message for a known-bad case), but it must never be the sole or primary
gate, and code introducing one must say so in a comment next to it — see
`run_harness.py`'s `DANGEROUS_COMMAND_TOKENS` for the pattern: kept, but
explicitly commented as non-authoritative so the next reader does not
mistake a passing blacklist check for proof of safety.

Applied so far:

- `run_harness.py` (`_enforce_command_boundary`): an executable is only
  treated as a trusted interpreter via exact match against
  `safe_external_paths` (`ctx["python"]`, `ctx["py311"]`, `sys.executable`)
  — a check's `allowed_executables`/`allow_system_executable` no longer
  implicitly grants interpreter-argument trust. Interpreter arguments are
  gated by `INTERPRETER_SAFE_FLAGS`, a small set of flags proven
  side-effect-free (`-B -E -I -O -OO -q -s -S -u -v`, with `-W`/`-X`
  consuming their value); anything else — including spellings no one has
  enumerated yet — requires explicit `allow_inline_code`. `DANGEROUS_COMMAND_TOKENS`
  stays as the secondary signal, commented as such.
- `hub/services/hooks.py` (`_validate`): a shell hook's `command[0]` basename
  must appear in `config.HOOK_ALLOWED_COMMANDS`, which defaults to empty —
  the shell-hook path is off until an operator opts commands in.
- `hub/services/verify.py` (`rule_check`): `risk.UNKNOWN` is no longer
  filtered out before the decision. A job marked `unattended` (every
  hook-fired job, via `gitjobs.create_hook_job`) denies on an unclassified
  command; a job with a human watching it still gets `warn`, not `deny` —
  see ADR-011 for why that split exists and is not itself a loophole.

Known, deliberate exception: `hub/services/fsbrowse.py` keeps `DENIED_ROOTS`
as a denylist. Its job is letting a user point an agent's workspace at any
directory on the machine — hard containment to an allowlist of roots would
remove the feature the module exists to provide, not just close a gap. The
mitigation here is different in kind, not degree: `fsbrowse` sits entirely
behind the P0.1 auth guard now (no unauthenticated caller reaches it at
all), and setting a workspace outside the project root writes a durable
audit entry via `services/audit.py`. This ADR does not claim every boundary
in the codebase is allowlist-based — it claims every boundary defaults to
denying the unrecognized case, and states plainly where that default is
implemented by access control instead of by a positive list, and why.

## Consequences

### Positive

- A binary or code path this codebase's authors never thought to blacklist
  is denied by construction, not by luck. The recurring finding — "the less
  recognizable the input, the more likely it passes" — cannot happen at any
  of these four boundaries anymore.
- The self-correction on `INLINE_CODE_FLAGS` is now a concrete, checked-in
  example (`run_harness.py`'s `INTERPRETER_SAFE_FLAGS` comment, and this
  ADR) of what "looks like a fix but is still a blacklist" looks like in
  this codebase specifically — useful for review, not just abstract
  guidance.

### Trade-offs

- An allowlist requires enumerating the legitimate cases up front, which is
  real, ongoing maintenance cost: `HOOK_ALLOWED_COMMANDS` ships empty, so
  every hook an operator wants to run through the shell action has to be
  explicitly added, and `INTERPRETER_SAFE_FLAGS` will need a new entry if a
  legitimate workflow needs a Python flag not already on the list. This is
  the cost being deliberately accepted in exchange for fail-closed behavior
  on the unknown case.
- Allowlisting an interpreter or shell binary into `HOOK_ALLOWED_COMMANDS`
  silently defeats the boundary it sits behind, because `risk_tiers.json`
  classifies `python`/`node`/`bash`/etc. as tier `execute`, and `execute` is
  a `warn`, not a `deny`, outcome in `verify.rule_check` for anything other
  than an unattended+unknown command. `config.py` carries an explicit
  comment on `HOOK_ALLOWED_COMMANDS` warning against this; it is a real trap
  for an operator who reaches for the obvious fix when a legitimate hook
  command gets rejected.
- `fsbrowse.py`'s denylist exception means this ADR's title is a default,
  not an absolute — a future reviewer checking "is this an allowlist"
  against `fsbrowse.py` alone would get the wrong answer without reading
  this document's exception clause.

## References

- `harness/run_harness.py` — `INTERPRETER_SAFE_FLAGS`, `INTERPRETER_NAME_PATTERN`, `_enforce_command_boundary`
- `harness/hub/services/hooks.py` — `_validate`
- `harness/hub/services/verify.py` — `rule_check`, `_command_tiers`
- `harness/hub/services/fsbrowse.py` — `DENIED_ROOTS`, `resolve_workspace_dir`
- `harness/hub/config.py` — `HOOK_ALLOWED_COMMANDS` (with its adjacent warning comment)
- `harness/docs/BD-harness-remediation.md` — the build plan this ADR closes out (Phase 0, `verify.py`/`run_harness.py`/`fsbrowse.py` steps)
- ADR-011 — the unattended/interactive split referenced above
