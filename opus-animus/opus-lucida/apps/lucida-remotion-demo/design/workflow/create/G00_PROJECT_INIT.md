# G00 — Project Initialization

**Verb:** Initialize

## Input
- `ApprovedScript`
- `ProjectConfig`
- optional `BrandPolicy`
- optional user assets

## Worker
Deterministic workflow service. No GPT or Codex.

## Transform
- allocate `project_id`
- verify approval and hashes
- register immutable inputs
- initialize workflow state

## Output
- `ProjectEnvelope`

## Verify
- supported schema versions
- approved and non-superseded script
- project request idempotency
- valid asset URIs/checksums

## Failure routing
Invalid content returns upstream; invalid configuration returns to the requester.