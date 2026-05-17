# ChatGPT Handoff Workflow
**Status:** Active
**Role:** Huong dan thao tac nhanh giua `opus-lucida` va ChatGPT

---

## Folder map

### `../00-active/wake-cluster/`

Folder nay giu 3 tai lieu xuong song cua MVP:

- `01-master-teaching-skeleton.md`
- `02-script.md`
- `03-slide-deck.md`

Day la canonical source cho teaching lane hien tai.

### `01-input/`

File trong folder nay la file ban copy qua ChatGPT de:

- viet script
- viet lai script
- dua context dung cho 1 lane review

### `02-review-prompts/`

File trong folder nay la prompt copy-paste vao ChatGPT.

Ten file da noi ro:

- review cai gi
- dung o step nao

### `03-raw-returns/`

File trong folder nay la raw output tu ChatGPT.

Voi MVP `wake cluster`, ban active da duoc gom vao:

```text
../00-active/wake-cluster/02-script.md
```

#### `03-raw-returns/scripts/`

Day la cho ban paste nguyen van ket qua ChatGPT vua tra ve.

Quy uoc:

- `03-raw-returns/scripts/` = ban raw, chua lam sach
- `../00-active/wake-cluster/02-script.md` = ban active de tiep tuc sua va dung trong repo

Nen paste vao day truoc, roi moi chuyen / merge sang script active.

### `04-patch-plans/`

File trong folder nay la noi ghi patch plan, fix list, decision de sua script/slide.

---

## Cach dung nhanh nhat

### Case 1 - Muon ChatGPT viet script

1. Mo `01-input/`
2. Copy file requirements
3. Paste vao ChatGPT
4. Lay ket qua ve dat vao `03-raw-returns/scripts/`
5. Tu do moi chon:
   - merge vao script active trong `../00-active/wake-cluster/02-script.md`
   - hoac giu lai de review truoc

### Case 2 - Muon ChatGPT review script

1. Mo file script active trong `../00-active/wake-cluster/02-script.md`
2. Mo 1 file prompt trong `02-review-prompts/`
3. Copy prompt
4. Paste script vao duoi prompt
5. Chay tung lane review o tung chat rieng

### Case 3 - Muon sua script

1. Xem review
2. Ghi patch plan vao `04-patch-plans/`
3. Sua file script active trong `../00-active/wake-cluster/02-script.md`
4. Neu script doi nhieu, update lai slide trong `../00-active/wake-cluster/03-slide-deck.md`

### Case 4 - Muon paste nhanh script ChatGPT da sua

1. Mo `03-raw-returns/scripts/`
2. Tao 1 file moi theo ten:
   - `wake-cluster-chatgpt-returned-v1.md`
   - `wake-cluster-chatgpt-returned-v2.md`
   - `internal-test-case-chatgpt-returned-v1.md`
3. Paste nguyen van output ChatGPT vao do
4. Khong sua tay trong file raw nay
5. Neu can lam sach va chot ban dung, moi copy noi dung sang file active trong `../00-active/wake-cluster/02-script.md`

### Case 5 - Muon ChatGPT review slide deck

1. Mo file deck active trong `../00-active/wake-cluster/03-slide-deck.md`
2. Mo prompt:
   - `02-review-prompts/04-review-slide-deck.md`
3. Copy prompt
4. Paste deck vao duoi prompt
5. Khi co ket qua, luu vao `production/03-qa/reports/`
6. Neu co issue major/critical, patch deck truoc khi sang worksheet / recording

---

## Fastest operating suggestion

De nhanh nhat, ban chi can nho 3 diem:

1. `01-input/` = gui di
2. `02-review-prompts/` = prompt dung de hoi
3. `03-raw-returns/scripts/` = nhan ban raw
4. `../00-active/wake-cluster/` = ban active de lam viec tiep

Neu muon nhanh hon nua, workflow toi thieu la:

```text
requirements -> ChatGPT -> raw returned -> active script -> review prompt -> patch -> slide output
```

Khong can mo toan bo repo moi lan.

---

## Suggested pinned files

Neu muon thao tac nhanh trong IDE, nen pin:

- `production/01-chatgpt-handoff/01-input/wake-script-requirements.md`
- `production/01-chatgpt-handoff/02-review-prompts/01-review-script-content.md`
- `production/01-chatgpt-handoff/02-review-prompts/02-review-script-flow-cta.md`
- `production/01-chatgpt-handoff/02-review-prompts/04-review-slide-deck.md`
- `production/01-chatgpt-handoff/03-raw-returns/scripts/`
- `production/00-active/wake-cluster/01-master-teaching-skeleton.md`
- `production/00-active/wake-cluster/02-script.md`
- `production/00-active/wake-cluster/03-slide-deck.md`

---

*Opus Lucida - ChatGPT handoff workflow v0.1 | 2026-04-29*
