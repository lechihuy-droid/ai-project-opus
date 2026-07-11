# Template Taxonomy

Source of truth:

```text
apps/remotion-templates/template-catalog.json
```

Mapper must choose a cataloged `templateId`, not an informal archetype.

## Core TemplateId Mapping

| Intent | Prefer TemplateIds | Avoid When |
|---|---|---|
| Hook | `cinematic-title-intro`, `chapter-title`, `title-split`, `glitch-text` | Scene needs multiple relationships |
| Repo/code reveal | `code-panel`, `typewriter-subtitle`, `animated-text`, `text-highlight` | Code is incidental |
| Comparison | `split-screen`, `comparison-chart`, `image-comparison-slider` | More than two sides are needed |
| Ordered process | `progress-steps` | Steps are parallel |
| Entity relationships | `diagram` | No real links/edges exist |
| List/pattern | `animated-list`, `progress-steps`, `notification-pop` | Items need causal arrows |
| Use cases | `rotating-carousel`, `gallery-grid`, `photo-stack`, `image-carousel` | Items are abstract principles |
| Stats | `stat-counter`, `progress-bars`, `chart-animation` | No numeric content exists |
| Quote/takeaway | `quote-card`, `text-highlight` | New concepts are still being introduced |
| CTA | `end-card`, `subscribe-reminder` | The scene still teaches new content |

## Quick Mapping

```text
question hook -> cinematic-title-intro
surprising sentence -> title-split or glitch-text
three errors -> animated-list or notification-pop
old method vs new method -> split-screen
step 1/2/3 -> progress-steps
Claude -> workflow -> subagents -> diagram if links matter
agent network with peer review -> diagram
JavaScript workflow explanation -> code-panel
three patterns -> animated-list
three real applications -> rotating-carousel
three final takeaways -> end-card
```

## Density Budget

```text
low: 1 headline + 1 subtitle + 1 motif
medium: 3 cards or 4 nodes
high: 5 cards/nodes max, only if scene duration >= 7 seconds
```
