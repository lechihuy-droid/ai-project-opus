# BD - Sample Product Bundle
**Date:** 2026-04-29
**Status:** Planning
**Ref:** `BD-sample-video-validation.md`, `SD-beta-architecture.md`, `automation/workflows/08-workflow-video-and-product-derivatives.md`

---

## Muc tieu

Trong giai doan hien tai, `opus-lucida` khong uu tien them workflow hay funnel moi.

Muc tieu duy nhat la:

> san xuat 1 bo san pham sample hoan chinh, du de kiem tra tinh dung cua noi dung, phuong cham day hoc, nhip video va gia tri learner asset.

Bo sample nay la **artifact trung tam** cua phase dau.

---

## Scope cua sample bundle

Sample bundle hien tai chi gom 5 asset:

1. sample lesson
2. script sample
3. slide deck draft
4. worksheet sample
5. shorts sample pack

Khong uu tien trong bundle nay:

- landing page hoan chinh
- waitlist implementation
- checkout
- webinar plan
- automation them

---

## Topic sample da chot

Public/sample video dau tien:

`ã‚ã‘ã ãƒ»ã‚ã‘ã§ã¯ãªã„ãƒ»ã‚ã‘ãŒãªã„ãƒ»ã‚ã‘ã«ã¯ã„ã‹ãªã„`

Ten public working:

`N2 ã‚ã‘ cluster: thao nao / khong phai la / khong the nao / khong the lam vi rang buoc`

Internal sample / framework test case:

`kai / gai / temade`

---

## Deliverables bat buoc

### D1 - Sample lesson

File:

- `lessons/samples/06-sample-wake-cluster.md`

Vai tro:

- source teaching core
- source story
- source pain point
- source 3 View logic

### D2 - Script sample

File:

- `production/decks/04-script-wake-cluster-draft.md`

Vai tro:

- check tinh dung cua logic khi chuyen thanh loi noi
- check nhip 12-15 phut
- check xem nguoi hoc co theo kip khong

### D3 - Slide deck draft

File:

- `production/decks/03-slide-deck-wake-cluster-draft.md`

Vai tro:

- check slide rhythm
- check amount of text
- check mapping script -> slide

### D4 - Worksheet sample

File:

- `production/worksheets/02-worksheet-wake-cluster.md`

Vai tro:

- check learner value
- check worksheet co du xung dang lam CTA khong

### D5 - Shorts sample pack

File:

- `production/shorts/02-shorts-wake-cluster.md`

Vai tro:

- check kha nang cat nho thong diep
- check asset reach tu sample video

---

## Success criteria cho sample bundle

Bo sample duoc coi la dat khi:

1. script doc len khong bi doan nao qua ly thuyet
2. 3 View giai quyet duoc pain point cua nhom `ã‚ã‘`
3. deck 18 slide van ro, khong bi qua tai
4. worksheet co gia tri hoc tap doc lap
5. shorts rut ra duoc tu core thong diep cua bai
6. sau review, team biet ro:
   - giu nguyen phuong cham
   - sua nhe
   - hay can refactor truoc khi scale

---

## Thu tu san xuat

Thu tu duy nhat can tap trung:

1. khoa sample lesson
2. viet script sample
3. update deck draft theo script
4. hoan thien worksheet sample
5. chot shorts pack
6. review content
7. review method
8. review learner/funnel fit
9. tao decision log

---

## Khong lam gi trong luc nay

Trong luc chua xong sample bundle, khong uu tien:

- tao them workflow moi
- mo rong sang bai sample thu 2
- lam landing page thuc te
- polish pricing / offer sau hon muc can thiet
- setup community / email / payment

Neu co y tuong moi, chi ghi backlog.

---

## Review gates

### Gate 1 - Teaching core lock

Chi qua gate neu:

- pain point ro
- promise ro
- 3 View ro
- comparison ro

### Gate 2 - Script gate

Chi qua gate neu:

- script doc xuoi
- nhip hop ly
- vi du tu nhien

### Gate 3 - Bundle gate

Chi qua gate neu:

- script + deck + worksheet + shorts thong nhat voi nhau
- bo sample du de dung lam artifact review that

---

## Current source of truth for sample bundle

- `lessons/samples/06-sample-wake-cluster.md`
- `production/decks/03-script-writing-requirements-wake-cluster.md`

Internal reference/test case:

- `production/decks/02-script-writing-requirements-internal-test-case.md`
- `lessons/samples/05-sample-internal-test-case.md`
- `production/slide-skeletons/06-skeleton-internal-test-case.md`
- `production/design-briefs/01-design-brief-internal-test-case.md`
- `production/worksheets/01-worksheet-internal-test-case.md`
- `production/shorts/01-shorts-internal-test-case.md`

---

## Next action

Khi script tra ve, cong viec uu tien nhat la:

1. dat script vao `production/decks/04-script-wake-cluster-draft.md`
2. review content
3. review method
4. neu can, sua sample lesson / deck / worksheet theo ket qua review
5. dung `kai / gai / temade` de doi chieu framework neu co diem nghi ngo

---

*Opus Lucida - sample product bundle v0.1 | 2026-04-29*

