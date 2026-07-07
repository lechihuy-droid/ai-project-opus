# Design System: Việt Nhật Hub (viet-japan-app)

Contract cho coding agent. Nguồn gốc: báo cáo UI/UX Giai đoạn 1 + growth-plan-final.md + implementation hiện tại (đã verify bằng screenshot 2026-07-07). Khi sửa UI, tuân thủ file này; muốn đổi rule phải sửa file này trong cùng PR.

## 1. Visual Theme & Atmosphere

Clean Japanese Minimalist, consumer-friendly (KHÔNG phải dashboard vận hành). Nền sáng dịu, thẻ trắng bo tròn lớn, nhiều khoảng thở, viền 1px siêu mảnh, bóng đổ rất nhẹ. Cảm giác: đáng tin + thân thiện với người đi làm, không trẻ con. Mobile-first tuyệt đối — khung app `max-w-md` (28rem) canh giữa; desktop chỉ là mobile phóng giữa màn hình.

## 2. Color Palette & Roles

Token ở `app/globals.css` (`:root` + `@theme inline`). Dùng class Tailwind `bg-primary`, `text-accent`… — KHÔNG hardcode hex mới.

| Token | Hex | Vai trò — chỉ dùng cho |
|---|---|---|
| `primary` | #4F46E5 | Hành động chính, link, tab active, nhấn thương hiệu |
| `accent` | #10B981 | Thành công, nút "kiểm tra", tag "còn chỗ", điểm số tốt |
| `line` | #06C755 | ĐỘC QUYỀN nút LINE Login/đăng ký qua LINE. Không dùng chỗ khác |
| `alert` | #F43F5E | Lỗi, đáp án sai, xóa tài khoản. Không dùng trang trí |
| `ink` | #0F172A | Văn bản chính; nền "offer card" (thẻ bán hàng nền tối) |
| `surface` | #F8FAFC | Nền body |
| amber-500 | — | Chỉ cho waitlist/hàng chờ + streak 🔥 |
| gradient pink→purple | — | ĐỘC QUYỀN nút "Chia sẻ lên Stories" |

Text phụ: slate-500; meta nhỏ: slate-400; viền: slate-200/100.

## 3. Typography Rules

- Font: Inter (Việt) + Noto Sans JP (kanji/kana) qua `next/font`, biến `--font-inter`, `--font-noto-jp`. Không thêm font khác.
- Scale Major Third: Body 16px/1.5 · H3 20px · H2 25px · H1 31.25px (mobile được clamp xuống 24–26px bằng `text-[26px]!` — cho phép).
- Nội dung bài đọc (tips): 16px, line-height 1.7, đoạn ngắn có khoảng nghỉ.
- Meta/caption: 12–13px slate-500. KHÔNG để text tương tác dưới 14px trừ link pháp lý footer.
- Copy CTA bắt buộc theo growth plan: ghi thời gian ("2 phút", "30 giây") + phá friction ("không cần đăng ký, không xin SĐT"). CẤM chữ "đề thật" trong mọi copy quiz.

## 4. Component Stylings

- **Bento card** (`.bento`): nền trắng, viền 1px #E2E8F0, radius 16px, shadow rgba(0,0,0,0.04)/12px. Mọi khối nội dung là bento — không tạo kiểu card thứ hai.
- **Offer card** (bán hàng — M1 waitlist…): nền `ink`, chữ trắng, radius 16px, eyebrow chữ emerald-400 uppercase 12px, giá in đậm ngay trong tiêu đề, nút `accent`. Chỉ dùng khi hiển thị offer có giá.
- **Lead magnet box**: nền `primary`, chữ trắng, input trắng + nút `accent`, dòng cam kết APPI 11px dưới cùng.
- **Nút**: `.tap` min-height 48px; radius 16px (`rounded-2xl`) cho CTA chính, 12px (`rounded-xl`) cho phương án quiz/nút phụ; `active:scale-[0.98]`; nút ghim đáy có shadow màu cùng họ (`shadow-indigo-200`, `shadow-emerald-200`).
- **CTA ghim đáy**: fixed trên BottomNav (`bottom-[64px]`), 1 nút duy nhất/trang + 1 dòng caption 12px phá friction. Trang có CTA ghim phải chừa `pb-24`/`pb-28`.
- **BottomNav**: 56px, 4 tab cố định [Hub, Sự kiện, Cẩm nang, Hồ sơ], active = `primary`. Ẩn hoàn toàn ở `/quiz`.
- **Facepile**: avatar 36px chồng -10px, viền trắng 2px, chữ cái đầu trên nền màu từ palette 8 màu trong `lib/data.ts`, chip "+N" cuối.
- **Badge trạng thái**: pill 11px semibold — "Còn chỗ" emerald-50/accent, "Hàng chờ" rose-50/alert, "✓ Đã xác minh" indigo-50/primary.
- **Bottom sheet** (xác nhận vé, xóa tài khoản): overlay black/40, sheet trắng `rounded-t-3xl`, animation `.pop-in`.
- **Ảnh bìa sự kiện**: CSS gradient + emoji lớn (chưa dùng ảnh thật) — tỷ lệ 16:9 ở detail, h-24/28 ở card.

## 5. Layout Principles

- 1 cột dọc, gap 12px (`gap-3`), padding ngang 16px (`px-4`).
- Thumb zone: mọi CTA chính nằm 2/3 dưới màn hình; 1/3 trên chỉ hiển thị thông tin.
- Một mục tiêu/màn hình: mỗi trang đúng 1 primary CTA. Tối đa 8 ô bento trên first viewport của Hub.
- Flat architecture: không menu phụ, không dropdown; điều hướng = bento card + bottom nav + breadcrumbs (chỉ ở tips).
- Landing = chính hành động: `/quiz` vào thẳng câu 1, không màn giới thiệu.

## 6. Interaction, States & Accessibility

- Delayed signup: mọi nội dung xem được ẩn danh; login (LINE) chỉ xuất hiện tại điểm LƯU/ĐĂNG KÝ.
- Quiz: chọn → nút "Kiểm Tra Đáp Án" đổi slate→accent; sau check: đúng = emerald-50/viền accent + "✓", sai = rose-50/viền alert + "✗", giải thích pop-in ngay, không chờ hết bài.
- Trạng thái nút async: disabled + đổi label ("Đang xác thực qua LINE…"), không spinner riêng.
- Sự kiện full: CTA tự chuyển amber "Đăng Ký Vào Hàng Chờ (N người đang đợi)".
- Chủ đề SHAME (CV/visa/tiền cá nhân): CẤM leaderboard, CẤM "X người đang xem"; riêng tư là feature. Facepile chỉ dùng cho event (không shame).
- Tracking bắt buộc: hành động conversion mới phải gọi `track("object_action", {...})` từ `lib/tracking.ts`; link SNS luôn mang `?pid=`.
- A11y tối thiểu: chạm ≥48px; chữ đọc ≥16px; scroll-target có `scroll-mt-24` khi có sticky TOC; text slate-400 chỉ cho meta không quan trọng.

## 7. Agent Rules

1. Đọc file này + `lib/data.ts` trước khi thêm màn hình. Dữ liệu mới → thêm vào `lib/data.ts`, không hardcode trong component.
2. Không thêm màu ngoài bảng mục 2. Không dùng `line` green ngoài nút LINE.
3. Không thêm feature Phase 2 (feed, chat, forum, native app) — growth plan cấm tuyệt đối.
4. Emoji làm icon là quyết định có chủ đích của app này (khác bias SVG của Opus Vita) — giữ nguyên, không thay bằng icon lib khi chưa có quyết định mới.
5. Backend chưa tồn tại: mọi side-effect mới phải mock + đánh dấu `TODO(backend)`.
6. Trang mới có CTA ghim đáy: nhớ `pb-24`+ và caption phá friction.
7. Không chạy `npm run build` khi dev server đang chạy (hỏng `.next`, server treo).
8. Sau khi sửa UI: verify bằng screenshot ở viewport 390×844, không chỉ đọc code.
