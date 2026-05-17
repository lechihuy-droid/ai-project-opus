# BD - Opus Lucida Phase 1 Foundation
**Date:** 2026-04-29
**Status:** Historical planning
**Ref:** `../RD-beta-launch.md`, `../SD-beta-architecture.md`, `PLAN-opus-lucida-foundation.md`
**Estimate:** 6-10 hours
**Parent:** `../../10-project-architecture-map.md`
**Superseded by:** `../../11-current-operating-flow.md`, `../../12-repo-folder-status-map.md`

---

## Prerequisites

Truoc khi bat dau build, can co:

- [x] RD approved o muc direction (`docs/RD-beta-launch.md`)
- [x] SD approved o muc architecture (`docs/SD-beta-architecture.md`)
- [x] Ten workspace da chot: `opus-lucida`
- [ ] Xac nhan co the copy/normalize cac file input tu `Downloads/` vao repo
- [ ] Chot convention active vs reference neu can dieu chinh

---

## Goal of Phase 1

Phase 1 co muc tieu:

- tao workspace structure that su cho `opus-lucida`;
- dua bo input hien co vao dung vi tri;
- phan tach file active va file reference;
- tao bo artifact nen de bat dau build landing, lead magnet va production engine;
- chuan bi san cho Phase 2 ma khong phai tai quy hoach.

Phase nay **chua** build landing page hoan chinh, chua publish funnel, chua tao checkout.

---

## Build Steps

### Step 0 - Verify current workspace state
**Muc tieu:** Xac nhan `opus-lucida` dang o muc nao, tranh overwrite nham

**Files:**
- Doc: `opus-lucida/docs/`

**Viec lam:**
- [ ] Kiem tra folder `opus-lucida/` hien co
- [ ] Kiem tra 3 file docs da tao: RD / SD / PLAN
- [ ] Kiem tra worktree co file nao user da them tay khong

**Smoke test:** `Get-ChildItem 'C:\\Users\\HUY\\AI\\OPUS ANIMUS\\opus-lucida' -Recurse`
-> expected: chi co `docs/` va 3 file foundation, hoac co them file moi nhung khong conflict

**Estimate:** 10 min

---

### Step 1 - Scaffold full folder architecture
**Muc tieu:** Tao day du folder structure theo SD

**Files:**
- Tao moi:
  - `strategy/`
  - `framework/`
  - `lessons/`
  - `production/`
  - `automation/`
  - `funnel/`
  - `analytics/`
  - subfolders can thiet theo SD

**Viec lam:**
- [ ] Tao `strategy/business-plan/`
- [ ] Tao `strategy/positioning/`
- [ ] Tao `strategy/offers/`
- [ ] Tao `strategy/pricing/`
- [ ] Tao `framework/lesson-method/`
- [ ] Tao `framework/grammar-3-view/`
- [ ] Tao `framework/slide-method/`
- [ ] Tao `framework/slide-method/reference/`
- [ ] Tao `lessons/samples/`
- [ ] Tao `lessons/batches/`
- [ ] Tao `production/slide-skeletons/`
- [ ] Tao `production/design-briefs/`
- [ ] Tao `production/decks/`
- [ ] Tao `production/worksheets/`
- [ ] Tao `production/shorts/`
- [ ] Tao `production/review-reports/`
- [ ] Tao `automation/prompts/`
- [ ] Tao `automation/workflows/`
- [ ] Tao `automation/scripts/`
- [ ] Tao `funnel/landing/`
- [ ] Tao `funnel/lead-magnets/`
- [ ] Tao `funnel/waitlist/`
- [ ] Tao `funnel/email/`
- [ ] Tao `analytics/kpi/`
- [ ] Tao `analytics/experiments/`
- [ ] Tao `analytics/feedback/`
- [ ] Tao `docs/reference/`

**Smoke test:** `Get-ChildItem 'C:\\Users\\HUY\\AI\\OPUS ANIMUS\\opus-lucida'`
-> expected: thay day du 8 tang chinh + `docs`

**Estimate:** 20 min

---

### Step 2 - Define active file set
**Muc tieu:** Tao bo file active toi thieu cho moi tang

**Files:**
- Tao moi:
  - `strategy/business-plan/01-business-plan.md`
  - `framework/lesson-method/02-framework-lesson-method.md`
  - `framework/grammar-3-view/03-framework-3-view-grammar.md`
  - `framework/slide-method/04-slide-method-guideline.md`
  - `lessons/samples/05-sample-internal-test-case.md`
  - `production/slide-skeletons/06-skeleton-internal-test-case.md`
  - `automation/workflows/07-workflow-multi-agent-production.md`
  - `analytics/kpi/01-kpi-definition.md`
  - `analytics/feedback/01-feedback-log.md`
  - `funnel/landing/RD-landing-page.md`
  - `funnel/lead-magnets/RD-lead-magnet-01.md`
  - `funnel/waitlist/RD-waitlist-flow.md`

**Viec lam:**
- [ ] Tao placeholder file active voi heading dung role
- [ ] Trong moi file, ghi ro status: draft / active / reference
- [ ] Link nguon tham chieu ve file goc hoac docs foundation

**Smoke test:** `Get-ChildItem 'C:\\Users\\HUY\\AI\\OPUS ANIMUS\\opus-lucida' -Recurse -File`
-> expected: co bo file active co ten on dinh theo convention

**Estimate:** 30 min

---

### Step 3 - Copy and normalize strategy source
**Muc tieu:** Dua business input vao repo duoi ten active on dinh

**Files:**
- Nguon:
  - `C:\Users\HUY\Downloads\business_plan_n_2_mvp_clean.md`
- Dich:
  - `strategy/business-plan/01-business-plan.md`

**Phu thuoc:** Step 2 done

**Viec lam:**
- [ ] Copy noi dung business plan vao file active
- [ ] Chuan hoa heading, encoding, format markdown neu can
- [ ] Giá»¯ nguyen logic target user, product ladder, roadmap, KPI
- [ ] Them section nho neu can de note â€œnormalized from sourceâ€
- [ ] Khong lam mat noi dung monetization va channel strategy

**Smoke test:** Mo `01-business-plan.md`
-> expected: co day du target, positioning, roadmap 3 thang, product ladder, KPI

**Estimate:** 30-45 min

---

### Step 4 - Copy and normalize framework sources
**Muc tieu:** Dua toan bo pedagogical framework vao dung tang

**Files:**
- Nguon:
  - `framework_giao_an_video_n_2_mvp_clean.md`
  - `framework_addendum_3_view_giai_thich_ngu_phap.md`
  - `file_1_slide_method_guideline_n_2_mvp_clean.md`
  - `method_viet_slide_video_n_2_mvp.md`
- Dich:
  - `framework/lesson-method/02-framework-lesson-method.md`
  - `framework/grammar-3-view/03-framework-3-view-grammar.md`
  - `framework/slide-method/04-slide-method-guideline.md`
  - `framework/slide-method/reference/method-viet-slide-video.md`

**Phu thuoc:** Step 2 done

**Viec lam:**
- [ ] Copy framework lesson method thanh file active
- [ ] Copy 3 View addendum thanh file active rieng
- [ ] Copy slide guideline operational thanh file active
- [ ] Dua `method_viet_slide_video...` vao `reference/`
- [ ] Giá»¯ ro distinction:
  - file active = operational rule
  - file reference = tu duy / note bo tro

**Smoke test:** Kiem tra 3 file active framework
-> expected: moi file co vai tro rieng, khong trung lap mot cach mo ho

**Estimate:** 45-60 min

---

### Step 5 - Copy and normalize sample lesson + skeleton
**Muc tieu:** Dong bang bai mau trung tam cua phase dau

**Files:**
- Nguon:
  - `file_2_slide_skeleton_text_kai_gai_temade.md`
- Dich:
  - `lessons/samples/05-sample-internal-test-case.md`
  - `production/slide-skeletons/06-skeleton-internal-test-case.md`

**Phu thuoc:** Step 2 done

**Viec lam:**
- [ ] Tach ro phan â€œsample lessonâ€ va phan â€œslide skeletonâ€ neu can
- [ ] Neu chua tach duoc trong mot luot, uu tien:
  - `06-skeleton-internal-test-case.md` = ban skeleton active
  - `05-sample-internal-test-case.md` = ban sample lesson / summary source
- [ ] Ghi ro production version 18 slide la ban uu tien
- [ ] Giá»¯ nguyen story, pain point, 3 View, CTA logic

**Smoke test:** Mo 2 file active
-> expected:
  - `05-sample...` mo ta bai mau ro
  - `06-skeleton...` la file operational de sang deck

**Estimate:** 45-60 min

---

### Step 6 - Copy and normalize automation / architecture references
**Muc tieu:** Dua multi-agent flow va architecture goc vao dung noi

**Files:**
- Nguon:
  - `multi_agent_flow_tu_dong_tao_slide_n_2_mvp.md`
  - `architect_du_an_n_2_mvp.md`
- Dich:
  - `automation/workflows/07-workflow-multi-agent-production.md`
  - `docs/reference/architecture-content-course-source.md`

**Phu thuoc:** Step 2 done

**Viec lam:**
- [ ] Copy multi-agent flow thanh file active workflow
- [ ] Copy architecture source thanh file reference
- [ ] Ghi ro file SD hien tai da absorb nhung decision nao tu architecture source
- [ ] Khong de 2 file active architecture xung dot nhau

**Smoke test:** Mo `07-workflow-multi-agent-production.md`
-> expected: co role split planner / designer / reviewer va review gates ro

**Estimate:** 30-45 min

---

### Step 7 - Create funnel requirement stubs
**Muc tieu:** Chuan bi noi de build landing va lead magnet tiep theo

**Files:**
- Tao moi:
  - `funnel/landing/RD-landing-page.md`
  - `funnel/lead-magnets/RD-lead-magnet-01.md`
  - `funnel/waitlist/RD-waitlist-flow.md`

**Phu thuoc:** Step 3 done

**Viec lam:**
- [ ] Tao stub cho landing page RD
- [ ] Tao stub cho lead magnet RD
- [ ] Tao stub cho waitlist flow RD
- [ ] Link ve business plan, RD beta launch va SD beta architecture
- [ ] Ghi ro CTA candidates:
  - worksheet
  - 3 View guide
  - waitlist

**Smoke test:** Mo 3 file stub
-> expected: moi file co heading, problem, ref, next questions

**Estimate:** 20-30 min

---

### Step 8 - Create analytics foundations
**Muc tieu:** Tao noi ghi KPI va feedback de toi uu sau nay

**Files:**
- Tao moi:
  - `analytics/kpi/01-kpi-definition.md`
  - `analytics/feedback/01-feedback-log.md`
  - `analytics/experiments/01-experiment-log.md`

**Phu thuoc:** Step 3 done

**Viec lam:**
- [ ] Din h nghia KPI content / lead / monetization tu business plan
- [ ] Tao feedback log template de phan loai feedback theo tang
- [ ] Tao experiment log template de test hook / CTA / lead magnet

**Smoke test:** Mo 3 file analytics
-> expected: co structure de log ma khong can dashboard custom

**Estimate:** 20-30 min

---

### Step 9 - Create workspace guide
**Muc tieu:** Giup ban va agent sau nay hieu nhanh cach dung `opus-lucida`

**Files:**
- Tao moi:
  - `opus-lucida/README.md`
  - `opus-lucida/CLAUDE.md`

**Phu thuoc:** Step 1-8 done

**Viec lam:**
- [ ] Viet `README.md` mo ta workspace, muc tieu, folder structure, current status
- [ ] Viet `CLAUDE.md` quy dinh:
  - source of truth
  - active vs reference
  - sample-first
  - SaaS boundary
  - docs-sync rule

**Smoke test:** Mo `README.md` va `CLAUDE.md`
-> expected: co the onboard lai project nhanh chi bang 2 file nay

**Estimate:** 30-45 min

---

### Step 10 - Integration review
**Muc tieu:** Kiem tra toan workspace da coherent

**Test cases:**
- [ ] Happy path:
  Mo `docs/history/PLAN-opus-lucida-foundation.md` -> tim duoc link logic sang RD, SD, BD
- [ ] Happy path:
  Tu `strategy/business-plan/01-business-plan.md` -> suy ra duoc framework va funnel docs lien quan
- [ ] Happy path:
  Tu `lessons/samples/05-sample-internal-test-case.md` -> tim duoc skeleton active
- [ ] Happy path:
  Tu `production/slide-skeletons/06-skeleton-internal-test-case.md` -> tim duoc workflow review
- [ ] Edge case:
  Kiem tra file reference khong bi nham voi file active
- [ ] Error case:
  Neu co 2 file cung vai tro active, ghi lai va hop nhat

**Estimate:** 20-30 min

---

## Rollback Plan

Neu Step 3-6 fail hoac normalize sai:

- xoa cac file active moi tao trong `opus-lucida/`
- giu nguyen file goc trong `Downloads/`
- khong overwrite file goc
- tao lai file active tu source ban dau

Khong co DB migration -> rollback don gian.

---

## Checklist Truoc Khi Done

- [ ] Day du folder structure theo SD da duoc tao
- [ ] Moi file input chinh da co cho dung trong workspace
- [ ] File active va file reference duoc tach ro
- [ ] Co sample lesson active
- [ ] Co skeleton active
- [ ] Co workflow multi-agent active
- [ ] Co stubs cho landing / lead magnet / waitlist
- [ ] Co KPI / feedback / experiment logs
- [ ] Co `README.md` va `CLAUDE.md`
- [ ] Khong co file source quan trong nao bi bo sot

---

## Deliverables of Phase 1

Sau Phase 1, `opus-lucida` phai co:

- mot workspace structure hoan chinh;
- mot bo source-of-truth active files;
- mot bo reference files duoc dat dung cho;
- mot sample bai dau tien san sang de di tiep sang deck / worksheet / funnel;
- mot nen docs de build Phase 2 nhanh.

---

## Suggested Order of Execution

Neu lam ngay sau BD nay, thu tu nen la:

1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5
6. Step 6
7. Step 8
8. Step 7
9. Step 9
10. Step 10

Ly do:

- scaffold truoc;
- normalize source-of-truth truoc;
- analytics va funnel stubs tao sau khi strategy active da ro;
- guide viet cuoi de mo ta dung trang thai that.

---

*Opus Lucida - BD phase 1 foundation v0.1 | 2026-04-29*

