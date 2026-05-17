# BD — Build Plan: {Project/Feature Name}
**Date:** {YYYY-MM-DD}
**Status:** 🔵 Planning | 🟡 In Progress | 🟢 Done
**Ref:** `RD-{name}.md`, `SD-{name}.md`
**Estimate:** {X} hours

---

## Prerequisites

Trước khi bắt đầu build, cần có:
- [ ] RD approved (Gate 1)
- [ ] SD approved (Gate 2)
- [ ] {Dependency A} installed/available
- [ ] {API key / credential} configured

---

## Build Steps

### Step 0 — Verify/Spike (nếu cần)
**Mục tiêu:** Confirm technical assumption trước khi build full
**Việc làm:**
- [ ] ...
**Smoke test:** `{command}` → expected output: `...`
**Estimate:** {X} min

---

### Step 1 — {Tên Step}
**Mục tiêu:** ...
**Files:**
- Tạo mới: `{path/to/file.py}`
- Sửa: `{path/to/existing.py}` — thêm `{function_name}()`
**Việc làm:**
- [ ] ...
- [ ] ...
**Smoke test:** `{command}` → expected: `...`
**Estimate:** {X} min

---

### Step 2 — {Tên Step}
**Mục tiêu:** ...
**Files:**
- Tạo mới: `...`
**Phụ thuộc:** Step 1 done
**Việc làm:**
- [ ] ...
**Smoke test:** `{command}` → expected: `...`
**Estimate:** {X} min

---

### Step N — Integration Test
**Mục tiêu:** End-to-end test toàn pipeline
**Test cases:**
- [ ] Happy path: `{command}` → `{expected output}`
- [ ] Edge case: `{command}` → `{expected output}`
- [ ] Error case: `{command}` → `{expected error handling}`
**Estimate:** {X} min

---

## Rollback Plan

Nếu Step X fail và cần rollback:
- Xóa files: `{list}`
- Revert config: `{what to revert}`
- Không có DB migration → không cần rollback phức tạp

---

## Checklist Trước Khi Done

- [ ] Tất cả smoke tests pass
- [ ] Tất cả FR trong RD có implementation
- [ ] Không có P0 NFR bị vi phạm
- [ ] Không có hardcoded credentials
- [ ] BD doc updated (các step marked ✅)

---

*{Project} — BD v{version} | {date}*
