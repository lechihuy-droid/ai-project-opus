import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import FirstTouch from "@/components/FirstTouch";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Việt Nhật Hub — Cẩm nang & Sự kiện cho người Việt tại Nhật",
  description:
    "Nền tảng cẩm nang hành chính, sự kiện cộng đồng và luyện quiz tiếng Nhật tin cậy cho người Việt tại Nhật Bản.",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${notoJp.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <FirstTouch />
        {/* Khung app mobile-first: 1 cột, tối đa 28rem, canh giữa trên desktop */}
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col pb-[72px]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
