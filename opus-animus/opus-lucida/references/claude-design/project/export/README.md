# Lucida · N2 Slide Templates — Export Bundle

15 slide templates (1920×1080) cho bài học N2 grammar, demoed với cluster Wake (わけ).

## Files

```
lucida-n2-slide-templates.html   ← deck chính, mở bằng browser
lucida-n2-slide-templates.md     ← design spec đầy đủ (đọc trước khi clone)
deck-stage.js                    ← slide shell (scaling, keyboard nav, print-to-PDF)
tweaks-panel.jsx                 ← Tweaks panel React component
```

## Đặt ở đâu trong opus-lucida repo

Đề xuất:

```
opus-lucida/
└─ production/
   ├─ 01-rules/
   │  └─ slide-system/
   │     └─ templates/                          ← chỗ mới
   │        ├─ lucida-n2-slide-templates.html
   │        ├─ lucida-n2-slide-templates.md
   │        ├─ deck-stage.js
   │        └─ tweaks-panel.jsx
   └─ 00-active/
      └─ <next-cluster>/                        ← clone từ template về đây
         ├─ <cluster>-deck.html
         └─ ...
```

## Quick start

```bash
# Open in browser
open lucida-n2-slide-templates.html

# Navigate slides: ←/→ keys
# Toggle Tweaks panel: click button in deck toolbar (bottom-right)
# Print: Cmd+P → 1 page per slide
```

## Clone cho cluster mới

Đọc §7 trong `lucida-n2-slide-templates.md` (Reuse Workflow). 7 bước chính:

1. Duplicate file HTML, đặt tên `<cluster>-deck.html`
2. Viết Master Teaching Skeleton cho cluster (theo `lessons/templates/01-…`)
3. Replace JP content trong từng `<section>` — giữ class names, badge, slide-num
4. Map patterns vào color slots theo **speaker-action** (xem §3 trong spec md)
5. Rewrite speaker-intent line cho T07 — không copy paste từ Wake
6. Validate theo `production/01-rules/slide-system/04-slide-framework-qa-checklist.md`
7. Light mode pass cho worksheet variant

## Tweaks

| Tweak | Options |
|---|---|
| Mode | Video (dark) ↔ Print (light) |
| Density | Comfortable ↔ Compact |
| Type pairing | Auto / Clean / Apple / **Vietnamese** (default) / Editorial |
| T09 variant | Table ↔ Cards |

Default values are saved inline trong block `/*EDITMODE-BEGIN*/.../*EDITMODE-END*/` của file HTML.

## Fonts

Loaded from Google Fonts CDN — cần internet khi mở file. Nếu cần offline:
- Download fonts thủ công và serve local
- Hoặc bundle thành single-file qua tool inlining

---

*Lucida · v1.0 · 2026-05-18*
