# BD — Intent Router Upgrade (viet-japan-app)

**Build plan cho coding agent.** Ngày: 2026-07-07.
Nguồn yêu cầu: `C:\Users\HUY\Downloads\deep-research-report (1).md` (Traffic Routing Hub) + review đối chiếu app hiện tại.
Đọc trước khi code: `DESIGN.md` (bắt buộc), `lib/data.ts`, `lib/tracking.ts`, `app/page.tsx`, `app/quiz/page.tsx`.

## 0. Bối cảnh & mục tiêu

App hiện tại là hub tĩnh (link-in-bio) với conversion flow tốt. Nâng cấp thành **intent router**: trang chủ đổi bố cục theo campaign SNS, đo lường ở cấp thẻ (card-level), lead capture ngay trên hub. Frontend-only, mock data — mọi side-effect mới phải mock + đánh dấu `TODO(backend)`.

**Không làm (Later, cấm scope creep):** booking/Calendly, mini-store/checkout, referral code engine, CRM/email automation, smart media widgets, feed/chat/forum.

## 1. Workstream A — Variant Engine (5 preset campaign)

**File mới: `lib/variants.ts`**

- Type `VariantId = "jlpt" | "event" | "visa" | "consultation" | "referral" | "default"`.
- Map `pid` prefix → variant: `P-N2*`/`P-01*` → `jlpt` · `P-EVENT*`/`P-02*` → `event` · `P-VISA*`/`P-03*` → `visa` · `P-CONSULT*` → `consultation` · `P-REF*` → `referral` · không có pid → `default`.
- Cho phép override test bằng query `?variant=jlpt` (ưu tiên cao nhất, không lưu).
- `getVariant(): VariantId` — đọc first-touch từ `lib/tracking.ts` (`getFirstTouch()`), pure client.
- Mỗi variant xuất config: thứ tự card + card nào là XL (tối đa **2 XL** trên first viewport):

| Variant | Card XL (P1) | Card M (P2) | Card S (P3, cuối) |
|---|---|---|---|
| `jlpt` | Quiz N2, Kết quả quiz của tôi* | Checklist visa, Cẩm nang | Sự kiện, Cộng đồng |
| `event` | Sự kiện nổi bật, Quiz N2 | Cẩm nang, Checklist | Cộng đồng |
| `visa` | Checklist visa (lead drawer), Cẩm nang mới nhất | Quiz, Sự kiện | Cộng đồng |
| `consultation` | Checklist visa, Cẩm nang | Sự kiện, Quiz | Cộng đồng |
| `referral` | Quiz N2 ("Xem bạn mạnh/yếu gì hơn bạn bè"), Sự kiện | Checklist, Cẩm nang | Cộng đồng |
| `default` | Sự kiện nổi bật, Quiz N2 | Checklist, Cẩm nang | Cộng đồng |

\* "Kết quả quiz của tôi" chỉ hiện khi localStorage có kết quả (xem Workstream E); nếu chưa có thì thế chỗ bằng card Sự kiện.

- Copy card theo variant đặt trong config (không hardcode trong JSX). Copy phải theo chuẩn DESIGN.md mục 3: lời hứa cụ thể + thời gian + phá friction. Ví dụ jlpt: "Kiểm tra điểm yếu N2 trong 3 phút — không cần đăng ký".

## 2. Workstream B — Card-level analytics + chuẩn hóa event names

**Sửa `lib/tracking.ts`:**

- Giữ nguyên first-touch/pid. Thêm helper `trackCard(event, cardId, extra)` tự gắn `{card_id, position, variant_id}`.
- **Đổi tên event hiện có** (grep toàn repo, đổi hết chỗ gọi):
  - `lead_email_submit` → `lead_submit` (thêm `offer_id`, `card_id` nếu có)
  - `event_waitlist_click`/`event_waitlist_done` → `waitlist_join` (click) / `waitlist_confirmed`
  - `page_view` → giữ, nhưng thêm `hub_view` riêng khi render trang chủ (kèm `variant_id`)
- **Event mới:** `card_impression` (card vào viewport — dùng `IntersectionObserver`, bắn 1 lần/card/session), `card_click` (kèm `cta_text`, `destination_type`), `drawer_open` (kèm `drawer_type`).
- Schema property bắt buộc mọi event: `{pipeline_id, src, ts}` (đã có) + card events thêm `{card_id, position, variant_id}`.

**Component mới: `components/TrackedCard.tsx`** ("use client") — wrapper nhận `cardId`, `position`, `href` hoặc `onClick`: gắn IntersectionObserver cho impression, track click, render children. Dùng cho mọi card trên hub.

## 3. Workstream C — Restructure trang chủ (`app/page.tsx`)

1. Chuyển trang chủ thành client component (hoặc tách `HomeClient.tsx`) vì cần đọc variant từ localStorage. Render lần đầu dùng variant `default` rồi swap sau mount để tránh hydration mismatch (chấp nhận flash nhẹ, ghi chú trong code).
2. **Bỏ sticky CTA "Tham Gia Cộng Đồng Ngay"** — trang chủ không dùng sticky CTA nữa (rule mới, xem Workstream F). Sticky CTA chỉ còn ở event detail và quiz result.
3. **Hero gọn + trust proof**: 1 câu value prop + số liệu thật từ `communityStats` ("1.284 thành viên · 32 sự kiện"), bỏ đoạn mô tả dài. Hero KHÔNG phải card XL, không CTA riêng.
4. Render card theo config variant (Workstream A), bọc bằng `TrackedCard`. Card XL = full-width có ảnh/gradient; card M = 1/2 hàng đôi hoặc full-width mỏng; card S = hàng đôi nhỏ.
5. Card mới "Kết quả quiz của tôi" (S): đọc localStorage `vjhub_quiz_result`, hiện điểm gần nhất + link `/quiz`.

## 4. Workstream D — Checklist lead drawer trên hub

**Component mới: `components/ChecklistDrawer.tsx`** ("use client"):

- Card "Tải checklist Visa/Nenkin tiếng Việt" trên hub → bấm mở **bottom sheet** (pattern sẵn có: overlay black/40 + `rounded-t-3xl` + `.pop-in` — xem `RegisterCTA.tsx`), KHÔNG chuyển trang.
- Form: email (bắt buộc) + 1 select optional "Bạn đang ở diện nào?" (Kỹ sư / Du học / Tokutei / Khác). Không hỏi thêm gì — progressive profiling.
- Submit → `track("lead_submit", {offer_id: "checklist-visa", card_id, variant_id})` → màn thành công ngay trong drawer ("Đã gửi! Kiểm tra hộp thư") + `TODO(backend)`.
- Mở drawer → `track("drawer_open", {drawer_type: "lead_checklist"})`.
- Copy tuân thủ APPI: dòng 11px "Chỉ dùng để gửi tài liệu — không spam" (giống `LeadMagnetBox`).
- Dữ liệu checklist (title, desc, offer_id) thêm vào `lib/data.ts`, không hardcode.

## 5. Workstream E — Việc đi kèm bắt buộc trong cùng PR

1. **Sửa lint `app/quiz/page.tsx`**: đang gọi `Date.now()` trong render khi `finished` (dòng tính `seconds`). Fix: lưu `endTime` bằng state khi `setFinished(true)`, tính seconds từ state.
2. **Lưu kết quả quiz vào localStorage** key `vjhub_quiz_result`: `{score, total, ts, weakPoints: string[]}` — ghi khi finish, để card "Kết quả quiz của tôi" đọc.
3. Quiz result + event detail giữ nguyên sticky CTA (được phép theo rule mới).

## 6. Workstream F — Cập nhật DESIGN.md

Sửa các mục sau (giữ format hiện có):

- Mục 5 Layout: thêm rule "Trang chủ KHÔNG dùng sticky CTA — sticky CTA chỉ ở quiz result và event detail. Trang chủ tối đa 2 card XL trên first viewport; card size phản ánh ưu tiên campaign, không phản ánh thẩm mỹ."
- Mục 6 Interaction: thêm "Mọi card trên hub phải bọc `TrackedCard` (impression + click). Event mới phải theo schema `object_action` + `{card_id, position, variant_id}` khi là card event."
- Mục 7 Agent Rules: thêm "Card trang chủ và copy theo campaign định nghĩa ở `lib/variants.ts` — không hardcode thứ tự card trong JSX."

## 7. Acceptance criteria (tự verify trước khi báo xong)

| # | Kiểm tra | Cách verify |
|---|---|---|
| 1 | `/?pid=P-N2-a&utm_source=tiktok` → quiz là card XL đầu tiên; `/?variant=visa` → checklist card đầu | Screenshot 390×844 từng variant |
| 2 | Console có `hub_view {variant_id}`, `card_impression`, `card_click` với đủ property | Mở DevTools console + `localStorage.vjhub_events` |
| 3 | Card checklist mở drawer, submit email → `lead_submit` + success trong drawer, không chuyển trang | Thao tác thật trên browser |
| 4 | Trang chủ không còn sticky CTA; event detail + quiz result vẫn còn | Screenshot |
| 5 | Làm hết quiz → `vjhub_quiz_result` có trong localStorage; quay về hub thấy card "Kết quả quiz của tôi" | Thao tác thật |
| 6 | Không còn `Date.now()` trong render quiz; `npm run lint` sạch | Chạy lint |
| 7 | `npm run build` pass (chỉ chạy khi dev server ĐÃ TẮT) | Build output |
| 8 | Tên event cũ (`lead_email_submit`, `event_waitlist_click`) không còn trong repo | grep |

## 8. Guardrails

- Tuân thủ `DESIGN.md` mục 7 (Agent Rules) — đặc biệt: không thêm màu mới, không đổi emoji sang icon lib, mock + `TODO(backend)` cho side-effect.
- **Không chạy `npm run build` khi dev server đang chạy** (hỏng `.next`).
- Verify bằng screenshot browser viewport 390×844, không chỉ đọc code.
- Không thêm feature ngoài scope mục 0. Mỗi dòng diff phải trace được về workstream A–F.
