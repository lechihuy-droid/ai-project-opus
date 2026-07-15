# RD — Visual Mechanism Kit (M6)

- **Status:** approved 2026-07-14 — BD: `docs/BD-visual-mechanism.md`
- **Date:** 2026-07-14
- **Scope:** milestone M6 của FLOW_V1 — mỗi video có cơ chế hình ảnh riêng theo chủ đề, thay cảm giác "thay text vào template"; kèm semantic QA + hierarchy rules
- **Role:** requirements doc (SDD)
- **Owner layer:** workflow SOP
- **Parent:** `design/workflow/FLOW_V1.md` (S0, S3, S4, S5) · `docs/review-v1-improvement-report.md` (nguồn yêu cầu)
- **Supersedes:** (none)
- **Superseded by:** (none)

File này trả lời: **để video tiếp theo không còn là "cùng template, thay text", hệ thống phải làm được gì — và cái gì chưa cần làm?**

Nguồn gốc: đánh giá gate 3 của user 2026-07-14 (điểm độc đáo 3/10) + root cause analysis RC1–RC4 trong `review-v1-improvement-report.md`.

---

## 1. Quyết định đã chốt (user, 2026-07-14)

| Quyết định | Giá trị | Lý do |
|---|---|---|
| Scope kit | **Mechanism kit tổng quát 4 khối tái dùng**, không build riêng cho email | Topic sau lắp lại được, tránh build mới mỗi video |
| 4 khối | **Window** (email/chat/doc) · **Context Chip** · **Timer/Counter Morph** · **Diff-Highlight** | Đủ cho continuous narrative của email-keigo và các topic AI-workflow tương tự |
| Acceptance case | **Dựng lại email-keigo** — script + voice 58s giữ nguyên, chỉ thay visual | Nội dung đã duyệt; đo được đúng phần thay đổi |
| Email-keigo v1 | KHÔNG publish; không chạy v1.1 quick fix riêng | Đợi v2 làm chuẩn luôn |
| Kiến trúc LLM | Giữ locked decision repo: **LLM output typed JSON only, renderer owns HTML/CSS** | Mechanism = component có props, không phải HTML tự do |

## 2. Usage — flow thay đổi thế nào

```text
S0 (topic-script-writer):
   Ngoài script, skill PHẢI đề xuất visualMechanism:
   "video này diễn ra trong không gian nào, cái gì biến đổi, payoff hình ảnh là gì"
   → user duyệt script + mechanism CÙNG MỘT LẦN (gate 1 không tăng số lần duyệt)

S3 (mapping):
   video-map không còn là 6 slide rời. Nó mô tả:
   1 environment (vd. cửa sổ email) + chuỗi state transitions theo segment
   (chip bay vào prompt, text diff sáng lên, timer morph 30:00 → 05:00)
   Headline tuân hierarchy rule: ngắn, không lặp nguyên văn voice-over.

S4 (render):
   Remotion render environment liên tục; các khối kit là component có props JSON.
   Nhãn kỹ thuật (kicker "01 / HOOK") chỉ hiện ở chế độ debug, không có trong bản final.

S5 (QA):
   Thêm lớp semantic QA chạy TRƯỚC gate 3:
   đếm claim vs item, độ trùng headline–subtitle, scene tĩnh quá dài, chữ quá nhỏ.
```

> Ví von: template registry cũ là **hộp LEGO nền** (vẫn giữ, vẫn dùng được cho video dạng slide). Kit mới là **bộ mô hình chuyên dụng** — cũng là LEGO, nhưng lắp thành đúng bối cảnh của chủ đề.

## 3. Functional requirements

### Nhóm A — Mechanism vào flow (sửa RC1)

- **FR1 — `visualMechanism` trong ApprovedScript.** Schema thêm khối bắt buộc: `environment` (không gian duy nhất của video), `transformation` (cái gì biến đổi từ đầu đến cuối), `beats[]` (map mỗi `segmentId` → thay đổi trạng thái hình ảnh), `payoff` (khoảnh khắc hình ảnh mạnh nhất). Skill `topic-script-writer` phải đề xuất mechanism riêng theo topic; nếu topic không cần mechanism (video dạng slide chủ đích), phải ghi `mechanism: none` + lý do — không được im lặng bỏ qua.
- **FR2 — Mechanism kit 4 component Remotion**, props là typed JSON, style theo brand token:
  1. **Window** — khung cửa sổ app (variant: email / chat / document), có vùng text nhiều dòng (hỗ trợ tiếng Nhật + tiếng Việt), con trỏ soạn thảo, trạng thái draft/sent.
  2. **Context Chip** — chip thông tin (nhãn + giá trị) có animation bay/kéo vào một target (vd. vào prompt), dùng cho "đưa ngữ cảnh vào AI".
  3. **Timer/Counter Morph** — con số/đồng hồ morph giữa hai giá trị (30:00 → 05:00), dùng cho payoff định lượng.
  4. **Diff-Highlight** — hiển thị text trước/sau với các cụm khác biệt được highlight + chú thích (vd. cụm kính ngữ), dùng cho bằng chứng thay lời khẳng định.
- **FR3 — Continuous scene architecture.** video-map hỗ trợ mode `continuous`: 1 environment tồn tại xuyên video, scene = state transition (thêm/bớt/biến đổi phần tử trong environment) thay vì thay slide. Mode `slides` cũ giữ nguyên, hai mode không phá nhau (backward compatible — video-map cũ vẫn render được).

### Nhóm B — Hierarchy + art direction (sửa RC3, RC4)

- **FR4 — Hierarchy rules trong mapping.** Ghi thành rule máy-đọc-được cho S3: headline ≤ 6 từ và không lặp nguyên văn câu voice-over; subtitle là kênh DUY NHẤT lặp lời thoại; typography cỡ hook chỉ dùng 1 lần/video; visual minh họa ý (chip, diff, timer) thay vì viết lại câu nói.
- **FR5 — Kicker debug-only.** Nhãn cấu trúc (`01 / HOOK`…) chỉ render khi flag debug bật; bản final mặc định sạch nhãn.
- **FR6 — Art direction v2 tokens.** Bổ sung palette: graphite (nền), ivory (chất giấy email/tài liệu), champagne gold (accent — giữ tương thích `#D2B47A` hiện có), đỏ son (CHỈ cho lỗi/correction mark, dùng rất hạn chế). Card mang chất "cửa sổ app/tài liệu", không phải card dashboard. Min font-size cho text phụ đọc được trên viewport 375px.

### Nhóm C — Semantic QA (sửa RC2)

- **FR7 — Semantic QA gate** chạy trong S5, TRƯỚC khi trình user gate 3, các check tối thiểu:
  1. **Số đếm nhất quán:** số trong headline/CTA ("ba bước") phải khớp số item render trong scene tương ứng — lệch → FAIL.
  2. **Trùng lặp headline–subtitle:** cùng scene, headline trùng > ~70% từ với subtitle → WARN (kèm gợi ý rút gọn).
  3. **Scene tĩnh quá dài:** scene không có state transition nào > 8s → WARN.
  4. **Chữ quá nhỏ:** font-size dưới min theo FR6 → FAIL.
  5. **Nhãn kỹ thuật lọt bản final:** kicker xuất hiện khi debug=off → FAIL.
- **FR8 — QA report hợp nhất.** Kết quả semantic QA ghi chung vào render report hiện có (cạnh drift/checksum), để gate 3 đọc một chỗ.

## 4. Out of scope (M6 không làm)

- Ảnh/video stock, footage quay thật, 3D, character animation.
- Music/SFX (vẫn thuộc backlog audio).
- LLM tự sinh HTML/CSS hoặc tự do vẽ layout — vi phạm locked decision.
- Retrofit 6 template cũ sang art direction v2 (chỉ video mới dùng kit; template cũ giữ nguyên cho mode `slides`).
- Semantic QA bằng LLM chấm điểm thẩm mỹ — M6 chỉ làm check máy đo được (đếm, so chuỗi, đo px/giây).
- Mechanism khác ngoài 4 khối (vd. bản đồ, biểu đồ dữ liệu) — ghi backlog khi topic cần.

## 5. Acceptance (Definition of Done)

1. Email-keigo v2 render thành công theo mode `continuous`: mở bằng email window có text JP, 3 chip ngữ cảnh bay vào prompt, diff-highlight kính ngữ trước/sau, timer morph 30:00→05:00, CTA ≤ 4s — script + voice 58s không đổi (checksum voice giữ nguyên).
2. Lỗi "ba bước/bốn bước" được sửa trong video-map mới, và semantic QA **chứng minh bắt được lỗi này**: seed lại lỗi cũ → gate FAIL đúng chỗ.
3. Bản final không còn nhãn `01 / HOOK`; bật debug flag thì nhãn hiện lại.
4. Không scene nào tĩnh > 8s; headline không scene nào lặp nguyên văn voice-over; text phụ đọc được ở 375px (kiểm bằng QA frames).
5. Video-map cũ (mode `slides`, vd. run nghiệm thu v1) vẫn render được không sửa gì — chứng minh backward compatible.
6. User duyệt gate 3 lần 2 cho email-keigo v2.

## 6. Open questions (chốt trong BD)

1. **Font tiếng Nhật** trong Window component — chọn font JP có sẵn hệ thống hay bundle (ảnh hưởng kích thước repo + render).
2. **Schema state transition** cho mode `continuous` — mức chi tiết nào đủ (declarative beats vs keyframe list); phải giữ được nguyên tắc typed JSON.
3. **Ngưỡng cụ thể** cho semantic QA: % trùng headline–subtitle, min font-size px, cách đếm "số trong claim" (chữ "ba" vs số "3") — BD chốt kèm test case.
4. **Nội dung email JP mẫu** cho email-keigo v2 (câu trước/sau + cụm kính ngữ highlight) — cần user hoặc skill soạn, vì đây là nội dung học thuật tiếng Nhật, không phải code.
5. Chia phase Codex: đề xuất phase 1 = FR1+FR4+FR5+FR7 (schema/rules/QA, rẻ), phase 2 = FR2+FR3+FR6 (components + architecture, đắt) — BD chốt kèm test plan từng phase.

## 7. Link downward

- Build plan: `docs/BD-visual-mechanism.md` (viết sau khi RD approve; code giao Codex gpt-5.6-sol, fan-out review giao Sonnet subagent).
- Runtime: `src/templateRegistry.tsx`, `src/Composition.tsx`, `schemas/video-map.schema.json`, `ai/skills/topic-script-writer/`, `scripts/validate-brand.mjs`.
- Acceptance case: `input/scripts/ai-email-keigo/` + voice run `public/runs/email-keigo/`.
