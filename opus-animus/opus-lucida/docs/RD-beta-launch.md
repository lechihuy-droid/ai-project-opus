# RD - Opus Lucida Beta Launch
**Date:** 2026-04-29
**Status:** Draft
**Project:** `opus-lucida`
**Scope:** Beta launch foundation for first monetization cycle

---

## 0. Problem Statement

`opus-lucida` can da bien bo tri thuc va framework hien co thanh mot he thong co kha nang:

- san xuat content N2 co su khac biet ro rang;
- gom lead deu dan;
- chuyen doi mot nhom audience dau tien thanh hoc vien beta tra tien.

Hien tai project da co:

- business direction kha ro;
- differentiation bang `3 View Grammar Coaching`;
- framework day va slide method;
- internal sample skeleton da co cho bai `kai / gai / temade`.

Nhung project chua co:

- requirements chinh thuc cho beta launch;
- boundary ro giua noi dung, production, funnel va monetization;
- definition of done cho 3 thang dau;
- source of truth cho nhung gi can build truoc, va nhung gi khong build.

Neu khong dong bang requirements ngay, project rat de bi lech sang:

- lam qua nhieu content ma khong gom lead;
- lam qua nhieu system ma chua test PMF;
- build custom LMS/payment sớm;
- co nhieu tai lieu nhung khong co output ra thi truong.

---

## 1. Product Goal

Muc tieu cua `opus-lucida` trong phase beta launch la:

> xay dung mot content-to-conversion system lean cho brand `Lucida`, de dua nguoi hoc N2 tu giai doan xem content mien phi den waitlist, sau do ban cohort beta dau tien cho san pham `N2 Grammar De Hieu - 4 Tuan Nen Tang`.

Ket qua kinh doanh mong muon:

- co audience muc tieu ro rang;
- co lead magnet va funnel thu lead hoat dong;
- co waitlist cho khoa beta;
- co offer beta co the ban duoc cho 20-30 hoc vien dau tien;
- co feedback loop de nang cap san pham sau beta.

---

## 2. Target User

### 2.1 Primary user

Nguoi Viet dang o cuoi N3 hoac moi bat dau N2, muon hoc ngu phap N2 de:

- dau JLPT;
- hieu ro cac mau de nham;
- co lo trinh hoc co he thong;
- duoc giai thich de hieu, co vi du, co bai tap va clue map.

### 2.2 Secondary user

Nguoi Viet dang song hoc hoac lam viec tai Nhat, can N2 de:

- xin viec;
- chuyen viec;
- tang kha nang dung tieng Nhat trong cong viec va doi song.

### 2.3 Internal operator

Chinh ban, voi vai tro:

- teacher / subject matter expert;
- content strategist;
- reviewer cho nuance va pedagogy;
- owner cua funnel beta.

System phai phuc vu tot cho mot solo operator, khong gia dinh co team full-time.

---

## 3. Value Proposition

Gia tri cot loi cua `Lucida`:

> Khong chi hoc nghia. Hoc cach dung dung.

Differentiation chinh:

- day ngu phap N2 theo `3 View Grammar Coaching`:
  - Meaning
  - Form
  - Usage
- uu tien nhom mau de nham;
- ket noi ngu phap voi JLPT, cong viec va doi song tai Nhat;
- tan dung AI de tang toc san xuat nhung van giu teacher review.

---

## 4. Beta Launch Scope

Scope cua RD nay bao gom 4 nhom lon:

1. content foundation
2. production system foundation
3. lead funnel foundation
4. beta offer foundation

### 4.1 Content foundation

Project can co:

- mot framework day hoc chinh thuc cho video N2;
- mot bo slide method/guideline chinh thuc;
- it nhat mot sample lesson operational;
- co kha nang nhan mot grammar cluster va bien thanh:
  - lesson brief
  - slide skeleton
  - worksheet draft
  - short ideas
  - CTA asset

### 4.2 Production system foundation

Project can co:

- cau truc folder ro cho strategy, framework, lessons, production, funnel, analytics;
- naming convention va source-of-truth ro;
- mau file de tai su dung cho sample va batch sau;
- flow review ro giua AI-generated draft va teacher review.

### 4.3 Lead funnel foundation

Project can co:

- landing page gioi thieu promise va offer beta;
- lead magnet de doi email/waitlist signup;
- CTA mapping tu YouTube/shorts sang lead magnet va waitlist;
- he thong waitlist va follow-up co the van hanh bang SaaS.

### 4.4 Beta offer foundation

Project can co:

- dinh nghia ro san pham beta:
  - ten
  - doi tuong
  - promise
  - format
  - gia tham khao
- readiness de mo beta cohort nho dau tien.

---

## 5. User Scenarios

### Scenario 1 - Viewer -> Lead

Mot nguoi hoc xem video YouTube cua `Lucida`, thay ro pain point cua minh, hieu duoc su khac biet cua 3 View method, sau do:

- comment de nhan worksheet; hoac
- click link de tai lead magnet; hoac
- vao waitlist cho khoa beta.

### Scenario 2 - Lead -> Waitlist

Mot nguoi da tai worksheet/lead magnet se:

- nhan duoc thong diep tiep noi ve phuong phap va loi ich;
- hieu ro khoa beta giai quyet van de gi;
- de lai thong tin cho waitlist.

### Scenario 3 - Waitlist -> Paid beta

Mot nguoi trong waitlist:

- tham gia webinar/live class hoac doc sales page;
- thay duoc offer beta va format hoc;
- dang ky tra tien cho cohort beta dau tien.

### Scenario 4 - Operator produces content

Ban co the lay mot nhom ngu phap moi va, voi effort hop ly, tao ra:

- lesson/sample;
- slide skeleton;
- worksheet;
- short ideas;
- CTA content;

ma khong phai bat dau tu trang giay trang.

### Scenario 5 - Operator improves system

Sau khi co video hoac lead dau tien, ban co the:

- ghi nhan feedback;
- xac dinh van de nam o content, production hay funnel;
- cap nhat source-of-truth dung tang;
- ap dung cai tien cho batch tiep theo.

---

## 6. Functional Requirements

### FR1 - Project workspace structure

System phai cung cap mot workspace `opus-lucida` co cau truc ro rang de tach:

- strategy
- framework
- lessons
- production
- automation
- funnel
- analytics
- docs

### FR2 - Source-of-truth documentation

System phai xac dinh ro file nao la source of truth cho:

- business direction
- lesson methodology
- 3 View grammar method
- slide method
- sample lesson
- automation workflow

### FR3 - Sample-first production model

System phai uu tien sample lesson dau tien lam noi validate framework truoc khi scale batch.

Sample lesson phai co kha nang dai dien cho:

- pain point-based teaching;
- 3 View explanation;
- slide method;
- CTA gom lead.

### FR4 - Reusable content production flow

System phai dinh nghia flow de bien grammar input thanh cac asset trung gian va output, toi thieu gom:

- lesson brief
- slide skeleton
- final deck
- worksheet draft
- shorts ideas
- CTA copy

### FR5 - Human review gate

System phai co review gate bat buoc truoc khi publish asset hoc thuat, trong do:

- AI co the tao nhap;
- teacher/operator phai review nuance, vi du, pedagogy va CTA.

### FR6 - Landing page foundation

Project phai co yeu cau cho mot landing page beta co kha nang:

- gioi thieu brand promise;
- neu pain point cua target user;
- trinh bay 3 View differentiation;
- mo ta ngan gon ve beta offer;
- thu email hoac dua vao waitlist.

### FR7 - Lead magnet foundation

Project phai co yeu cau cho it nhat mot lead magnet dau tien, de:

- trao gia tri thuc su;
- tiep noi truc tiep voi N2 pain point;
- phuc vu CTA trong video.

Lead magnet dau tien co the la:

- bang phan biet N2 theo 3 View; hoac
- 50 mau N2 de nham nhat; hoac
- worksheet cho video mau dau tien.

### FR8 - Waitlist flow foundation

Project phai co yeu cau cho mot waitlist flow don gian, co the van hanh bang SaaS, de:

- nhan lead;
- phan loai nguoi quan tam;
- tiep tuc nurture;
- moi vao beta.

### FR9 - Beta offer definition

Project phai dinh nghia ro offer beta dau tien, toi thieu gom:

- ten san pham
- doi tuong
- promise
- format
- pham vi 4 tuan
- gia beta tham khao
- target so hoc vien

### FR10 - KPI tracking foundation

Project phai dinh nghia bo KPI can theo doi cho beta launch, toi thieu gom:

- content KPI
- lead KPI
- monetization KPI

Khong can dashboard custom o phase nay, nhung can xac dinh ro can do gi.

### FR11 - Lean SaaS compatibility

Project phai duoc thiet ke de ket hop voi SaaS thay vi custom build cho cac phan:

- email capture
- waitlist
- payment
- course delivery

### FR12 - Evolution path

Project phai mo rong duoc tu:

- content MVP
- lead funnel
- beta cohort

sang:

- paid full course
- membership
- coaching
- AI-assisted learning products

mà khong pha vo architecture ban dau.

---

## 7. Non-Functional Requirements

### NFR1 - Solo-friendly

He thong phai hop voi 1 nguoi van hanh, khong dua vao:

- team edit lớn;
- ops phuc tap;
- infra custom kho bao tri.

### NFR2 - Fast to launch

Phase beta launch phai uu tien toc do va kha nang test PMF trong khoang 3 thang, khong hi sinh qua nhieu thoi gian cho custom system.

### NFR3 - Low-cost

Chi phi thang dau phai toi thieu, uu tien:

- static site
- SaaS free/low-cost tiers
- markdown-first workflow

### NFR4 - High pedagogical quality

Noi dung lien quan den ngu phap N2 phai duoc review de dam bao:

- dung nghia;
- dung form;
- dung usage/nuance;
- phu hop nguoi Viet hoc N2.

### NFR5 - Reusable production assets

Moi tai lieu production moi phai uu tien kha nang tai su dung thay vi lam mot lan roi bo.

### NFR6 - Clear boundaries

Boundary giua:

- strategy
- framework
- sample
- production
- funnel
- analytics

phai ro de feedback duoc update dung lop.

### NFR7 - File-based simplicity

Phase nay uu tien markdown/file-based workflow, khong bat buoc database hay CMS custom.

---

## 8. Explicit Exclusions

Nhung phan sau nam ngoai scope cua RD nay:

1. custom LMS
2. custom payment checkout
3. native mobile app
4. video editing automation hoan chinh
5. full multi-agent scripting/runtime implementation
6. dashboard analytics custom
7. membership/community platform custom
8. scale sang nhieu product line khac ngoai N2 beta

Ly do:

- chua can cho PMF beta;
- ton thoi gian nhung khong tang xac suat co hoc vien dau tien tuong xung.

---

## 9. Assumptions

RD nay duoc viet voi cac gia dinh sau:

- brand ten la `Lucida`;
- workspace ten la `opus-lucida`;
- offer dau tien la khoa `N2 Grammar De Hieu - 4 Tuan Nen Tang`;
- beta launch uu tien audience nguoi Viet hoc N2;
- content engine lay YouTube long-form lam truc chinh, sau do cat thanh shorts;
- payment, email capture va delivery se dung SaaS trong phase dau;
- ban la reviewer cuoi cho tat ca noi dung chuyen mon.

Neu cac gia dinh nay doi, RD can update.

---

## 10. Success Criteria

`opus-lucida` duoc coi la dat muc tieu phase nay khi:

1. co bo docs nen ro cho beta launch;
2. co workspace structure ro rang va file active duoc sap dung cho;
3. co sample lesson dau tien di tu framework -> skeleton -> CTA;
4. co yeu cau ro cho landing page va lead magnet;
5. co waitlist flow co the van hanh;
6. co offer beta duoc dinh nghia ro;
7. co kha nang san xuat them bai moi theo cung pattern;
8. co readiness de mo beta cohort dau tien.

---

## 11. Open Questions

Nhung diem can chot o cac doc tiep theo:

1. landing page se uu tien CTA nao o phase 1:
   - worksheet
   - lead magnet tong hop
   - waitlist thang
2. lead magnet dau tien se la file nao cu the?
3. payment provider dau tien se la Gumroad hay Lemon Squeezy?
4. delivery beta se dat o Notion, Gumroad hay nen ket hop ca hai?
5. platform channel mo manh nhat se la YouTube truoc, hay YouTube + TikTok song song?
6. public sample cho nhom `わけ` se duoc dung nhu:
   - lesson flagship dau tien
   - lead magnet nguon
   - webinar teaser
   - ca ba?

---

## 12. Next Docs Derived From This RD

Sau khi RD nay duoc approve, cac tai lieu tiep theo can duoc tao:

1. `SD-beta-architecture.md`
   - architecture beta
   - component boundaries
   - file/folder structure operational
   - funnel architecture

2. `docs/history/BD-phase-1-foundation.md`
   - scaffold folders
   - normalize documents
   - create active files
   - define landing and lead magnet assets

3. RD/BD rieng cho:
   - landing page
   - lead magnet
   - worksheet production template
   - analytics log

---

## 13. Definition of Done for This RD

RD nay duoc coi la done khi:

- problem statement ro;
- target user ro;
- scope beta launch ro;
- FR/NFR ro;
- exclusions ro;
- success criteria ro;
- next docs duoc derive ro.

---

*Opus Lucida - RD beta launch v0.1 | 2026-04-29*
