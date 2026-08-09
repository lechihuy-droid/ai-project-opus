# BD — Xác nhận quyền đọc/ghi folder một lần cho mỗi workflow

**Date:** 2026-08-09 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b` · **Giao cho:** Sonnet subagent. Claude review.

---

## 0. Yêu cầu

> "thay bằng spec confirm quyền đọc ghi của project/workflow. sau đó các lệnh/flow
> trong project được ghi đọc miễn là trong folder và k hỏi lại nữa"

Quyết định của người dùng:

- **Phạm vi:** theo **từng workflow**. Cấp folder X cho `code-task` thì chỉ `code-task`
  dùng được X. Workflow khác muốn dùng X phải xác nhận riêng.
- **Thời hạn:** **vĩnh viễn tới khi thu hồi**, lưu trên server.

---

## 1. Điều đang thay đổi, nói thẳng

Hiện tại quyền ghi là **opt-in từng lần chạy**: người dùng phải tick
`folderWritable` mỗi lần, và không tick thì agent chỉ đọc. Sau bản này, một lần
xác nhận sẽ cho **đọc và ghi vĩnh viễn** trong folder đó, mọi lần chạy sau không hỏi
lại.

Hệ quả cần biết trước:

1. Một workflow bị prompt injection sẽ ghi được vào folder đã cấp mà không có bước
   nào chặn lại nữa. Đây chính là điều đánh đổi lấy sự tiện, và là lý do phạm vi bị
   giới hạn theo từng workflow chứ không dùng chung cả app.
2. Quyền tồn tại tới khi thu hồi, nên **bắt buộc phải có chỗ xem lại và thu hồi**.
   Không có màn hình đó thì không được coi là xong.

Các lớp chặn dưới đây **không** bị quyền này vượt qua, giữ nguyên:

- deny-list trong [fsbrowse.is_denied](../services/fsbrowse.py) — `.ssh`, `.aws`,
  `.gnupg`, `.azure`, `.kube`, thư mục hệ thống Windows
- từ chối gốc ổ đĩa và bản thân `%USERPROFILE%`

---

## 2. Mô hình dữ liệu

Một grant:

```json
{
  "workflow_id": "code-task",
  "path": "C:\\Users\\HUY\\work\\demo",
  "granted_at": "2026-08-09T10:00:00Z",
  "granted_by": "ui"
}
```

- `path` lưu ở dạng **đã resolve** (giải hết symlink, chuẩn hoá hoa thường theo cách
  `Path.resolve()` trả về). Không lưu chuỗi người dùng gõ.
- Lưu server-side theo đúng khuôn của [governance.py](../services/governance.py):
  hằng đường dẫn trong `config.py` cạnh `GOVERNANCE_STATE_FILE`, đọc/ghi bằng cặp
  `_load_state` / `_save_state` tương tự, ghi JSON UTF-8.
- **Client không được tự khẳng định có quyền.** Frontend chỉ hỏi server "workflow này
  đã có quyền trên folder này chưa". Mọi quyết định cho phép đều đọc từ store của
  server.

---

## 3. Luồng

1. Người dùng chọn folder ở thanh Run của trang Workflows.
2. Frontend hỏi server đã có grant cho cặp (workflow đang mở, folder đó) chưa.
3. Chưa có → hiện hộp xác nhận. Nội dung phải nói đúng ba điều, không vòng vo:
   - workflow nào
   - đường dẫn nào, **hiển thị đường dẫn đã resolve**, không phải chuỗi người dùng gõ
   - được làm gì: đọc **và ghi** mọi file trong folder đó và các thư mục con, cho tới
     khi thu hồi
   Hai nút: xác nhận, và huỷ. Huỷ thì folder không được chọn.
4. Xác nhận → gọi server tạo grant → server tự resolve lại và kiểm deny-list lần nữa
   trước khi lưu. Client gửi gì không quan trọng.
5. Từ đó mọi lần chạy workflow đó với folder đó: không hỏi, đọc ghi bình thường.

---

## 4. Điểm quyết định nằm ở server

Sửa [`_tool_policy`](../services/workflow_exec.py) trong `workflow_exec.py`.

Chữ ký hiện tại nhận `workspace_write: bool` do client truyền lên. **Bỏ tham số đó.**
Thay bằng: hàm tự tra store grant theo `workflow_id` và `workspace_dir`.

```
có grant  →  allowed_paths có workspace_dir
             writable_paths có workspace_dir
             cwd = workspace_dir
không có  →  workspace_dir không xuất hiện ở bất kỳ khoá nào
```

Ba điều bắt buộc:

1. **`cwd` chỉ được đặt khi có grant.** Codex coi thư mục làm việc là gốc ghi được khi
   chạy `workspace-write`, nên đặt `cwd` mà không có grant là mở quyền ghi bằng cửa sau.
2. **Resolve lại lúc dùng, không tin đường dẫn đã lưu.** So sánh phải khớp chính xác
   với `path` đã resolve trong grant. Folder bị xoá rồi tạo lại trỏ đi nơi khác, hoặc
   symlink bị tráo, thì grant **không** áp dụng.
3. **Grant phủ đúng cây thư mục đó.** Thư mục con được phủ. Thư mục cha thì không.

Ghi sự kiện audit qua [audit.append](../services/audit.py) ở cả ba chỗ: lúc cấp, lúc
thu hồi, và mỗi lần một lần chạy dùng tới grant.

---

## 5. Màn hình thu hồi

Trang Settings thêm một mục liệt kê mọi grant: workflow, đường dẫn, thời điểm cấp, nút
thu hồi. Thu hồi có hiệu lực ngay với lần chạy kế tiếp.

Grant trỏ tới folder không còn tồn tại thì vẫn hiện trong danh sách, có đánh dấu, để
người dùng dọn.

---

## 6. Frontend

[FolderPicker](../web-v3/src/components/FolderPicker.tsx) hiện có ba công tắc:
`folderAsContext`, `folderAsScope`, `folderWritable`.

- **Bỏ `folderWritable`** cùng hai khoá i18n `workflows.folderWritable` và
  `workflows.folderWritableWarning`. Quyền ghi giờ đến từ grant, không từ công tắc.
- `folderAsContext` và `folderAsScope` **giữ nguyên** — chúng nói về việc dùng folder
  làm ngữ cảnh prompt, không phải quyền hệ thống tệp.
- Chip hiển thị folder đã chọn nên cho biết nó đang có quyền ghi, để trạng thái không
  bị vô hình.

Hộp xác nhận dùng primitive `Dialog` có sẵn trong [lib/ui.tsx](../web-v3/src/lib/ui.tsx),
không dựng mới. Mọi chuỗi đi qua `t()`.

---

## 7. Va chạm cần biết trước khi bắt đầu

Nhánh `claude/claude-skill-setup-35c5b9` đang viết lại chính hàm `_tool_policy` để
thêm `allowed_origins` và `allowed_capabilities`, và trong bản đó `writable_paths` bị
bỏ. Bản work-in-progress ấy nằm ở nhánh `wip/skills-capabilities` (commit `ced614a`).

**Đọc bản đó trước khi sửa `_tool_policy`.** Kết quả phải giữ được cả hai: khoá
capabilities của họ, và tách biệt đọc/ghi của bản này. Nếu thấy không thể gộp gọn thì
dừng lại và báo, đừng chọn bừa một bên.

---

## 8. Ràng buộc

- Không thêm dependency.
- **Không chạy lệnh git** — Claude commit.
- Mọi chuỗi hiển thị đi qua `t()`, không hardcode tiếng Anh trong JSX.
- Không dùng effect để set `dataset`/`classList` điều khiển giao diện — dùng JSX.
- Đọc/ghi UTF-8. Đếm ký tự phi-ASCII theo code point trước và sau ở mọi file chạm vào,
  báo cả hai số. `check-encoding.mjs` không bắt được ký tự bị ghi thành `?`.
- Python 3.11: `C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe`.
  `python` trần trên PATH là 3.14, thiếu `openai` và `pytest`.

---

## 9. Verify

```bash
cd harness/hub && PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest -q -p no:randomly
cd harness/hub/web-v3 && node scripts/check-encoding.mjs && pnpm lint && pnpm exec tsc -b && pnpm build
```

Baseline backend: **361 passed, 1 skipped**. Không được giảm. Lint giữ zero warning.

Lưu ý: `tests/test_render_nodes.py::test_render_success_uses_only_config_argv_and_registers_real_artifact`
thỉnh thoảng fail khi chạy cả bộ, chạy riêng thì pass. Đó là test chập chờn có sẵn,
không phải do bản này.

Test bắt buộc thêm, đặt cùng chỗ với `test_workflow_exec.py`:

1. không có grant → `workspace_dir` không xuất hiện trong `allowed_paths`,
   `writable_paths`, `cwd`
2. có grant → xuất hiện ở cả ba
3. grant cho folder A không cho quyền trên folder cha của A
4. grant cho folder A **có** cho quyền trên thư mục con của A
5. grant của workflow này không dùng được cho workflow khác
6. đường dẫn nằm trong deny-list thì không cấp được, kể cả khi client cố gửi lên
7. grant trỏ tới đường dẫn nay resolve sang chỗ khác → không áp dụng
8. thu hồi rồi thì lần chạy kế tiếp không còn quyền

---

## 10. Báo lại

- Store grant đặt ở file nào, hình dạng JSON
- `_tool_policy` sau khi sửa trông thế nào, và đã gộp với bản capabilities ra sao
- Chỗ nào resolve lại đường dẫn lúc dùng
- Danh sách sự kiện audit đã thêm
- Kết quả từng mục test 1–8, và số pytest trước/sau
- Số ký tự phi-ASCII trước/sau theo từng file
