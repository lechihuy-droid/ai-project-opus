Orchestrate a Codex implementation run for the current phase.

Steps:
1. Read the latest handoff file matching `docs/handoff-codex-*.md` (most recently modified)
2. Run `git pull origin $(git branch --show-current)` to ensure we're up to date
3. Extract the "Next action" and "BD file" from the handoff
4. Run Codex with full-auto approval:
   ```
   codex exec --approval-mode full-auto "$(cat <BD_FILE>)"
   ```
   If `$args` is provided, use it as the instruction instead
5. After Codex exits, run:
   - `git pull origin $(git branch --show-current)` to get Codex's commits
   - JS syntax check: `node -e "const fs=require('fs');const h=fs.readFileSync('health-app/dashboard.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);new Function(m[1]);console.log('JS OK');"`
   - `git log --oneline -5` to see what Codex committed
   - `git diff --stat HEAD~3..HEAD` to summarize changes
6. Report: what passed, what failed, any scope creep vs BD spec
7. Ask: "Push to origin? (y/n)" before pushing
