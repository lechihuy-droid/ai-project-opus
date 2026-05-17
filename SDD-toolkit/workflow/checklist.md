# SDD Checklist — Quick Reference
**Version:** 1.0

---

## Phase 0 — Discovery ✓

- [ ] Problem statement viết được trong 2-3 câu
- [ ] Biết ai là user, dùng ở đâu, khi nào
- [ ] Có definition of done (thành công = gì)
- [ ] Constraint đã xác định (time, cost, tech)
- [ ] User confirm problem statement

---

## Phase 1 — Requirements ✓

- [ ] Usage section viết trước FR
- [ ] Có ít nhất 2 ví dụ usage cụ thể
- [ ] Mỗi FR có thể test được (pass/fail rõ ràng)
- [ ] Priority gán cho mỗi FR (P0/P1/P2)
- [ ] Có Explicit Exclusions (ít nhất 1)
- [ ] Open Questions đã confirm hoặc có default
- [ ] User approve RD

---

## Phase 2 — Design ✓

- [ ] Data flow rõ từ input → output (step by step)
- [ ] Mỗi component có boundary rõ (input/output/side effects)
- [ ] Interface contracts đủ để code mà không cần đọc implementation
- [ ] Technology decisions có "tại sao không chọn alternative"
- [ ] Error handling strategy được define
- [ ] User approve SD

---

## Phase 3 — Build Plan ✓

- [ ] Steps ordered theo dependency (no forward refs)
- [ ] Mỗi step có smoke test command
- [ ] Mỗi step estimate time thực tế (không optimistic)
- [ ] Step 0 = verify assumption (nếu có unknown)
- [ ] Rollback plan nếu cần
- [ ] User confirm build plan

---

## Phase 4 — Implementation ✓

- [ ] Follow steps theo thứ tự BD
- [ ] Smoke test sau mỗi step → mark ✅
- [ ] Không add feature ngoài FR scope
- [ ] Không update code trước khi update doc (nếu design thay đổi)
- [ ] Flag blocker sớm, không âm thầm skip

---

## Phase 5 — Review ✓

- [ ] Cross-check từng P0 FR có implementation
- [ ] Cross-check từng P0 NFR được thỏa mãn
- [ ] Tất cả smoke tests pass
- [ ] Docs reflect actual implementation (không outdated)
- [ ] Không có hardcoded credentials/API keys

---

## Red Flags — Dừng Lại Khi Thấy

🚩 FR dùng từ vague: "nhanh", "tốt", "đẹp" → cần metric cụ thể
🚩 Chưa có Usage section mà đã viết FR → đọc RD template lại
🚩 Build plan step đầu tiên là "implement everything" → cần break down
🚩 SD doc chưa có nhưng đã bắt đầu code → stop, viết SD trước
🚩 Gặp blocker kỹ thuật mà không báo user → risk scope change ẩn
