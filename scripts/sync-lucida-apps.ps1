$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\HUY\workspace\ai-project-opus"
$ExpectedRoot = "C:/Users/HUY/workspace/ai-project-opus"
$AppsPath = "opus-animus/opus-lucida/apps"
$LucidaGitignore = "opus-animus/opus-lucida/.gitignore"
$RemotionTemplatesGit = "opus-animus\opus-lucida\apps\remotion-templates\.git"
$RemotionTemplatesOfflineGit = "opus-animus\opus-lucida\apps\remotion-templates\.git.offline"
$IgnoreLine = "apps/remotion-templates/.git.offline/"

function Invoke-Git {
  git @args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

Set-Location -LiteralPath $ProjectRoot

$root = (Invoke-Git rev-parse --show-toplevel).Trim()
if ($root -ne $ExpectedRoot) {
  throw "Refusing to run git outside expected repo. Got: $root"
}

if (Test-Path -LiteralPath $RemotionTemplatesGit) {
  if (Test-Path -LiteralPath $RemotionTemplatesOfflineGit) {
    throw "Both .git and .git.offline exist under remotion-templates. Resolve manually before autosync."
  }

  Move-Item -LiteralPath $RemotionTemplatesGit -Destination $RemotionTemplatesOfflineGit
}

if (Test-Path -LiteralPath $RemotionTemplatesOfflineGit) {
  $ignoreText = ""
  if (Test-Path -LiteralPath $LucidaGitignore) {
    $ignoreText = Get-Content -LiteralPath $LucidaGitignore -Raw
  }

  if ($ignoreText -notmatch [regex]::Escape($IgnoreLine)) {
    Add-Content -LiteralPath $LucidaGitignore -Value $IgnoreLine
  }
}

Invoke-Git add -- $AppsPath $LucidaGitignore

$staged = Invoke-Git diff --cached --name-only
if ($staged) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
  Invoke-Git commit -m "autosync lucida apps: $timestamp"
}

Invoke-Git fetch origin
Invoke-Git merge origin/main
Invoke-Git push origin main
