# BD — Kéo thả agent vào canvas + hoàn thiện trang thiết kế agent

**Date:** 2026-08-06 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b`
**Giao cho:** Codex. Claude review từng step.

---

## 0. Bối cảnh

Kéo thả **đã có** trong `WorkflowsPage.tsx`: palette nằm cuối sidebar, mỗi agent là một `<div draggable>` set `dataTransfer('agent', id)`, canvas có `onDrop` gọi `addNode`. Đợt này **không xây mới tính năng** — sửa một bug toạ độ làm tính năng đó gần như không dùng được, và nâng phần còn lại lên mức dùng được thật.

Trang thiết kế agent (`AgentsPage.tsx`) đã có ô `system_prompt` và tab Skills. Thiếu: `permission`, `model` không sửa được, và một bug ghi đè làm mất `allowed_tools`/`allowed_paths`.

### Đo được

| Mục | Hiện trạng |
|---|---|
| `WorkflowsPage.tsx` | 130 dòng (mật độ rất cao, 1 component/dòng) |
| `AgentsPage.tsx` | 38 dòng |
| Node type backend hỗ trợ | `agent`, `validate`, `render` (`services/workflow.py:172`) |
| Node type kéo thả được từ palette | `agent`, `validate` |
| Test frontend | **không có** (không có vitest) — verify bằng `pnpm lint` + `pnpm build` + kiểm thử tay |
| Test backend | 235 test, `pytest harness/hub/tests -q` |

---

## 1. Bất biến — vi phạm là fail

1. **Không đổi backend.** Zero dòng `.py` thay đổi. Mọi field cần dùng đã có sẵn: `runtime_agents.OPTIONAL_FIELDS = ("model", "allowed_tools", "allowed_paths")`, `PERMISSIONS = {"read_only", "workspace_write"}`. 235 test backend phải xanh không đổi.
2. **Không đổi schema workflow.** Node vẫn chỉ có `agent` / `validate` / `render`. Không thêm node type `tool`.
3. **Mọi chuỗi hiển thị đi qua `t()`** — thêm key vào `src/lib/i18n/workflows.ts` và `agents.ts`, không hardcode. `pnpm check:encoding` phải pass (chạy tự động trong `pnpm build`).
4. **Dùng component có sẵn trong `src/lib/ui.tsx`** (`Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Chip`, `Status`, `ProviderDot`, `EmptyState`, `Popover`). Không tự viết nút/input mới.
5. **Dùng token trong `src/styles/tokens.css`.** Không hex literal. Màu node/edge theo `web-v3/DESIGN.md` §"Workflow Canvas".
6. **Giữ style file hiện tại** — `WorkflowsPage.tsx` viết một-dòng-một-component có chủ đích, giữ nguyên quy ước đó, đừng "format lại cho đẹp".
7. **Giữ toàn bộ comment giải thích bug cũ** trong `WorkflowsPage.tsx` (dòng 28–33, 50–55, 73–77, 82–84, 96, 98–99). Chúng ghi lại bug đã sửa; xoá là làm mất bối cảnh.

---

## 2. Phần A — Canvas drag & drop

### A1. Sửa bug toạ độ thả (bug thật, ưu tiên cao nhất)

**Triệu chứng:** thả agent vào canvas thì node xuất hiện sai chỗ, lệch rất xa con trỏ. Chỉ đúng khi `pan = {0,0}` và `zoom = 1` — tức gần như không bao giờ, vì `fit()` chạy mỗi lần đổi workflow.

**Nguyên nhân:** transform bị áp hai lần.

- `WorkflowsPage.tsx:109` — `onDrop`: `const at = toWorld(event.clientX, event.clientY)` → `at` **đã là toạ độ world** (`toWorld` dòng 77 đã trừ `rect`, trừ `pan`, chia `zoom`).
- `WorkflowsPage.tsx:63` — `addNode`: `x: Math.max(0, (point.x - pan.x) / zoom - 110)` → trừ `pan` và chia `zoom` **lần nữa**.

**Sửa:** `addNode` nhận thẳng toạ độ world, chỉ trừ offset để con trỏ rơi vào giữa card:

```ts
const next = { ...layoutRef.current, [id]: {
  x: Math.max(0, point.x - size.width / 2),
  y: Math.max(0, point.y - size.height / 2),
} }
```

Chú ý: `110` trong code cũ là `size.width / 2` viết cứng — thay bằng `size.width / 2` cho khớp `size` ở dòng 33.

**Verify:** `fit()` trước, rồi thả một agent — tâm card phải nằm dưới con trỏ (sai số < 5px). Lặp lại ở zoom 0.5 và 1.8.

### A2. Palette thành khu riêng, agent là công dân hạng nhất

Hiện palette là mẩu cuối `Sidebar` (dòng 119), nằm dưới danh sách workflow, không có tiêu đề rõ, không search, phải cuộn qua toàn bộ workflow mới thấy.

Tách thành component `Palette` riêng trong cùng file, đặt **dưới** `Sidebar` như một khối cố định (`shrink-0`, border-t), danh sách workflow ở trên chiếm phần cuộn được:

- Ô search riêng cho palette (`Input`, `t('workflows.searchAgents')`), lọc theo `agent.id` + `agent.name`.
- Mỗi mục agent hiển thị: `ProviderDot` (identity, theo DESIGN.md §5.1 — **không** dùng màu provider cho action/selection), tên agent, và dòng phụ `agent.provider`.
- Nhóm rõ hai phần bằng heading `uppercase tracking-[var(--hub-section-tracking)] text-muted`:
  - `t('workflows.paletteAgents')` — danh sách agent
  - `t('workflows.paletteNodes')` — chip `validate` (giữ nguyên `--hub-node-validate`)
- Rỗng (không agent nào khớp search) → `EmptyState` gọn, không phải chuỗi trần.

### A3. Affordance khi kéo

Hiện tại kéo không có phản hồi thị giác nào ngoài ghost mặc định của trình duyệt.

1. **Drag image:** trong `onDragStart`, ngoài `setData`, gọi `event.dataTransfer.setDragImage(event.currentTarget, 12, 12)` và set `event.dataTransfer.effectAllowed = 'copy'`.
2. **Canvas nhận diện được vùng thả:** state `dragOver: boolean` ở `WorkflowsPage`. `onDragEnter`/`onDragOver` trên `<section>` canvas → `setDragOver(true)` + `event.dataTransfer.dropEffect = 'copy'`; `onDragLeave` (chỉ khi `event.currentTarget` không chứa `event.relatedTarget`) và `onDrop` → `setDragOver(false)`. Khi `dragOver`, canvas thêm `ring-2 ring-[var(--hub-accent)] ring-inset`.
3. **Con trỏ:** mục palette đang là `cursor-grab`, thêm `active:cursor-grabbing`.

Không làm ghost-node preview đi theo con trỏ trong canvas — HTML5 DnD không cấp toạ độ đáng tin trên mọi trình duyệt, và ring + drag image đã đủ tín hiệu.

### A4. Thả lên edge để chèn node vào giữa

Hôm nay `addNode` **luôn** nối node mới vào cuối chuỗi (`ordered.at(-1)`) bất kể thả ở đâu. Muốn chèn vào giữa phải sửa tay 2 edge trong Inspector.

Thêm: nếu thả trúng một edge thì chèn node vào giữa edge đó.

- Trong `Canvas`, path bắt sự kiện (`strokeWidth="14"`, dòng 123) thêm `onDragOver`/`onDragEnter` → báo lên `onEdgeHover(key)`; `onDragLeave` → `onEdgeHover(null)`. Edge đang hover vẽ bằng `--hub-edge-selected` + `strokeWidth={3}`.
- `WorkflowsPage` giữ `hoverEdge: string | null`. Trong `onDrop`, nếu `hoverEdge` khác null: gọi `addNode(..., { insertOn: hoverEdge })`.
- `addNode` với `insertOn`: xoá edge `A→B`, thêm `A→new` và `new→B`. Prompt của node mới dùng `{{A_output}}`. Sau khi chèn, **không** đụng prompt của B (người dùng tự sửa) — nhưng `refErrors` sẽ tự hiện cảnh báo nếu B tham chiếu sai thứ tự, đó là hành vi đúng sẵn có.
- Giữ nguyên `kind`/`label` của edge cũ cho **cả hai** edge mới nếu edge cũ là dạng object.

Thả ra vùng trống → giữ nguyên hành vi cũ (nối vào cuối chuỗi).

### A5. Thêm node bằng bàn phím (a11y)

Palette hiện chỉ dùng được bằng chuột — `<div draggable>` không focus được, không có role. Phần còn lại của canvas thì đã hỗ trợ bàn phím đầy đủ (node có `tabIndex`, mũi tên để nhích, Enter/Space để chọn), nên đây là lỗ hổng lệch chuẩn.

Mỗi mục palette thành `<button type="button" draggable>` (vẫn kéo được), `aria-label={t('workflows.addAgentAria', { id })}`. `onClick` / Enter / Space → thêm node vào **giữa viewport hiện tại**:

```ts
const rect = canvasRef.current?.getBoundingClientRect()
const at = toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2)
```

Dùng chung đúng đường `addNode` với thả chuột — không viết nhánh riêng.

### A6. Thanh trạng thái canvas nói rõ chuyện gì vừa xảy ra

Thanh `{n} nodes · {n} connections · Unsaved` (dòng 109) không cho biết node vừa thêm đã tự nối vào đâu. Sau mỗi lần thêm node, set `notice` dạng info (không phải error) — hiện tại banner ở dòng 107 tô đỏ **mọi** `notice`.

Tách thành hai state: `notice` (đỏ, như cũ) và `hint` (dùng `border-border-subtle bg-surface text-secondary`). Nội dung:
- Nối vào cuối: `t('workflows.nodeAppended', { id, after })`
- Chèn vào edge: `t('workflows.nodeInserted', { id, from, to })`

`hint` bị xoá khi có bất kỳ `update()` tiếp theo.

---

## 3. Phần B — Trang thiết kế agent

### B1. Bug mất dữ liệu — `allowed_tools` / `allowed_paths` bị xoá khi lưu (ưu tiên cao)

`POST /api/agents` ghi đè **toàn bộ** file yaml bằng payload (`runtime_agents.create_or_update_agent`, dòng 126–131 — `path.write_text(yaml.safe_dump(data, ...))`, không merge). Type `Agent` ở `AgentsPage.tsx:9` **không có** `allowed_tools`/`allowed_paths`, nên `api<Agent[]>('/api/agents')` giữ chúng trong object runtime nhưng `blank` thì không, và mọi thao tác trong UI không quan tâm đến chúng.

Rủi ro thực: mở một agent có `allowed_tools`, bấm Save → hai field đó biến mất khỏi yaml, agent mất quyền dùng tool.

**Sửa:**
1. Thêm vào type: `allowed_tools?: string[]; allowed_paths?: string[]`.
2. `choose()` copy chúng (`allowed_tools: row.allowed_tools ? [...row.allowed_tools] : undefined`), `duplicate()` tương tự.
3. Hiện chúng trong tab Settings để người dùng thấy mình đang giữ cái gì — xem B3.

**Đang bị ảnh hưởng thật — 2 agent trong repo:**

| File | Field bị mất khi Save từ UI |
|---|---|
| `agents/example-scoped-inspector.agent.yaml` | `allowed_tools: [list_dir, read_file, grep]` · `allowed_paths: [harness/hub/agents]` |
| `agents/remotion-researcher.agent.yaml` | `allowed_tools: [list_dir, read_file, grep]` · `allowed_paths: [opus-animus/opus-lucida/apps/lucida-remotion-demo]` |

**Verify:** `git stash` sạch trước, mở `remotion-researcher` trong UI, sửa system prompt, Save → `git diff agents/remotion-researcher.agent.yaml` chỉ được thấy dòng prompt đổi, hai field kia còn nguyên. Rồi `git checkout` lại file.

### B2. `permission` không sửa được ở bất kỳ đâu

Tab Overview hiển thị `agent.permission` dưới dạng `<span>` đọc-suông (dòng 34). Không tab nào cho sửa. Hệ quả: agent mới **luôn** là `read_only` (từ `blank`), muốn `workspace_write` phải sửa yaml tay.

Thêm vào tab **Settings** (cạnh `risk_tier`, cùng họ "quyền hạn"):

```tsx
<Field label={t('agents.fieldPermission')}>
  <Select value={agent.permission} onChange={e => update({ permission: e.target.value as Agent['permission'] })}>
    <option value="read_only">read_only</option>
    <option value="workspace_write">workspace_write</option>
  </Select>
</Field>
```

Hai giá trị viết cứng là đúng: `PERMISSIONS` ở backend là set 2 phần tử cố định, không có endpoint liệt kê, và thêm endpoint là vi phạm bất biến #1.

Tab Overview giữ nguyên dạng đọc-suông (Overview = tóm tắt, Settings = sửa) — đúng mô hình sẵn có của trang.

### B3. Settings hiển thị `model`, `allowed_tools`, `allowed_paths`

- `model`: `Input` text, `placeholder={t('agents.modelPlaceholder')}`, để trống = dùng mặc định của provider/model-class. Backend cho phép `model: null`; gửi chuỗi rỗng thì chuyển thành `undefined` trước khi POST (đừng ghi `""` vào yaml).
- `allowed_tools`, `allowed_paths`: hai `Input` một dòng, giá trị phân tách bằng dấu phẩy, hiển thị lại bằng `Chip` bên dưới. Parse: `value.split(',').map(s => s.trim()).filter(Boolean)`; mảng rỗng → gửi `undefined` (giữ yaml sạch, khớp `OPTIONAL_FIELDS`).

Backend đã validate cả ba (`validate_agent_profile` dòng 59–62), lỗi nhập sai trả 400 và trang đã có `setError` — không cần validate lại ở frontend.

### B4. Tab Skills dùng được

Hiện là danh sách checkbox trần, không search, không mô tả, và **`key={skill.name}` bị trùng**: `/api/skill-library` trả một entry cho mỗi cặp (name, source), nên một skill có ở 2 source sẽ sinh 2 phần tử cùng key → React cảnh báo và có thể render sai.

1. Đổi `key={skill.name}` → `key={skill.id}` (`list_skills` trả `id` duy nhất).
2. Dedupe theo `name` trước khi render — checkbox thao tác trên `agent.skills` là mảng **tên**, nên hai dòng cùng tên là vô nghĩa. Gộp và hiển thị nguồn qua `coverage`.
3. Mở rộng type: `{ id: string; name: string; description: string; coverage: string[] }`.
4. Mỗi dòng: checkbox · `name` (mono) · `description` truncate 1 dòng · `Chip muted` cho từng `coverage`.
5. Thêm `Input` search lọc theo `name` + `description`.
6. Skill đang bật nổi lên đầu danh sách.
7. Không skill nào khớp → `EmptyState`.

### B5. Ô system prompt

`system_prompt` là `Textarea rows={5}` nằm trong `grid grid-cols-2` của Overview (dòng 34) — chỉ rộng nửa panel 390px, tức ~180px cho thứ dài nhất trên trang.

Cho nó `className="col-span-2"` và `rows={10}`. Không thêm gì khác.

---

## 4. Không làm đợt này

| Việc | Lý do |
|---|---|
| Node type `tool` trong workflow | Backend không có. Cần đổi schema + `workflow_exec` + validate — BD riêng. |
| Kéo `render` node từ palette | Backend có `render` nhưng nó cần `props_from` + `RENDER_TARGETS` đã cấu hình; hôm nay chỉ có 1 target trỏ ra ngoài repo. Ghi nhận là gap, không làm. |
| Override `allowed_tools` ở cấp node workflow | `_tool_policy` (`workflow_exec.py:302`) đọc từ agent profile. Đổi = đổi backend. |
| Undo/redo trên canvas | Ngoài phạm vi. |
| Canvas hỗ trợ nhánh (branch) | `isLinearChain` đã cảnh báo đúng; sửa thật là việc của backend executor. |
| Viết lại `WorkflowsPage.tsx` cho dễ đọc | Refactor không ai yêu cầu. |

---

## 5. Thứ tự thực thi

Mỗi step chạy `pnpm lint` + `pnpm build` xong mới sang step kế. Không gộp step.

| # | Việc | File | Verify |
|---|---|---|---|
| 1 | A1 — sửa toạ độ thả | `WorkflowsPage.tsx` | Thả sau `fit()` ở zoom 0.5 / 1.0 / 1.8, card rơi vào con trỏ |
| 2 | B1 — giữ `allowed_tools`/`allowed_paths` | `AgentsPage.tsx` | Save agent có field đó, yaml không mất |
| 3 | A2 — tách `Palette` | `WorkflowsPage.tsx`, `i18n/workflows.ts` | Search lọc đúng, kéo vẫn chạy |
| 4 | A3 — affordance kéo | `WorkflowsPage.tsx` | Ring hiện khi kéo vào canvas, tắt khi rời |
| 5 | A5 — thêm node bằng bàn phím | `WorkflowsPage.tsx`, `i18n` | Tab tới mục palette, Enter → node ở giữa viewport |
| 6 | A4 — thả lên edge để chèn | `WorkflowsPage.tsx`, `i18n` | Chèn giữa `A→B` cho ra `A→new→B`, Save + reload giữ nguyên |
| 7 | A6 — banner hint | `WorkflowsPage.tsx`, `i18n` | Hint xanh xám, không đỏ; mất sau lần sửa kế |
| 8 | B2 + B3 — Settings | `AgentsPage.tsx`, `i18n/agents.ts` | Tạo agent `workspace_write` từ UI, yaml đúng |
| 9 | B4 — tab Skills | `AgentsPage.tsx`, `i18n/agents.ts` | Không còn cảnh báo trùng key, search chạy |
| 10 | B5 — ô prompt | `AgentsPage.tsx` | Full width, 10 dòng |

---

## 6. Test plan

### Tự động
```bash
cd harness/hub/web-v3 && pnpm lint && pnpm build
```
```bash
.ih/Scripts/python.exe -m pytest harness/hub/tests -q
```
235 test backend phải xanh và **không có file `.py` nào trong diff** — đây là cách kiểm tra bất biến #1.

### Tay — chạy `.\harness\hub\run-hub.ps1` → http://127.0.0.1:8799

Workflows:
1. Chọn `code-task` (layout có node ở x:793,y:406, buộc `fit()` phải zoom ≠ 1) → thả `reviewer` → card rơi đúng con trỏ.
2. Zoom 0.5, thả lần nữa → vẫn đúng.
3. Kéo agent qua canvas → ring accent hiện; kéo ra ngoài → tắt.
4. Kéo agent thả trúng edge giữa 2 node → thành 3 node nối tiếp, banner báo đã chèn.
5. Save → F5 → cấu trúc và vị trí giữ nguyên.
6. Tab tới mục palette, Enter → node xuất hiện giữa màn hình, được select sẵn.
7. Search palette "review" → chỉ còn agent khớp; xoá search → đủ lại.

Agents:
8. Tạo agent mới, chọn `workspace_write`, Save → `agents/<id>.agent.yaml` có `permission: workspace_write`.
9. Mở `remotion-researcher` (có sẵn `allowed_tools` + `allowed_paths`), đổi prompt, Save → `git diff` chỉ đổi dòng prompt.
10. Tab Skills: không có cảnh báo duplicate key trong console; search lọc đúng; skill đang bật nằm trên đầu.
11. Nhập `allowed_paths` rác (ví dụ `,,,`) → không sinh field rỗng trong yaml.

### Regression
12. Chạy thật một workflow có `gate: approval` → gate vẫn hiện, Approve vẫn tiếp.
13. Xoá edge, xoá node, nhích node bằng mũi tên — như cũ.
14. Đổi qua lại giữa 2 workflow → layout không nhảy (bug đã sửa ở comment dòng 50–55, đừng làm hỏng lại).

---

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| `WorkflowsPage.tsx` mật độ cực cao, dễ sửa nhầm dòng khác | Mỗi step một commit, `git diff` đọc lại trước khi sang step kế |
| A4 (chèn vào edge) đụng vào `isLinearChain` | Chèn giữ chuỗi tuyến tính, phải verify banner "linear only" không bật lên sau khi chèn |
| `onDragLeave` bắn nhầm khi con trỏ đi qua node con | Chỉ tắt `dragOver` khi `!event.currentTarget.contains(event.relatedTarget as Node)` |
| B1 không có test tự động che | Bước verify tay #9 là bắt buộc, không được bỏ |
