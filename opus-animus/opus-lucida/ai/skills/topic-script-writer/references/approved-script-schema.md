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
