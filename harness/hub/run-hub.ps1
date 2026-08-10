$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$python = Join-Path $root ".ih\Scripts\python.exe"
$server = Join-Path $root "harness\hub\server.py"

$token = & $python -c "import sys; sys.path.insert(0, r'$PSScriptRoot'); import config; print(config.HUB_TOKEN)"
Write-Host "http://127.0.0.1:8799/?k=$token"

& $python $server
