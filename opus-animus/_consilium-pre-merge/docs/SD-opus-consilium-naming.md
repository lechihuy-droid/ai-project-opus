# SD - Opus Consilium Naming
**Date:** 2026-04-29
**Status:** Active
**Project:** `Opus Animus`
**Implementation path:** `opus-consilium/`

---

## 1. Muc tieu

Tai lieu nay chot cach goi ten moi cho `personal-agent` o cap he thong:

- ten he thong / display name = `Opus Consilium`
- slug uu tien de goi trong docs = `opus-consilium`
- implementation path = `opus-consilium/`

Muc tieu la thong nhat language trong toan bo `Opus Animus` ma khong tao them folder moi luc nay.

---

## 2. Dinh nghia vai tro

`Opus Consilium` la bo nao trung tam va wiki cua ca he `Opus Animus`.

No khong chi phuc vu `opus-lucida`, ma con co vai tro:

- nhan input / idea / prompt / note tu user;
- giu memory va knowledge base chung;
- review cach user dang lam viec voi AI;
- tim signal co the monetize hoac leverage cho `Opus Animus`;
- route insight sang cac workspace con nhu `opus-lucida`.

Tom lai:

```text
Opus Animus
  -> Opus Consilium = central brain / wiki / review layer
  -> Opus Lucida = mot workspace con
```

---

## 3. Pham vi cua Opus Consilium

`Opus Consilium` bao gom 6 nhom chuc nang chinh:

1. `Inbox`
2. `Review`
3. `Signals`
4. `Memory`
5. `Routing`
6. `Weekly`

Day la ten module giao tiep, khong can Latin hoa them.

---

## 4. Naming rules

### 4.1 Display vs implementation

- Dung `Opus Consilium` khi viet docs, spec, roadmap, va khi noi chuyen ve he thong.
- Dung `opus-consilium` khi can slug logic / heading / ten project.
- Chi dung `personal-agent` khi nhac den ten cu trong tai lieu lich su hoac migration note.

### 4.2 Cach viet uu tien

Nen viet:

- `Opus Consilium la bo nao cua Opus Animus`
- `y tuong nay dua vao Opus Consilium truoc`
- `Opus Consilium route sang opus-lucida`

Khong nen viet:

- `personal-agent` nhu ten san pham dai han
- tao them mot layer trung gian moi khong can thiet

---

## 5. Quan he voi opus-lucida

`opus-lucida` la workspace con, khong phai trung tam tiep nhan moi input tho.

Luong uu tien:

```text
User input / prompt / idea
  -> Opus Consilium
    -> review / classify / signal detection
      -> route sang opus-lucida neu lien quan
```

Dieu nay giup tranh viec ep y tuong vao `lucida` qua som, trong khi mot so y tuong co the:

- phuc vu ca he `Opus Animus`;
- tro thanh prompt skill / workflow moi;
- mo ra co hoi monetize;
- chi nen nam o wiki trung tam.

---

## 6. Review objectives cua Opus Consilium

Moi review dinh ky nen tra loi it nhat 4 cau hoi:

1. User dang prompt va lam viec voi AI tot den dau?
2. Knowledge / wiki dang giu va tai su dung insight tot den dau?
3. Co y tuong nao co the monetize hoac phuc vu cho `Opus Animus` khong?
4. Co insight nao can route sang `opus-lucida` hay workspace khac khong?

---

## 7. Migration policy

Giai doan hien tai:

- chot naming xong va da rename folder that;
- update docs va vocabulary dan dan;
- tiep tuc xoa bot ten cu khi co dip cham tai lieu lien quan.

Quy tac thuc thi:

- docs moi nen uu tien goi `Opus Consilium`;
- neu can chi ro ky thuat, viet `Opus Consilium (folder: opus-consilium/)`.

---

## 8. Chot quyet dinh

- Ten he thong: `Opus Consilium`
- Slug he thong: `opus-consilium`
- Khong tao folder moi luc nay
- Folder chinh: `opus-consilium/`
