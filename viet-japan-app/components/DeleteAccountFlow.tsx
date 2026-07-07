"use client";

import { useState } from "react";

// APPI Compliance Deletion Flow — 3 bước:
// 1. Liệt kê hậu quả → 2. Xác nhận → 3. Email xác nhận xóa vĩnh viễn.
// TODO(backend): gọi API xóa dữ liệu thật + gửi email xác nhận.
export default function DeleteAccountFlow() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  return (
    <details className="mt-2">
      <summary className="text-[13px] text-slate-400 cursor-pointer py-2">
        Cài đặt nâng cao
      </summary>

      {step === 0 && (
        <button
          onClick={() => setStep(1)}
          className="text-[13px] text-alert underline underline-offset-2 py-2"
        >
          Xóa tài khoản vĩnh viễn
        </button>
      )}

      {step > 0 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="pop-in w-full max-w-md bg-white rounded-t-3xl p-6 pb-10">
            {step === 1 && (
              <>
                <h2 className="text-[20px]!">Bước 1/3 — Điều gì sẽ bị xóa?</h2>
                <ul className="text-[14px] text-slate-600 flex flex-col gap-2 mt-3 mb-5">
                  <li>• Toàn bộ thông tin hồ sơ và liên kết LINE/Google</li>
                  <li>• Vé sự kiện đã đăng ký (kể cả sự kiện sắp diễn ra)</li>
                  <li>• Tiến trình quiz và chuỗi streak {`\u{1F525}`}</li>
                  <li>• Email trong danh sách nhận tài liệu</li>
                </ul>
                <button
                  onClick={() => setStep(2)}
                  className="tap w-full rounded-2xl bg-alert text-white font-semibold"
                >
                  Tôi hiểu, tiếp tục
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-[20px]!">Bước 2/3 — Xác nhận lần cuối</h2>
                <p className="text-[14px] text-slate-600 mt-3 mb-5">
                  Hành động này <b>không thể hoàn tác</b>. Dữ liệu sẽ bị xóa vĩnh
                  viễn khỏi hệ thống trong vòng 30 ngày theo quy định APPI.
                </p>
                <button
                  onClick={() => setStep(3)}
                  className="tap w-full rounded-2xl bg-alert text-white font-semibold"
                >
                  Xác nhận xóa tài khoản
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-[20px]!">Bước 3/3 — Kiểm tra email 📧</h2>
                <p className="text-[14px] text-slate-600 mt-3 mb-5">
                  Chúng tôi đã gửi một email xác nhận. Bấm vào liên kết trong
                  email để hoàn tất việc xóa vĩnh viễn. Nếu không bấm trong 24
                  giờ, yêu cầu sẽ tự hủy.
                </p>
                <button
                  onClick={() => setStep(0)}
                  className="tap w-full rounded-2xl bg-primary text-white font-semibold"
                >
                  Đã hiểu
                </button>
              </>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(0)}
                className="tap w-full rounded-2xl border border-slate-200 text-slate-600 font-medium mt-2"
              >
                Hủy — giữ lại tài khoản
              </button>
            )}
          </div>
        </div>
      )}
    </details>
  );
}
