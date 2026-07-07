import Link from "next/link";
import { tips } from "@/lib/data";

// ── Danh sách cẩm nang ──
export default function TipsPage() {
  return (
    <main className="flex flex-col gap-3 px-4 pt-6 pb-8">
      <h1 className="text-[26px]!">💡 Cẩm nang hành chính</h1>
      <p className="text-slate-500 text-[15px] -mt-1">
        Hướng dẫn từng bước, cập nhật theo luật mới nhất.
      </p>

      {tips.map((tip) => (
        <Link
          key={tip.slug}
          href={`/tips/${tip.slug}`}
          className="bento p-4 flex items-start gap-3 active:scale-[0.98] transition-transform"
        >
          <span className="text-3xl">{tip.emoji}</span>
          <div className="flex-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-primary">
              {tip.category}
            </span>
            <h3 className="text-[16px]! mt-1.5">{tip.title}</h3>
            <p className="text-[13px] text-slate-500 mt-1">
              Cập nhật {tip.updated} · đọc {tip.readMinutes} phút
            </p>
          </div>
        </Link>
      ))}
    </main>
  );
}
