# End-to-End Flow - Topic to Video
**Status:** Draft
**Project:** `opus-lucida`
**Date:** 2026-04-29
**Ref:** `20-lesson-production-sop.md`, `09-automation-retrospective-and-to-be-flow.md`, `08-workflow-video-and-product-derivatives.md`, `../../docs/BD-sample-product-bundle.md`, `../../docs/RD-beta-launch.md`

> Current operational version: use `20-lesson-production-sop.md` for the teaching-lane MVP process.

---

## 0. Muc tieu

Workflow nay mo ta full flow tu:

- chon chu de
- chot angle
- tao teaching core
- viet script
- review
- tao deck
- tao worksheet / shorts
- chuan bi quay
- quay
- edit
- QA video

de cuoi cung co:

- 1 video sample hoac public video
- 1 bo derivative assets di kem
- 1 decision log de cap nhat method

Workflow nay duoc viet theo tu duy:

```text
1 step = 1 agent = 1 output = 1 gate
```

---

## 1. Scope

Workflow nay ap dung cho:

- public sample video
- internal sample video
- video lesson don le

Khong ap dung cho:

- full course batching quy mo lon
- webinar launch
- paid course delivery system

---

## 2. North star cua flow

Moi video cua `Lucida` khong phai chi de "giai thich 1 bai".

No phai dong thoi dat 5 muc tieu:

1. dung grammar
2. de hieu
3. co hook viewer
4. co asset derivative
5. dong gop vao funnel hoac framework learning

Neu chi dat 1-2 muc tieu dau ma khong dat 3-5, thi video chua phai artifact tot cho beta system.

---

## 3. Flow tong quat

```text
Topic backlog
-> Topic selection
-> Angle lock
-> Source consolidation
-> Lesson architecture
-> Master teaching skeleton
-> Script brief
-> Script draft
-> Multi-lane review
-> Script integration
-> Slide draft (from Script + Skeleton)
-> Worksheet draft
-> Shorts draft
-> Recording prep
-> Recording
-> Edit plan
-> Video QA
-> Publish package
-> Feedback + decision log
```

---

## 4. Phase A - Topic Strategy

### Step A1 - Topic Backlog Agent

**Vai tro:**

- tap hop cac topic co the day
- ghi nhan theo cluster / exam pain point / workplace pain point

**Input:**

- Somatome / Shinkanzen progression
- backlog tu teacher
- note tu audience pain point
- benchmark internal sample

**Output:**

- `topic backlog`

**Format goi y cho moi topic:**

- topic
- cluster type
- level fit
- de nham o dau
- co hook public khong
- co asset derivative manh khong

**Gate:**

- backlog co nhom uu tien ro

### Step A2 - Topic Scoring Agent

**Vai tro:**

- cham diem cac topic de chon video tiep theo

**Input:**

- topic backlog
- current business phase

**Output:**

- `topic shortlist`

**Tieu chi cham diem:**

1. hook potential
2. pain point intensity
3. clarity potential cho 3 View
4. relevance voi N2 learner
5. kha nang sinh worksheet / shorts
6. phu hop voi phase beta

**Gate:**

- co 1 topic top priority
- co 1-2 backup topics

### Step A3 - Direction Lock Agent

**Vai tro:**

- chot topic chinh cho video
- chot video la public sample hay internal sample
- chot promise va CTA

**Input:**

- topic shortlist
- business goal

**Output:**

- `sample brief`
- `direction lock note`

**Gate:**

- chi con 1 topic duoc chay
- co ly do tai sao chon no bay gio

---

## 5. Phase B - Teaching Core

### Step B1 - Source Consolidation Agent

**Vai tro:**

- tap hop tat ca source lien quan den topic
- tach source chinh / source tham khao

**Input:**

- textbook note
- raw note
- previous sample
- framework docs

**Output:**

- `source map`
- `normalized topic note`

**Gate:**

- khong bo sot nuance quan trong
- co traceability

### Step B2 - Pain Point Framing Agent

**Vai tro:**

- dat ten dung pain point cua topic
- chot "tai sao nguoi hoc nham"

**Input:**

- normalized topic note
- audience profile

**Output:**

- `pain point note`

**Gate:**

- pain point cu the, khong mo ho

### Step B3 - Lesson Architect Agent

**Vai tro:**

- viet teaching core cho bai

**Input:**

- normalized topic note
- pain point note
- 3 View framework

**Output:**

- `sample lesson active`

**Contract:**

- pain point
- promise
- meaning / form / usage
- comparison
- clue map
- practice direction
- CTA direction

**Gate:**

- co the doc nhu "linh hon" cua bai

### Step B3.5 - Master Teaching Skeleton Agent

**Vai tro:**

- chuyen `topic + teaching core` thanh 1 khung master de sinh dong bo:
  - video
  - slide
  - script

**Input:**

- sample lesson active
- pain point note
- hook direction
- slide method

**Output:**

- `master teaching skeleton`

**Contract:**

- co hook core
- co story core
- co big idea
- co 3 View core cho tung grammar point
- co comparison core
- co clue map
- co practice core
- co `video structure skeleton`
- co `slide mapping skeleton`
- co `script mapping skeleton`

**Gate:**

- script va slide co the duoc sinh tu cung 1 source-of-truth
- review sau do khong can sua cung 1 van de o 3 noi
- skeleton du giau de bung them worksheet / shorts / posts / CTA

### Step B4 - Internal Benchmark Agent

**Vai tro:**

- doi chieu teaching core voi benchmark noi bo neu can

**Input:**

- sample lesson active
- internal sample (`kai / gai / temade`)

**Output:**

- `benchmark note`

**Gate:**

- neu co diem bat on trong method, phai lo ra truoc khi sang script

---

## 6. Phase C - Script System

### Step C1 - Script Brief Agent

**Vai tro:**

- chuyen teaching core thanh yeu cau viet script

**Input:**

- master teaching skeleton
- slide method

**Output:**

- `script writing requirements`

**Gate:**

- structure video ro
- output format ro
- constraints ro

### Step C2 - Script Writer Agent

**Vai tro:**

- viet script dau tien

**Input:**

- script writing requirements

**Output:**

- `script draft v1`

**Gate:**

- theo slide/section
- khong mat logic teaching core

### Step C3 - Content Accuracy Reviewer Agent

**Vai tro:**

- review grammar / nuance / example

**Input:**

- script draft v1
- sample lesson active

**Output:**

- `content review report`

**Gate:**

- khong con loi critical

### Step C4 - Method Reviewer Agent

**Vai tro:**

- review pedagogy / 3 View / comparison

**Input:**

- script draft v1

**Output:**

- `method review report`

**Gate:**

- giai quyet dung pain point

### Step C5 - Hook / Flow / CTA Reviewer Agent

**Vai tro:**

- review su hap dan cua video public

**Input:**

- script draft v1

**Output:**

- `flow review report`

**Gate:**

- duoc danh gia co kha nang giu viewer va dan CTA

**Public sample heuristics:**

- 3-5 giay dau nen la tinh huong hoac cap cau de nham
- khong mo dau qua lau bang list grammar
- trong 60-90 giay dau, viewer phai thay minh dang hoc duoc dieu gi
- quiz hook neu da mo ra som thi phai co payoff tam som
- phan `3 View` o video public dau tien nen ngan, khong chiem qua nhieu headroom
- CTA worksheet nen duoc gieo tu clue map hoac practice, khong doi den slide cuoi moi nhac

### Step C6 - Script Integrator Agent

**Vai tro:**

- tong hop tat ca review
- patch thanh ban script tiep theo

**Input:**

- script draft v1
- 3 review reports

**Output:**

- `script draft v2`
- `script decision log`

**Gate:**

- pass de sang deck

**Truth rule:**

- skeleton = teaching truth
- script = narration truth
- slide chua duoc sinh neu script chua pass

---

## 7. Phase D - Learning Asset Generation

### Step D1 - Deck Architect Agent

**Vai tro:**

- doi `script + skeleton` thanh slide deck

**Input:**

- script draft v2
- master teaching skeleton
- slide method

**Output:**

- `deck draft`

**Gate:**

- mapping ro
- khong qua tai text

**Truth rule:**

- slide = presentation truth
- slide phai trung thanh voi teaching truth tu skeleton
- slide phai trung thanh voi narration truth tu script
- neu script va skeleton xung dot, phai quay lai integrator thay vi sua tay tren slide

### Step D2 - Worksheet Generator Agent

**Vai tro:**

- tao worksheet tu teaching core

**Input:**

- master teaching skeleton
- script draft v2

**Output:**

- `worksheet draft`

**Gate:**

- dung doc lap
- du gia tri lam CTA

### Step D3 - Shorts Generator Agent

**Vai tro:**

- tach 3-5 short assets

**Input:**

- master teaching skeleton
- script draft v2

**Output:**

- `shorts pack`

**Gate:**

- moi short co 1 y trung tam
- khong lech promise

### Step D4 - Bundle QA Agent

**Vai tro:**

- review script + deck + worksheet + shorts nhu 1 bundle

**Input:**

- script
- deck
- worksheet
- shorts

**Output:**

- `bundle review report`

**Gate:**

- thong nhat noi dung va CTA

---

## 8. Phase E - Pre-Production

### Step E1 - Recording Brief Agent

**Vai tro:**

- chuan bi file de quay

**Input:**

- script draft v2
- deck draft

**Output:**

- `recording brief`

**Noi dung can co:**

- muc tieu video
- do dai target
- cac doan can nhan manh
- cac doan de dung/pause
- cac slide can zoom / animate
- CTA line chinh
- opening line cu the
- payoff line cho hook
- time budget cho tung grammar block

**Gate:**

- nguoi quay chi can mo file ra va quay

### Step E2 - Recording Checklist Agent

**Vai tro:**

- tao checklist ky thuat va su pham truoc khi quay

**Input:**

- recording brief

**Output:**

- `recording checklist`

**Checklist goi y:**

- audio
- mic level
- slide order
- furigana / typo pass
- opening line ro
- CTA line nho chot
- hook co vao nhanh khong
- phan dau co qua day meta khong
- practice cuoi video co bi qua tai khong

**Gate:**

- san sang quay take 1

### Step E3 - Presenter Coach Agent

**Vai tro:**

- chi ra cho nao trong script de de vo nhat khi doc

**Input:**

- script draft v2

**Output:**

- `delivery note`

**Gate:**

- script doc ra tu nhien hon

---

## 9. Phase F - Production

### Step F1 - Recording Agent

**Vai tro:**

- thuc hien quay video

**Input:**

- recording brief
- recording checklist
- deck

**Output:**

- `raw video takes`

**Gate:**

- co it nhat 1 take dung duoc

### Step F2 - Take Reviewer Agent

**Vai tro:**

- review take truoc khi vao edit

**Input:**

- raw video takes
- script draft v2

**Output:**

- `take review note`

**Tieu chi:**

- noi co ro khong
- nhip co hop khong
- co doan nao vo y / lan man / sai slide khong

**Gate:**

- quyet dinh quay lai hay sang edit

### Step F3 - Edit Planner Agent

**Vai tro:**

- lap ke hoach edit

**Input:**

- raw take
- deck
- shorts pack

**Output:**

- `edit plan`

**Bao gom:**

- cut points
- on-screen emphasis
- subtitle priority
- short extraction markers

**Gate:**

- editor co the lam khong can doan

### Step F4 - Video Editor Agent

**Vai tro:**

- cat video, dong bo slide, subtitle, emphasis

**Input:**

- raw take
- edit plan
- deck

**Output:**

- `video draft`

**Gate:**

- co ban xem duoc de QA

---

## 10. Phase G - Final QA and Publish Package

### Step G1 - Video QA Agent

**Vai tro:**

- review ban video da edit

**Input:**

- video draft
- script final
- worksheet CTA

**Output:**

- `video QA report`

**Kiem tra:**

- sai nuance hay khong
- pace on-screen co hop khong
- subtitle / typo
- CTA ro khong

**Gate:**

- pass cho publish noi bo hoac public

### Step G2 - Metadata Agent

**Vai tro:**

- tao title / description / thumbnail copy / pinned comment / CTA copy

**Input:**

- script final
- pain point
- worksheet CTA

**Output:**

- `publish package`

**Gate:**

- thong nhat voi promise cua video

### Step G3 - Publish Readiness Agent

**Vai tro:**

- check tat ca asset truoc publish

**Input:**

- video QA report
- publish package
- worksheet final

**Output:**

- `publish checklist`

**Gate:**

- du dieu kien dang public hoac chay internal test

---

## 11. Phase H - Feedback Loop

### Step H1 - Feedback Logger Agent

**Vai tro:**

- ghi lai feedback sau khi share internal/public

**Input:**

- comments
- self-review
- peer review

**Output:**

- `feedback log`

### Step H2 - Decision Logger Agent

**Vai tro:**

- chot bai hoc cho system

**Input:**

- feedback log
- video QA report
- review reports

**Output:**

- `decision log`
- `framework update candidates`
- `prompt update candidates`

### Step H3 - Reuse Planner Agent

**Vai tro:**

- quyet dinh asset nao duoc tai su dung

**Input:**

- final video
- worksheet
- feedback

**Output:**

- `reuse plan`

**Vi du:**

- short nao dang truoc
- worksheet co dung lam lead magnet khong
- topic nao nen lam video tiep theo

---

## 12. Gate map

```text
Gate 1  = topic duoc chot
Gate 2  = teaching core duoc chot
Gate 3  = script brief ro
Gate 4  = script v1 da co
Gate 5  = content pass
Gate 6  = method pass
Gate 7  = flow/CTA pass
Gate 8  = script v2 pass
Gate 9  = bundle pass
Gate 10 = ready to record
Gate 11 = raw take pass
Gate 12 = video QA pass
Gate 13 = publish-ready
Gate 14 = learning logged
```

---

## 13. Minimal version cho solo operator

Khong can chay het moi step o muc tool/process ngay.

Ban toi thieu cho solo operator:

1. Topic scoring
2. Direction lock
3. Lesson architect
4. Master teaching skeleton
5. Script brief
6. Script writer
7. 3 review lanes
8. Script integrator
9. Deck architect
10. Worksheet generator
11. Recording brief
12. Recording
13. Video QA
14. Feedback log

---

## 14. File outputs cho sample hien tai

### Wake cluster

#### Da co

- `lessons/samples/06-sample-wake-cluster.md`
- `production/01-chatgpt-handoff/01-input/wake-script-requirements.md`
- `production/00-active/wake-cluster/02-script.md`
- `production/00-active/wake-cluster/03-slide-deck.md`
- `production/worksheets/02-worksheet-wake-cluster.md`
- `production/shorts/02-shorts-wake-cluster.md`

#### Nen co them de dong full flow

- `production/recording/01-recording-brief-wake-cluster.md`
- `production/recording/02-recording-checklist.md`
- `production/recording/03-delivery-note-wake-cluster.md`
- `production/editing/01-edit-plan-wake-cluster.md`
- `production/publish/01-publish-package-wake-cluster.md`
- `production/review-reports/04-video-qa-wake-cluster.md`
- `analytics/decisions/01-wake-cluster-decision-log.md`

---

## 15. Nguyen tac van hanh

Khong dong nhat "co script" voi "co video-ready asset".

Dependency dung cua pipeline la:

```text
Topic
-> Lesson
-> Master Teaching Skeleton
-> Script
-> Slide (from Script + Skeleton)
-> Video (from Skeleton + Script + Slide)
```

Trong do:

- skeleton = teaching truth
- script = narration truth
- slide = presentation truth

1 video chi duoc xem la xong khi:

- script da pass review
- deck da dong bo
- worksheet da co gia tri
- nguoi quay co recording brief
- video draft da qua QA
- feedback da duoc ghi lai

Noi cach khac:

> workflow cua `opus-lucida` ket thuc o learning loop, khong ket thuc o file script.

---

*Opus Lucida - end-to-end topic to video flow v0.1 | 2026-04-29*
