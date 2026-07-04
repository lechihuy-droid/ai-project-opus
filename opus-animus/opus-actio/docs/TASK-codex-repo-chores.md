# TASK — Codex: PlanView ¥↔万 toggle + 2 commits

FRESH START, không hỏi. Làm 3 việc trong repo `C:/Users/HUY/workspace/ai-project-opus`, đúng thứ tự.

## Việc 1 — Toggle ¥↔万 trong PlanView

File: `opus-animus/apps/opus-home/index.html`, chỉ sửa trong `function PlanView()`.

- Helper `yen()` và `man()` đã có sẵn (dùng chung với ActioView).
- Thêm state local: `const [unit, setUnit] = useState('yen')`.
- Thêm 1 nút toggle nhỏ cạnh hàng 3 tab nội bộ THÁNG/5 NĂM/TỚI HƯU (hoặc góc phải hàng đó): hiển thị `¥` / `万`, click đổi unit.
- Helper nội bộ: `const fm = (v) => unit === 'man' ? man(v) : yen(v)`.
- Áp dụng `fm` cho các chỗ hiển thị tiền lớn: waterfall amounts + total, year cards (invested/cash/net worth), house gate (price/loan/monthly payment), retirement blocks pool, bridge amount + nenkin.
- KHÔNG đổi các số nhỏ/percent. KHÔNG đụng ActioView. KHÔNG hardcode số thật.
- Verify: file vẫn parse được (JSX babel).

## Việc 2 — Commit 1: actio plan cockpit

`git add` đúng các file sau rồi commit message `feat(actio): plan cockpit v3 (plan API v2 + plan-state + PlanView tab)`:

- `opus-animus/apps/opus-home/index.html`
- `opus-animus/opus-consilium/api/actio.py`
- `opus-animus/opus-actio/ai/status.md`
- `opus-animus/opus-actio/docs/BD-plan-cockpit.md`
- `opus-animus/opus-actio/docs/PLAN-app-rebuild.md`
- `opus-animus/opus-actio/docs/RD-plan-cockpit.md`
- `opus-animus/opus-actio/docs/REVIEW-app-vs-plan-v3.md`
- `opus-animus/opus-actio/docs/SD-plan-cockpit.md`
- `opus-animus/opus-actio/docs/SD-plan-dashboard.md`
- `opus-animus/opus-actio/docs/TASK-codex-repo-chores.md` (file này)

## Việc 3 — Commit 2: harness hub

`git add` toàn bộ thay đổi còn lại dưới `harness/hub/` (modified + untracked: ARCHITECTURE.md, config.py, server.py, tests/test_chat.py, web/app.js, web/index.html, docs/workspace.md, refer/, web/styles-workspace.css, web/workspace.js) rồi commit message `feat(hub): workspace page + chat updates`.

## Ràng buộc

- KHÔNG add bất kỳ file nào trong `data/_local/` (đã gitignore — kiểm tra lại bằng `git status` sau cùng).
- KHÔNG push. KHÔNG sửa file khác ngoài phạm vi Việc 1.
