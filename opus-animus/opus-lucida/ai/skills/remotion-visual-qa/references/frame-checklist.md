# Frame Checklist

## Export Frames

Use scene starts and midpoints. For a 30fps video:

```powershell
npx remotion still LucidaMotionDemo out\check-030.png --frame=30
npx remotion still LucidaMotionDemo out\check-180.png --frame=180
npx remotion still LucidaMotionDemo out\check-360.png --frame=360
```

## Checks

```text
content fit: visible scene explains the subtitle
safe area: no text under platform UI zones
subtitle: not blank, not too long, 1-2 lines preferred
overlap: cards/nodes/captions do not collide
arrows: start/end points touch correct elements
stage position: main visual centered, not stuck at top
density: <= 5 primary objects unless long scene
motion: no important object appears too late to read
```

## Common Fixes

```text
diagram too high -> lower visual stage or reduce title block height
arrows mismatched -> compute endpoints from node bounds
overlap -> deterministic layout by template, not freehand x/y
subtitle blank -> minimum visible prefix or scene-level subtitle fallback
too dense -> split scene or switch to carousel/list
wrong template -> return to script-template-mapper and revise video-map.json
```
