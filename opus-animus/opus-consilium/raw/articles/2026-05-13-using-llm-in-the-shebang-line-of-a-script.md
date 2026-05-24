# Using LLM in the shebang line of a script

**Source:** simon-willison
**URL:** https://simonwillison.net/2026/May/11/llm-shebang/#atom-everything
**Published:** 2026-05-11 18:48 UTC
**Topic:** AI
**Tier:** 1
**Goal-Score:** 5
**Relevance:** Sử dụng LLM trong shebang line -> FPT có thể ứng dụng công nghệ này để cải thiện hiệu suất của FleziPT và tăng cường khả năng cạnh tranh.

<p><strong>TIL:</strong> <a href="https://til.simonwillison.net/llms/llm-shebang">Using LLM in the shebang line of a script</a></p>
        <p>Kim_Bruning <a href="https://news.ycombinator.com/item?id=48073246#48090590">on Hacker News</a>:</p>
<blockquote>
<p>But seriously, you can put a shebang on an english text file now (if you're sufficiently brave) [...]</p>
</blockquote>
<p>This inspired me to look at patterns for doing exactly that with <a href="https://llm.datasette.io/en/stable/">LLM</a>. Here's the simplest, which takes advantage of <a href="https://llm.datasette.io/en/stable/fragments.html">LLM fragments</a>:</p>
<pre><code>#!/usr/bin/env -S llm -f
Generate an SVG of a pelican riding a bicycle
</code></pre>
<p>But you can also incorporate <a href="https://llm.datasette.io/en/sta
