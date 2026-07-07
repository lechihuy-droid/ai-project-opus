import Link from "next/link";
import { notFound } from "next/navigation";
import { events } from "@/lib/data";
import Facepile from "@/components/Facepile";
import RegisterCTA from "@/components/RegisterCTA";

export function generateStaticParams() {
  return events.map((ev) => ({ slug: ev.slug }));
}

// ── Màn hình 2: Landing Page chi tiết sự kiện (Luma style) ──
export default async function EventDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ev = events.find((e) => e.slug === slug);
  if (!ev) notFound();

  const soldOut = ev.registered >= ev.capacity;

  return (
    <main className="flex flex-col gap-3 px-4 pt-4 pb-28">
      {/* Thanh trên: quay lại + chia sẻ */}
      <div className="flex items-center justify-between">
        <Link
          href="/events"
          className="tap px-4 flex items-center rounded-full bg-white border border-slate-200 text-sm font-medium"
        >
          ‹ Quay lại
        </Link>
        <button className="tap px-4 flex items-center rounded-full bg-white border border-slate-200 text-sm font-medium">
          Chia sẻ ↗
        </button>
      </div>

      {/* Ảnh bìa 16:9 */}
      <div
        className="aspect-video rounded-2xl flex items-center justify-center text-7xl"
        style={{ background: ev.cover }}
      >
        {ev.emoji}
      </div>

      <h1 className="text-[24px]!">{ev.title}</h1>

      {/* Thông tin thời gian địa điểm */}
      <div className="bento p-4 flex flex-col gap-2 text-[15px]">
        <p>🗓️ {ev.date}</p>
        <p>⏰ {ev.time}</p>
        <p>📍 {ev.location}</p>
      </div>

      {/* Thẻ Host uy tín tạo Trust */}
      <div className="bento p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
          {ev.host[0]}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-[15px]">{ev.host}</p>
          <p className="text-[13px] text-slate-500">Ban tổ chức</p>
        </div>
        {ev.hostVerified && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-primary">
            ✓ Đã xác minh
          </span>
        )}
      </div>

      {/* Bằng chứng xã hội — Facepile */}
      <div className="bento p-4">
        <Facepile
          attendees={ev.attendees}
          total={ev.registered}
          message={`Đã có ${ev.registered} bạn trong khu vực ${ev.area} đăng ký tham gia`}
        />
      </div>

      {/* Nội dung chương trình */}
      <div className="bento p-4 flex flex-col gap-3">
        <h3 className="text-[16px]!">Nội dung chương trình</h3>
        {ev.description.map((d, i) => (
          <p key={i} className="text-[15px] text-slate-600">
            {d}
          </p>
        ))}
      </div>

      {/* Bảng chi phí minh bạch theo khoản mục — trust asset của P-EVENT */}
      {ev.costBreakdown.length > 0 && (
        <div className="bento p-4">
          <h3 className="text-[16px]! mb-1">💴 Chi phí tổ chức minh bạch</h3>
          <p className="text-[13px] text-slate-500 mb-3">
            Tiền cọc chỉ để giữ chỗ và được hoàn 100% khi check-in. Chi phí sự
            kiện do ban tổ chức và đối tác tài trợ:
          </p>
          <table className="w-full text-[14px]">
            <tbody>
              {ev.costBreakdown.map((c, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-600">{c.item}</td>
                  <td className="py-2 text-right font-medium whitespace-nowrap">
                    ¥{c.amount.toLocaleString("ja-JP")}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-semibold">Tổng chi phí</td>
                <td className="py-2 text-right font-bold text-primary whitespace-nowrap">
                  ¥
                  {ev.costBreakdown
                    .reduce((s, c) => s + c.amount, 0)
                    .toLocaleString("ja-JP")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* CTA đăng ký ghim đáy — xác thực LINE một chạm / hàng chờ */}
      <RegisterCTA
        eventSlug={ev.slug}
        eventTitle={ev.title}
        soldOut={soldOut}
        waitlist={ev.waitlist}
        remaining={ev.capacity - ev.registered}
        deposit={ev.deposit}
      />
    </main>
  );
}
