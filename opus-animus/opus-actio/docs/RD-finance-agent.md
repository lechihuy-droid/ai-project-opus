# RD — Opus Nexus: Finance Module (Agent tư vấn tài chính cá nhân)
**Date:** 2026-06-11
**Status:** 🔵 Draft
**Author:** Claude (theo yêu cầu Le Huy)

---

## 0. Problem Statement

**Vấn đề:** Chi tiêu/thu nhập hàng ngày chưa được log có hệ thống; kế hoạch tài chính (`PERSONAL_FINANCE_PLAN_JP_v0.md`) chưa có dữ liệu thực tế để review; chưa có dashboard theo dõi.

**Hiện trạng:** Đã có hệ Vita Module (health) chạy ổn theo pattern *chat-first → JSON-on-GitHub → static dashboard*. Folder `opus-animus/opus-actio/finance-data/` đã tồn tại với 1 file thử nghiệm đúng pattern này. Policy bảo mật 2 lớp đã có (`FINANCE_DATA_STORAGE_POLICY.md`).

**Mục tiêu:** Agent tư vấn tài chính cá nhân — log chi tiêu hàng ngày qua chat LLM, tư vấn theo phong cách **CFP (quy trình) + UBS goal-based (tư duy) + Vanguard (triết lý đầu tư)**, hiển thị dashboard — **gắn vào cùng hệ Opus Nexus với health agent**.

---

## 1. Usage — Người Dùng Dùng Thế Nào

### 1.1 User Profile

| Field | Giá trị |
|---|---|
| Người dùng | Le Huy — sống tại Nhật, thu nhập JPY, có kế hoạch cross-border VN |
| Device / môi trường | Mobile (chụp ảnh hóa đơn/màn hình app thanh toán) + Claude app / ChatGPT |
| Tần suất dùng | Log hàng ngày (1-5 lần), review tuần/tháng |
| Technical level | Cao — đã vận hành Vita Module cùng pattern |

### 1.2 Typical Usage Flow

```
Bước 1: User gửi ảnh hóa đơn / screenshot PayPay / text "trưa nay 850 yên ramen"
Bước 2: Agent extract → ghi opus-animus/opus-actio/finance-data/YYYY-MM-DD.json (GitHub MCP)
        + nhận xét 1-2 câu (so với budget ngày/tháng, cảnh báo category vượt ngưỡng)
Bước 3: (Nếu ảnh là hóa đơn ăn uống) đồng thời log meal vào health-data — 1 ảnh 2 module
Bước 4: Cuối tháng user nói "review tài chính tháng này"
        → Agent đọc finance-data + snapshot → review theo CFP, cập nhật snapshot (ranges)
Kết quả: Dashboard finance-app hiển thị chi tiêu theo ngày/category, budget burn-down, savings rate
```

### 1.3 Example Interactions

**Ví dụ 1 — Happy path (ảnh hóa đơn konbini):**
```
Input:  [ảnh receipt FamilyMart ¥360]
Output: ✅ Đã lưu — Chi tiêu 08:55
        🧾 FamilyMart  ¥360  (food)
        Hôm nay: ¥980 / budget ¥2,500 — ổn.
        🍙 Đồng thời đã log bữa sáng vào health-data (onigiri ~180 kcal).
```

**Ví dụ 2 — Cảnh báo ngưỡng:**
```
Input:  [screenshot PayPay ¥8,500 nhậu]
Output: ✅ Đã lưu — ¥8,500 (entertainment)
        ⚠️ Entertainment tháng này ¥24,000/¥20,000 — vượt budget 20%.
        Gợi ý: 2 tuần còn lại giữ mức ¥0–2,000/tuần cho mục này.
```

**Ví dụ 3 — Review tháng (on-demand):**
```
Input:  "Review tài chính tháng 6"
Output: [HTML artifact: chart chi tiêu theo category + trend]
        Diagnosis theo CFP: surplus ~¥xxk–¥xxk (range), savings rate 25–30%.
        Next action: snapshot 2026-06 đã cập nhật; NISA contribution giữ nguyên.
```

---

## 2. Functional Requirements

| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-001 | Log expense/income từ ảnh (receipt, screenshot app thanh toán) hoặc text → `opus-animus/opus-actio/finance-data/YYYY-MM-DD.json` + cập nhật `index.json` | P0 | Pattern y hệt FR1 của health |
| FR-002 | Tự động phân loại category: `food, transport, housing, utilities, subscription, entertainment, health, education, social, other` + `income` | P0 | Hỏi lại nếu không chắc |
| FR-003 | **Cross-module:** hóa đơn ăn uống → log đồng thời health-data (meal) và finance-data (expense) từ 1 ảnh | P0 | Lý do chính để gắn chung agent |
| FR-004 | Nhận xét tự động sau mỗi log: so với budget ngày/tháng theo category, cảnh báo vượt ngưỡng | P0 | Tương tự cảnh báo belly-fat của health |
| FR-005 | Review tháng theo quy trình CFP: đọc data → diagnosis → cập nhật `opus-animus/opus-actio/personal-finance/snapshots/` (ranges only, theo policy) | P1 | Goal-based buckets kiểu UBS |
| FR-006 | Dashboard tĩnh `finance-app/dashboard.html`: chi tiêu theo ngày/category, budget burn-down, savings rate trend | P1 | Reuse stack html-kit + pattern dashboard health |
| FR-007 | Input qua ChatGPT (custom instructions ghi GitHub qua API) như đường dự phòng | P2 | Pattern nexus-commands đã chứng minh khả thi |
| FR-008 | Reminder tài chính qua nexus-commands (vd: nhắc nộp residence tax, review NISA quý) | P2 | Reuse GitHub Actions sẵn có |

---

## 3. Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|---|---|---|---|
| NFR-001 | **Privacy:** tuân thủ `FINANCE_DATA_STORAGE_POLICY.md` — GitHub chỉ chứa transaction lẻ + ranges; KHÔNG ghi số dư/lương chính xác, số tài khoản | Policy check khi review | P0 |
| NFR-002 | Đa tiền tệ: JPY mặc định, hỗ trợ VND/USD có field `currency` | Schema | P0 |
| NFR-003 | Trả lời tiếng Việt, format reply chuẩn như Vita | — | P0 |
| NFR-004 | Dashboard load < 2s, không backend | Static, đọc GitHub raw | P1 |

---

## 4. Data Schema (extend schema hiện có trong `opus-animus/opus-actio/finance-data/`)

```json
{
  "date": "YYYY-MM-DD",
  "transactions": [
    {
      "time": "HH:MM",
      "type": "expense | income",
      "amount": 620,
      "currency": "JPY",
      "category": "food",
      "description": "ひろひろ 堂島2丁目店",
      "source": "photo | screenshot | text",
      "linked_meal": "2026-06-01#13:54"
    }
  ],
  "notes": ""
}
```

- `linked_meal`: optional, trỏ tới meal trong health-data khi log từ cùng 1 ảnh (FR-003).
- Số dư/lương KHÔNG nằm trong file ngày — chỉ nằm trong `opus-animus/opus-actio/personal-finance/snapshots/` dạng range.

---

## 5. Architecture Decision (đề xuất)

| Quyết định | Đề xuất | Lý do |
|---|---|---|
| **Database** | **GitHub (repo private này)** — KHÔNG dùng Google Drive | Claude Project/ChatGPT ghi Drive không có đường native (cần Apps Script/n8n trung gian); GitHub MCP đã chạy ổn cho health; repo đã xác nhận private; version control miễn phí. Google Drive chỉ dùng cho **Layer A** (spreadsheet số liệu chính xác, không cho AI ghi) nếu muốn. |
| **Agent** | **Gắn vào Claude Project Vita hiện tại** — thêm section Finance vào `instructions.md` (hoặc tách `finance-app/instructions.md` paste chung) | Đúng yêu cầu user; cross-module FR-003 chỉ khả thi khi chung agent; roadmap Vita đã định nghĩa finance là 1 module của nó |
| **Dashboard** | `finance-app/dashboard.html` riêng, deploy cạnh opus-vita | Tách concerns, reuse css/js từ html-kit |
| **Phong cách tư vấn** | CFP process + UBS goal-based + Vanguard execution | Đã thống nhất ở session trước, ghi trong PLAN_JP_v0 |

**Rủi ro chính:** instructions.md của Vita đã dài — thêm finance section có thể làm loãng context của Claude Project. Mitigation: viết section finance tối giản, share schema/quy trình ghi GitHub với phần health thay vì lặp lại.

---

## 6. Open Questions (cần user chốt trước khi sang SD)

1. **Budget targets theo category?** (vd: food ¥60k/tháng, entertainment ¥20k/tháng...) — cần để FR-004 hoạt động. Có thể chốt tạm rồi tune sau 1 tháng data.
2. **Google Drive:** đồng ý bỏ làm database chính, chỉ giữ làm nơi chứa spreadsheet Layer A (số chính xác)? Hay vẫn muốn Drive là DB chính (chấp nhận thêm Apps Script trung gian)?
3. **Mức độ log thu nhập:** lương về tài khoản có log thành transaction `income` không, hay chỉ phản ánh qua snapshot range hàng tháng? (Policy hiện tại nghiêng về snapshot range.)
4. **Gắn chung Vita project** hay tạo Claude Project riêng "Opus Nexus — Finance"? (Đề xuất: chung, vì FR-003.)

---

## 7. Out of Scope

- Kết nối API ngân hàng/Moneytree/MoneyForward — không làm.
- Tư vấn sản phẩm đầu tư cụ thể ngoài khung low-cost index/NISA/iDeCo đã chốt trong plan.
- Backend/server — giữ nguyên triết lý static + JSON-on-GitHub.
