# Terminal Command Center Provenance

## Status

- Package ID: `terminal-command-center`
- Status: `experimental`
- Layer: Style + component grammar
- Registered video binary: none
- Registered third-party media: none

## Source Batch

Artifacts come from the visual reference ingest run and are persisted into this package where possible:

- Ingest config: `pipeline/fixtures/visual-reference-flow.json`
- Raw source artifact: `./artifacts/visual-reference-raw-input.json`
- Sanitized artifact: `./artifacts/visual-reference-sanitized-input.json`
- Normalized artifact: `./artifacts/visual-reference-normalized-input.json`
- Mapped scenes: `./artifacts/visual-reference-scenes.json`
- Compiled reference VideoMap: `./artifacts/visual-reference-video-map.json`
- Source review report mirror: `./artifacts/source-review-report.json`

## References Studied

- `rpodcast/quarto-revealjs-terminal`
- `letieu/terminal.css`
- `Gioni06/terminal.css`
- `panr/terminal-css`
- `terminalcss.xyz`
- `reveal.js`
- `tabler/tabler`
- `satnaing/shadcn-admin`

## Selected Concepts

- Terminal window chrome with title bar, prompt path, and status indicator.
- Dark technical palette with restrained cyan/gold accents.
- Low-opacity scanlines and subtle grid/matrix background treatments.
- Typed command lines, highlighted output lines, and cursor blink.
- Compact dashboard rows for process and provenance data.

## Copy Status

Principles-only. No third-party screenshots, logos, font files, generated images, or source CSS files are registered as production assets. The package uses original Lucida tokens and original validation content.

## Validation Artifacts

- Demo source fixture: `pipeline/fixtures/terminal-video-20s-map.json`
- Persisted demo VideoMap: `./artifacts/terminal-demo-video-map.json`
- Persisted render props: `./artifacts/terminal-demo-render-props.json`
- Preview frames: `./artifacts/frames/`
- Render report: `./artifacts/validation-render-report.json`

The MP4 output from the run is not part of the project database/library. The persisted source review report still points at the original pipeline-run PNG captures, and those screenshots are not re-registered as package artifacts.
