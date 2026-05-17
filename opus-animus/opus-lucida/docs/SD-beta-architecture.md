# SD - Opus Lucida Beta Architecture
**Date:** 2026-04-29
**Status:** Draft
**Project:** `opus-lucida`
**Ref:** `RD-beta-launch.md`, `history/PLAN-opus-lucida-foundation.md`

---

## 0. Muc tieu cua SD nay

Tai lieu nay chot kien truc beta cho `opus-lucida` de:

- bien business direction thanh workspace operational;
- tach ro tung tang strategy, framework, lesson, production, funnel va analytics;
- dam bao cac file input hien co duoc tai su dung day du;
- chot boundary de sau nay build nhanh nhung khong roi logic.

Nguyen tac cua SD nay:

> Khong tao kien truc moi tu dau neu bo input da co cau tra loi. Uu tien dua noi dung hien co vao dung component va dung lifecycle.

---

## 1. Architecture Principle

### 1.1 Sample-first, not platform-first

`opus-lucida` duoc thiet ke theo huong:

```text
Business clarity
-> Teaching framework
-> Sample lesson
-> Production assets
-> Funnel assets
-> Lead / beta conversion
```

Khong theo huong:

```text
Build LMS / build app / build dashboard truoc
```

### 1.2 File-first, SaaS-assisted

Phan logic va source of truth nam o markdown files trong repo.  
Phan external execution nam o SaaS:

- landing deploy
- email capture
- waitlist
- payment
- delivery

### 1.3 Human-reviewed AI acceleration

AI duoc dung de:

- tao nhap;
- tach skeleton;
- de xuat quiz, worksheet, short scripts;
- review theo checklist.

Nhung teacher/operator van la gate cuoi cho:

- grammar meaning;
- grammar form;
- grammar usage/nuance;
- CTA phu hop target user.

### 1.4 Layered feedback

Moi feedback phai quay ve dung tang:

- sai target / offer -> strategy
- sai cach day -> framework
- sai bai cu the -> lesson sample
- slide qua nhieu chu -> production method
- CTA kem -> funnel
- retention kem -> script / slide / hook

---

## 2. Source Traceability

Day la bang truy vet de dam bao bo input duoc tai su dung day du.

| Nguon input | Vai tro goc | Component dich trong `opus-lucida` |
|---|---|---|
| `business_plan_n_2_mvp_clean.md` | business plan, target, product ladder, roadmap, KPI | `strategy/`, `funnel/`, `analytics/`, `docs/RD-beta-launch.md` |
| `framework_giao_an_video_n_2_mvp_clean.md` | pedagogical framework cho lesson | `framework/lesson-method/` |
| `framework_addendum_3_view_giai_thich_ngu_phap.md` | chi tiet 3 View method | `framework/grammar-3-view/` |
| `method_viet_slide_video_n_2_mvp.md` | tu duy viet slide cap method | `framework/slide-method/reference/` |
| `file_1_slide_method_guideline_n_2_mvp_clean.md` | operational guideline cho slide | `framework/slide-method/` |
| `file_2_slide_skeleton_text_kai_gai_temade.md` | sample skeleton operational | `lessons/samples/`, `production/slide-skeletons/` |
| `architect_du_an_n_2_mvp.md` | architecture cho content/course project | SD hien tai, `docs/` |
| `multi_agent_flow_tu_dong_tao_slide_n_2_mvp.md` | multi-agent production/review flow | `automation/workflows/`, `production/review-reports/` |

Ket luan:

- khong co file input nao bi bo qua;
- mot so file duoc dung lam source-of-truth;
- mot so file duoc dung lam operational reference;
- SD nay la noi hop nhat chung thanh mot he thong coherent.

---

## 3. System Overview

`opus-lucida` gom 6 component operational chinh:

1. Strategy System
2. Framework System
3. Lesson System
4. Production System
5. Funnel System
6. Analytics System

Va 1 component cross-cutting:

7. Automation / Multi-agent Support

```text
Strategy
  -> Framework
    -> Lesson Sample / Batch
      -> Production Assets
        -> Funnel Assets
          -> Leads / Waitlist / Beta Sales
            -> Analytics / Feedback
              -> update Strategy / Framework / Lesson / Production
```

---

## 4. Folder Architecture

```text
opus-lucida/
â”œâ”€â”€ docs/
â”œâ”€â”€ strategy/
â”œâ”€â”€ framework/
â”œâ”€â”€ lessons/
â”œâ”€â”€ production/
â”œâ”€â”€ automation/
â”œâ”€â”€ funnel/
â””â”€â”€ analytics/
```

### 4.1 `docs/`

Chua:

- RD
- SD
- BD
- backlog
- architecture decisions

Vai tro:

- governance layer;
- project-wide documents;
- khong chua lesson operational chi tiet.

### 4.2 `strategy/`

Chua:

- business plan
- positioning
- offer
- pricing
- roadmap monetization

Vai tro:

- tra loi ban cho ai;
- khac biet o dau;
- offer beta la gi;
- KPI business la gi.

### 4.3 `framework/`

Chua:

- lesson methodology
- 3 View grammar method
- slide method

Vai tro:

- tra loi day the nao;
- phan biet bai hoc tot va bai hoc yeu theo logic nao;
- la bo rule bat buoc cho moi lesson.

### 4.4 `lessons/`

Chua:

- sample lesson
- master teaching skeleton
- batch lesson briefs
- grammar clusters

Vai tro:

- noi framework duoc lap vao mot bai cu the;
- noi chot teaching core truoc khi tach thanh script va slide;
- noi validate framework truoc khi scale.

### 4.5 `production/`

Chua:

- slide skeletons
- design briefs
- decks
- worksheets
- shorts
- review reports

Vai tro:

- bien lesson thanh asset co the publish;
- noi xay â€œassembly lineâ€ cua content.

### 4.6 `automation/`

Chua:

- prompts
- workflows
- scripts

Vai tro:

- tang toc san xuat;
- luu multi-agent flow;
- khong thay the source-of-truth.

### 4.7 `funnel/`

Chua:

- landing page assets
- lead magnet assets
- waitlist structure
- email sequences

Vai tro:

- bien audience thanh lead;
- bien lead thanh waitlist;
- bien waitlist thanh paid beta.

### 4.8 `analytics/`

Chua:

- KPI definitions
- experiment logs
- feedback logs
- review notes sau publish

Vai tro:

- dong feedback ve dung tang can sua;
- giup toi uu theo du lieu thay vi cam tinh.

---

## 5. Component Boundaries

### 5.1 Strategy System

**Inputs:**

- founder insight
- market assumptions
- target learner pain points
- roadmap monetization

**Outputs:**

- positioning statement
- content pillars
- product ladder
- beta offer definition
- pricing range
- success KPIs

**Must not do:**

- viet chi tiet lesson;
- viet slide skeleton;
- tao visual asset production.

### 5.2 Framework System

**Inputs:**

- strategy direction
- teacher pedagogy
- 3 View method

**Outputs:**

- lesson framework
- explanation checklist
- slide methodology
- checkpoint truoc khi san xuat

**Must not do:**

- quyet dinh title/CTA tung bai mot cach tuy hung;
- thay the lesson sample.

### 5.3 Lesson System

**Inputs:**

- grammar cluster
- source material
- framework rules
- business-context use cases

**Outputs:**

- sample lesson
- lesson brief
- scoped promise cua tung video
- story concept
- exercise plan

**Must not do:**

- design slide final;
- tu y doi framework.

### 5.4 Production System

**Inputs:**

- approved lesson brief/sample
- slide method
- multi-agent prompts/workflows

**Outputs:**

- slide skeleton
- deck draft/final
- worksheet
- shorts scripts
- CTA asset
- review report

**Must not do:**

- doi target customer;
- doi product promise;
- doi grammar logic neu chua quay lai lesson/framework.

### 5.5 Funnel System

**Inputs:**

- positioning
- beta offer
- CTA assets
- lead magnet
- content outputs

**Outputs:**

- landing page
- waitlist entries
- email capture
- webinar registration
- sales handoff

**Must not do:**

- tu y tao promise moi khac strategy;
- tu y sua lesson method.

### 5.6 Analytics System

**Inputs:**

- content performance
- comments
- lead capture performance
- waitlist conversion
- beta feedback

**Outputs:**

- issue classification
- experiment decisions
- update requests ve dung tang

**Must not do:**

- sua source-of-truth truc tiep ma khong thong qua owner review.

### 5.7 Automation / Multi-agent Support

**Inputs:**

- approved source docs
- prompts
- sample lesson
- slide method

**Outputs:**

- draft skeletons
- design instructions
- QA reports

**Must not do:**

- tro thanh source-of-truth;
- tu y publish noi dung chua review.

---

## 6. Main Flows

### 6.1 Flow A - Strategy to Lesson

```text
Business plan
-> target audience
-> pain point
-> positioning
-> content pillar
-> lesson topic selection
-> lesson brief
```

Nguon trace:

- `business_plan_n_2_mvp_clean.md`

### 6.2 Flow B - Framework to Sample

```text
Lesson framework
-> 3 View method
-> slide method
-> sample lesson
-> sample skeleton
```

Nguon trace:

- `framework_giao_an_video_n_2_mvp_clean.md`
- `framework_addendum_3_view_giai_thich_ngu_phap.md`
- `file_1_slide_method_guideline_n_2_mvp_clean.md`
- `file_2_slide_skeleton_text_kai_gai_temade.md`

### 6.3 Flow C - Sample to Production Assets

```text
Approved sample
-> slide skeleton
-> design brief
-> final deck
-> worksheet
-> short scripts
-> CTA assets
```

Nguon trace:

- `file_2_slide_skeleton_text_kai_gai_temade.md`
- `multi_agent_flow_tu_dong_tao_slide_n_2_mvp.md`

### 6.4 Flow D - Production to Funnel

```text
Video / worksheet / CTA
-> landing page
-> lead magnet
-> email capture
-> waitlist
-> webinar / sales page
-> beta signup
```

Nguon trace:

- `business_plan_n_2_mvp_clean.md`
- `architect_du_an_n_2_mvp.md`

### 6.5 Flow E - Analytics to Optimization

```text
Retention / comments / downloads / waitlist / purchases
-> issue classification
-> update strategy / framework / lesson / production / funnel
```

Nguon trace:

- `business_plan_n_2_mvp_clean.md`
- `architect_du_an_n_2_mvp.md`

---

## 7. Beta Operating Model

### 7.1 Free content layer

Core public surface:

- YouTube long-form
- shorts / TikTok / reels
- PDF / worksheet CTA

Vai tro:

- thu attention;
- xay authority;
- dua target learner vao he thong.

### 7.2 Lead layer

Core conversion surface:

- lead magnet
- worksheet CTA
- email capture / form
- waitlist

Vai tro:

- doi gia tri lay contact;
- xac minh ai la nguoi hoc thuc su quan tam N2.

### 7.3 Monetization layer

Core beta monetization surface:

- beta sales page / checkout page
- webinar/live class
- paid beta cohort

Vai tro:

- convert audience co intent thanh hoc vien dau tien.

### 7.4 Delivery layer

Core beta delivery surface:

- video lessons
- worksheet
- group support
- live sessions

Vai tro:

- thu feedback;
- tao testimonials;
- validate method.

---

## 8. Recommended Beta Tech Boundaries

### 8.1 In-repo / custom-owned

Nen tu giu trong repo:

- strategy docs
- framework docs
- lesson docs
- production templates
- prompts
- content skeletons
- analytics logs
- landing source neu tu build static

### 8.2 SaaS / externalized

Nen de ngoai o phase beta:

- email capture
- nurture email
- waitlist forms
- payment
- course delivery
- community hosting

### 8.3 Reason

Kien truc nay giai quyet dung tradeoff tu bo input:

- launch nhanh trong 3 thang;
- chi custom cho phan tao ra differentiation;
- de platform execution cho SaaS.

---

## 9. Active Artifact Lifecycle

Moi lesson/video di qua lifecycle sau:

```text
Strategy angle
-> lesson brief
-> sample/lesson doc
-> slide skeleton
-> design/deck
-> worksheet
-> CTA
-> publish
-> analytics
-> feedback update
```

### 9.1 Document states

Moi artifact nen co mot trong cac state:

- draft
- active
- reviewed
- published
- archived

### 9.2 Why it matters

Dieu nay giup:

- khong nham file reference voi file active;
- khong dua nham sample chua approve vao production;
- giu workflow ro cho solo operator.

---

## 10. Naming and Placement Decisions

### 10.1 Active files

File active nen co ten ngan, mo ta vai tro.

Vi du:

```text
01-business-plan.md
02-framework-lesson-method.md
03-framework-3-view-grammar.md
04-slide-method-guideline.md
05-sample-internal-test-case.md
06-skeleton-internal-test-case.md
07-workflow-multi-agent-production.md
```

### 10.2 Reference files

File co gia tri tham khao nhung khong phai source-of-truth active nen vao:

```text
docs/reference/
framework/.../reference/
```

Vi du:

- `method_viet_slide_video_n_2_mvp.md`

### 10.3 Architecture files

File mang tinh project-wide nhu architecture nen dat o `docs/`.

Vi du:

- `SD-beta-architecture.md`
- file chuyen doi tu `architect_du_an_n_2_mvp.md`

---

## 11. Risks and Mitigations

### Risk 1 - QuÃ¡ nhiá»u tÃ i liá»‡u, Ã­t output

**Mo ta:**

Project co nguy co rat manh ve note-taking nhung cham publish.

**Mitigation:**

- sample-first;
- moi file moi phai phuc vu mot output ro;
- uu tien nhom `ã‚ã‘` lam public sample flagship dau tien;
- giu `kai / gai / temade` lam internal framework test case.

### Risk 2 - AI draft sai nuance

**Mo ta:**

AI co the tao vi du khong tu nhien hoac usage sai.

**Mitigation:**

- teacher review gate bat buoc;
- 3 View checklist;
- review report template.

### Risk 3 - Funnel yeu hon content

**Mo ta:**

San xuat video deu nhung khong thu duoc lead.

**Mitigation:**

- CTA asset la mot output bat buoc cua production;
- landing + lead magnet duoc build song song;
- analytics co KPI lead rieng.

### Risk 4 - Scope truot sang xay platform

**Mo ta:**

De bi hut vao custom app, LMS, dashboard.

**Mitigation:**

- boundary SaaS ro;
- exclusions duoc khoa tu RD;
- SD nay phan tach custom-owned va externalized.

### Risk 5 - Batch scaling qua som

**Mo ta:**

Scale nhieu bai truoc khi sample dau tien on.

**Mitigation:**

- sample lesson la gate;
- framework update phai qua sample tiep theo;
- batch chi bat dau khi sample + funnel pattern chay duoc.

---

## 12. What Must Be Reused As-Is vs Refined

### 12.1 Reuse as core

Nen tai su dung lam core:

- target audience va product ladder tu business plan;
- 3 View pedagogy tu framework + addendum;
- slide role system tu file 1;
- nhom `ã‚ã‘` lam public sample direction moi;
- sample `kai / gai / temade` lam internal framework test case;
- multi-agent role split Claude / Gemini / ChatGPT.

### 12.2 Reuse with refinement

Nen tai su dung nhung can normalize:

- naming convention cua tat ca file;
- architecture doc dang o dang note;
- slide method note trung lap;
- production version 18-slide tu sample.

### 12.3 Reuse as reference only

Nen giu de tham khao:

- `method_viet_slide_video_n_2_mvp.md`

Ly do:

- gia tri ve tu duy va giai thich;
- nhung operational rule da duoc file 1 viet ro hon.

---

## 13. Design Decisions Locked By This SD

SD nay khoa cac quyet dinh sau:

1. `opus-lucida` la workspace con duoc `opus-consilium` ho tro va cap input
2. architecture la file-first, SaaS-assisted
3. sample-first truoc batch-first
4. public sample trung tam cua phase dau la nhom `ã‚ã‘`
5. `kai / gai / temade` duoc giu lam internal framework test case / video 2 candidate
6. strategy / framework / lesson / production / funnel / analytics la 6 tang chinh
7. automation la layer ho tro, khong phai source-of-truth
8. funnel phai duoc build song song voi production
9. custom LMS/payment/dashboard nam ngoai scope beta

---

## 14. Next Build Implications

Tu SD nay, `docs/history/BD-phase-1-foundation.md` can lam ro:

1. scaffold folder structure thuc te;
2. tao file active dau tien trong moi tang;
3. copy/normalize file input vao dung cho;
4. tao docs/reference cho file chi de tham khao;
5. chot landing asset va lead magnet asset dau tien;
6. chuan hoa analytics / feedback log.

---

## 15. Definition of Done for This SD

SD nay duoc coi la done khi:

- component boundaries ro;
- data flow ro;
- folder architecture ro;
- source traceability ro;
- reuse strategy ro;
- SaaS vs custom boundary ro;
- next BD doc duoc derive ro.

---

*Opus Lucida - SD beta architecture v0.1 | 2026-04-29*

