import Link from "next/link";

// Privacy Policy theo APPI (個人情報保護法) — MUST tuần 0-2 của growth plan.
// LƯU Ý: đây là bản nháp để hoàn thiện cấu trúc trang; trước khi chạy thật
// cần điền tên đơn vị vận hành và rà lại với người am hiểu pháp lý.
export default function PrivacyPage() {
  return (
    <main className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <nav className="text-[13px] text-slate-400">
        <Link href="/">Home</Link> › <span className="text-slate-600">Chính sách quyền riêng tư</span>
      </nav>

      <h1 className="text-[24px]!">Chính sách quyền riêng tư</h1>
      <p className="text-[13px] text-slate-500 -mt-2">
        Cập nhật 07/07/2026 · Tuân thủ Đạo luật Bảo vệ Thông tin Cá nhân Nhật Bản (個人情報保護法 — APPI)
      </p>

      <div className="bento p-4">
        <h2 className="text-[18px]! mb-2">1. Thông tin chúng tôi thu thập</h2>
        <ul className="flex flex-col gap-2 text-[15px] text-slate-600">
          <li>• <b>Tên hiển thị & ảnh đại diện</b> — khi bạn đăng nhập bằng LINE/Google</li>
          <li>• <b>Địa chỉ email</b> — chỉ khi bạn chủ động nhập để nhận tài liệu</li>
          <li>• <b>Kết quả quiz & tiến trình học</b> — khi bạn chọn lưu tiến trình</li>
          <li>• <b>Đăng ký sự kiện</b> — tên sự kiện và trạng thái tham dự của bạn</li>
        </ul>
      </div>

      <div className="bento p-4">
        <h2 className="text-[18px]! mb-2">2. Mục đích sử dụng</h2>
        <ul className="flex flex-col gap-2 text-[15px] text-slate-600">
          <li>• Hiển thị vé sự kiện và xác nhận tham dự của bạn</li>
          <li>• Gửi tài liệu bạn yêu cầu qua email (không gửi gì khác)</li>
          <li>• Hiển thị tiến trình học và chuỗi streak của bạn</li>
          <li>• Thống kê ẩn danh để cải thiện dịch vụ (không định danh cá nhân)</li>
        </ul>
      </div>

      <div className="bento p-4">
        <h2 className="text-[18px]! mb-2">3. Những điều chúng tôi KHÔNG làm</h2>
        <ul className="flex flex-col gap-2 text-[15px] text-slate-600">
          <li>🚫 Không bán hoặc chia sẻ dữ liệu cho bên thứ ba vì mục đích quảng cáo</li>
          <li>🚫 Không thu thập vị trí chính xác, danh bạ, hay tin nhắn của bạn</li>
          <li>🚫 Không dùng cookie theo dõi xuyên trang web khác</li>
          <li>🚫 Nếu bạn làm quiz ẩn danh và không đăng nhập — kết quả không gắn với danh tính của bạn</li>
        </ul>
      </div>

      <div className="bento p-4">
        <h2 className="text-[18px]! mb-2">4. Lưu trữ và xóa dữ liệu</h2>
        <p className="text-[15px] text-slate-600 mb-2">
          Bạn có quyền yêu cầu xem, sửa hoặc xóa toàn bộ dữ liệu của mình bất kỳ
          lúc nào — dùng quy trình xóa 3 bước trong{" "}
          <Link href="/profile" className="text-primary font-medium">trang Hồ sơ</Link>.
          Dữ liệu bị xóa vĩnh viễn khỏi hệ thống trong vòng 30 ngày.
        </p>
      </div>

      <div className="bento p-4">
        <h2 className="text-[18px]! mb-2">5. Đơn vị vận hành & liên hệ</h2>
        <p className="text-[15px] text-slate-600">
          [Tên đơn vị vận hành] — [Địa chỉ tại Nhật Bản]
          <br />
          Email: privacy@vietnhathub.example
          <br />
          Mọi thắc mắc về dữ liệu cá nhân sẽ được phản hồi trong 7 ngày làm việc.
        </p>
      </div>
    </main>
  );
}
