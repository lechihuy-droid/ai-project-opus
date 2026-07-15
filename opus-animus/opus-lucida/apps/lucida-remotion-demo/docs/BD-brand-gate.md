# BD — Brand Gate + Visual Evidence (M4)

- **Status:** approved-for-build 2026-07-14 (theo goal user: chạy tất cả phase đến M5)
- **Date:** 2026-07-14
- **Scope:** milestone M4 của FLOW_V1 — enforce brand contract trong pipeline + hợp nhất pipeline collectors làm nguồn visual evidence
- **Role:** build plan (SDD)
- **Owner layer:** workflow SOP
- **Parent:** `design/workflow/FLOW_V1.md` (S3, S5), `docs/market-research/11-pipeline-contract.md`, `docs/market-research/12-quality-gates.md`
- **Supersedes:** (none)
- **Superseded by:** (none)

## Mục tiêu

1. `video-map.json` mang brand block; validate fail sớm khi vi phạm locked brand fields.
2. Phần machine-checkable của 8 quality gates (doc 12) chạy tự động; phần cần mắt người vào checklist của skill QA.
3. `pipeline/` collectors trở thành nguồn **visual evidence** cho flow chính, không còn là đường sinh video-map song song.

## Phase B1 — Brand block trong video-map (Codex)

- `schemas/video-map.schema.json`: thêm optional `brand`:

```json
"brand": {
  "type": "object",
  "required": ["id", "series"],
  "properties": {
    "id": { "const": "lucida-ai-v1" },
    "series": { "enum": ["lucida-now", "lucida-work", "lucida-lab", "lucida-check"] },
    "contractRef": { "type": "string" }
  }
}
```

- Verify: video-map cũ (không brand) vẫn pass validate; brand sai series fail.

## Phase B2 — Brand validator (Codex)

- Tạo `scripts/validate-brand.mjs` + npm `validate:brand -- --input <video-map>`; tự chạy trong `validate:videomap` khi video-map có `brand`.
- Check deterministic (từ contract 11 + gates 12, phần máy check được):
  1. `theme.background` thuộc nhóm dark (luminance check hex) — dark editorial base.
  2. Không scene nào dùng template có progress bar (`progress_bar: false` là locked field) — check theo danh sách templateId cấm trong config.
  3. Nếu có `timedCaptions`: phrase ≤ 12 từ, active word scale trong code ≤ 1.04 (đọc hằng số export từ SubtitleBar), max 2 lines.
  4. `video.language` = "vi"; series hợp lệ.
  5. Scene `intent` phủ đủ narrative functions theo series (NOW cần why-now/proof/implication ⇒ map: hook/problem + proof/data + takeaway) — chỉ WARN, không fail (đánh giá ngữ nghĩa thuộc QA người/agent).
- Output: `brand-check.json` `{score (0–1 = % checks pass), violations[], warnings[]}`. Ngưỡng theo contract: ≥ 0.85 pass; 0.70–0.84 exit 0 kèm cảnh báo "normalize and revalidate"; < 0.70 exit ≠ 0.
- Config check: `pipeline/config/brand-check.json` (locked palette hexes, banned templateIds, thresholds) — không hardcode trong script.
- Verify: fixture video-map vi phạm (nền sáng / series sai) fail đúng; video-map hiện tại (`video-map.json` root) chạy ra score + report.

## Phase B3 — Visual evidence bridge (Codex, nhỏ)

- `scripts/collect-visual-inputs.mjs` giữ nguyên. Thêm `scripts/export-visual-evidence.mjs` + npm `evidence:export -- --run <pipeline-run-dir> --out <dir>`: lấy `03-normalized-input.json` → xuất `visual-evidence.json` (format gọn: blocks có id/type/content/source) để skill `source-ingestor-cleaner` nhét vào clean-brief như nguồn `content_truth`/`embed_asset`.
- KHÔNG xoá `run-visual-flow.mjs` (vẫn dùng standalone cho terminal video), chỉ thêm cầu nối.
- Verify: chạy trên `pipeline/runs/collector-fixture-test/` ra visual-evidence.json hợp lệ.

## Phase B4 — Skill/doc updates (Claude, không phải Codex)

- `remotion-visual-qa/SKILL.md`: thêm brand QA checklist = gates 3/4/5 (recognition, visual consistency, motion meaning — cần mắt) + scorecard + non-negotiable failures từ doc 12; yêu cầu đọc `brand-check.json` trước khi review.
- `source-ingestor-cleaner/SKILL.md`: thêm input type `visual-evidence.json` từ `evidence:export`.
- `script-template-mapper/SKILL.md`: yêu cầu điền `brand` block (id cố định + series từ approved-script).
- FLOW_V1.md: đánh dấu M4 done.

## Files được phép sửa/tạo (Codex)

```text
tạo:  scripts/validate-brand.mjs, scripts/export-visual-evidence.mjs,
      pipeline/config/brand-check.json, pipeline/fixtures/brand/*
sửa:  schemas/video-map.schema.json, package.json (scripts),
      scripts/validate-video-map.mjs (gọi brand check khi có brand block)
CẤM:  src/** (trừ khi cần export hằng số scale từ SubtitleBar — chỉ export const, không đổi logic),
      design/**, docs/market-research/**
```

## Kết quả build (append sau khi xong)

- 2026-07-14: Hoàn thành Phase B1–B3. Schema enforce brand `lucida-ai-v1` và series enum; brand validator đọc config, chấm điểm/ghi lỗi/cảnh báo và được gọi tự động sau schema validation; visual evidence bridge giữ nguyên provenance từ normalized events.
- Đã thêm fixtures pass/fail 2 scene và npm scripts `validate:brand`, `evidence:export`.
- Verify pass: `node --check` cho ba script liên quan; brand fixture pass exit 0 (score 1.00); brand fixture fail exit 1 (score 0.50); root `validate:videomap`; export 8 evidence blocks hợp lệ; `npm run lint`.
- Claude re-verify độc lập (2026-07-14): exit codes đúng (pass=0/fail=1), violations báo đúng lỗi (nền sáng + series sai), WARN intent coverage hoạt động, evidence blocks giữ provenance. Phase B4 (skill updates) hoàn thành cùng ngày: remotion-visual-qa (brand QA checklist gates 3/4/5 + scorecard), script-template-mapper (brand block bắt buộc), source-ingestor-cleaner (visual-evidence input).
