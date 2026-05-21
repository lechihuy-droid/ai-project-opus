#requires -Version 5.1
<#
  run-codex.ps1 - Drive Codex CLI through the InsightHub build (MetaGPT SOP).

  Stages:
    w0     TASK-W0   freeze contracts + dump ProjectState        (sequential)
    wave1  TASK-SA1 / SA2 / SA3 - run in parallel as 3 jobs
    w2     TASK-W2   reporting spine + wiring + integration QA   (sequential)
    all    w0 then wave1 then w2

  Usage:
    .\run-codex.ps1 w0
    .\run-codex.ps1 wave1
    .\run-codex.ps1 w2
    .\run-codex.ps1 all
    .\run-codex.ps1 all -Model gpt-5-codex
    .\run-codex.ps1 all -CodexFlags "--dangerously-bypass-approvals-and-sandbox"
    .\run-codex.ps1 all -NoCommit

  Wave 1 writes per-job logs to sa1.log / sa2.log / sa3.log in the repo root.
  Follow one live with:  Get-Content sa2.log -Wait
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet("w0", "wave1", "w2", "all")]
    [string]$Stage = "all",
    [string]$Model = "",
    [string]$CodexFlags = "--full-auto",
    [switch]$NoCommit
)

$ErrorActionPreference = "Stop"
$Repo = "C:\Users\HUY\AI\metagpt-ai-company\insighthub"

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "codex CLI not found. Install with: npm install -g @openai/codex"
}
Set-Location $Repo

function Get-CodexArgs {
    param([string]$Brief)
    $prompt = "Read and fully execute $Brief in this repository. " +
        "Treat docs/system_design.md as the contract source of truth. " +
        "Only create or edit files that belong to this task; do not touch other streams files. " +
        "Run the commands in the task Definition of Done to self-verify before finishing."
    $list = @("exec")
    $list += $CodexFlags.Split(" ", [System.StringSplitOptions]::RemoveEmptyEntries)
    if ($Model) { $list += @("-m", $Model) }
    $list += $prompt
    return , $list
}

function Invoke-Task {
    param([string]$Name, [string]$Brief)
    Write-Host "`n=== $Name : $Brief ===" -ForegroundColor Cyan
    $codexArgs = Get-CodexArgs $Brief
    & codex @codexArgs
    if ($LASTEXITCODE -ne 0) { throw "$Name failed (codex exit code $LASTEXITCODE)" }
    Write-Host "=== $Name finished ===" -ForegroundColor Green
}

function Save-Commit {
    param([string]$Message)
    if ($NoCommit) { return }
    git add -A -- .
    git commit -m $Message
    Write-Host "git commit: $Message" -ForegroundColor DarkGray
}

function Invoke-Wave1 {
    Write-Host "`n=== WAVE 1 : SA-1 / SA-2 / SA-3 (parallel) ===" -ForegroundColor Cyan
    $specs = @(
        @{ Name = "SA-1"; Brief = "docs/tasks/TASK-SA1-data-mcp.md";  Log = "sa1.log" }
        @{ Name = "SA-2"; Brief = "docs/tasks/TASK-SA2-reconcile.md"; Log = "sa2.log" }
        @{ Name = "SA-3"; Brief = "docs/tasks/TASK-SA3-output.md";    Log = "sa3.log" }
    )
    $jobs = foreach ($s in $specs) {
        $codexArgs = Get-CodexArgs $s.Brief
        $logPath = Join-Path $Repo $s.Log
        Write-Host "  launching $($s.Name)  ->  $($s.Log)" -ForegroundColor Yellow
        Start-Job -Name $s.Name -ScriptBlock {
            param($repo, $codexArgs, $logPath)
            Set-Location $repo
            & codex @codexArgs *> $logPath
        } -ArgumentList $Repo, $codexArgs, $logPath
    }
    Write-Host "  follow a log live, e.g.:  Get-Content sa2.log -Wait" -ForegroundColor DarkGray
    $null = $jobs | Wait-Job
    foreach ($j in $jobs) {
        $color = "Yellow"
        if ($j.State -eq "Completed") { $color = "Green" }
        elseif ($j.State -eq "Failed") { $color = "Red" }
        Write-Host "  $($j.Name): $($j.State)" -ForegroundColor $color
    }
    $jobs | Remove-Job
    Write-Host "=== WAVE 1 finished - review sa1/sa2/sa3.log + each task Definition of Done ===" -ForegroundColor Green
}

switch ($Stage) {
    "w0" {
        Invoke-Task "W0" "docs/tasks/TASK-W0-contracts.md"
        Save-Commit "W0: freeze contracts + dump ProjectState"
    }
    "wave1" {
        Invoke-Wave1
        Save-Commit "Wave 1: data/MCP + reconcile + output"
    }
    "w2" {
        Invoke-Task "W2" "docs/tasks/TASK-W2-reporting.md"
        Save-Commit "W2: reporting spine + integration"
    }
    "all" {
        Invoke-Task "W0" "docs/tasks/TASK-W0-contracts.md"
        Save-Commit "W0: freeze contracts + dump ProjectState"
        Invoke-Wave1
        Save-Commit "Wave 1: data/MCP + reconcile + output"
        Invoke-Task "W2" "docs/tasks/TASK-W2-reporting.md"
        Save-Commit "W2: reporting spine + integration"
    }
}

Write-Host "`nStage '$Stage' complete." -ForegroundColor Green
