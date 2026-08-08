# BD — Sidebar: một nút đóng/mở, đóng thì chỉ còn icon

**Date:** 2026-08-09 · **Status:** 📋 Chờ thực thi · **Author:** Claude (Opus 5)
**Branch:** `claude/workflow-canvas-drag-drop-35308b` · **Giao cho:** Codex. Claude review.

---

## 0. Yêu cầu người dùng

> "tìm hiểu cách thiết kế sidebar, cho 1 nút đóng mở, đóng thì chỉ hiện icon"

Một nút toggle duy nhất, hoạt động ở mọi khổ màn hình. Trạng thái đóng = thanh
icon dọc, không nhãn, không đè lên nội dung.

---

## 1. Số đo hiện tại — đo trong trình duyệt, không suy đoán

Viewport 1400px, sidebar ở trạng thái `sidebar-collapsed`:

| Đối tượng | Đo được | Đúng ra phải là |
|---|---|---|
| `.app` cột 1 | 48px | 48px ✓ |
| `aside` clientWidth | **37px** | 48px |
| `.sidebar-collapse` | left **−1.4px**, width **40px** | nằm trong rail, 32px |
| icon nav (svg) | 9.6 → 27.6, tâm **18.6** | tâm 24 |
| logo | 1.6 → 35.6, width 34px | căn giữa rail |

Ba nguyên nhân độc lập:

1. **`scrollbar-gutter: stable`** trên `.app > aside` ([index.css:99](../web-v3/src/index.css#L99))
   giữ chỗ ~11px cho thanh cuộn. Cộng `padding: 6px` mỗi bên còn **37px** cho nội dung
   trong rail 48px. Mọi thứ bị đẩy lệch trái ~5px.
2. **`button { min-width: 40px }`** ([index.css:85](../web-v3/src/index.css#L85)) là
   selector element không nằm trong layer, nên thắng `.sidebar-collapse { width: 32px }`.
   Nút 40px trong hộp 37px ⇒ tràn ra **ngoài mép trái viewport**.
3. Rail chỉ tồn tại từ **1280px trở lên**. Dưới ngưỡng đó
   ([index.css:194](../web-v3/src/index.css#L194)) có `.app > aside .sidebar-collapse { display: none }`
   — nút toggle biến mất, sidebar chuyển thành drawer phủ lên canvas. Đúng cái ảnh
   người dùng gửi kèm.

---

## 2. Việc cần làm

### 2.1 Rail 48px phải chứa đủ nội dung

Trong `.app.sidebar-collapsed > aside`:

- `scrollbar-gutter: auto` (rail không cần chừa chỗ cuộn)
- `padding-left: 0; padding-right: 0`
- căn giữa theo chiều ngang cho logo, nút toggle và mọi `a.nav-item`

Kỳ vọng sau khi sửa, đo ở 1400px:

- `aside` clientWidth = 48
- tâm icon nav = 24 ± 1
- `.sidebar-collapse` left ≥ 0, right ≤ 48

### 2.2 Nút toggle không được tràn

Thêm `min-width` rõ ràng cho `.sidebar-collapse` để thắng luật `button` toàn cục.
**Không** sửa `button { min-width: 40px }` — luật đó đang giữ vùng bấm 40px cho
toàn app, đổi nó là thay đổi ngoài phạm vi.

### 2.3 Một nút toggle cho mọi khổ

Hạ ngưỡng drawer từ `1279px` xuống `639px`.

Lý do: rail chỉ tốn 48px. Với sàn workspace 360px (xem
[BD-responsive-invariant.md](BD-responsive-invariant.md)), rail + workspace vừa
đủ từ 408px. Không có lý do gì để chuyển sang drawer ở 1279px.

Cụ thể trong `@media (max-width: 1279px)` ở [index.css:194](../web-v3/src/index.css#L194):

- phần liên quan tới `.app`, `.app > aside`, `.app-drawer-scrim`,
  `.topbar-nav-toggle` chuyển sang `@media (max-width: 639px)`
- phần liên quan tới `.cw-*` (trang Chat) **giữ nguyên ở 1279px** — đó là layout
  ba cột của Chat, không liên quan
- `.app > aside .sidebar-collapse { display: none }` bỏ hẳn: nút phải luôn hiện
  khi sidebar còn là cột của grid

`@media (max-width: 1279px) { .sidebar-resizer { display: none } }` ở
[index.css:137](../web-v3/src/index.css#L137) cũng hạ xuống 639px — kéo dãn được
thì phải kéo được ở 1024px.

### 2.4 Kỳ vọng theo khổ sau khi sửa

| Viewport | Trạng thái mở | Trạng thái đóng |
|---|---|---|
| 1600 | cột 240px, có nút, có resizer | rail 48px, có nút |
| 1024 | cột 240px, có nút, có resizer | rail 48px, có nút |
| 700 | cột 240px, có nút | rail 48px, có nút |
| 600 | drawer, `topbar-nav-toggle` hiện | drawer |

Ở mọi khổ: `document.documentElement.scrollWidth <= window.innerWidth`.

---

## 3. Sửa luôn ba lỗi của đợt responsive vừa rồi

Cùng vùng code, làm chung một lần.

### 3.1 `data-workspace` không bao giờ được gắn lên canvas

[WorkflowsPage.tsx](../web-v3/src/pages/WorkflowsPage.tsx) đang gắn bằng effect:

```tsx
useEffect(() => {
  if (!canvasRef.current) return
  canvasRef.current.dataset.workspace = '360'
  canvasRef.current.dataset.regionName = 'workflow canvas'
}, [])
```

Effect chạy một lần lúc mount. Lúc đó `selected` chưa có nên component return
sớm ở nhánh khác, `canvasRef.current` là `null`, và deps rỗng nên không bao giờ
chạy lại. Đo thực tế ở 1600px: chỉ có **một** phần tử `[data-workspace]` trong
DOM, là `section.content` rộng 1552px, trong khi canvas chỉ 928px. Bất biến đang
canh sai đối tượng.

Sửa: bỏ effect, đặt thẳng thuộc tính trên JSX của `<section ref={canvasRef}>`:

```tsx
data-workspace="360" data-region-name="workflow canvas"
```

Đây cũng là nguyên tắc chung: **không điều khiển DOM bằng effect khi JSX làm được**.

### 3.2 Assertion báo nhầm mọi node nằm ngoài khung nhìn

Chạy dev server ở 820px, console đầy:

```
[responsive-invariant] route=/workflows region="Node brief" clipped-by="" measured=outside expected=inside-scroll-container
```

Canvas có pan/zoom — node nằm ngoài khung nhìn là **đúng thiết kế**, không phải lỗi.
Phép kiểm phần tử tương tác trong
[responsiveInvariant.ts](../web-v3/src/lib/responsiveInvariant.ts) phải bỏ qua
mọi phần tử nằm trong bề mặt pan/zoom.

Cách làm: đánh dấu bề mặt đó (ví dụ `data-viewport-surface`) và trong
`assertResponsiveInvariants` bỏ qua phần tử nào có `element.closest('[data-viewport-surface]')`.
Đặt dấu trên lớp có `transform` của canvas, không phải trên `section` bao ngoài —
toolbar và minimap vẫn phải được kiểm.

Kỳ vọng: mở `/workflows` ở 1600 / 1280 / 1024 / 820 ⇒ **zero** dòng
`[responsive-invariant]` trong console.

### 3.3 `regionName` trả về chuỗi rỗng

```ts
return element.getAttribute('data-region-name')
  ?? element.getAttribute('aria-label')
  ?? element.id
  ?? element.classList.item(0)
  ?? element.tagName.toLowerCase()
```

`element.id` là `''` (không phải `null`) khi phần tử không có id, mà `??` chỉ bỏ
qua `null`/`undefined`. Nên chuỗi rỗng thắng và thông báo in ra `clipped-by=""`.
Đổi `??` thành `||`.

---

## 4. Ràng buộc

- **Không đổi logic, state, routing, API, nội dung chữ.** Đây là bố cục.
- **Không thêm dependency.** Không sửa `.py`.
- **Không chạy lệnh git** — Claude commit.
- **Không dùng `document.querySelector` / `classList` / `dataset` trong effect để
  điều khiển giao diện React.** Dùng JSX và state.
- **Toàn vẹn ký tự:** đếm ký tự phi-ASCII theo code point trước và sau ở mọi file
  chạm vào, báo cả hai số. Đọc/ghi UTF-8. `→` trong `edgeKey` của `WorkflowsPage.tsx`
  là ký tự **chức năng**, không được đổi. `check-encoding.mjs` không bắt được
  trường hợp ký tự bị ghi thành `?` vì `?` là ASCII hợp lệ.

---

## 5. Verify

```bash
cd harness/hub/web-v3 && node scripts/check-encoding.mjs && pnpm lint && pnpm exec tsc -b && pnpm build
```

Bốn lệnh xanh, `pnpm lint` **zero warning**.

Báo lại kèm số đo:

1. `aside` clientWidth ở trạng thái đóng, tại 1600 / 1024 / 700
2. `.sidebar-collapse` left/right tại 1600 và 700
3. tâm icon nav so với tâm rail
4. `scrollWidth` vs `innerWidth` tại 1600 / 1280 / 1024 / 820 / 600
5. số dòng `[responsive-invariant]` trong console dev tại 4 khổ (phải là 0)
6. số phần tử `[data-workspace]` trong DOM trên `/workflows` và bề rộng từng cái
7. đếm ký tự phi-ASCII trước/sau theo từng file
