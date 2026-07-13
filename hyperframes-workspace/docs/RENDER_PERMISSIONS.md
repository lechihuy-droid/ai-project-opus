# Render Permissions

## Problem

HyperFrames rendering launches child processes:

- Chrome Headless Shell
- FFmpeg
- FFprobe

Inside the Codex sandbox, Node can compile the composition but may fail when spawning those binaries:

```text
spawn EPERM
```

This is a sandbox permission boundary, not a HyperFrames composition error.

## Fix for normal development

Run render from a normal PowerShell or Command Prompt, outside the Codex sandbox:

```powershell
cd C:\Users\HUY\workspace\ai-project-opus\hyperframes-workspace
node .\renderer\render-project.mjs `
  --project .\generated\gpt56-work-ai-video-workflow `
  --output .\output\gpt56-work-ai-video-workflow.mp4 `
  --quality draft `
  --workers 1
```

Or use the wrapper:

```cmd
cd C:\Users\HUY\workspace\ai-project-opus\hyperframes-workspace
renderer\render-project.cmd generated\gpt56-work-ai-video-workflow output\gpt56-work-ai-video-workflow.mp4 draft
```

## Fix inside Codex sessions

When Codex runs the render command, approve the escalation request for:

```text
node renderer/render-project.mjs
```

That allows Node to spawn Chrome and FFmpeg for this render workflow.

## If it still fails outside Codex

Check Windows security controls:

1. Windows Security -> Virus & threat protection -> Ransomware protection.
2. If Controlled folder access is enabled, allow:
   - `node.exe`
   - `chrome-headless-shell.exe`
   - `ffmpeg.exe`
   - `ffprobe.exe`
3. Keep the project under `C:\Users\HUY\workspace\...`, not a protected system folder.

## Verification

Run:

```powershell
node -e "const {spawnSync}=require('node:child_process'); console.log(spawnSync(process.env.ComSpec, ['/c','echo ok']).status)"
```

Expected result:

```text
0
```

Then render a known generated project.
