# Plan: UI/UX Transformation — Opus Nexus

> **Input:** `docs/handoff-codex-uiux.md` (review brief) + `docs/PLAN-opus-nexus-transformation.md` (product) + `health-app/dashboard.html` (source, ~2257 dòng)
> **Mục tiêu:** Một plan transform UI/UX có cơ sở — review theo quan điểm có sẵn (A–G), so sánh app cùng loại, và chốt repo GitHub tham chiếu design.
> **Ràng buộc (giữ nguyên từ handoff §7):** single-file, không thêm CDN, giữ dark-bento identity, chỉ đụng HTML/CSS/render — không đụng JS logic.
> **Ngày:** 2026-05-30

---

## 0. TL;DR

Opus Nexus đã đúng "xương" (4 view, bento, dark, mobile-first) nhưng đang vướng 3 nhóm vấn đề **có cơ sở đo được**, không phải gu cá nhân:

1. **Touch target dưới chuẩn** — gần như mọi control (`nav-tab` ~32px, `rtab` ~28px, `proposal-edit` 30px) đều < 44px iOS HIG → mis-tap trên phone.
2. **Điều hướng + tone lẫn lộn** — nav top thay vì bottom tab bar; tối đa 3 tầng tab xếp chồng ở Vita; "Actions" tên mơ hồ; trộn Việt/Anh ("Today" vs "Sức khỏe").
3. **Hệ màu/typography quá tải & thiếu thang bậc** — 9 màu metric + màu status, `--vita-good` (green) gánh cả "active" lẫn "success" (xung đột ngữ nghĩa); body 12px / label 9–10px dưới ngưỡng đọc của iOS (≥17px body).

Cộng thêm: thiếu `env(safe-area-inset-*)` và meta PWA cho đúng use-case "bookmark iPhone".

Plan đề xuất **3 phase, không refactor lớn**, mỗi thay đổi nằm gọn trong `dashboard.html`.

---

## 1. Review theo quan điểm có sẵn (A–G)

Severity: 🔴 blocker · 🟠 friction · 🟡 polish. Mỗi finding kèm vị trí thật trong file.

### A. Navigation & Information Architecture
- 🟠 **[A.1] "Actions" tên mơ hồ.** User mới không đoán được tab này = paste JSON → duyệt. **🔒 Chốt: đổi nhãn → "Approval"** (danh từ, đúng quy ước nav, đồng bộ tiếng Anh, mô tả đúng hàng-chờ-phê-duyệt) + **badge đếm** số proposal pending (chấm đỏ `--vita-energy`). `dashboard.html:348`
- 🔴 **[A.3] 3 tầng tab xếp chồng ở Vita.** `nav-tabs` (dòng 344) + `mod-tabs` (350) + `range-row` (355) chồng nhau trong topbar sticky → chiếm chiều cao lớn, nặng nhận thức. Gộp range vào segmented control nhỏ trong content, hoặc cho range thành chip cuộn ngang.
- 🟠 **[A.4] "Plan My Week" chôn trong Actions** trong khi nó là calendar-centric. Cân nhắc đưa lên Calendar tab (handoff Q4).
- 🟡 **[A.2] Today có thể quá tải** — snapshot + insight + calendar + task trong 1 màn. Cần thứ tự ưu tiên thị giác (xem D).

### B. Today View
- 🟠 **[B.5] Snapshot thiếu progress visual.** 4 bento cell hiện số vs target nhưng không có vòng/thanh tiến độ → khó "đọc trong 5 giây" như product promise. Thêm mini progress (đã có `.pbar`, `.ring-svg` sẵn — tái dùng).
- 🟡 **[B.6] Insight card dễ bị skip** — cùng tông surface, nằm giữa. Cho weight thị giác rõ hơn hoặc thu gọn còn 1 dòng "lead".
- 🟡 **[B.8] Badge "quá hạn"** cần dùng `--vita-bad` đậm hơn để nổi.

### C. Proposal / Actions UX
- 🟠 **[C.9] Thiếu nút Clear sau validate.** Flow paste→validate→approve không có cách reset textarea/preview gọn.
- 🟠 **[C.10] Hai nút Approve dễ nhầm.** Per-item `proposal-approve` (dòng 288) + batch "Duyệt tất cả" cùng màu green, khác cấp bậc nhưng không phân tầng thị giác. Batch nên là primary, per-item nên nhẹ hơn (ghost).
- 🟡 **[C.11] Trạng thái `.approved`** chỉ dim + opacity .75 (dòng 290) — thêm check ✓ + nhãn "Đã thêm" rõ ràng để xác nhận thành công.
- 🟠 **[C.12] Edit form trên mobile** — `.edit-row` grid `64px 1fr` (dòng 294) hẹp cho label dài; field height OK nhưng nút trong form cần ≥44px.

### D. Calendar Tab
- 🟡 **[D.14] Event density** — `.cal-time` cố định 72px (dòng 310) tốt; kiểm tra wrap title dài.
- 🟠 **[D.16] Empty state khi chưa connect** — `.cal-empty` (dòng 307) cần CTA "Kết nối Google Calendar" rõ ràng, không chỉ text mô tả.

### E. Visual & Typography
- 🔴 **[E.17] Thang typography dưới ngưỡng & không nhất quán.** Body 12px, label 10px, `ring-lbl` 9px (dòng 134), `pr-new` 9px (231). iOS HIG khuyến nghị body ≥17px; 9–10px là rủi ro đọc/accessibility. Đề xuất type scale tối thiểu: caption 11 / body 13 / title 15 / metric 28.
- 🟠 **[E.18] Quá tải màu.** 9 màu metric (energy/protein/carb/fat/fiber/water/sleep/steps/weight, dòng 26–34) + status. Best practice dark UI: nền tối + ít accent sáng. Giữ màu macro trong context dinh dưỡng, nhưng giảm màu ở nav/status.
- 🔴 **[E.19] `--vita-good` (green) gánh 2 nghĩa.** Vừa là "active" (`nav-tab.active` 251, `mtab.active` 88, `rtab.active` 92) vừa là "success/good" (status-pill.good, da-kcal...). Xung đột ngữ nghĩa. Tách: active dùng accent trung tính (vd `--vita-text`/surface-raised hoặc 1 accent riêng), giữ green chỉ cho "good/success".
- 🟡 **[E.20] Radius không nhất quán.** `.b` lg=18 (99) vs `.ring-cell` md=14 (129) vs `.cal-mini` md=14 (303). Chuẩn hóa: card cấp 1 = lg, nested = md.

### F. Mobile-first
- 🔴 **[F.21] Touch target < 44px diện rộng.** `nav-tab` padding 8/4 → ~32px (250); `rtab` padding 6 → ~28px (91); `mtab` 9 → ~36px (87); `proposal-edit/approve` height 30px (286/288); `sync-btn`/`pat-btn` ~30px (83/84). Tất cả dưới 44×44 iOS HIG.
- 🟠 **[F.22/scroll] Thiếu safe-area.** Không có `env(safe-area-inset-bottom/top)`; content bottom pad cố định 40px (dòng 95). Nếu chuyển sang bottom nav (đề xuất) bắt buộc cần safe-area cho home indicator iPhone.
- 🟡 **[F.23] Textarea keyboard** — `.nexus-input` min-height 130px (262); khi bàn phím bật có thể đẩy layout, cân nhắc `scroll-margin`.

### G. Tone & Labels
- 🟠 **[G.24] Trộn Việt/Anh.** Nav "Today/Vita/Calendar/Actions" (Anh) vs mtab "Sức khỏe/Tập luyện/Tài chính" (Việt) vs card "Nhận xét hôm nay". Chốt 1 ngôn ngữ chủ đạo (đề xuất: Việt cho nhãn người-đọc, giữ tên sản phẩm/brand tiếng Anh).
- 🟡 **[G.25] "Duyệt tất cả" vs "✓ Approve"** trong cùng flow — thống nhất "Duyệt".

**Tổng:** 4 🔴 · 9 🟠 · 7 🟡. Bốn blocker (A.3 nav stacking, E.17 type scale, E.19 green collision, F.21 touch target) là nền tảng — fix trước sẽ kéo theo nhiều friction.

---

## 2. So sánh app cùng loại (competitive review)

Opus Nexus = lai giữa **health tracker** (Vita) và **AI planner/operator** (Actions/Plan My Week). Lấy bài học từ cả 2 nhánh:

| App | Thuộc nhánh | Điểm đáng học | Áp dụng cho Nexus |
|---|---|---|---|
| **Apple Health / Fitness** | Health | Bento + activity rings; mỗi card 1 ý; màu chỉ ở vòng tiến độ, nền trung tính | Giảm màu ở chrome, dồn màu vào ring/progress (B.5, E.18) |
| **Gentler Streak** | Health | "Informed coaching" — surface *next step*, không hét số; interface calm | Insight card thành "next action" thay vì nhận xét thụ động (B.6) |
| **Cronometer** | Nutrition | Macro density cao nhưng có thứ bậc rõ; target progress luôn hiển thị | Chuẩn cho macro-card + snapshot progress |
| **Structured** | AI planner | Timeline 1 cột sạch; có "AI tab" nói chuyện → gợi ý task | Mô hình cho Today/Calendar; Actions có thể tiến tới conversational |
| **Motion** | AI planner | NL → auto-schedule, real-time reschedule | Định hướng dài hạn cho Plan My Week (hiện đang paste JSON thủ công) |
| **Reclaim** | AI planner | Phân biệt rõ task/habit/meeting bằng màu + nhãn nhất quán | Khung phân loại proposal (event vs task) trong Actions (C.10) |
| **Sunsama** | Daily planner | "Plan your day" ritual, mỗi sáng 1 màn brief gọn | Củng cố Today như daily ritual (đúng product promise "5 giây") |

**Kết luận so sánh:** điểm yếu lớn nhất của Nexus so với nhóm này không phải thiếu tính năng mà là **hệ thị giác chưa phân tầng** (mọi thứ cùng tông, cùng cỡ chữ) và **điều hướng nặng** — đúng 4 blocker ở §1.

---

## 3. Repo GitHub tham chiếu design

Cho app dạng dark-bento health + dashboard, single-file/HTML-CSS-first:

| Repo | Vì sao liên quan | Dùng để |
|---|---|---|
| [Shubo16/Bento-box-dashboard](https://github.com/Shubo16/Bento-box-dashboard) | Bento dashboard cho fitness (active calories, PR tracking) — đúng domain | Tham chiếu layout bento cho Vita |
| [github.com/topics/bento-grid](https://github.com/topics/bento-grid) | Tổng hợp bento-grid patterns | Pattern grid responsive |
| [migueravila/Bento](https://github.com/migueravila/Bento) | Startpage bento HTML/CSS/JS thuần, dark/light toggle, single-file tinh thần | Tham chiếu CSS thuần không framework (hợp ràng buộc no-CDN) |
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Bộ `DESIGN.md` của các design system lớn — thả vào repo để agent generate UI nhất quán | Tạo `DESIGN.md`/design-tokens spec cho Nexus |
| [darelova/Awesome-Design-Resources-List](https://github.com/darelova/Awesome-Design-Resources-List) | Index công cụ màu/typography/inspiration | Chọn palette accent + type scale |
| [awesomelistsio/awesome-ui-components](https://github.com/awesomelistsio/awesome-ui-components) | Catalog component pattern | Tham chiếu pattern segmented control, bottom-nav, empty state |

Inspiration (không phải repo, để so visual): Mobbin → Health & Fitness, Dribbble tag `health-app`, DesignRush "Best Health & Wellness 2026".

> Lưu ý ràng buộc: các repo React/Tailwind chỉ dùng để **tham chiếu pattern**, không import — Nexus vẫn CSS thuần single-file.

---

## 4. Đề xuất transform (gom thành quyết định)

### 4.1 Design tokens (sửa `:root`, dòng 14–64)
- **Type scale chuẩn hóa:** `--fs-caption:11 / --fs-body:13 / --fs-title:15 / --fs-metric:28`; bỏ 9px, nâng 10px→11px tối thiểu.
- **Tách active vs success:** thêm `--vita-active` riêng (đề xuất accent trung tính / surface-raised + text sáng) để gỡ green khỏi vai trò "active".
- **Touch target token:** `--tap-min: 44px` áp cho mọi button/tab.
- **Safe-area:** thêm `env(safe-area-inset-*)` vào topbar pad-top và content pad-bottom.

### 4.2 Navigation
- Chuyển primary nav (Today/Vita/Calendar/Actions) xuống **bottom tab bar** (icon + nhãn, ≥44px, có safe-area) — đúng HIG cho phone, giải phóng topbar.
- Vita: gộp `range-row` thành segmented chip cuộn ngang trong content, không stack trong topbar.
- Đổi nhãn "Actions" → "Duyệt"; thống nhất ngôn ngữ nhãn (Việt).

### 4.3 Component polish
- Snapshot Today: thêm progress (ring/pbar tái dùng) cho mỗi metric.
- Actions: phân tầng nút (batch = primary, per-item = ghost); thêm Clear; trạng thái approved rõ (✓ + "Đã thêm").
- Calendar empty state: thêm CTA connect.
- Chuẩn hóa radius (card lg / nested md).

### 4.4 PWA hygiene (đúng use-case bookmark iPhone)
- Thêm meta `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, theme-color; cân nhắc inline manifest. (Không thêm CDN — chỉ meta tags.)

---

## 5. Phasing thực thi

> Theo SDD: plan này là RD-lite cho UI. Mỗi phase nên có BD riêng giao Codex; Opus review.

| Phase | Nội dung | Tại sao trước | Rủi ro |
|---|---|---|---|
| **P1 — Foundation** (4 🔴) | Type scale, tách active/success token, touch-target ≥44px, safe-area | Nền tảng, kéo theo phần lớn friction; thuần token + CSS | Thấp — chỉ CSS, không đổi DOM logic |
| **P2 — Navigation** | Bottom tab bar, gỡ stack tab Vita, đổi nhãn/ngôn ngữ | Phụ thuộc P1 (token, safe-area) | Trung — đụng cấu trúc topbar + showView |
| **P3 — Component polish** | Snapshot progress, Actions button hierarchy + Clear + approved state, calendar empty CTA, radius, PWA meta | Tinh chỉnh sau khi khung ổn | Thấp–trung |

**Verify mỗi phase:** mở `health-app/dashboard.html` trên viewport 390–430px, kiểm 3 trạng thái (no-data/empty, có data, error), đo tap target ≥44px, đọc được ở khoảng cách tay cầm.

**Scope guard:** không đổi màu nền/design language, không đụng JS API/validation, không thêm CDN — đúng handoff §7.

---

## 6. Open questions (cần user chốt trước khi viết BD)

1. **Bottom nav** — đồng ý chuyển primary nav xuống đáy không? (thay đổi cấu trúc rõ rệt nhưng đúng HIG)
2. **Ngôn ngữ nhãn** — chốt Việt-chủ-đạo (giữ brand tiếng Anh) hay giữ Anh?
3. **Accent "active" mới** — muốn 1 màu accent riêng (vd xanh dương/`--vita-info`) hay dùng neutral surface-raised?
4. **"Plan My Week"** — giữ ở Actions hay chuyển sang Calendar?
5. Phase nào ưu tiên ship trước — chỉ P1 (an toàn, impact cao) hay P1+P2 cùng đợt?

> **Đã chốt:** Q-naming → tab 4 = **"Approval"** + badge đếm (mockup: `docs/mockup-tab4-naming.html`).

---

## 7. Research addendum (2026-05-30) — đối chiếu deep-dive report với code

Report UX/UI chuyên sâu được rà với code thật. Kết quả:

### 7.1 Đính chính — vài critique của report KHÔNG còn đúng với code hiện tại
- **Snapshot Today KHÔNG phải "4 ô text thuần".** Thực tế dùng `metric-grid` 2 cột + `renderMetricHeroCard`, **đã có `pbar/pfill` + "% mục tiêu"** (`dashboard.html:523,583,577`). → Sửa lại **[B.5]**: không phải "thiếu progress" mà là cơ hội **bento-hierarchy** (cho kcal thành hero `.span2`, tái dùng `.hero-cal`/`.span*` đã có sẵn).
- **Insight card đã chunk.** `renderInsightCard` đã bullet hoá khi >1 tip + có param `accent` (`:593,599`). → Sửa **[B.6]**: việc cần làm là **color-by-status** (truyền `--vita-good`/`--vita-warn`/`--vita-bad` theo ngữ cảnh) chứ không phải "chunk từ đầu".
- **Approved đã có ✓.** `proposal-ok ✓` render sẵn (`:611`). → Sửa **[C.11]**: nâng cấp là **collapse animation** (thu gọn chiều cao), không phải "thêm dấu tích".
- **conic-gradient không cần.** App đã có `renderRing()` SVG (`:1634`) — tái dùng, không thêm kỹ thuật mới.

### 7.2 Mục MỚI đáng apply — trong scope §7 (CSS + render)
- **Inbox/Approval + badge đếm** (đã chốt Approval). — [A.1]
- **Segmented control** cho range 7/14/30/90 (phân biệt lọc vs chuyển trang). — củng cố [A.3]
- **Insight color-by-status** (viền/nền theo good/warn/bad). — [B.6]
- **Proposal `.selected` → elevation** (`--vita-surface-raised` + box-shadow) thay vì chỉ viền; **`.approved` → collapse**. — [C.10/C.11]
- **Batch "Duyệt tất cả" → `position: sticky`** mép dưới, trên safe-area. — [C.10]
- **Nút Clear "✕"** trên textarea (hiện khi length>0). — [C.9]

### 7.3 Nâng severity
- **[F.22] safe-area → 🔴 Blocker (có điều kiện):** nếu chọn bottom nav, bắt buộc `viewport-fit=cover` + `env(safe-area-inset-bottom)` nếu không Home Indicator iPhone đè nút. Report đúng.

### 7.4 Optional — VƯỢT scope §7, cần mở scope JS-behavior (chờ user quyết)
- **Fix keyboard đẩy vỡ viewport** (Safari resize visual-viewport): cần listener `visualViewport` + `scrollIntoView`.
- **"1-Tap Paste & Validate"** (`navigator.clipboard.readText()` từ user gesture): bỏ luồng textarea-first; lưu ý iOS popup "Allow paste".
- **Plan My Week → FAB + bottom-sheet trong Calendar** (thay vì nút tĩnh trong Approval tab): thay đổi thiết kế lớn hơn [A.4].

> Ba mục 7.4 đều cần JS UI mới + phụ thuộc quirk Safari → không nằm trong "review HTML/CSS/render" thuần. Chờ user đồng ý mở scope.

---

## 8. Research addendum 2 (2026-05-30) — Bento mobile, semantic color, empty states

Deep-dive thứ 2 (Bento grid mobile + dark-OLED color). Phần dùng được:

### 8.1 🆕 Nguyên lý màu trên OLED nền siêu tối — lời giải cụ thể cho [E.17]+[E.18]
- **Quy tắc vàng:** trên `#090A0F`, **chữ nhỏ (10–12px) KHÔNG dùng màu chức năng bão hoà** (gây "vibrate", mỏi mắt, tương phản yếu) → **text = xám trung tính** (`#E5E5EA` ~ trắng 86%, đã gần với `--vita-text`); **chỉ đổ màu rực lên đồ hoạ**: icon, viền ring, thanh bar, chấm trạng thái.
- Áp dụng: rà các chỗ đang tô màu chức năng lên *chữ* (vd `metric-hero-val` đang `style="color:var(--vita-energy)"`, `da-kcal`, `mi-kcal` màu green…) → cân nhắc chuyển số về neutral, giữ màu ở pbar/ring/icon. Giảm bão hoà (desaturate) các token nếu cần (Apple HIG / Material 3 Dark).
- *Lưu ý:* bảng contrast trong report tính trên nền `#12131A`, app dùng `#151720` — dùng nguyên lý, không bê số tuyệt đối; nếu cần thì đo lại bằng APCA/WCAG.

### 8.2 Bento mobile = 2 cột (không 4) — refine [E.20]/[B.5]
- `.bento` hiện là `repeat(4,1fr)` → ô 1x1 ~95px, chật cho số 28px. **Đổi base về 2-col + dùng `.span*`** (đã có sẵn). Today (`metric-grid`) vốn đã 2-col → ổn.
- **Layout Today bất đối xứng (spec cụ thể):** Kcal = hero `span2` (thanh ngang dài) · Protein + Steps = `span1` (ring đồng tâm) · Sleep = `span2` (cột mini). Hiện thực hoá "Size = Hierarchy".

### 8.3 Empty state = CTA tile, không phá grid — mở rộng [D.16]
- Ô Bento trống / chưa connect Google → biến thành **khối CTA tương tác** ("Kết nối →") thay vì banner lỗi dạng list. Giữ nguyên grid bo tròn.

### 8.4 ✅ Validate lựa chọn hiện tại — KHÔNG đổi
- **Proposal dùng vertical scroll list** (đang làm) **thắng** Tinder-swipe: quét toàn cảnh, dễ undo, đỡ mỏi tay. → Giữ nguyên, không chuyển swipe.

### 8.5 Inspiration keywords (Mobbin/Behance/Dribbble)
- "mobile bento grid health", "AI input vertical approval flow", "iOS segmented control dark", "dark mode dashboard onboarding empty state".
