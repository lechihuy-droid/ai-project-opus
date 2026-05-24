# SD - Central Inbox and Routing
**Date:** 2026-04-29
**Status:** Active
**Project:** `Opus Consilium`

---

## 1. Muc tieu

Tai lieu nay chot mot nguyen tac moi cho he `Opus Animus`:

`input khong nen di thang vao opus-lucida`.

Thay vao do, input di vao `Opus Consilium` truoc, roi moi duoc review, classify, va route sang workspace dung.

---

## 2. Vi sao can central inbox

Y tuong ban nay ra trong dau luc dau thuong chua ro no la:

- y tuong san pham;
- y tuong content;
- y tuong workflow;
- y tuong prompt / agent;
- y tuong business co the monetize;
- hay chi la mot ghi chu can dua vao wiki.

Neu ep no vao `opus-lucida` qua som thi goc nhin se hep lai.

Vi vay:

```text
User input
  -> Opus Consilium / Inbox
    -> review + classify + detect signal
      -> route sang workspace dung
```

---

## 3. Dinh nghia cac dich den sau review

Sau khi vao `Inbox`, moi input co the duoc dua toi 1 hoac nhieu dich den:

1. `opus-lucida`
2. `personal-wiki`
3. `business / opportunity backlog`
4. `agent system improvement`

### 3.1 `opus-lucida`

Dung khi input lien quan den:

- content strategy;
- lesson / grammar / production workflow;
- funnel / lead magnet / offer cho Lucida.

### 3.2 `personal-wiki`

Dung khi input la:

- insight can giu lau dai;
- note tham khao;
- pattern can tra cuu lai sau;
- tri thuc chua can action ngay.

### 3.3 `business / opportunity backlog`

Dung khi input co dau hieu:

- co the ban duoc;
- co the thanh offer;
- co the thanh lead magnet;
- co the thanh content pillar cho `Opus Animus`.

### 3.4 `agent system improvement`

Dung khi input lien quan den:

- prompt pattern;
- ky nang dung AI;
- workflow agent;
- tool / skill / automation can bo sung.

---

## 4. Review objectives hang tuan

`Weekly review` cua `Opus Consilium` nen co 3 truc chinh:

### 4.1 AI Operator Review

Tra loi:

- user dang prompt AI gioi den dau;
- prompt co ro outcome va constraint khong;
- user co iterate va review output tot khong.

### 4.2 Knowledge Review

Tra loi:

- inbox co duoc xu ly deu khong;
- insight co duoc dua vao wiki dung cach khong;
- tri thuc co tai su dung duoc khong;
- co lap lai cung mot y vi note qua roi rac khong.

### 4.3 Opportunity Review

Tra loi:

- co y tuong nao co the monetize khong;
- co y tuong nao co the thanh offer khong;
- co y tuong nao co the thanh lead magnet khong;
- co y tuong nao co the thanh content pillar cho `Opus Animus` khong;
- co y tuong nao co the thanh internal tool / skill de tang toc production khong.

---

## 5. Operational modules

De van de de nho va de van hanh, `Opus Consilium` chi can 6 ten module giao tiep:

1. `Inbox`
2. `Review`
3. `Signals`
4. `Memory`
5. `Routing`
6. `Weekly`

---

## 6. Input channels uu tien

Thu tu uu tien de build:

1. Telegram bot / mobile text capture
2. raw inbox file drop
3. prompt ledger tu VS Code session

Tat ca deu di qua `Inbox` truoc.

---

## 7. Chot quy tac

- `Opus Consilium` la central inbox cua ca he `Opus Animus`
- `opus-lucida` khong phai diem nhan input tho dau tien
- moi review dinh ky phai co 3 truc: operator, knowledge, opportunity
- routing la buoc bat buoc truoc khi dua insight vao workspace con
