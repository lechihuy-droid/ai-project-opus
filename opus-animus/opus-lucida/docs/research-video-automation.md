# Research: Video Automation Pipeline
**Date:** 2026-04-29
**Status:** v2 â€” integrated with Lucida production flow
**Context:** Lucida Japanese teaching channel â€” video rendering sau khi content artifacts Ä‘Ã£ pass Bundle QA

---

## 1. Lucida Production Flow â€” Äiá»ƒm káº¿t ná»‘i

Lucida Ä‘Ã£ cÃ³ content pipeline 13 steps (xem `09-automation-retrospective-and-to-be-flow.md`). Video automation **khÃ´ng thay tháº¿** pipeline Ä‘Ã³ â€” nÃ³ lÃ  Stage 14 trá»Ÿ Ä‘i, nháº­n artifact Ä‘Ã£ pass Bundle QA.

```
Lucida Content Pipeline (Steps 0â€“12)
  Direction Lock â†’ Lesson â†’ Script â†’ Review Ã— 3 â†’ Deck â†’ Worksheet â†’ Shorts â†’ Bundle QA
                                                                              â†“
                                                                   [HAND-OFF POINT]
                                                                              â†“
Video Rendering Pipeline (Steps 13â€“18) â† ÄÃ‚Y lÃ  pháº¡m vi cá»§a doc nÃ y
  [13] Voice-over â† script draft final
  [14] Slide render â† slide deck (Canva hoáº·c code)
  [15] Assembly â† audio + slides + timing
  [16] Captions â† script + audio align
  [17] Shorts cut â† shorts pack notes
  [18] Upload â† YT metadata
```

### Artifacts táº¡i Hand-off Point

| Artifact | File | DÃ¹ng cho stage |
|---|---|---|
| Script final (voice-over text, slide-by-slide) | `production/decks/04-script-*.md` | Stage 13 â€” TTS input |
| Slide deck (18 slides, Canva) | `production/decks/0x-slide-deck-*-final` | Stage 14 â€” visual frames |
| Shorts pack | `production/shorts/0x-shorts-*.md` | Stage 17 â€” short cuts |
| Worksheet | `production/worksheets/` | Upload description + link |

---

## 2. Váº¥n Ä‘á» Ä‘áº·c thÃ¹ cá»§a Lucida

TrÆ°á»›c khi chá»n option, cáº§n hiá»ƒu 3 rÃ ng buá»™c riÃªng:

### 2.1 Kanji + Ruby/Furigana rendering
Lucida dáº¡y N2 â€” slides cÃ³ kanji kÃ¨m furigana. Báº¥t ká»³ tool táº¡o/render slide nÃ o Ä‘á»u pháº£i handle Ä‘Æ°á»£c:
```
æµ·å¤–ï¼ˆã‹ã„ãŒã„ï¼‰ã«å‡ºå¼µï¼ˆã—ã‚…ã£ã¡ã‚‡ã†ï¼‰ã™ã‚‹
```
Canva handle Ä‘Æ°á»£c. Pillow/Manim cáº§n custom font + layout. HTML + Puppeteer handle tá»‘t.

### 2.2 Canva lÃ  sunk cost
Slide deck hiá»‡n táº¡i Ä‘Ã£ Ä‘Æ°á»£c dá»±ng thá»§ cÃ´ng trÃªn Canva (Gemini design direction â†’ human build). Náº¿u bá» Canva Ä‘á»ƒ code slides láº¡i tá»« Ä‘áº§u = bá» asset Ä‘Ã£ cÃ³.

**Options thá»±c táº¿:**
- **Keep Canva** â†’ export PNG â†’ assemble (khÃ´ng tá»± Ä‘á»™ng hÃ³a slide creation)
- **Replace Canva** â†’ code-based slides (HTML/Manim) â†’ full auto (máº¥t asset cÅ©, cáº§n rebuild)

### 2.3 Method chÆ°a stable
Theo `09-retrospective`: *"automation pháº£i Ä‘i sau method clarity, khÃ´ng Ä‘i trÆ°á»›c."*
Hiá»‡n táº¡i má»›i cÃ³ 2 sample bÃ i (internal-test-case + wake-cluster), chÆ°a quay video nÃ o.

â†’ **KhÃ´ng nÃªn commit vÃ o full automation ngay.** Æ¯u tiÃªn tool nÃ o cho phÃ©p test nhanh, dá»… thay Ä‘á»•i.

---

## 3. Lá»±a chá»n per Stage â€” PhÃ¹ há»£p vá»›i Lucida

### Stage 13 â€” Voice-over (TTS)

Lucida cáº§n: giá»ng Nháº­t tá»± nhiÃªn, Ä‘á»c kanji Ä‘Ãºng, cÃ³ thá»ƒ Ä‘á»c kÃ¨m tiáº¿ng Viá»‡t giáº£i thÃ­ch.

| Tool | JP Voice | Äá»c Kanji | Cost | Note |
|---|---|---|---|---|
| **Azure Neural TTS** | `ja-JP-NanamiNeural` (ná»¯, tá»± nhiÃªn) | Tá»‘t (dÃ¹ng SSML) | Free 500k chars/mo | **Best choice** â€” há»— trá»£ SSML `<phoneme>` Ä‘á»ƒ force pronunciation |
| ElevenLabs | JP voices cÃ³ | á»”n | $5/mo 30k chars | Tá»‘t nhÆ°ng Ä‘áº¯t hÆ¡n cho vol nhá» |
| OpenAI TTS | `alloy`, khÃ´ng JP-specific | á»”n | $0.015/1k chars | KhÃ´ng JP-native |
| Fish Audio | JP voices cÃ³ | á»”n | $0.005/video | Tá»‘t cho overflow |
| gTTS (Google free) | CÃ³ | á»”n, Ä‘Ã´i khi sai pitch | $0 | Fallback dá»± phÃ²ng |

**LÆ°u Ã½ quan trá»ng:** Script Lucida mix Viá»‡t + Nháº­t (giáº£i thÃ­ch báº±ng tiáº¿ng Viá»‡t, vÃ­ dá»¥ báº±ng tiáº¿ng Nháº­t). Azure TTS cÃ³ thá»ƒ cháº¡y 2 voice liÃªn tiáº¿p trong 1 file qua SSML â€” phÃ¹ há»£p nháº¥t.

```xml
<!-- Azure SSML example: mix Viet + JP -->
<speak>
  <voice name="vi-VN-HoaiMyNeural">HÃ´m nay há»c ã‹ã„ãƒ»ãŒã„</voice>
  <voice name="ja-JP-NanamiNeural">æµ·å¤–ã«å‡ºå¼µã™ã‚‹</voice>
</speak>
```

**Chá»n:** Azure Neural TTS (free tier â†’ 100 videos/mo) + Fish Audio overflow.

---

### Stage 14 â€” Slide Rendering (visual frames)

ÄÃ¢y lÃ  stage **quan trá»ng nháº¥t** vÃ  **khÃ¡c biá»‡t nháº¥t** giá»¯a cÃ¡c options.

| Approach | Canva compat | JP/Kanji | Auto level | Cost | Rebuild needed |
|---|---|---|---|---|---|
| **A. Canva Export PNG** | Giá»¯ nguyÃªn | Perfect | Manual export | $0 | KhÃ´ng |
| **B. HTML â†’ Puppeteer â†’ PNG** | Replace | Tá»‘t (CSS font) | Full auto | $0 | CÃ³ (rebuild slides) |
| **C. Manim** | Replace | Cáº§n custom | Full auto | $0 | CÃ³ (rebuild slides) |
| **D. Remotion (React)** | Replace | Tá»‘t | Full auto | $0 | CÃ³ (rebuild slides) |

**PhÃ¢n tÃ­ch:**
- Option A lÃ  zero-risk, giá»¯ cháº¥t lÆ°á»£ng Canva hiá»‡n táº¡i, chá»‰ thÃªm bÆ°á»›c "export + name theo slide sá»‘"
- Options B/C/D cáº§n rebuild toÃ n bá»™ 18 slides per video báº±ng code â€” worth it khi > 20 videos/month

**Chá»n hiá»‡n táº¡i:** Option A (Canva Export PNG) vÃ¬ method chÆ°a stable, khÃ´ng nÃªn rebuild assets.
**Upgrade path:** Khi cÃ³ 5+ videos pass QA vÃ  format á»•n Ä‘á»‹nh â†’ migrate sang HTML slides.

---

### Stage 15 â€” Assembly

Input: `[slide_1.png, slide_2.png, ..., slide_18.png]` + `voice.mp3` + timing map

| Tool | Python? | Kanji render | Ease | Cost |
|---|---|---|---|---|
| **MoviePy** | Yes | N/A (PNGs cÃ³ sáºµn) | Dá»… | $0 |
| FFmpeg CLI | Bash | N/A | KhÃ³ | $0 |
| Shotstack API | REST | N/A | Dá»… nháº¥t | $49/mo |

**Chá»n:** MoviePy â€” Ä‘á»§ cho 4-8 videos/mo, Python-native, dá»… maintain.

---

### Stage 16 â€” Captions

Lucida Ä‘Ã£ cÃ³ script text. KhÃ´ng cáº§n ASR (speech-to-text) â€” chá»‰ cáº§n align script vá»›i timing audio.

```
Script slide-by-slide â†’ biáº¿t thá»i Ä‘iá»ƒm báº¯t Ä‘áº§u má»—i slide â†’ burn captions
```

**Chá»n:** Force-alignment tá»« script (dÃ¹ng `aeneas` hoáº·c simple duration-split) â†’ khÃ´ng cáº§n Whisper.

---

### Stage 17 â€” Shorts Cut

Lucida Ä‘Ã£ cÃ³ `production/shorts/` vá»›i timestamps vÃ  script cho má»—i short. Assembly agent Ä‘á»c file Ä‘Ã³ â†’ cáº¯t tá»« video gá»‘c.

**Chá»n:** FFmpeg clip extraction theo timestamps tá»« shorts pack file.

---

### Stage 18 â€” Upload

**Chá»n:** YouTube Data API v3 (free, 10k units/day = ~50 uploads/day).

---

## 4. Workflow Options â€” Bundles cho Lucida

### Option 1: Canva-First Manual Assembly (MVP ngay bÃ¢y giá»)
```
Script â†’ Azure TTS â†’ Voice.mp3
Canva Deck â†’ Export PNG manually â†’ Slides/
MoviePy assemble(slides, voice, timing) â†’ raw.mp4
Script-to-SRT â†’ captions â†’ final.mp4
YT API upload
```

| TiÃªu chÃ­ | Äiá»ƒm |
|---|---|
| Setup time | 1 ngÃ y |
| Cost/month | **$0** (Azure free 100 videos) |
| Videos/month | 4-8 (beta scale) |
| JP kanji render | âœ“ Perfect (Canva handles it) |
| Human effort/video | ~20 min (Canva export + review) |
| Method-change tolerance | **Cao** â€” thay slide ná»™i dung khÃ´ng áº£nh hÆ°á»Ÿng code |
| Automation level | 70% (slide export váº«n manual) |
| **Fit vá»›i Lucida now** | **Best** |

---

### Option 2: HTML Slides Full Auto (sau khi method stable)
```
Script â†’ Azure TTS â†’ Voice.mp3
Script + template â†’ Jinja2 HTML â†’ Puppeteer â†’ PNG frames
MoviePy assemble â†’ raw.mp4
Script-to-SRT â†’ final.mp4
YT API upload
```

| TiÃªu chÃ­ | Äiá»ƒm |
|---|---|
| Setup time | 5-7 ngÃ y (build HTML template cho 18 slide types) |
| Cost/month | **$0** |
| Videos/month | Unlimited |
| JP kanji render | âœ“ Tá»‘t (CSS `font-family: "Noto Sans JP"`) |
| Human effort/video | ~5 min (review only) |
| Method-change tolerance | Trung bÃ¬nh â€” sá»­a layout cáº§n update template |
| Automation level | 95% |
| **Fit vá»›i Lucida now** | Tá»‘t â€” nhÆ°ng nÃªn delay Ä‘áº¿n sau video thá»© 5+ |

---

### Option 3: Premium Voice + Canva (khi channel monetized)
```
Script â†’ ElevenLabs JP voice â†’ Voice.mp3 (quality tá»‘t hÆ¡n)
Canva PNG export â†’ MoviePy â†’ final.mp4
YT API upload
```

| TiÃªu chÃ­ | Äiá»ƒm |
|---|---|
| Cost/month | **$5-20/mo** |
| JP voice quality | â­â­â­â­â­ |
| Fit vá»›i Lucida | Tá»‘t sau khi revenue báº¯t Ä‘áº§u |

---

### Option 4: Avatar Presenter (khÃ´ng recommended)
HeyGen/Synthesia vá»›i avatar giÃ¡o viÃªn áº£o.

| TiÃªu chÃ­ | Äiá»ƒm |
|---|---|
| Cost/month | $22-29/mo â†’ chá»‰ 10-15 min video |
| Videos/month | 5-10 videos ngáº¯n |
| Automation | Semi (váº«n cáº§n script + review) |
| **Váº¥n Ä‘á» chÃ­nh** | $2-3/video vs $0.01 option 1/2. KhÃ´ng scale. Khi channel lá»›n, chi phÃ­ tÄƒng tuyáº¿n tÃ­nh. |
| **Fit vá»›i Lucida** | KhÃ´ng phÃ¹ há»£p cho volume teaching content |

---

## 5. Selection Criteria â€” TiÃªu chÃ­ chá»n

ÄÃ¢y lÃ  framework quyáº¿t Ä‘á»‹nh chá»n option nÃ o, xáº¿p theo thá»© tá»± Æ°u tiÃªn cho Lucida:

### C1: Method stability (GATE â€” quyáº¿t Ä‘á»‹nh timing)
> *Náº¿u format video chÆ°a á»•n Ä‘á»‹nh (< 5 videos Ä‘Ã£ publish vÃ  pass review), KHÃ”NG nÃªn Ä‘áº§u tÆ° vÃ o full automation.*

| Tráº¡ng thÃ¡i | Action |
|---|---|
| < 5 videos published | Option 1 (Canva-First) |
| 5-20 videos, format stable | Migrate sang Option 2 |
| > 20 videos, monetized | Upgrade voice sang Option 3 |

### C2: Japanese content fidelity
> *Tool cÃ³ render Ä‘Æ°á»£c kanji + ruby/furigana Ä‘Ãºng khÃ´ng?*

- Canva: Pass âœ“
- HTML + Noto Sans JP font: Pass âœ“
- Pillow (raw Python): Cáº§n font config, phá»©c táº¡p âœ—
- Manim: Cáº§n custom, khÃ³ âœ—
- Avatar tools: KhÃ´ng handle slides trá»±c tiáº¿p âœ—

### C3: Canva asset compatibility
> *CÃ³ cáº§n rebuild slides khÃ´ng?*

- Option 1: KhÃ´ng (giá»¯ nguyÃªn Canva) âœ“
- Options 2-4: Cáº§n rebuild âœ— (nhÆ°ng cháº¥p nháº­n Ä‘Æ°á»£c khi timing Ä‘Ãºng)

### C4: Cost per video táº¡i scale beta (4-8 videos/month)
> *á»ž scale beta, Ä‘á»«ng tá»‘i Æ°u cost â€” tá»‘i Æ°u speed-to-feedback.*

| Option | Cost/video | 8 videos/mo |
|---|---|---|
| Option 1 | ~$0 | **$0** |
| Option 2 | ~$0 | **$0** |
| Option 3 | ~$0.06 | **$0.5** |
| Option 4 | ~$2-3 | **$16-24** |

### C5: Maintainability khi 1 ngÆ°á»i lÃ m
> *Flow cÃ³ thá»ƒ cháº¡y sau 2 tuáº§n khÃ´ng Ä‘á»¥ng vÃ o khÃ´ng?*

- Option 1: Cao (Ã­t code, Canva váº«n quen) âœ“
- Option 2: Trung bÃ¬nh (cáº§n maintain HTML templates) ~
- Option 3: Cao (chá»‰ thay API key náº¿u Ä‘á»•i voice) âœ“
- Option 4: Tháº¥p (avatar tool thay UI liÃªn tá»¥c) âœ—

---

## 6. Decision Tree

```
Báº¯t Ä‘áº§u lÃ m video?
â”œâ”€â”€ ChÆ°a cÃ³ video nÃ o published
â”‚   â””â”€â”€ â†’ Option 1 (Canva Export + MoviePy + Azure TTS)
â”‚
â”œâ”€â”€ CÃ³ 5+ videos, format slide á»•n Ä‘á»‹nh
â”‚   â””â”€â”€ â†’ Migrate sang Option 2 (HTML slides full auto)
â”‚       â””â”€â”€ Náº¿u JP font khÃ³ â†’ giá»¯ Option 1 thÃªm 5 videos
â”‚
â””â”€â”€ Channel monetized (>$100/mo revenue)
    â””â”€â”€ â†’ Option 3 (ElevenLabs premium voice)
        â””â”€â”€ Váº«n giá»¯ HTML slides tá»« Option 2
```

---

## 7. Implementation Map â€” Option 1 (Start Now)

```
opus-lucida/
  automation/
    video/
      tts_agent.py        â† Azure TTS: script â†’ voice.mp3
      assembly_agent.py   â† MoviePy: PNGs + voice â†’ raw.mp4
      caption_agent.py    â† Script timing â†’ .srt â†’ burn captions
      upload_agent.py     â† YT Data API v3 â†’ upload + metadata
      pipeline.py         â† orchestrate: run_video("wake-cluster")
    workflows/
      10-workflow-video-rendering.md   â† SOP: Canva export steps + naming convention
```

**Canva export convention (Ä‘á»ƒ automation Ä‘á»c Ä‘Æ°á»£c):**
```
production/frames/{topic}/
  slide-01.png
  slide-02.png
  ...
  slide-18.png
```

**Script timing format** (Ä‘Ã£ cÃ³ trong slide-by-slide script):
```json
{"slide": 1, "text": "HÃ´m nay há»c ...", "duration_sec": 45}
```

---

## 8. Káº¿t luáº­n

**Chá»n Option 1 ngay bÃ¢y giá».** LÃ½ do:

1. Method chÆ°a stable â€” 0 videos published, chÆ°a biáº¿t format cuá»‘i
2. Canva assets Ä‘Ã£ cÃ³ â€” tÃ¡i dÃ¹ng, khÃ´ng rebuild
3. Azure TTS free tier Ä‘á»§ cho toÃ n bá»™ beta phase (100 videos/mo)
4. Implement xong trong 1 ngÃ y, khÃ´ng block content work
5. Dá»… upgrade sang Option 2 khi Ä‘á»§ signal

**Äiá»u kiá»‡n upgrade sang Option 2:**
- â‰¥ 5 videos published vÃ  pass viewer feedback
- Slide template format Ä‘Ã£ freeze (khÃ´ng Ä‘á»•i layout)
- Cáº§n produce > 10 videos/thÃ¡ng

**KhÃ´ng dÃ¹ng Avatar (Option 4)** á»Ÿ báº¥t ká»³ giai Ä‘oáº¡n nÃ o vÃ¬ cost/video khÃ´ng scale vá»›i teaching content volume.

---

*Lucida Video Automation Research v2.0 | 2026-04-29*

