# ApprovedScript JSON Contract

Artifact path: `apps/lucida-remotion-demo/input/scripts/<topic-slug>/approved-script.json`

Based on the sentence-addressable input contract in
`apps/lucida-remotion-demo/design/history/workflow/CREATE_FLOW_v1.02_CAPTION_SYNC_EXTENSION.md`
and the brand contract in `docs/market-research/11-pipeline-contract.md`.

```json
{
  "schemaVersion": "1.0",
  "scriptId": "script-<topic-slug>-001",
  "revision": 1,
  "status": "draft | approved",
  "language": "vi",

  "topic": {
    "slug": "<topic-slug>",
    "title": "...",
    "series": "lucida-now | lucida-work | lucida-lab | lucida-check",
    "targetDurationSec": 90,
    "wordCountAssumption": "≈ N từ tiếng Việt / giây đọc"
  },

  "brandRef": {
    "id": "lucida-ai-v1",
    "contract": "docs/market-research/11-pipeline-contract.md"
  },

  "content": {
    "voiceoverText": "toàn bộ script, đúng thứ tự sentences"
  },

  "visualMechanism": {
    "environment": "không gian hình ảnh DUY NHẤT của video (vd: một cửa sổ email tiếng Nhật)",
    "transformation": "cái gì biến đổi từ đầu đến cuối (vd: email chưa đạt lễ → email gửi được)",
    "beats": [
      {
        "segmentId": "seg-001",
        "stateChange": "thay đổi trạng thái hình ảnh khi đoạn này được đọc (vd: đồng hồ 29:58 chạy, con trỏ xóa-viết lại câu keigo)"
      }
    ],
    "payoff": "khoảnh khắc hình ảnh mạnh nhất (vd: timer morph 30:00 → 05:00, email chuyển sang trạng thái sent)"
  },

  "sentences": [
    {
      "sentenceId": "sent-001",
      "segmentId": "seg-001",
      "order": 1,
      "text": "...",
      "narrativeFunction": "signal | proof | meaning | action",
      "locked": true
    }
  ],

  "claimsNeedingEvidence": [
    {
      "claimId": "claim-001",
      "sentenceIds": ["sent-003"],
      "claim": "...",
      "suggestedSourceType": "url | repo | paper | official-doc"
    }
  ],

  "editorialConstraints": {
    "allowedRewriteLevel": "none"
  },

  "approval": {
    "approvedBy": "user",
    "approvedAt": "ISO-8601",
    "contentFrozen": true
  },

  "provenance": {
    "researchDocsUsed": ["docs/market-research/08-editorial-voice.md", "..."],
    "contentHash": "sha256:<hash của voiceoverText>"
  }
}
```

## Invariants

- `sentenceId` unique, stable, never reused across revisions.
- Sentence order khớp `voiceoverText` từng ký tự (sau khi join bằng khoảng trắng).
- `status: "approved"` chỉ được set sau khi user duyệt trong chat.
- Mọi sửa text sau approve → tăng `revision`, sinh file mới, downstream artifacts invalid.
- `segmentId` nhóm các câu cùng một ý/đoạn — dùng cho beat mapping sau này (Slice 3), gán ngay từ đầu để không phải re-key.

## visualMechanism (M6, RD: `docs/RD-visual-mechanism.md` FR1)

- Khối BẮT BUỘC. Nếu video chủ đích làm dạng slide (không có mechanism), ghi `"visualMechanism": { "none": true, "reason": "..." }` — không được im lặng bỏ qua.
- Khi mechanism ≠ none: mỗi `segmentId` xuất hiện trong `sentences` phải có ĐÚNG 1 beat trong `beats[]`.
- Mechanism phải gắn với chủ đề — "card + typography lớn" không được tính là mechanism (đó là mode slides).
- `environment` là một không gian duy nhất tồn tại xuyên video; `stateChange` mô tả biến đổi trong không gian đó, không phải mô tả slide mới.
- User duyệt mechanism CÙNG LÚC duyệt script tại gate 1.
