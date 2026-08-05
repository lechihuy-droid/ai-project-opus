# BD — Tách `server.py` thành router theo domain

**Date:** 2026-08-06 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Upstream:** Review cấu trúc `harness/` (2026-08-05) — `server.py` 1361 dòng / 106 route là monolith duy nhất còn lại sau đợt dọn `chore(hub): tidy the app root`.
**Giao cho:** Codex. Claude review từng step.

---

## 0. Vấn đề

| Đo được | Giá trị |
|---|---|
| `server.py` | 1361 dòng |
| Route decorator (trừ 1 middleware + 3 exception handler) | 106 |
| Prefix khác nhau | 29 |
| Trung bình dòng/route | ~12 |
| File lớn thứ nhì trong hub | `services/gitjobs.py` — 714 dòng |

Route **mỏng và sạch**. Vấn đề là điều hướng, không phải chất lượng code. Service anh em `version-governance` tách `app/api/` thành 8 module theo domain; hub gộp tất cả vào một file.

**Không phải mục tiêu:** viết lại logic route, đổi hành vi, đổi response, tối ưu. Đây là refactor thuần cơ học.

---

## 1. Bất biến — vi phạm bất kỳ dòng nào dưới đây là fail

1. **106 route giữ nguyên path + method.** Không thêm, không bớt, không đổi tên.
2. **`server.app` giữ nguyên identity.** 28 chỗ trong test dùng `TestClient(server.app)`.
3. **`server.py` giữ nguyên namespace.** 10 test file `import server` và truy cập:

   | Tên | Số lần dùng | Sau refactor |
   |---|---|---|
   | `server.app` | 28 | giữ nguyên tại chỗ |
   | `server.skill_library`, `server.runtime_agents`, `server.behavior` | 14 | giữ khối `from services import (...)` |
   | `server._correlated_sse` | 1 | ở lại `server.py` |
   | `server._chat_skills` | 1 | re-export từ `api/chat.py` |
   | `server._IDEMPOTENCY_RESULTS` | 1 | ở lại `server.py` |
   | `server.CHAT_SKILL_MAX_CHARS` | 1 | re-export từ `api/chat.py` |

4. **Không đụng `services/`.** Đợt này chỉ tách tầng route.
5. **337 test phải xanh sau MỖI step**, không phải chỉ ở cuối.

---

## 2. Phần KHÔNG di chuyển — ở lại `server.py`

Đã verify: toàn bộ cross-cutting nằm ở middleware, route không chạm tới.

- `lifespan` — 4 warm thread + `gitjobs.reconcile_orphans()` + `retention.sweep()` + `procs.kill_all()`
- `app = FastAPI(...)` + mount `StaticFiles` cho `web-v3/dist/assets`
- `@app.middleware("http") _csrf_guard` — CSRF, correlation ID, idempotency replay, SSE decorate, Cache-Control
- `_cache_response`, `_correlated_sse` — middleware gọi
- 3 exception handler: `_http_exception`, `_unexpected_exception`, `_validation_exception`
- `_is_idempotent_command`
- State: `HUB_DIR`, `WEB_V3_DIST`, `_CSRF_SAFE_METHODS`, `_SCHEMA_VERSION`, `_IDEMPOTENCY_LOCK`, `_IDEMPOTENCY_RESULTS`, `_IDEMPOTENT_COMMANDS`, `_LOGGER`, `get_provider`
- Khối `from services import (...)` — giữ nguyên để test truy cập được

**Lý do quan trọng:** `_IDEMPOTENCY_RESULTS` chỉ được middleware và `_cache_response` đọc/ghi. Không route nào chạm. Nên router **không cần** import state này — đây là thứ làm việc tách trở nên đơn giản.

---

## 3. Cấu trúc đích

```
harness/hub/
  server.py              # ~120 dòng: composition root
  api/
    __init__.py
    _shared.py           # helper thuần, không state
    chat.py
    agents.py
    runs.py
    jobs.py
    workflows.py
    skills.py
    memory.py
    system.py
```

`api/_shared.py` nhận 6 helper thuần (không đụng app state):
`_error_code`, `_safe_error_message`, `_http_error`, `_etag`, `_check_if_match`, `_sse`

`server.py` import ngược lại `_http_error`, `_error_code`, `_safe_error_message` vì middleware và exception handler cần.

---

## 4. Phân bổ prefix → module

**Quy tắc thực thi:** KHÔNG tự nghĩ ra thứ tự mới. Trong mỗi module, giữ nguyên thứ tự tương đối như trong `server.py` hiện tại.

| Module | Prefix gom vào |
|---|---|
| `api/chat.py` | `/api/chat`, `/api/chat/models`, `/api/chats/*`, `/api/chat-files`, `/api/sessions/*` |
| `api/agents.py` | `/api/agents*`, `/api/agent/runs*`, `/api/providers`, `/api/model-classes`, `/api/risk-tiers` |
| `api/runs.py` | `/api/runs*`, `/api/artifacts*`, `/api/suites*` |
| `api/jobs.py` | `/api/jobs*`, `/api/hooks*` |
| `api/workflows.py` | `/api/workflows*` |
| `api/skills.py` | `/api/skills*`, `/api/skill-library*`, `/api/tools*`, `/api/search` |
| `api/memory.py` | `/api/memory*`, `/api/settings/retention` |
| `api/system.py` | `/`, `/api/health`, `/api/usage*`, `/api/inspect/*`, `/api/integrity`, `/api/governance`, `/api/guardrails/*`, `/api/board`, `/api/vgov/{path}` |

Mỗi module: `router = APIRouter()`, đổi `@app.get` → `@router.get`. Không thêm `prefix=` vào `APIRouter()` — path viết đầy đủ như hiện tại, để so khớp snapshot dễ.

---

## 5. Rủi ro số 1 — thứ tự đăng ký route

FastAPI khớp route **theo thứ tự đăng ký**. Route literal phải đứng trước route có path param cùng hình dạng. Trong `server.py` hiện tại có các cặp sau, **đảo thứ tự là hỏng ngay**:

| Phải đứng trước | Nếu không sẽ bị nuốt bởi |
|---|---|
| `/api/runs/trigger`, `/api/runs/compare` | `/api/runs/{run_id}` |
| `/api/runs/stream/{stream_id}`, `/api/runs/budget/{stream_id}` | `/api/runs/{run_id}` (2 segment vs 2 segment — kiểm kỹ) |
| `/api/skills/names` | `/api/skills/{skill_id}` |
| `/api/skill-library/drift`, `/api/skill-library/deploy-log` | `/api/skill-library/{skill_id:path}` |
| `/api/memory/candidates` | `/api/memory/{memory_id}/revoke` |
| `/api/usage/rollup`, `/api/usage/cockpit` | `/api/usage` |
| `/api/hooks/events` | `/api/hooks/{hook_id}` |

**Vì sao gom theo prefix lại an toàn:** xung đột chỉ xảy ra giữa các route cùng prefix. Gom cùng prefix vào một module rồi giữ nguyên thứ tự tương đối là bảo toàn được. Thứ tự **giữa các module** không quan trọng vì khác prefix thì không thể khớp nhầm.

**Lưu ý riêng:** `/api/tools` và `/api/tools/usage` là **hai decorator chồng lên một hàm** (`server.py:855-856`). Giữ nguyên cả hai, đúng thứ tự.

---

## 6. Các bước

### Step 0 — Test snapshot inventory route (LÀM TRƯỚC TIÊN, bắt buộc)

Đây là lưới an toàn cho toàn bộ BD này. Không có nó thì không được sang Step 1.

Tạo `tests/test_route_inventory.py`:

```python
from __future__ import annotations
import json
from pathlib import Path
import server

SNAPSHOT = Path(__file__).parent / "fixtures" / "route_inventory.json"


def _inventory() -> list[list]:
    rows = []
    for route in server.app.routes:
        methods = sorted(getattr(route, "methods", []) or [])
        rows.append([route.path, methods])
    return sorted(rows)


def test_route_inventory_is_unchanged() -> None:
    expected = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    assert _inventory() == expected
```

Sinh snapshot **từ code hiện tại, trước khi sửa bất cứ thứ gì**:

```bash
./.ih/Scripts/python.exe -c "import sys; sys.path.insert(0,'harness/hub'); import server, json; rows=sorted([[r.path, sorted(getattr(r,'methods',[]) or [])] for r in server.app.routes]); json.dump(rows, open('harness/hub/tests/fixtures/route_inventory.json','w'), indent=2)"
```

→ **verify:** snapshot có đúng **111 dòng** = 105 route `/api/*` + `/` + 5 route mặc định của FastAPI (`/docs`, `/docs/oauth2-redirect`, `/redoc`, `/openapi.json`, mount `/assets`). Giữ nguyên cả 5 dòng mặc định trong snapshot — chúng cũng phải không đổi sau refactor. `pytest tests/test_route_inventory.py` xanh.

> Snapshot này **đã được sinh sẵn** tại `harness/hub/tests/fixtures/route_inventory.json` từ trạng thái code trước refactor. KHÔNG sinh lại. Nếu test đỏ ở bất kỳ step nào, đó là refactor sai — sửa code, tuyệt đối không regenerate snapshot cho hết đỏ.

→ **commit riêng.** Đây là commit phải có trước mọi thay đổi khác, để `git bisect` chỉ được đúng chỗ nếu sau này hỏng.

### Step 1 — Tạo `api/_shared.py`

Chuyển 6 helper thuần sang. `server.py` import lại. Chưa động route nào.

→ **verify:** 337 test + test inventory xanh. `git diff --stat` chỉ thấy `server.py` và `api/_shared.py`.

### Step 2..9 — Tách từng module, MỖI MODULE MỘT COMMIT

Thứ tự làm (từ ít rủi ro tới nhiều):

| # | Module | Vì sao thứ tự này |
|---|---|---|
| 2 | `api/system.py` | route đơn giản nhất, hầu hết không có path param |
| 3 | `api/memory.py` | nhỏ, biệt lập |
| 4 | `api/agents.py` | không dính route param chồng nhau |
| 5 | `api/jobs.py` | jobs + hooks, param rõ ràng |
| 6 | `api/workflows.py` | 13 route, một prefix duy nhất |
| 7 | `api/skills.py` | có `{skill_id:path}` — cần cẩn thận thứ tự |
| 8 | `api/runs.py` | nhiều bẫy thứ tự nhất |
| 9 | `api/chat.py` | kèm 3 helper + `CHAT_SKILL_MAX_CHARS` re-export |

Mỗi step:
1. Cắt nhóm route sang module mới, `@app.x` → `@router.x`, giữ nguyên thứ tự tương đối.
2. `server.py`: `from api.<mod> import router as <mod>_router` + `app.include_router(<mod>_router)`.
3. Vị trí `include_router` trong `server.py` phải đặt sao cho thứ tự đăng ký tổng thể không đổi so với ban đầu — nếu snapshot test đỏ, đây là chỗ sai đầu tiên cần nhìn.
4. Chạy `pytest harness/hub/tests -q`.

→ **verify từng step:** 337 test xanh + `test_route_inventory` xanh. Nếu inventory đỏ → route bị rơi hoặc đổi thứ tự, sửa ngay trong step đó, **không đi tiếp**.

### Step 10 — Dọn `server.py`

Xoá import không còn dùng. Giữ nguyên khối `from services import (...)` kể cả khi linter báo thừa — test truy cập `server.skill_library` v.v. qua đó. Thêm comment giải thích để người sau không "dọn" nhầm.

→ **verify:** `server.py` ≤ 150 dòng. 337 test + inventory xanh.

---

## 7. Test plan

| Test | Mục đích | Khi nào chạy |
|---|---|---|
| `tests/test_route_inventory.py` (mới) | chứng minh 106 route còn nguyên path + method | sau mỗi step |
| `tests/test_api_contract.py` (có sẵn) | error envelope, correlation ID, schema header vẫn đúng | sau mỗi step |
| `tests/test_csrf.py` (có sẵn) | middleware CSRF không bị ảnh hưởng | sau mỗi step |
| Toàn bộ `harness/hub/tests` | 337 test | sau mỗi step |

Lệnh:
```bash
./.ih/Scripts/python.exe -m pytest harness/hub/tests -q
```
Suite chạy khoảng 3–6 phút. Không dùng `-x` — cần thấy hết lỗi để biết step nào làm hỏng gì.

**Không viết test mới cho từng route.** 337 test hiện có đã phủ hành vi; refactor này không đổi hành vi nên không cần thêm.

---

## 8. Definition of Done

1. `server.py` ≤ 150 dòng, chỉ còn composition root.
2. `api/` có 8 module route + `_shared.py`, không module nào > 300 dòng.
3. `tests/test_route_inventory.py` tồn tại và xanh — 106 route khớp snapshot sinh từ trước refactor.
4. `pytest harness/hub/tests -q` → **337 passed**, đúng con số trước refactor.
5. `server.app`, `server.skill_library`, `server.runtime_agents`, `server.behavior`, `server._correlated_sse`, `server._chat_skills`, `server._IDEMPOTENCY_RESULTS`, `server.CHAT_SKILL_MAX_CHARS` đều còn truy cập được.
6. Mỗi module một commit, mô tả rõ nhóm route nào chuyển đi.
7. `git log --oneline` đọc được như một chuỗi bước, không phải một commit khổng lồ.

---

## 9. Ngoài phạm vi — KHÔNG làm trong BD này

- Gom `services/` (45 file phẳng, `runtime_*` 14 file). Đã đánh giá: 36 file phải sửa import để đổi `runtime_state` thành `runtime.state`. Tiền tố đã đóng vai namespace rồi, lợi ích thấp hơn rủi ro. Xét lại **sau khi** BD này xong.
- Sửa logic bất kỳ route nào, kể cả khi thấy code chưa tối ưu. Thấy thì ghi lại, không sửa.
- Thêm `prefix=` hay `tags=` vào `APIRouter` — làm snapshot khó so, để đợt sau nếu muốn.
- Đụng `web-v3/`. Frontend gọi qua path, path không đổi.
