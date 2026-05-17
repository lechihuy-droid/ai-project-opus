# ⚡ QUICK START - PMP Quiz App

## 🚀 Bắt đầu ngay trong 30 giây

### 1️⃣ Mở ứng dụng

```
Double-click → index.html
```

### 2️⃣ Bắt đầu Quiz

- Click "Bắt đầu Quiz"
- Chọn đáp án (A, B, C, D)
- Click "Trả lời" để kiểm tra

### 3️⃣ Xem Kết Quả

- Đáp án đúng: ✅ Xanh
- Đáp án sai: ❌ Đỏ
- Giải thích chi tiết

---

## 📝 Câu Hỏi Gồm

| Chủ đề        | Số câu |
| ------------- | ------ |
| Initiation    | 1      |
| Planning      | 1      |
| Execution     | 1      |
| Monitoring    | 1      |
| Closing       | 1      |
| Scope         | 1      |
| Schedule      | 1      |
| Cost          | 1      |
| Quality       | 1      |
| Risk          | 1      |
| Communication | 1      |
| Stakeholder   | 1      |

**Total: 12 câu hỏi**

---

## 🎯 Từng Bước Chi Tiết

### Bước 1: Chọn Đáp Án

```
Nhấp vào một trong 4 lựa chọn
A) Option 1
B) Option 2
C) Option 3
D) Option 4
```

### Bước 2: Trả Lời

```
Click nút "Trả lời"
↓
Xem kết quả (Đúng/Sai)
↓
Đọc giải thích
```

### Bước 3: Tiếp Tục

```
Click "Câu tiếp theo"
↓
Lặp lại bước 1-2
```

### Bước 4: Xem Kết Quả Cuối

```
Hoàn thành tất cả 12 câu
↓
Xem điểm, phân tích chi tiết
↓
Click "Làm lại Quiz" để ôn tập lại
```

---

## 📊 Diễn Giải Điểm

**Câu này đúng không?**

```
✅ Đúng = Đáp án chính xác
❌ Sai = Chọn sai đáp án
```

**Điểm số cuối:**

- **80-100%**: 🎉 Xuất sắc - Sẵn sàng thi
- **70-79%**: 👍 Tốt - Tiếp tục ôn
- **60-69%**: 📚 Khá - Cần ôn thêm
- **< 60%**: 💪 Cố gắng - Ôn kỹ hơn

---

## 💻 Chạy qua HTTP Server

```bash
cd "PMP-Quiz-App"
python -m http.server 8000
```

Rồi mở: **http://localhost:8000**

---

## 🔧 Chỉnh Sửa Đơn Giản

### Thêm câu hỏi mới

Tìm `quizData = [...]` và thêm:

```javascript
{
    id: 13,
    category: "Category",
    question: "Nội dung câu?",
    options: [
        { text: "A) Đáp án A", correct: false },
        { text: "B) Đáp án B ✓", correct: true },
        { text: "C) Đáp án C", correct: false },
        { text: "D) Đáp án D", correct: false }
    ],
    explanation: "Giải thích..."
}
```

### Thay đổi tiêu đề

Tìm và sửa: `<title>PMP Quiz...</title>`

---

## 🎯 Tips Học Tập

1. **Làm lại nhiều lần** - Cố gắng đạt 80%+
2. **Đọc kỹ giải thích** - Hiểu không chỉ là nhớ
3. **Ghi chú khó** - Viết lại những phần chưa hiểu
4. **Review từng lĩnh vực** - Tập trung vào yếu điểm

---

## 📞 FAQ

**Q: Mất câu trả lời khi refresh?**
A: Có, dữ liệu không lưu. Bạn có thể thêm localStorage nếu cần.

**Q: Có thể chỉnh sửa câu hỏi không?**
A: Có! Sửa trực tiếp trong `index.html` trong mảng `quizData`

**Q: Thêm hình ảnh được không?**
A: Được, thêm `<img>` tag trong phần question hoặc options.

**Q: Deploy lên web miễn phí được không?**
A: Có - GitHub Pages, Vercel, hay Netlify (đều miễn phí)

---

## 🚀 Deploy Nhanh

### GitHub Pages

```bash
# 1. Tạo repo "pmp-quiz"
# 2. Upload index.html
# 3. Settings → Pages → Deploy
# 4. Done! ✨
```

### Vercel

```
Drag & drop folder vào vercel.com
```

---

**Happy learning!** 📚
