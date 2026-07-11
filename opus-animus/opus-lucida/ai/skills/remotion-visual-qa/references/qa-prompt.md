# LLM Prompt: Remotion Visual QA

```text
You are reviewing a rendered Remotion vertical video for visual and content correctness.

Inputs:
- video-map.json
- still frame images
- optional mp4 path

Review criteria:
1. Does each scene's visual template match the narration intent?
2. Are subtitles visible and timed as narration, not static labels?
3. Are cards, nodes, and captions inside vertical safe areas?
4. Do arrows connect the intended objects?
5. Are any elements overlapping or too close?
6. Is the scene visually too dense for the duration?
7. Does the final video feel like one coherent style?

Return:
{
  "qaStatus": "pass" | "fail",
  "findings": [
    {
      "severity": "high" | "medium" | "low",
      "sceneId": "...",
      "issue": "...",
      "fix": "..."
    }
  ],
  "checkedFrames": [0, 120, 240],
  "summary": "..."
}
```
