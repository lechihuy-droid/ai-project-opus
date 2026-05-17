# SD - Opus Workspace Map
**Date:** 2026-04-29
**Status:** Active
**Project:** `Opus Animus`

---

## 1. Muc tieu

Tai lieu nay chot workspace map cap cao cho `Opus Animus`.

He hien tai duoc tach thanh 3 tang chinh:

1. `opus-consilium`
2. `opus-fabrica`
3. `opus-lucida`

---

## 2. Vai tro tung workspace

### `opus-consilium`

Day la:

- central brain
- inbox
- wiki
- review layer
- routing layer

No nhan input truoc, roi review va route sang noi dung hop ly.

### `opus-fabrica`

Day la:

- shared capability layer
- noi chua agent/tool/skill dung chung
- khong so huu source-of-truth business

Resident dau tien:

- `markitdown-agent`

### `opus-lucida`

Day la:

- product/content workspace
- noi trien khai system cho huong Lucida
- nhan input da duoc route tu `opus-consilium`

---

## 3. Boundary

```text
Opus Consilium = central brain / inbox / review / memory
Opus Fabrica  = shared agent / tool / skill layer
Opus Lucida    = product workspace
```

---

## 4. Quy tac dat capability

Dat vao `opus-consilium` neu:

- no la tri nho, review, routing, wiki cua toan he

Dat vao `opus-fabrica` neu:

- no la technical capability dung chung cho nhieu workspace
- no co the duoc tai su dung nhu mot skill/tool

Dat vao `opus-lucida` neu:

- no la asset, workflow, strategy, funnel, production lien quan rieng Lucida

---

## 5. Chot quyet dinh

- Them workspace `opus-fabrica/`
- Dua `markitdown-agent/` vao `opus-fabrica/`
- Tu nay shared agents nen duoc can nhac dua vao `opus-fabrica/` truoc
