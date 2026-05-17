# BD - Central Inbox and Routing
**Date:** 2026-04-29
**Status:** Planning
**Project:** `Opus Consilium`
**Ref:** `SD-central-inbox-routing.md`, `SD-opus-consilium-naming.md`

---

## 1. Muc tieu cua BD nay

Build plan nay bien principle:

`Inbox -> Review -> Routing`

thanh mot chuoi implementation ro rang, co the lam tung buoc nho ma van giu dung huong kien truc.

Muc tieu khong phai build full system trong mot luot, ma la:

- co mot central inbox that su dung duoc;
- co review loop hang tuan ro output;
- co routing toi cac dich den chinh;
- co backlog ro cho monetization / AI operator / knowledge improvement.

---

## 2. Definition of Done

Central inbox flow duoc coi la da co MVP khi:

- user co the gui input de dang tu mobile vao `Opus Consilium`;
- moi input duoc luu vao mot inbox ro rang;
- co mot format review hang tuan theo 3 truc;
- co mot routing log de quyet dinh input di dau;
- co it nhat 1 dich den operational ngoai `personal-wiki`, cu the la `opus-lucida`.

---

## 3. Build order

Thu tu uu tien:

1. `Inbox capture`
2. `Inbox storage format`
3. `Weekly review format`
4. `Routing decision log`
5. `Destination stubs`
6. `Operational cadence`

---

## 4. Step-by-step plan

### Step 1 - Tao central inbox MVP

**Muc tieu:** Co noi nhan input tho truoc khi classify.

**Can build:**

- `raw/inbox/` tiep tuc la diem nhan file/text raw
- them mot inbox document de tong hop input de scan nhanh
- chot convention input source: telegram / file-drop / vscode prompt ledger

**Done khi:**

- co mot noi luu input tho de khong roi mat
- co convention ten / timestamp / source

---

### Step 2 - Chot inbox record schema

**Muc tieu:** Moi input duoc luu theo schema scan duoc va review duoc.

**Schema toi thieu de nghi:**

- `captured_at`
- `source`
- `raw_text`
- `suggested_type`
- `review_status`
- `route_status`

**Done khi:**

- bat ky input moi cung co the doc lai va classify sau
- khong phu thuoc nho bang tri nho cua user

---

### Step 3 - Tao weekly review format

**Muc tieu:** Moi tuan co output review ro rang, khong review chung chung.

**Output file de nghi:**

- `personal-wiki/Personal/reviews/review-YYYY-WW.md`

**Review sections bat buoc:**

1. `AI Operator Review`
2. `Knowledge Review`
3. `Opportunity Review`
4. `Recommended Routes`
5. `Actions for Next Week`

---

### Step 4 - Tao routing decision log

**Muc tieu:** Moi insight sau review duoc quyet dinh ro di dau.

**Destinations chot:**

1. `opus-lucida`
2. `personal-wiki`
3. `business / opportunity backlog`
4. `agent system improvement`

**Output file de nghi:**

- `personal-wiki/Personal/routing-log.md`

**Moi entry can co:**

- insight summary
- route destination
- why this route
- next action
- owner / status

---

### Step 5 - Tao destination stubs

**Muc tieu:** Khi route thi co noi de ha canh ngay.

**Can co toi thieu:**

- `opus-lucida` docs/backlog cho input lien quan Lucida
- `business/opportunity backlog` o root `OPUS ANIMUS`
- `agent system improvement` backlog trong `opus-consilium/docs/`

---

### Step 6 - Operationalize input channels

**Muc tieu:** Lam capture friction-less nhat cho user.

**Priority:**

1. Telegram text capture
2. Telegram file/photo/PDF -> inbox
3. VS Code prompt ledger

---

## 5. MVP scope cho dot tiep theo

Dot tiep theo nen chi gom 4 viec:

1. tao inbox storage format
2. tao weekly review template
3. tao routing log
4. tao destination backlog stub cho opportunity va agent improvement

Khong nen lam ngay:

- scoring phuc tap
- dashboard
- auto-routing hoan toan
- voice pipeline

---

## 6. Concrete TODO list

### Immediate

- [ ] Tao inbox storage file/schema cho input tho
- [ ] Tao weekly review template theo 3 truc
- [ ] Tao routing log file
- [ ] Tao business/opportunity backlog stub
- [ ] Tao agent improvement backlog stub

### Next

- [ ] Noi Telegram text capture vao inbox
- [ ] Noi Telegram file capture vao `raw/inbox/`
- [ ] Tao VS Code prompt ledger convention
- [ ] Chay review tuan dau tien bang tay

### Later

- [ ] Semi-auto classify input
- [ ] Semi-auto de xuat route
- [ ] Gom insight thanh monthly synthesis

---

## 7. Recommendation

Huong build tot nhat la:

- build `capture + storage + review template` truoc
- chay tay 1-2 tuan de hieu pattern thuc te
- sau do moi automation hoa routing va scoring
