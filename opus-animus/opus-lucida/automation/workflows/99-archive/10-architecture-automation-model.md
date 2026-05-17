# Architecture Reference: Lucida Automation Model
**Status:** Reference — chưa implement
**Date:** 2026-04-29
**Ref:** `09-automation-retrospective-and-to-be-flow.md`, `docs/research-video-automation.md`

---

## Nguyên tắc phân chia

| Layer | Tool | Lý do |
|---|---|---|
| Content pipeline | CrewAI | Agents cần đọc output nhau, phản biện, tổng hợp |
| Video rendering | Python sequential | Deterministic, không cần reasoning |
| Slide design | Human gate (Canva) | Judgment call, upgrade sang HTML khi > 5 videos |

---

## Flow tổng quan

```
run_lucida.py "wake-cluster"
│
├── [1] ContentCrew (CrewAI)
│     Agent 1: LessonArchitect   → lesson brief chuẩn hóa
│     Agent 2: ScriptWriter      → script draft (18 sections)
│     Agent 3: ContentReviewer   → kiểm tra Japanese/grammar
│     Agent 4: MethodReviewer    → kiểm tra 3 View pedagogy     (song song)
│     Agent 5: FlowReviewer      → kiểm tra hook/CTA/pacing     (song song)
│     Agent 6: ScriptIntegrator  → script_final.md + decision_log.md
│
├── [HUMAN GATE A] Review script_final.md (~10 phút)
│     fail → feed fix note → chạy lại từ Agent 6
│
├── [HUMAN GATE B] Canva slide design (~2-3 giờ)
│     Export PNG → production/frames/{topic}/slide-01.png ... slide-18.png
│     upgrade path: thay bằng HTML auto-render khi format ổn định (> 5 videos)
│
└── [2] VideoPipeline (Python sequential)
      tts_agent.py      → Azure TTS SSML → audio/{topic}.mp3
      assembly_agent.py → MoviePy frames + audio → raw/{topic}-raw.mp4
      caption_agent.py  → script timing → .srt → final/{topic}.mp4
      shorts_agent.py   → production/shorts/ timestamps → shorts/{topic}-short-*.mp4
      upload_agent.py   → YouTube Data API v3 → video URL
```

---

## File structure (khi implement)

```
opus-lucida/
  automation/
    crews/
      content_crew.py     ← CrewAI: 6 agents + task definitions
      agents.py           ← agent configs (LLM, role, backstory)
      tasks.py            ← task definitions per agent
    video/
      tts_agent.py
      assembly_agent.py
      caption_agent.py
      shorts_agent.py
      upload_agent.py
      pipeline.py         ← sequential runner
  run_lucida.py           ← entry: python run_lucida.py wake-cluster
```

---

## LLM choice

ContentCrew dùng **Groq (Llama 3.3 70B)** — không dùng multi-model.
Claude/Gemini/ChatGPT trong workflow doc là chat sessions thủ công, không phải API.
Khi chạy code: 1 LLM tốt + role rõ là đủ.

---

## Upgrade path

| Trigger | Action |
|---|---|
| > 5 videos published, format stable | Replace Canva PNG export bằng HTML → Puppeteer → PNG |
| Channel monetized | Nâng TTS lên ElevenLabs JP premium |
| > 10 videos/month | Bỏ Human Gate A, chạy full auto với confidence threshold |

---

*Lucida Automation Architecture Reference v1.0 | 2026-04-29*
