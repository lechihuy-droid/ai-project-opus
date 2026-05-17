# POSITIONING.md — Lê Chí Huy
*Định vị bản thân & tổ chức trong làn sóng AI*
**Created:** 2026-05-09 | **Updated:** 2026-05-12 (v1.1) | **Review:** mỗi quý

> **v1.1 changelog:** Thêm §0 Control Matrix (tách điều tôi control / cần lobby / ngoài tầm) và §4 Open Questions (10 assumption chưa verify). Nội dung Phần 1–3 giữ nguyên để v1.2 revise sau khi có data.

---

## PHẦN 0 — CONTROL MATRIX

Doc v1.0 trộn 3 loại action có agency rất khác nhau. v1.1 tách rõ:

| 🟢 Tôi control (làm được ngay) | 🟡 Cần lobby (phụ thuộc FPT buy-in) | 🔴 Ngoài tầm (chỉ monitor) |
|---|---|---|
| Học AI skill (LLM, Agent, methodology) | FPT approve direct-to-end-user conversation | Tier 1 SIer build AI capability nhanh/chậm |
| Build personal AI use case library | FPT AI product catalogue + demo access | JP enterprise procurement culture change |
| Build assessment framework methodology cá nhân | Presales process mới (discovery template, POC kit) | AI tech evolution (model capability, cost curve) |
| Phỏng vấn FPT AI product owner (qua quan hệ cá nhân) | Pricing model linh hoạt (POC → subscription) | JP enterprise AI budget macro |
| Approach 1–2 end user contact trong network cá nhân | Internal role/title recognition "AI Presales" | End user RFP behavior |
| Build/maintain OPUS ANIMUS feed | Technical SE backup khi demo customer | Competitor moves (NTT Data, Accenture JP) |
| Maintain quan hệ SIer hiện tại | Co-sell agreement với SIer partners | Macro AI hype cycle |

### Rule áp dụng matrix

- **🟢 column:** plan + execute độc lập. Không chờ ai approve. Đây là **real action plan**.
- **🟡 column:** mỗi item cần (1) stakeholder name (2) ask cụ thể (3) timeline lobby. **Không phải item nào cũng sẽ win** — cần plan B nếu fail.
- **🔴 column:** không plan, chỉ track signal hàng tháng. Đổi strategy nếu signal flip (ví dụ: SIer X công bố AI division 500 người → window claim collapse).

### Failure mode v1.0

v1.0 viết như cả 3 cột đều là action của tôi → tạo cảm giác kiểm soát toàn cảnh nhưng thật ra phần lớn nằm ở cột 🟡 và 🔴. Roadmap 12 tháng (§2.6) implicitly giả định cả 3 cột execute đúng kế hoạch — đó là wishful thinking, không phải plan.

### v1.2 cần làm

Sau khi có data từ Open Questions (§4), rewrite §1 và §2 sao cho mỗi action có gắn vào đúng cột. Mỗi action 🟡 phải có plan B nếu lobby fail.

---

## PHẦN 1 — FPT JAPAN POSITIONING

### 1.1 Thực Trạng Business Model Hiện Tại

```
End User (Japanese Enterprise)
        ↓ direct relationship + budget
Tier 1: SIer (NTT Data, Fujitsu, Accenture Japan...)
        ↓ subcontract execution
Tier 2: FPT Japan ← đang ở đây
        offshore delivery, coding capacity
```

**Vấn đề cốt lõi:** FPT Japan đang bán cost arbitrage (nhân lực rẻ hơn).
AI đang phá vỡ lý do tồn tại của model này — SIer cần ít outsourcing hơn khi AI tools tăng năng suất nội bộ.

**Tài sản FPT Japan đang có:**
- Quan hệ đã có với SIer (kênh phân phối tiềm năng)
- Vietnam talent pool với scale
- **AI-augmented SDLC knowhow** — kinh nghiệm tích hợp AI vào quy trình phát triển phần mềm
- Onsite presence tại JP — hiếm, khó copy nhanh

> FPT không có AI product riêng để bán. Tài sản thật là **phương pháp và kinh nghiệm triển khai AI trong SDLC** — làm thế nào để đưa AI vào requirements, design, coding, testing, delivery.

---

### 1.2 Window of Opportunity

AI đang tạo ra một khoảng trống hiếm có:

```
End User        → đang bị pressure từ board: "AI strategy là gì?"
                → muốn AI nhưng không biết bắt đầu từ đâu

Tier 1 SIer     → đang lúng túng: domain có, nhưng AI capability yếu
                → chưa có answer thuyết phục cho end user

FPT Japan       → có AI products + delivery capacity
                → nhưng chưa có người mang trực tiếp đến end user
```

**Khoảng trống:** Ai đứng trước end user với AI answer thuyết phục?
**Window:** 18-24 tháng trước khi Tier 1 SIer tự build xong AI capability.

---

### 1.3 Target Business Model

**Từ:** Offshore delivery subcontractor → bán người-tháng cho SIer
**Sang:** AI Solution Partner → bán outcome cho Japanese Enterprise

```
Model mới:
End User ←──────────────────────── FPT Japan AI Presales
                direct conversation   (demo + scope + propose)
                                              ↓
                                      FPT AI Products/Services
                                              ↓
                                      FPT Delivery Team
```

SIer không bị loại — họ có thể là **kênh giới thiệu** (referral/co-sell),
nhưng FPT không còn phụ thuộc vào họ như Tier 1 duy nhất.

---

### 1.4 Go-to-Market Mới

| Yếu tố | Model cũ | Model mới |
|---|---|---|
| Khách hàng | SIer (Tier 1) | Japanese Enterprise (End User) |
| Bán gì | Headcount (người-tháng) | AI-augmented delivery (outcome) |
| Kênh | SIer introduce | Onsite relationship + co-sell SIer |
| Giá trị | Cost saving | Faster/better delivery + AI capability transfer |
| Sales cycle | RFP từ SIer | Discovery → assessment → POC → contract |

**Thứ FPT bán thật sự:** Không phải AI tool, mà là **"chúng tôi biết cách đưa AI vào SDLC của bạn để deliver nhanh hơn, tốt hơn."**

Value proposition với end user JP:
- AI trong testing → giảm bug, rút ngắn QA cycle
- AI trong requirements → clarity hơn, ít rework hơn
- AI trong coding → junior code như mid, mid code như senior
- Kết quả: same budget, better outcome hoặc same outcome, less budget

Presales đóng vai trò: **AI Transformation Consultant** — chẩn đoán SDLC hiện tại của end user → propose roadmap AI adoption → FPT deliver.

---

### 1.5 Điều Kiện Để Model Này Chạy Được

**Internal (FPT Japan cần):**
- [ ] Leadership buy-in: pivot một phần sang direct end user
- [ ] AI product catalogue rõ ràng (cái gì bán được ở JP market)
- [ ] Presales process mới: discovery template, demo kit, POC framework
- [ ] Pricing model mới: outcome/subscription thay vì người-tháng

**External (thị trường cần):**
- Japanese enterprise đang thật sự muốn AI (đang xảy ra)
- Có ít nhất 1 end user sẵn sàng thử POC trực tiếp với FPT
- SIer partners không block kênh trực tiếp (cần manage relationship)

---

## PHẦN 2 — PERSONAL POSITIONING

### 2.1 Định Vị Hiện Tại

| | Trạng thái |
|---|---|
| Role | Delivery Manager — presales + PM + client development |
| Company | FPT Japan (Tier 2 trong JP market) |
| Tier | Tier 2 — serve SIer, không touch end user trực tiếp |
| AI depth | Đang build (OPUS ANIMUS là proof of intent) |
| JP market | Onsite, có quan hệ SIer thực tế |

**Điểm mạnh hiện tại:** Quan hệ + presales instinct + JP context + chủ động build AI skill
**Điểm yếu hiện tại:** AI technical depth chưa đủ để credible trước CTO/end user

---

### 2.2 Target Role: AI Presales Pioneer tại FPT Japan

> **"Người đầu tiên mang FPT AI solution trực tiếp đến Japanese Enterprise — không qua trung gian."**

Không phải pure technical. Không phải pure sales.
Là người **own the conversation** với end user về AI:
- Hiểu đủ deep để nói chuyện với CTO/CDO của end user
- Biết FPT AI product/service đủ để propose đúng solution
- Có relationship để mở được cửa đầu tiên
- Biết JP enterprise culture để close được deal

---

### 2.3 Tại Sao Window Này — Tại Sao Là Bạn

**Tại sao window này:**
- Tier 1 SIer đang lúng túng với AI → khoảng trống tồn tại ngay bây giờ
- 18-24 tháng trước khi họ tự fill được gap
- End user đang chủ động tìm AI partner — không cần chờ SIer introduce

**Tại sao là bạn:**
- Onsite JP + quan hệ SIer thật → biết ai đang có pain về AI
- Presales experience → biết cách mở conversation với decision maker
- Đang chủ động build AI skill → sẽ có credibility trong 6-12 tháng
- Người VN onsite JP hiểu cả 2 culture → bridge role hiếm

**Rủi ro nếu không làm ngay:**
- SIer tự build AI capability → khoảng trống đóng lại
- Người khác trong FPT (hoặc bên ngoài) fill vị trí này trước

---

### 2.4 Skill Gap Cần Đóng

**Để credible trước end user JP về AI:**

| Skill | Hiện tại | Target | Timeline |
|---|---|---|---|
| FPT AI-in-SDLC methodology | Cơ bản | Expert — biết assess, biết propose roadmap | 3 tháng |
| LLM/Agent technical depth | Đang build | Đủ để nói chuyện với CTO | 6 tháng |
| Enterprise AI use case library | Ít | 20+ use cases theo industry | 3 tháng |
| Demo + POC capability | Chưa có | Tự demo được FPT AI products | 4 tháng |
| AI business case / ROI framing | Cơ bản | Tự viết được business case | 3 tháng |

**OPUS ANIMUS role:** Feed AI Engineering knowledge hàng ngày → rút ngắn timeline trên.

---

### 2.5 Proof Point Đầu Tiên

Một AI presales pioneer cần **1 deal đầu tiên** để chứng minh model hoạt động.

Tiêu chí deal đầu tiên:
- End user đang có pain về AI rõ ràng (không phải exploratory)
- FPT có sản phẩm/service phù hợp để propose
- Có thể bắt đầu bằng POC nhỏ (giảm rủi ro cho cả 2 bên)
- Bạn đã có quan hệ với người ra quyết định

**Action cần làm:**
- [ ] Map lại SIer relationships hiện tại → ai đang bị end user hỏi về AI?
- [ ] Xác định 2-3 end user tiềm năng để tiếp cận
- [ ] Master FPT AI-in-SDLC methodology → build assessment framework
- [ ] Build "AI Transformation Pitch" cho JP enterprise context (JP language, JP pain points)

---

### 2.6 Roadmap 12 Tháng

```
Q2 2026 (tháng 5-7) — FOUNDATION
  → Đọc FPT AI product catalogue, chọn 2 products để master
  → Build use case library: 10 AI use cases trong JP enterprise
  → Identify 2-3 end user target từ network SIer hiện tại
  → Internal: pitch AI presales idea với FPT Japan leadership

Q3 2026 (tháng 8-10) — FIRST MOVE
  → Thực hiện 1 AI discovery conversation với end user
  → Demo FPT AI product cho end user lần đầu
  → Propose POC (nhỏ, risk thấp)
  → Document: what worked, what didn't

Q4 2026 (tháng 11-12) — VALIDATE
  → 1 POC đang chạy hoặc đã close
  → Viết case study nội bộ: "AI Presales model hoạt động thế này"
  → Pitch leadership: scale model này ra toàn FPT Japan
  → Review: skill gap đã đóng được bao nhiêu?
```

---

## PHẦN 3 — KẾT NỐI

### 3.1 FPT Japan Cần Thay Đổi Gì

Để bạn thực hiện được AI Presales Pioneer role, FPT Japan cần:

| Thay đổi | Priority | Owner |
|---|---|---|
| Cho phép tiếp cận end user trực tiếp (không chỉ qua SIer) | 🔴 Critical | FPT Japan leadership |
| Cung cấp AI-in-SDLC methodology + case studies để dùng trong presales | 🔴 Critical | FPT delivery/engineering team |
| Pricing model linh hoạt: POC → subscription | 🟡 Important | Sales/BD team |
| Internal title/role recognition cho AI Presales | 🟡 Important | HR/leadership |

### 3.2 Cần Thuyết Phục Ai Nội Bộ

- **FPT Japan GM/Director** — approve go-direct-to-end-user strategy
- **FPT AI Product team** — get demo access + technical support
- **Current SIer accounts** — manage relationship, không để họ cảm thấy bị bypass

### 3.3 OPUS ANIMUS Feed Cho Hành Trình Này

| OPUS ANIMUS | Phục vụ gì |
|---|---|
| Daily AI brief (sau rebuild) | Cập nhật AI use cases, product landscape, JP enterprise AI adoption |
| personal-wiki AI section | Tích lũy knowledge về LLM/Agents → credibility với CTO |
| Reflection weekly | Kiểm tra: skill gap đang đóng chưa? Deal pipeline thế nào? |
| Research on-demand | Deep dive vào industry vertical khi chuẩn bị cho deal cụ thể |

---

## Câu Hỏi Kiểm Tra Hàng Quý

1. Tôi đã có conversation với end user về AI chưa — hay vẫn chỉ nói với SIer?
2. FPT AI product tôi biết đủ để demo một mình chưa?
3. Internal — leadership đã buy-in chưa, hay tôi đang làm một mình?
4. Proof point đầu tiên đang ở đâu trong pipeline?
5. OPUS ANIMUS có đang feed đúng knowledge tôi cần cho role này không?

---

*"The best time to plant a tree was 20 years ago. The second best time is now."*

*POSITIONING.md v1.0 — 2026-05-09*
*v1.1 — 2026-05-12 (Control Matrix + Open Questions added)*

---

## PHẦN 4 — OPEN QUESTIONS (chưa verify)

10 assumption nền của doc v1.0. Trước khi viết v1.2, cần data thật cho từng cái.

### Về thị trường / window

1. **Window 18–24 tháng có thật không?** Source: tôi tự nghĩ, không có report. → Cần: 2–3 industry report về JP SIer AI adoption (Nikkei, IDC Japan, Gartner JP).
2. **End user JP có thật sự bypass SIer để tìm AI partner?** Hay vẫn qua trusted vendor chain? → Cần: hỏi 2 contact end user trong network.
3. **Tier 1 SIer (NTT Data, Fujitsu, Accenture JP) đang ở đâu với AI?** "Lúng túng" so với ai? → Cần: check public AI announcements 12 tháng gần nhất.

### Về FPT

4. **FPT có AI product riêng không, hay chỉ có methodology?** §1.1 nói không, §1.4 nói có. → Cần: catalogue thật từ FPT AI team.
5. **"AI Presales Pioneer" role đã có hoặc có thể có ở FPT Japan?** → Cần: hỏi HR / Director.
6. **Leadership FPT Japan có open với pivot direct-to-end-user?** → Cần: 1 informal conversation với GM/Director trước khi commit roadmap.

### Về personal capability

7. **Trong 6 tháng part-time, AI depth khả thi đến đâu?** "CTO-level" không realistic. → Cần: định nghĩa lại "đủ credible" bằng tiêu chí cụ thể.
8. **JP enterprise sales cycle 9–18 tháng — Q3 first conversation → Q4 close có khả thi?** → Realistic: Q3 conversation → Q1/Q2 2027 POC → cuối 2027 contract.

### Về cost

9. **240h ngoài giờ trong 6 tháng — tradeoff thật là gì?** Family, health, current job performance. → Cần: viết explicit cost section.
10. **Plan B nếu FPT từ chối pivot?** Doc v1.0 không có. → Cần: scenario "FPT giữ Tier 2" → mình làm gì?

### Cách verify

- Q1–Q3, Q6 → desk research + report reading (2–4h)
- Q4–Q5 → internal informal conversation (1 tuần)
- Q7–Q8 → reflection + benchmark với 1–2 người đã làm role tương tự
- Q9 → reflection cá nhân, có thể discuss với gia đình
- Q10 → scenario planning 1h

**Cho đến khi 10 questions có answer:** doc v1.1 là *hypothesis doc*, không phải execution doc. Không commit major action chỉ dựa trên v1.1.
