# RD — Actio Plan Cockpit

**Date:** 2026-07-04 · **Status:** 🟢 Approved (goal-mode 2026-07-04, theo PLAN-app-rebuild.md)
**Author:** Claude · **Nguồn yêu cầu:** plan-v3 PHẦN IV (KPI contract) + REVIEW-app-vs-plan-v3.md

## 0. Problem Statement

Plan tài chính v3 là plan *hành vi* (kích hoạt wrapper, DCA theo lịch, trim, checklist tháng). App hiện tại chỉ chẩn đoán trạng thái (`/api/actio/overview` + ActioView); **không có chỗ nào ghi nhận "đã làm chưa"** và `/api/actio/plan` hardcode logic, thiếu ½ contract mà design brief `SD-plan-dashboard.md` cần. Kết quả: 4/12 KPI của plan v3 không đo được (contrib thực, DCA progress, one-off actions, DTI stress).

## 1. Usage

**User:** chính chủ, review hàng tháng trên laptop (opus-home localhost:8765).

```
Hàng tháng (ngày lương):
1. Mở tab "Plan" → hero cho biết on-track không, KPI board cho biết cái gì đỏ
2. Tab THÁNG: check các mục checklist đã làm (auto-invest, DCA tranche, chi tiêu)
   → app persist, tháng sau tự mở checklist tháng mới
3. One-off actions (bật iDeCo, trim, bond sleeve): đánh done khi xong;
   quá deadline 90 ngày chưa done → badge đỏ
Hàng quý: tab 5 NĂM / TỚI HƯU — quỹ đạo, cửa sổ mua nhà, glide vs thực tế
Khi plan đổi số: sửa data/_local/plan-config.json → UI phản ánh, không sửa code
```

## 2. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | `plan-config.json` (_local): waterfall đủ bậc, bonus rule, lịch DCA tranche, one-off actions + deadline, house gate (DTI max + stress +2pp), glide table, exit criteria, KPI thresholds. Backend đọc config — không hardcode tham số plan | P0 |
| FR-2 | `plan-state.json` (_local) + API `GET/POST /api/actio/plan/state`: checklist theo tháng, one-off done/done_date, tranche done, contrib thực nạp theo tháng | P0 |
| FR-3 | `GET /api/actio/plan` v2 trả đủ: north_star, monthly{waterfall, checklist(merge state), bonus_rule, oneoff(merge state + overdue flag), contrib_status_actual}, medium{years, house{dti, dti_stress}}, long{blocks 3 dải, glide_target vs bond_actual, bridge}, **kpis[12]** {id,label,target,actual,verdict} theo plan v3 PHẦN IV | P0 |
| FR-4 | PlanView = tab "Plan" trong opus-home theo design brief `SD-plan-dashboard.md`: hero North Star, timeline spine, 3 tab THÁNG/5NĂM/TỚI HƯU, KPI board, checklist tương tác persist qua FR-2 | P0 |
| FR-5 | Toggle kịch bản real 3/4/5% cập nhật projection (client-side từ blocks 3 dải) | P1 |
| FR-6 | Toggle ¥ ↔ 万 | P2 |

## 3. Non-Functional

| ID | Requirement |
|---|---|
| NFR-1 | Privacy: số thật chỉ ở `_local` + API localhost. File tracked (docs, index.html) không chứa số thật — mọi sample trong code/docs là hư cấu |
| NFR-2 | Không dependency mới: FastAPI + React CDN + babel như hiện tại; state = JSON file, không DB mới |
| NFR-3 | Mọi field optional phải guard — thiếu config/state không được crash view |
| NFR-4 | Tiếng Việt terse, dark theme, CSS vars có sẵn của opus-home |

## 4. Out of Scope
Ingest payslip/income vào DB · mobile PWA · auth · sửa ActioView/overview · notification.

## 5. Open Questions (chốt tạm, tune sau)
1. Checklist tháng nào hiện? → tháng hiện tại theo clock máy; tháng cũ đọc-only.
2. Contrib thực nạp: nhập tay qua UI hay sửa JSON? → v1 sửa JSON tay (POST state chỉ phục vụ checklist/oneoff/tranche); nhập tay UI = backlog.
