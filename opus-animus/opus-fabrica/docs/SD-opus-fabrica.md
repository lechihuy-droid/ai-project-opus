# SD - Opus Fabrica
**Date:** 2026-04-29
**Status:** Active
**Project:** `Opus Animus`

---

## 1. Muc tieu

`Opus Fabrica` la workspace chua cac agent, tool, va skill dung chung cho nhieu he con trong `Opus Animus`.

No giai quyet mot van de kien truc:

- co nhung agent khong nen thuoc rieng `opus-consilium`
- nhung cung khong nen tro thanh mot app san pham doc lap nhu `opus-lucida`

---

## 2. Dinh nghia

`Opus Fabrica` la tang shared capability.

Vi du:

- file conversion
- import / export utility
- reusable skill agent
- support daemon / watcher
- shared ingestion helper

---

## 3. Boundary

### Nam trong `Opus Fabrica`

- tool dung chung cho nhieu workspace
- capability technical co the reuse
- utility agent khong so huu source-of-truth business

### Khong nam trong `Opus Fabrica`

- central inbox / wiki / review brain
- product workspace
- strategy, lesson, funnel, production asset

Tom lai:

```text
Opus Consilium = central brain
Opus Fabrica  = shared agent/tool layer
Opus Lucida    = product/content workspace
```

---

## 4. Resident dau tien

Resident dau tien cua `Opus Fabrica` la:

- `markitdown-agent`

Ly do:

- no la input tool dung chung
- co the phuc vu `opus-consilium`
- sau nay co the phuc vu them workspace khac

---

## 5. Quy tac dat agent vao day

Mot agent/tool nen vao `Opus Fabrica` neu:

1. dung duoc cho hon mot workspace
2. khong la source-of-truth business
3. gia tri chinh la technical capability
4. co the duoc goi nhu mot utility / skill chung

---

## 6. Chot quyet dinh

- Tao workspace `opus-fabrica/`
- Dua `markitdown-agent/` vao day
- Tu nay shared agent/tool khong thuoc rieng `opus-consilium`
