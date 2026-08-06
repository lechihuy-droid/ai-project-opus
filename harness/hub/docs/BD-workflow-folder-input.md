# BD — Chọn folder input cho run của workflow

**Date:** 2026-08-06 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b`
**Nối tiếp:** `BD-workflow-canvas-dnd.md` (frontend-only). BD này **có đổi backend**.
**Giao cho:** Codex. Claude review từng step.

---

## 0. Yêu cầu và quyết định của user

> "có nút chọn folder input cho mục tiêu chạy của workflow"

Chốt với user (2026-08-06):

| Câu hỏi | Trả lời |
|---|---|
| Folder dùng làm gì | **Cả hai** — vừa là scope agent đọc/ghi, vừa nạp cây file làm context |
| Phạm vi chọn | **Bất kỳ folder nào trên máy** |

---

## 1. Cảnh báo bảo mật — đọc trước khi code

Hôm nay `services/tools.py:93` gọi `boundary.resolve_in_root(raw_path)` với base mặc định `config.ROOT`. Đây là **lớp chặn server-side duy nhất** giữ tool của hub (`read_file`, `grep`, `list_dir`) nằm trong workspace. Cho chọn folder tuỳ ý = gỡ lớp đó.

Mở rộng ra ngoài `config.ROOT` nghĩa là agent chạy trong hub đọc được `~/.ssh`, `.env`, `~/.aws/credentials`, và với `permission: workspace_write` thì ghi được nữa.

**Giảm thiểu bắt buộc trong BD này** (user có thể veto từng cái, nhưng phải veto rõ ràng):

1. **Deny-list cứng** — không browse được, không chọn được, không nạp context được:
   - `C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, `C:\ProgramData`
   - `%USERPROFILE%\.ssh`, `.aws`, `.gnupg`, `.azure`, `.kube`
   - Chặn cả thư mục con của các root trên.
2. **Không có mặc định.** `workspace_dir` mặc định `null` = giữ nguyên hành vi hôm nay (chỉ `config.ROOT`). Người dùng phải chọn chủ động từng run.
3. **Ghi audit.** Mỗi run có `workspace_dir` nằm ngoài `config.ROOT` → ghi một event `workspace_scope` qua `services/audit.py` kèm đường dẫn tuyệt đối, và hiện cảnh báo màu warning trong UI trước khi bấm Run.
4. **Chỉ liệt kê thư mục, không bao giờ trả nội dung file** qua endpoint duyệt.

---

## 2. Bất biến

1. **`workspace_dir = null` ⇒ hành vi y hệt hôm nay.** 235 test hiện có phải xanh không sửa một dòng test nào.
2. **Không đổi `boundary.resolve_in_root`.** 12 chỗ gọi nó (`chat_files`, `runtime_artifacts`, `workflow`, `workflow_exec`, `artifact_comments`) dựa vào ngữ nghĩa "ghim vào ROOT". Thêm hàm mới, không sửa hàm cũ.
3. **Route mới phải cập nhật `tests/fixtures/route_inventory.json`.** `tests/test_route_inventory.py` chụp toàn bộ route table từ `app.openapi()` và fail nếu lệch. Sửa snapshot ở đúng step thêm route, không để dồn.
4. **Endpoint duyệt thư mục là GET, read-only.** Không tạo/xoá/đổi tên thư mục.
5. **Mọi chuỗi hiển thị qua `t()`**, key vào `src/lib/i18n/workflows.ts`.

---

## 3. Kiến trúc

```
UI: WorkflowsPage header
  [Run objective…] [📁 Chọn folder ▾] [Add inputs] [Run]
                        │
                        ├─ GET /api/fs/drives        → ["C:", "D:"]
                        └─ GET /api/fs/dirs?path=…   → { path, parent, entries[] }

POST /api/workflows/{id}/runs
  { objective, inputs, workspace_dir }
        │                    │
        │                    └─ run_inputs.resolve_inputs()  ← kind "folder" nạp context
        └─ workflow_exec.create_workflow_run_stream(..., workspace_dir)
                 └─ metadata["workspace_dir"]
                        └─ _tool_policy(agent, workspace_dir)
                               ├─ allowed_paths += [workspace_dir]
                               └─ cwd = workspace_dir
                                      └─ tools.dispatch → boundary.resolve_under_any()
```

---

## 4. Step 1 — `services/fsbrowse.py` (mới)

Module thuần, không phụ thuộc FastAPI.

```python
DENIED_ROOTS: tuple[Path, ...]  # dựng từ §1.1, resolve sẵn lúc import
IGNORED_DIR_NAMES = frozenset({".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".pnpm-store"})

def is_denied(path: Path) -> bool
def list_drives() -> list[str]                       # Windows: ổ đĩa sẵn sàng. POSIX: ["/"]
def list_dirs(path: str | None) -> dict[str, object] # {"path", "parent", "entries": [{"name","path"}]}
def resolve_workspace_dir(value: object) -> Path | None
```

Chi tiết:

- `list_dirs(None)` → trả gốc: Windows liệt kê ổ đĩa, POSIX trả `/`.
- Chỉ trả **thư mục**, bỏ file. Bỏ tên trong `IGNORED_DIR_NAMES` và thư mục ẩn (`name.startswith('.')`) trừ khi query `show_hidden=true`.
- Sort theo `name.lower()`, deterministic.
- `PermissionError` khi đọc một thư mục con → bỏ qua thư mục đó, không làm hỏng cả response.
- `parent` = `None` khi đang ở gốc.
- `resolve_workspace_dir`: `None`/chuỗi rỗng → `None`; ngược lại phải là đường dẫn tồn tại, `is_dir()`, không nằm trong deny-list, resolve symlink trước khi kiểm tra (chống symlink trỏ vào `C:\Windows`). Sai → `ValueError`.

**Test mới `tests/test_fsbrowse.py`:** liệt kê tmp_path đúng · bỏ `node_modules` · deny-list chặn cả thư mục con · symlink trỏ vào deny-root bị chặn · `resolve_workspace_dir(None)` trả `None` · đường dẫn là file → `ValueError`.

## 5. Step 2 — `boundary.resolve_under_any`

Thêm **hàm mới**, không sửa `resolve_in_root`:

```python
def resolve_under_any(p: str | Path, roots: Sequence[str | Path]) -> Path:
    """Resolve p and require it inside at least one root. Raise PermissionError otherwise."""
```

- `roots` rỗng → `PermissionError` (fail closed).
- Mỗi root tự resolve; root không tồn tại thì bỏ qua chứ không raise.

**Test:** thêm case vào `tests/test_boundary.py` — trong root thứ hai thì pass · ngoài mọi root thì `PermissionError` · roots rỗng thì `PermissionError` · `..` không thoát ra được.

## 6. Step 3 — `tools.dispatch` dùng allowed_paths làm gốc

`services/tools.py:93` hiện:

```python
resolved = boundary.resolve_in_root(raw_path)          # base = config.ROOT, chặn cứng
if not any(_is_allowed(resolved, root) for root in allowed_paths):
```

Đổi thành:

```python
resolved = boundary.resolve_under_any(raw_path, [config.ROOT, *allowed_paths])
if not any(_is_allowed(resolved, root) for root in allowed_paths):
```

`_is_allowed` cũng phải bỏ `resolve_in_root` (nó ghim vào ROOT) — dùng `resolve_under_any(path, [root])`.

**Ngữ nghĩa giữ nguyên khi `allowed_paths` đều nằm trong ROOT** — đó là toàn bộ agent hiện có, nên test cũ phải xanh y nguyên. Nếu bất kỳ test nào trong `tests/test_boundary.py` / `test_runtime.py` đỏ, dừng lại báo cáo chứ **không** sửa test.

## 7. Step 4 — `workspace_dir` chảy xuống executor

1. `services/providers/base.py` — `ToolPolicy` thêm `cwd: str`.
2. `services/workflow_exec.py:302` — `_tool_policy(agent)` thành `_tool_policy(agent, workspace_dir: str | None)`:
   ```python
   paths = list(agent.get("allowed_paths") or [])
   if workspace_dir: paths.append(workspace_dir)
   return {"permission": ..., "allowed_tools": ..., "allowed_paths": paths, **({"cwd": workspace_dir} if workspace_dir else {})}
   ```
   Hai chỗ gọi: dòng 333 và 549.
3. `run_workflow` đọc `workspace_dir` từ `_metadata(state)`, truyền xuống — đi cùng đường với `inputs` ở `_snapshot_inputs` (dòng 284–294) để resume/replay lấy lại đúng giá trị đã đóng băng.
4. `create_workflow_run_stream(workflow_id, objective, inputs, input_references, workspace_dir=None)` — ghi `metadata["workspace_dir"]` cạnh `metadata["inputs"]` (dòng 648).
5. `services/providers/claude_cli.py:210` và `codex_cli.py:199` — `cwd=getattr(config, "ROOT", None)` thành `cwd=tool_policy.get("cwd") or getattr(config, "ROOT", None)`.
6. Audit: khi `workspace_dir` không nằm trong `config.ROOT`, gọi `audit.append("workspace_scope", subject_id=run_id, context={"workspace_dir": str(path)})` ngay trong `create_workflow_run_stream`, trước khi node đầu chạy. `audit.append` là chuỗi hash-chain (`_digest`) nên gọi đúng một lần cho mỗi run, không gọi lại khi resume.

**Test:** thêm vào `tests/test_workflow_exec.py` — `workspace_dir=None` cho `_tool_policy` giống hệt hôm nay · có `workspace_dir` thì nó xuất hiện trong `allowed_paths` và `cwd` · resume một run có `workspace_dir` lấy lại đúng giá trị từ metadata.

## 8. Step 5 — input kind `folder` trong `run_inputs.py`

`_reference` thêm nhánh:

```python
if kind == "folder":
    path = fsbrowse.resolve_workspace_dir(item.get("path"))
    if path is None: raise ValueError("folder input requires a path")
    return {"kind": "folder", "path": str(path)}
```

Trong `resolve_inputs`, nhánh `folder` duyệt cây và ghép nội dung:

- **Cap:** sâu tối đa 3 cấp · tối đa 50 file · tổng ký tự dùng chung ngân sách `remaining` sẵn có (`chat_files.CHAT_FILE_CONTEXT_MAX_CHARS`) — **không** thêm ngân sách riêng, folder cạnh tranh với artifact/file như mọi input khác.
- Bỏ `IGNORED_DIR_NAMES` và thư mục ẩn.
- File không decode được UTF-8 → bỏ, không chèn placeholder từng file (folder có thể có hàng trăm file nhị phân).
- Sort theo đường dẫn tương đối để prompt deterministic.
- Nhãn: `[Input: folder <abs path>]`, mỗi file `[File: <rel path>]`.
- Chạm cap → cờ `truncated` sẵn có bật lên, dùng đúng câu `[Input text truncated at N characters]` hiện tại; thêm một dòng riêng nếu bị cắt vì **số file**: `[Folder listing truncated at 50 files]`.

**Test `tests/test_runtime.py` hoặc file mới:** folder rỗng → không crash · bỏ `node_modules` · cap 50 file · file nhị phân bị bỏ · thứ tự deterministic · path ngoài deny-list ok, trong deny-list `ValueError`.

## 9. Step 6 — Route mới

`api/system.py` (đúng họ: system/utility, không phải workflow):

```python
@router.get("/api/fs/drives")   -> list[str]
@router.get("/api/fs/dirs")     -> dict   # query: path (optional), show_hidden (bool, default false)
```

`ValueError` → 400, `PermissionError` → dùng `_http_error` sẵn có.

`api/workflows.py:137` — `api_workflow_run` đọc thêm `payload.get("workspace_dir")`, chạy qua `fsbrowse.resolve_workspace_dir`, `ValueError` → 400, rồi truyền vào `create_workflow_run_stream`.

**Cập nhật `tests/fixtures/route_inventory.json` ngay ở step này.**

**Test `tests/test_added_api_endpoints.py`:** `GET /api/fs/dirs` không path → 200 và có `entries` · path là deny-root → 400 · path không tồn tại → 400 · `POST /runs` với `workspace_dir` rác → 400 · không có `workspace_dir` → hành vi cũ.

## 10. Step 7 — Frontend `FolderPicker`

File mới `src/components/FolderPicker.tsx`, dựng theo khuôn `RunInputPicker.tsx` (cùng `Popover`, cùng cách nhận `copy` prop).

- Trigger: `Button variant="ghost"` icon `FolderOpen`, nhãn = basename folder đã chọn, hoặc `t('workflows.chooseFolder')` khi chưa chọn.
- Trong popover:
  - Breadcrumb đường dẫn hiện tại, bấm từng đoạn để nhảy lên.
  - Nút lên một cấp (dùng `parent` từ response; disabled khi `parent === null`).
  - `Input` gõ đường dẫn trực tiếp, Enter để nhảy (đây là cách nhanh nhất cho đường dẫn sâu, và là lý do không cần cây đệ quy).
  - Danh sách thư mục con, mỗi dòng một `Button variant="ghost"` để đi vào.
  - Footer: `Button variant="primary"` **Chọn thư mục này** + `Button variant="ghost"` Huỷ.
  - Hai checkbox: `t('workflows.folderAsScope')` và `t('workflows.folderAsContext')`, **mặc định bật cả hai**. Tách riêng vì hai cái khác mức rủi ro — scope cho ghi, context chỉ đọc.
- Lỗi từ API hiện inline trong popover, không nuốt.

## 11. Step 8 — Nối vào `WorkflowsPage`

- State: `workspaceDir: string | null`, `folderAsScope: boolean`, `folderAsContext: boolean`.
- Đặt `FolderPicker` trong header, **ngay sau ô objective** (đúng chỗ user mô tả "cho mục tiêu chạy"), trước `RunInputPicker`.
- Đã chọn folder → `Chip` hiện đường dẫn rút gọn, có nút xoá.
- Folder nằm ngoài `config.ROOT` → banner warning (dùng lớp `border-warning bg-warning-subtle text-warning` sẵn có ở dòng 107) với `t('workflows.folderOutsideWorkspace')`. Frontend biết được nhờ response `/api/fs/dirs` trả thêm `inside_root: boolean`.
- `start()`:
  ```ts
  await startRun(selected.id, objective.trim(), folderAsContext && workspaceDir ? [...inputs, { kind: 'folder', path: workspaceDir }] : inputs, controller.current.signal, folderAsScope ? workspaceDir : null)
  ```
- `src/lib/runsApi.ts` — `startRun` thêm tham số thứ 5 `workspaceDir: string | null = null`, đưa vào body. `RunInput` union thêm `| { kind: 'folder'; path: string }`.
- `RunInputPicker` hiển thị chip cho kind `folder` (hàm `keyFor` và `name` phải xử lý, nếu không sẽ crash khi input folder được truyền vào).

---

## 12. Không làm đợt này

| Việc | Lý do |
|---|---|
| Nhớ folder đã chọn theo từng workflow | Cần lưu trạng thái mới; chọn lại mỗi run là chủ ý (giảm thiểu §1.2) |
| Watch folder, tự chạy lại khi file đổi | Ngoài phạm vi |
| Ghi kết quả run ngược lại vào folder | `runtime_files` đã có chỗ chứa; ghi ra ngoài là bề mặt rủi ro khác, cần BD riêng |
| Upload folder từ trình duyệt | `webkitdirectory` không cho đường dẫn thật, không dùng được cho scope |
| Áp `workspace_dir` cho Chat | BD này chỉ đụng workflow run |

---

## 13. Thứ tự thực thi

Mỗi step chạy `pytest harness/hub/tests -q` xong mới sang step kế. Step 7–8 chạy thêm `pnpm lint` + `pnpm build`.

| # | Việc | File | Gate |
|---|---|---|---|
| 1 | `fsbrowse.py` + test | `services/fsbrowse.py`, `tests/test_fsbrowse.py` | test mới xanh, 235 test cũ xanh |
| 2 | `resolve_under_any` | `services/boundary.py`, `tests/test_boundary.py` | như trên |
| 3 | `tools.dispatch` đổi gốc | `services/tools.py` | **test cũ xanh không sửa test** |
| 4 | `workspace_dir` xuống executor | `workflow_exec.py`, `providers/base.py`, `claude_cli.py`, `codex_cli.py`, `tests/test_workflow_exec.py` | như trên |
| 5 | input kind `folder` | `services/run_inputs.py` + test | như trên |
| 6 | Route + snapshot | `api/system.py`, `api/workflows.py`, `tests/fixtures/route_inventory.json`, `tests/test_added_api_endpoints.py` | `test_route_inventory` xanh |
| 7 | `FolderPicker.tsx` | `src/components/FolderPicker.tsx`, `i18n/workflows.ts` | lint + build |
| 8 | Nối vào trang | `WorkflowsPage.tsx`, `lib/runsApi.ts`, `RunInputPicker.tsx` | lint + build |

---

## 14. Test plan

### Tự động
```bash
.ih/Scripts/python.exe -m pytest harness/hub/tests -q
```
```bash
cd harness/hub/web-v3 && pnpm lint && pnpm build
```

**Điều kiện fail cứng:** bất kỳ test nào trong 235 test hiện có phải sửa mới xanh ⇒ thiết kế sai, dừng lại báo cáo. Chỉ được **thêm** test.

### Tay — `.\harness\hub\run-hub.ps1` → http://127.0.0.1:8799

1. Mở Workflows → nút chọn folder hiện cạnh ô objective.
2. Duyệt tới `C:\Users\HUY\workspace\ai-project-opus\harness` → chọn → chip hiện, **không** có banner warning (trong root).
3. Chọn một folder ngoài workspace (ví dụ `C:\Users\HUY\Documents`) → banner warning hiện.
4. Thử duyệt vào `C:\Windows` → 400, popover hiện lỗi, không liệt kê gì.
5. Gõ thẳng đường dẫn vào ô, Enter → nhảy đúng.
6. Bỏ tick "nạp làm context", chạy run → prompt không có nội dung file (kiểm trong run log / `metadata.inputs`).
7. Tick lại, chạy run trên folder nhỏ → prompt có `[Input: folder …]` và các `[File: …]`.
8. Chạy run trên folder ~200 file → dừng ở 50 file, có dòng truncate, không treo.
9. Không chọn folder, chạy run → hành vi y hệt trước BD này.
10. Run có folder ngoài root → có event audit ghi lại đường dẫn.

### Regression
11. Chạy workflow có `gate: approval` → gate vẫn hoạt động.
12. Input artifact + chat_file như cũ vẫn nạp đúng.
13. Resume một run bị interrupt có `workspace_dir` → scope giữ nguyên sau resume.

---

## 15. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Nới `tools.dispatch` làm thủng lớp chặn cho **mọi** run, kể cả run không chọn folder | `allowed_paths` mặc định vẫn từ agent profile; `config.ROOT` luôn nằm trong danh sách root nên đường dẫn ngoài vẫn bị chặn khi `workspace_dir` là `None`. Step 3 phải chứng minh bằng test cũ xanh không sửa. |
| Symlink trỏ ra ngoài scope | `resolve()` trước khi kiểm tra, ở cả `resolve_workspace_dir` lẫn `resolve_under_any` |
| Folder khổng lồ làm treo request | Cap 50 file / sâu 3 cấp / ngân sách ký tự dùng chung, kiểm ngay khi duyệt chứ không đọc hết rồi mới cắt |
| `cwd` mới làm CLI provider chạy sai chỗ | `cwd` chỉ đổi khi `workspace_dir` có giá trị; mặc định vẫn `config.ROOT` |
| Snapshot route quên cập nhật | Gate của step 6 là `test_route_inventory` xanh |
