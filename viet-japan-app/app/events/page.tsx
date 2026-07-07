import Link from "next/link";
import { events } from "@/lib/data";

// ── Danh sách sự kiện — một cột, thẻ Bento ──
export default function EventsPage() {
  return (
    <main className="flex flex-col gap-3 px-4 pt-6 pb-8">
      <h1 className="text-[26px]!">📅 Sự kiện cộng đồng</h1>
      <p className="text-slate-500 text-[15px] -mt-1">
        Đăng ký một chạm, miễn phí tham gia.
      </p>

      {events.map((ev) => {
        const soldOut = ev.registered >= ev.capacity;
        return (
          <Link
            key={ev.slug}
            href={`/events/${ev.slug}`}
            className="bento overflow-hidden block active:scale-[0.98] transition-transform"
          >
            <div
              className="h-24 flex items-center justify-center text-4xl"
              style={{ background: ev.cover }}
            >
              {ev.emoji}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[16px]!">{ev.title}</h3>
                {soldOut ? (
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-alert">
                    Hàng chờ
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-accent">
                    Còn chỗ
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 mt-1">
                {ev.date} · {ev.time}
              </p>
              <p className="text-[13px] text-slate-500">📍 {ev.location}</p>
            </div>
          </Link>
        );
      })}
    </main>
  );
}
