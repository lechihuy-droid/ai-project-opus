$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Python311 = "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe"
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$MetaGPTRepo = Resolve-Path (Join-Path $ProjectRoot "..\MetaGPT")
$ShortTemp = Resolve-Path (New-Item -ItemType Directory -Force -Path (Join-Path $ProjectRoot "..\.tmp"))

$env:TEMP = $ShortTemp
$env:TMP = $ShortTemp

if (!(Test-Path $Python311)) {
    throw "Python 3.11 not found at $Python311"
}

if (!(Test-Path $VenvPython)) {
    & $Python311 -m venv (Join-Path $ProjectRoot ".venv")
    if ($LASTEXITCODE -ne 0) { throw "Failed to create virtual environment." }
}

& $VenvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "Failed to upgrade pip." }

& $VenvPython -m pip install --no-cache-dir -e $MetaGPTRepo
if ($LASTEXITCODE -ne 0) { throw "Failed to install MetaGPT dependencies." }

Write-Host "MetaGPT environment is ready."
Write-Host "Run: .\.venv\Scripts\python.exe scripts\run_company.py --idea `"Create a 2048 game`" --project-name game_2048"
