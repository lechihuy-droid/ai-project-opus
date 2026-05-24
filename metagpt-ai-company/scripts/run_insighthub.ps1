$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$ExistingPath = Join-Path $ProjectRoot "workspace\workspace (2)\workspace"
$PromptPath = Join-Path $ProjectRoot "prompts\insighthub_mvp.txt"

if (!(Test-Path $VenvPython)) {
    throw "Venv not found. Run .\scripts\install.ps1 first."
}

if (!(Test-Path $ExistingPath)) {
    throw "Uploaded workspace not found: $ExistingPath"
}

if (!(Test-Path $PromptPath)) {
    throw "Prompt not found: $PromptPath"
}

$Idea = Get-Content -LiteralPath $PromptPath -Raw

& $VenvPython scripts\run_company.py `
    --existing-path $ExistingPath `
    --incremental `
    --idea $Idea `
    --project-name "insighthub_agent_mvp" `
    --rounds 5 `
    --investment 3

if ($LASTEXITCODE -ne 0) {
    throw "MetaGPT run failed."
}
