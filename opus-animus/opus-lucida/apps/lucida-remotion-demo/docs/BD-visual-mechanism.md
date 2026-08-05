# BD — Visual Mechanism Kit (M6)

- **Status:** active — phase A/B/C ✅ done, phase D đang chạy 2026-07-15
- **Date:** 2026-07-14
- **Scope:** build plan cho `docs/RD-visual-mechanism.md` (approved 2026-07-14)
- **Role:** build plan (SDD)
- **Owner layer:** workflow SOP
- **Parent:** `docs/RD-visual-mechanism.md`
- **Supersedes:** (none)
- **Superseded by:** (none)

File này trả lời: **M6 build theo thứ tự nào, ai làm phần nào, và mỗi phần được nghiệm thu bằng test gì?**

Phân công: docs/prompt/rules = Claude (Opus) · code + test = Codex (`codex exec -m gpt-5.6-sol`) · verify fan-out (chạy QA frames nhiều case) = Sonnet subagent.

---

## Phase A — Schema + skill rules (Claude, docs) — FR1, FR4

| Bước | Việc                                                                                                                                                                                                                                                                      | File                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| A1   | Thêm khối `visualMechanism` vào ApprovedScript contract: `environment`, `transformation`, `beats[]` (mỗi phần tử: `segmentId`, `stateChange`), `payoff`; hoặc `"none"` + `reason`. Kèm invariants: mỗi `segmentId` của script phải có đúng 1 beat (khi mechanism ≠ none). | `ai/skills/topic-script-writer/references/approved-script-schema.md` |
| A2   | SKILL.md `topic-script-writer`: bước bắt buộc đề xuất mechanism theo topic, trình user duyệt CÙNG script (gate 1); cấm mechanism generic ("card + text lớn" không được tính là mechanism).                                                                                | `ai/skills/topic-script-writer/SKILL.md`                             |
| A3   | Hierarchy rules vào mapping skill: headline ≤ 6 từ, không lặp nguyên văn câu voice-over; subtitle là kênh duy nhất lặp lời; typography cỡ hook 1 lần/video; visual minh họa (chip/diff/timer) thay vì viết lại lời.                                                       | `ai/skills/script-template-mapper/` (references)                     |

**Test A:** review chéo — schema example hợp lệ tự viết cho email-keigo (environment = cửa sổ email, payoff = timer morph); rule A3 áp lên video-map v1 phải bắt được ≥ 3 vi phạm đã biết (headline setup/caution lặp VO, hook-type mọi scene).

## Phase B — Kicker flag + Semantic QA (Codex batch 1) — FR5, FR7, FR8

| Bước | Việc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | File chính                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| B1   | Debug flag: `videoMap.debug.showTechnicalLabels` (default `false`). templateRegistry chỉ render `scene.kicker` khi flag bật. Thêm block `debug` (optional) vào video-map schema.                                                                                                                                                                                                                                                                                                                                       | `src/templateRegistry.tsx`, `schemas/video-map.schema.json`   |
| B2   | `scripts/validate-semantic.mjs` (npm `validate:semantic`), input `--input <video-map.json>`, checks: (1) **claim-count**: số đếm (chữ "một/hai/ba/bốn/năm" + digit) trong `title`/`headline`/CTA của scene vs số phần tử `steps`/`items` cùng scene — lệch → FAIL; (2) **headline≈subtitle**: trùng > 70% từ (normalize, bỏ dấu câu) → WARN; (3) **static-scene**: scene không có transition > 8s → WARN; (4) **kicker-leak**: có `--final` mà `debug.showTechnicalLabels === true` → FAIL. Exit code ≠ 0 khi có FAIL. | `scripts/validate-semantic.mjs`, `package.json`               |
| B3   | Tích hợp: `flow-run.mjs` chạy `validate:semantic` sau `validate:brand`; kết quả (pass/warn/fail chi tiết) ghi vào render report cạnh drift/checksum.                                                                                                                                                                                                                                                                                                                                                                   | `scripts/run-flow.mjs` (hoặc flow-run hiện có), report writer |
| B4   | Tests (node --test hoặc theo pattern test hiện có): (a) video-map email-keigo v1 (`input/scripts/ai-email-keigo/video-map.json` — headline "Ba bước" + 4 steps) → check 1 FAIL đúng scene `steps`; (b) map đã sửa (3 steps) → PASS; (c) headline lặp subtitle → WARN; (d) `--final` + flag bật → FAIL; (e) video-map cũ không có `debug` → vẫn validate OK (backward compatible).                                                                                                                                      | `scripts/__tests__/` hoặc vị trí test hiện có                 |

**Ràng buộc cho Codex:** không sửa nội dung `input/scripts/ai-email-keigo/*.json` (fixture copy vào test nếu cần); không đổi hành vi mode `slides` hiện tại ngoài việc ẩn kicker theo flag; min font-size check KHÔNG làm ở phase này (cần design tokens của phase C).

**Test B (Claude verify):** chạy `npm run validate:semantic -- --input input/scripts/ai-email-keigo/video-map.json` → phải FAIL check 1; render lại 1 frame với default flag → không còn "01 / HOOK".

## Phase C — Mechanism kit + continuous mode + art v2 — FR2, FR3, FR6

Open questions RD đã chốt (2026-07-14): **font JP = `@remotion/google-fonts/NotoSansJP`** (loadFont, không bundle file vào repo) · **transition schema = declarative beats** (typed JSON, renderer diễn giải).

### C1 — Design tokens v2 + 4 components (Codex batch 2)

| Bước | Việc |
|---|---|
| C1-1 | Design tokens v2 tại module theme mới (vd `src/mechanism/tokens.ts`): `graphite` (nền), `ivory` (chất giấy), `champagneGold` (giữ tương thích `#D2B47A`), `vermilion` (đỏ son — CHỈ error/correction), `MIN_FONT_SIZE` (chọn giá trị sao cho đọc được khi 1080px thu về màn 375px — đề xuất ≥ 32). |
| C1-2 | 4 component dưới `src/mechanism/`: `MechanismWindow` (variant `email\|chat\|doc`, title bar, body text JP+VI qua NotoSansJP, cursor nhấp nháy, state `draft\|sent`), `ContextChip` (label+value, animation bay tới target theo tọa độ tương đối), `TimerMorph` (morph giữa 2 giá trị mm:ss, digit interpolate), `DiffHighlight` (2 khối text before/after, spans highlight + chú thích nhỏ, highlight dùng `vermilion`/`champagneGold`). Props typed đầy đủ, KHÔNG nhận HTML/CSS tự do. |
| C1-3 | Composition demo `MechanismKitDemo` trong `src/Root.tsx` show 4 khối tuần tự để QA still từng khối. |
| C1-4 | Tests: tsc PASS; unit test props (typed, default); test token — mọi fontSize trong `src/mechanism/` phải ≥ `MIN_FONT_SIZE` (trừ chú thích được whitelist rõ). KHÔNG chạy still render trong batch này (Chrome yếu — Claude/Sonnet render verify sau). |

### C2 — Continuous mode (Codex batch 3, sau khi C1 verify)

| Bước | Việc |
|---|---|
| C2-1 | Schema: `videoMap.mode: "slides" (default) \| "continuous"`; khối `environment` (component + variant + props khởi tạo); scene trong mode continuous mang `transitions[]` (mỗi phần tử: `target`, `action`, `props`) thay vì templateId slide. |
| C2-2 | `Composition.tsx`: mode `continuous` render environment tồn tại xuyên video + áp transitions theo scene timing (vẫn dùng timed-script như mode slides); SubtitleBar giữ nguyên. Mode `slides` không đổi một dòng hành vi. |
| C2-3 | `validate:semantic` check 3 (static-scene) đọc `transitions[]` khi mode continuous; thêm check 4 (font — video-map không được override fontSize dưới MIN nếu schema cho phép override). |
| C2-4 | Tests: video-map cũ (slides) render/validate như trước; sample continuous map nhỏ (window + 1 chip + 1 timer) pass tsc + test; semantic QA đọc đúng transitions. |

**Test C (Claude/Sonnet verify):** still render `MechanismKitDemo` từng khối; sample continuous map render 2–3 still; tokens đúng palette.

## Phase D — Rebuild email-keigo + nghiệm thu (Claude + Sonnet verify)

1. Video-map mới mode `continuous` theo beats của mechanism (email window → AI sai → 3 chip → 2 phiên bản diff → kiểm tra cuối → timer 30:00→05:00 → CTA ≤ 4s); sửa 3/4 bước; voice checksum giữ nguyên.
2. Nội dung email JP mẫu (trước/sau + cụm kính ngữ highlight) — soạn nháp theo pattern bank, user review.
3. Render → semantic QA PASS → QA frames (Sonnet subagent fan-out) → user gate 3 lần 2.

**DoD toàn milestone:** mục 5 của RD (6 điểm).

## Kết quả build

### Phase A (Claude) — ✅ done 2026-07-14

- A1: `visualMechanism` (environment/transformation/beats/payoff, hoặc `none`+reason) vào `approved-script-schema.md` + invariants (1 beat / segmentId; "card + typography lớn" không tính là mechanism).
- A2: `topic-script-writer/SKILL.md` — thêm workflow step 5 "Visual mechanism", gate 1 duyệt script + mechanism cùng lúc, completion criteria cập nhật.
- A3: hierarchy rules vào `script-template-mapper/references/llm-prompt.md` (headline ≤6 từ không lặp VO, subtitle là kênh duy nhất lặp lời, hook-type 1 scene/video, số trong claim = số item render).
- Test A: áp rule lên video-map email-keigo v1 bắt được 4 vi phạm đã biết — headline `setup` lặp nguyên văn VO + 8 từ, headline `caution` lặp VO, headline cỡ lớn ở mọi scene, "Ba bước" vs 4 steps. PASS.

### Phase B (Codex) — ✅ done 2026-07-14, Claude verify PASS

- B1: thêm `debug.showTechnicalLabels` optional/default `false` trong schema và type; truyền flag qua `Composition.tsx`; cả 5 layout trong `templateRegistry.tsx` chỉ render `scene.kicker` khi flag bật.
- B2: thêm `scripts/validate-semantic.mjs`, npm `validate:semantic`; hỗ trợ claim-count FAIL, headline–subtitle overlap WARN, static scene > 8s WARN, và `--final` kicker-leak FAIL; có report JSON và exit khác 0 khi FAIL.
- B3: `scripts/run-flow.mjs` chạy `validate:brand` → `validate:semantic` → render; chi tiết semantic nằm trong `flow-report.json` và được hợp nhất vào `render-report.json` cạnh checksum/drift.
- B4: thêm `scripts/__tests__/validate-semantic.test.mjs` và `technical-labels.test.mjs`; fixture đọc trực tiếp từ `input/scripts/ai-email-keigo/video-map.json`.
- Verify 2026-07-14: `npm run test:semantic` PASS 8/8; `npx tsc --noEmit` PASS; lệnh nghiệm thu `npm run validate:semantic -- --input input/scripts/ai-email-keigo/video-map.json` exit 1 đúng `claim-count`, scene `steps` (`Ba bước` so với 4 `content.steps`; đồng thời 4 WARN overlap).
- Claude verify độc lập 2026-07-14: chạy lại validate:semantic (exit 1, FAIL đúng scene) + test 8/8 PASS + **render still thật frame 45** (`remotion still`): map gốc có 8 `kicker` nhưng frame không hiện nhãn → default-ẩn hoạt động trên render thật. Test B PASS.

### Phase C1 verify (Claude + Sonnet) — ✅ PASS 2026-07-14

- Claude: `npm run test:mechanism` 5/5 PASS, `npx tsc --noEmit` PASS.
- Sonnet subagent render + soi still 4 khối `MechanismKitDemo` (fps 30, 4 block × 90 frame): **4/4 PASS** — window chrome + JP text sạch (không tofu) + cursor vermilion blink (frame 38), chip đúng target, timer digit không clip, diff highlight vermilion/gold + annotation đúng, palette + canvas 1080×1920 không clip. Stills: `output/render/mechanism-kit-demo/`.
- Ghi nhận: lần render đầu lỗi tạm `net::ERR_INSUFFICIENT_RESOURCES` khi tải NotoSansJP từ Google Fonts (retry OK) — render offline sẽ fail font; chấp nhận cho pipeline local có mạng, ghi backlog nếu cần bundle font.

### Phase C2 verify (Claude + Sonnet) — ✅ PASS 2026-07-15, kèm 2 bug → C2.1

- Claude: tsc PASS, test:semantic 12/12, test:mechanism 7/7.
- Sonnet render 4 still (`output/render/continuous-check/`): environment giữ nguyên xuyên 3 scene (không "đổi slide"), chip + timer transitions đúng, legacy slides mode không regression. Cách render continuous: `LucidaMotionDemo --props={"videoMap": <map>}`.
- **Bug 1 (C2.1 phải sửa):** SubtitleBar clip 2 mép khi subtitle dài mà không có `timedCaptions` — nhánh `captionGroups` gom 1 dòng nowrap trong khung 880px, không chia dòng như nhánh `timedPhrases`.
- **Bug 2 (C2.1 phải sửa):** phần tử continuous chồng nhau — ContextChip (target y 0.58) bị TimerMorph (top hardcode 1020) đè khuất; cần action `remove` trong transitions để map dọn phần tử trước payoff + bỏ hardcode vị trí timer (nhận từ props).

### C2.1 — Patch 2 bug verify (Codex batch 4)

1. SubtitleBar nhánh `captionGroups`: chia dòng như nhánh `timedPhrases` (max 2 dòng, ngắt >6 từ), không nowrap tràn khung.
2. Transitions thêm action `remove` (xóa phần tử theo `target` id); TimerMorph nhận vị trí từ props (default giữ hành vi cũ).
3. Test: subtitle 11 từ không clip (đo width logic hoặc unit test chia dòng); remove hoạt động; map cũ không đổi.

### Kết quả build — Phase C1 (Codex)

- C1-1: thêm `src/mechanism/tokens.ts` với graphite, ivory, champagne gold `#D2B47A`, vermilion và `MIN_FONT_SIZE = 32`; chỉ `diffAnnotation` 26px nằm trong whitelist có lý do rõ ràng.
- C1-2: thêm 4 component typed `MechanismWindow`, `ContextChip`, `TimerMorph`, `DiffHighlight`, font JP+VI qua `@remotion/google-fonts/NotoSansJP`; không có props passthrough HTML/CSS tự do.
- C1-3: thêm `MechanismKitDemo` vào `src/Root.tsx`, gồm 4 block tuần tự (90 frame/block); composition `LucidaMotionDemo` cũ được giữ nguyên.
- C1-4: thêm `tests/mechanism/mechanism-types.test.ts`, `mechanism-kit.test.mjs`, `font-size-token.test.mjs` và npm script `test:mechanism`; cập nhật `package.json`. Package Google Fonts đã có đúng dòng Remotion 4.0.486 nên không cần cài lại; `package-lock.json` không đổi bởi C1.
- Kết quả: `npm run test:mechanism` PASS 5/5; `npx tsc --noEmit` PASS; regression `npm run test:semantic` PASS 8/8. Không chạy Remotion still render theo ràng buộc máy yếu.

### Kết quả build — Phase C2 (Codex)

- C2-1: cập nhật `schemas/video-map.schema.json` và type trong `src/data.ts` với mode `slides` mặc định / `continuous`, environment `MechanismWindow`, và scene continuous dùng `transitions[]` typed (`target`, `action`, `props`) thay cho `templateId`/`templateRole`.
- C2-2: thêm `src/mechanism/ContinuousEnvironment.tsx`, export qua `src/mechanism/index.ts`, và nhánh continuous trong `src/Composition.tsx`; environment tích lũy state xuyên scene, transition bắt đầu theo đúng frame scene hiện có, dùng nguyên `SubtitleBar` từ `src/templateRegistry.tsx`; nhánh slides giữ nguyên.
- C2-3: cập nhật `scripts/validate-semantic.mjs` để static-scene ở mode continuous chỉ đọc `transitions[]`; cập nhật `scripts/validate-video-map.mjs` để hiểu conditional schema và không áp cảnh báo layout slide cho continuous.
- C2-4: thêm `scripts/__tests__/continuous-mode.test.mjs`, `tests/mechanism/continuous-mode.test.mjs`, đưa sample vào TypeScript contract test, và fixture `tests/fixtures/continuous-video-map.json` (window + 1 chip + 1 timer transition).
- Kết quả: `npx tsc --noEmit` PASS; `npm run test:semantic` PASS 12/12; `npm run test:mechanism` PASS 7/7; `npm run validate:semantic -- --input tests/fixtures/continuous-video-map.json` PASS (0 fail, 0 warn); schema validation PASS cho sample continuous và `video-map.json` legacy. Không chạy Remotion still/video render theo yêu cầu.

### Kết quả build — Phase C2.1 (Codex)

- Subtitle wrapping: thêm `src/subtitleLines.ts`; `src/templateRegistry.tsx` dùng chung logic cho `timedPhrases` và `captionGroups`, chỉ ngắt khi trên 6 từ, cân thành tối đa 2 dòng. Test 11 từ xác nhận chia 6+5 và không mất từ.
- Continuous state: tách reducer sang `src/mechanism/continuousState.ts`; action `remove` xóa phần tử theo `target`. Contract hiện có trong `src/data.ts` và `schemas/video-map.schema.json` được regression-test với remove map và legacy slides map.
- Timer position: `src/mechanism/TimerMorph.tsx` thêm prop typed `position`; `src/mechanism/ContinuousEnvironment.tsx` đọc vị trí từ props, với default `{ left: 115, top: 1020 }` giữ nguyên hành vi map cũ.
- Tests cập nhật: `tests/fixtures/continuous-video-map.json`, `tests/mechanism/continuous-mode.test.mjs`, `tests/mechanism/mechanism-kit.test.mjs`, `tests/mechanism/mechanism-types.test.ts`, `scripts/__tests__/continuous-mode.test.mjs`.
- Kết quả: `npx tsc --noEmit` PASS; `npm run test:semantic` PASS 13/13; `npm run test:mechanism` PASS 10/10. Không chạy Remotion render; không sửa file nào dưới `input/scripts/`.

### Kết quả build — Phase C2.2 (Codex)

- Files changed: `src/data.ts`, `schemas/video-map.schema.json`, `src/mechanism/continuousState.ts`, `src/mechanism/ContinuousEnvironment.tsx`, `tests/mechanism/continuous-mode.test.mjs`, `scripts/__tests__/continuous-mode.test.mjs`, và `docs/BD-visual-mechanism.md`.
- Transition phần tử hỗ trợ `offsetSec?: number` (mặc định `0`) và tính frame hiệu lực bằng `sceneStartFrame + Math.round(offsetSec * fps)`; add/update/remove đều chỉ áp dụng từ frame này. Environment `update` giữ hành vi theo scene và bỏ qua `offsetSec` có chủ đích.
- Regression tests xác nhận hai chip offset 0/2 giây có startFrame khác nhau, remove trễ vẫn giữ phần tử trước offset, và map không có `offsetSec` giữ nguyên hành vi cũ.
- Kết quả: `npx tsc --noEmit` PASS; `npm run test:mechanism` PASS 13/13; `npm run test:semantic` PASS 14/14. Không chạy Remotion render; không sửa file nào dưới `input/scripts/`.

### Phase C2.2 verify (Claude) — ✅ PASS 2026-07-15

- tsc PASS, test:mechanism 13/13, test:semantic 14/14 (chạy lại độc lập).
- Ghi chú thiết kế: environment `update` bỏ qua `offsetSec` (đã document trong code) — beat cần hoãn env update thì đặt vào scene sau (đã áp dụng cho beat keigo-text của email-keigo v2: dời sang đầu scene caution, lệch 0.6s so với lời đọc, chấp nhận).

### Phase D (Claude + Sonnet) — 🔨 đang chạy 2026-07-15

- Video-map v2 continuous: `input/scripts/ai-email-keigo/video-map.v2.json` (builder: scratchpad `build-email-keigo-v2.mjs`). 6 scene / 1 environment email window / 13 transitions; offset chip tính từ timed-script v1 (voice 58s giữ nguyên); sửa lỗi 3/4 bước (3 chip dữ kiện; "chỉnh chi tiết" = beat kiểm tra ở caution); DiffHighlight dùng email JP từ `email-jp-sample.md` (draft, chờ user review); CTA = follow chip 4s cuối, không end-card tĩnh.
- Validate: **semantic PASS 0 fail / 0 warn** (v1 cùng checker: 1 FAIL + 4 WARN) · brand score 1.00.
- Đang render 6 still gate-2 (Sonnet) → trình user duyệt video-map (gate 2) → apply-timing + render full 58s → gate 3.
- **Gate 2: user duyệt 2026-07-15** (6 still storyboard + fix layout 4 lỗi Sonnet phát hiện: chip chồng nhau, timer đè subtitle, follow chip đè header — xếp lại vị trí, thêm `remove` cho diff trước khi timer vào, remove timer trước khi follow chip vào).
- **Bug thật phát hiện khi apply-timing trên map thật:** schema bắt buộc `props` cho MỌI transition (kể cả `remove`, vốn không cần) + type `MechanismTransition` thiếu hẳn variant `remove` cho element target — lọt qua toàn bộ test Phase C2.1 vì builder map là `.mjs` không qua tsc. Vá bằng Codex (C2.3) — xem block bên dưới. Claude verify lại: tsc PASS, test:mechanism 13/13, test:semantic 15/15, validate:semantic map v2 PASS 0/0.
- Render full 58s: run-id `email-keigo-v2`, voice copy từ run `email-keigo` (checksum giữ nguyên) — ✅ hoàn tất 2026-07-16. `output/render/flow-runs/email-keigo-v2/video.mp4` (8.1MB) + publish bundle `output/publish/email-keigo-v2/`.
- Render report: audioStream=true, voiceChecksum khớp v1, captionDriftMs=13.33 (bằng v1), **semanticQa 4 pass / 0 warn / 0 fail** (v1: 1 fail + 4 warn).
- Claude tự QA 6 still trên video-map ĐÃ apply-timing thật (không phải map trước timing) — tất cả PASS: hook (email nháp + timer 29:58), steps (3 chip xếp cột dọc không chồng), caution (email keigo + chip Kiểm tra), payoff diff (TRƯỚC/SAU highlight đúng), payoff timer (05:00 không đè subtitle), cta (SENT + follow chip sạch, không đè header).
- **Gate 3 (video final) trình user 2026-07-16.**

### Kết quả build — Phase C2.3 fix (Codex)

- Files changed: `src/data.ts`, `src/mechanism/continuousState.ts`, `schemas/video-map.schema.json`, `scripts/__tests__/continuous-mode.test.mjs`, `tests/fixtures/continuous-video-map.json`, `tests/mechanism/mechanism-types.test.ts`, và `docs/BD-visual-mechanism.md`.
- `MechanismTransition` có variant remove đúng contract `{ target: string; action: "remove"; offsetSec?: number }`, không có `props`; type của element state lấy props từ variant `add`, giữ nguyên runtime add/update/remove.
- Schema chỉ require `props` khi action là `add` hoặc `update`; remove không cần props. Regression tests xác nhận remove không props PASS, còn add/update thiếu props đều FAIL schema.
- Repro trước fix bằng đúng flow command: FAIL schema với 7 lỗi `missing required property "props"` tại các remove transition trong `input/scripts/ai-email-keigo/video-map.v2.json`.
- Sau fix, cùng flow command tạo `output/render/flow-runs/repro/video-map.json`; stage `validate:videomap` PASS (6 scenes), brand PASS 1.00, semantic PASS 4/4 (0 warn, 0 fail), không còn schema error. Stage render phía sau exit code 1 sau khoảng 584.7s; lỗi render này độc lập với schema acceptance.
- Kết quả test: `npx tsc --noEmit` PASS; `npm run test:mechanism` PASS 13/13; `npm run test:semantic` PASS 15/15; direct `node scripts/validate-video-map.mjs output/render/flow-runs/repro/video-map.json` PASS.
- Không sửa `input/scripts/ai-email-keigo/video-map.v2.json`.

## Phase E — M6.1 Dual-window + Fidelity (Codex batch 5) — từ treatment email-keigo v3

Nguồn yêu cầu: `input/scripts/ai-email-keigo/visual-treatment.v3.md` (APPROVED 2026-07-16, user chốt scope gồm cả 2 gap) + action ③④ của `docs/review-design-before-render.md`.

| Bước | Việc |
|---|---|
| E1 | **Window addable làm element**: `MechanismWindow` thêm được qua transitions (`action: add`, `props.component: "MechanismWindow"`, variant `email\|chat\|doc` + đủ props hiện có + `position {left, top}` + `scale?`). Type union `AddableMechanism` + schema + `ContinuousEnvironment.renderElement` hỗ trợ. Cursor chỉ blink ở window "active" (window element mới nhất được add/update — quy ước đơn giản). |
| E2 | **Environment window transform**: environment update nhận `position {left, top}` + `scale` (default hiện tại left:80 top:250 scale:1) — animate mượt từ giá trị cũ sang mới trong ~20 frame kể từ đầu scene chứa update (không nhảy cắt). Backward compatible: map cũ không có position/scale render y hệt. |
| E3 | **Fidelity checks** vào `validate:semantic`: video-map optional `actors: [{id, target}]` (target = element target id hoặc "environment"); check (5) **actor-coverage**: mọi actor.target phải xuất hiện trong ≥1 transition add/update hoặc environment — thiếu → FAIL; check (6) **beat-coverage**: mode continuous, mọi scene phải có ≥1 transition — thiếu → FAIL (nâng từ WARN static-scene khi có `actors` khai báo). |
| E4 | Tests: (a) map 2 window (env email + element chat) tsc + schema PASS; (b) env transform position/scale animate đúng frame; (c) map cũ không position/scale không đổi hành vi; (d) actor khai báo nhưng target không bao giờ xuất hiện → FAIL; (e) map không có `actors` → validator giữ hành vi cũ (backward compatible). |

**Ràng buộc:** không sửa `input/scripts/`; không đổi hành vi mode slides; không remotion render (Claude/Sonnet verify still sau).

## Kết quả build — Phase E (Codex)

- Files changed: `src/data.ts`, `src/mechanism/continuousState.ts`, `src/mechanism/ContinuousEnvironment.tsx`, `schemas/video-map.schema.json`, `scripts/validate-semantic.mjs`, `tests/mechanism/continuous-mode.test.mjs`, `tests/mechanism/mechanism-types.test.ts`, `scripts/__tests__/continuous-mode.test.mjs`, và `docs/BD-visual-mechanism.md`.
- E1: export `AddableMechanism` và thêm variant element `MechanismWindow` với đủ props renderer hiện có, `position {left, top}` bắt buộc và `scale?`; continuous renderer dispatch window element qua transitions. Chỉ window còn tồn tại có lần add/update mới nhất được phép nhận cursor blink; environment là window active ban đầu và có thể active lại khi được update.
- E2: environment nhận `position`/`scale` ở initial props và update; transform nội suy từ giá trị trước sang giá trị mới trong 20 frame kể từ scene start. Default `{left: 80, top: 250, scale: 1}` giữ pixel behavior của map cũ không khai báo transform; các props nội dung window vẫn update theo behavior cũ.
- E3: schema/type thêm optional `actors: [{id, target}]`; semantic QA thêm `actor-coverage` cho target không xuất hiện trong add/update và `beat-coverage` cho scene continuous không có transition khi `actors` được khai báo. Map không có `actors` giữ nguyên static-scene WARN và bộ đếm 4 check cũ.
- E4: regression tests cover map 2 window (environment email + element chat) qua TypeScript/schema, midpoint/endpoints animation transform, legacy defaults, actor target thiếu → FAIL, scene thiếu beat → FAIL khi có actors, và no-actors backward compatibility.
- Kết quả: `npx tsc --noEmit` PASS; `npm run test:mechanism` PASS 15/15; `npm run test:semantic` PASS 19/19. Không chạy Remotion render; không sửa file nào dưới `input/scripts/`.
