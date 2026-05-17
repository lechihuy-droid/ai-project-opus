# Paste ChatGPT Script Here
**Status:** Active
**Role:** Noi paste ban script raw duoc ChatGPT sua / viet lai

---

## Muc dich

Folder nay dung de giu:

- ban script raw ChatGPT moi tra ve;
- ban script da duoc ChatGPT sua theo review;
- ban script de doi chieu truoc khi merge vao file active.

Khong nen sua tay qua nhieu trong folder nay.

---

## Cach dung

1. Tao file moi trong folder nay
2. Dat ten de nho ngay muc dich va version
3. Paste nguyen van output ChatGPT vao day
4. Sau do moi:
   - review
   - patch
   - merge sang script active trong `../`

---

## Ten file goi y

- `wake-cluster-chatgpt-returned-v1.md`
- `wake-cluster-chatgpt-returned-v2.md`
- `internal-test-case-chatgpt-returned-v1.md`

Neu la ban sau khi review content:

- `wake-cluster-after-content-review-v1.md`

Neu la ban sau khi review hook/flow:

- `wake-cluster-after-flow-review-v1.md`

---

## Rule nhanh

- `00-chatgpt-returned/` = raw truth tu ChatGPT
- `../../00-active/wake-cluster/02-script.md` = working truth trong repo

Hay giu 2 lop nay tach nhau de de so sanh va rollback.
