# Copy To ChatGPT - Review Hook Flow CTA - Step By Step
**Status:** Ready
**Use case:** Danh cho lane review `hook + flow + CTA`

---

## Step-by-step

1. Mo file script active trong `production/00-active/wake-cluster/02-script.md`
2. Copy toan bo noi dung script
3. Mo 1 chat moi khac trong ChatGPT
4. Copy prompt duoi day
5. Paste script vao dung cho `[PASTE SCRIPT HERE]`
6. Gui va doi ket qua review
7. Dan review do ve lai repo hoac gui lai cho Codex

---

## Prompt

```text
Hay dong vai 1 YouTube education strategist + instructional designer cho video day tieng Nhat.

Toi se dua cho ban 1 script video YouTube JLPT N2 ve cum:
わけだ・わけではない・わけがない・わけにはいかない

Nhiem vu cua ban chi la review:
- hook
- flow
- pacing
- clarity cho viewer
- CTA worksheet

Khong can review sau ve do dung ngu phap, tru khi co van de qua ro anh huong toi flow.

Hay danh gia:

1. Hook
- mo dau bang tinh huong co du manh cho public sample dau tien khong
- 3-5 giay dau co cham dung pain point/tinh huong/contrast khong
- script co mo dau bang chao hoi/branding qua som khong
- pain point “cung la wake nhung logic khac nhau” co vao ro khong
- viewer co ly do de xem tiep trong 30-60 giay dau khong
- neu co loi chao, no co nam sau hook thay vi cau dau tien khong

2. Flow / pacing
- script co chay tu nhien khong
- payoff cua hook co den du som khong
- phan `3 cach nhin` co gon du khong
- thu tu day:
  - わけではない
  - わけにはいかない
  - わけだ
  - わけがない
  co hop ly cho retention khong
- 12-15 phut co hop ly khong
- co doan nao lap y, mat nang luong, hoac qua day ly thuyet khong

3. Teaching clarity
- viewer N3 cuoi / dau N2 co theo kip khong
- `Nghia cot loi / Hinh thuc / Cach dung` co de tieu hoa khong
- `dau hieu chon mau` co de ap dung vao bai thi khong
- recap co de screenshot va de nho khong

4. CTA / funnel fit
- CTA worksheet co tu nhien khong
- script co tao du nhu cau de viewer muon tai worksheet khong
- viec seed CTA tu giua video co du mem khong

Cach tra loi bat buoc:

## Overall verdict
- Pass / Pass with revisions / Fail for public sample
- tom tat 2-4 cau

## Findings
Chia theo muc do:
- Critical
- Major
- Minor

Moi finding phai co:
- Slide / section
- Van de
- Tac dong toi viewer retention / clarity / CTA
- Cach sua cu the

## Priority fixes
- Liet ke 5-8 sua doi quan trong nhat

## Final recommendation
Chon 1:
- Co the quay sau khi sua nhe
- Can sua kha nhieu truoc khi quay
- Nen doi lai structure video

Luu y:
- Chi tap trung vao hook, flow, CTA
- Khong lan sang review hoc thuat qua sau
- Review bang tieng Viet
- Thang, ro, khong khen xa giao

Day la script can review:
[PASTE SCRIPT HERE]
```

---

## Sau khi co ket qua

- Chot fix nao can patch script
- Neu hook / flow doi nhieu, phai update lai slide trong `production/00-active/wake-cluster/03-slide-deck.md`
- Gui ket qua lai cho Codex de patch script/deck dong bo
