# Drives the Version Governance stack from the main clone, wherever you run it.
#
# Two things only exist in the main checkout, and both break quietly from a
# git worktree:
#   - .git there is a real directory. In a worktree it is a file holding an
#     absolute Windows path, which means nothing inside a Linux container, so
#     resolve_commit fails with "Cannot resolve git ref: HEAD".
#   - deploy/.env is gitignored, so a worktree never receives it. Compose then
#     substitutes empty strings and postgres initialises with a blank password.
#
# docker compose -f <path> takes its project directory from the compose file,
# so pointing at the main clone fixes both at once. This script finds that
# clone so nobody has to type the path correctly every time.
param(
    [ValidateSet('up', 'down', 'status', 'logs', 'path')]
    [string]$Action = 'up',
    [switch]$Wipe
)

$ErrorActionPreference = 'Stop'

# From <clone>/harness/version-governance, walk up to the checkout root, then
# out of .claude/worktrees/<name> if that is where we started.
$root = (Get-Item $PSScriptRoot).Parent.Parent.FullName
if ($root -match '\\\.claude\\worktrees\\[^\\]+$') {
    $root = (Get-Item $root).Parent.Parent.Parent.FullName
}

$compose = Join-Path $root 'harness\version-governance\deploy\docker-compose.yml'
$envFile = Join-Path $root 'harness\version-governance\deploy\.env'

if (-not (Test-Path $compose)) { Write-Error "No compose file at $compose" }
if (-not (Test-Path (Join-Path $root '.git') -PathType Container)) {
    Write-Error "$root has no real .git directory - that is the checkout this stack must run from, not a worktree."
}
if (-not (Test-Path $envFile)) {
    Write-Error "No $envFile. Copy deploy/.env.example and fill it in; do not create one inside a worktree."
}

switch ($Action) {
    'path'   { Write-Output $root }
    'status' { docker compose -f $compose ps }
    'logs'   { docker compose -f $compose logs --tail 40 }
    'down'   {
        # -v also drops the postgres and minio volumes, so seeded data goes too.
        if ($Wipe) { docker compose -f $compose down -v } else { docker compose -f $compose down }
    }
    'up'     {
        docker compose -f $compose up -d --build
        Write-Output ''
        Write-Output "Stack rooted at $root"
        Write-Output 'Check health: curl http://localhost:8810/health'
    }
}
