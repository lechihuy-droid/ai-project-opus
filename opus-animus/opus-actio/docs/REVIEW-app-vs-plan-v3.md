# REVIEW — App Actio vs Plan tài chính v3

**Ngày:** 2026-07-04 · **Người review:** Claude (Fable) · **Căn cứ:** `data/_local/plan-v3.md` (PHẦN IV — KPI contract)
**Câu hỏi:** *App hiện tại có phục vụ được plan tài chính v3 không?*
**Trả lời ngắn:** **Phục vụ được ~60% phần chẩn đoán, ~20% phần vận hành.** App giỏi trả lời "tôi đang có gì" nhưng plan v3 là plan *hành vi* — cần app trả lời "tháng này tôi đã làm đúng chưa". Phần đó gần như chưa có.

---

## 1. Hiện trạng app (inventory)

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| finance.db (snapshot + card_txn + views) | ✅ | Mới 1 snapshot → chưa có trend |
| Ingest scripts (finance/cards) | ✅ | Chạy tay theo tháng |
| Config layer (profile/goals/IPS/retirement/review-cadence) | ✅ | Đủ cho plan v3 |
| 11 skill `/actio-*` | ✅ | Chẩn đoán tốt, chạy trong Claude Code |
| API `/api/actio/overview` | ✅ | Bundle chẩn đoán đầy đủ (allocation 2 cấp, IPS, FIRE range, mortgage, actions) |
| API `/api/actio/plan` | 🟡 | Có nhưng **thô**: waterfall gộp 3 bucket (thiếu tách NISA tsumitate/growth, bond sleeve), không bonus rule, không checklist, không exit criteria, không stress test DTI, không scenario switch |
| Dashboard ActioView (overview cockpit) | ✅ | Advisory cockpit v2 đã build (2026-06) |
| Dashboard **PlanView** | ❌ | SD design brief đã có (`SD-plan-dashboard.md`) — **chưa build** |
| Tracking trạng thái hành động (checklist, one-off, DCA tranche) | ❌ | Không tồn tại ở bất kỳ layer nào |
| Income/payslip trong DB | ❌ | Savings rate tính từ ước tính trong config, không từ data |

## 2. Đối chiếu với KPI contract (plan v3 PHẦN IV)

| KPI plan v3 | App đáp ứng? | Thiếu gì |
|---|---|---|
| Savings rate tháng | 🟡 | Tính từ config estimate; chưa có income thực trong DB |
| Contrib status (iDeCo/NISA/bond thực nạp vs waterfall) | 🔴 | Chỉ có flag `contrib_status` tĩnh trong retirement.json; không có số thực nạp theo tháng |
| Idle cash ngoài EF+reserve | ✅ | overview tính sẵn + opportunity cost |
| DCA tranche progress | 🔴 | Không có khái niệm tranche/lịch giải ngân |
| Single-name % ≤10% | ✅ | IPS violations có sẵn |
| Sleeve drift ≤5pp | ✅ | drift_pp có sẵn |
| NISA quota năm + lifetime | 🟡 | portfolio-meta có; chưa surface thành KPI có ngưỡng |
| DTI @current & @+2pp stress | 🔴 | Mortgage scenario chỉ tính @rate hiện tại, **không stress test** |
| FI progress band | ✅ | fire_range + proj_range có |
| Glide check (tuổi vs bond%) | 🟡 | /plan có glide lý thuyết; không so với allocation thực |
| Review due | ✅ | review_due có |
| One-off actions trạng thái (done/quá hạn 90 ngày) | 🔴 | `actions` synthesize lại mỗi lần từ data — không đánh dấu done được, không deadline |

**Điểm:** 5 ✅ · 3 🟡 · 4 🔴. Bốn KPI đỏ đều thuộc nhóm **execution tracking** — đúng chỗ plan v3 nói hồ sơ "thiếu kỷ luật triển khai". App hiện tại phản chiếu vấn đề của chủ nó: đo trạng thái giỏi, đo hành động kém.

## 3. Đánh giá kiến trúc & quy trình

**Điểm mạnh giữ nguyên:**
- Privacy 2 lớp (số thật ở `_local`, gitignored) vận hành nghiêm túc — giữ làm ràng buộc thiết kế.
- Localhost-only FastAPI + static React (CDN) — 0 chi phí, 0 API metered, đủ cho 1 user.
- Config layer JSON có schema — plan v3 map thẳng vào được.
- Skills chẩn đoán sâu (Claude Code) tách khỏi dashboard hiển thị — phân công đúng.

**Điểm yếu:**
1. **Không có vòng lặp thực thi.** Plan → (không có gì) → snapshot tháng sau. Giữa hai đầu là hộp đen; app không biết iDeCo đã bật chưa, tranche tháng này giải ngân chưa.
2. `/api/actio/plan` hardcode logic dự phóng, không đọc tham số plan từ config → plan v3 đổi số là phải sửa code.
3. 1 snapshot duy nhất → trend, glide check, KPI theo thời gian đều chết đói data.
4. Docs SD cũ (`SD-actio-dashboard-v2.md`) chứa số thật trong sample contract — lệch policy "docs = range only". Cần quy ước lại khi viết SD mới.

## 4. Kết luận review

App **không cần rebuild từ nền** — data layer + overview cockpit + skills giữ nguyên. Cái cần build là **lớp vận hành plan** (Plan Cockpit): backend plan v2 đọc config, plan-state tracking, PlanView UI, KPI engine với ngưỡng từ PHẦN 0 plan v3. Chi tiết → `PLAN-app-rebuild.md` + SDD (`RD-plan-cockpit.md`).
