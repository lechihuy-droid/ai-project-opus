---
name: topic-script-writer
description: Use this skill to turn Lucida market research plus a topic idea into an approved, sentence-addressable video script with series and brand block, ready for the remotion-script-to-video flow. Use when the user asks to choose a video topic, write a Lucida video script, or start a new video from research or an idea. This is Stage S0 of FLOW_V1.
---

# Topic Script Writer

Turn market research + a topic idea into a frozen `approved-script.json`. Run this BEFORE `source-ingestor-cleaner` when starting a new video. This stage owns the first user-approval gate of FLOW_V1 (script approval).

## Position in flow

```text
market research + topic idea
-> topic-script-writer (this skill)
-> approved-script.json  [GATE: user approves, script frozen]
-> source-ingestor-cleaner -> script-template-mapper -> ... -> render
```

Flow owner: `apps/lucida-remotion-demo/design/workflow/FLOW_V1.md`.

## Required reading (at runtime)

Read from `apps/lucida-remotion-demo/docs/market-research/`:

- `08-editorial-voice.md` — hook, script, CTA writing rules (bắt buộc trước khi viết script).
- `10-series-architecture.md` — series pillars and formats.
- `11-pipeline-contract.md` — brand block + series mapping (fixed, never re-invent).
- `04-growth-hypotheses.md` + `05-positioning-implications.md` — when proposing topics.

Read when needed:

- `references/approved-script-schema.md`: JSON contract for the output artifact.
- `references/topic-selection-rules.md`: series mapping + topic acceptance criteria.

## Workflow

1. **Topic intake.** Take the user's topic idea, or propose 2–3 candidates derived from series pillars (10) and growth hypotheses (04). Each candidate states: audience job-to-be-done, why now, expected series.
2. **Series mapping.** Map topic → series using the fixed table in `references/topic-selection-rules.md`. Series is chosen, brand is never re-created per video.
3. **Value check.** The topic must plausibly deliver Lucida's three feelings: (1) tôi vừa biết một điều đáng chú ý, (2) tôi hiểu tại sao nó liên quan đến mình, (3) tôi biết nên làm gì tiếp theo. If it cannot, say so and propose a reframe.
4. **Script draft.** Write the full voiceover script in Vietnamese following `08-editorial-voice.md` and the narrative functions `signal → proof → meaning → action`. State target duration and the word-count assumption used.
5. **Sentence split.** Split into sentences with stable `sentenceId`s and build `approved-script.json` per `references/approved-script-schema.md`.
6. **[GATE] User approval.** Present: topic, series, duration estimate, full script text, claims needing evidence. STOP and wait for approval. On approve: set `status: "approved"`, `approval.contentFrozen: true`, write the artifact.

## Output contract

Write to:

```text
apps/lucida-remotion-demo/input/scripts/<topic-slug>/approved-script.json
```

## Hard rules

- **Opening rule:** không mở đầu bằng chào hỏi/giới thiệu kênh. 3–5 giây đầu vào thẳng signal, pain point, hoặc contrast. Nhịp: signal → ví dụ/contrast ngắn → twist → promise.
- **No invented facts.** Every factual claim must be traceable to research or a source the user supplied. Claims that still need evidence are listed in `claimsNeedingEvidence` for `source-ingestor-cleaner` to resolve — never silently asserted.
- **Frozen after approval.** Any textual change after approval creates a new `revision`; downstream artifacts (voice, timing, mapping) are invalidated.
- **Brand is fixed.** Only `series` and permitted variable fields change per video (see `11-pipeline-contract.md` §Variable fields). Never override locked brand fields.
- Script text = text truth for the whole pipeline. Downstream components must never carry an independently edited copy.

## Completion criteria

- `approved-script.json` exists, schema-valid, `status: "approved"`, sentence IDs stable.
- Topic, series, and duration were explicitly approved by the user.
- Claims needing evidence are enumerated.
- The script passes the opening rule and narrative-function check.
