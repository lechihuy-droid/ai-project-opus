import Link from "next/link";
import { notFound } from "next/navigation";
import { tips } from "@/lib/data";
import LeadMagnetBox from "@/components/LeadMagnetBox";

export function generateStaticParams() {
  return tips.map((t) => ({ slug: t.slug }));
}

// ── Màn hình 3: Landing Page Cẩm nang SEO ──
export default async function TipDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tip = tips.find((t) => t.slug === slug);
  if (!tip) notFound();

  // Chèn Lead Magnet vào giữa bài viết (sau section đầu tiên)
  const midpoint = 1;

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-10">
      {/* Breadcrumbs SEO */}
      <nav className="text-[13px] text-slate-400">
        <Link href="/">Home</Link> ›{" "}
        <Link href="/tips">Cẩm nang</Link> ›{" "}
        <span className="text-slate-600">{tip.category}</span>
      </nav>

      <h1 className="text-[25px]!">{tip.title}</h1>
      <p className="text-[13px] text-slate-500 -mt-2">
        ✍️ {tip.author} · Cập nhật {tip.updated} · ⏱ {tip.readMinutes} phút đọc
      </p>

      {/* Mục lục neo bám (sticky TOC) */}
      <div className="bento p-4 sticky top-2 z-20 bg-white/95 backdrop-blur">
        <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Mục lục
        </p>
        <ol className="flex flex-col gap-1.5">
          {tip.sections.map((s, i) => (
            <li key={i}>
              <a href={`#section-${i}`} className="text-[14px] text-primary font-medium">
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* Nội dung bài viết — chữ 16px+, dãn dòng rộng */}
      {tip.sections.map((s, i) => (
        <div key={i}>
          <section>
            <h2 id={`section-${i}`} className="text-[20px]! mb-2 scroll-mt-24">
              {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="text-[16px] leading-[1.7] text-slate-700 mb-3">
                {p}
              </p>
            ))}
          </section>

          {/* Hộp CTA Bento nhúng giữa bài — Lead Magnet */}
          {i === midpoint && (
            <LeadMagnetBox
              title={tip.leadMagnet.title}
              desc={tip.leadMagnet.desc}
            />
          )}
        </div>
      ))}

      {/* Điều hướng tự nhiên sang phễu tiếp theo */}
      <Link
        href="/quiz"
        className="bento p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <span className="text-3xl">📝</span>
        <div className="flex-1">
          <h3 className="text-[15px]!">Nghỉ mắt chút? Thử 5 câu quiz N2</h3>
          <p className="text-[13px] text-slate-500">Làm ẩn danh, có giải thích chi tiết</p>
        </div>
        <span className="text-slate-300 text-xl">›</span>
      </Link>
    </main>
  );
}
