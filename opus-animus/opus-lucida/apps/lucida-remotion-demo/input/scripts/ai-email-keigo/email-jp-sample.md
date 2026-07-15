# Email JP mẫu cho cảnh Trước/Sau — email-keigo v2

- **Status:** DRAFT — chờ user review nội dung tiếng Nhật
- **Dùng cho:** Phase D (`docs/BD-visual-mechanism.md`) — props của `DiffHighlight` + `MechanismWindow`
- **Ngữ cảnh (khớp 3 chip):** người nhận = khách hàng lâu năm · mục đích = xin lỗi vì giao hàng trễ · đầu ra = 2 phiên bản (trang trọng / mềm hơn)

## TRƯỚC (bản nháp chưa đạt lễ — hiện ở cảnh mở đầu + panel "trước")

```text
すみません、納期が遅れます。
来週になります。
```

Vấn đề (chú thích đỏ son trên video): đúng ngữ pháp, sai mức lễ — quá thân mật với khách hàng.

## SAU — Phiên bản 1: trang trọng (AI trả về, panel "sau")

```text
いつもお世話になっております。

この度は納期の遅延につきまして、ご連絡申し上げます。
誠に申し訳ございませんが、製品の納期を7月20日に
変更させていただきたく存じます。

ご迷惑をおかけし、深くお詫び申し上げます。
何卒ご理解のほど、よろしくお願い申し上げます。
```

### Cụm highlight (champagne gold) + chú thích

| Cụm | Chú thích trên video |
|---|---|
| `誠に申し訳ございませんが` | Cách xin lỗi trang trọng (thay すみません) |
| `変更させていただきたく存じます` | Xin phép thay đổi — khiêm nhường ngữ |
| `深くお詫び申し上げます` | Nhận trách nhiệm đúng mức |
| `何卒ご理解のほど` | Xin thông cảm — khép thư đúng lễ |

## SAU — Phiên bản 2: mềm hơn, vẫn lịch sự (cảnh "2 phiên bản")

```text
いつもお世話になっております。

申し訳ありませんが、納期が遅れており、
7月20日のお届けとなりそうです。

ご迷惑をおかけしますが、
よろしくお願いいたします。
```

## Chi tiết "bước kiểm tra cuối" (cảnh con trỏ sửa — cụm đỏ son)

- Tên người nhận: `〇〇様` → điền tên thật
- Ngày giao: `7月20日` — con số phải tự kiểm tra
- Mức kính ngữ: chọn bản 1 hay bản 2 theo quan hệ

---

*User review: sửa trực tiếp text JP trong file này; sau khi chốt, nội dung được chuyển thành props typed cho video-map v2 (không copy tự do vào code).*
