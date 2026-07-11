# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## WhisperX timestamps

Use WhisperX for word-level timestamps before wiring captions into the video:

```powershell
pip install git+https://github.com/m-bain/whisperX.git
.\scripts\run-whisperx.ps1 -InputPath .\voice.mp3
```

This writes `output/whisperx/voice.json` with segment and word timestamps, for example:

```json
{
  "word": "Dynamic",
  "start": 5.2,
  "end": 5.8
}
```

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## n8n for Remotion

This app includes a local n8n starter under `n8n/` for orchestration around the existing Remotion render script.

Start n8n:

```console
cd n8n
docker compose up -d
```

Open:

```text
http://127.0.0.1:5678
```

The starter is set up to trigger the existing app-level render path:

```text
scripts/render-run.mjs -> remotion render LucidaMotionDemo -> output/render/flow-runs/<runId>/video.mp4
```

Use this when you want n8n to schedule or webhook-drive renders without changing the Remotion app contract.

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
