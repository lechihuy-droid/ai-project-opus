"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "🏠", label: "Hub" },
  { href: "/events", icon: "📅", label: "Sự kiện" },
  { href: "/tips", icon: "💡", label: "Cẩm nang" },
  { href: "/profile", icon: "👤", label: "Hồ sơ" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Màn quiz cần tập trung tuyệt đối — ẩn thanh điều hướng
  if (pathname.startsWith("/quiz")) return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200">
      <div className="max-w-md mx-auto h-[56px] grid grid-cols-4">
        {tabs.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </nav>
  );
}
