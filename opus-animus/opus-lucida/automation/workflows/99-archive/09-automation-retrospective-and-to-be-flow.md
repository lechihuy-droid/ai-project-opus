# Automation Retrospective and To-Be Flow
**Status:** Draft
**Project:** `opus-lucida`
**Date:** 2026-04-29
**Ref:** `07-workflow-multi-agent-production.md`, `08-workflow-video-and-product-derivatives.md`, `../../docs/BD-sample-product-bundle.md`

---

## 0. Muc tieu

Tai lieu nay ghi lai:

- nhung viec da lam de dung bo khung `opus-lucida`;
- nhung artifact da duoc tao;
- nhung decision da duoc chot;
- to-be automation flow de lan sau co the chay theo kieu:
  - moi step = 1 agent
  - moi agent = 1 vai tro ro
  - moi output = 1 artifact ro
  - moi review = 1 gate ro

No la cau noi giua:

- planning / docs
- production sample
- future automation orchestration

---

## 1. Da lam gi roi

### 1.1 Project foundation

Da tao branch moi trong `OPUS ANIMUS`:

- `opus-lucida/`

Da chot naming:

- product name: `Lucida`
- project folder: `opus-lucida`

Da chot boundary:

- `personal-agent/` = noi bo / wiki / research
- `opus-lucida/` = productization / sample / monetization system

### 1.2 Architecture and planning docs

Da tao bo docs nen:

- `docs/PLAN-opus-lucida-foundation.md`
- `docs/RD-beta-launch.md`
- `docs/SD-beta-architecture.md`
- `docs/BD-phase-1-foundation.md`
- `docs/BD-sample-video-validation.md`
- `docs/BD-sample-product-bundle.md`

Vai tro cua bo docs nay:

- PLAN = map tong quan va sap xep source
- RD = product requirement cho beta
- SD = architecture / boundary / flow
- BD = execution plan cho tung phase / tung output

### 1.3 Source ingestion and normalization

Da doc va tai su dung cac input chinh tu nguon ban dau:

- business plan
- framework giao an video
- framework 3 View
- slide method guideline
- slide skeleton source
- architecture note
- multi-agent flow note

Da map input vao cac tang:

- `strategy/`
- `framework/`
- `lessons/`
- `production/`
- `automation/`
- `funnel/`
- `analytics/`

### 1.4 Sample direction decisions

Ban dau:

- `kai / gai / temade` duoc dung nhu sample quan trong nhat

Sau do da chuyen direction:

- public sample / video 1 = `ã‚ã‘ã ãƒ»ã‚ã‘ã§ã¯ãªã„ãƒ»ã‚ã‘ãŒãªã„ãƒ»ã‚ã‘ã«ã¯ã„ã‹ãªã„`
- `kai / gai / temade` = internal sample / framework test case / video 2 candidate

Ly do chuyen:

- cung surface form `ã‚ã‘`
- khac logic ro
- hop de hook public
- phu hop lam artifact dau tien de test method

### 1.5 Production artifacts da tao

#### Public sample - wake cluster

Da tao:

- `lessons/samples/06-sample-wake-cluster.md`
- `production/decks/03-script-writing-requirements-wake-cluster.md`
- `production/decks/03-slide-deck-wake-cluster-draft.md`
- `production/decks/04-script-wake-cluster-draft.md`
- `production/worksheets/02-worksheet-wake-cluster.md`
- `production/shorts/02-shorts-wake-cluster.md`

#### Internal benchmark - kai/gai/temade

Da giu va sap xep:

- `lessons/samples/05-sample-internal-test-case.md`
- `production/decks/01-slide-deck-internal-test-case-draft.md`
- `production/decks/01-script-internal-test-case-draft.md`
- `production/decks/02-script-writing-requirements-internal-test-case.md`
- `production/design-briefs/01-design-brief-internal-test-case.md`
- `production/worksheets/01-worksheet-internal-test-case.md`
- `production/shorts/01-shorts-internal-test-case.md`

### 1.6 Review and QA scaffolding

Da tao bo review de dung ngay khi script ve:

- `production/review-reports/00-sample-video-validation-checklist.md`
- `production/review-reports/01-review-sample-video-content.md`
- `production/review-reports/02-review-sample-video-method.md`
- `production/review-reports/03-review-sample-video-funnel.md`

Da tao prompt review:

- `automation/prompts/01-review-script-content-prompt.md`
- `automation/prompts/02-review-script-method-prompt.md`
- `automation/prompts/03-review-script-funnel-prompt.md`

### 1.7 Workflow docs da co

Da co 2 workflow goc:

- `07-workflow-multi-agent-production.md`
- `08-workflow-video-and-product-derivatives.md`

Hai file nay da giup xac dinh:

- role multi-agent
- asset chain tu lesson ra video / worksheet / shorts / lead magnet

---

## 2. Bai hoc rut ra tu qua trinh vua lam

### 2.1 Can tach ro planning va production

Neu khong tach ro:

- de bi note-heavy
- chuyen qua artifact cham
- kho biet file nao la source of truth

### 2.2 Can co direction lock som

Neu chua khoa:

- sample se doi de tai lien tuc
- prompt / script / deck bi troi
- review khong gom ve 1 muc tieu

Direction lock la 1 gate rieng.

### 2.3 Sample-first quan trong hon workflow-first

Co the viet rat nhieu workflow, nhung neu sample dau tien chua pass:

- method chua duoc xac minh
- asset derivative chua co nghia
- automation se scale sai

### 2.4 Review nen tach thanh nhieu lane

Review gop mot lan de bi loang.

Tot hon la tach:

- content accuracy
- pedagogy / method
- hook / flow / CTA

Voi public sample, lane `hook / flow / CTA` la gate that su, khong phai review phu.

Vi:

- script co the dung ve hoc thuat nhung van rot retention;
- phan method co the dung nhung mo dau van cham;
- CTA co the hop ly nhung xuat hien qua muon.

### 2.5 Internal benchmark rat co gia tri

`kai / gai / temade` khong nen bo.

No co gia tri lam:

- framework regression test
- doi chieu khi nghi method co van de
- candidate video 2

---

## 3. Van de cua flow hien tai

Flow vua qua van con mang tinh thu cong:

- tao file bang tay
- sync docs bang tay
- review prompt chay rieng
- ket qua review chua duoc format thanh decision log tu dong

Van de chinh:

1. chua co orchestration ro cho tung agent
2. chua co artifact contract chat che giua cac step
3. chua co rule "qua gate moi duoc sang step sau"
4. chua co template dong nhat cho moi output

---

## 4. To-be flow

Muc tieu la chuyen sang flow:

```text
1 step = 1 agent = 1 output = 1 gate
```

Agent o day co the la:

- ChatGPT
- Claude
- Gemini
- hoac future local agent worker

Dieu quan trong khong phai ten model, ma la vai tro va contract cua tung step.

---

## 5. To-be flow chi tiet

### Step 0 - Direction Lock Agent

**Vai tro:**

- chot de tai sample
- chot vai tro cua sample
- chot promise, pain point, CTA

**Input:**

- business plan
- backlog topic
- source lesson candidates

**Output:**

- `lesson brief`
- `direction lock note`

**Gate:**

- co 1 topic duy nhat
- co promise ro
- co ly do business / pedagogical ro

### Step 1 - Source Consolidation Agent

**Vai tro:**

- doc input source
- map source vao business / framework / sample
- loai bo overlap

**Input:**

- raw notes
- framework docs
- sample source files

**Output:**

- `source map`
- `normalized lesson input`

**Gate:**

- khong bo sot source quan trong
- co traceability ro

### Step 2 - Lesson Architect Agent

**Vai tro:**

- viet sample lesson active
- chot teaching core

**Input:**

- normalized lesson input
- framework 3 View
- lesson method

**Output:**

- `sample lesson`

**Contract:**

- phai co pain point
- phai co promise
- phai co Meaning / Form / Usage
- phai co comparison
- phai co clue map
- phai co practice idea

**Gate:**

- teaching core ro
- khong lan man
- co the di tiep sang script

### Step 3 - Script Brief Agent

**Vai tro:**

- chuyen sample lesson thanh yeu cau viet script

**Input:**

- sample lesson
- slide method
- video target

**Output:**

- `script writing requirements`

**Gate:**

- format output ro
- structure video ro
- constraints ro

### Step 4 - Script Writer Agent

**Vai tro:**

- viet script dau tien

**Input:**

- script writing requirements

**Output:**

- `script draft`

**Gate:**

- theo format slide/section
- du de review
- khong vuot scope

### Step 5 - Content Accuracy Reviewer Agent

**Vai tro:**

- review do dung grammar va nuance

**Input:**

- script draft
- sample lesson
- framework

**Output:**

- `content review report`

**Gate:**

- khong con loi critical ve noi dung

### Step 6 - Method Reviewer Agent

**Vai tro:**

- review 3 View
- review comparison
- review kha nang day hoc

**Input:**

- script draft
- content review da pass hoac da sua

**Output:**

- `method review report`

**Gate:**

- method du ro
- giai quyet dung pain point

### Step 7 - Hook / Flow / CTA Reviewer Agent

**Vai tro:**

- review hook
- review pacing
- review recap
- review CTA worksheet

**Input:**

- script draft

**Output:**

- `flow review report`

**Gate:**

- co kha nang dung lam public sample

**Checklist uu tien cho public sample:**

- opening bat dau bang tinh huong, khong bang list abstract
- viewer co `aha` trong 60-90 giay dau
- payoff cua hook khong bi tre qua xa
- phan method/meta khong qua dai
- moi grammar block co time budget ro
- CTA duoc seed tu giua video

### Step 8 - Script Integrator Agent

**Vai tro:**

- tong hop 3 lane review
- patch script thanh version tiep theo

**Input:**

- script draft
- 3 review reports

**Output:**

- `script draft v2`
- `decision log`

**Gate:**

- moi fix critical da xu ly
- co ly do ro cho nhung gi chua sua

### Step 9 - Deck Architect Agent

**Vai tro:**

- doi script thanh slide deck draft

**Input:**

- script draft v2
- slide method

**Output:**

- `slide deck draft`

**Gate:**

- mapping script -> slide ro
- slide text khong qua tai

### Step 10 - Worksheet Generator Agent

**Vai tro:**

- sinh worksheet tu teaching core va script final

**Input:**

- sample lesson
- script draft v2

**Output:**

- `worksheet draft`

**Gate:**

- dung duoc doc lap
- co gia tri CTA that

### Step 11 - Shorts Generator Agent

**Vai tro:**

- tach short-form assets tu script

**Input:**

- script draft v2
- worksheet promise

**Output:**

- `shorts pack`

**Gate:**

- moi short co 1 hook ro
- khong lech promise

### Step 12 - Bundle QA Agent

**Vai tro:**

- review script + deck + worksheet + shorts nhu 1 bundle

**Input:**

- tat ca artifact da co

**Output:**

- `bundle review report`
- `pass / revise`

**Gate:**

- artifact thong nhat
- du de quay / test / publish noi bo

### Step 13 - Decision Logger Agent

**Vai tro:**

- ghi ket luan
- cap nhat learning vao system

**Input:**

- review reports
- bundle QA result

**Output:**

- `decision log`
- `framework update candidates`
- `prompt update candidates`

**Gate:**

- bai hoc duoc ghi lai
- lan sau chay nhanh hon

---

## 6. Artifact contract de automation hoa

Moi step nen co contract ro:

### A. Required input files

Agent chi doc dung cac file duoc chi dinh.

### B. Output file path

Agent phai ghi output vao dung 1 file da dinh.

### C. Output format

Vi du:

- review report phai co `Overall verdict`, `Findings`, `Suggested fixes`, `Final recommendation`
- script phai theo slide
- worksheet phai co `logic map`, `practice`, `self-check`

### D. Gate rule

Moi step phai co tieu chi pass/fail.

Khong pass thi:

- quay lai step truoc
- hoac giao cho Integrator Agent xu ly

---

## 7. Minimal orchestration sequence

Sequence toi thieu de lan sau chay gon:

1. Direction Lock Agent
2. Lesson Architect Agent
3. Script Brief Agent
4. Script Writer Agent
5. Content Reviewer Agent
6. Method Reviewer Agent
7. Flow Reviewer Agent
8. Script Integrator Agent
9. Deck Architect Agent
10. Worksheet Generator Agent
11. Shorts Generator Agent
12. Bundle QA Agent
13. Decision Logger Agent

---

## 8. File mapping cho orchestration

### Public sample hien tai - wake cluster

#### Inputs

- `lessons/samples/06-sample-wake-cluster.md`
- `framework/lesson-method/02-framework-lesson-method.md`
- `framework/grammar-3-view/03-framework-3-view-grammar.md`
- `framework/slide-method/04-slide-method-guideline.md`

#### Working outputs

- `production/decks/03-script-writing-requirements-wake-cluster.md`
- `production/decks/04-script-wake-cluster-draft.md`
- `production/decks/03-slide-deck-wake-cluster-draft.md`
- `production/worksheets/02-worksheet-wake-cluster.md`
- `production/shorts/02-shorts-wake-cluster.md`

#### Review outputs

- `production/review-reports/01-review-sample-video-content.md`
- `production/review-reports/02-review-sample-video-method.md`
- `production/review-reports/03-review-sample-video-funnel.md`

### Internal benchmark

- `lessons/samples/05-sample-internal-test-case.md`
- `production/decks/02-script-writing-requirements-internal-test-case.md`

Dung cho:

- regression check
- doi chieu method
- test prompt robustness

---

## 9. Next automation tasks

De toi uu hoa tiep, nen lam tiep 4 viec:

1. Tao template chung cho `review report`
2. Tao template chung cho `script writing requirements`
3. Tao template chung cho `script draft`
4. Tao `decision log` file mau

Sau do moi tinh den:

- prompt chaining
- local command runner
- multi-agent orchestration script

---

## 10. Operating principle

Khong tu dong hoa moi thu ngay lap tuc.

Thu tu dung hon la:

1. chot 1 flow thu cong dung
2. ghi lai artifact contract
3. tach step / tach role
4. chi tu dong hoa nhung step lap di lap lai

Noi cach khac:

> automation cua `opus-lucida` phai di sau method clarity, khong di truoc.

---

*Opus Lucida - automation retrospective and to-be flow v0.1 | 2026-04-29*

