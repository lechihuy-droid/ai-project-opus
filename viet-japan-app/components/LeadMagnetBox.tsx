"use client";

import { useState } from "react";
import { track } from "@/lib/tracking";

// Inline Lead Magnet Card — hộp thu Email nhúng giữa bài cẩm nang.
// TODO(backend): POST email vào danh sách + gửi file qua mail.
export default function LeadMagnetBox({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="rounded-2xl bg-primary text-white p-5 my-4">
      {sent ? (
        <div className="text-center py-2 pop-in">
          <span className="text-4xl">📬</span>
          <p className="font-semibold mt-2">Đã gửi! Kiểm tra hộp thư của bạn nhé.</p>
        </div>
      ) : (
        <>
          <p className="font-semibold text-[17px]">🎁 {title}</p>
          <p className="text-indigo-100 text-[14px] mt-1">{desc}</p>
          <form
            className="mt-4 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes("@")) {
                track("lead_email_submit");
                setSent(true);
              }
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập Email của bạn"
              className="tap w-full rounded-xl px-4 bg-white text-ink text-[15px] outline-none"
            />
            <button
              type="submit"
              className="tap w-full rounded-xl bg-accent text-white font-semibold active:scale-[0.98] transition-transform"
            >
              Tải Tài Liệu Miễn Phí
            </button>
          </form>
          <p className="text-indigo-200 text-[11px] mt-2 text-center">
            Chỉ dùng để gửi tài liệu — không spam, tuân thủ APPI.
          </p>
        </>
      )}
    </div>
  );
}
