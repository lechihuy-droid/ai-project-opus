import Link from "next/link";
import { events, tips, communityStats, partners } from "@/lib/data";

// ── Màn hình 1: Bento Hub — Link-in-bio đón traffic từ SNS ──
export default function Home() {
  const featured = events[0];
  const latestTip = tips[0];

  return (
    <main className="flex flex-col gap-3 px-4 pt-6 pb-24">
      {/* Header tối giản — không menu, đúng flat architecture */}
      <header className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
            V
          </span>
          <span className="font-semibold text-[17px]">Việt Nhật Hub</span>
        </div>
        <Link
          href="/profile"
          className="tap px-4 flex items-center rounded-full border border-slate-200 bg-white text-sm font-medium"
        >
          Hồ sơ
        </Link>
      </header>

      {/* 👑 Hero Card — truyền tải giá trị trong 5 giây */}
      <section className="bento p-5">
        <p className="text-[13px] font-semibold text-accent uppercase tracking-wide mb-1">
          Dành cho người Việt tại Nhật 🇻🇳🇯🇵
        </p>
        <h1 className="text-[26px]!">
          Cẩm nang, sự kiện & luyện thi — tất cả trong một chạm
        </h1>
        <p className="text-slate-500 text-[15px] mt-2">
          Không cần tài khoản để bắt đầu. Đọc cẩm nang, xem sự kiện, làm quiz
          ngay.
        </p>
      </section>

      {/* Ô Bento chính: sự kiện nổi bật đang mở đăng ký */}
      <Link href={`/events/${featured.slug}`} className="bento overflow-hidden block active:scale-[0.98] transition-transform">
        <div
          className="h-28 flex items-center justify-center text-5xl"
          style={{ background: featured.cover }}
        >
          {featured.emoji}
        </div>
        <div className="p-4">
          <p className="text-[12px] font-semibold text-primary uppercase tracking-wide mb-1">
            📅 Sự kiện nổi bật
          </p>
          <h3 className="text-[17px]!">{featured.title}</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            {featured.date} · {featured.area} · còn{" "}
            {featured.capacity - featured.registered} chỗ
          </p>
        </div>
      </Link>

      {/* Cặp ô Bento phụ đối xứng */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/quiz" className="bento p-4 active:scale-[0.98] transition-transform">
          <span className="text-3xl">📝</span>
          <h3 className="text-[15px]! mt-2">Thử sức 5 câu quiz N2</h3>
          <p className="text-[12px] text-slate-500 mt-1">
            2 phút · không cần đăng ký, không xin SĐT
          </p>
        </Link>
        <Link href={`/tips/${latestTip.slug}`} className="bento p-4 active:scale-[0.98] transition-transform">
          <span className="text-3xl">💡</span>
          <h3 className="text-[15px]! mt-2">Hỏi đáp hoàn thuế 2026</h3>
          <p className="text-[12px] text-slate-500 mt-1">Đọc miễn phí 8 phút</p>
        </Link>
      </div>

      {/* Cẩm nang mới nhất */}
      <Link href="/tips" className="bento p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
        <span className="text-3xl">📚</span>
        <div className="flex-1">
          <h3 className="text-[15px]!">Cẩm nang mới nhất</h3>
          <p className="text-[13px] text-slate-500">
            Thuế, Nenkin, visa, đổi bằng lái — {communityStats.guidesPublished}{" "}
            bài hướng dẫn
          </p>
        </div>
        <span className="text-slate-300 text-xl">›</span>
      </Link>

      {/* Footer card — social proof + đối tác tạo trust */}
      <section className="bento p-4">
        <p className="text-center text-[15px]">
          🤝 <b>{communityStats.members.toLocaleString("vi-VN")}</b> thành viên ·{" "}
          <b>{communityStats.eventsHosted}</b> sự kiện đã tổ chức
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {partners.map((p) => (
            <span
              key={p}
              className="text-[12px] px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-medium"
            >
              {p}
            </span>
          ))}
        </div>
        <p className="text-center text-[11px] text-slate-400 mt-3">
          <Link href="/privacy">Quyền riêng tư (APPI)</Link> ·{" "}
          <Link href="/legal">Thông tin giao dịch</Link>
        </p>
      </section>

      {/* Primary CTA ghim đáy màn hình — vùng ngón cái */}
      <div className="fixed bottom-[64px] inset-x-0 z-30 px-4 pb-2 pointer-events-none">
        <div className="max-w-md mx-auto">
          <Link
            href={`/events/${featured.slug}`}
            className="tap pointer-events-auto flex items-center justify-center w-full rounded-2xl bg-primary text-white font-semibold text-[16px] shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
          >
            Tham Gia Cộng Đồng Ngay
          </Link>
        </div>
      </div>
    </main>
  );
}
