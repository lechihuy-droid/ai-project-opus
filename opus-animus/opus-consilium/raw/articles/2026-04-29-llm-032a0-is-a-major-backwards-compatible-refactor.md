# LLM 0.32a0  is a major backwards-compatible refactor

**Source:** simon-willison
**URL:** https://simonwillison.net/2026/Apr/29/llm/#atom-everything
**Published:** 2026-04-29 19:01 UTC
**Topic:** AI

<p>I just released <a href="https://llm.datasette.io/en/latest/changelog.html#a0-2026-04-28">LLM 0.32a0</a>, an alpha release of my <a href="https://llm.datasette.io/">LLM</a> Python library and CLI tool for accessing LLMs, with some consequential changes that I've been working towards for quite a while.</p>
<p>Previous versions of LLM modeled the world in terms of prompts and responses. Send the model a text prompt, get back a text response.</p>
<pre><span class="pl-k">import</span> <span class="pl-s1">llm</span>

<span class="pl-s1">model</span> <span class="pl-c1">=</span> <span class="pl-s1">llm</span>.<span class="pl-c1">get_model</span>(<span class="pl-s">"gpt-5.5"</span>)
<span class="pl-s1">response</span> <span class="pl-c1">=</span> <span class="pl-s1">model</span>.<span class="p
