# Retry Policy

- Deterministic validation errors are not blindly retried.
- Transient infrastructure failures use bounded exponential backoff.
- GPT tasks may receive one repair attempt with explicit validator errors; a second failure escalates or blocks.
- Codex repair runs only against a scoped implementation defect with tests and rollback.
- Retry counts, inputs, worker versions, costs, and outcomes are logged.
- A retry cannot silently change upstream approved artifacts.
- Exhausted retries emit a terminal gate failure and invoke failure routing.