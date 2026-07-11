> **Status: roadmap — chưa implement trong code (2026-07-12).** Spec này mô tả pipeline mục tiêu; code hiện tại chưa có gate/approval/checksum tương ứng. Thực tế đang chạy: xem `design/workflow/README.md` (mục Implementation Status) và `opus-lucida/11-current-operating-flow.md`.

# Global Validation Rules

1. Validate schema before semantic or quality checks.
2. Never trust LLM output without deterministic validation.
3. Reject unresolved references, unknown versions, or invalid hashes.
4. Verify hard constraints before ranking or subjective critique.
5. Script, audio, caption, and visual timeline hashes must agree.
6. A gate may only modify artifacts it owns.
7. Warnings require explicit policy for continued execution.
8. Validation results are versioned artifacts and part of audit history.
9. Scene-local defects should not invalidate unrelated scenes.
10. Publication requires rights, provenance, and approval validation.