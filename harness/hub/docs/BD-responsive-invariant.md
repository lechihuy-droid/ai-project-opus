# BD — Bảo vệ vùng làm việc khi hẹp, và một luật kiểm cho mọi trang

**Date:** 2026-08-07 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b`
**Giao cho:** Sonnet subagent. Claude review.

---

## 0. Bug — đo thật, không suy đoán

Trang Workflows ở khổ hẹp bóp vùng canvas thành dải mỏng, node bị cắt.

| Viewport | Cột của grid trang | Canvas | Node bị cắt |
|---|---|---|---|
| 993px | `617px 320px` | 617px | 0/3 |
| 820px | `468px 320px` | 468px | **1/3** |
| ~495px (đo ở đợt trước) | `248px 0px 320px` | **0px** | toàn bộ |

Nguyên nhân nằm ở khai báo grid trong `src/pages/WorkflowsPage.tsx`:

```
grid-cols-[248px_minmax(0,1fr)_320px]
```

Sidebar `248px` và inspector `320px` là **track cứng**; vùng làm việc là `minmax(0,1fr)` — cận dưới **bằng 0**. Khi thiếu chỗ, thứ bị bóp đầu tiên chính là thứ quan trọng nhất.

`DESIGN.md` §15 đã quy định ngược lại: *"Ở viewport nhỏ: collapse inspector trước, reduce sidebar nếu cần, bảo vệ workspace cuối cùng."* Code chưa thực hiện điều đó.

### Đã có sẵn một chỗ làm đúng — dùng làm khuôn

`src/index.css:144`:

```css
.cw-body { grid-template-columns: 280px minmax(640px, 1fr); }
```

Trang Chat đặt **cận dưới 640px** cho vùng hội thoại, nên nó không bao giờ bị bóp. Đây chính là mẫu cần nhân rộng, không phải phát minh gì mới.

### Các grid khác cần rà

- `.app` (`src/index.css`): `var(--hub-sidebar-width, 240px) minmax(0, 1fr)` — cận dưới 0.
- `.app.sidebar-collapsed`: `48px minmax(0, 1fr)` — cận dưới 0.
- `WorkflowsPage.tsx`: 5 biến thể `grid-cols-[...]`, xem `grep -o "grid-cols-\[[^]]*\]"`.

---

## 1. Bất biến cần viết thành số

Thêm vào `DESIGN.md` §15, thay cho mô tả bằng lời:

1. **Vùng làm việc chính không bao giờ dưới 360px.** Canvas workflow, khung hội thoại Chat, bảng dữ liệu ở trang CRUD đều tính là vùng làm việc.
2. **Thứ tự nhường chỗ:** inspector thu trước → sidebar thu → sidebar ẩn thành drawer → **vùng làm việc không bao giờ bị thu**.
3. **Không bao giờ tràn ngang.** `document.documentElement.scrollWidth` không được vượt `window.innerWidth`.
4. **Không phần tử tương tác nào bị cắt** khỏi container cuộn của nó.

---

## 2. Đo theo container, KHÔNG theo viewport

Đây là chỗ dễ làm sai nhất và là lý do bản BD này tồn tại.

Sidebar điều hướng của app **kéo dãn được** trong khoảng 180–420px (`--hub-sidebar-width`, lưu ở localStorage, xem `src/components/Layout.tsx`). Người dùng kéo rộng ra thì chỗ trống còn lại cho trang giảm đi, **nhưng `window.innerWidth` không đổi**.

Hệ quả: mọi `@media (max-width: …)` đều nói dối. Một máy 1440px với sidebar 420px chỉ còn 1020px cho nội dung, nhưng media query vẫn tưởng là 1440px.

**Bắt buộc:** dùng `ResizeObserver` trên phần tử shell của trang, hoặc CSS container query (`container-type: inline-size` + `@container`). Tailwind v4 hỗ trợ container query sẵn, không cần thêm dependency. Nếu chọn container query thì nói rõ đã đặt `container-type` ở đâu.

---

## 3. Luật kiểm áp cho MỌI trang

Không rà tay từng màn. Dựng một cơ chế, ba phần:

### 3.1 Registry khai báo

Mỗi trang đánh dấu vùng của nó bằng thuộc tính dữ liệu:

- `data-workspace="360"` — vùng phải bảo vệ, kèm chiều rộng tối thiểu
- `data-collapsible="1"` / `="2"` — thứ tự nhường chỗ, số nhỏ nhường trước

Không có registry thì mỗi trang lại là một luật riêng, đúng thứ §32 của spec cấm.

### 3.2 Assertion chỉ chạy ở dev

Một hàm gắn vào `ResizeObserver`, chạy khi `import.meta.env.DEV`, **không vào bundle production**. Mỗi lần kích thước đổi thì quét registry và `console.error` khi:

- một `data-workspace` tụt dưới ngưỡng khai báo
- `documentElement.scrollWidth > innerWidth`
- một phần tử có `role="button"`, `<button>`, `<a>` hoặc `<input>` nằm ngoài biên container cuộn của nó

Thông báo phải nêu tên route, tên vùng, số đo được và số kỳ vọng.

### 3.3 Ma trận quét thủ công

21 route × 7 khổ: 1600, 1440, 1280, 1150, 1024, 900, 820.

Chạy bằng công cụ trình duyệt sẵn có. **Không thêm Playwright hay bất kỳ test runner nào** — repo chỉ có `react`, `react-dom`, `react-router-dom`, `lucide-react`, và không có test runner frontend. Ghi kết quả thành bảng route × khổ, đánh dấu chỗ vi phạm.

---

## 4. Ràng buộc

- **Không đổi logic, state, routing, API call, thứ tự dữ liệu, nội dung chữ.** Đây là bài toán bố cục.
- **Không thêm dependency.**
- **Không sửa `.py`.**
- **Không chạy lệnh git** — Claude commit.
- `src/index.css` sửa được ở đợt này, nhưng **cẩn thận**: file đó từng có `button { font: inherit; color: inherit }` nằm ngoài layer, thắng mọi utility Tailwind, khiến nút primary có tương phản ~1.5:1 và mọi nhãn nút dính 14px thay vì 13px. Selector element không-layer ở file này là nguy hiểm.
- **Toàn vẹn ký tự:** một đợt trước đã ghi mọi `·` (U+00B7) thành `?`. `check-encoding.mjs` không bắt được vì `?` là ASCII hợp lệ. Đếm ký tự phi-ASCII theo code point trước và sau ở mọi file chạm vào, báo cả hai số. Đọc/ghi UTF-8. Dấu `→` trong `edgeKey` của `WorkflowsPage.tsx` là ký tự **chức năng**.

---

## 5. Verify

```bash
cd harness/hub/web-v3 && node scripts/check-encoding.mjs && pnpm lint && pnpm exec tsc -b && pnpm build
```

Bốn lệnh phải xanh, `pnpm lint` giữ **zero warning**.

Sau đó chạy app ở `http://127.0.0.1:8799` bằng công cụ preview của trình duyệt, **không dùng Bash**. Lưu ý `/api/providers` trả 500 trên máy này — bug backend có sẵn, không liên quan; stub trong trình duyệt nếu trang cần.

Regression bắt buộc trên trang Workflows, tất cả đều đang chạy đúng trước đợt này:

- thả agent từ palette sau khi bấm Fit canvas → card rơi đúng con trỏ
- thả lên edge → node chèn vào giữa hai đầu
- shift-click hai node rồi kéo một → cả hai cùng đi
- xoá tập đang chọn rồi một lần Ctrl+Z → phục hồi đủ node, edge, vị trí
- sang Run mode → kéo và mũi tên vô hiệu, port biến mất
- mở `remotion-render` → 5 node, minimap hiện

Và trên Chat: ba khổ 1400 / 1150 / 850 vẫn đúng như trước.

---

## 6. Báo lại

- Grid nào đổi thành gì, kèm số đo trước và sau ở từng khổ
- Đặt `container-type` / `ResizeObserver` ở đâu và tại sao chọn cách đó
- Registry đánh dấu những vùng nào trên trang nào
- Bảng ma trận 21 route × 7 khổ, nêu rõ chỗ nào còn vi phạm và tại sao chưa sửa
- Số đếm ký tự phi-ASCII trước/sau theo từng file
- Kết quả từng mục trong checklist regression
