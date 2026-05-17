# PLAN - Opus Lucida Foundation
**Date:** 2026-04-29
**Status:** Historical planning
**Project:** `opus-lucida`
**Parent:** `../../10-project-architecture-map.md`
**Superseded by:** `../../10-project-architecture-map.md`, `../../11-current-operating-flow.md`

---

## 1. Muc tieu cua file nay

File nay la ban plan goc de:

- sap xep bo tai lieu hien co thanh mot cau truc project ro rang;
- xac dinh file nao la source of truth o moi tang;
- chot workflow tu business -> content framework -> production -> distribution;
- tao nen cho RD/SD/BD chi tiet o buoc tiep theo.

Phan viec hien tai chi la **sap xep va quy hoach**.
Chua move file goc trong `Downloads/`.

---

## 2. Nhan dinh sau khi doc bo input

Bo tai lieu hien co da hinh thanh 5 tang tuong doi ro:

1. `Business / Strategy`
2. `Framework / Methodology`
3. `Sample Lesson / Content Prototype`
4. `Production System`
5. `Distribution / Data / Optimization`

Ngoai ra co mot nhanh phu rat quan trong:

- `Multi-agent production flow`

Nhanh nay khong phai business core, nhung la co che scale production sau khi sample dau tien on dinh.

Ket luan:

- `opus-lucida` nen duoc to chuc nhu mot workspace con, duoc `opus-consilium` ho tro va route input vao.
- Giai doan dau nen uu tien **content engine + funnel beta**, khong uu tien custom LMS.
- Source of truth cao nhat hien tai van la business plan va framework 3 View.

---

## 3. Cau truc de xuat cho `opus-lucida`

```text
opus-lucida/
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ PLAN-opus-lucida-foundation.md
â”‚   â”œâ”€â”€ RD-beta-launch.md
â”‚   â”œâ”€â”€ SD-beta-architecture.md
â”‚   â”œâ”€â”€ BD-phase-1-foundation.md
â”‚   â””â”€â”€ BACKLOG.md
â”œâ”€â”€ strategy/
â”‚   â”œâ”€â”€ business-plan/
â”‚   â”œâ”€â”€ positioning/
â”‚   â”œâ”€â”€ offers/
â”‚   â””â”€â”€ pricing/
â”œâ”€â”€ framework/
â”‚   â”œâ”€â”€ lesson-method/
â”‚   â”œâ”€â”€ grammar-3-view/
â”‚   â””â”€â”€ slide-method/
â”œâ”€â”€ lessons/
â”‚   â”œâ”€â”€ samples/
â”‚   â””â”€â”€ batches/
â”œâ”€â”€ production/
â”‚   â”œâ”€â”€ slide-skeletons/
â”‚   â”œâ”€â”€ design-briefs/
â”‚   â”œâ”€â”€ decks/
â”‚   â”œâ”€â”€ worksheets/
â”‚   â”œâ”€â”€ shorts/
â”‚   â””â”€â”€ review-reports/
â”œâ”€â”€ automation/
â”‚   â”œâ”€â”€ prompts/
â”‚   â”œâ”€â”€ workflows/
â”‚   â””â”€â”€ scripts/
â”œâ”€â”€ funnel/
â”‚   â”œâ”€â”€ landing/
â”‚   â”œâ”€â”€ lead-magnets/
â”‚   â”œâ”€â”€ waitlist/
â”‚   â””â”€â”€ email/
â””â”€â”€ analytics/
    â”œâ”€â”€ kpi/
    â”œâ”€â”€ experiments/
    â””â”€â”€ feedback/
```

---

## 4. Cach map cac file hien co vao cau truc moi

### 4.1 Business / Strategy

**Target folder:**

```text
strategy/business-plan/
strategy/positioning/
strategy/offers/
```

**Nguon hien co:**

- `business_plan_n_2_mvp_clean.md`

**Vai tro:**

- source of truth cho target customer;
- positioning kenh;
- product ladder;
- offer beta 4 tuan;
- roadmap 3 thang;
- KPI content / lead / monetization.

### 4.2 Framework / Methodology

**Target folder:**

```text
framework/lesson-method/
framework/grammar-3-view/
framework/slide-method/
```

**Nguon hien co:**

- `framework_giao_an_video_n_2_mvp_clean.md`
- `framework_addendum_3_view_giai_thich_ngu_phap.md`
- `method_viet_slide_video_n_2_mvp.md`
- `file_1_slide_method_guideline_n_2_mvp_clean.md`

**Vai tro:**

- source of truth cho pedagogical method;
- source of truth cho 3 View Grammar Coaching;
- source of truth cho role system cua slide.

**Nhan dinh:**

- `file_1_slide_method_guideline_n_2_mvp_clean.md` la ban operational hon `method_viet_slide_video_n_2_mvp.md`;
- `method_viet_slide_video_n_2_mvp.md` nen giu lam reference / note refactor;
- `framework_addendum_3_view_giai_thich_ngu_phap.md` nen hop nhat logic vao bo framework chinh sau.

### 4.3 Sample Lesson / Prototype

**Target folder:**

```text
lessons/samples/
```

**Nguon hien co:**

- `file_2_slide_skeleton_text_kai_gai_temade.md`

**Vai tro:**

- sample lesson operational dau tien;
- sample de validate framework;
- sample de sinh deck, worksheet, short, CTA.

**Nhan dinh:**

- nhom `ã‚ã‘` la public sample priority moi;
- `kai / gai / temade` duoc giu lam internal prototype de test framework;
- ca hai bai deu co gia tri, nhung vai tro da tach ro.

### 4.4 Production System

**Target folder:**

```text
production/slide-skeletons/
production/design-briefs/
production/decks/
production/worksheets/
production/shorts/
production/review-reports/
```

**Nguon hien co:**

- `architect_du_an_n_2_mvp.md`
- `file_1_slide_method_guideline_n_2_mvp_clean.md`
- `file_2_slide_skeleton_text_kai_gai_temade.md`

**Vai tro:**

- `architect_du_an_n_2_mvp.md` la architecture document cho content production system;
- `file_1...` la rulebook cho slide production;
- `file_2...` la skeleton operational.

### 4.5 Automation / Multi-agent

**Target folder:**

```text
automation/workflows/
automation/prompts/
```

**Nguon hien co:**

- `multi_agent_flow_tu_dong_tao_slide_n_2_mvp.md`

**Vai tro:**

- quy dinh vai tro planner / designer / reviewer;
- dinh nghia review gate;
- dinh huong de sau nay script hoa prompt flow.

### 4.6 Distribution / Data / Optimization

**Target folder:**

```text
funnel/
analytics/
```

**Nguon hien co:**

- logic nam rai trong `business_plan_n_2_mvp_clean.md`
- logic nam trong `architect_du_an_n_2_mvp.md`

**Nhan dinh:**

- chua co file operational rieng cho landing / waitlist / analytics;
- day la khoang trong can tao o phase tiep theo.

---

## 5. Source of truth tam thoi

Theo thu tu uu tien:

1. `business_plan_n_2_mvp_clean.md`
2. `framework_giao_an_video_n_2_mvp_clean.md`
3. `framework_addendum_3_view_giai_thich_ngu_phap.md`
4. `file_1_slide_method_guideline_n_2_mvp_clean.md`
5. `file_2_slide_skeleton_text_kai_gai_temade.md`
6. `multi_agent_flow_tu_dong_tao_slide_n_2_mvp.md`
7. `architect_du_an_n_2_mvp.md`
8. `method_viet_slide_video_n_2_mvp.md`

Ly do:

- business va framework quyet dinh logic;
- skeleton va slide method quyet dinh implementation;
- multi-agent flow va architecture la layer scale sau;
- `method_viet_slide_video_n_2_mvp.md` co gia tri reference nhung mot phan da duoc operational hoa boi `file_1`.

---

## 6. Architecture operational cho beta 3 thang

```text
Strategy
  -> Positioning
  -> Offer beta
  -> KPI

Framework
  -> 3 View grammar
  -> lesson design method
  -> slide method

Prototype
  -> sample lesson
  -> sample skeleton
  -> first deck

Production
  -> worksheet
  -> shorts
  -> CTA asset

Funnel
  -> landing page
  -> lead magnet
  -> waitlist
  -> payment link

Optimization
  -> retention
  -> comments
  -> downloads
  -> waitlist conversion
  -> beta feedback
```

Y nghia:

- business khong di thang vao quay video;
- moi asset phai sinh ra tu framework da duoc chot;
- sample dau tien la nut that lon nhat;
- funnel phai duoc dung song song voi production, khong de den luc co video moi nghi den lead.

---

## 7. Khoang trong hien tai

Nhung phan da co kha ro:

- business direction;
- offer beta;
- differentiation bang 3 View;
- framework day;
- slide methodology;
- sample skeleton dau tien;
- multi-agent review logic.

Nhung phan con thieu:

- RD chinh thuc cho `opus-lucida`;
- SD chinh thuc cho kien truc beta;
- thong nhat naming convention trong repo;
- landing page requirements;
- lead magnet requirements;
- waitlist funnel requirements;
- analytics va experiment log;
- quy uoc versioning cho lesson / deck / worksheet;
- workspace folder structure thuc te cho production files.

---

## 8. Ke hoach build tai lieu tiep theo

### Phase 1 - Foundation Docs

Can tao:

- `docs/RD-beta-launch.md`
- `docs/SD-beta-architecture.md`
- `docs/history/BD-phase-1-foundation.md`

### Phase 2 - Workspace Skeleton

Can tao:

- `strategy/`
- `framework/`
- `lessons/`
- `production/`
- `automation/`
- `funnel/`
- `analytics/`

### Phase 3 - Normalize Documents

Can lam:

- dua moi file ve dung folder;
- doi ten file theo convention gon va on dinh;
- tach file operational va file reference;
- danh dau file nao la active, file nao la archive/reference.

### Phase 4 - Funnel Build

Can lam:

- landing page spec;
- lead magnet spec;
- waitlist flow;
- CTA mapping tu YouTube -> worksheet -> waitlist.

### Phase 5 - Production Engine

Can lam:

- template sample lesson;
- template slide skeleton;
- template review report;
- template worksheet;
- prompt pack cho AI-assisted production.

---

## 9. Naming convention de xuat

Cho file trong `opus-lucida`, nen chuyen ve dang:

```text
01-business-plan.md
02-framework-lesson-method.md
03-framework-3-view-grammar.md
04-slide-method-guideline.md
05-sample-internal-test-case.md
06-skeleton-internal-test-case.md
07-workflow-multi-agent-production.md
08-architecture-content-production.md
```

Nguyen tac:

- uu tien ten ngan, ro vai tro;
- khong de suffix qua dai theo lich su trao doi;
- neu can version, them `-v1`, `-v2`;
- file active khong de tu `clean` trong ten.

---

## 10. De xuat sap xep thuc te o buoc tiep theo

Khi bat dau normalize file, nen sap nhu sau:

```text
strategy/business-plan/01-business-plan.md
framework/lesson-method/02-framework-lesson-method.md
framework/grammar-3-view/03-framework-3-view-grammar.md
framework/slide-method/04-slide-method-guideline.md
lessons/samples/05-sample-internal-test-case.md
production/slide-skeletons/06-skeleton-internal-test-case.md
automation/workflows/07-workflow-multi-agent-production.md
docs/SD-content-production-architecture.md
```

Luu y:

- `architect_du_an_n_2_mvp.md` hop hon khi doi thanh mot file SD/architecture;
- `method_viet_slide_video_n_2_mvp.md` nen dua vao `docs/reference/` hoac `framework/slide-method/reference/`.

---

## 11. Next action de xuat

Thu tu hop ly nhat:

1. tao `RD-beta-launch.md` cho `opus-lucida`;
2. scaffold folder structure thuc te;
3. normalize va copy cac file nguon vao dung vi tri moi;
4. tao `SD-beta-architecture.md`;
5. tao plan rieng cho landing + lead magnet + waitlist;
6. sau do moi bat tay vao build.

---

## 12. Ket luan

Bo input hien tai khong phai mot dong note roi rac nua; no da du manh de tro thanh nen mong cho `opus-lucida`.

Dieu can lam tiep khong phai viet them framework tu dau, ma la:

- chot file nao la active;
- dua chung vao dung folder;
- dong bang source of truth;
- va tach ro 3 lop:
  business,
  production method,
  monetization funnel.

File nay la moc dau tien cho viec do.

