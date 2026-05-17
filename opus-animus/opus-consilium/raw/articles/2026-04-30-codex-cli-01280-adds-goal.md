# Codex CLI 0.128.0 adds /goal

**Source:** simon-willison
**URL:** https://simonwillison.net/2026/Apr/30/codex-goals/#atom-everything
**Published:** 2026-04-30 23:23 UTC
**Topic:** AI

<p><strong><a href="https://github.com/openai/codex/releases/tag/rust-v0.128.0">Codex CLI 0.128.0 adds /goal</a></strong></p>
The latest version of OpenAI's Codex CLI coding agent adds their own version of the <a href="https://ghuntley.com/ralph/">Ralph loop</a>: you can now set a <code>/goal</code> and Codex will keep on looping until it evaluates that the goal has been completed... or the configured token budget has been exhausted.</p>
<p>It looks like the feature is mainly implemented though the <a href="https://github.com/openai/codex/blob/6014b6679ffbd92eeddffa3ad7b4402be6a7fefe/codex-rs/core/templates/goals/continuation.md">goals/continuation.md</a> and <a href="https://github.com/openai/codex/blob/6014b6679ffbd92eeddffa3ad7b4402be6a7fefe/codex-rs/core/templates/goals/budget_limit.md
