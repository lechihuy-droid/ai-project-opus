# Consilium Review Workflow

Purpose: make Consilium a decision workspace, not a news archive.

This workflow is for ChatGPT or Codex runs that read the vault, update the smallest useful Markdown surface, and commit the result back to GitHub.

## Daily Review

Goal: decide whether today's signals change any active belief, roadmap, thesis, or open question.

Read in this order:

```text
README.md
AGENTS.md
personal-wiki/Personal/wiki-chat-protocol.md
personal-wiki/Personal/current-beliefs.md
personal-wiki/Personal/open-questions.md
personal-wiki/Personal/decisions.md
personal-wiki/Personal/active-project-context.md
personal-wiki/AI/ai-trend-radar.md
personal-wiki/Personal/reskill-roadmap.md
personal-wiki/Stock/investment-theses.md
personal-wiki/Research/intel-to-wiki-promotion.md
```

Then inspect only the source or seed pages needed to support the decision.

Daily output:

```text
1. What changed
2. Why it matters
3. What to update
4. What to ignore
5. Decision label: keep | change | test | ignore | research
6. Changed files
7. Commit hash
```

Daily edit rule:

- Prefer one small update to `personal-wiki/AI/ai-trend-radar.md`.
- If the signal affects Huy's actions, update `personal-wiki/Personal/reskill-roadmap.md`.
- If it affects durable worldview, update `personal-wiki/Personal/current-beliefs.md`.
- If it affects capital allocation, update `personal-wiki/Stock/investment-theses.md`.
- If uncertainty is still high, update `personal-wiki/Personal/open-questions.md`.
- Do not create a new page unless a hub page would become confusing without it.

## Weekly Review

Goal: promote repeated signals into beliefs, questions, roadmap moves, and investment theses.

Read the same daily load order, then inspect the week's changed source, seed, and hub pages.

Weekly output:

```text
1. Signals promoted
2. Beliefs changed
3. Roadmap changes
4. Investment thesis changes
5. Questions closed or opened
6. Ignored noise
7. Decision label: keep | change | test | ignore | research
8. Changed files
9. Commit hash
```

Weekly edit rule:

- Update `personal-wiki/Personal/current-beliefs.md` when repeated evidence changes a durable belief.
- Update `personal-wiki/Personal/open-questions.md` when a question is answered, reframed, or newly important.
- Update `personal-wiki/Personal/reskill-roadmap.md` when Huy's learning priority changes.
- Update `personal-wiki/Stock/investment-theses.md` when evidence changes thesis strength, risk, or watchlist priority.
- Update `personal-wiki/AI/ai-trend-radar.md` when a signal moves between watch, test, and ignore.

## Commit Rules

Before editing:

```text
git pull --ff-only
```

After editing:

```text
git status --short
git add <changed markdown files>
git commit -m "Update Consilium review"
git push origin main
```

If there are no meaningful changes, do not commit. Return the reason and decision label `keep` or `ignore`.

## ChatGPT Prompt

```text
Use opus-consilium.
Read lechihuy-droid/opus-consilium.
Follow workflows/consilium-review.md.

Run the [daily|weekly] review.
Update only the smallest necessary Markdown page or pages.
Do not create a new top-level folder unless personal-wiki/SCHEMA.md and personal-wiki/INDEX.md are updated in the same commit.
Commit and push to main if, and only if, the vault changed.

Return:
1. What changed
2. What it means
3. Changed files
4. Commit hash, or "no commit"
5. Decision label
```
