# BD — Design-system migration: Batch A audit

> Phạm vi: `harness/hub/web-v3/src/`. Audit tĩnh ngày 2026-08-08, không chạy build/test và không thay đổi mã nguồn. Đã đọc `web-v3/DESIGN.md` trước; tài liệu này là hợp đồng ưu tiên. Quét 54 file trong `src/`, gồm 21 module ở `src/pages/`.

## 1. Kết luận thực thi

Hệ token và 12 primitive nền đã có, nên Batch B không được đổi palette/token. Khoản nợ còn lại là **adoption và ranh giới component**:

1. `ChatPage.tsx` và `WorkflowsPage.tsx` tự dựng nhiều button/tab/chip/modal/drawer/node-card; đây là rủi ro cao nhất.
2. Có hai họ tab tự chế (underline và filled/rounded) và ba họ badge/status (`Chip`, `Status`, `RunStatusBadge`), chưa có quy tắc phân vai đủ chặt.
3. `index.css` không chỉ là foundation 184 dòng: nó chứa hệ layout Chat, drawer, artifact panel, nhiều icon control. Phần này cần tách theo ownership, không biến thành primitive chung một cách máy móc.
4. Legacy token access còn tồn tại ở arbitrary class `var(--hub-*)`; đa số không sai màu vì vẫn tham chiếu token, nhưng làm vỡ quy ước “dùng semantic class token” và khiến migration khó grep.

Không phát hiện hex thô trong `.tsx` ngoài token definitions; các hex/RGB thô còn lại nằm ở `index.css` (token mirror, scrollbar, scrim, shadow) và có thể chấp nhận có điều kiện nêu ở §6.

## 2. Inventory control

“Chung” nghĩa là import từ `src/lib/ui.tsx`; “tự chế” nghĩa là markup/class tại caller hoặc CSS đặc thù. Vị trí ghi representative entry points, không phải ước lượng số lượng render từ map/condition.

| Vai trò | Chỗ dùng (file:line) | Primitive hiện dùng | Vấn đề audit |
|---|---|---|---|
| Button text/action | `pages/AgentsPage.tsx:35`, `ApprovalsPage.tsx:19`, `RunsPage.tsx:99`, `SettingsPage.tsx:18`, `SkillsPage.tsx:27`, `WorkflowsPage.tsx:137` | `Button` | Adoption tốt ở các page CRUD; `Button` mặc định secondary 32px. Một số caller tự override height (`AgentsPage.tsx:35`, `SkillsPage.tsx:27`). |
| Button tự chế: selectable/list | `pages/ArtifactsPage.tsx:24`, `SkillsPage.tsx:27`, `WorkflowsPage.tsx:145,147`, `ChatPage.tsx:263,277,464` | Không | Trùng `Button`/list-item; phần chọn có accent nhưng thiếu sizing/focus nhất quán. Workflow list cần `Button size="list"` theo DESIGN.md. |
| Icon button | `pages/AgentsPage.tsx:35`, `SkillsPage.tsx:27`, `WorkflowsPage.tsx:137,140,183`, `ChatPage.tsx:520`; `lib/markdown.tsx:2` | `IconButton` | Primitive đúng 40 hit/32 visible. Caller thêm `h-10 w-10 min-h-10 min-w-10` ở Agents/Skills là thừa và tạo đường lệch API. |
| Icon button CSS legacy | `components/Sidebar.tsx:29`; `components/Layout.tsx:34`; `pages/ChatPage.tsx:260,289` | Không | `.sidebar-collapse`, `.sidebar-resizer`, `.cw-drawer-toggle`, `.cw-artifact-reopen` có style riêng ở `index.css:87-102,122-129,156-172`; chỉ resizer là control chuyên biệt, các toggle nên chuyển `IconButton` hoặc wrapper hit-area chuẩn. |
| Tabs / underline tabs | `AgentsPage.tsx:35`, `ArtifactsPage.tsx:24`, `WorkflowsPage.tsx:145,183`, `ChatPage.tsx:337` | Không | Lặp roving-tabindex/moveTab. Đây là Tabs, không phải SegmentedControl; cần primitive `Tabs` để giữ border/height/focus và semantics. |
| Segmented | `WorkflowsPage.tsx:137` | `SegmentedControl` | Đúng primitive cho Design/Run. Workflow sidebar tabs ở `:145` vẫn underline, hợp lý nếu được migrate sang Tabs chứ không bắt buộc pill. |
| Input | `AgentsPage.tsx:35`, `ArtifactsPage.tsx:24`, `FolderPicker.tsx:21`, `HooksPage.tsx:10`, `RunsPage.tsx:99`, `WorkflowsPage.tsx:137,145,147` | `Input` | Adoption tốt, 36px. Chưa có `SearchInput`; các search lặp placeholder/icon/clear behavior. |
| Textarea | `AgentsPage.tsx:35`, `RunsPage.tsx:99`, `SkillsPage.tsx:27`, `VgovOutputPage.tsx:99`, `WorkflowsPage.tsx:149` | `Textarea` | Primitive dùng đúng. Composer Chat có flow riêng ở `ChatPage.tsx:430` và CSS `.cw-composer`; giữ domain component. |
| Select | `AgentsPage.tsx:35`, `FilesPage.tsx:10`, `HooksPage.tsx:10`, `SkillsPage.tsx:27`, `UsagePage.tsx:38`, nhóm `Vgov*.tsx` | `Select` | Adoption tốt; native option menu là quyết định hợp lý, chưa cần custom dropdown. |
| Checkbox | `components/FolderPicker.tsx:21`, `pages/AgentsPage.tsx:35` | Không | Native checkbox không có token/focus/size chung. Cần primitive `Checkbox` vì dùng để thay đổi state, không chỉ form incidental. |
| Radio / Toggle | Không có radio; toggle state bị biểu diễn bằng button/chip ở `ChatPage.tsx:263` | Không | Radio chưa cần. Toggle cần nếu artifact-context là boolean control bền vững; nếu chỉ chip filter ngắn hạn, chuẩn hoá bằng `Chip selectable` có semantics pressed. |
| Popover / dropdown / menu | `components/FolderPicker.tsx:21`, `RunInputPicker.tsx:23`, `Topbar.tsx:24`, `AgentsPage.tsx:35`, `SkillsPage.tsx:27`, `ChatPage.tsx:325,464,520`, `WorkflowsPage.tsx:137` | `Popover` | Popover có close outside/Escape nhưng không có focus management, menu role/Arrow keys. Nội dung overflow action đang là các `Button`, nên cần `Menu` riêng thay vì ép mọi dropdown vào Popover. |
| Tooltip | `title=` trên `Sidebar.tsx:29`, `Layout.tsx:34`, `WorkflowsPage.tsx:137,140,183`; IconButton callers | Không | `title` không thay Tooltip keyboard/touch. Cần Tooltip cho icon-only discovery; `aria-label` vẫn phải giữ. |
| Chip | `AgentsPage.tsx:35`, `ArtifactsPage.tsx:24`, `ChatPage.tsx:263`, `RunInputPicker.tsx:23`, `SettingsPage.tsx:18`, `WorkflowsPage.tsx:137` | `Chip` một phần | Workflow header status và Chat context/action chips tự chế (`WorkflowsPage.tsx:137`, `ChatPage.tsx:263,277`). Cần phân biệt tag/filter/removable chip với status badge. |
| Status / provider identity | `Sidebar.tsx:29`, `RunSpine.tsx:13`, `GateCard.tsx:3`, `AgentsPage.tsx:35`, `SkillsPage.tsx:27`; provider ở `RunSpine.tsx:13`, `WorkflowsPage.tsx:147` | `Status`, `ProviderDot` | `Status` đúng cho dot+label; provider được giới hạn dot ở primitive. Có badge thủ công cạnh tranh vai trò, xem §4. |
| Run status badge | `OverviewPage.tsx:17` | `RunStatusBadge` | Chỉ dùng một page. Không gộp vào Chip: nó mang semantic run state + mark, nhưng cần quy ước ưu tiên với `Status`. |
| Card / panel / inspector | `AgentsPage.tsx:35`, `ArtifactsPage.tsx:24`, `SkillsPage.tsx:27`, `WorkflowsPage.tsx:137,145`, `ChatPage.tsx:546,579,609` | Không | Lặp `rounded-lg border border-border-subtle bg-surface`, header/body/footer. Cần `Panel` trước `Card`; inspector và persistent pane không nên là Card marketing. |
| List item | `ArtifactsPage.tsx:24`, `SkillsPage.tsx:27`, `WorkflowsPage.tsx:145,147`, `FolderPicker.tsx:21`, `ChatPage.tsx:379,391` | Không (trừ Button list API chưa được dùng) | Selected/hover/padding/keyboard khác nhau. Cần `ListItem` hoặc dùng `Button size=list` khi item là action; không dùng Button cho static row. |
| Sidebar / topbar / toolbar | `Sidebar.tsx:19,29`, `Topbar.tsx:22`, `WorkflowsPage.tsx:137,140,183`, `ChatPage.tsx:254` | Không | Global Sidebar/Topbar là domain shell; Workflow toolbar tự ghép. Cần `Toolbar` layout primitive, không cần generic Sidebar/Topbar primitive. |
| Drawer | `ChatPage.tsx:541`; responsive app drawer `Layout.tsx:36` + `index.css:175` | Không | Context drawer tự dựng `role=dialog`; chat/sidebar drawer CSS tự quản. Cần Drawer để có overlay/focus/ESC/scroll lock chuẩn. |
| Modal / dialog | `ChatPage.tsx:572,594` | Không | Hai modal lặp overlay, `role=dialog`, radius `14px`, shadow. Cần Dialog. Hiện không thấy focus trap/return-focus — accessibility regression risk cao. |
| Table | `lib/Table.tsx:4`, `AgentsPage.tsx:35`, `SkillsPage.tsx:27`, `ApprovalsPage.tsx:19` | `Table` chỉ dùng ở Approvals | Ba table tự chế lặp wrapper/header/row. `Table` hiện thiếu row/header API hoặc cần chuẩn hoá class recipe. |
| Pagination | `AgentsPage.tsx:35`, `SkillsPage.tsx:27` | Không | Cùng previous/current/next pattern; cần `Pagination` nhẹ. |
| Breadcrumb | `FolderPicker.tsx:21` | Không | Dùng Button ghost + chevron trong Popover; cần `Breadcrumb` nhỏ hoặc recipe nội bộ FolderPicker. |
| Empty state | `AgentsPage.tsx:35`, `FilesPage.tsx:10`, `HooksPage.tsx:10`, `FolderPicker.tsx:21`, `WorkflowsPage.tsx:147` | `EmptyState` một phần | Nhiều page còn `<p>`/div text trống (`ArtifactsPage.tsx:24`, `ArtifactRail.tsx:12`, `WorkflowsPage.tsx:183`). Migrate nơi empty có title/action; giữ inline empty cho context cực hẹp. |
| Alert / error | `GateCard.tsx:3`, `ApprovalsPage.tsx:19`, `ChatPage.tsx:552`, `WorkflowsPage.tsx:137,183` | Không | Lặp error/warning box. Cần `Alert` cho semantic message/action; GateCard là domain composition trên Alert. |
| Toast | `ChatPage.tsx:296` | Không | Toast chỉ có Chat và tự dựng `role=status`; cần Toast host/primitive khi thêm page khác, chưa cần migration app-wide ngay. |
| Node card / canvas control | `WorkflowsPage.tsx:140,149,151,183` | `IconButton` một phần | Canvas node, ports, minimap, SVG edges là domain-specific, không biến thành generic Card. Canvas toolbar nên dùng Toolbar + IconButton; node card giữ domain component và dùng token/class recipe. |
| Form | `AgentsPage.tsx:35`, `SkillsPage.tsx:27`, `VgovOutputPage.tsx:99` | input primitives, không có Form | Không có `<form>`/label-control layout primitive. Cần `Field`/`FormField` recipe để label/error/help và checkbox nhất quán; chưa cần form state library. |

## 3. Primitive còn thiếu so với §26

| Primitive §26 | Quyết định | Lý do và batch đề xuất |
|---|---|---|
| Tooltip | Cần | Icon-only hiện dựa `title`; bắt đầu Batch B cùng IconButton. |
| Menu | Cần | Overflow actions trong Popover cần keyboard/menu semantics; làm sau Popover API. |
| Card | Chưa cần primitive riêng | Hầu hết là pane/inspector có header/body, phù hợp `Panel`; card đặc thù domain vẫn local. |
| ListItem | Cần | Danh sách selectable/action lặp trên Artifacts, Skills, Workflow, Folder picker. |
| Panel | Cần, ưu tiên cao | Recipe surface+border+header/body/footer đang lặp nhiều page. |
| Toolbar | Cần, ưu tiên cao | Workflow có ba toolbar; cần chuẩn gap, height 48, responsive wrap, icon group. |
| Divider | Cần dạng component/class recipe | `border-t/b` lặp khắp app; primitive không cần nhiều API. |
| Dialog | Cần, ưu tiên cao | Chat modal thiếu focus lifecycle, lặp overlay/content. |
| Drawer | Cần, ưu tiên cao | Context drawer và responsive drawer cần overlay/focus/ESC chuẩn. |
| Checkbox | Cần | Hai nơi dùng native checkbox không có shared state/focus. |
| Radio | Chưa cần | Không có use case trong source hiện tại. Không tạo speculative primitive. |
| Toggle | Có điều kiện | Chỉ tạo khi xác nhận boolean artifact-context (`ChatPage.tsx:263`) là pattern tái dùng; nếu không dùng selectable Chip có `aria-pressed`. |
| Tabs | Cần | Có ít nhất 5 tab strips tự chế; khác SegmentedControl về IA/visual. |
| SearchInput | Cần nhẹ | Search Input lặp page CRUD, có thể wrap `Input` + icon/clear, không tự viết input mới. |

## 4. Trùng vai trò và migration map

### 4.1 Component trùng vai trò

| Nhóm | Bằng chứng | Quyết định |
|---|---|---|
| Badge/status | `Chip` `ui.tsx:228`; `Status` `ui.tsx:385`; `RunStatusBadge` `ui.tsx:407`; badge raw `WorkflowsPage.tsx:137`; Chat raw chip `ChatPage.tsx:263,277` | Không gộp 3 primitive hiện có. Chốt taxonomy: Chip = tag/filter/removable; Status = trạng thái nhẹ dot+text; RunStatusBadge = trạng thái run compact có mark. Di chuyển badge raw về một trong ba, không tạo `Badge` thứ tư. |
| Tabs | `AgentsPage.tsx:35`, `ArtifactsPage.tsx:24`, `WorkflowsPage.tsx:145,183`, `ChatPage.tsx:337` | Gộp implementation vào `Tabs`; giữ variant `underline` và `soft` nếu evidence cần. Không chuyển tất cả sang SegmentedControl. |
| Icon affordance | `IconButton` `ui.tsx:127`; `.sidebar-collapse` `index.css:100`; `.topbar-nav-toggle/.cw-drawer-toggle` `index.css:122`; Chat button raw `:260,289` | Gộp controls icon-only không chuyên biệt vào IconButton. Giữ resizer và canvas port domain-specific. |
| Surface containers | raw surface pane ở `AgentsPage.tsx:35`, `ArtifactsPage.tsx:24`, `SkillsPage.tsx:27`; dialogs `ChatPage.tsx:546,579,609` | `Panel` chia sẻ visual shell; `Dialog`/`Drawer` sở hữu overlay/focus. Không gộp node/canvas card. |
| Pagination | `AgentsPage.tsx:35`, `SkillsPage.tsx:27` | Một Pagination primitive nhỏ. |
| Table | `lib/Table.tsx:4`, `AgentsPage.tsx:35`, `SkillsPage.tsx:27` | Mở rộng `Table` hoặc tạo recipe exports; không duy trì ba table class copy-paste. |

### 4.2 Migration map

| Cũ | Mới | Ghi chú |
|---|---|---|
| `<button>` tab + `moveTab` | `Tabs` | Migrate nguyên semantics roving tabindex; preserve underline/soft variant theo screen. |
| `<button>` list selectable | `ListItem` hoặc `Button size="list"` | List action dùng Button; list navigation/static dùng ListItem. Workflow selected row phải `size="list"`. |
| Badge trạng thái tự chế dùng `rounded-full`/`border` | `Chip` / `Status` / `RunStatusBadge` | Chọn theo taxonomy §4.1. |
| `Popover` chứa action buttons | `Menu` (có thể dùng Popover làm positioning nội bộ) | Action menu không dùng dialog ARIA như `Popover` hiện tại. |
| raw modal markup | `Dialog` | Đưa scrim, ESC, focus trap, return focus vào primitive. |
| raw context drawer / mobile drawers | `Drawer` | Preserve chat responsive layout; chỉ thay accessibility/visual shell. |
| raw error/warning box | `Alert` | `GateCard` giữ data/CTA riêng, render Alert bên trong. |
| raw search Input | `SearchInput` | Wrap `Input`, không fork controlBase. |
| native checkbox | `Checkbox` + `FormField` | Giữ native input dưới component để semantics. |
| table wrappers page-local | `Table` recipe | Căn header/body/row/selected/hover với `lib/Table.tsx:4`. |

## 5. Drift chi tiết: token, spacing, radius, type, height, focus

### 5.1 Inline màu, hex thô, token access

- Hex thô ngoài definitions: không thấy trong `.tsx`. `index.css:4-29` và `styles/tokens.css:28-71` là token/mirror hợp lệ, không đổi ở migration.
- Raw visual color hợp lý nhưng phải giữ local: scrollbar/scrim/shadow `index.css:65,68-69,175`; đây là alpha/elevation implementation, không phải semantic component color.
- `var(--hub-*)` arbitrary classes cần thay bằng semantic Tailwind class khi có mapping: `GateCard.tsx:3` (`border-[var(--hub-warning)]`, `bg-[var(--hub-warning-subtle)]`), `RunSpine.tsx:12-13`, `Sidebar.tsx:19,29`, `Topbar.tsx:22`, `ApprovalsPage.tsx:19`, `WorkflowsPage.tsx:140,145,147,151,183`, `lib/markdown.tsx:9,11`, `lib/ui.tsx:560`.
- Ngoại lệ hợp lệ: SVG `stroke/fill` và inline canvas geometry ở `WorkflowsPage.tsx:140,151`; CSS variable runtime (`ChatPage.tsx:254` width artifact); layout variables `index.css:62-63`. Không ép chúng thành class token.
- Provider palette trong `index.css:27-29` chỉ hợp lệ qua `ProviderDot` (`ui.tsx:420-433`). Cần audit migration riêng các use ngoài primitive đã được DESIGN.md cảnh báo.

### 5.2 Spacing / radius / typography / heights

| Loại drift | Vị trí thật | Nhận định / hành động |
|---|---|---|
| Spacing không theo lưới 4px | `GateCard.tsx:3` `p-3.5` (14px); `RunSpine.tsx:13` `mb-1.5` (6px); `Sidebar.tsx:19,29` 9/10px; `Topbar.tsx:22` 18px; `index.css:93-99` 14/10/7/9/5px | 6px được DESIGN.md cho phép cho gap icon-label, nhưng 14/18/10/9/7/5 cần chuyển về space scale hoặc documented control exception. |
| Radius bất nhất | `ApprovalsPage.tsx:19` `rounded-sm-lg` (không phải token utility hợp lệ, cần xác minh render); `ChatPage.tsx:579,609` `rounded-[14px]`; `WorkflowsPage.tsx:151` `rounded-xl`; `ui.tsx:309,326` 18/15px là segmented exception | Modal 14px và node `xl` lệch 6/8/12 contract. Dialog dùng `lg` (12px); node card chọn md/lg theo design canvas và ghi rõ exception nếu giữ. |
| Typography raw | `ApprovalsPage.tsx:19`, `PlaceholderPage.tsx:3`, `RunSpine.tsx:12-13`, `ArtifactRail.tsx:12-13`, `WorkflowsPage.tsx:137,140,147,183` dùng `text-xs`, `text-sm`, `text-[13px]`, raw title var | Map sang caption/label/body/title/section tokens. `text-[13px]` có thể là label nhưng cần line-height token. |
| Height control lệch | `ChatPage.tsx:464,520` ép Popover trigger `!h-10`; `AgentsPage.tsx:35`, `SkillsPage.tsx:27` ép IconButton `h-10`; `index.css:166` action 36px; `index.css:171` event action 28px | Desktop toolbar target là <=36px visible, IconButton 32 visible/40 hit. 40px text/popover triggers trong Chat là drift; 28px inline event action là exception cần focus/hit rationale. |
| Toolbar 40–48px | `WorkflowsPage.tsx:137` header min 48px; `WorkflowsPage.tsx:183` run-log header 48px; `index.css:114` topbar; `index.css:122` icon hit 40px | 48px **toolbar container** hợp đồng cho phép; vấn đề là child control >36px, không phải height toolbar. Không hạ toolbar mù quáng. |
| Focus thiếu/không đều | raw selectable buttons `ArtifactsPage.tsx:24`, `SkillsPage.tsx:27`, `WorkflowsPage.tsx:147`, `ChatPage.tsx:263,277,464`; Dialog/Drawer `ChatPage.tsx:541,572,594` | Global focus selector `index.css:81` có phủ button/tab/input, nhưng visual/offset bị caller override và dialog thiếu focus lifecycle. Primitive mới phải không dựa hoàn toàn vào global rule. |

## 6. Kế hoạch dọn `src/index.css` (184 dòng)

Không xoá hàng loạt. Phân loại theo block hiện hữu, sau đó di chuyển cùng component ownership để tránh regression responsive.

| Dòng | Khối | Quyết định | Đích |
|---|---|---|---|
| 1-59 | Tailwind theme mirror | Giữ CSS token mirror; không tạo primitive, không đổi giá trị | `index.css` + sync thủ công với `tokens.css` theo DESIGN.md |
| 61-81 | Root/reset/scrollbar/global focus | Giữ dạng CSS thô; đây là browser foundation. Tách global focus rule khỏi responsibility primitive dần dần, nhưng không xoá trước khi primitives phủ đủ | `index.css` |
| 82-117 | App shell/sidebar/topbar | Tách `.app`, sidebar classes sang `Layout/Sidebar/Topbar` ownership (CSS module hoặc Tailwind component code) sau visual regression; giữ layout global tối thiểu | domain shell, không primitive generic |
| 118-133 | nav/drawer icon affordance + content padding | `topbar-nav-toggle`/`cw-drawer-toggle` migrate IconButton; `.content` spacing ở Layout. Giữ responsive shell logic | `IconButton`, `Layout` |
| 134-176 | Chat workspace 3-panel, artifact, responsive drawers | Không biến thành global primitive; tách sang Chat domain stylesheet/component. Dùng `Drawer`, `Panel`, `Toolbar` chỉ tại boundaries. Đây là khối rủi ro cao nhất | `ChatPage` + Chat subcomponents |
| 177-184 | artifact markdown, node animation, content headings | `.artifact-panel` belongs Markdown/Artifact; `.node-pulse` giữ CSS raw nhưng add reduced-motion đã có; `.content h1/p` xoá sau khi tất cả page dùng text tokens để tránh implicit typography | domain CSS / remove cuối migration |

CSS có thể giữ thô: scrollbar vendor pseudo-elements (`65-69`), media queries/layout grid (`106-113`, `131`, `175-176`), pseudo-element hit target (`123` cho tới khi IconButton migrate), animation/keyframes/reduced motion (`180-182`), dynamic CSS custom property calculations (`62-63`). Các phần đó không phải component style duplication thuần tuý.

## 7. Rủi ro migration 21 page modules

| Page/module | Rủi ro | Lý do |
|---|---|---|
| `AgentsPage.tsx:35` | Cao | Table + inspector + tabs + checkbox + form + pagination, nhiều control trong một dòng source. |
| `ApprovalsPage.tsx:19` | Trung bình | Table, alert/error, selected detail, radius invalid nghi ngờ `rounded-sm-lg`; flow approval không được vỡ. |
| `ArtifactDetailPage.tsx:16` | Thấp | Detail render nhỏ, ít control. |
| `ArtifactsPage.tsx:24` | Cao | Sidebar list buttons, soft tabs, version list, panel layout; selected states nhiều. |
| `ChatPage.tsx:254-627` | Cao | 3-panel responsive, popovers, raw chip/buttons, toast, drawer và 2 modal; focus/overlay risk. |
| `FilesPage.tsx:10` | Thấp | Select/button/empty state đơn giản. |
| `HooksPage.tsx:10` | Thấp | Input/select/button/empty đơn giản. |
| `pages/index.tsx:1-36` | Thấp | Router/export registry; không có visual control migration. |
| `OverviewPage.tsx:17` | Thấp | Chỉ cần giữ `RunStatusBadge` semantic. |
| `PlaceholderPage.tsx:3` | Thấp | Typography-only cleanup. |
| `RunsPage.tsx:99` | Trung bình | Filter/form + textarea + run action/status, semantic action color cần preserve. |
| `SessionsPage.tsx:7` | Trung bình | List/detail/replay state; source nén một dòng, cần split/verify trước migration. |
| `SettingsPage.tsx:18` | Trung bình | Form settings + Chip/Status/provider dot; action state cần giữ. |
| `SkillsPage.tsx:27` | Cao | Create form, sidebar list, table, pagination, details, Popover actions và raw buttons. |
| `UsagePage.tsx:38` | Thấp | Select + KPI/table-like read only; typography token cleanup. |
| `VgovComparePage.tsx:67` | Trung bình | Input-driven compare view; preserve output alignment. |
| `VgovOutputPage.tsx:99` | Trung bình | Full input/select/textarea form and output states. |
| `VgovProvenancePage.tsx:71` | Trung bình | Input/filter + evidence list; readable mono/type density important. |
| `VgovReleasesPage.tsx:88` | Trung bình | Filter/action/list state and release rows. |
| `VgovRunPage.tsx:117` | Trung bình | Run form and live/result states; avoid breaking submit/run flow. |
| `WorkflowsPage.tsx:137-186` | Cao | Canvas pointer/keyboard/SVG, tabs, toolbar, inspector, run log, responsive density; must migrate in isolated slices. |

## 8. Thứ tự batch sau

1. **Batch B — foundation primitives:** `Tabs`, `Panel`, `Toolbar`, `Dialog`, `Drawer`, `Checkbox`, `Tooltip`, `Menu`, `SearchInput`, `Pagination`, `Alert`; unit/interaction tests for keyboard/focus/ESC/return focus. Không đổi tokens.
2. **Batch C — domain composition:** migrate `Table` recipe, list items, FolderPicker breadcrumb, chat composer controls, workflow toolbar/run log; establish badge taxonomy. Không chạm canvas geometry.
3. **Batch D — low/medium pages:** Files, Hooks, Placeholder, Overview, Usage, ArtifactDetail; rồi Vgov pages, Runs, Settings, Approvals, Sessions. Mỗi page visual compare và keyboard pass.
4. **Batch E — complex CRUD surfaces:** Agents, Artifacts, Skills. Migrate tables/sidebar/inspector one surface at a time.
5. **Batch F — Chat:** extract Chat subcomponents, adopt Drawer/Dialog/Menu/Tooltip, validate desktop + `<1280` drawer + `<900` artifact mode.
6. **Batch G — Workflows:** toolbar/tabs/sidebar first; then inspector/run log; canvas node/ports/SVG last with drag, nudge, edge keyboard and reduced-motion regression checklist.
7. **Batch H — legacy cleanup:** after adoption is complete, shrink `index.css` by ownership blocks, remove arbitrary semantic `var(--hub-*)` classes where a Tailwind semantic token exists, then audit all page visual states again.

## 9. Verification gate cho mỗi batch

- Không đổi `tokens.css` palette/scale trừ khi DESIGN.md được cập nhật có chủ đích.
- Control keyboard: Tab, Enter/Space, Escape, arrow navigation tabs/menu; focus visible; focus return sau Dialog/Drawer.
- Desktop toolbar: visible control <=36px, IconButton visible 32px / hit 40px; toolbar container 48px được phép.
- Check default/hover/active/disabled/loading/empty/error/selected của primitive được chạm.
- Visual compare ở desktop và breakpoint Chat 1279/899px; Workflow canvas thêm drag, edge select/delete, nudge, zoom, minimap.
