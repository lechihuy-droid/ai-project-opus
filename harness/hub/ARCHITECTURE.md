# Harness Hub — Kiến trúc hệ thống

> Web UI (localhost) giám sát + điều khiển các AI agent: theo dõi usage/hành vi, chạy eval suites, quản lý git-jobs của Codex, và một cửa sổ Chat gắn NVIDIA.

- **Chạy:** `.ih\Scripts\python.exe harness\hub\server.py` → `http://127.0.0.1:8799`
- **Stack:** FastAPI + Uvicorn (backend) · SPA vanilla JS + CSS thuần (frontend). **Không** framework, **không** CDN, **không** build step.
- **Kiểm thử:** `.ih\Scripts\python.exe -m pytest harness/hub/tests -q` (~76+ test, provider luôn được mock).

---

## 1. Sơ đồ tầng

```
┌─────────────────────────────────────────────────────────────┐
│  Browser SPA  (web/index.html + app.js + charts.js + CSS)   │
│  HUD shell: topbar chips · sidebar nav · content zone        │
│  Hash-routing 12 trang · fetch JSON · SSE cho stream/chat    │
└───────────────┬─────────────────────────────────────────────┘
                │  HTTP / Server-Sent Events (text/event-stream)
┌───────────────▼─────────────────────────────────────────────┐
│  server.py  (FastAPI)                                        │
│  - REST /api/* + StaticFiles /static                         │
│  - startup: warm cache (usage + behavior) trên daemon thread │
└───────────────┬─────────────────────────────────────────────┘
                │  gọi trực tiếp (in-process)
┌───────────────▼─────────────────────────────────────────────┐
│  config.py            services/*            parsers/*        │
│  (paths, model        (business logic)      (đọc & chuẩn hoá │
│   catalog, tiers)                            log agent)      │
└───────────────┬─────────────────────────────────────────────┘
                │  đọc filesystem (append-only) + .cache/*.json
┌───────────────▼─────────────────────────────────────────────┐
│  Nguồn dữ liệu ngoài                                         │
│  ~/.claude/projects · ~/.codex/sessions · harness/inspect   │
│  harness/runs · harness/suites · NVIDIA API (chat)          │
└─────────────────────────────────────────────────────────────┘
```

Kiến trúc **monolith in-process**: server import thẳng module `services`, không có message queue hay DB — trạng thái nằm ở filesystem + cache JSON.

---

## 2. Backend — `server.py`

FastAPI app, mount `web/` tại `/static`, phục vụ SPA tại `/`. Nhóm endpoint chính:

| Nhóm | Endpoint | Service |
|---|---|---|
| Health | `GET /api/health` | (config) |
| **Chat** | `GET /api/chat/models`, `POST /api/chat` (SSE) | `chat` |
| Runs | `GET /api/runs`, `/api/runs/{id}`, `/artifact`, `/api/runs/compare` | `runs` |
| Trigger run | `POST /api/runs/trigger`, `GET /stream/{id}` (SSE), `/budget/{id}` | `trigger` |
| **Git-jobs** | `GET/POST /api/jobs`, `/{id}`, `/approve` `/accept` `/reject` `/rollback`, `/stream` (SSE), `/diff` | `gitjobs` |
| Suites | `GET /api/suites`, `/{id}`, `GET /api/integrity` | `suites`, `integrity` |
| Governance | `GET /api/governance` | `governance` |
| Usage | `GET /api/usage`, `/api/usage/rollup`, `/api/tools` | `usage`, `behavior` |
| Sessions | `GET /api/sessions`, `/loops`, `/entropy`, `/{id}/replay` | `replay`, `behavior` |
| Inspect | `GET /api/inspect/logs`, `/api/inspect/mep` | `inspect_evals` |
| Board | `GET /api/board` | `board` |

**Quy ước lỗi:** `_http_error()` map `PermissionError→403`, `FileNotFoundError→404`, còn lại `500`. Stream (SSE) không trả 500 — lỗi được bọc thành `event: error`.

**Startup:** hook `@app.on_event("startup")` chạy `usage.warm()` + `behavior.warm()` trên daemon thread → cache ấm sẵn để trang Dashboard load nhanh.

---

## 3. Services layer (`services/*.py`)

Mỗi service là logic thuần, đọc filesystem, không giữ state toàn cục ngoài cache đĩa.

| Service | Vai trò |
|---|---|
| `chat` | Client NVIDIA (OpenAI-compatible), stream reasoning/delta/done; cờ reasoning theo họ model; lỗi upstream → `ChatUpstreamError` |
| `usage` | Gộp token-usage từ Claude/Codex/Inspect; **cache incremental per-file** |
| `behavior` | Phân tích hành vi phiên: entropy, loop, rollup tool; **cache incremental per-session** |
| `runs` | Liệt kê/đọc kết quả run trong `harness/runs`, so sánh 2 run |
| `trigger` | Khởi chạy eval suite, stream tiến trình + trạng thái budget |
| `gitjobs` | Vòng đời git-job của Codex: create→approve→(stream)→accept/reject/rollback + diff |
| `suites` / `integrity` | Đọc định nghĩa suite + xác minh chữ ký HMAC (`.hmac_key`) |
| `governance` | Trạng thái governance/recovery |
| `replay` | Liệt kê phiên + replay từng bước |
| `inspect_evals` | Đọc log Inspect + bản MEP mới nhất |
| `board` | Bảng task (parse `status.md`) |
| `risk`, `boundary`, `inform`, `verify` | Phân tầng rủi ro, ranh giới, thông báo, kiểm định (dùng nội bộ) |

### Cache incremental (điểm hiệu năng cốt lõi)
`usage.py` và `behavior.py` cache kết quả parse theo **từng file**, key = `(path, mtime_ns, size)`, lưu ở `.cache/usage_files.json` / `.cache/behavior_files.json`. Chỉ file mới/đổi mới được parse lại → endpoint nặng từ **>45s xuống ~0.6s** warm.

---

## 4. Parsers (`parsers/*.py`)

Chuẩn hoá log agent thành event thống nhất. Mỗi parser expose `paths()` (liệt kê file nguồn) + `parse_file(path)` (để cache incremental gọi lại chọn lọc):

- `claude_sessions.py` — `~/.claude/projects/**/*.jsonl`
- `codex_sessions.py` — `~/.codex/sessions` + `archived_sessions`
- `inspect_eval.py` — `harness/inspect/logs/*.eval`
- `common.py` — tiện ích chung

---

## 5. Frontend (`web/`)

- `index.html` — HUD shell: **grid** `232px | 1fr` (sidebar tối + content sáng), topbar status chips. Sidebar nhóm nav: MONITOR / CONTROL / AI / SYSTEM.
- `app.js` — SPA: hash-routing 12 trang (`#/`, `#/runs`, `#/sessions`, `#/jobs`, `#/governance`, `#/violations`, `#/chat`, `#/usage`, `#/suites`, `#/tools`, `#/inspect`, `#/board`), fetch JSON, tiêu thụ SSE.
- `charts.js` — vẽ chart (SVG/canvas thuần).
- `styles-hub.css` — token HUD trong `:root` (`--hud-bg/-surface/-border/-text/-accent`, `--status-ok/warn/danger`, `--font-mono`). **Không sửa** `styles.css` (html-kit chung).
- `DESIGN.md` — hợp đồng thiết kế; đọc trước khi sửa UI.

### Trang Chat (`#/chat`)
- Chọn model qua **selector tùy biến** (dropdown ngắn + filter category + ô search + panel chi tiết + nút copy ID) đọc từ `chatState.modelCatalog`.
- Stream: hiển thị plain text khi đang chạy, **render Markdown an toàn** (escape-first + whitelist, link chỉ http/https, code block có nút Copy) chỉ khi `done`.
- Tính năng: New chat, Export **Markdown/JSON** + Copy transcript (dùng text gốc), copy/regenerate mỗi message, Stop khi đang stream, autoscroll + jump-to-latest, Enter/Shift+Enter, lưu `localStorage` (`harness-hub-chat`), show/hide "thinking".
- Model EOL trả **HTTP 410** → error event mang `{message, code:410}`, frontend đánh dấu row `unavailable` (session-only) và chuyển về model default.

---

## 6. Cấu hình (`config.py`)

Nguồn chân lý cho path và model:

- **Paths:** `ROOT`, `RUNS_DIR`, `SUITES_DIR`, `JOBS_DIR`, `USAGE_SOURCES` (claude/codex/inspect), `INSPECT_MEP_DIR`.
- **Chat:** `CHAT_MODEL_CATALOG` (20 model NVIDIA có rank/category/bestFor/strengths/weaknesses), `CHAT_MODELS` (derive từ catalog), `CHAT_DEFAULT_MODEL = nvidia/nemotron-3-super-120b-a12b`, `CHAT_MAX_TOKENS = 16384`, `CHAT_REASONING` (cờ reasoning theo prefix họ model).
- **Guardrails job:** `STEP_CAP=50`, `JOB_TIME_CAP_SECONDS=1800`, `JOB_MAX_RUNS=3`, `JOB_BLOCKED_TIERS=[destructive]`, `JOB_ALLOW_AGENTS={codex}`, `JOB_TTL_SECONDS=3600`.
- **Behavior thresholds:** `LOOP_CONSECUTIVE_THRESHOLD=12`, `ENTROPY_WINDOW=20`, `ENTROPY_THRESHOLD=0.3`.
- `risk_tiers.json` + `load_risk_tiers()` — phân tầng tool/command/network/destructive.

---

## 7. Dữ liệu & bảo mật

- **Append-only, không DB:** trạng thái là file JSON/JSONL log + cache `.cache/*.json` (đều gitignore).
- **NVIDIA key:** đọc từ env `NVIDIA_API_KEY`. App **không** tự nạp `.env` (không có python-dotenv) — phải set env trước khi chạy server. Key **không bao giờ** log/hardcode.
- **Chữ ký suite:** HMAC với `.hmac_key` → `integrity.verify_suites()`.
- **Git-jobs của Codex:** tách branch riêng `opus-job/<id>`, có approve gate + rollback, chặn tier `destructive`.

---

## 8. Luồng tiêu biểu

**Chat:** browser `POST /api/chat {model, messages}` → `chat.stream_chat()` gọi NVIDIA → yield reasoning/delta/done → `_sse()` → SPA render (Markdown khi done) + append usage vào `.cache/chat_usage.jsonl`.

**Dashboard:** render card nhanh ngay, 2 card nặng (Usage 7d, High Entropy) load hoãn với skeleton; `usage`/`behavior` trả từ cache incremental → ~0.6s warm.

**Git-job:** `POST /api/jobs {brief, agent=codex}` → tạo branch + chạy Codex, `GET /stream` theo dõi, review `diff`, rồi `accept` (merge) / `reject` / `rollback`.

---

## 9. Bản đồ file nhanh

```
harness/hub/
├─ server.py            # FastAPI app + routes + startup warm
├─ config.py            # paths, CHAT_MODEL_CATALOG, guardrails
├─ risk_tiers.json      # phân tầng rủi ro
├─ services/            # logic: chat, usage, behavior, runs, trigger,
│                       #        gitjobs, suites, integrity, governance,
│                       #        replay, inspect_evals, board, risk...
├─ parsers/             # claude_sessions, codex_sessions, inspect_eval, common
├─ web/                 # index.html, app.js, charts.js, styles-hub.css, DESIGN.md
├─ tests/               # pytest (provider mock, không gọi API thật)
├─ docs/                # chat.md, safeharness-*.md
├─ jobs/                # git-job state (runtime)
└─ .cache/              # cache incremental + usage chat (gitignore)
```

*(SDD docs của Hub: `RD-harness-hub.md`, `SD-harness-hub.md`, `BD-harness-hub.md`.)*
