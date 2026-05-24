# Redis Array Playground

**Source:** simon-willison
**URL:** https://simonwillison.net/2026/May/4/redis-array/#atom-everything
**Published:** 2026-05-04 15:53 UTC
**Topic:** AI

<p><strong>Tool:</strong> <a href="https://tools.simonwillison.net/redis-array">Redis Array Playground</a></p>
        <p>Salvatore Sanfilippo submitted <a href="https://github.com/redis/redis/pull/15162">a PR</a> adding a new data type - arrays - to Redis. </p>
<p>The new commands are <code>ARCOUNT</code>, <code>ARDEL</code>, <code>ARDELRANGE</code>, <code>ARGET</code>, <code>ARGETRANGE</code>, <code>ARGREP</code>, <code>ARINFO</code>, <code>ARINSERT</code>, <code>ARLASTITEMS</code>, <code>ARLEN</code>, <code>ARMGET</code>, <code>ARMSET</code>, <code>ARNEXT</code>, <code>AROP</code>, <code>ARRING</code>, <code>ARSCAN</code>, <code>ARSEEK</code>, <code>ARSET</code>.</p>
<p>The implementation is currently available in a branch, so I <a href="https://github.com/simonw/tools/pull/277">had Cla
