# Rollback - schema-html-prototype-pre-mcp

**Archived:** 2026-05-14

This folder preserves the previous React/Vite schema-first renderer.

## When To Roll Back

Rollback only if `apps/slide-agent/` fails a production gate that cannot be fixed quickly:

- Wake frame export cannot produce 17 frames.
- Audio sync breaks numeric `slide-NN` alignment.
- Template rendering cannot preserve accepted Wake visual structure.
- Deterministic re-render fails.

## Steps

```powershell
cd C:\Users\HUY\AI\opus-animus\opus-lucida
Move-Item -LiteralPath '99-archive/schema-html-prototype-pre-mcp' -Destination 'apps/schema-html-prototype'
cd apps/schema-html-prototype
npm install
npm run export:screenshots -- src/fixtures/wakeTypedDeck.json output/wake-frames
```

Then restore the production frames from git or from the slide-agent backup folder if needed.

## Current Primary Runtime

Primary renderer is now:

```text
apps/slide-agent/
```

Do not edit this archive for new production work.
