# BD — Đặt lỗi ở nơi người dùng sửa được

**Date:** 2026-08-09 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b` · **Giao cho:** Codex. Claude review.
**Chạy sau:** [BD-sidebar-rail.md](BD-sidebar-rail.md) — hai bản cùng sửa `WorkflowsPage.tsx`.

---

## 0. Nguyên tắc

Lỗi cấu trúc workflow thuộc về canvas. Lỗi node thuộc về node và Inspector.
Lỗi lúc chạy thuộc về Run Log. Chỉ lỗi toàn ứng dụng mới được dùng banner toàn trang.

Giữ nguyên design system dark-navy + cyan. **Không** thiết kế lại Workflow Editor.
**Không** đổi điều gì làm một workflow hợp lệ hay không — chỉ đổi cách báo cáo.

---

## 1. Hiện trạng — trích từ code

### 1.1 Banner chạy ngang toàn trang

[WorkflowsPage.tsx:147](../web-v3/src/pages/WorkflowsPage.tsx#L147):

```tsx
{(notice || errors.length > 0 || !linear) && <Alert variant={...} className="mx-4 mt-3">
  {notice || (linear ? t('workflows.invalid') : t('workflows.linearOnly'))}
  {errors.length > 0 && <ul>...</ul>}
</Alert>}
```

`Alert` này nằm **giữa `<header>` và `.workflow-grid`**, nên nó rộng bằng cả trang và
đẩy sidebar, canvas, inspector cùng tụt xuống. Vi phạm §1 và §2 của yêu cầu.
Ba `Alert` liên tiếp (`notice`, `hint`, `workspaceOutsideRoot`) đều ở vị trí này.

### 1.2 Bốn nguồn dữ liệu lỗi đã có sẵn

| Nguồn | Kiểu | Đã quy được về node/edge? |
|---|---|---|
| `errors` — từ `POST /validate` | `string[]` | **Không** |
| `linear` — [isLinearChain](../web-v3/src/pages/WorkflowsPage.tsx#L47) | `boolean` | **Không**, nhưng tính được |
| `refs` — [refErrors](../web-v3/src/pages/WorkflowsPage.tsx#L48) | `Map<nodeId, RefError[]>` | **Có** |
| `alerts` — sự kiện `error` / `validation_fail` của run | mảng event có `node` | **Có** |

`refs` đã được truyền vào `Inspector` qua prop `errors` — tầng chi tiết đã có một nửa.

### 1.3 Câu chữ hiện tại

`t('workflows.linearOnly')` là câu dài:

> "The canvas supports only linear chains; current edges have branches, loops, or disconnected nodes."

Nó nằm ngay trên canvas làm mặc định. Vi phạm §14.

---

## 2. Việc cần làm

### 2.1 `isLinearChain` trả về danh sách issue thay vì `boolean`

Đây là phần logic duy nhất được đụng tới, và nó **không đổi kết quả hợp lệ/không hợp lệ**:
hàm hiện tại đã tính đủ mọi thứ cần thiết rồi vứt đi, chỉ giữ lại `true`/`false`.

Đổi thành hàm trả `StructureIssue[]`, rỗng nghĩa là hợp lệ. `linear` cũ trở thành
`issues.length === 0`. Mỗi issue có:

```ts
type StructureIssue = {
  kind: 'branch' | 'cycle' | 'disconnected' | 'merge' | 'self-edge' | 'dangling-edge'
  nodeId?: string
  edgeKey?: string
  titleKey: string   // khoá i18n cho dòng tiêu đề ngắn
  detailKey: string  // khoá i18n cho câu giải thích
}
```

Ánh xạ từ các nhánh `return false` hiện có:

| Nhánh trong `isLinearChain` | `kind` | Gắn vào |
|---|---|---|
| `outgoing.get(from) > 1` | `branch` | node `from` |
| `incoming.get(to) > 1` | `merge` | node `to` |
| `from === to` | `self-edge` | edge |
| node của edge không tồn tại | `dangling-edge` | edge |
| không tìm được `start` (mọi node đều có incoming) | `cycle` | các node trong vòng |
| `visited.size !== nodes.length` | `disconnected` | node không nằm trong `visited` |

`errors` từ server vẫn là chuỗi không quy được về node — giữ nguyên, hiển thị trong
panel Issues như issue không có vị trí. **Không đoán** node từ nội dung chuỗi.

### 2.2 Validation bar nằm trong canvas

Bỏ `!linear` và `errors` khỏi `Alert` toàn trang. `notice` (kết quả lưu, lỗi API) và
`workspaceOutsideRoot` **ở lại** vị trí cũ — đó là tầng ứng dụng, đúng §4 level 4.

Thanh mới đặt ngay dưới `Toolbar` của canvas và ngay trên `<section ref={canvasRef}>`,
bên trong `<main>`, nên chỉ rộng bằng cột canvas.

Thông số: cao 32–36px, nền amber ~8% alpha, viền 1px amber muted, bo 6–8px,
padding 8–12px, chữ 12–13px, icon cảnh báo 14–16px. Không shadow, không glow,
không nền amber đặc. Trọng lượng thị giác phải thấp hơn graph.

Nội dung: `⚠ Workflow invalid · 3 issues` bên trái, `View issues ›` bên phải.

Khi hợp lệ: thanh **biến mất hoàn toàn**, canvas lấy lại chiều cao. Không có
success bar thường trú.

### 2.3 Thu gọn theo bề rộng, không xuống dòng

Dùng container query như [BD-responsive-invariant.md](BD-responsive-invariant.md)
đã làm, **không** dùng `@media` — cột canvas co theo sidebar kéo dãn được, viewport
không nói lên điều gì.

| Bề rộng cột canvas | Nội dung |
|---|---|
| rộng | `⚠ Workflow invalid · 3 issues` … `View issues ›` |
| vừa | `⚠ 3 workflow issues` … `View ›` |
| hẹp | `⚠ 3 issues` … `›` |

Thanh luôn một dòng.

### 2.4 Nút Check workflow phản ánh số issue

[WorkflowsPage.tsx:147](../web-v3/src/pages/WorkflowsPage.tsx#L147) đang là
`<Button variant="ghost" onClick={() => void validate()}>`.

- chưa check: `Check workflow`
- check xong, hợp lệ: `✓ Valid` (hoặc giữ nhãn cũ + phản hồi thành công ngắn)
- có lỗi: `⚠ 3 issues`, dùng **amber semantic**, không dùng cyan

Bấm nút này và bấm `View issues ›` phải mở **cùng một** panel. Không tạo hai nguồn
issue độc lập.

Sau khi người dùng sửa workflow, `checked` đã được reset sẵn ở code hiện tại —
trạng thái quay về `Not checked`, không được hiển thị kết quả cũ như thể còn đúng.

### 2.5 Panel Issues

Popover neo vào `View issues ›`. Mỗi dòng gồm: loại issue, đối tượng liên quan,
một câu giải thích ngắn. Ví dụ:

```
Workflow validation · 3 issues

⚠ Branch after "Analyzer"
  Multiple outgoing edges are not supported.

⚠ Loop involving "Reviewer"
  A linear workflow cannot contain cycles.

⚠ "Validator" is disconnected
  Connect this node to the execution chain.
```

Cả dòng bấm được. Dùng primitive `Popover` sẵn có trong
[lib/ui.tsx](../web-v3/src/lib/ui.tsx), không dựng popover mới.

### 2.6 Bấm issue thì canvas nhảy tới

Bấm một issue:

1. pan canvas tới node/edge liên quan (đã có `setPan`, và `Minimap` dùng `onJump`)
2. chọn đối tượng (`setSelectedIds` / `setEdge`)
3. highlight ngắn (~1.2s) rồi tắt
4. mở Inspector nếu đang đóng

Issue không quy được về đối tượng (chuỗi từ server) thì chỉ chọn được, không pan.

### 2.7 Marker trên node và edge

Node có issue: chấm hoặc tam giác amber nhỏ ở góc trên phải hoặc cạnh status
indicator, **không đè lên tiêu đề node**. Node vẫn nền dark/navy — không tô cả node
thành amber. Viền có thể chuyển sang trạng thái warning nhẹ.

Edge có issue: stroke amber, dày hơn edge thường một chút. Các edge còn lại **giữ
nguyên cyan**.

Marker phải có nhãn cho trình đọc màn hình.

### 2.8 Inspector

Khi đối tượng đang chọn có issue, hiển thị mục `VALIDATION` **gần phần cấu hình liên
quan**, không chôn ở cuối panel. Không có issue thì không hiển thị mục rỗng.

`Inspector` đã nhận prop `errors` (chính là `refs`); mở rộng để nhận thêm các
`StructureIssue` gắn vào node/edge đó.

### 2.9 Không lặp lại nguyên câu lỗi

| Tầng | Nhiệm vụ |
|---|---|
| Header | số lượng / trạng thái |
| Canvas bar | tóm tắt |
| Node / edge | vị trí |
| Inspector | chi tiết + ngữ cảnh sửa |
| Run Log | lỗi lúc chạy |

Câu dài `t('workflows.linearOnly')` chỉ còn xuất hiện trong panel Issues như phần
giải thích, không phải nhãn mặc định trên canvas.

### 2.10 Chặn Run

Nếu issue làm workflow không chạy được, `Run` disabled theo logic hiện tại. Người
dùng vẫn cố chạy thì **không** mở modal chung: focus validation bar, mở panel Issues,
chọn issue đầu tiên. Thông báo ngắn: `Resolve 3 workflow issues before running.`

### 2.11 Inspector rỗng

Không chọn gì thì Inspector chỉ hiện một dòng nhẹ `Select a node or edge to inspect.`
Không artwork, không icon lớn.

---

## 3. Màu semantic

| Màu | Ý nghĩa |
|---|---|
| cyan | selected / focus / tương tác / connection |
| green | ready / valid |
| amber | warning / validation issue / chờ duyệt |
| red | chạy thất bại / phá huỷ / lỗi hệ thống chặn |

Không dùng amber cho UI workflow bình thường. Không dùng cyan cho lỗi validation.

Trạng thái validation không được chỉ dựa vào màu: phải có icon + chữ. `View issues`
và từng dòng issue phải tới được bằng bàn phím.

---

## 4. Ràng buộc

- **Không đổi** điều kiện hợp lệ của workflow, routing, API, schema.
- **Không thêm dependency.** Không sửa `.py`.
- **Không chạy lệnh git** — Claude commit.
- Mọi chuỗi hiển thị đi qua `t()` trong [lib/i18n](../web-v3/src/lib/i18n.ts), không
  hardcode tiếng Anh trong JSX.
- Dùng primitive sẵn có trong `lib/ui.tsx` (`Popover`, `Button`, `Alert`, `Chip`,
  `Status`); không dựng component trùng chức năng.
- **Không** dùng effect để set `dataset`/`classList` điều khiển giao diện — dùng JSX.
- **Toàn vẹn ký tự:** đếm ký tự phi-ASCII theo code point trước và sau ở mọi file chạm
  vào, báo cả hai số. Đọc/ghi UTF-8. `→` trong `edgeKey` của `WorkflowsPage.tsx` là ký
  tự **chức năng**. `check-encoding.mjs` không bắt được ký tự bị ghi thành `?`.
- `const size = { width: 220, height: 105 }` trong `WorkflowsPage.tsx` là giá trị **đo
  được**, không phải suy ra. Lệch số này là lệch đầu mút edge, mũi tên và điểm thả.

---

## 5. Verify

```bash
cd harness/hub/web-v3 && node scripts/check-encoding.mjs && pnpm lint && pnpm exec tsc -b && pnpm build
```

Bốn lệnh xanh, lint **zero warning**.

Kiểm bằng workflow `code-task` (9 node, 7 connection, hiện đang không linear):

1. banner validation **không** còn chạy ngang toàn trang
2. sidebar và inspector **không** dịch chuyển khi validation state đổi
3. thanh trong canvas cao ≤ 36px — báo số đo `getBoundingClientRect().height`
4. `Check workflow` hiện đúng số issue
5. `View issues` mở danh sách; số dòng khớp số trên nút
6. bấm một issue: pan tới đúng node, node được chọn, Inspector mở
7. node và edge có issue mang marker; các edge khác vẫn cyan
8. sửa cho workflow hợp lệ ⇒ thanh biến mất hoàn toàn
9. runtime error vẫn nằm ở Run Log, không trộn vào validation
10. đo ở ba bề rộng cột canvas: thanh không xuống dòng, copy rút gọn đúng bậc

Regression canvas (đang chạy đúng trước đợt này):

- thả agent từ palette sau khi bấm Fit canvas ⇒ card rơi đúng con trỏ
- thả lên edge ⇒ node chèn vào giữa
- shift-click hai node rồi kéo một ⇒ cả hai cùng đi
- xoá tập đang chọn rồi Ctrl+Z ⇒ phục hồi đủ node, edge, vị trí
- sang Run mode ⇒ kéo và mũi tên vô hiệu, port biến mất
- mở `remotion-render` ⇒ 5 node, minimap hiện

---

## 6. Báo lại

- `isLinearChain` trả gì, ánh xạ từng nhánh `return false` sang `kind` nào
- Thanh validation đặt ở đâu trong cây JSX, số đo chiều cao
- Ngưỡng container query cho ba bậc copy
- Kết quả từng mục 1–10 và từng mục regression
- Đếm ký tự phi-ASCII trước/sau theo file
