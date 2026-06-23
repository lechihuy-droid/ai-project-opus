# Run this script manually once to register the local morning brief job.

$ErrorActionPreference = "Stop"

$TaskName = "opus-morning-brief"
$Python = "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Script = Join-Path $ProjectRoot "run_push_brief.py"

$Action = New-ScheduledTaskAction -Execute $Python -Argument "`"$Script`"" -WorkingDirectory $ProjectRoot
$Trigger = New-ScheduledTaskTrigger -Daily -At 7:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Primus one-way morning brief push to Telegram." -Force
