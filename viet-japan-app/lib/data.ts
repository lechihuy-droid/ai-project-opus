// ============================================================
// MOCK DATA — Giai đoạn 1 chỉ có frontend.
// Khi làm backend, thay các hằng số này bằng fetch từ API/Supabase.
// ============================================================

export type Attendee = { name: string; color: string };

export type CostItem = { item: string; amount: number };

export type EventItem = {
  slug: string;
  title: string;
  emoji: string;
  date: string;
  time: string;
  location: string;
  area: string;
  host: string;
  hostVerified: boolean;
  cover: string; // css gradient để không phụ thuộc ảnh ngoài
  capacity: number;
  registered: number;
  waitlist: number;
  deposit: number; // cọc giữ chỗ (yên) — hoàn khi check-in; 0 = miễn phí
  costBreakdown: CostItem[]; // bảng chi phí minh bạch theo khoản mục (P-EVENT)
  description: string[];
  attendees: Attendee[];
};

const palette = ["#4f46e5", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#8b5cf6", "#ec4899", "#22c55e"];

const names = [
  "Minh Anh", "Tuấn Kiệt", "Hồng Nhung", "Đức Huy", "Thu Trang",
  "Quang Vinh", "Mai Linh", "Hải Đăng", "Ngọc Hân", "Văn Nam",
];

function makeAttendees(n: number): Attendee[] {
  return Array.from({ length: n }, (_, i) => ({
    name: names[i % names.length],
    color: palette[i % palette.length],
  }));
}

export const events: EventItem[] = [
  {
    slug: "hoi-thao-hoan-thue-2026",
    title: "Hội thảo Hoàn thuế & Nenkin 2026",
    emoji: "🧾",
    date: "Chủ nhật, 26/07/2026",
    time: "14:00 – 17:00",
    location: "Shinjuku Bunka Center, Tokyo",
    area: "Tokyo",
    host: "Việt Nhật Support",
    hostVerified: true,
    cover: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #10b981 100%)",
    capacity: 120,
    registered: 85,
    waitlist: 0,
    deposit: 1000,
    costBreakdown: [
      { item: "Thuê hội trường (3 giờ)", amount: 45000 },
      { item: "In tài liệu + file Excel bản quyền", amount: 18000 },
      { item: "Nước uống, bánh nhẹ", amount: 12000 },
      { item: "Phí diễn giả (chuyên gia thuế)", amount: 30000 },
    ],
    description: [
      "Hướng dẫn chi tiết quy trình hoàn thuế thu nhập (確定申告) và nhận lại tiền Nenkin cho người Việt sắp về nước hoặc chuyển việc.",
      "Có phiên hỏi đáp trực tiếp với chuyên gia thuế người Việt, hỗ trợ điền hồ sơ tại chỗ.",
      "Cọc giữ chỗ ¥1,000 — hoàn lại 100% khi bạn check-in tại sự kiện. Nhận trọn bộ file Excel tính thuế 2026.",
    ],
    attendees: makeAttendees(8),
  },
  {
    slug: "giao-luu-viet-nhat-osaka",
    title: "Giao lưu Việt - Nhật Osaka Summer",
    emoji: "🎋",
    date: "Thứ bảy, 08/08/2026",
    time: "18:00 – 21:00",
    location: "Namba Hall, Osaka",
    area: "Osaka",
    host: "VJ Community Osaka",
    hostVerified: true,
    cover: "linear-gradient(135deg, #10b981 0%, #06b6d4 60%, #4f46e5 100%)",
    capacity: 80,
    registered: 80,
    waitlist: 12,
    deposit: 1000,
    costBreakdown: [
      { item: "Thuê hội trường Namba Hall", amount: 60000 },
      { item: "Ẩm thực hai nước (80 suất)", amount: 96000 },
      { item: "Trang trí + thiết bị âm thanh", amount: 25000 },
    ],
    description: [
      "Đêm giao lưu văn hóa Việt - Nhật: trò chơi kết bạn, ẩm thực hai nước và mini talkshow về cuộc sống tại Kansai.",
      "Cơ hội mở rộng network với các anh chị kỹ sư, du học sinh đang sống tại Osaka.",
      "Cọc giữ chỗ ¥1,000 — hoàn lại 100% khi check-in, để hạn chế đăng ký ảo bỏ chỗ.",
    ],
    attendees: makeAttendees(10),
  },
  {
    slug: "workshop-doi-bang-lai",
    title: "Workshop Đổi bằng lái xe Nhật",
    emoji: "🚗",
    date: "Chủ nhật, 23/08/2026",
    time: "10:00 – 12:00",
    location: "Online qua Zoom",
    area: "Online",
    host: "Việt Nhật Support",
    hostVerified: true,
    cover: "linear-gradient(135deg, #f59e0b 0%, #f43f5e 60%, #8b5cf6 100%)",
    capacity: 200,
    registered: 47,
    waitlist: 0,
    deposit: 0,
    costBreakdown: [],
    description: [
      "Từng bước đổi bằng lái Việt Nam sang bằng Nhật (外免切替): giấy tờ cần chuẩn bị, mẹo thi thực hành sa hình.",
      "Chia sẻ kinh nghiệm thật từ 3 bạn đã đổi bằng thành công tại Fuchu và Kadoma.",
    ],
    attendees: makeAttendees(6),
  },
];

export type TipSection = { heading: string; body: string[] };

export type Tip = {
  slug: string;
  title: string;
  emoji: string;
  category: string;
  updated: string;
  author: string;
  readMinutes: number;
  leadMagnet: { title: string; desc: string };
  sections: TipSection[];
};

export const tips: Tip[] = [
  {
    slug: "hoan-thue-nenkin-2026",
    title: "Hướng dẫn hoàn thuế & Nenkin 2026 từ A đến Z",
    emoji: "💰",
    category: "Thuế & Nenkin",
    updated: "01/07/2026",
    author: "Việt Nhật Support",
    readMinutes: 8,
    leadMagnet: {
      title: "Tải miễn phí file Excel tính thuế thu nhập 2026",
      desc: "Nhập lương, tự động ra số thuế phải nộp và số tiền được hoàn.",
    },
    sections: [
      {
        heading: "1. Ai được hoàn thuế?",
        body: [
          "Nếu bạn đi làm và bị trừ thuế thu nhập (所得税) hàng tháng nhưng có người phụ thuộc ở Việt Nam, gửi tiền về nuôi gia đình, hoặc nghỉ việc giữa năm — khả năng cao bạn được hoàn lại một phần thuế.",
          "Thời hạn khai hoàn thuế lên tới 5 năm về trước, nên kể cả các năm cũ chưa khai bạn vẫn còn cơ hội.",
        ],
      },
      {
        heading: "2. Giấy tờ cần chuẩn bị",
        body: [
          "Gensen (源泉徴収票) từ công ty, giấy tờ chứng minh quan hệ với người phụ thuộc (giấy khai sinh, sổ hộ khẩu đã dịch thuật), và biên lai chuyển tiền về Việt Nam đứng tên bạn.",
          "Từ 2026, mỗi người phụ thuộc từ 30-69 tuổi cần chứng minh gửi tối thiểu 38 man/năm.",
        ],
      },
      {
        heading: "3. Nenkin một lần (脱退一時金)",
        body: [
          "Khi về nước hẳn, bạn được nhận lại tối đa 5 năm tiền Nenkin đã đóng. Nộp hồ sơ sau khi đã rời Nhật và mất tư cách lưu trú.",
          "Lưu ý: tiền Nenkin một lần bị khấu trừ 20.42% thuế tại nguồn — phần này cũng xin hoàn lại được thông qua người đại diện thuế (納税管理人).",
        ],
      },
    ],
  },
  {
    slug: "doi-bang-lai-xe-nhat",
    title: "Đổi bằng lái xe Việt Nam sang bằng Nhật (外免切替)",
    emoji: "🚗",
    category: "Thủ tục hành chính",
    updated: "15/06/2026",
    author: "Việt Nhật Support",
    readMinutes: 6,
    leadMagnet: {
      title: "Nhận bộ đề thi lý thuyết 10 câu song ngữ Việt - Nhật",
      desc: "Kèm sơ đồ sa hình chuẩn của các trung tâm thi phổ biến.",
    },
    sections: [
      {
        heading: "1. Điều kiện cần",
        body: [
          "Bằng lái Việt Nam còn hiệu lực, và chứng minh đã ở Việt Nam ít nhất 3 tháng sau ngày cấp bằng (dựa vào dấu xuất nhập cảnh trên hộ chiếu).",
        ],
      },
      {
        heading: "2. Quy trình 4 bước",
        body: [
          "Dịch bằng lái tại JAF (khoảng 4,000 yên) → Đặt lịch tại trung tâm sát hạch (運転免許センター) → Thi lý thuyết 10 câu (được thi bằng tiếng Việt tại nhiều tỉnh) → Thi thực hành sa hình.",
          "Tỷ lệ đỗ thực hành lần đầu khoảng 30% — hãy thuê sân tập trước 1-2 buổi.",
        ],
      },
    ],
  },
  {
    slug: "gia-han-visa-ky-su",
    title: "Gia hạn visa kỹ sư: checklist hồ sơ 2026",
    emoji: "🛂",
    category: "Visa & Lưu trú",
    updated: "20/06/2026",
    author: "Việt Nhật Support",
    readMinutes: 5,
    leadMagnet: {
      title: "Tải checklist hồ sơ gia hạn visa bản PDF",
      desc: "In ra tích từng mục, tránh bị trả hồ sơ vì thiếu giấy tờ.",
    },
    sections: [
      {
        heading: "1. Thời điểm nộp",
        body: [
          "Được phép nộp trước ngày hết hạn 3 tháng. Nộp sớm để tránh rơi vào mùa cao điểm tháng 3-4 khi cục xuất nhập cảnh quá tải.",
        ],
      },
      {
        heading: "2. Hồ sơ cơ bản",
        body: [
          "Đơn xin gia hạn, hộ chiếu + thẻ lưu trú, ảnh 3x4, giấy chứng nhận đang làm việc, gensen hoặc giấy nộp thuế cư trú (課税証明書 + 納税証明書) của năm gần nhất.",
          "Nếu vừa chuyển việc: thêm hợp đồng lao động mới và giấy đăng ký công ty (登記簿謄本).",
        ],
      },
    ],
  },
];

export type QuizQuestion = {
  question: string;
  furigana?: string;
  options: string[];
  answer: number; // index của đáp án đúng
  explanation: string;
};

export const quizQuestions: QuizQuestion[] = [
  {
    question: "彼は忙しい（　）、いつも笑顔で対応してくれる。",
    furigana: "かれ は いそがしい ___、いつも えがお で たいおう してくれる",
    options: ["にもかかわらず", "おかげで", "ばかりに", "あまり"],
    answer: 0,
    explanation: "「にもかかわらず」= mặc dù ~ nhưng vẫn. Bận rộn NHƯNG vẫn tươi cười — nghĩa tương phản nên chọn にもかかわらず.",
  },
  {
    question: "この書類は、明日（　）に提出してください。",
    furigana: "この しょるい は、あした ___ に ていしゅつ してください",
    options: ["まで", "までに", "うちに", "あいだ"],
    answer: 1,
    explanation: "「までに」= hạn chót (deadline) cho một hành động xảy ra một lần. Nộp hồ sơ là hành động 1 lần → までに.",
  },
  {
    question: "留学した（　）、日本語がぺらぺらになった。",
    furigana: "りゅうがく した ___、にほんご が ぺらぺら に なった",
    options: ["せいで", "おかげで", "くせに", "わりに"],
    answer: 1,
    explanation: "「おかげで」= nhờ có ~ (kết quả tốt). Nói được tiếng Nhật trôi chảy là kết quả tích cực → おかげで.",
  },
  {
    question: "税金の手続きは複雑で、専門家（　）相談したほうがいい。",
    furigana: "ぜいきん の てつづき は ふくざつ で、せんもんか ___ そうだん した ほう が いい",
    options: ["を", "が", "に", "で"],
    answer: 2,
    explanation: "相談する đi với trợ từ「に」khi chỉ đối tượng mình tham khảo ý kiến: 専門家に相談する = hỏi ý kiến chuyên gia.",
  },
  {
    question: "日本に来て（　）、一度も国へ帰っていない。",
    furigana: "にほん に きて ___、いちど も くに へ かえっていない",
    options: ["以来", "うえに", "とたん", "つつ"],
    answer: 0,
    explanation: "「て以来」= kể từ khi ~ (đến nay vẫn tiếp diễn). Kể từ khi đến Nhật, chưa về nước lần nào → 来て以来.",
  },
];

export const communityStats = {
  members: 1284,
  eventsHosted: 32,
  guidesPublished: 57,
};

export const partners = ["VJ Support", "Sakura HR", "Tokyo Viet Ban", "JVCA"];

export const currentUser = {
  name: "Huy Lê",
  area: "Tokyo",
  streak: 6,
  profileCompletion: 70,
  joinedEvents: ["hoi-thao-hoan-thue-2026"],
};
