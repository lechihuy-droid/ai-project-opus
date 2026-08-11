# BD — Build Plan: Harness Remediation (Architecture + Security)

**Date:** 2026-08-10
**Status:** 🟢 P0–P3 done, pushed to `claude/vibe-coded-app-architecture-ahffqi` (2026-08-11). Xem "Definition of Done" cho mục còn open.
**Ref:** Architecture & Security Audit 2026-08-10 (5 parallel subagent audits)
**Scope:** `harness/` — eval runner, hub backend, web-v3, version-governance, docs/governance
**Estimate:** ~14–18 giờ Codex + ~3 giờ review (Opus)

---

## 0. Bối cảnh — vì sao plan này không phải "sửa 28 bug"

Audit tìm được 28 finding, nhưng **4 finding critical/high nghiêm trọng nhất là cùng MỘT lỗi mô hình lặp lại ở 4 nơi độc lập**: dùng denylist / classifier fail-open ở chỗ lẽ ra phải là allowlist fail-closed.

| # | Nơi | Cơ chế hiện tại | Hệ quả |
|---|---|---|---|
| 1 | `run_harness.py:48-72` | Blacklist token shell, regex word-boundary | `rm` bị chặn, `shutil.rmtree` lọt |
| 2 | `hub/services/hooks.py:45-48` | Chỉ validate `command` là list string không rỗng | Binary tuỳ ý |
| 3 | `hub/services/fsbrowse.py:11-24` | Denylist `.ssh`/`.aws`/... | Mọi thư mục khác liệt kê được |
| 4 | `hub/services/verify.py:28,39-41` | `classify_command` → `UNKNOWN` bị **lọc bỏ** | Binary lạ ⇒ không destructive ⇒ **allow** |

Instance #4 là lớp gate cuối cùng đứng sau #2. Nó fail-open, nên chuỗi `no-auth → hook shell → approve()` không có chốt chặn thực nào.

**Nguyên tắc xuyên suốt plan:** mỗi phase không chỉ vá lỗ, mà **lật chiều mặc định** của đúng cơ chế đó. Không thêm token vào blacklist.

Đi kèm là chủ đề thứ hai — *guardrail đã build nhưng không nối vào đường thực thi*: `verify_dod.py` không có trong CI, Docker sandbox là opt-in, suite `boundary-compliance` test chính cơ chế đang thủng. Phase 3 xử lý phần này.

---

## Prerequisites

- [ ] Plan này APPROVE (Gate 3 — BD)
- [ ] Python 3.11 available; `harness/hub` chạy được local (`run-hub.ps1`)
- [ ] Docker Desktop cài đặt — cần cho P3.1 (`verify_dod.py` dựng compose stack)
- [ ] Node/pnpm cho `web-v3` build
- [ ] Branch làm việc: `claude/vibe-coded-app-architecture-ahffqi`
- [ ] **Nhánh riêng cho từng phase** — P0 chạm auth + execution path, không gộp chung PR với P2

---

## Phân tuyến (theo Model & Agent Routing trong CLAUDE.md)

| Phase | Việc | Giao cho |
|---|---|---|
| P0.1–P0.3 | Auth token, hook allowlist, fail-closed classifier, runner default-deny + test | **Codex** |
| P1.1–P1.3 | Provider timeout/concurrency, config env, `shutil.which` | **Codex** (P1.1) / **Sonnet** (P1.2–1.3) |
| P2.1–P2.2 | CI wiring, agent-config propagation | **Sonnet** |
| P3.1–P3.3 | FE strict + test, mojibake, docs reconciliation | **Codex** (P3.1) / **Sonnet** (P3.2–3.3) |
| Xuyên suốt | Review từng output, 2 ADR, quyết định policy | **Opus** — main session |

---

# PHASE 0 — Đóng chuỗi critical (P0, làm trước, không hoãn)

## Step P0.1 — Auth thật cho Hub API

**Mục tiêu:** Thay header tĩnh `x-hub-client: harness-hub` (hardcode trong source) bằng token per-install. Đóng finding critical #1 và cắt điều kiện tiên quyết của #2.

**Quyết định thiết kế (Opus):** dùng **mô hình token-in-URL của Jupyter**, không dùng cookie/session.
Lý do: web-v3 là static build do chính hub serve, nên nếu inject token vào `index.html` thì bất kỳ process local nào `GET /` cũng lấy được token — vòng luẩn quẩn. Token nằm trong URL khởi động cắt được vòng đó: process khác không đoán được token và không đọc được trang nếu không có nó.

**Files:**
- Sửa: `hub/config.py` — bỏ `HUB_CLIENT_HEADER`/`HUB_CLIENT_VALUE`; thêm `HUB_TOKEN_FILE = RUNTIME_STORE_DIR / "hub-token"`, `HUB_TOKEN` load-or-generate
- Sửa: `hub/server.py` — `_csrf_guard` → `_auth_guard`
- Sửa: `hub/web-v3/src/lib/api.ts` — đọc `?k=` → `sessionStorage` → gắn header `X-Hub-Token`
- Sửa: `hub/run-hub.ps1` — in URL kèm token
- Sửa: `.gitignore` — thêm `hub-token`
- Test mới: `hub/tests/test_auth_guard.py`

**Việc làm:**
- [ ] Sinh token `secrets.token_urlsafe(32)` lần chạy đầu, ghi file với `chmod 0600`; lần sau đọc lại. Cho phép override bằng env `HUB_TOKEN`
- [ ] Gate **mọi** request (kể cả GET), trừ allowlist: `/api/health`, `/static/*`
- [ ] Chấp nhận token qua header `X-Hub-Token`, **hoặc** query `?k=` (chỉ dùng cho lần load `/` đầu tiên)
- [ ] Giữ nguyên origin check hiện có làm defense-in-depth — **không xoá**
- [ ] Giữ nguyên logic idempotency + correlation-ID + SSE (đang chạy tốt, đừng đụng)
- [ ] `run-hub.ps1` in `http://127.0.0.1:8799/?k=<token>` ra console lúc start
- [ ] So sánh token bằng `secrets.compare_digest`, không dùng `==`

**Smoke test:**
```
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8799/api/agent/runs        # → 403
curl -s -o /dev/null -w "%{http_code}" -H "X-Hub-Token: $TOKEN" .../api/agent/runs # → 200
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8799/api/health            # → 200
```

**Đánh giá (acceptance):**
1. `pytest hub/tests/test_auth_guard.py` pass — case: no token 403, sai token 403, đúng token 200, `/api/health` mở, `compare_digest` được dùng
2. `pytest hub/tests/` — **toàn bộ 339+ test cũ vẫn pass** (fixture phải được cập nhật để gửi token)
3. `grep -rn "harness-hub" hub/` → không còn hit nào ngoài CHANGELOG
4. Mở UI bằng URL có token → mọi page load bình thường, không có 403 trong console

**Estimate:** 3h (Codex) + 30' review

---

## Step P0.2 — Hook shell: allowlist + classifier fail-closed

**Mục tiêu:** Đóng finding critical #2 và #4. Đây là step quan trọng nhất trong plan.

**Quyết định thiết kế (Opus) — cần ADR:** `verify.rule_check` chuyển `UNKNOWN` từ *bỏ qua* sang *deny*, nhưng **chỉ cho job không có người giám sát**. Job tương tác có người ngồi trước màn hình thì `UNKNOWN` → `warn` như cũ.
Lý do: lật fail-closed toàn bộ sẽ chặn hàng loạt workflow hợp lệ đang chạy (mọi binary không có trong `risk_tiers.json` đều thành deny) → dev sẽ bật `allow_override` khắp nơi và guardrail chết theo cách tệ hơn. Phân biệt theo *có người giám sát hay không* là ranh giới đúng: hook fire tự động, không ai duyệt.

**Files:**
- Sửa: `hub/services/hooks.py` — `_validate()` (dòng 45-48)
- Sửa: `hub/services/verify.py` — `_command_tiers()` (dòng 20-28), `rule_check()` (dòng 31-51)
- Sửa: `hub/services/gitjobs.py` — `create_hook_job()` gắn cờ `unattended=True`
- Sửa: `hub/config.py` — thêm `HOOK_ALLOWED_COMMANDS`, `RISK_UNKNOWN_UNATTENDED = "deny"`
- Test mới: `hub/tests/test_hook_command_allowlist.py`, bổ sung `hub/tests/test_verify_rules.py`

**Việc làm:**
- [ ] `hooks._validate()`: với `action.type == "shell"`, `Path(command[0]).name` phải nằm trong `config.HOOK_ALLOWED_COMMANDS` (mặc định **rỗng** = tắt shell hook cho tới khi user khai báo tường minh); sai → `ValueError`
- [ ] `verify._command_tiers()`: **không lọc bỏ** `UNKNOWN` nữa — trả về nguyên trạng
- [ ] `verify.rule_check()`: nếu `job.get("unattended")` và có tier `UNKNOWN` → `decision: deny`, reason `"unclassified command in unattended job"`
- [ ] Job tương tác gặp `UNKNOWN` → `warn` (giữ hành vi cũ), reason nói rõ command nào chưa phân loại
- [ ] `create_hook_job()` set `record["unattended"] = True`
- [ ] `allow_override` vẫn bypass được — nhưng ghi `governance.record_denial(...)` để có vết audit
- [ ] **Không đụng** `gitjobs.approve()` phần tier-blocking + approval receipt hiện có

**Smoke test:**
```
POST /api/hooks  {"action":{"type":"shell","command":["/tmp/evil"]}}   → 400 (không trong allowlist)
POST /api/hooks  {"action":{"type":"shell","command":["git","status"]}} → 201 (nếu git trong allowlist)
```

**Đánh giá (acceptance):**
1. Test mới chứng minh **đúng chuỗi tấn công trong audit đã chết**: tạo hook `command=["/tmp/evil"]` → reject ở tầng validate; nếu bypass validate (gọi thẳng `create_hook_job`) → `approve()` deny vì `UNKNOWN` + `unattended`. **Hai lớp, cả hai phải có test.**
2. `pytest hub/tests/test_verify_rules.py` — job tương tác với command lạ vẫn `warn`, không `deny` (chống regression cho workflow đang chạy)
3. Toàn bộ `pytest hub/tests/` pass
4. Chạy tay một workflow thật có agent bash → không bị deny oan

**Estimate:** 3h (Codex) + 45' review (Opus) + ADR

---

## Step P0.3 — Runner: default-deny thay cho blacklist

**Mục tiêu:** Đóng finding critical #3. Bỏ allowlist vô điều kiện cho `python`/`py`, chặn inline code.

**Quyết định thiết kế (Opus):** không cố vá blacklist. Interpreter vẫn được chạy — nhưng chỉ qua **đường dẫn tuyệt đối đã resolve** (`ctx["python"]`, `ctx["py311"]`, `sys.executable`), và **`-c` / `-m` bị chặn mặc định**. Suite hợp lệ chạy file `.py` trong root thì không ảnh hưởng.

**Files:**
- Sửa: `harness/run_harness.py` — `_enforce_command_boundary()` (dòng 296-297, 315-328)
- Test mới: `harness/tests/test_boundary.py` (thư mục `harness/tests/` chưa tồn tại — tạo mới)
- Suite mới: `harness/suites/security-regression.json` + probes

**Việc làm:**
- [ ] Xoá `allowed_names.update({"py","py.exe","python","python.exe"})` (dòng 297). Interpreter chỉ hợp lệ khi khớp `safe_external_paths` — logic này đã có sẵn ở dòng 298-311
- [ ] Thêm `INLINE_CODE_FLAGS = {"-c","-m","--command"}`: nếu argv chứa flag này và không có `allow_inline_code` → `BoundaryPolicyError`
- [ ] Giữ blacklist token làm lớp phụ — **nhưng thêm comment nói rõ nó là defense-in-depth, không phải cơ chế chính**, để agent sau không tưởng nó là gate
- [ ] Tách logic boundary thành hàm thuần, test được độc lập, không cần subprocess
- [ ] Nếu có suite hiện tại dùng `python -c` → sửa thành file `.py` trong `harness/`, hoặc gắn `allow_inline_code` tường minh kèm comment lý do

**Smoke test:**
```
python harness/run_harness.py --suite security-regression   # → tất cả probe FAIL đúng như thiết kế (probe là negative case)
python harness/run_harness.py --suite workspace-smoke       # → vẫn pass như trước
```

**Đánh giá (acceptance):**
1. `pytest harness/tests/test_boundary.py` — **bypass trong audit là một named test case và nó phải fail-closed**: `["python","-c","import shutil"]` → raise `BoundaryPolicyError`
2. Test trực tiếp `_enforce_command_boundary` và `_looks_like_path_argument`, **không qua subprocess** — đây là điểm sửa cốt lõi so với hiện trạng (suite cũ test chính đường đang thủng)
3. `--suite workspace-smoke` và `--suite boundary-compliance` vẫn pass → không phá suite đang chạy
4. Suite `security-regression` mới chạy được và bắt lại đủ 3 bypass: interpreter inline, path arg ngoài root, shell launcher

**Estimate:** 2.5h (Codex) + 30' review

---

## Step P0.4 — fsbrowse: đảo sang allowlist

**Mục tiêu:** Đóng finding high #4 (liệt kê filesystem không auth). Sau P0.1 nó đã có auth, nhưng cơ chế vẫn sai chiều.

**Files:** `hub/services/fsbrowse.py` (dòng 11-24, 50-83, 95-112), `hub/config.py`

**Việc làm:**
- [ ] Thêm `config.FS_BROWSE_ROOTS` — mặc định `[ROOT]` (workspace root)
- [ ] `list_dirs()` chỉ liệt kê trong các root này; ngoài root → `PermissionError`
- [ ] `resolve_workspace_dir()`: ngoài root → yêu cầu cờ tường minh **và** ghi `audit` record, không còn advisory flag suông
- [ ] Giữ denylist cũ làm lớp phụ bên trong allowlist

**Đánh giá:** test `list_dirs("/")` → raise; `list_dirs(ROOT)` → OK; `resolve_workspace_dir` ngoài root ghi đúng 1 dòng audit.

**Estimate:** 1h (Codex) + 15' review

---

# PHASE 1 — Resilience & config (P1)

## Step P1.1 — NVIDIA provider: timeout, retry, concurrency cap
**Files:** `hub/services/chat.py:189`, `hub/config.py`
- [ ] Truyền `timeout=` tường minh vào `OpenAI(...)`; thêm retry có bound (2 lần, backoff)
- [ ] Áp cùng cơ chế semaphore mà CLI provider đang dùng (`MAX_CONCURRENT_CLI` ở `procs.py:128-173`) — **tái dùng, không viết mới**
- [ ] Giữ nguyên mapping exception hiện có ở `chat.py:238-243` (đang đúng)

**Đánh giá:** test với mock server treo → request bị cắt đúng timeout, không treo worker; vượt cap → `BusyError` giống CLI path.
**Estimate:** 1.5h (Codex)

## Step P1.2 — `VGOV_BASE_URL` đọc từ env
**Files:** `hub/config.py:27`
- [ ] `os.environ.get("VGOV_BASE_URL", "http://127.0.0.1:8810")`
**Đánh giá:** set env khác → `hub/tests/test_vgov_proxy.py` trỏ đúng target mới. **Estimate:** 10' (Sonnet)

## Step P1.3 — Codex CLI path cross-platform
**Files:** `hub/config.py:386`
- [ ] `shutil.which("codex")` trước, fallback về path Windows hiện tại
**Đánh giá:** import `config` trên Linux không lỗi; provider resolve được. **Estimate:** 15' (Sonnet)

---

# PHASE 2 — Nối guardrail vào đường thực thi (P1)

## Step P2.1 — `verify_dod.py` vào CI
**Mục tiêu:** Gate đã có sẵn và chạy được — chỉ thiếu dây nối.
**Files:** `.github/workflows/version-governance-dod.yml` (mới)
- [ ] Workflow trigger trên PR chạm `harness/version-governance/**`
- [ ] `docker compose up -d` → chờ healthy → `python verify_dod.py` → teardown
- [ ] Đặt là required check
- [ ] Nếu compose quá nặng cho CI: tối thiểu chạy subset pytest của nó — **nhưng ghi rõ phần nào không được cover**

**Đánh giá:** cố tình phá 1 immutability invariant trên nhánh nháp → CI phải đỏ. Không thử nghiệm bằng cách này thì không coi là done.
**Estimate:** 1.5h (Sonnet)

## Step P2.2 — Rải safety rule sang 5 cây config agent
**Mục tiêu:** Cline/Cursor/Windsurf/OpenCode/Copilot hiện chỉ có fragment caveman, **không có** rule cấm commit dữ liệu tài chính/sức khoẻ.
**Files:** `.clinerules/`, `.cursor/rules/`, `.windsurf/rules/`, `.opencode/AGENTS.md`, `.github/copilot-instructions.md`
- [ ] Mỗi cây thêm phần Git & Data Safety + con trỏ tới `CLAUDE.md`
- [ ] Giữ nguyên fragment tone sẵn có
- [ ] **Không** copy nguyên CLAUDE.md 5 lần — copy phần data-safety, còn lại trỏ về, tránh tạo thêm nguồn drift

**Đánh giá:** mỗi file nêu đích danh `finance.db`, `data/_local/`, health data. **Estimate:** 30' (Sonnet)

---

# PHASE 3 — Hygiene & docs (P2)

## Step P3.1 — web-v3: bật strict + test đầu tiên
**Files:** `web-v3/tsconfig.app.json`, `web-v3/package.json`, `web-v3/src/lib/*.test.ts`
- [ ] Bật `"strict": true`, sửa hết lỗi phát sinh
- [ ] Thêm vitest; test trước cho error path của `lib/api.ts` + `lib/vgovApi.ts`
- [ ] (Nếu strict ra quá nhiều lỗi) → generate type từ `openapi.json` thay vì chép tay `vgovApi.ts:5-68`

**Đánh giá:** `tsc -b` sạch với strict; `vitest run` pass; **không** dùng `any` để dập lỗi — Opus review diff tìm `as any`.
**Estimate:** 3h (Codex)

## Step P3.2 — Sửa mojibake
**Files:** `hub/api/chat.py:91` — `"Tá»‡p Ä‘Ã­nh kÃ¨m..."` → `"Tệp đính kèm của chat"`
**Đánh giá:** grep mojibake pattern (`Ã|Â|â€`) trong `hub/**/*.py` → 0 hit. **Estimate:** 15' (Sonnet)

## Step P3.3 — Dọn nguồn sự thật của docs
- [ ] `hub/ARCHITECTURE.md`: sửa 3 chỗ nói giảm code (dòng 149 hooks/files, dòng 318 risk_tier, bảng services dòng 89-108). **Sinh bảng service + endpoint từ code bằng script**, đừng viết tay lại
- [ ] `hub/docs/RD|SD|BD-harness-hub.md`: `🟡 In Review` → `🟢 Approved`
- [ ] `hub/docs/harness_hub_backend_docs_v0_1/`: đổi tên thành `_superseded/` + thêm README nói rõ ARCHITECTURE.md là nguồn as-is
- [ ] `UPGRADE-safeharness-B-design.md` → chuyển vào `harness/docs/design-notstarted/`
- [ ] ADR-009: sửa hoặc xoá 2 tham chiếu tới file không tồn tại

**Đánh giá:** một agent đọc `ARCHITECTURE.md` phải liệt kê đúng số route và số service so với code. **Estimate:** 2h (Sonnet) + Opus review

---

## ADR cần viết (Opus, song song P0)

- **ADR-011 — Fail-closed classification cho unattended job.** Context: `UNKNOWN` fail-open ở `verify.py:28`. Decision: deny cho unattended, warn cho interactive. Consequence: hook cần khai báo command tường minh; workflow tương tác không đổi.
- **ADR-012 — Allowlist là mặc định cho mọi execution boundary.** Ghi lại rằng cùng lỗi đã lặp 4 lần độc lập, và mọi boundary mới phải default-deny. Đây là ADR quan trọng nhất — nó chặn pattern tái sinh lần thứ 5.

---

## Thứ tự thực thi & rollback

```
P0.1 auth  ─┐
            ├─→ P0.2 hook+classifier ─→ P0.4 fsbrowse
P0.3 runner ┘   (P0.3 độc lập, chạy song song được)
                        │
        P1 (resilience/config)  P2 (CI + agent config)
                        │
                    P3 (hygiene/docs)
```

- P0.1 và P0.2 **phải cùng nhánh** — P0.2 giả định đã có auth. Merge riêng lẻ P0.2 vẫn còn hở.
- Mỗi phase = 1 PR riêng, review xong mới sang phase sau.
- Rollback: P0.1 có env `HUB_TOKEN` để pin token cố định nếu FE lỗi; P0.2 có `allow_override`; P0.3 có `allow_inline_code`. **Cả ba escape hatch đều phải ghi log audit** — nếu không, chúng sẽ trở thành đường vòng mặc định.

---

## Definition of Done toàn plan

- [x] 3 finding critical đều có test chứng minh chuỗi tấn công cũ đã chết — `test_auth_guard.py` (case `/assets`), `test_hook_command_allowlist.py` + `test_verify_rules.py` (2 tầng độc lập), `harness/tests/test_boundary.py` (17 case, gồm cả bypass tìm được ở 3 vòng review: attached-value flag, cụm flag, bare stdin, executable-identity qua `allow_system_executable`/in-root path)
- [x] `pytest hub/tests/` + `pytest harness/tests/` all green **theo baseline đã ghim** (403 passed / 21 failed, tập fail là noise có sẵn từ trước remediation — không phải all-green tuyệt đối, `web-v3/dist` thiếu trong container CI là nguyên nhân chính)
- [ ] `pytest version-governance/app/tests/` — **chưa chạy trong phiên remediation này**, không có venv nào được dựng cho nó. Cần chạy riêng trước khi coi P0-P3 áp dụng luôn cho version-governance
- [x] `run_harness.py --suite workspace-smoke` và `--suite boundary-compliance` vẫn pass — verify nhiều lần
- [x] Suite `security-regression` mới tồn tại và chạy trong `ci-harness.ps1`
- [ ] CI có job chạy `verify_dod.py` — **job đã thêm** (`.github/workflows/version-governance-dod.yml`), nhưng **chưa chứng minh bắt được regression cố ý**: không có Docker daemon trong container remediation để dựng compose stack live. Cần một lần chạy thật trên GitHub Actions (cố ý phá 1 invariant, xem CI đỏ) trước khi coi mục này done. Cũng cần thêm secret `NVIDIA_API_KEY` — thiếu thì DoD check #5 đỏ hợp lệ, không phải lỗi CI
- [x] `ARCHITECTURE.md` khớp code về services (46/46 module verify) và về claim hooks/files/risk_tier (verify trực tiếp từng cái). **Chưa** làm full route-count audit cho toàn bộ `api/*.py` — chỉ 3 điểm audit gốc nêu ra được sửa
- [x] 5 cây agent-config có rule data-safety
- [x] ADR-011 + ADR-012 đã viết và Accepted (`harness/docs/adrs/`)

---

## Brief cho Codex (copy nguyên khối khi giao)

> **P0.1** — Repo `ai-project-opus`, branch `claude/vibe-coded-app-architecture-ahffqi`. Thay auth của `harness/hub`: hiện middleware `_csrf_guard` trong `hub/server.py:67-96` chỉ kiểm header tĩnh `config.HUB_CLIENT_HEADER`/`HUB_CLIENT_VALUE` (`config.py:411-412`) — giá trị hardcode trong source nên vô tác dụng. Thay bằng token per-install kiểu Jupyter: sinh `secrets.token_urlsafe(32)` lần chạy đầu, lưu `config.RUNTIME_STORE_DIR/"hub-token"` chmod 0600, override được bằng env `HUB_TOKEN`. Gate mọi request trừ `/api/health` và `/static/*`. Nhận token qua header `X-Hub-Token` hoặc query `?k=`. So sánh bằng `secrets.compare_digest`. Cập nhật `web-v3/src/lib/api.ts` đọc `?k=` lưu `sessionStorage` rồi gắn header. `run-hub.ps1` in URL kèm token. **Giữ nguyên** origin check, idempotency replay, correlation-ID, SSE. Thêm `hub/tests/test_auth_guard.py`. Toàn bộ test cũ trong `hub/tests/` phải vẫn pass — cập nhật fixture để gửi token. Thêm `hub-token` vào `.gitignore`.

> **P0.2** — Repo như trên. Hai lỗ nối nhau: (a) `hub/services/hooks.py:45-48` cho `action.type=="shell"` nhận `command` array tuỳ ý, không giới hạn binary; (b) `hub/services/verify.py:20-28` lọc bỏ tier `UNKNOWN` khỏi danh sách, nên `rule_check` (dòng 31-51) trả `allow` cho binary không nhận diện được — classifier fail-open. Sửa: (a) `_validate()` yêu cầu `Path(command[0]).name` nằm trong `config.HOOK_ALLOWED_COMMANDS`, mặc định danh sách rỗng; (b) `_command_tiers()` giữ lại `UNKNOWN`; `rule_check()` deny khi job có `unattended=True` và tồn tại tier `UNKNOWN`, còn job tương tác giữ nguyên `warn`; (c) `gitjobs.create_hook_job()` (dòng 495-509) set `record["unattended"]=True`. `allow_override` vẫn bypass được nhưng phải gọi `governance.record_denial`. **Không sửa** phần tier-blocking và approval receipt trong `gitjobs.approve()`. Thêm `hub/tests/test_hook_command_allowlist.py` và bổ sung test cho `verify` — phải có case chứng minh `command=["/tmp/evil"]` bị chặn ở CẢ hai tầng (validate và approve).

> **P0.3** — Repo như trên. `harness/run_harness.py:296-297` thêm `python`/`py` vào allowlist vô điều kiện, nên `["python","-c","<code>"]` qua được boundary: `_looks_like_path_argument` (dòng 271-280) không soi được code inline, còn `DANGEROUS_COMMAND_TOKENS` (dòng 48-72) chỉ match token shell nguyên từ nên `shutil.rmtree`/`os.remove` lọt. Sửa: xoá dòng 297; interpreter chỉ hợp lệ khi khớp `safe_external_paths` (logic đã có ở dòng 298-311). Thêm chặn `-c`/`-m`/`--command` trừ khi check khai báo `allow_inline_code`. Giữ blacklist làm lớp phụ, thêm comment nói rõ nó là defense-in-depth. Tạo `harness/tests/test_boundary.py` test **trực tiếp** `_enforce_command_boundary` và `_looks_like_path_argument`, không qua subprocess — phải có case `["python","-c","import shutil"]` → `BoundaryPolicyError`. Tạo `harness/suites/security-regression.json` với probe cho 3 bypass. Suite `workspace-smoke` và `boundary-compliance` phải vẫn pass; nếu suite nào đang dùng `python -c` thì đổi sang file `.py` hoặc gắn `allow_inline_code` kèm comment lý do.
