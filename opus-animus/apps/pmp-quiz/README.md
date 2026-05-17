# 📊 PMP Quiz App - Ôn tập Chứng chỉ Quản lý Dự án

Ứng dụng web app siêu nhẹ để ôn tập cho kỳ thi **PMP (Project Management Professional)** - Chứng chỉ Quản lý Dự án quốc tế được công nhận bởi PMI (Project Management Institute).

## 🎯 Tính năng

✅ **12 câu hỏi** theo chuẩn PMBOK v6  
✅ **5 lĩnh vực** chính của quản lý dự án:

- Initiation (Khởi Tạo)
- Planning (Lập Kế Hoạch)
- Execution (Thực Hiện)
- Monitoring & Controlling (Giám Sát & Kiểm Soát)
- Closing (Đóng)

✅ **Giải thích chi tiết** cho mỗi câu hỏi  
✅ **Theo dõi tiến độ** với thanh progress  
✅ **Tính điểm tự động** với phân tích chi tiết  
✅ **Giao diện đẹp** và dễ sử dụng  
✅ **0 dependencies** - Chỉ HTML + CSS + JavaScript

## 🚀 Cách sử dụng

### Cách 1: Mở trực tiếp (Nhanh nhất)

```
Double-click → index.html
```

### Cách 2: Chạy qua HTTP Server

```bash
cd "PMP-Quiz-App"
python -m http.server 8000
# Mở: http://localhost:8000
```

## 📚 Nội dung Quiz

### Các câu hỏi bao gồm:

| #   | Chủ đề        | Câu hỏi                           | Mức độ     |
| --- | ------------- | --------------------------------- | ---------- |
| 1   | Initiation    | Project Charter là gì?            | Cơ bản     |
| 2   | Planning      | Scope Statement được tạo khi nào? | Cơ bản     |
| 3   | Execution     | Direct and Manage Project Work    | Cơ bản     |
| 4   | Monitoring    | Xử lý dự án chậm                  | Trung bình |
| 5   | Closing       | Các hoạt động Closing             | Cơ bản     |
| 6   | Scope         | Scope Creep là gì?                | Trung bình |
| 7   | Schedule      | Critical Path                     | Cơ bản     |
| 8   | Cost          | CPI (Cost Performance Index)      | Trung bình |
| 9   | Quality       | QA vs QC                          | Trung bình |
| 10  | Risk          | Chiến lược Mitigate               | Cơ bản     |
| 11  | Communication | Channels of Communication         | Cao        |
| 12  | Stakeholder   | Interest/Influence Matrix         | Trung bình |

## 📊 Cách hoạt động

### 1️⃣ Bắt đầu Quiz

- Click "Bắt đầu Quiz"
- Xem thông tin về bài quiz (12 câu, không giới hạn thời gian)

### 2️⃣ Trả lời Câu hỏi

- Đọc câu hỏi cẩn thận
- Chọn một trong 4 đáp án
- Click "Trả lời" để kiểm tra

### 3️⃣ Xem Kết quả

- Đáp án đúng bật sáng xanh ✅
- Đáp án sai bật sáng đỏ ❌
- Xem giải thích chi tiết về câu hỏi

### 4️⃣ Xem Điểm Cuối cùng

- Tỷ lệ đúng (%)
- Số câu đúng/sai
- Phản hồi cá nhân hóa
- Chi tiết từng câu

## 🎓 Kiến thức PMP cần biết

### PMBOK (Project Management Body of Knowledge) 5 Quá trình chính:

**1. Initiation (Khởi Tạo)**

- Phê chuẩn dự án
- Tạo Project Charter
- Xác định Stakeholder

**2. Planning (Lập Kế Hoạch)**

- Scope Planning
- Schedule Planning
- Cost Planning
- Quality Planning
- Risk Planning
- Communication Planning

**3. Execution (Thực Hiện)**

- Direct and Manage Project Work
- Acquire Project Team
- Develop Project Team
- Manage Communications
- Manage Stakeholder Engagement

**4. Monitoring & Controlling (Giám Sát & Kiểm Soát)**

- Monitor and Control Project Work
- Validate Scope
- Control Schedule
- Control Costs
- Control Quality
- Monitor and Control Risks

**5. Closing (Đóng)**

- Close Project or Phase
- Close Procurements
- Lưu bài học (Lesson Learned)

## 📈 Diễn giải Điểm Số

| Tỷ lệ   | Đánh giá       | Ghi chú             |
| ------- | -------------- | ------------------- |
| 80-100% | 🎉 Xuất sắc    | Sẵn sàng cho kỳ thi |
| 70-79%  | 👍 Tốt         | Tiếp tục ôn tập     |
| 60-69%  | 📚 Khá         | Cần ôn tập thêm     |
| < 60%   | 💪 Cần cố gắng | Ôn tập kỹ hơn       |

## 🔧 Muốn thêm câu hỏi?

Edit file `index.html` và thêm object vào mảng `quizData`:

```javascript
{
    id: 13,
    category: "Category Name",
    question: "Nội dung câu hỏi?",
    options: [
        { text: "A) Đáp án A", correct: false },
        { text: "B) Đáp án B (Đúng)", correct: true },
        { text: "C) Đáp án C", correct: false },
        { text: "D) Đáp án D", correct: false }
    ],
    explanation: "Giải thích chi tiết về câu hỏi này..."
}
```

## 💡 Tips Ôn Tập

1. **Làm lại nhiều lần** - Mỗi lần làm để luyện thêm
2. **Chú ý giải thích** - Hiểu tại sao đáp án đó đúng
3. **Ghi chú** - Viết những phần chưa hiểu
4. **Ôn tập từng lĩnh vực** - Tập trung vào phần yếu
5. **Giả lập điều kiện thi** - Làm quiz trong thời gian nhất định

## 🌐 Deploy (Đưa lên Internet)

### GitHub Pages (Miễn phí)

1. Tạo repo `pmp-quiz`
2. Upload `index.html` và `README.md`
3. Settings → Pages → Deploy from main branch
4. App sẽ live tại: `https://username.github.io/pmp-quiz`

### Vercel (Miễn phí, nhanh)

1. Drag & drop folder vào vercel.com
2. Instant deployment ✨

## 📞 Tài liệu tham khảo

- [PMI Official Site](https://www.pmi.org/)
- [PMBOK Guide](https://www.pmi.org/pmbok-guide-standards/foundational/pmbok)
- [PMP Certification](https://www.pmi.org/certification/project-management-professional-pmp)

## 🎯 Mục tiêu

Giúp bạn:

- ✅ Nắm vững kiến thức PMBOK
- ✅ Làm quen với dạng câu hỏi thi PMP
- ✅ Chuẩn bị tốt cho kỳ thi
- ✅ Đạt chứng chỉ PMP thành công

---

**Chúc bạn ôn tập hiệu quả và đạt chứng chỉ PMP!** 🚀
