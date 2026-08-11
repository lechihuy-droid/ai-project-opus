# Opens the Hub with its token already in the URL.
#
# Every request except /api/health needs X-Hub-Token (server.py). The page picks
# the token up from ?k=, stores it, and strips it from the address bar
# (web-v3/src/lib/api.ts). That store is sessionStorage, so it is per-tab: a new
# tab has no token and every call comes back 403 "missing hub token". This just
# rebuilds the URL so you do not have to go find the token each time.
param(
    [int]$Port = 8799,
    [switch]$PrintOnly
)

$ErrorActionPreference = 'Stop'
$tokenFile = Join-Path $PSScriptRoot 'runtime\store\hub-token'

if (-not (Test-Path $tokenFile)) {
    Write-Error "No token at $tokenFile. Start the hub once so it writes one, then run this again."
}

$token = (Get-Content $tokenFile -Raw).Trim()
if (-not $token) { Write-Error "Token file $tokenFile is empty." }

$url = "http://localhost:$Port/?k=$token"

if ($PrintOnly) { Write-Output $url } else { Start-Process $url }
