# Useful GitHub Links

Danh mục các GitHub repository hữu dụng đã được đánh giá hoặc đáng theo dõi.

## AI UI / Design Skills

### Taste Skill

- Repository: https://github.com/Leonxlnx/taste-skill
- Loại: Portable Agent Skill / UI design guidance
- Dùng cho: Claude Code, Cursor, Codex, Gemini CLI, v0, Lovable và các coding agent
- Giá trị chính: Đóng gói nguyên tắc thẩm mỹ, typography, whitespace, layout và motion thành `SKILL.md`
- Khuyến nghị: Tham khảo để xây Design Skill Library cho AI Harness
- Trạng thái: Đã đánh giá

### Hallmark

- Repository: https://github.com/nutlope/hallmark
- Loại: Anti-AI-slop design skill / UI workflow cho coding agent
- Dùng cho: Build, audit, redesign và study giao diện với Claude Code, Cursor, Codex và các coding agent
- Giá trị chính: Kết hợp macrostructure, anti-pattern gates và vòng lặp self-critique để giảm giao diện rập khuôn do AI sinh ra
- Khuyến nghị: Dùng làm mẫu tham khảo cho kiến trúc `Skill → Verb → Review → Refine` trong AI Harness; có thể chuyển hóa sang Video Skill, Diagram Skill và Presentation Skill
- Trạng thái: Đã đánh giá

## AI Video / HTML Motion

### html-video

- Repository: https://github.com/nexu-io/html-video
- Loại: Agent-native HTML-to-video workflow
- Core renderer: Hyperframes
- Dùng cho: Sinh HTML/CSS/JavaScript animation rồi render thành video
- Khuyến nghị: Đưa vào dự án AI Video; dùng cùng Remotion cho timeline, audio và subtitle
- Trạng thái: Đã đánh giá

### claude-video

- Repository: https://github.com/bradautomates/claude-video
- Loại: Video-to-context skill / Video QA cho Claude Code
- Dùng cho: Tách frame, transcript và timestamp để Claude phân tích hoặc review video
- Giá trị chính: Tạo vòng lặp `Render → Watch → Critique → Fix → Render lại`
- Khuyến nghị: Đưa vào lớp Review/QA của AI Video Harness, không xếp vào renderer
- Trạng thái: Đã đánh giá

## Quy ước cập nhật

Mỗi repository mới nên có các trường:

- Repository
- Loại
- Dùng cho
- Giá trị chính
- Khuyến nghị
- Trạng thái: Chưa đánh giá / Đang thử nghiệm / Đã đánh giá / Đã tích hợp
