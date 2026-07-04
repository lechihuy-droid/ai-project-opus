# PLAN — App rebuild: Actio Plan Cockpit

**Ngày:** 2026-07-04 · **Căn cứ:** `REVIEW-app-vs-plan-v3.md` + `data/_local/plan-v3.md` (PHẦN IV)
**Nguyên tắc:** không đập data layer / overview / skills — chỉ build **lớp vận hành plan** còn thiếu. Coding giao Codex theo SDD (RD → SD → BD).

## Phạm vi (4 workstream)

| WS | Tên | Nội dung | Giải quyết KPI đỏ |
|---|---|---|---|
| WS1 | **Plan config** | Tách tham số plan v3 ra `data/_local/plan-config.json` (waterfall 5 bậc, bonus rule, tranche schedule, exit criteria, stress +2pp, glide table). Backend đọc config thay vì hardcode | nền cho tất cả |
| WS2 | **Plan-state tracking** | `data/_local/plan-state.json` + API GET/POST: checklist tháng, one-off actions (done/deadline 90d), DCA tranche log, contrib thực nạp theo tháng | contrib status · DCA progress · one-off actions |
| WS3 | **Backend `/api/actio/plan` v2** | Trả đủ contract SD-plan-dashboard §7: north_star, monthly (waterfall đủ bậc + checklist + bonus rule + contrib status thực), medium (years + house gate + **DTI stress +2pp**), long (blocks 3/4/5% + glide vs actual + bridge), **kpis[]** (12 KPI PHẦN IV với target/actual/verdict) | DTI stress · glide check · NISA KPI |
| WS4 | **PlanView UI** | Tab "Plan" trong opus-home theo `SD-plan-dashboard.md`: hero North Star, timeline spine, 3 tab THÁNG/5 NĂM/TỚI HƯU, KPI board, checklist tương tác (persist qua WS2) | hiển thị + hành vi |

## Ngoài phạm vi (giữ nguyên / defer)
- Ingest income/payslip vào DB (savings rate từ data thật) → backlog, config estimate đủ dùng trước.
- Mobile PWA / FINOPT — deferred như cũ.
- Auth/deploy ngoài localhost — không làm.
- Không sửa ActioView (overview) trừ khi thêm link sang tab Plan.

## Trình tự & phân công

```
RD-plan-cockpit (Claude, approve) → SD-plan-cockpit (Claude, approve)
→ BD-plan-cockpit (Claude) → TASK-codex-plan-cockpit (Codex implement WS1→WS4)
→ Claude review + verify (chạy server, check endpoint + UI)
```

## Definition of done
1. `GET /api/actio/plan` trả kpis[] với verdict đúng ngưỡng plan v3 PHẦN 0.
2. Check 1 mục checklist trên UI → reload → còn nguyên (persist plan-state).
3. Đổi 1 số trong plan-config.json → API phản ánh, không sửa code.
4. DTI hiển thị cả @current và @+2pp stress.
5. Số thật không xuất hiện trong file tracked nào (docs mới = range only).
