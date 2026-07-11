$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\HUY\workspace\ai-project-opus"
$ExpectedRoot = "C:/Users/HUY/workspace/ai-project-opus"
$AppsPath = "opus-animus/opus-lucida/apps"
$LucidaGitignore = "opus-animus/opus-lucida/.gitignore"
$RemotionTemplatesGit = "opus-animus\opus-lucida\apps\remotion-templates\.git"
$RemotionTemplatesOfflineGit = "opus-animus\opus-lucida\apps\remotion-templates\.git.offline"
$IgnoreLine = "apps/remotion-templates/.git.offline/"

Set-Location -LiteralPath $ProjectRoot

$root = (git rev-parse --show-toplevel).Trim()
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

git add -- $AppsPath $LucidaGitignore

$staged = git diff --cached --name-only
if ($staged) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
  git commit -m "autosync lucida apps: $timestamp"
}

git fetch origin
git merge origin/main
git push origin main
