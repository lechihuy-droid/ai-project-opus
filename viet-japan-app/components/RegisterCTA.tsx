"use client";

import { useState } from "react";
import { track } from "@/lib/tracking";

// Luồng đăng ký một chạm: bấm nút → mô phỏng LINE Login → vé xác nhận.
// Sự kiện có cọc (P-EVENT): nút ghi rõ ¥1,000 hoàn khi check-in.
// Giai đoạn backend sẽ thay bằng LIFF SDK (liff.login) + API RSVP + Stripe cho cọc.
export default function RegisterCTA({
  eventSlug,
  eventTitle,
  soldOut,
  waitlist,
  remaining,
  deposit,
}: {
  eventSlug: string;
  eventTitle: string;
  soldOut: boolean;
  waitlist: number;
  remaining: number;
  deposit: number;
}) {
  const [state, setState] = useState<"idle" | "authing" | "done">("idle");

  function register() {
    track(soldOut ? "event_waitlist_click" : "event_register_click", {
      event: eventSlug,
      deposit,
    });
    setState("authing");
    // TODO(backend): thay setTimeout bằng liff.login() + POST /rsvp (+ Stripe nếu có cọc)
    setTimeout(() => {
      track(soldOut ? "event_waitlist_done" : "event_register_done", {
        event: eventSlug,
      });
      setState("done");
    }, 900);
  }

  if (state === "done") {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setState("idle")}>
        <div
          className="pop-in w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <span className="text-6xl">🎫</span>
            <h2 className="text-[22px]! mt-2">
              {soldOut ? "Đã vào hàng chờ!" : "Đăng ký thành công!"}
            </h2>
            <p className="text-slate-500 text-[15px] mt-1">
              {soldOut
                ? `Bạn đứng thứ ${waitlist + 1} trong hàng chờ. Có chỗ trống chúng tôi sẽ báo qua LINE.`
                : `Vé của bạn cho "${eventTitle}" đã được xác nhận qua LINE.`}
            </p>
            {!soldOut && deposit > 0 && (
              <p className="text-[13px] text-slate-400 mt-2">
                Cọc ¥{deposit.toLocaleString("ja-JP")} sẽ được hoàn 100% khi bạn
                check-in tại sự kiện.
              </p>
            )}
          </div>

          {/* Viral loop: mời chia sẻ vé lên Stories (Dynamic OG — backend sinh ảnh sau) */}
          <button
            onClick={() => track("ticket_share_click", { event: eventSlug })}
            className="tap w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold"
          >
            Chia Sẻ Vé Lên Stories 📸
          </button>
          <button className="tap w-full rounded-2xl border border-slate-200 text-slate-600 font-medium">
            + Thêm vào Google Calendar
          </button>
        </div>
      </div>
    );
  }

  const label = soldOut
    ? `Đăng Ký Vào Hàng Chờ (${waitlist} người đang đợi)`
    : deposit > 0
      ? `Đặt Cọc ¥${deposit.toLocaleString("ja-JP")} Giữ Chỗ · còn ${remaining} chỗ`
      : `Đăng Ký Miễn Phí Ngay · còn ${remaining} chỗ`;

  return (
    <div className="fixed bottom-[64px] inset-x-0 z-30 px-4 pb-2">
      <div className="max-w-md mx-auto">
        <button
          onClick={register}
          disabled={state === "authing"}
          className={`tap w-full rounded-2xl font-semibold text-white text-[16px] shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70 ${
            soldOut ? "bg-amber-500 shadow-amber-200" : "bg-line shadow-emerald-200"
          }`}
        >
          {state === "authing" ? "Đang xác thực qua LINE…" : label}
        </button>
        <p className="text-center text-[12px] text-slate-400 mt-1.5">
          30 giây, một chạm qua LINE — không cần điền form
          {deposit > 0 && !soldOut ? " · cọc hoàn 100% khi check-in" : ""}
        </p>
      </div>
    </div>
  );
}
