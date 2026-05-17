# Copy To ChatGPT - Review Slide Deck Step By Step
**Status:** Active
**Use case:** Dua slide deck cho ChatGPT review truoc khi chuyen sang worksheet / recording
**Target deck:** `../../00-active/wake-cluster/03-slide-deck.md`
**QA criteria:** `../../03-qa/criteria/wake-slide-qa-criteria.md`

---

## Step 1 - Copy prompt

Copy prompt trong section `Prompt` ben duoi.

---

## Step 2 - Paste slide deck

Sau dong:

```text
Day la slide deck can review:
[PASTE SLIDE DECK HERE]
```

paste toan bo file:

```text
production/00-active/wake-cluster/03-slide-deck.md
```

---

## Step 3 - Paste result back

Khi ChatGPT tra review, paste ket qua vao:

```text
production/03-qa/reports/
```

Ten file goi y:

```text
05-slide-qa-wake-cluster-review-v1.md
```

---

## Prompt

```text
Hay dong vai 1 slide QA reviewer + instructional designer cho video day tieng Nhat JLPT N2.

Toi se dua cho ban 1 slide deck draft cho video:
わけだ・わけではない・わけがない・わけにはいかない

Deck nay duoc sinh tu:
- teaching skeleton = teaching truth
- script = narration truth
- slide deck = presentation truth

Nhiem vu cua ban la review SLIDE DECK, khong viet lai script.

Hay danh gia theo 6 nhom:

1. Source Alignment
- slide co bam dung logic tu script/skeleton khong
- co slide nao them y moi ngoai scope khong
- co slide nao bo mat beat quan trong khong

2. Teaching Accuracy
- わけだ co duoc giu la "ket luan hop ly", khong chi la "thao nao" khong
- わけではない co duoc giu la "phu dinh nhan dinh / khong co nghia la...", khong bi rut gon thanh "phu dinh mot phan" khong
- わけがない co ro la "khong the nao / bac bo kha nang manh" khong
- わけにはいかない co ro la "khong the lam vi rang buoc" khong
- bonus Vないわけにはいかない co dung va khong lan at phan chinh khong
- vi du Japanese tren slide co sai form khong

3. Cognitive Load
- on-screen text co qua tai khong
- moi slide co 1 y chinh khong
- slide co giong handout hon la video slide khong
- grammar slides co qua nhieu chu khong

4. Visual Intent
- opening co dung contrast khong
- hook quiz co ro khong
- grammar slides co de nhin nhanh khong
- comparison slides co nen la bang 2 cot khong
- recap co screenshot-friendly khong

5. Flow And Retention
- 3 slide dau co du giu viewer khong
- payoff hook co den som khong
- thu tu slide co hop voi nhịp video 10-13 phut khong
- co slide nao lam video cham di khong

6. CTA Fit
- slide dau hieu chon mau co seed worksheet tu nhien khong
- CTA worksheet co ro gia tri khong
- CTA co tranh salesy khong

Cach tra loi bat buoc:

## Overall verdict
- Pass / Pass with revisions / Fail
- 2-4 cau tom tat

## Critical findings
Moi finding phai co:
- Slide:
- Issue:
- Why it matters:
- Suggested fix:

## Major findings
Moi finding phai co:
- Slide:
- Issue:
- Why it matters:
- Suggested fix:

## Minor findings
Moi finding phai co:
- Slide:
- Issue:
- Suggested fix:

## Slide readiness
- Ready for PPT/Canva: Yes / No
- Ready for recording: Yes / No

## Priority fixes
Liet ke 3-7 fix quan trong nhat.

Luu y:
- Review bang tieng Viet
- Thang, ro, uu tien tinh dung va tinh dung duoc trong video
- Khong can khen xa giao
- Khong viet lai toan bo deck
- Neu slide nao qua nhieu chu, hay noi ro nen cat gi

Day la slide deck can review:
[PASTE SLIDE DECK HERE]
```
