# Giao 3 brief P0 cho Codex, tuần tự.
# Chạy từ repo root: .\harness\docs\codex-briefs\run-p0.ps1
#
# P0.1 và P0.2 phải cùng nhánh — P0.2 giả định đã có auth.
# P0.3 độc lập, chạy lúc nào cũng được.
#
# Script dừng lại sau mỗi brief để Opus review trước khi sang bước sau.
# Đừng chạy cả 3 rồi mới xem — mỗi bước chạm execution path.

$ErrorActionPreference = "Stop"
$briefDir = Join-Path $PSScriptRoot ""

$order = @(
    "P0.1-auth-token.md",
    "P0.2-hook-allowlist.md",
    "P0.3-runner-default-deny.md"
)

foreach ($name in $order) {
    $path = Join-Path $briefDir $name
    if (-not (Test-Path $path)) { throw "Không thấy brief: $path" }

    Write-Host ""
    Write-Host "=== $name ===" -ForegroundColor Cyan
    Write-Host ""

    $brief = Get-Content -Raw -Encoding UTF8 $path
    codex exec $brief

    Write-Host ""
    Write-Host "$name xong. Review diff trước khi tiếp." -ForegroundColor Yellow
    $answer = Read-Host "Tiếp brief sau? (y/N)"
    if ($answer -ne "y") {
        Write-Host "Dừng theo yêu cầu." -ForegroundColor Yellow
        break
    }
}
