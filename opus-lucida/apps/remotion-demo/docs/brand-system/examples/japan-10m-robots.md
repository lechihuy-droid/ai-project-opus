# Brand Application Example — Japan 10M Robots

## Brand mapping

```json
{
  "brand_id": "lucida-ai-v1",
  "series": "lucida-now",
  "story_role": "fomo-to-agency",
  "primary_audience": "vietnamese-professionals-in-japan",
  "semantic_accent": "warning-amber",
  "external_style_variant": "japan-future-of-work-editorial",
  "external_style_influence": 0.2
}
```

## Brand-safe angle

> Theo các báo cáo gần đây, Nhật Bản đang nhắm tới triển khai robot ở quy mô rất lớn trước năm 2040. Điều đáng chú ý với người đang làm việc tại Nhật không chỉ là số lượng robot, mà là tiêu chuẩn năng lực của người lao động sẽ thay đổi như thế nào.

## Narrative functions

### Signal

Headline visual: `10,000,000 ROBOTS?`

- Series label: `LUCIDA / NOW`.
- Lucida Beam reveals `10,000,000`.
- Warning amber question mark communicates partial verification.

### Proof

Visual: source cards and confidence badge.

Copy:

> Con số 10 triệu đang được nhiều báo cáo nhắc lại, nhưng chưa nên nói như một cam kết chính thức đã được xác minh đầy đủ.

- Use Evidence Lock animation.
- Badge: `PARTIALLY VERIFIED`.

### Meaning

Visual: labor shortage → automation → factory / healthcare / logistics.

Copy:

> Bối cảnh đáng tin hơn là Nhật đang thiếu lao động và buộc doanh nghiệp phải tăng năng suất bằng tự động hóa.

- Lucida Beam traces the causal flow.
- Keep one main icon family.

### Personal relevance

Visual: repetitive execution on the left, AI-enabled operator on the right.

Copy:

> Những quy trình lặp lại sẽ thay đổi trước. Giá trị chuyển sang người biết vận hành, kiểm tra và cải tiến hệ thống AI.

- Use Focus Pull on `vận hành`, `kiểm tra`, `cải tiến`.

### Action

Visual: three-step action card.

```text
1. Chọn một việc lặp lại
2. Dùng AI tạo bản nháp
3. Kiểm tra và chuẩn hóa workflow
```

Closing line:

> Không cần cạnh tranh trực tiếp với robot. Hãy trở thành người biết dùng tự động hóa tốt hơn.

End card:

`LUCIDA AI — Hiểu AI sớm. Làm việc đi trước.`

## Subtitle example

Narration:

> Nhật Bản đang được báo cáo là muốn triển khai tới mười triệu robot trước năm 2040.

Chunks:

```json
[
  {
    "text": "Nhật Bản đang được báo cáo",
    "mode": "sentence-first-word-highlight"
  },
  {
    "text": "muốn triển khai tới 10 triệu robot",
    "mode": "sentence-first-word-highlight"
  },
  {
    "text": "trước năm 2040",
    "mode": "sentence-first-word-highlight"
  }
]
```

Mỗi chunk xuất hiện trọn phrase, sau đó active word đổi sang signal cyan theo word timing. Không pop từng chữ độc lập.

## Visual restrictions

- Không dùng hình robot humanoid như fact nếu nguồn chỉ nói robot nói chung.
- Không biến `18 sectors` hoặc `Noetra` thành headline khi chưa có primary source.
- Không dùng cờ Nhật, neon Tokyo và robot cyberpunk như visual chính; chúng dễ làm topic thành entertainment cliché.
- Không kết thúc ở thông điệp “robot sẽ lấy việc”. Phải chuyển sang agency và skill preparation.

## Brand QA targets

- Recognition: series label + Beam + core palette trong 3 giây đầu.
- Evidence integrity: partial verification visible.
- Utility: ít nhất một action thực tế.
- Subtitle: sentence-first, word-highlight.
- End emotion: informed urgency, not panic.
