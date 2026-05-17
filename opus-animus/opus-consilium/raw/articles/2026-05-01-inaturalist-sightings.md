# iNaturalist Sightings

**Source:** simon-willison
**URL:** https://simonwillison.net/2026/May/1/inat-sightings/#atom-everything
**Published:** 2026-05-01 19:35 UTC
**Topic:** AI

<p><strong>Tool:</strong> <a href="https://tools.simonwillison.net/inat-sightings">iNaturalist Sightings</a></p>
    <p>I wanted to see my <a href="https://www.inaturalist.org">iNaturalist</a> observations - across two separate accounts - grouped by when they occurred. I'm camping this weekend so I built this entirely on my phone using Claude Code for web.</p>
<p>I started by building an <a href="https://github.com/simonw/inaturalist-clumper">inaturalist-clumper</a> Python CLI for fetching and "clumping" observations - by default clumps use observations within 2 hours and 5km of each other.</p>
<p>Then I setup <a href="https://github.com/simonw/inaturalist-clumps">simonw/inaturalist-clumps</a> as a <a href="https://simonwillison.net/series/git-scraping/">Git scraping</a> repository to run 
