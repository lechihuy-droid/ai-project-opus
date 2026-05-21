# TASK SA-1 — Data layer: MCP server + adapters + datasource

**Agent:** Codex (Wave 1, song song với SA-2, SA-3)
**Repo:** `C:\Users\HUY\AI\metagpt-ai-company\insighthub`
**Phụ thuộc:** W0 đã xong (`schema.py` đủ contract, `_projectstate.json` tồn tại).

## Context

InsightHub gom dữ liệu 5 nguồn. 3 hệ thống ngoài (Jira / Chat / GitHub) được
bọc sau **1 MCP server** `insighthub-mcp` — "giả định đã kết nối", adapter
file-backed (đọc export mẫu). WBS Excel + biên bản họp là file upload → load
trực tiếp. Task này xây toàn bộ lớp data.

## Đọc trước

- `docs/system_design.md` — §1, §3 (contracts), §4 (file list), §5 (field mapping).
- `connections.yaml`, `insighthub/schema.py`.

## File phải tạo

### `insighthub_mcp/adapters/base.py`
Interface `SourceAdapter` (ABC): method `fetch(period_start, period_end) -> list[dict]`.

### `insighthub_mcp/adapters/file_adapter.py`
3 adapter file-backed đọc file mẫu → list dict thô (chưa lọc period thì lọc luôn theo `created`/`ts`/`date`):
- `JiraFileAdapter` → đọc `Sample_Jira_Export.xlsx` sheet `Issues` + `Sprints`.
- `ChatFileAdapter` → đọc `Sample_Slack_Messages.json`.
- `GithubFileAdapter` → đọc `Sample_GitHub_Activity.json`.
Theo field mapping `system_design.md §5`.

### `insighthub_mcp/adapters/api_adapter.py`
Stub `JiraApiAdapter`/`ChatApiAdapter`/`GithubApiAdapter` — `fetch()` raise
`NotImplementedError("API adapter not implemented in MVP — use file mode")`.
Để minh họa kiến trúc swap file↔api.

### `insighthub_mcp/server.py`
`fastmcp` server tên `insighthub-mcp`, 3 tool (chọn adapter theo
`connections.yaml` field `adapter`):
- `list_jira_issues(period_start, period_end)` → issues + sprints
- `list_chat_messages(period_start, period_end)` → messages
- `list_code_activity(period_start, period_end)` → commits + prs
Mỗi tool trả JSON-able dict. Server chạy được cả stdio (`if __name__ == "__main__"`).

### `insighthub/datasource.py`
Hàm `load(connections_path="connections.yaml") -> ProjectState`:
- Gọi 3 MCP tool qua **fastmcp in-memory client** (`Client(mcp_server_object)`) —
  KHÔNG spawn subprocess. (fastmcp hỗ trợ truyền thẳng server object cho Client.)
- Map kết quả tool → `Issue`/`SprintMetric`/`ChatMessage`/`Commit`/`PullRequest`.
- Load trực tiếp (không qua MCP): `Sample_WBS.xlsx` → `WBSTask`;
  `data/sample/minutes/*.docx` → `MinuteItem`.
- Tách `jira_keys` cho Commit/PR bằng regex `[A-Z][A-Z0-9]+-\d+`.
- Gắn `source_ref` mọi record; build & return `ProjectState` (kèm `sprints`).

## Constraints

- Chỉ tạo file trong `insighthub_mcp/` và `insighthub/datasource.py`. **Không
  đụng** `reconcile.py`, `facts.py`, `report.py`, `templating.py`, `export.py`.
- Code đúng contract `schema.py`, không đổi tên field.
- fastmcp in-memory client: dùng `async` thì bọc bằng `asyncio.run` trong `load()`
  để API public của `load()` là sync.

## Definition of Done

Viết smoke test cuối file `datasource.py` (`if __name__ == "__main__"`):
```
python -m insighthub.datasource
```
→ in `state.source_count()` = `{jira:36, wbs:12, chat:13, github:23, minutes:5}`,
và `len(state.sprints)==3`. So khớp `data/sample/_projectstate.json` (cùng số lượng,
mọi record có `source_ref`). MCP server import được, expose đúng 3 tool.
