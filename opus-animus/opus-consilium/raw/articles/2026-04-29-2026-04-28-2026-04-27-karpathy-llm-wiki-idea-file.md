[![Antigravity Logo](/logo.svg)Antigravity Codes](/)

[Help](/troubleshooting)[Blog](/blog)[Community](/community)[🍌 PromptsNEW](/nano-banana-prompts)[Rules](/rules)[Workflows](/workflows)[Agent Skills](/agent-skills)[MCPs](/mcp)[Advertise](/advertise)

EN

[ENEnglish](/blog/karpathy-llm-wiki-idea-file)[ESEspañol](/es/blog/karpathy-llm-wiki-idea-file)[ZH中文](/zh/blog/karpathy-llm-wiki-idea-file)[JA日本語](/ja/blog/karpathy-llm-wiki-idea-file)[DEDeutsch](/de/blog/karpathy-llm-wiki-idea-file)[PTPortuguês](/pt/blog/karpathy-llm-wiki-idea-file)[RUРусский](/ru/blog/karpathy-llm-wiki-idea-file)

[Help](/troubleshooting)[Blog](/blog)[Community](/community)[🍌 PromptsNEW](/nano-banana-prompts)[Rules](/rules)[Workflows](/workflows)[Agent Skills](/agent-skills)[MCPs](/mcp)[Advertise](/advertise)

EN

[ENEnglish](/blog/karpathy-llm-wiki-idea-file)[ESEspañol](/es/blog/karpathy-llm-wiki-idea-file)[ZH中文](/zh/blog/karpathy-llm-wiki-idea-file)[JA日本語](/ja/blog/karpathy-llm-wiki-idea-file)[DEDeutsch](/de/blog/karpathy-llm-wiki-idea-file)[PTPortuguês](/pt/blog/karpathy-llm-wiki-idea-file)[RUРусский](/ru/blog/karpathy-llm-wiki-idea-file)

AI Deep Dive

# Karpathy's LLM Wiki: The Complete Guide to His Idea File

Karpathy's viral tweet about LLM Knowledge Bases got a follow-up: a **GitHub gist** that lays out the full architecture. We go through it **word by word** — every concept, every tool, every technique — with implementation examples and code.

Published: April 4, 2026•25 min read

![The LLM Wiki: Building a Compounding Personal Knowledge Base — infographic showing RAG vs LLM Wiki comparison, the paradigm shift with compounding knowledge effect, Obsidian as the IDE, the three-layer stack with schema, wiki, and raw sources, and the ingest, query, lint architecture with zero-cost maintenance](/images/blog/karpathy-llm-wiki-idea-file/karpathy-llm-wiki-hero.png)

### Table of Contents

* [The Viral Moment](#the-viral-moment)
* [Idea Files: A New Format](#idea-files)
* [The Core Idea: Wiki > RAG](#core-idea)
* [Three-Layer Architecture](#three-layer-architecture)
* [Operations: Ingest, Query, Lint](#operations)
* [Indexing and Logging](#indexing-and-logging)
* [The Tool Stack](#tool-stack)
* [Use Cases Karpathy Lists](#use-cases)
* [Implementation Guide](#implementation-guide)
* [The Memex Connection (1945)](#memex-connection)
* [Community Ideas from Gist](#community-ideas)
* [What This Means](#what-this-means)
* [All Resources & Links](#resources)

On April 3, 2026, Andrej Karpathy — co-founder of OpenAI, former AI lead at Tesla, and the person who coined “vibe coding” — posted a tweet titled **“LLM Knowledge Bases”** describing how he now uses LLMs to build personal knowledge wikis instead of just generating code. That tweet went massively viral. The next day, he followed up with something new: an **“idea file”** — a GitHub gist that lays out the complete architecture, philosophy, and tooling behind the concept. We covered the original tweet in our [first article](/blog/karpathy-llm-knowledge-bases). This is the deep dive into the follow-up — every word, every tool, every implementation detail.

Get the latest on AI, LLMs & developer tools

New MCP servers, model updates, and guides like this one — delivered weekly.

Subscribe

### 🎬 Watch the Video Breakdown

Prefer reading? Keep scrolling for the full written guide with code examples.

## 1. The Viral Moment

The original tweet described Karpathy's shift from spending tokens on code to spending tokens on **knowledge**. He outlined a system where raw source documents (articles, papers, repos, datasets, images) get dropped into a `raw/` directory, and an LLM incrementally “compiles” them into a structured wiki — a collection of interlinked `.md` files with summaries, backlinks, and concept articles.

> LLM Knowledge Bases
>
> Something I'm finding very useful recently: using LLMs to build personal knowledge bases for various topics of research interest. In this way, a large fraction of my recent token throughput is going less into manipulating code, and more into manipulating…
>
> — Andrej Karpathy (@karpathy) [April 2, 2026](https://twitter.com/karpathy/status/2039805659525644595?ref_src=twsrc%5Etfw)

The tweet exploded. Karpathy himself acknowledged it: **“Wow, this tweet went very viral!”** So he did something interesting — instead of just sharing the code or the app, he shared an *idea file*.

> Wow, this tweet went very viral!
>
> I wanted share a possibly slightly improved version of the tweet in an “idea file”. The idea of the idea file is that in this era of LLM agents, there is less of a point/need of sharing the specific code/app, you just share the idea, then…
>
> — Andrej Karpathy (@karpathy) [April 4, 2026](https://twitter.com/karpathy/status/2040470801506541998?ref_src=twsrc%5Etfw)

The follow-up tweet links to a GitHub gist titled **“LLM Wiki”** — a carefully written document that describes the pattern, architecture, operations, and tooling at a conceptual level. It is not code. It is not an app. It is something new.

Read the Full Gist

Karpathy's complete idea file is available here: [gist.github.com/karpathy/442a6bf555914893e9891c11519de94f](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). You can copy it directly and paste it to your LLM agent to get started.

## 2. Idea Files: A New Format for the Agent Era

Karpathy introduces a concept he calls an **“idea file”**. His exact words:

Karpathy's Definition

“The idea of the idea file is that in this era of LLM agents, there is less of a point/need of sharing the specific code/app, you just share the idea, then the other person's agent customizes & builds it for your specific needs.”

This is a subtle but profound shift. Traditionally, when a developer builds something useful, they share the *implementation*: a GitHub repo, a package on npm, a Docker image. The recipient clones it, configures it, and runs it. But in a world where everyone has access to an LLM agent (Claude Code, OpenAI Codex, OpenCode, Cursor, etc.), sharing the *idea* can be more useful than sharing the code.

Why? Because the idea is portable. The code is specific. Karpathy uses Obsidian on macOS with Claude Code. You might use VS Code on Linux with OpenAI Codex. A shared GitHub repo would need to be forked, adapted, and debugged. A shared idea file gets copy-pasted to your agent, and **your agent builds a version customized to your exact setup**.

Karpathy says the gist is “intentionally kept a little bit abstract/vague because there are so many directions to take this in.” That's not a bug — it's the design. The document's last line says it plainly: **“The document's only job is to communicate the pattern. Your LLM can figure out the rest.”**

He also mentions that the gist has a Discussion tab where people can “adjust the idea or contribute their own,” turning it into a collaborative idea space. This is a new kind of open source — not open code, but **open ideas**, designed to be interpreted and instantiated by AI agents.

### How to Use the Idea File

Karpathy says you can **“give this to your agent and it can build you your own LLM wiki and guide you on how to use it.”** In practice, that means:

1. Copy the gist content (the full `llm-wiki.md` file)
2. Paste it into your LLM agent's context (Claude Code, Codex, OpenCode, or any agentic IDE)
3. Tell the agent: “Set up an LLM Wiki based on this idea file for [your topic]”
4. The agent will create the directory structure, write the schema file, and guide you through first ingestion

EXAMPLE: GIVING THE IDEA FILE TO YOUR AGENT

# In Claude Code, OpenCode, or any agentic IDE:

> Here is an idea file from Karpathy about building
> an LLM Wiki. I want to build one for [machine learning
> research / competitive analysis / book notes / etc.].
>
> [paste the full gist content]
>
> Please set up the directory structure, create the
> schema file (CLAUDE.md or AGENTS.md), and walk me
> through ingesting my first source docu