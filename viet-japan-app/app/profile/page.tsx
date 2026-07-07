import Link from "next/link";
import { currentUser, events, communityStats } from "@/lib/data";
import DeleteAccountFlow from "@/components/DeleteAccountFlow";

// ── Màn hình 6: Hồ sơ Bento cá nhân + quản lý quyền riêng tư APPI ──
export default function ProfilePage() {
  const joined = events.filter((e) => currentUser.joinedEvents.includes(e.slug));

  return (
    <main className="flex flex-col gap-3 px-4 pt-6 pb-8">
      {/* Thẻ tiêu đề hồ sơ */}
      <div className="bento p-5 flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
          {currentUser.name[0]}
        </span>
        <div>
          <h1 className="text-[22px]!">{currentUser.name}</h1>
          <p className="text-[14px] text-slate-500">📍 {currentUser.area}, Nhật Bản</p>
        </div>
      </div>

      {/* Ô Bento tiến độ */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bento p-4">
          <p className="text-[13px] text-slate-500">Hồ sơ hoàn thành</p>
          <p className="text-[24px] font-bold text-primary mt-1">
            {currentUser.profileCompletion}%
          </p>
          <div className="h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${currentUser.profileCompletion}%` }}
            />
          </div>
        </div>
        <div className="bento p-4">
          <p className="text-[13px] text-slate-500">Chuỗi ngày học</p>
          <p className="text-[24px] font-bold text-amber-500 mt-1">
            🔥 {currentUser.streak} ngày
          </p>
          <p className="text-[12px] text-slate-400 mt-2">Làm quiz mỗi ngày để giữ chuỗi</p>
        </div>
      </div>

      {/* Sự kiện đã tham gia */}
      <div className="bento p-4">
        <h3 className="text-[16px]! mb-3">🎫 Sự kiện của bạn</h3>
        {joined.length === 0 ? (
          <p className="text-[14px] text-slate-500">Chưa đăng ký sự kiện nào.</p>
        ) : (
          joined.map((ev) => (
            <div key={ev.slug} className="flex items-center gap-3 py-2">
              <span className="text-2xl">{ev.emoji}</span>
              <div>
                <p className="text-[14px] font-medium">{ev.title}</p>
                <p className="text-[12px] text-slate-500">{ev.date}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ô Bento bảo mật — minh bạch dữ liệu theo APPI */}
      <div className="bento p-4">
        <h3 className="text-[16px]! mb-2">🔐 Dữ liệu của bạn (APPI)</h3>
        <p className="text-[13px] text-slate-500 mb-3">
          Chúng tôi chỉ thu thập những thông tin sau và dùng đúng mục đích ghi rõ:
        </p>
        <ul className="flex flex-col gap-2 text-[14px]">
          <li className="flex gap-2">
            <span>✅</span>
            <span>
              <b>Tên & avatar LINE</b> — hiển thị vé sự kiện và facepile
            </span>
          </li>
          <li className="flex gap-2">
            <span>✅</span>
            <span>
              <b>Email (nếu bạn cung cấp)</b> — chỉ gửi tài liệu bạn yêu cầu
            </span>
          </li>
          <li className="flex gap-2">
            <span>✅</span>
            <span>
              <b>Tiến trình quiz</b> — hiển thị streak và kết quả học
            </span>
          </li>
          <li className="flex gap-2">
            <span>🚫</span>
            <span>
              <b>Không</b> thu thập vị trí chính xác, danh bạ, hay bán dữ liệu cho bên thứ ba
            </span>
          </li>
        </ul>
        <p className="text-[12px] text-slate-400 mt-3">
          Tuân thủ Đạo luật Bảo vệ Thông tin Cá nhân Nhật Bản (個人情報保護法).{" "}
          <Link href="/privacy" className="text-primary font-medium">
            Đọc chính sách đầy đủ
          </Link>{" "}
          ·{" "}
          <Link href="/legal" className="text-primary font-medium">
            Thông tin giao dịch & hoàn tiền
          </Link>
        </p>
      </div>

      <div className="bento p-4">
        <h3 className="text-[16px]! mb-1">🌟 Cộng đồng</h3>
        <p className="text-[14px] text-slate-500">
          Bạn là 1 trong {communityStats.members.toLocaleString("vi-VN")} thành viên
          Việt Nhật Hub.
        </p>
      </div>

      {/* Cài đặt nâng cao — xóa tài khoản 3 bước, chữ mảnh, khó bấm nhầm */}
      <DeleteAccountFlow />
    </main>
  );
}
