# BD — Hub v2 Phase B (Build Plan)
**Date:** 2026-07-16 · **Status:** 🟢 Ready · **Author:** Claude (Fable 5)
**Upstream:** `SD-hub-v2-command-center.md` §11 Phase B · Phase A đã ship (`ab67ecb`, `f132c39`, `ddbd614`, 117 tests xanh).

---

## 0. Mô hình orchestra (áp dụng cả Phase B + C)

| Vai | Ai | Làm gì |
|---|---|---|
| **Orchestra** | Claude main session (Opus/Fable) | Viết brief từng step, giao việc, ghép file shared (`server.py`, `config.py`), browser-verify UI, commit |
| **Coder** | **Codex** (`codex exec`) | Mọi step gắn nhãn `[CODEX]` — code + test đi kèm |
| **Tester/Reviewer** | **Sonnet subagent** | Sau mỗi step `[CODEX]`: (1) chạy full pytest + báo kết quả, (2) review diff đối chiếu BD, một dòng/finding |

**⚠️ Cách chạy Codex (bắt buộc — lesson 2026-07-16):** KHÔNG spawn `codex exec` từ Bash tool của Claude (nested sandbox → treo toàn bộ terminal của Codex, 0 file sửa). Quy trình đúng:
1. Claude viết brief ra file `harness/hub/briefs/<step>.txt` + in lệnh paste-ready.
2. **User dán lệnh vào terminal thật** (Windows Terminal / PowerShell):
   ```
   set PATH=C:\Users\HUY\AppData\Local\pnpm;%PATH%
   cd C:\Users\HUY\workspace\ai-project-opus
   codex exec --skip-git-repo-check -m gpt-5.6-sol "FRESH START, don't ask. Follow harness/hub/briefs/<step>.txt exactly." < NUL
   ```
3. Codex xong → user báo Claude → Claude spawn Sonnet test/review → pass thì commit, fail thì Claude viết brief sửa (lặp).

**Test gate mỗi step:** `.ih\Scripts\python.exe -m pytest harness/hub/tests -q` xanh 100% (117+ test). Sonnet chạy, không phải Codex tự khai.
**Fake CLI rule giữ nguyên:** test không gọi claude/codex/NVIDIA thật.

---

## 1. Tổng quan step Phase B

| Step | Nội dung | Executor | Size | Phụ thuộc |
|---|---|---|---|---|
| B0 | Fix codex provider detection | [CODEX] | S | — |
| B1 | Chat multi-pane grid (panes[] refactor) | [CODEX] | L | — (song song B0) |
| B2 | Broadcast mode | [CODEX] | M | B1 |
| B3 | Session resume bền vững | [CODEX] | M | B1 |
| B4 | Skill drift tab + deploy UX + deploy log | [CODEX] | S | — (song song B1) |
| B5 | Trang Settings providers + Gemini thật | [CODEX] + user cài CLI | M | B0 |
| B✔ | Browser-verify + DESIGN.md + commit mỗi step | Claude main | — | từng step |

---

## Step B0 — Codex detection fix `[CODEX]` (S)

**Hiện trạng:** `claude` online sau fix `.cmd` (`ddbd614`); `codex` vẫn `not_installed` dù binary có (pnpm 0.144.3).
**Việc:** sửa `services/providers/codex_cli.py::status()`:
- Chạy version check với `stdin=subprocess.DEVNULL` (codex treo đọc stdin — lesson đã ghi), timeout nâng 10s, dùng `procs.resolve_cmd` (đã có).
- Nếu vẫn fail: thử `[*base, "--version"]` qua `cmd /c` với `CREATE_NO_WINDOW`; log detail thật (stderr) thay vì nuốt thành "not_installed" — để debug được từ `/api/providers`.
**Test:** fake codex script + 1 test mới: status detail chứa stderr khi returncode≠0.
**DoD:** `/api/providers` → codex `available:true, version:"codex-cli 0.144.3"` trên máy thật (Claude main verify bằng curl).

## Step B1 — Chat multi-pane grid `[CODEX]` (L)

**Việc (SD §6, hoàn thành FR-133 full):** trong `web/app.js`:
- Refactor `chatState` → `chatPanes: [paneState]` (paneState = shape hiện tại + `provider`, `sessionId`, `id`). Mọi hàm chat nhận `pane` param thay vì global (send/stream/render/export/persistence per-pane).
- localStorage: key mới `harness-hub-chat-v2` `{panes:[...]}`; migration từ key cũ (`harness-hub-chat` → panes[0]) rồi xoá key cũ.
- Layout: grid `repeat(auto-fit,minmax(360px,1fr))`, nút `+ Pane` (max 3), nút đóng pane; mobile 1 cột. CSS vào `styles-hub.css` (KHÔNG đụng `styles.css`).
- Provider selector + model picker + read-only badge: per-pane (tái dùng component sẵn — đã hoạt động single-pane).
- Giữ nguyên per-pane: markdown render, export MD/JSON, copy/regenerate, stop (AbortController per-pane), thinking toggle, autoscroll.
**Ràng buộc:** chỉ sửa `web/` + thêm test JS-free (backend không đổi). KHÔNG đổi contract SSE.
**Test:** backend không đổi → suite hiện có xanh; Codex thêm smoke: `node --check app.js`.
**DoD:** Claude main mở browser: 2 pane nvidia+claude chat song song, đóng/mở pane, reload giữ state, mobile stack.

## Step B2 — Broadcast mode `[CODEX]` (M, sau B1)

**Việc (FR-104):** thanh input broadcast trên đầu trang chat + toggle per-pane "nhận broadcast"; 1 prompt gửi đồng thời mọi pane active (mỗi pane stream độc lập, lỗi pane nào hiện pane đó). Nút Stop All.
**DoD:** browser-verify 1 prompt → 2 pane trả lời song song.

## Step B3 — Session resume bền vững `[CODEX]` (M, sau B1)

**Việc (FR-105):**
- Claude: đã có `-r <session_id>` — verify sau restart server vẫn resume (session của CLI, không phụ thuộc server).
- Codex: verify `codex exec resume <id>` trên 0.144.3 (Codex tự test bằng fake trước, Claude main verify thật). Không ổn → fallback nối transcript ≤4000 chars vào prompt, set capability `resume:false`.
- UI: pane hiện chip `session <id-8-chars>` khi có; nút "New chat" reset per-pane.
**Test:** fake CLI trả session_id → pane gửi lượt 2 kèm `-r`/`resume` đúng.
**DoD:** chat Claude 2 lượt — lượt 2 nhớ ngữ cảnh lượt 1 (Claude main verify thật, 1 lần, prompt rẻ).

## Step B4 — Skill drift tab + deploy UX `[CODEX]` (S, song song B1)

**Việc (FR-113 UI):** trang `#/skills-lib`:
- Tab "Drift": bảng DriftEntry (name, variants source+hash-8+mtime, nút "Sync →" chọn hướng = gọi deploy).
- Deploy: confirm dialog (from → to, cảnh báo backup tự tạo); hiện kết quả + link backup path.
- Panel "Deploy log": đọc `GET /api/skill-library/deploy-log` (endpoint MỚI — đọc `.cache/skill_deploy_log.jsonl`, 50 dòng cuối).
**Test:** endpoint deploy-log + fixture.
**DoD:** browser-verify drift tab hiện `opus-design-reviewer` (đang drift thật trên máy).

## Step B5 — Settings providers + Gemini `[CODEX]` (M, sau B0)

**Việc (FR-131 + Gemini):**
- Trang `#/settings`: bảng provider (id, version, available, detail, capabilities), nút Refresh; hint cài đặt khi offline (gemini: `npm i -g @google/gemini-cli`).
- `gemini_cli.py` thật: `gemini -p <prompt>` one-shot, history tự nối vào prompt (capability `resume:false`), parse stdout plain text → delta events; usage=0 nếu không có số liệu. status() qua `resolve_cmd`.
- **User action trước:** cài Gemini CLI + login Google ở terminal thật. Chưa cài → step vẫn merge được (stub logic giữ nguyên khi absent).
**Test:** fake gemini script.
**DoD:** settings page render 4 provider đúng trạng thái; nếu user đã cài gemini → chat được 1 lượt thật.

---

## 2. Quy trình lặp mỗi step (orchestra checklist)

```
1. Claude: viết harness/hub/briefs/<step>.txt (scope + file whitelist + test yêu cầu + DoD)
2. User: chạy lệnh codex exec (paste-ready, terminal thật)
3. Sonnet #1 (test-runner): full pytest + node --check; báo pass/fail + log lỗi
4. Sonnet #2 (reviewer): diff vs brief — scope creep? file ngoài whitelist? style? một dòng/finding
5. Claude: fix nhỏ trực tiếp (nếu finding S) hoặc brief sửa cho Codex (nếu M/L)
6. Claude: browser-verify UI step nào có UI + screenshot
7. Claude: commit theo format feat/fix(hub) + cập nhật TODO
```

**Definition of Done Phase B:** B0–B5 merge, suite xanh, codex+claude+nvidia (+gemini nếu cài) chat được thật từ UI, multi-pane + broadcast + resume hoạt động, drift/deploy UI chạy, settings page live.

*Hub v2 — BD Phase B | 2026-07-16*
