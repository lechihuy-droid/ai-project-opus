# Design System: Web App Platform Người Việt tại Nhật (Phase 1)

> Design contract cho coding agent (Codex). Nguồn: plan kinh doanh v2.1 tab 13 (`docs/plan-viet-japan-platform.html`) + 10 design reference đã research 2026-07-06 (§13.9).
> Trạng thái: **pre-brand** — tên/logo chưa chốt; token màu dưới đây là placeholder có chủ đích, đổi 1 chỗ khi có brand.
> Khi repo web app được tạo, file này chuyển vào root repo thành `DESIGN.md`.

## 1. Visual Theme & Atmosphere

- Cảm giác chủ đạo: **đáng tin + ấm áp cộng đồng**, không "corporate lạnh", không "app game lòe loẹt".
- Một chữ định vị mọi màn hình: *"senpai chỉ đường"* — rõ ràng, cụ thể, không phô trương.
- Nền sáng (light theme only ở beta). Không dark mode cho đến khi có tín hiệu user cần.
- Mật độ: thoáng ở phễu khách mới (landing, quiz), đặc hơn ở khu quản lý (profile, admin).
- Trang trí tối thiểu; "đẹp" đến từ ảnh cộng đồng thật + con số minh bạch, không từ gradient/hiệu ứng.

## 2. Color Palette & Roles

Stack: Tailwind + shadcn/ui — map vào CSS variables của shadcn (`--primary`, `--destructive`…).

| Token | Giá trị (placeholder) | Vai trò — CHỈ dùng cho |
|---|---|---|
| `--navy-900` | `#0B2239` | Màu tin cậy: header, bottom nav active, badge trust cấp cao, chữ tiêu đề |
| `--action-600` | `#2563EB` | MỘT màu hành động duy nhất: CTA, link, nút primary, focus ring |
| `--action-050` | `#EFF6FF` | Nền nhấn nhẹ cho khối liên quan hành động (thẻ metric, ghost button) |
| `--verify-600` | `#0D9488` (teal) | Riêng cho hệ verify/trust: badge "Đã kiểm chứng", tick minh bạch chi phí |
| `--success-600` | `#059669` | Kết quả tốt: điểm quiz đạt, đăng ký thành công |
| `--warn-600` | `#D97706` | Thận trọng: sắp hết chỗ, sắp hết hạn |
| `--danger-600` | `#DC2626` | **ĐỘC QUYỀN cảnh báo lừa đảo/an toàn/xóa dữ liệu.** Cấm dùng trang trí, cấm dùng cho giá tiền, cấm dùng cho badge thường |
| `--gray-*` | Tailwind `slate` scale | Trung tính: nền `slate-50`, viền `slate-200`, chữ phụ `slate-500`, chữ chính `slate-800` |

Quy tắc cứng:
- Đỏ = nguy hiểm là **tài sản ngữ nghĩa** của trust system (plan §5.3). Vi phạm quy tắc đỏ = reject PR.
- Không thêm màu thứ 9. Muốn "nổi bật hơn" → dùng cỡ chữ/khoảng trắng, không thêm màu.
- Contrast tối thiểu AA (4.5:1 chữ thường, 3:1 chữ lớn) — mọi cặp màu trên nền đã chọn theo chuẩn này.

## 3. Typography Rules

- Font: **system font stack** (`font-sans` mặc định của Tailwind). Không tải webfont — phục vụ mục tiêu <3s trên 4G và hiển thị tiếng Việt chuẩn mọi máy.
- Scale 4 cỡ, không thêm cỡ lẻ:
  - `text-base` 16px — thân bài, **cỡ tối thiểu tuyệt đối** (không có chữ 14px trong nội dung; 14px chỉ cho caption/metadata `text-sm text-slate-500`)
  - `text-lg` 18px — lead, câu hỏi quiz
  - `text-2xl` 22–24px — tiêu đề màn hình
  - `text-3xl` 28–30px — chỉ hero landing
- `line-height` ≥1.6 cho thân bài — dấu tiếng Việt (ắ, ễ, ộ) cần headroom, line-height chật sẽ cắt dấu.
- Số tiền: luôn `font-semibold tabular-nums`, kèm `¥` — tiền là nội dung hạng nhất (pattern Tokyo Cheapo/Japan Dev), không bao giờ là chữ xám nhỏ.
- Thuật ngữ Nhật giữ nguyên kèm giải thích 1 lần: "nenkin (lương hưu)". Không dịch máy.

## 4. Component Stylings

7 component lõi (plan §13.6) — mỗi cái ghi cấu trúc + trạng thái bắt buộc:

### 4.1 Nút CTA
- Primary: nền `--action-600`, chữ trắng, `rounded-lg`, cao ≥48px trên mobile, full-width trong form.
- Ghost: nền `--action-050`, chữ `--navy-900`.
- Mỗi màn hình **một** primary CTA duy nhất (pattern Luma). Có ≥2 việc → 1 primary + ghost.
- States: default / pressed (darken 10%) / loading (spinner + disable, giữ nguyên width) / disabled (slate-300).

### 4.2 Card event
- Cấu trúc dọc: ảnh kỳ trước (16:9) → tên + ngày giờ → địa điểm/vùng → **dòng chi phí** → badge trust host → chỗ còn lại.
- Chi phí hiện NGAY trên card, trước khi bấm (pattern Luma/Japan Dev): "Tự túc ~¥3.000" hoặc "Miễn phí".
- Chỗ còn lại dùng `--warn-600` khi ≤5: "Còn 3 chỗ".
- Trang chi tiết event: 1 cột duy nhất, 1 nút đăng ký (pattern Luma); bảng chi phí công khai (4.7) đặt TRÊN nút đăng ký.

### 4.3 Badge trust (3 cấp — component "chở" moat)
- Cấp 1 "Đã xác minh pháp nhân": viền `--verify-600`, nền trắng, icon tick.
- Cấp 2 "Đã có giao dịch thành công": nền `--verify-600` nhạt 10%, chữ `--verify-600`.
- Cấp 3 "Đối tác dài hạn": nền `--navy-900`, chữ trắng.
- Bấm vào badge → popover giải thích tiêu chí cấp đó bằng 1 câu (pattern Japan Dev: kiểm duyệt phải nói được tiêu chí, không chỉ hô con số).
- Tin/DN không có badge = không hiển thị badge giả, không placeholder.

### 4.4 Thanh tiến độ / streak
- Progress bar `--action-600` trên nền `slate-200`, kèm số "12/30 bài".
- Streak: đếm ngày + lịch tuần 7 ô; giọng **mềm** (pattern Renshuu): mất streak → "Nghỉ hôm qua à? Học lại là quay về ngay" — cấm ngôn ngữ tội lỗi/đe dọa.
- Gamification tiết chế (bài học ngược từ Duolingo): không gem, không quà ảo, không popup chúc mừng chồng nhau. Một moment vui duy nhất: hoàn thành quiz.

### 4.5 Share card template (OG image)
- Khung 1200×630: nền `--navy-900`, kết quả cá nhân cỡ lớn ("85% đề N2 thử"), tên user, logo + domain góc dưới.
- Sinh động theo user (dynamic OG) — mỗi lượt share là 1 quảng cáo, phải đẹp hơn mọi màn hình khác.

### 4.6 Form 1 cột
- Mọi form là 1 cột, label trên input, không placeholder-làm-label.
- Input cao ≥48px, `text-base` (16px — tránh iOS auto-zoom).
- Lỗi: viền + chữ `--danger-600`… **ngoại lệ duy nhất** của quy tắc đỏ, kèm cách sửa cụ thể ("Email thiếu @").
- Đăng ký = 1 bước duy nhất qua SNS button (Google/Facebook/LINE, đúng logo guideline từng hãng); form email là fallback.

### 4.7 Bảng chi phí công khai
- Bảng 2 cột khoản → số tiền `tabular-nums`, dòng cuối "Tổng" đậm.
- Tick `--verify-600` + chú thích "Không thu thêm khoản nào khác".
- Bắt buộc có mặt ở: chi tiết event, trang khóa học, (Phase 2) tin đăng có phí.

## 5. Layout Principles

- Mobile-first: thiết kế ở 390px; content column `max-w-md` giữa màn hình lớn; desktop là bản phóng to, không layout riêng ở beta.
- **Bottom nav 4 mục cố định: Học · Event · Tips · Tôi** — icon + chữ, active = `--navy-900`. Không hamburger menu (bài học ngược GaijinPot: nav chữ chi chít). Admin nằm ngoài nav, route riêng.
- Quy tắc độ sâu: mọi giá trị chính ≤2 chạm từ trang chủ.
- Vùng ngón cái: CTA chính luôn ở nửa dưới màn hình; không action quan trọng ở góc trên trái.
- Spacing nhịp 4px (Tailwind mặc định); giữa các khối dùng `space-y-4`/`space-y-6`, không giá trị lẻ.
- Radius thống nhất: `rounded-lg` (8px) cho card/nút, `rounded-full` chỉ cho badge/avatar. Không mix.
- Ảnh: luôn `aspect-ratio` cố định + `loading="lazy"` + nén WebP — ngân sách trang <200KB ngoài ảnh.

## 6. Interaction, States & Accessibility

- Tap target ≥44×44px mọi phần tử bấm được.
- Mọi component có đủ 3 trạng thái phụ: **loading / rỗng / lỗi** — lời tiếng Việt tử tế, empty state luôn kèm 1 hành động ("Chưa có event vùng bạn — Đăng ký nhận tin →"). Cấm empty state trắng.
- Delayed signup là LUẬT (pattern Duolingo): quiz làm được ẩn danh từ đầu đến cuối; chỉ mời đăng nhập ở màn kết quả với lý do 1 câu ("Đăng nhập để lưu tiến độ"). Không modal chặn giữa chừng.
- Onboarding sau đăng ký: 1 câu hỏi persona duy nhất ("Bạn đang: Du học / Đi làm kỹ sư / Tokutei / Định cư") → cá nhân hóa nội dung (pattern Renshuu). Không wizard 5 bước.
- Focus ring hiện rõ (`--action-600`, 2px) — không `outline: none`.
- Không truyền thông tin bằng màu đơn thuần: badge có chữ, lỗi có icon + text.
- Animation: chỉ transition ≤200ms cho hover/press; tôn trọng `prefers-reduced-motion`. Không animation trang trí.
- Ngày giờ event: thứ + ngày + giờ JST đầy đủ ("CN 15/3 · 9:00") — audience làm ca kíp, mọi mơ hồ về giờ là mất người.

## 7. Agent Rules

Trước khi viết/sửa UI, coding agent PHẢI:

1. Đọc file này; mọi màu lấy từ bảng §2 — **cấm hex mới**, cấm dùng đỏ ngoài cảnh báo an toàn/lừa đảo/lỗi form/xóa.
2. Dùng shadcn/ui component có sẵn trước, custom sau; custom thì theo token §2–§5.
3. Mỗi PR UI tự trả lời 5 câu (từ 5 nguyên tắc UX plan §13.2): dùng được 1 ngón cái? cho giá trị trước khi hỏi đăng ký? có trust cue nhìn thấy được? nặng thêm bao nhiêu KB? lời thoại có giọng "senpai" không?
4. Component mới = phải nộp đủ 3 trạng thái loading/rỗng/lỗi ngay trong PR đầu.
5. Không thêm: dark mode, webfont, animation library, icon emoji trong UI sản phẩm (dùng lucide-react), popup marketing.
6. Số tiền và ngày giờ theo format §3/§6 — không tự chế format.
7. Đụng đến dữ liệu profile (visa/trình độ) → đối chiếu ranh giới APPI (plan §13.5) trước khi code.

---

## Phụ lục: Nguồn pattern (mine từ 10 reference §13.9)

| Pattern đã đưa vào contract | Học từ | Ở mục |
|---|---|---|
| Delayed signup, mời đăng nhập tại màn kết quả | Duolingo | §6 |
| Tiền hiện trước khi bấm, trial không cần thẻ | Bunpro, Luma | §4.2, §4.7 |
| Progress trực quan gắn cấp JLPT | MaruMori | §4.4 |
| Onboarding 1 câu hỏi persona; gamification mềm, tắt được | Renshuu | §4.4, §6 |
| Trang event 1 cột, 1 CTA, host duyệt đăng ký | Luma | §4.1, §4.2 |
| Event gắn community có số member thật | Doorkeeper | §4.2 (Phase 2 mở rộng) |
| Info-box chi phí + ngày cập nhật trên content | Tokyo Cheapo | §3, §4.7 |
| Tránh: nav chữ dày đặc, homepage không định vị | GaijinPot (phản ví dụ) | §5 |
| Badge kiểm duyệt nói được tiêu chí | Japan Dev | §4.3 |
| Filter/tag theo nỗi đau thật (mức tiếng Nhật, lương trên card) | TokyoDev | §4.2, Phase 2 job board |

Guardrail: chỉ mượn pattern hành vi/cấu trúc — không copy layout đặc trưng, màu brand, mascot, minh họa của bất kỳ trang nào.
