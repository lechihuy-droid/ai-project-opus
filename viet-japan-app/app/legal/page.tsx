import Link from "next/link";

// Trang 特定商取引法 (Luật Giao dịch Thương mại Đặc định) + chính sách hoàn tiền.
// Bắt buộc trước khi thu bất kỳ khoản tiền nào (growth plan mục 10 — MUST).
// LƯU Ý: bản nháp cấu trúc — điền thông tin thật trước khi mở thanh toán.
export default function LegalPage() {
  const rows: [string, string][] = [
    ["Tên đơn vị bán hàng", "[Tên đơn vị vận hành]"],
    ["Người chịu trách nhiệm", "[Họ tên người đại diện]"],
    ["Địa chỉ", "[Địa chỉ đăng ký kinh doanh tại Nhật Bản]"],
    ["Liên hệ", "support@vietnhathub.example (phản hồi trong 3 ngày làm việc)"],
    ["Giá bán", "Ghi rõ trên từng trang sản phẩm/sự kiện, đã bao gồm thuế"],
    ["Chi phí ngoài giá bán", "Phí kết nối internet do khách hàng tự chịu"],
    ["Phương thức thanh toán", "Thẻ tín dụng qua Stripe (không nhận chuyển khoản cá nhân)"],
    ["Thời điểm thanh toán", "Tại thời điểm đăng ký / đặt cọc"],
    ["Thời điểm cung cấp", "Dịch vụ số: ngay sau thanh toán · Sự kiện: theo ngày ghi trên vé"],
  ];

  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <nav className="text-[13px] text-slate-400">
        <Link href="/">Home</Link> › <span className="text-slate-600">Thông tin giao dịch</span>
      </nav>

      <h1 className="text-[24px]!">Thông tin giao dịch thương mại</h1>
      <p className="text-[13px] text-slate-500 -mt-2">
        Công bố theo Luật Giao dịch Thương mại Đặc định của Nhật Bản (特定商取引法)
      </p>

      <div className="bento p-4">
        <table className="w-full text-[14px]">
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-slate-700 align-top whitespace-nowrap">{k}</td>
                <td className="py-2.5 text-slate-600">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bento p-4">
        <h2 className="text-[18px]! mb-2">Chính sách hoàn tiền</h2>
        <ul className="flex flex-col gap-2 text-[15px] text-slate-600">
          <li>
            • <b>Cọc giữ chỗ sự kiện (¥1,000):</b> hoàn 100% khi bạn check-in tại
            sự kiện. Hủy trước sự kiện ≥72 giờ: hoàn 100%. Hủy trong vòng 72 giờ
            hoặc vắng mặt: không hoàn (dùng bù chi phí đã phát sinh).
          </li>
          <li>
            • <b>Sản phẩm số (khóa luyện, tài liệu):</b> do đặc thù nội dung số,
            không hoàn tiền sau khi đã cấp quyền truy cập — trừ lỗi kỹ thuật từ
            phía chúng tôi (hoàn 100%).
          </li>
          <li>
            • <b>Sự kiện bị hủy bởi ban tổ chức:</b> hoàn 100% toàn bộ khoản đã thu
            trong 7 ngày làm việc.
          </li>
        </ul>
      </div>

      <p className="text-[13px] text-slate-400">
        Xem thêm:{" "}
        <Link href="/privacy" className="text-primary font-medium">
          Chính sách quyền riêng tư (APPI)
        </Link>
      </p>
    </main>
  );
}
