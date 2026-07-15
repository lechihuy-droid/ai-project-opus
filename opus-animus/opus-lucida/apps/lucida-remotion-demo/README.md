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

This app keeps voice generation, alignment, Remotion rendering, and publish handoff on the Windows host. n8n only triggers the host flow and polls its report.

Start the host bridge from the app root:

```console
npm run flow:server
```

In another terminal, start n8n:

```console
cd n8n
docker compose up -d
```

Open:

```text
http://127.0.0.1:5678
```

Import `n8n/workflows/lucida-flow.json`, activate the workflow, then POST a request to the webhook URL shown by n8n. A sample body is available at `pipeline/fixtures/flow/request.fixture.json`:

```console
curl -X POST http://127.0.0.1:5678/webhook/lucida-flow -H "Content-Type: application/json" --data @pipeline/fixtures/flow/request.fixture.json
```

The workflow calls `http://host.docker.internal:8790/run`, polls `/status/<runId>` every 30 seconds, and returns the completed or failed flow summary. Keep `npm run flow:server` running while n8n jobs are active.

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
