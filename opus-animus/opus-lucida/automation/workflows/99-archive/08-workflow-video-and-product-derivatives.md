# Workflow - Video and Product Derivatives
**Status:** Draft
**Project:** `opus-lucida`
**Ref:** `07-workflow-multi-agent-production.md`, `../../docs/SD-beta-architecture.md`, `../../docs/BD-sample-video-validation.md`

---

## 0. Muc tieu

Workflow nay mo ta cach bien 1 lesson/sample thanh:

- video sample hoac video public;
- worksheet;
- shorts;
- lead magnet asset;
- landing asset;
- seed material cho beta offer.

No khac voi `07-workflow-multi-agent-production.md` o cho:

- file `07` tap trung vao slide/deck multi-agent flow;
- file nay tap trung vao **toan bo asset pipeline** sau khi lesson da co.

---

## 1. Dau vao va dau ra

### Dau vao toi thieu

- business positioning
- framework lesson method
- 3 View grammar method
- slide method
- sample lesson hoac lesson brief
- slide skeleton

### Dau ra chinh

1. video script
2. slide deck
3. worksheet
4. shorts pack
5. CTA asset
6. lead magnet candidate
7. landing page content seed
8. feedback logs sau publish

---

## 2. Nguyen tac

### 2.1 One lesson, many assets

Mot lesson/sample khong chi dung de quay 1 video, ma phai sinh ra nhieu asset lien quan.

### 2.2 Video la asset trung tam

Trong phase beta:

- video dai la core asset;
- worksheet, shorts, CTA, lead magnet la derivative assets.

### 2.3 Derivative assets phai bam cung promise

Tat ca asset phai bam cung:

- pain point
- video promise
- differentiation `3 View`

Khong duoc de short hay worksheet mo ra mot huong thong diep khac.

### 2.4 Review theo muc rui ro

- video script: review ky nhat
- worksheet: review content + CTA
- shorts: review thong diep va do ro
- landing seed: review positioning

---

## 3. Asset map tu 1 lesson

```text
Lesson / Sample
-> Slide skeleton
-> Video script
-> Slide deck
-> Worksheet
-> Shorts pack
-> CTA copy
-> Lead magnet candidate
-> Landing seed copy
```

---

## 4. Main workflow

### Step 1 - Lock lesson scope

Muc tieu:

- chot grammar scope;
- chot pain point;
- chot promise;
- chot CTA huong den asset nao.

Output:

- lesson scope lock

### Step 2 - Create teaching core

Muc tieu:

- chot `Meaning / Form / Usage`
- chot story
- chot comparison
- chot clue map
- chot practice

Output:

- lesson/sample active
- skeleton active

### Step 3 - Create video core

Muc tieu:

- tao script draft
- tao deck draft
- chot nhip 12-15 phut

Output:

- video script
- slide deck

### Step 4 - Create learner support asset

Muc tieu:

- doi lesson thanh worksheet de nguoi hoc luyen tiep

Output:

- worksheet draft/final

### Step 5 - Create reach assets

Muc tieu:

- tach ra cac short co the dang doc lap

Output:

- short 1: pain point
- short 2: comparison
- short 3: clue
- short 4: workplace example
- short 5: recap

### Step 6 - Create conversion assets

Muc tieu:

- tao CTA copy
- xac dinh worksheet co du gia tri lam lead magnet khong
- rut ra content seed cho landing

Output:

- CTA copy
- lead magnet candidate
- landing content seed

### Step 7 - Publish and collect feedback

Muc tieu:

- dua video/asset ra public hoac internal test
- ghi nhan feedback

Output:

- feedback log
- experiment log
- review reports

### Step 8 - Feed lessons back into system

Muc tieu:

- xac dinh nen sua:
  - framework
  - slide method
  - sample
  - funnel

Output:

- ADR / decision log

---

## 5. Product derivative rules

### 5.1 Video

Video phai:

- la asset day hoc day du nhat;
- giai quyet pain point chinh;
- co 3 View;
- co practice;
- co CTA.

### 5.2 Worksheet

Worksheet phai:

- co gia tri neu dung doc lap;
- khong chi la tom tat slide;
- co clue map;
- co bai tap;
- co ung dung thuc te.

### 5.3 Shorts

Moi short phai:

- co 1 y chinh;
- co hook nhanh;
- co lien he ve video dai hoac worksheet;
- khong can giai thich full bai.

### 5.4 Lead magnet

Lead magnet co the la:

- worksheet sample;
- guide 3 View;
- bang tong hop N2 de nham;

Nhung o phase dau, uu tien asset nao ship nhanh va bam sat sample nhat.

### 5.5 Landing seed

Tu lesson/video phai rut ra:

- pain point line
- promise line
- differentiation line
- proof line
- CTA line

De sau nay dua vao landing page.

---

## 6. File outputs de xuat

Voi moi bai/sample, workflow nay nen tao toi thieu:

```text
lessons/samples/05-sample-[topic].md
production/slide-skeletons/06-skeleton-[topic].md
production/decks/01-script-[topic]-draft.md
production/decks/01-slide-deck-[topic]-draft.md
production/worksheets/01-worksheet-[topic].md
production/shorts/01-shorts-[topic].md
production/design-briefs/01-design-brief-[topic].md
production/review-reports/...
```

Neu asset duoc chon lam lead magnet:

```text
funnel/lead-magnets/[asset-name].md
```

Neu asset dong gop cho landing:

```text
funnel/landing/[supporting-copy-or-brief].md
```

---

## 7. Workflow cho sample video dau tien

Doi voi `kai / gai / temade`, asset chain nen la:

```text
Sample lesson
-> Skeleton 18 slide
-> Script sample
-> Deck draft
-> Worksheet sample
-> 3-5 shorts draft
-> CTA worksheet
-> Feedback review
-> Update framework neu can
```

Vai tro cua tung asset:

- script/deck: check method + flow
- worksheet: check learner value + lead value
- shorts: check reach hooks
- CTA: check conversion fit

---

## 8. Review gates

### Gate 1 - Teaching Gate

Truoc khi sinh derivative assets, lesson core phai dung.

### Gate 2 - Video Gate

Script + deck phai du ro de quay / read-through.

### Gate 3 - Support Asset Gate

Worksheet va shorts phai bam dung promise, khong lech thong diep.

### Gate 4 - Conversion Gate

CTA va lead magnet candidate phai hop ly, khong go ep.

---

## 9. Khi nao workflow nay duoc dung

Dung workflow nay khi:

- da co sample lesson;
- can ra video va cac san pham phu;
- can mot pipeline tu lesson sang funnel.

Khong dung workflow nay khi:

- van dang brainstorm target audience;
- chua khoa scope grammar;
- chua qua lesson gate.

---

## 10. Definition of done

Workflow nay duoc coi la hoan thanh khi:

- da co tai lieu mo ta asset pipeline ro rang;
- phan biet duoc asset trung tam va derivative assets;
- sample video dau tien co duong di ro den worksheet, shorts va CTA;
- workflow co the dung lai cho bai sau.

---

*Opus Lucida - workflow video and product derivatives v0.1 | 2026-04-29*
