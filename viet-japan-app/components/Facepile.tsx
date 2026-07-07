import type { Attendee } from "@/lib/data";

// Bằng chứng xã hội kiểu Luma: avatar chồng lên nhau + số người đăng ký
export default function Facepile({
  attendees,
  total,
  message,
}: {
  attendees: Attendee[];
  total: number;
  message: string;
}) {
  const shown = attendees.slice(0, 5);
  const rest = total - shown.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2.5">
        {shown.map((a, i) => (
          <span
            key={i}
            title={a.name}
            className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[13px] font-semibold text-white"
            style={{ background: a.color }}
          >
            {a.name.split(" ").pop()?.[0]}
          </span>
        ))}
        {rest > 0 && (
          <span className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600">
            +{rest}
          </span>
        )}
      </div>
      <p className="text-[13px] text-slate-600 leading-snug flex-1">{message}</p>
    </div>
  );
}
