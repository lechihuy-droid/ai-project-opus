# Dev Checklist — Quick Reference

## Trước Khi Bắt Đầu Bất Kỳ Feature Nào

- [ ] Đọc `dev-approach/README.md` — xác định cần full SDD hay lightweight
- [ ] Kiểm tra `TODO.md` — feature này có trong backlog chưa? Priority?
- [ ] Kiểm tra `docs/SA-system-architecture.md` — feature mới ảnh hưởng component nào?

---

## Phase 1 — RD Checklist

- [ ] Usage section viết trước FR (có ví dụ cụ thể)
- [ ] Mỗi FR testable — có pass/fail rõ ràng
- [ ] Có Explicit Exclusions (ít nhất 1)
- [ ] Open Questions confirmed hoặc có default
- [ ] User approve

---

## Phase 3 — BD Checklist

- [ ] Steps ordered theo dependency
- [ ] Mỗi step có smoke test command
- [ ] Step 0 = verify unknown assumption
- [ ] User confirm

---

## Phase 4 — Implementation Checklist

- [ ] Smoke test sau mỗi step → mark ✅ trong BD
- [ ] Không add feature ngoài FR scope
- [ ] Không update code trước khi update doc (nếu design change)

---

## Phase 5 — Review Checklist

- [ ] Cross-check P0 FRs có implementation
- [ ] Smoke tests pass
- [ ] SA doc updated nếu có component boundary thay đổi
- [ ] TODO.md updated (mark done, add follow-up items)
- [ ] Không có hardcoded credentials

---

## Red Flags

🚩 FR dùng từ vague ("nhanh", "tốt") — cần metric
🚩 Usage section chưa có mà đã viết FR
🚩 Build plan step đầu = "implement everything"
🚩 Code chạy trước khi SD doc có interface contract
🚩 Gặp blocker mà không báo user
