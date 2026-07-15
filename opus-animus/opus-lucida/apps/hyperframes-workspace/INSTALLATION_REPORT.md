# Installation Report

## Environment check

- Node.js: `24.15.0`
- npm: `11.12.1`
- Git: `2.53.0.windows.3`
- Git LFS: `3.7.1`
- Bun: `1.3.14`
- FFmpeg: installed and usable
- FFprobe: installed and usable
- Chrome / Chromium:
  - Chrome desktop found
  - HyperFrames Chrome Headless Shell cached and usable

## Repositories cloned

- `heygen-com/hyperframes`
- `heygen-com/hyperframes-launches`
- `heygen-com/website-to-hyperframes-demo`

## HyperFrames build status

Built and verified:

- `packages/parsers`
- `packages/core`
- `packages/lint`
- `packages/player`
- `packages/studio-server`
- `packages/studio`
- `packages/producer`
- `packages/cli`

CLI validation:

- `hyperframes doctor`
- `node packages/cli/dist/cli.js --version`
- `node packages/cli/dist/cli.js preview --help`
- `node packages/cli/dist/cli.js render --help`

## Preview validation

- Preview server validated on `http://127.0.0.1:3002/`
- Response check returned `200 OK`

## Render validation

Rendered outputs in `output/`:

- `hello-world.mp4`
- `typography.mp4`
- `timeline.mp4`
- `terminal.mp4`
- `ai-engine-intro.mp4`

Additional validation:

- `scene-schema/examples/ai-engine-intro.json` compiled into `generated/ai-engine-intro/`
- Generated project produced `index.html` and `meta.json`
- Rendered JSON-generated video duration verified with FFprobe: `7.200000`
- Visual frame smoke check extracted to `output/ai-engine-intro-frame.png`

## Notes

- Full monorepo install was constrained by local disk space, so the setup used filtered installs and staged builds.
- HyperFrames CLI keeps a conservative disk-space preflight. For local smoke-test rendering on this machine, the workspace uses `renderer/render-samples.mjs` and `renderer/render-project.mjs`, which call `@hyperframes/producer` directly without modifying the built CLI bundle.
- Node render commands need permission to spawn Chrome Headless Shell and FFmpeg on this machine.
