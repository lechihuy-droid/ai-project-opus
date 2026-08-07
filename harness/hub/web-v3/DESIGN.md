# DESIGN.md — Harness Hub web-v3

Tài liệu này là **hợp đồng cho coding agent**: đọc xong là làm được migration mà không cần xem lại bản review gốc. Token, tên component, class string đều giữ nguyên tiếng Anh để agent copy-paste chính xác; phần giải thích viết tiếng Việt.

> **2026-08 redesign.** Bảng màu đổi từ *dark workbench + violet* sang **dark-navy + cyan**, kích thước control giảm ~25% (control chuẩn 40px → 32px). Mục 1–4 dưới đây phản ánh trạng thái hiện tại (đã áp dụng trong `tokens.css` / `index.css` / `ui.tsx`). Mục 5–7 giữ lại lịch sử migration cũ, chỉ sửa những chỗ giá trị màu/kích thước đã đổi.

## 1. Định hướng thị giác (3-4 câu)

Hướng thiết kế là **compact desktop productivity** — dày đặc thông tin nhưng gọn (Linear/Figma/GitHub Desktop/IDE toolbar), không phải mobile, không gaming, không neon cyberpunk. Mỗi vùng màn hình (region) chỉ có **một hành động chính** (primary button) — mọi hành động khác là secondary/ghost. Màu **cyan** (`--hub-accent`) là màu hành động/chọn lựa/focus duy nhất trong toàn bộ control system; màu provider (claude/codex/nvidia) chỉ còn vai trò **chấm nhận diện 6-8px**, không tô màu nút, điều hướng, selection hay chữ nội dung. Bốn cấp bề mặt (app/sidebar-surface/elevated/hover) tạo phân tầng thị giác rõ.

## 2. Bảng token (tokens.css)

File: `src/styles/tokens.css`, mirror sang Tailwind `@theme` trong `src/index.css` (`--hub-*` ↔ `--color-*`/`--radius-*`/`--spacing-*`/`--text-*`). Cả hai file phải đổi cùng lúc khi một giá trị đổi — không có script tự sync, sửa tay.

### Surfaces

| Token | Giá trị cũ | Giá trị mới | Vai trò |
|---|---|---|---|
| `--hub-bg-app` | `#0d1016` | **`#0b1018`** | nền toàn app |
| `--hub-bg-sidebar` | `#141821` | **`#111827`** | sidebar + topbar (palette gọi là "panel background") |
| `--hub-bg-surface` | `#11151c` | **`#111827`** | pane / card — dùng chung giá trị với sidebar (palette chỉ cho 1 giá trị "panel background" cho cả hai vai trò; xem "Quyết định hợp nhất surface" bên dưới) |
| `--hub-bg-elevated` | `#1a202b` | **`#162033`** | modal / dropdown / menu / nền input ("elevated surface") |
| `--hub-bg-hover` | `#202734` | **`#1a2436`** | hover row/item/button — **không có trong palette gốc**, suy ra nằm giữa elevated và border-hover; xem quyết định bên dưới |
| `--hub-border-subtle` | `#262d39` | **`#2b3952`** | border mặc định ("border default") |
| `--hub-border-strong` | `#343d4c` | **`#3d5877`** | border nhấn mạnh — **dùng chung giá trị với "border hover"** của palette gốc; xem quyết định bên dưới |

**Quyết định hợp nhất surface:** palette user cung cấp chỉ có 3 mức bề mặt tên riêng (app / panel / elevated), nhưng hệ thống cũ có 4 mức (app/sidebar/surface/elevated) để tách vai trò "thanh điều hướng" khỏi "nội dung pane". Quyết định: giữ 4 token (không xoá `--hub-bg-surface` để tránh phải sửa mọi chỗ đang dùng `bg-surface`), nhưng cho `--hub-bg-sidebar` và `--hub-bg-surface` **cùng giá trị** `#111827` — đúng tinh thần "panel background" là một màu duy nhất, trong khi vẫn giữ được 2 class riêng biệt (`bg-sidebar`, `bg-surface`) cho khả năng tách lại sau này nếu cần.

**Quyết định `--hub-bg-hover`:** palette không liệt kê hover-surface riêng. Chọn `#1a2436` — một bước sáng hơn `elevated` (`#162033`), tối hơn `border-hover` (`#3d5877`) — để hover vẫn đọc được là "sáng hơn nền xung quanh" mà không cạnh tranh với border cyan hay border-hover.

**Quyết định hợp nhất border:** palette tách "border default" và "border hover" thành 2 giá trị, nhưng hệ thống cũ chỉ có "subtle" (mặc định) và "strong" (nhấn mạnh — dùng cho cả divider đậm lẫn "outline trước focus"). Hai khái niệm "border nhấn mạnh" và "border khi hover" về bản chất cùng một vai trò (viền nổi bật hơn mức mặc định), nên `--hub-border-strong` nhận thẳng giá trị "border hover" (`#3d5877`) và phục vụ cả hai vai trò — không thêm token thứ 3 (giữ đúng "chỉ 4 token radius / N token border" theo tinh thần tối giản của tài liệu này).

### Text

| Token | Giá trị cũ | Giá trị mới |
|---|---|---|
| `--hub-text-primary` | `#eef2f8` | **`#f3f7fc`** |
| `--hub-text-secondary` | `#9ba7b8` | **`#9aaac0`** |
| `--hub-text-muted` | `#667085` | **`#9aaac0`** (== secondary, xem "Quyết định contrast" bên dưới) |
| `--hub-text-disabled` *(mới)* | *(không có)* | **`#536178`** — chỉ dùng cho control disabled |

### Brand accent (cyan, duy nhất)

| Token | Giá trị cũ (violet) | Giá trị mới (cyan) | Dùng cho |
|---|---|---|---|
| `--hub-accent` | `#8b7cf6` | **`#29c7f3`** | selection, focus ring, primary action |
| `--hub-accent-hover` | `#9a8df7` | **`#55d5f7`** | hover trên primary |
| `--hub-accent-pressed` *(mới)* | *(không có)* | **`#16a9d4`** | `:active` trên primary button, active segment nhấn giữ |
| `--hub-accent-subtle` | `rgba(139,124,246,.12)` | **`rgba(41,199,243,.12)`** | nền nhạt khi cần highlight nhẹ (selected row/chip) |

### Semantic

| Token | Giá trị cũ | Giá trị mới |
|---|---|---|
| `--hub-success` | `#3ecf8e` | *(không đổi)* |
| `--hub-warning` | `#f5b942` | *(không đổi — trùng giá trị palette mới)* |
| `--hub-error` | `#f26d6d` | **`#ff657a`** |
| `--hub-info` | `#63a4ff` | *(không đổi — không nằm trong palette mới, giữ nguyên vì không phải violet và không xung đột với "cyan is the only accent" — info badge vẫn cần tách biệt khỏi accent)* |

### Radius / Spacing

Không đổi giá trị (`sm`=6 / `md`=8 / `lg`=12 / `full`=999; spacing 4px grid `space-1..8` = 4/8/12/16/24/32).

### Kích thước cố định — **giảm ~25%, đây là thay đổi chính của đợt redesign này**

| Token | Giá trị cũ | Giá trị mới | Dùng cho |
|---|---|---|---|
| `--hub-size-sidebar-item` | 40px | **40px (không đổi)** | full-width nav row (icon+label), không phải toolbar control nên không chịu trần 32px |
| `--hub-size-toolbar` | 48px | **48px (không đổi)** | thanh header của pane/canvas |
| `--hub-size-control-sm` *(mới)* | — | **30px** | `Button size="sm"`, segment trong SegmentedControl |
| `--hub-size-control-md` *(mới)* | — | **32px** | `Button size="md"` (mặc định), `IconButton` visible box |
| `--hub-size-hit-min` *(mới)* | — | **40px** | sàn hit-area vô hình cho control icon-only vuông |
| `--hub-size-input` | 40px | **36px** | Input / Select |
| `--hub-size-composer-min` | 56px | 56px (không đổi) | textarea composer |

Tỉ lệ chữ/control (áp dụng khi thêm control mới): **13px text → 30-34px control; 14px text → tối đa 36px; 16px icon → 32px button. Không control nào ≥44px trong một toolbar desktop.** Không phải mọi control đều là pill — chỉ Chip/Status/SegmentedControl-track mới dùng `radius-full`/radius lớn, còn lại `radius-md` (8px) hoặc `radius-sm` (6px).

### Contrast decisions

- **Cyan trên nền tối:** `#29c7f3` trên `#0b1018` đạt **~9.9:1**, trên `#111827` đạt **~8.4:1** — vượt xa AA (4.5:1) kể cả cho text nhỏ.
- **`--hub-text-secondary` (`#9aaac0`) trên `--hub-bg-surface` (`#111827`):** **~7.5:1** — pass AA thoải mái, kể cả dùng cho caption 12px.
- **`--hub-text-disabled` (`#536178`) trên `--hub-bg-surface` (`#111827`):** **~2.8:1** — **dưới AA 4.5:1**. Đây là quyết định có chủ đích, không phải sai sót: WCAG 1.4.3 miễn yêu cầu contrast cho *nội dung của control đang inactive/disabled*. Token này **chỉ** được dùng qua `disabled:` state (button/input đã tắt tương tác) — không bao giờ dùng cho text đang có thể đọc/tương tác. Vì lý do này, hệ 4 cấp text cũ (primary/secondary/muted/disabled-ngầm-định-qua-opacity) được gộp lại thành đúng 3 cấp mà palette yêu cầu: primary, secondary (thay luôn vai trò "muted" cũ), disabled.

## 3. Component sizing (`src/lib/ui.tsx`)

### Button

| Prop | Giá trị |
|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `destructive` |
| `size` | `sm` (30px, dùng cho control dày đặc/EmptyState) \| `md` (32px, **mặc định**) \| `list` *(mới)* — `h-auto min-h-[52px]`, dùng cho item chọn được hai dòng (workflow list item) |
| `selected` | viền cyan 1px + nền `accent-subtle`, không đổi chiều cao |
| `icon` | icon 16px, gap 6px với label |
| `loading` *(mới)* | thay `icon` bằng spinner quay (`Loader2` 16px), `aria-busy`, chặn `onClick` — **không** dim bằng `opacity-40` như `disabled` (chỉ disabled thật mới dim) |

Trước đây `sm`/`md` **đều là `h-10` (40px)** — đây chính là nguyên nhân "button quá cao". Đã sửa: `sm` → `h-[30px]`, `md` → `h-8` (32px). Gap icon-text đổi từ `gap-space-2` (8px) sang `gap-[6px]` theo đúng spec.

States đầy đủ cho mỗi variant: `default` / `hover` / `active` (pressed — primary dùng `--hub-accent-pressed`, các variant khác dùng `bg-hover` + đổi border/text) / `focus-visible` (ring cyan 2px, offset 2px) / `disabled` (`opacity-40` + `cursor-not-allowed`) / `loading` (spinner, `cursor-wait`, không dim).

### IconButton — visible 32×32, hit-area 40×40

Xem giải thích đầy đủ trong mục 4 "40×40 hit-area". API không đổi (`icon`, `variant: 'default'|'handle'`, `aria-label` bắt buộc).

### Input / Select / Textarea

Cao 36px (`--spacing-input`, trước là 40px), font đổi từ `text-body` (14px) sang **`text-label` (13px)** theo đúng spec "Inputs: font 13px". Focus đổi từ `:focus` sang `:focus-visible` (ring 2px cyan) để nhất quán với Button — chuột click không còn giữ ring thường trực, chỉ bàn phím mới trigger.

### Chip

Không đổi API. Nút remove (×) thu nhỏ từ 40×40px xuống **18×18px** (`min-w-0` để thoát rule `button{min-width:40px}` toàn cục) — 40px trên một chip cao ~22px sẽ tràn ra ngoài viên chip và đè lên chip lân cận khi chip xuống dòng; đây không phải là control cần "hit-area lớn" theo spec.

### SegmentedControl *(component mới)*

```tsx
import { SegmentedControl } from '../lib/ui'

<SegmentedControl
  aria-label="Chế độ canvas"
  options={[
    { value: 'design', label: 'Design' },
    { value: 'run', label: 'Run' },
  ]}
  value={mode}
  onChange={setMode}
/>
```

- **Track**: `h-9` (36px), `rounded-[18px]`, `border border-border-subtle`, `bg-surface`, padding `p-[3px]`, gap `4px` giữa các segment.
- **Segment active**: `h-[30px]`, `rounded-[15px]`, `border-2 border-accent`, `bg-app` (tối hơn track — tạo layering "đục lỗ" thay vì tô đè), `text-accent`, `font-semibold`, glow rất nhẹ (`shadow` blur 6px alpha 0.35, không phải glow gắt).
- **Segment inactive**: `border-2 border-transparent` (giữ cùng kích thước với active để không giật layout khi chuyển), `text-secondary`, `font-medium`, hover nâng nhẹ `bg-hover`/`text-primary`, không glow.
- **Bàn phím/semantics**: `role="tablist"` trên track, `role="tab"` + `aria-selected` + roving `tabIndex` trên từng segment, `ArrowLeft`/`ArrowRight` di chuyển + chọn có wraparound — **giống hệt pattern `moveTab` đã lặp lại ở `WorkflowsPage.tsx` và `ChatPage.tsx`** (không dùng `radiogroup` để nhất quán với phần còn lại của app).

**Nơi cần gắn (2 chỗ, cả hai đều nằm trong `src/pages/WorkflowsPage.tsx` — file đang bị khoá ghi lúc component này được viết):**

1. **Design/Run switch** — dòng ~127, hiện tại là tablist tay:
   ```tsx
   <div role="tablist" className="flex rounded-md border border-border-subtle p-0.5">
     <button role="tab" aria-selected={mode === 'design'} onClick={() => setMode('design')} className={...}>{t('workflows.design')}</button>
     <button role="tab" aria-selected={mode === 'run'} onClick={() => { setMode('run'); setTab('runs'); setRunLogOpen(true) }} className={...}>{t('workflows.runMode')}</button>
   </div>
   ```
   Thay bằng:
   ```tsx
   <SegmentedControl
     aria-label={t('workflows.orchestration')}
     value={mode}
     onChange={next => { setMode(next); if (next === 'run') { setTab('runs'); setRunLogOpen(true) } }}
     options={[
       { value: 'design', label: t('workflows.design') },
       { value: 'run', label: t('workflows.runMode') },
     ]}
   />
   ```
   Lưu ý: logic phụ khi chuyển sang `run` (set tab + mở run log) phải chuyển vào `onChange`, vì `SegmentedControl` chỉ có một callback thay vì hai `onClick` riêng.

2. **Workflows/Components tabs** (trong `WorkflowSidebar`, dòng ~135) — hiện tại là underline-tab (`border-b-2`), **không phải segmented pill**. Cân nhắc trước khi đổi: underline-tab hợp với 2 tab đứng đầu một panel hẹp (248px) hơn là capsule; nếu vẫn muốn đồng bộ hoá:
   ```tsx
   <SegmentedControl
     aria-label={t('workflows.components')}
     className="m-2"
     value={tab}
     onChange={setTab}
     options={[
       { value: 'workflows', label: t('nav.workflows') },
       { value: 'components', label: t('workflows.components') },
     ]}
   />
   ```
   thay cho khối `<div role="tablist" className="grid grid-cols-2 ...">`. Việc này là tuỳ chọn — task gốc chỉ yêu cầu SegmentedControl "possibly" cho cặp tab này; quyết định cuối để lại cho người mở khoá file.

3. **Không đổi** (không phải ứng viên SegmentedControl): tab console/errors trong `RunLog` và tab overview/contracts/runs/alerts trong `Inspector` — đều là underline-tab 2-4 mục trong panel hẹp, giữ nguyên pattern hiện có.

Cả `WorkflowSidebar`'s selected-item `Button` cũng nên đổi `size="md"` (ngầm định) → **`size="list"`** để đạt đúng 52-56px hai dòng theo spec — hiện tại nó bị ép về 32px vì `buttonSizes.md` áp `h-8`, nên item hai dòng đang bị cắt. Đây là thay đổi 1 prop, không cần sửa gì khác (style `selected` đã đúng: viền cyan mỏng + nền cyan nhạt, không glow).

## 4. 40×40 hit-area vs 32×32 visible box

`src/index.css` có rule toàn cục `button { min-width: 40px; min-height: 40px; }` — tồn tại để đảm bảo tap target, nhưng `min-height:40px` ép MỌI button cao tối thiểu 40px, trực tiếp phá mục tiêu 32px. Giải pháp:

- **Xoá `min-height: 40px` khỏi rule toàn cục, giữ lại `min-width: 40px`** (vô hại với text button — padding+label đã vượt 40px tự nhiên; icon-only control tự định nghĩa hit-box riêng nên cũng không cần rule này).
- **`IconButton`**: `<button>` chính là hit-box thật 40×40 (`h-10 w-10`, trong suốt, không border/background của riêng nó); một `<span>` con ở giữa mang box thị giác thật 32×32 (`h-8 w-8`, có background/border/radius/màu). Hover dùng `group-hover:` trên span (không phải `:hover` trần) để hover ở bất kỳ đâu trong 40px đều kích hoạt đúng box 32px. Focus ring cũng scope vào span qua Tailwind arbitrary variant `[&:focus-visible>span]:outline-2 ...` — ring ôm sát 32px, không ôm hit-box vô hình.
- **`.topbar-nav-toggle` / `.cw-drawer-toggle`** (raw CSS trong `index.css`, dùng chung bởi `Topbar.tsx` và `ChatPage.tsx`): áp kỹ thuật tương đương bằng `::before` — nút thật vẫn 40×40, `::before` với `inset: 4px` tạo box thị giác 32×32 chỉ tô màu khi hover; `outline-offset: -2px` kéo focus ring vào ôm sát box 32px.
- **`.sidebar-collapse`**: trước đây khai `height/width: 28px` nhưng bị rule toàn cục ép lên 40×40 trên thực tế (`min-height` luôn thắng `height` khi lớn hơn) — nay rule toàn cục không còn ép nữa nên 28px sẽ thật sự render ra 28px, thấp hơn mục tiêu 32px (icon 16px → chuẩn 32px theo tỉ lệ). Đã bump lên **32×32** để khớp tỉ lệ.
- **`Chip`'s remove button**: không dùng kỹ thuật 40/32 (chip quá nhỏ, 40px hit-area sẽ tràn ra ngoài) — dùng `min-w-0` để thoát hẳn rule toàn cục, hit-box thật ~18×18px.

## 5. Migration checklist cũ — vẫn còn hiệu lực, chỉ đổi giá trị màu

Các mục dưới đây được viết ở đợt review trước (đổi *provider-colour → accent token*, đổi *hex literal → token*). Chúng **vẫn đúng về việc phải đổi cái gì**, chỉ khác: "accent" giờ là cyan `#29c7f3` thay vì violet `#8b7cf6`. Không lặp lại toàn bộ bảng ở đây — xem lịch sử git của file này cho bảng đầy đủ 19 vị trí provider-colour-sai-vai-trò và 3 vị trí hex-literal; các file liên quan (`WorkflowsPage.tsx`, `RunsPage.tsx`, `AgentsPage.tsx`, `RunSpine.tsx`, ...) đều nằm ngoài phạm vi sở hữu của đợt redesign này (chỉ `tokens.css`/`index.css`/`ui.tsx`/`Sidebar.tsx`/`Topbar.tsx`/`Layout.tsx`).

### 5.1 Hardcoded size/colour còn sót lại ngoài phạm vi sở hữu (để người khác sửa sau)

Quét toàn repo cho các pattern `text-[10px]`, `text-[9px]`, `bg-accent/15`, `var(--hub-accent)` trực tiếp (thay vì class `bg-accent`/`text-accent`), `border-codex`/`bg-codex`/`text-codex`, `border-claude`/`bg-claude`/`text-claude` dùng làm accent/action (không phải `ProviderDot`):

| File:line | Vấn đề |
|---|---|
| `src/pages/WorkflowsPage.tsx` (nhiều dòng — bị khoá ghi lúc viết tài liệu này) | mode switch tay + workflow-list Button size, xem mục 3 "SegmentedControl" ở trên |
| `src/pages/RunsPage.tsx:99,104` | provider-colour dùng làm primary action / hover accent |
| `src/pages/AgentsPage.tsx` (dòng chứa `bg-codex`/`border-codex`) | primary action + tab active + selection dùng màu codex |
| `src/pages/SettingsPage.tsx:18` | badge "default" dùng màu codex |
| `src/pages/ApprovalsPage.tsx:19` | nút duyệt dùng màu codex làm primary action |
| `src/pages/SkillsPage.tsx:27` | tương tự |
| `src/pages/UsagePage.tsx:38,40,42` | `text-[10px]` (eyebrow label, KPI card) cần lên `text-section` (12px) |
| `src/lib/Table.tsx:4` | `text-[10px]` header cần lên `text-section` |
| `src/lib/markdown.tsx:9` | `text-[var(--hub-accent)]` — **đã tự động thành cyan** vì token đổi giá trị, không cần sửa code, chỉ cần biết là nó *đang* migrate đúng cách (tham chiếu token, không phải literal) |
| `src/components/RunSpine.tsx:13` (và các dòng `border-claude`/`bg-claude` khác trong file) | trạng thái "running" đang tô cứng bằng màu Claude — nên đổi sang `border-accent`/`text-accent` (cyan) |
| `src/components/ArtifactRail.tsx:12,13` | hex literal `bg-[#181B21]` — đổi sang `bg-surface` |

Toàn bộ các vị trí trên nằm ngoài 6 file thuộc sở hữu của đợt redesign này (`tokens.css`, `index.css`, `ui.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `Layout.tsx`) nên **không được sửa** ở đây — liệt kê để người tiếp theo xử lý.

## 6. Trạng thái file

- `src/styles/tokens.css`, `src/index.css`, `src/lib/ui.tsx` — cập nhật đầy đủ theo palette + size mới trong đợt redesign 2026-08.
- `src/components/Sidebar.tsx`, `Topbar.tsx`, `Layout.tsx` — không có hex literal hay control quá khổ; hưởng lợi tự động từ đổi token (logo, focus ring, hover, v.v. đều tham chiếu `--color-*`/`--hub-*`). Chỉnh tay duy nhất: gap giữa các control trong Topbar header (`gap-space-1` → `gap-space-2`, đúng spec "6-8px apart").
- `src/pages/*.tsx`, `src/components/{ArtifactRail,GateCard,RunSpine}.tsx`, `src/lib/{markdown,Table}.tsx` — **không sửa** (ngoài phạm vi sở hữu / một số bị khoá ghi). Xem mục 5.1 cho danh sách vị trí cần xử lý sau.

## 7. Quyết định G1 (giữ nguyên từ review trước, chỉ đổi tên màu)

- Nút **Duyệt** = `Button variant="primary"` (giờ là cyan, trước là violet); **Từ chối** = `Button variant="destructive"`.
- Amber chỉ dành cho trạng thái gate (`Status kind="setup-required"`), không dùng cho action.
- Pane có agent hiển thị quyền agent; không hiển thị badge provider `READ-ONLY` song song.

### Workflow Canvas

- Canvas dùng token dark-navy hiện có; node agent dùng `--hub-node-agent` (nay = cyan, trước = violet), node validate dùng `--hub-node-validate` (`--hub-info`, không đổi), edge dùng `--hub-edge-normal` (nay = cyan) hoặc `--hub-edge-selected`.
- Canvas dày và vận hành được: lưới chấm, node card gọn, port trái/phải, cạnh cong, inspector bốn tab. Không thêm runtime, role, contract hoặc run-history giả.
- Trạng thái chạy/lỗi lấy từ backend; node đang chạy dùng accent (cyan), node hoàn tất dùng success, lỗi validate/run luôn hiện thành banner có nội dung hành động được.
