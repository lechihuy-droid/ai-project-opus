> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# Retry Policy

- Deterministic validation errors are not blindly retried.
- Transient infrastructure failures use bounded exponential backoff.
- GPT tasks may receive one repair attempt with explicit validator errors; a second failure escalates or blocks.
- Codex repair runs only against a scoped implementation defect with tests and rollback.
- Retry counts, inputs, worker versions, costs, and outcomes are logged.
- A retry cannot silently change upstream approved artifacts.
- Exhausted retries emit a terminal gate failure and invoke failure routing.