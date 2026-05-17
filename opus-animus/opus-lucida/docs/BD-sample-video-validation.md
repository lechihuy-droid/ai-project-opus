# BD - Sample Video Validation
**Date:** 2026-04-29
**Status:** Planning
**Ref:** `RD-beta-launch.md`, `SD-beta-architecture.md`, `history/BD-phase-1-foundation.md`
**Estimate:** 4-6 hours

---

## Muc tieu

Tao va review 1 sample video dau tien de kiem tra:

- tinh dung cua grammar explanation;
- tinh dung cua 3 View method trong thuc te;
- tinh hop ly cua slide method;
- nhip video 12-15 phut co de xem khong;
- CTA worksheet co hop funnel khong;
- phuong cham hien tai co can sua truoc khi scale batch khong.

Sample video nay **khong** co muc tieu toi uu dep ngay tu dau.  
Muc tieu chinh la:

> test dung/sai cua he thong.

---

## Why this step exists

Theo bo input goc, sample dau tien la noi:

- kiem chung framework;
- rut ra rule moi;
- cap nhat framework neu can;
- chi bat dau san xuat dai tra khi sample da qua checkpoint.

Vi vay, sample video validation la **gate** cho toan bo `opus-lucida`, khong phai mot task phu.

---

## Artifact duoc dung cho sample

Public sample trung tam:

- `lessons/samples/06-sample-wake-cluster.md`

Internal framework test case:

- `lessons/samples/05-sample-internal-test-case.md`
- `production/slide-skeletons/06-skeleton-internal-test-case.md`
- `production/design-briefs/01-design-brief-internal-test-case.md`
- `production/worksheets/01-worksheet-internal-test-case.md`
- `production/shorts/01-shorts-internal-test-case.md`
- `framework/lesson-method/02-framework-lesson-method.md`
- `framework/grammar-3-view/03-framework-3-view-grammar.md`
- `framework/slide-method/04-slide-method-guideline.md`

---

## Validation questions can tra loi

Sample video phai tra loi duoc 6 cau hoi sau:

1. Noi dung grammar co dung va tu nhien khong?
2. `3 View` co thuc su giup hoc vien phan biet mau de nham khong?
3. Slide co ho tro hoc that hay van qua nhieu chu / qua ly thuyet?
4. Story `Nam o cong ty Nhat` co giup nho bai hay chi la phan minh hoa?
5. Practice va clue map co giup nguoi xem â€œlam duocâ€ hon khong?
6. CTA worksheet co hop ly va tu nhien khong?

Neu 1 trong 6 cau hoi nay tra loi â€œkhong roâ€ hoac â€œkhongâ€, framework/phuong cham phai duoc sua truoc khi scale.

---

## Build Steps

### Step 1 - Freeze production version for sample
**Muc tieu:** Chot ban sample de review, khong thay doi scope lien tuc

**Viec lam:**
- [ ] Chot production version `18 slides`
- [ ] Giu `ã‚ã‘` cluster la scope public sample chinh
- [ ] Khong them `dake no koto wa aru` thanh slide rieng
- [ ] Giu CTA worksheet o cuoi

**Output:**
- sample scope locked

**Estimate:** 10 min

---

### Step 2 - Create sample deck draft
**Muc tieu:** Bien skeleton thanh ban deck draft co the review

**Files:**
- Tao moi:
  - `production/decks/01-slide-deck-internal-test-case-draft.md`

**Viec lam:**
- [ ] Doi skeleton 18 slide thanh draft deck text-first
- [ ] Moi slide co:
  - slide number
  - role
  - on-screen text da rut gon
  - visual note
  - speaker cue ngan
- [ ] Danh dau slide nao can reveal animation

**Smoke test:** Mo draft deck
-> expected: co the doc lien mach nhu 1 video 12-15 phut

**Estimate:** 45-60 min

---

### Step 3 - Create sample script pass
**Muc tieu:** Co ban script du de check nhip va do ro

**Files:**
- Tao moi:
  - `production/decks/01-script-internal-test-case-draft.md`

**Viec lam:**
- [ ] Viet script ngan theo deck draft
- [ ] Khong can polish giong doc cuoi cung
- [ ] Danh dau:
  - [NHAN]
  - [PAUSE]
  - [ON SCREEN]
  - [CHUYEN DOAN]
- [ ] Kiem tra thoi luong muc tieu 12-15 phut

**Smoke test:** Doc script thanh tieng trong dau
-> expected: khong bi doan nao qua ly thuyet hoac qua dai

**Estimate:** 45-60 min

---

### Step 4 - Run content validation
**Muc tieu:** Kiem tra tinh dung hoc thuat va pedagogy

**Files:**
- Tao moi:
  - `production/review-reports/01-review-sample-video-content.md`

**Viec lam:**
- [ ] Review `Meaning` cua tung mau
- [ ] Review `Form` cua tung mau
- [ ] Review `Usage` cua tung mau
- [ ] Review vi du cong viec / doi song
- [ ] Review clue map
- [ ] Review practice / answer explanation
- [ ] Ghi issue theo muc:
  - Critical
  - Important
  - Nice-to-fix

**Smoke test:** Review report phai tra loi ro:
-> content pass / revise / block

**Estimate:** 45 min

---

### Step 5 - Run video-method validation
**Muc tieu:** Kiem tra phuong cham hien tai co hoat dong trong video that khong

**Files:**
- Tao moi:
  - `production/review-reports/02-review-sample-video-method.md`

**Viec lam:**
- [ ] Kiem tra warm-up truoc quiz co can thiet khong
- [ ] Kiem tra pain point + promise co ro khong
- [ ] Kiem tra story co thuc su phuc vu pain point khong
- [ ] Kiem tra 3 View slide co ro, gon, reusable khong
- [ ] Kiem tra grammar slides co qua nhieu chu khong
- [ ] Kiem tra comparison slides co giai quyet nham lan khong
- [ ] Kiem tra practice co du tuong tac khong
- [ ] Kiem tra recap co screenshot-worthy khong

**Smoke test:** Review report phai tra loi ro:
-> phuong cham hien tai giu nguyen / can sua nhe / can refactor

**Estimate:** 45 min

---

### Step 6 - Run funnel-fit validation
**Muc tieu:** Kiem tra sample video co the dung de gom lead that khong

**Files:**
- Tao moi:
  - `production/review-reports/03-review-sample-video-funnel.md`

**Viec lam:**
- [ ] Kiem tra CTA worksheet co tu nhien khong
- [ ] Kiem tra worksheet co du gia tri de doi lead khong
- [ ] Kiem tra vi tri CTA trong video co hop ly khong
- [ ] Kiem tra recap -> CTA transition co mem khong
- [ ] Kiem tra sample nay nen dung cho:
  - public YouTube sample
  - lead magnet source
  - webinar teaser
  - tat ca

**Smoke test:** Report phai tra loi ro:
-> CTA pass / revise

**Estimate:** 30 min

---

### Step 7 - Create decision log for framework fixes
**Muc tieu:** Bien review thanh quyet dinh he thong

**Files:**
- Tao moi:
  - `docs/ADR-sample-video-lessons.md`

**Viec lam:**
- [ ] Tong hop fix tu 3 report
- [ ] Chia fix theo tang:
  - framework
  - slide method
  - sample lesson
  - funnel
- [ ] Ghi ro:
  - giu nguyen
  - sua nhe
  - sua bat buoc truoc batch

**Smoke test:** Co the tra loi 1 cau:
-> â€œsau sample video nay, `Lucida` can sua gi truoc khi scale?â€

**Estimate:** 30 min

---

## Validation Gates

### Gate A - Content Gate

Sample chi duoc coi la qua Gate A khi:

- grammar dung;
- vi du tu nhien;
- 3 View khong bi lech;
- practice va answer explanation khong co loi logic.

### Gate B - Method Gate

Sample chi duoc coi la qua Gate B khi:

- nhip video hop ly;
- story phuc vu pain point;
- slide khong qua tai;
- comparison giai quyet nham lan;
- recap ro rang.

### Gate C - Funnel Gate

Sample chi duoc coi la qua Gate C khi:

- worksheet dang gia tri thuc;
- CTA tu nhien;
- sample co the dung lam artifact public de gom lead.

---

## Definition of Done

Sample video validation duoc coi la done khi:

- co deck draft;
- co script draft;
- co 3 review reports:
  - content
  - method
  - funnel
- co decision log tong hop lesson learned;
- co ket luan ro:
  - framework giu nguyen hay sua
  - slide method giu nguyen hay sua
  - sample nay co du dieu kien dung lam public MVP hay khong

---

## Recommended next action after this BD

Lam ngay theo thu tu:

1. tao draft deck
2. tao draft script
3. review content
4. review method
5. review funnel
6. chot decision log

Neu muon di nhanh nhat de â€œcheck tinh dungâ€, uu tien:

- Step 2
- Step 3
- Step 4
- Step 5

---

*Opus Lucida - sample video validation v0.2 | 2026-04-29*

