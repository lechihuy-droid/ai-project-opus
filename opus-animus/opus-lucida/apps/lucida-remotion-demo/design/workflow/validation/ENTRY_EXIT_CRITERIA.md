# Entry and Exit Criteria

## Entry criteria
A gate may start only when all required input artifacts:
- exist at supported schema versions
- have valid hashes and dependency references
- are not rejected or superseded
- satisfy upstream approval requirements
- are not stale relative to changed dependencies

## Exit criteria
A gate succeeds only when:
- output schema passes
- gate-specific hard and semantic checks pass
- provenance and worker versions are recorded
- output status is `validated`
- emitted events and dependency indexes are persisted

A warning outcome must name the accepting policy or human approver.