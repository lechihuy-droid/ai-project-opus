# Lucida Brand System

Tài liệu này định nghĩa brand cho toàn bộ pipeline tạo video của Lucida.

Brand không phải một style được chọn lại cho từng video. Brand là lớp guardrail cố định kiểm soát cách Lucida nói, nhìn, chuyển động và kết thúc câu chuyện. Style RAG chỉ được phép tạo biến thể nằm bên trong hệ thống này.

## Brand architecture

```text
Business Input ─┐
Style RAG ──────┼── Lucida Brand Guardrails ──> Render
Renderer ───────┘
```

Brand kiểm soát xuyên suốt:

- topic framing và narrative voice;
- palette, typography, layout và visual motif;
- subtitle, motion, camera và sonic cues;
- series label, logo placement và CTA;
- quality gates trước khi render.

## Tài liệu

- `01-brand-strategy.md`: định vị, lời hứa và brand personality.
- `02-visual-identity.md`: visual language và design tokens.
- `03-editorial-voice.md`: cách viết hook, script và CTA.
- `04-motion-subtitle-sonic.md`: motion grammar, subtitle và âm thanh.
- `05-series-architecture.md`: hệ thống series cho các content pillar.
- `06-pipeline-contract.md`: contract để Create Flow sử dụng.
- `07-quality-gates.md`: checklist kiểm tra nhận diện thương hiệu.
- `examples/japan-10m-robots.md`: ví dụ áp dụng brand vào một topic.

## Nguyên tắc cốt lõi

> Lucida lọc tín hiệu, làm rõ tác động và chỉ ra bước tiếp theo.

Mọi video phải tạo được ba cảm giác:

1. Tôi vừa biết một điều đáng chú ý.
2. Tôi hiểu tại sao nó liên quan đến mình.
3. Tôi biết nên làm gì tiếp theo.
