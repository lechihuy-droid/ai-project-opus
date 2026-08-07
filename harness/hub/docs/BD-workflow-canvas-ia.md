# BD — Workflow canvas: tách Design/Run, ngữ nghĩa node, và dọn IA

**Date:** 2026-08-06 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b`
**Upstream:** Review UX ngoài (2026-08-06) + `BD-workflow-canvas-dnd.md` (đã xong) + `BD-workflow-folder-input.md` (đang chạy)
**Giao cho:** Codex. Claude review từng step.

---

## 0. Bối cảnh

BD này xử lý bản review UX bên ngoài. **Ba nhận định trong review sai so với code hiện tại** — người thực thi đừng đi sửa những thứ đã có:

| Review nói | Thực tế |
|---|---|
| "Edge không có arrowhead, label, edge type" | Có đủ. `WorkflowsPage.tsx` render `<marker id="workflow-arrow-{kind}">` + `markerEnd` cho mọi edge; `edgeLabel` vẽ `<text>` trên path; 4 kind (`default/success/warning/error`) khác màu; có Edge Inspector đặt kind + label |
| "Save không thể hiện unsaved changes" | Có state `dirty` render `Unsaved` / `Synced`. Tên gọi yếu — BD này đổi tên, không thêm cơ chế |
| "Cần thêm node status idle/running/passed/failed" | `nodeState()` đã trả idle/running/done/fail, node có icon tương ứng + class `node-pulse` khi chạy |

**Và phần lớn nhất của review nằm ngoài tầm với của frontend.** Review đòi approval gate có hai output port `Approved`/`Rejected`, router/condition node, parallel fork/join, sub-workflow. Backend từ chối thẳng:

`services/workflow.py:297` — `"Edges must form exactly one linear chain covering every node once"`

Node type hợp lệ chỉ có `{agent, validate, render}` (`workflow.py:172`). Vẽ nhánh ra khỏi gate sẽ tạo workflow **fail validate ngay khi Save**. Đó là epic executor, không phải việc canvas — xem §5.

---

## 1. Bất biến

1. **Không đổi file `.py`.** Toàn bộ BD này là frontend. Nếu một hạng mục cần backend thì nó thuộc §5, không thuộc BD này.
2. **`size` phải khớp chiều cao thật của node card.** Comment ở `WorkflowsPage.tsx` dòng 28–33 ghi lại đúng bug này: một giá trị lệch làm điểm nối edge, arrow marker và offset thả node lệch khỏi DOM. Step B2 đổi card ⇒ **phải đo lại DOM và cập nhật `size` trong cùng commit**, không để sang commit sau.
3. **Giữ mọi comment giải thích bug cũ** trong `WorkflowsPage.tsx` (dòng 28–33, 50–55, 73–77, 82–84, 96, 98–99).
4. **Không thêm dependency.** `package.json` chỉ có `react`, `react-dom`, `react-router-dom`, `lucide-react`. Minimap, undo/redo, autocomplete đều tự viết.
5. **Mọi chuỗi hiển thị qua `t()`**, key vào `src/lib/i18n/workflows.ts`.
6. **Không giảm accessibility đang có.** Node hiện có `tabIndex`, `aria-label`, mũi tên để nhích, Enter/Space để chọn; port có `aria-label` và focus được. Step B2 thu nhỏ port **không được** làm port mất khả năng focus — hover-reveal phải kèm `:focus-visible` reveal.
7. **BD2 (folder picker) phải land trước.** BD2 đặt nút chọn folder ở header; step A-mode của BD này chuyển nó vào Run mode. Làm ngược thứ tự sẽ conflict.

---

## 2. Tầng A — dọn IA, thuần cơ học

### A1. Run log thành drawer, mặc định đóng

Hôm nay: `grid-rows-[minmax(360px,1fr)_minmax(150px,30%)]` — run log ăn tới 30% chiều cao **kể cả khi chưa chạy lần nào**, chỉ để hiện một dòng empty state.

- Đổi thành một drawer đáy: khi đóng chỉ còn thanh tiêu đề cao `var(--hub-size-toolbar)`; canvas lấy toàn bộ phần còn lại.
- Mặc định **đóng** ở Design mode.
- Tự **mở** khi `start()` chạy, và khi có event `error`/`validation_fail`.
- Thanh tiêu đề hiện: `t('workflows.runLog')` · số event · trạng thái run · nút gập.
- Trong drawer có hai tab: `Console` (như hiện tại) và `Errors` (lọc `type === 'error' || type === 'validation_fail'`). Không làm Timeline/Artifacts đợt này.

### A2. Sidebar tách tab `Workflows` | `Components`

Hôm nay sidebar xếp nối tiếp danh sách workflow rồi tới palette, **hai ô search trong một cột** — chính đợt trước vừa thêm ô thứ hai.

- Một hàng tab ở đầu sidebar, `role="tablist"`, điều hướng bằng mũi tên như tablist của Inspector đã làm.
- Tab `Workflows`: ô search + danh sách. Mỗi dòng hiện `id`, và **trạng thái** thay cho việc chỉ đếm: `{n} nodes · {Valid|Invalid|Unsaved}`. Valid/Invalid lấy từ kết quả `validateWorkflow` gần nhất của workflow đang mở; workflow chưa mở thì chỉ hiện số node.
- Tab `Components`: ô search + nhóm `Agents` / `Nodes` như Palette hiện tại.
- Chỉ còn **một** ô search hiển thị tại một thời điểm.

### A3. `Delete workflow` vào overflow menu

- Bỏ nút `Delete workflow` khỏi toolbar chính. Đưa vào `Popover` (`•••`, `Ellipsis` từ lucide) cạnh `Save`, cùng chỗ với `Rename`/`Duplicate` nếu sau này có.
- Giữ nguyên cơ chế xác nhận inline hiện có — chỉ đổi chỗ đặt, không đổi luồng.
- `Hide inspector` thành `IconButton` (`PanelRight`) có `title` + `aria-label`, không còn là nút chữ ngang hàng với action nghiệp vụ.

### A4. Sàn chữ 12px, mono đúng vai trò

`DESIGN.md` §Typography đã quy định caption = 12/16/400 và **cấm mono cho navigation label**. `WorkflowsPage.tsx` đang vi phạm: 7 chỗ `text-[10px]`, 1 chỗ `text-[9px]`, 10 chỗ `font-mono`.

- Mọi `text-[10px]` / `text-[9px]` trong `WorkflowsPage.tsx` → `text-caption` (12px) hoặc `text-section` cho heading uppercase.
- `font-mono` **chỉ** giữ ở: node id trên card, node id trong Inspector, token `{{...}}`, và pre/JSON. **Bỏ** ở danh sách workflow, tên agent trong palette, dòng run trong tab Runs.
- Đây là sửa để tuân thủ DESIGN.md sẵn có, không phải sở thích mới. Chỉ sửa `WorkflowsPage.tsx`; các trang khác cũng vi phạm nhưng ngoài phạm vi.

### A5. Từ ngữ

| Hiện tại | Đổi thành | Lý do |
|---|---|---|
| `Validate` (nút toolbar) | `Check workflow` | Đang trùng tên với node type `validate` |
| `Ready` | `Valid` / `Invalid` | Không rõ ready về cái gì; sau khi Check thì trạng thái là tính hợp lệ |
| `Synced` | `Saved` | Không rõ sync với đâu |
| `Add inputs` | `Run inputs` | Không rõ là file, biến hay node |
| `gate` (Inspector) | `Execution policy`, option `None` / `Requires approval` | Quan hệ khó đọc |
| `agent` (Inspector) | `Agent` | Form đang lowercase, chưa hoàn thiện |

Giá trị **lưu xuống YAML không đổi** — `gate: none|approval` giữ nguyên, chỉ đổi nhãn hiển thị.

### A6. Node card hiện lỗi contract ngay trên canvas

`refErrors(ordered)` đã tính sẵn biến sai của từng node nhưng chỉ hiện trong Inspector. Thêm một dấu hiệu trên card: viền `--hub-error` + icon `TriangleAlert` + `aria-label` nói rõ có bao nhiêu tham chiếu sai. Người dùng thấy được lỗi mà không cần mở từng node.

---

## 3. Tầng B — nặng hơn, vẫn thuần frontend

### B1. Tách mode `Design` | `Run`

Vấn đề gốc mà review nêu đúng: một màn hình đang trộn **định nghĩa workflow** (node, edge, prompt, agent) với **tham số của một lần chạy** (objective, inputs, folder). `Run objective…` nằm ở header workflow khiến nó trông như thuộc tính của workflow.

- Switch ở header, hai nút, `role="tablist"`.
- **Design mode:** sidebar + canvas sửa được + inspector + `Check workflow` + `Save` + overflow menu. Run log drawer đóng.
- **Run mode:**
  - Hàng tham số run: objective, `Run inputs`, folder picker (từ BD2), `Run`/`Stop`.
  - Canvas **read-only**: không kéo node, không thêm, không xoá, không sửa edge. Vẫn pan/zoom/fit, vẫn hiện trạng thái node và cho chọn node để xem.
  - Inspector chuyển sang chỉ đọc, mở sẵn tab `Runs`.
  - Run log drawer mở.
- State `mode` không lưu xuống server; đổi workflow thì về `Design`.
- Đang `busy` (có run chạy) mà bấm sang Design → cho phép, nhưng canvas vẫn khoá cho tới khi run kết thúc; hiện hint giải thích.

### B2. Node card mới + port nhỏ lại

Card hiện tại: icon + id, một dòng agent, một dòng trạng thái. Không cho biết loại node, provider, số input/output.

Bố cục đích:

```
┌────────────────────────────────┐
│ ✦ Agent               ● Ready  │
│ implement                      │
│ coder · claude                 │
│ Inputs 1        Approval ○     │
└────────────────────────────────┘
```

- Dòng 1: loại node (`Agent` / `Validate` / `Render`) + trạng thái chạy.
- Dòng 2: node id (mono).
- Dòng 3: agent id · provider đã resolve qua `resolveProvider` (không mono).
- Dòng 4: số biến `{{...}}` node đọc vào · dấu hiệu approval.
- Loại node phân biệt bằng **icon + nhãn chữ**, không chỉ bằng màu viền — review nói đúng chỗ này.
- Port: giảm còn 8×8 px hiển thị, nhưng **vùng bấm giữ tối thiểu 24×24** bằng padding trong suốt. Mặc định `opacity-0`, hiện khi hover card **hoặc** `:focus-visible` trên chính port **hoặc** khi đang kéo edge (`draftEdge !== null`). Mất focus-reveal là vi phạm bất biến #6.

**Bắt buộc:** sau khi đổi card, đo `getBoundingClientRect().height` thật của một node trên canvas và cập nhật `const size` cho khớp. Ghi giá trị đo được vào commit message.

### B3. Prompt editor gợi ý biến

`refErrors` đã biết biến nào sai; người dùng chưa có cách biết biến nào **đúng**.

- Dưới ô prompt, liệt kê biến khả dụng cho node đang chọn: `{{objective}}`, `{{inputs}}`, và với mỗi node đứng trước — `{{<id>_output}}`, `{{<id>_claims}}`. Bấm vào chèn vào vị trí con trỏ.
- Gõ `{{` mở danh sách lọc theo ký tự tiếp theo; Enter chèn, Escape đóng, mũi tên di chuyển. Tự viết, không thêm thư viện.
- Biến sai hiện inline ngay dưới ô prompt kèm lý do (`refErrors` phân biệt được "không tồn tại" với "tham chiếu node đứng sau").
- Không làm resolved-preview và version history đợt này.

### B4. Minimap · undo/redo · multi-select

**Undo/redo** — đáng giá nhất trong ba cái, vì hiện xoá node là mất luôn.
- Stack snapshot `{ workflow, layout }`, cap 50 bước.
- Push tại đúng hai chỗ: `update()` (mọi thay đổi model) và khi kết thúc một thao tác layout (`pointerUp` sau kéo, `nudgeNode`). Không push mỗi `pointerMove`.
- `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` redo. Bỏ qua khi focus đang ở `input`/`textarea`.
- Đổi workflow (`selectedId` đổi) → xoá sạch stack. Effect ở dòng 50–55 đã có comment cảnh báo về vòng đời này, đọc trước khi sửa.

**Multi-select**
- `Shift+click` node để thêm/bớt khỏi tập chọn.
- `Shift+drag` trên vùng trống = marquee. **Giữ nguyên kéo-trống = pan** — đổi cử chỉ pan sẽ phá thói quen đang có.
- Kéo một node trong tập chọn → cả tập di chuyển cùng delta.
- `Delete` xoá cả tập, cùng mọi edge chạm vào chúng.
- `activeId` hiện tại thành trường hợp tập một phần tử; Inspector chỉ hiện khi tập có đúng một node.

**Minimap**
- Overlay góc dưới phải canvas, ~160×110, `pointer-events-auto`.
- Vẽ hình chữ nhật cho mỗi node từ `layout` + khung viewport hiện tại.
- Bấm để nhảy tới, kéo khung để pan.
- Ẩn khi số node < 5 (workflow nhỏ thì nó chỉ tổ chiếm chỗ).

---

## 4. Không làm đợt này

| Việc | Lý do |
|---|---|
| Mode `History` | `/api/agent/runs` có sẵn nhưng một trang History đủ dùng (duration, cost, retry, resume) là scope riêng |
| Timeline / Artifact viewer trong drawer | Cần `/api/workflows/runs/{id}/artifacts`; tách BD |
| Auto-layout | Chỉ có nghĩa khi graph có nhánh — chờ §5 |
| Group / swimlane | Như trên |
| Version history, compare, comment, template gallery | P2 của review, chưa cần |
| Ước tính cost/token trên node | Cần dữ liệu pricing theo node, chưa có |

---

## 5. Chặn ở backend — epic riêng, không thuộc BD này

Những thứ sau **không vẽ được** cho tới khi executor bỏ ràng buộc chuỗi thẳng:

- Approval gate có hai output `Approved` / `Rejected`
- Router / condition node
- Parallel fork / join
- Sub-workflow
- Start / End node

Cần: đổi schema graph (`validate_workflow` cho phép nhiều out-edge có điều kiện), thay `_walk_chain` bằng duyệt DAG, viết lại `workflow_exec.run_workflow` cho nhánh, và cho `runtime_interrupts` resume theo nhánh thay vì chỉ `resume|reject`. Đây là BD riêng, kích thước lớn hơn cả BD1 + BD2 + BD3 cộng lại.

**Cho tới lúc đó,** UI phải nói thật thay vì giả vờ: cảnh báo `workflows.linearOnly` hiện có giữ nguyên, và Palette không được gợi ý node type mà backend không chạy được.

---

## 6. Thứ tự thực thi

Tầng A trước — rẻ, độc lập, giảm nhiễu trước khi đụng vào phần khó. Mỗi step một commit, gate `pnpm lint` + `pnpm exec tsc -b`; Claude chạy `pnpm build` + verify trình duyệt giữa các batch.

| # | Việc | Gate riêng |
|---|---|---|
| 1 | A4 sàn chữ + mono | Không còn `text-[10px]`/`text-[9px]` trong file; `font-mono` chỉ còn ở id/token/pre |
| 2 | A5 từ ngữ | Giá trị YAML không đổi — Save một workflow rồi `git diff` chỉ được thấy reflow của `yaml.safe_dump` (block style, quote đổi kiểu). Mọi `id`, `agent`, `prompt`, `gate`, `edges`, `stop` phải giữ nguyên giá trị. Diff **không** trống được: `PUT /model` ghi lại cả file mỗi lần Save, đó là hành vi có sẵn |
| 3 | A3 overflow menu | Delete vẫn xoá được, vẫn có bước xác nhận |
| 4 | A1 run log drawer | Chưa chạy gì thì canvas chiếm gần hết chiều cao; bấm Run thì drawer tự mở |
| 5 | A2 sidebar tabs | Chỉ còn một ô search hiện tại một lúc |
| 6 | A6 lỗi contract trên card | Node có biến sai hiện viền error |
| 7 | B1 Design/Run | Ở Run mode không kéo/thêm/xoá được node |
| 8 | B2 node card + port | `size` khớp DOM đo được; port vẫn focus được bằng Tab |
| 9 | B3 prompt variables | Gõ `{{` ra danh sách; bấm chèn đúng vị trí con trỏ |
| 10 | B4 undo/redo | Xoá node rồi `Ctrl+Z` phục hồi cả node lẫn edge lẫn vị trí |
| 11 | B4 multi-select | `Shift+drag` chọn nhiều, kéo cả cụm, `Delete` xoá cụm |
| 12 | B4 minimap | Hiện khi ≥5 node, bấm để nhảy |

---

## 7. Test plan

### Tự động
```bash
cd harness/hub/web-v3 && pnpm lint && pnpm build
```
```bash
.ih/Scripts/python.exe -m pytest harness/hub/tests -q
```
Backend không được đổi ⇒ số test pass phải y hệt trước BD. Lưu ý `test_render_nodes.py` có 1–2 test **flaky sẵn** khi chạy cả suite (pass khi chạy riêng file) — không phải do BD này.

### Tay — `.\harness\hub\run-hub.ps1` → http://127.0.0.1:8799
1. Mở `code-task`, chưa chạy gì → run log chỉ còn thanh tiêu đề, canvas cao gần hết.
2. Bấm Run → drawer tự mở, node đang chạy có pulse.
3. Sidebar: chuyển tab Workflows ↔ Components, mỗi lúc chỉ một ô search.
4. Không còn chữ nào dưới 12px trong trang (kiểm bằng DevTools computed font-size).
5. Sang Run mode: thử kéo node → không di chuyển; thử xoá → không có nút.
6. Về Design mode: kéo, thêm, xoá bình thường.
7. Xoá một node ở giữa chuỗi → `Ctrl+Z` → node, hai edge và vị trí quay lại đúng.
8. `Shift+drag` bao hai node → kéo một trong hai → cả hai đi cùng.
9. Gõ `{{` trong prompt → danh sách hiện, chọn `{{brief_output}}` → chèn đúng chỗ con trỏ.
10. Sửa prompt thành biến không tồn tại → node hiện viền error trên canvas, Inspector nói rõ lý do.
11. Workflow ≥5 node → minimap hiện; bấm góc minimap → viewport nhảy tới.
12. Save một workflow rồi `git diff harness/hub/workflows/` → chỉ có reflow YAML; đối chiếu từng giá trị `gate`, `agent`, `prompt` phải khớp bản gốc.

### Regression
13. Kéo thả từ palette vẫn rơi đúng con trỏ ở zoom 0.5 / 1.0 / 1.8 (bug đã sửa ở BD1, đừng làm hỏng lại).
14. Thả lên edge vẫn chèn node vào giữa.
15. Gate `approval` vẫn dừng và Approve vẫn tiếp.
16. Đổi qua lại hai workflow → layout không nhảy.

---

## 8. Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| B2 đổi card làm lệch điểm nối edge và offset thả | Bất biến #2: đo DOM, cập nhật `size` cùng commit, chạy lại regression 13–14 |
| B4 undo/redo đánh nhau với effect nạp layout theo `selectedId` | Xoá stack khi đổi workflow; đọc comment dòng 50–55 trước khi sửa |
| Port nhỏ + hover-reveal làm mất khả năng dùng bàn phím | Bất biến #6: reveal cả trên `:focus-visible`, vùng bấm ≥24px; test tay bước 5 |
| B1 khoá canvas ở Run mode làm người dùng tưởng UI hỏng | Hiện hint giải thích ngay trên canvas khi ở Run mode |
| Multi-select đụng cử chỉ pan | Giữ kéo-trống = pan, marquee dùng `Shift`; không đổi thói quen đang có |
| Đổi nhãn vô tình đổi giá trị lưu xuống YAML | Step 2 có gate `git diff` trống |
