# Opens the Hub with its token already in the URL.
#
# Every request except /api/health needs X-Hub-Token (server.py). The page picks
# the token up from ?k=, stores it, and strips it from the address bar
# (web-v3/src/lib/api.ts). That store is localStorage, so one visit is normally
# enough -- use this after clearing browser storage, on a fresh profile, or when
# the server has written a new token.
#
# -Hostname matters more than it looks: localStorage is keyed by origin, and the
# browser treats http://localhost:8799 and http://127.0.0.1:8799 as two of them.
# Seeding one leaves the other answering 403 to every call. Open the hub the same
# way every time, or seed each spelling once.
#
# (Named Hostname, not Host: $Host is a PowerShell automatic variable and a
# param of that name fails to bind.)
param(
    [string]$Hostname = 'localhost',
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

$url = "http://${Hostname}:$Port/?k=$token"

if ($PrintOnly) { Write-Output $url } else { Start-Process $url }
