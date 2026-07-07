# Việt Nhật Hub — Frontend (Giai đoạn 1)

Web app mobile-first đón traffic từ SNS cho cộng đồng người Việt tại Nhật.
Xây theo báo cáo "Nghiên cứu và Thiết kế Hệ thống UI/UX cho Nền tảng Việt - Nhật (Giai đoạn 1)".

**Chỉ có frontend** — toàn bộ dữ liệu là mock trong `lib/data.ts`. Backend sẽ cắm sau.

## Chạy

```bash
npm install
npm run dev        # mở http://localhost:3000
```

Mở bằng điện thoại hoặc thu nhỏ trình duyệt về ~390px để xem đúng trải nghiệm mobile.

## 6 màn hình

| Route | Màn hình |
|---|---|
| `/` | Bento Hub — link-in-bio, hero card, CTA ghim đáy |
| `/events` + `/events/[slug]` | Sự kiện kiểu Luma — facepile, host xác minh, LINE one-tap, waitlist tự động |
| `/tips` + `/tips/[slug]` | Cẩm nang SEO — breadcrumbs, TOC bám dính, Lead Magnet nhúng giữa bài |
| `/quiz` | Quiz N2 ẩn danh — fullscreen, giải thích tức thì, màn kết quả mời LINE login |
| `/profile` | Hồ sơ Bento — streak, minh bạch dữ liệu APPI, xóa tài khoản 3 bước |

## Design tokens (globals.css)

Indigo `#4F46E5` (chính) · Emerald `#10B981` (phụ) · LINE `#06C755` · bo góc 16px · nút ≥48px (thumb zone) · Bottom nav 56px · font Inter + Noto Sans JP · type scale Major Third 1.25.

## Bổ sung theo growth-plan-final.md (2026-07-07)

- **Tracking pipeline_id** (`lib/tracking.ts`): link SNS dạng `?pid=P-01-a&utm_source=tiktok` → first-touch lưu localStorage, mọi event `object_action` gắn `{pipeline_id, src}`. Xem log: console `[vjhub-track]` hoặc `localStorage.vjhub_events`.
- **Phiếu điểm + M1**: màn kết quả quiz có phiếu điểm từng câu, chỉ điểm yếu, và offer waitlist **thấy giá ¥4,900** (chưa thu tiền) để đo WTP.
- **P-EVENT đúng archetype A2**: cọc ¥1,000 hoàn khi check-in + bảng chi phí minh bạch theo khoản mục trên trang sự kiện.
- **Trang pháp lý**: `/privacy` (APPI) và `/legal` (特定商取引法 + chính sách hoàn) — bản nháp, cần điền tên đơn vị thật trước khi thu tiền.
- **DESIGN.md**: design contract cho agent — đọc trước khi sửa UI.

## Điểm cắm backend (tìm `TODO(backend)`)

- `components/RegisterCTA.tsx` — thay mô phỏng bằng LIFF SDK (`liff.login`) + API RSVP/waitlist
- `components/LeadMagnetBox.tsx` — POST email + gửi file
- `components/DeleteAccountFlow.tsx` — API xóa dữ liệu + email xác nhận
- `lib/data.ts` — thay mock bằng fetch Supabase/API
- Chưa làm (đúng scope Giai đoạn 1): Plausible proxy, Dynamic OG image (@vercel/og), Google/Facebook auth

## Stack

Next.js 16 (App Router, SSG toàn bộ) · Tailwind CSS v4 · TypeScript.
