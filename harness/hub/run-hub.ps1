$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$python = Join-Path $root ".ih\Scripts\python.exe"
$server = Join-Path $root "harness\hub\server.py"
$hubToken = & $python -c "import sys; sys.path.insert(0, r'$($root.Path)\harness\hub'); import config; print(config.HUB_TOKEN, end='')"
Write-Host "Hub UI: http://127.0.0.1:8799/?k=$hubToken"

& $python $server
