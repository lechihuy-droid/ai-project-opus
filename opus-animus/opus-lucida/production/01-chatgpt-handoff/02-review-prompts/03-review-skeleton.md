# Copy To ChatGPT - Review Teaching Skeleton - Step By Step
**Status:** Ready
**Use case:** Danh cho lane review `master teaching skeleton`

---

## Step-by-step

1. Mo file `master teaching skeleton`
2. Copy toan bo noi dung skeleton
3. Mo 1 chat moi trong ChatGPT
4. Copy prompt duoi day
5. Paste skeleton vao dung cho `[PASTE TEACHING SKELETON HERE]`
6. Gui va doi ket qua review
7. Dan review do ve lai repo hoac gui lai cho Codex

---

## Prompt

```text
Hay dong vai 1 reviewer chuyen ve:
- instructional design cho day tieng Nhat
- grammar pedagogy cho JLPT N2
- content architecture cho 1 lesson co the sinh ra script, slide, worksheet va shorts

Toi se dua cho ban 1 `master teaching skeleton` cua 1 bai N2.

Nhiem vu cua ban KHONG phai la viet lai script.
Nhiem vu cua ban la review chat luong cua `teaching skeleton` nhu source-of-truth truoc khi sinh:
- script
- slide
- worksheet
- shorts

Hay review theo 4 nhom sau:

1. Teaching Core Quality
- pain point co ro va dung khong
- promise co ro va dung target learner khong
- 4 logic / 4 grammar points co tach bach du khong
- `Nghia cot loi / Hinh thuc / Cach dung` cua tung mau co du de day khong
- common mistake va minimal pair co hop ly khong

2. Pedagogy / Lesson Design
- thu tu bai day co hop ly khong
- hook, story, big idea, comparison, practice co an khop khong
- learner N3 cuoi / dau N2 co theo kip skeleton nay khong
- skeleton co qua abstract hay qua day ly thuyet khong
- phan `dau hieu chon mau` co du de bien thanh bai thi / practice tool khong

3. Source-of-Truth Readiness
- skeleton co du chat de sinh script ma khong phai nghi lai logic bai khong
- skeleton co du chat de sinh slide ma khong phai tu che them teaching structure khong
- skeleton co du chat de sinh worksheet co gia tri that khong
- skeleton co du hat giong de sinh 3-5 short assets khong
- co phan nao dang thieu contract giua skeleton va cac asset sau khong

4. MVP Suitability
- skeleton nay da du tot de dung cho MVP public sample chua
- co phan nao nen sua ngay truoc khi review script/video tiep khong
- co phan nao co the de sua sau ma khong anh huong MVP khong

Cach tra loi bat buoc:

## Overall verdict
- Pass / Pass with revisions / Fail
- tom tat 3-5 cau

## Findings
Chia theo muc do:
- Critical
- Major
- Minor

Moi finding phai co:
- Section
- Van de
- Vi sao no quan trong
- Cach sua cu the

## Skeleton readiness by downstream asset
Danh gia rieng:
- Script readiness
- Slide readiness
- Worksheet readiness
- Shorts readiness

Moi muc cho:
- Ready / Partially ready / Not ready
- 1-3 cau giai thich

## Priority fixes
- Liet ke 5-8 sua doi quan trong nhat neu muon dung skeleton nay lam teaching truth

## Final recommendation
Chon 1:
- Co the dung skeleton nay de tiep tuc sinh script/slide
- Can sua skeleton kha nhieu truoc khi sinh them asset
- Nen refactor lai teaching structure

Luu y:
- Review bang tieng Viet
- Thang, ro, khong khen xa giao
- Uu tien danh gia skeleton nhu source-of-truth, khong bien no thanh review script

Day la teaching skeleton can review:
[PASTE TEACHING SKELETON HERE]
```

---

## Suggested first target

Neu muon dung ngay, target dau tien nen la:

- `production/00-active/wake-cluster/01-master-teaching-skeleton.md`

---

## Sau khi co ket qua

- Neu skeleton `Fail` hoac co `Critical`, sua skeleton truoc khi sua them script/slide
- Neu skeleton `Pass with revisions`, co the patch skeleton va sync xuong script/slide
- Neu skeleton `Pass`, tiep tuc uu tien teaching lane

---

*Opus Lucida - teaching skeleton review prompt v0.1 | 2026-04-29*
