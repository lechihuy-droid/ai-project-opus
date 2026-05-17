# Copy To ChatGPT - Review Content Accuracy - Step By Step
**Status:** Ready
**Use case:** Danh cho lane review `content accuracy`

---

## Step-by-step

1. Mo file script active trong `production/00-active/wake-cluster/02-script.md`
2. Copy toan bo noi dung script
3. Mo 1 chat moi trong ChatGPT
4. Copy prompt duoi day
5. Paste script vao dung cho `[PASTE SCRIPT HERE]`
6. Gui va doi ket qua review
7. Dan review do ve lai repo hoac gui lai cho Codex

---

## Prompt

```text
Hay dong vai 1 reviewer chuyen ve ngu phap N2 va do chinh xac noi dung giang day.

Toi se dua cho ban 1 script video YouTube JLPT N2 ve cum:
わけだ・わけではない・わけがない・わけにはいかない

Nhiem vu cua ban chi la review CONTENT ACCURACY, khong review sau ve hook hay YouTube flow.

Hay kiem tra:

- nuance cua tung mau co dung khong
- giai thich co overgeneralize khong
- co nham giua 4 mau khong
- vi du co tu nhien va hop usage khong
- phan `Nghia cot loi / Hinh thuc / Cach dung` co chinh xac khong
- `dau hieu chon mau` co hop ly khong
- co doan nao de nguoi hoc hieu sai khong
- thu tu day hoc moi co lam sai logic hoc thuat khong

Cach tra loi bat buoc:

## Overall verdict
- Pass / Pass with revisions / Fail
- tom tat 2-4 cau

## Findings
Chia theo muc do:
- Critical
- Major
- Minor

Moi finding phai co:
- Slide / section
- Van de noi dung
- Vi sao sai hoac de gay hieu nham
- Cach sua cu the

## Corrected interpretations
Neu can, hay viet lai ngan gon:
- わけだ
- わけではない
- わけがない
- わけにはいかない

## Final recommendation
- Co the giu framework nay ve mat noi dung hay khong
- Can sua phan nao truoc khi quay

Luu y:
- Chi tap trung vao do dung cua noi dung
- Khong can nhan xet sau ve hook, pacing, CTA
- Review bang tieng Viet
- Neu thay sai, noi thang

Day la script can review:
[PASTE SCRIPT HERE]
```

---

## Sau khi co ket qua

- Neu co `Critical`, uu tien sua script truoc
- Neu chi co `Major/Minor`, co the tong hop thanh patch plan
- Gui ket qua lai cho Codex de patch nhanh hon
