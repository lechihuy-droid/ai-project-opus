# BD — Orchestration + Publish Handoff (M5)

- **Status:** approved-for-build 2026-07-14 (theo goal user: chạy tất cả phase đến M5)
- **Date:** 2026-07-14
- **Scope:** milestone M5 của FLOW_V1 — nối chuỗi S2→S5 thành một lệnh, n8n làm trigger/scheduler, publish handoff (S6)
- **Role:** build plan (SDD)
- **Owner layer:** workflow SOP
- **Parent:** `design/workflow/FLOW_V1.md` (S6), `docs/BD-audio-pipeline.md`, `docs/BD-brand-gate.md`
- **Supersedes:** (none)
- **Superseded by:** (none)

## Ràng buộc kiến trúc (đã xác minh)

- n8n chạy Docker Linux (`n8n/docker-compose.yml`, mount `..:/workspace/lucida-remotion-demo`) — **không chạy được VieNeu (uv/Windows), WhisperX venv, hay Chrome render của Remotion trong container**.
- ⇒ Mô hình: **host runner thực thi, n8n chỉ trigger + theo dõi + notify** qua HTTP về host (`host.docker.internal`).
- Publish thật (upload YouTube/TikTok) KHÔNG tự động — chỉ chuẩn bị bundle; user tự upload (gate S6 của FLOW_V1).

## Phase O1 — Host flow orchestrator (Codex)

- `scripts/run-flow.mjs` + npm `flow:run -- --script <approved-script.json> --video-map <video-map.json> [--run-id <id>] [--skip-voice]`:
  - chain: `voice:generate` → `voice:align` → `map:apply-timing` → build `src/data.ts` từ video-map (dùng cơ chế hiện có của builder) → `validate:videomap` (gồm brand check nếu có) → render → `publish:handoff`.
  - stop-on-fail, mỗi stage ghi trạng thái vào `output/render/flow-runs/<runId>/flow-report.json` (stage, status, startedAt, elapsed, error).
  - `--skip-voice`: tái dùng voice/timed-script có sẵn của run trước (đổi visual không cần TTS lại).
- Verify: chạy với fixture Phase 1+2 end-to-end; flow-report đủ stage; fail giữa chừng → các stage sau ghi `skipped`.

## Phase O2 — Publish handoff (Codex)

- `scripts/publish-handoff.mjs` + npm `publish:handoff -- --run-id <id>`:
  - copy mp4 final → `output/publish/<runId>/video.mp4`;
  - thumbnail: ffmpeg extract frame hook (mặc định giây 1.0, config được) → `thumbnail.png`;
  - `metadata.json`: title/subtitle/series (từ video-map + brand block), description draft (từ approved-script: hook + takeaway + CTA), hashtags theo series, duration, checksum;
  - `checklist.md`: các bước user upload thủ công + non-negotiable failures từ `docs/market-research/12-quality-gates.md` làm mục tick trước khi publish.
- Verify: chạy trên run có sẵn (`output/render/flow-runs/*`) → bundle đủ 4 file.

## Phase O3 — HTTP bridge + n8n workflow (Codex)

- `scripts/flow-server.mjs` + npm `flow:server` — HTTP server 127.0.0.1:8790 (Node core `http`, không thêm dependency):
  - `POST /run` {script, videoMap, runId?} → spawn detached `run-flow.mjs`, trả `{runId}`;
  - `GET /status/<runId>` → đọc flow-report.json;
  - chỉ bind 127.0.0.1; không nhận command tùy ý — chỉ nhận đường dẫn nằm trong repo (validate chống path traversal).
- `n8n/workflows/lucida-flow.json` (importable): Webhook trigger → HTTP Request `http://host.docker.internal:8790/run` → Wait+poll `/status` đến completed/failed → gửi summary (n8n UI; notification node để user tự cấu hình sau).
- README.md mục n8n: update hướng dẫn (start flow-server trên host → docker compose up → import workflow).
- Verify: flow-server chạy, POST /run với fixture trả runId, poll status ra completed; n8n JSON import không lỗi node type (dùng node core: webhook, httpRequest, wait, if, set).

## Phase O4 — Docs sync (Claude, không phải Codex)

- FLOW_V1.md: S6 status → implemented (trigger/report/bundle; upload = manual gate), M5 done.
- `11-current-operating-flow.md` §5b + `ai/status.md`: cập nhật.

## Files được phép sửa/tạo (Codex)

```text
tạo:  scripts/run-flow.mjs, scripts/publish-handoff.mjs, scripts/flow-server.mjs,
      n8n/workflows/lucida-flow.json, pipeline/fixtures/flow/*
sửa:  package.json (scripts), README.md (mục n8n), n8n/docker-compose.yml (chỉ thêm extra_hosts nếu cần)
CẤM:  src/**, design/**, docs/market-research/**, schemas/** (trừ khi flow-report cần schema riêng thì tạo mới schemas/flow-report.schema.json)
```

## Kết quả build (append sau khi xong)

(chưa có)

- 2026-07-14 — Implemented O1–O3: host flow orchestrator (`flow:run`) với stage report/stop-on-fail/skip-voice; publish bundle (`publish:handoff`) gồm video, thumbnail, metadata và checklist; HTTP bridge (`flow:server`) với path containment; n8n webhook/poll workflow, Docker host mapping, fixture request và README hướng dẫn vận hành.
- Verify: `node --check` cho ba script mới; `npm run lint`; JSON parse workflow/fixture; smoke test `/health` = 200 và POST `/run` với path ngoài repo = 400. Không chạy render, TTS, WhisperX hoặc Docker.
