@echo off
cd /d "%~dp0"
if not exist caddy.exe (
    echo [ERROR] caddy.exe not found in this folder.
    echo Download from https://caddyserver.com/download ^(Windows amd64, "Standard" build^)
    echo then copy caddy.exe next to this .bat file.
    pause
    exit /b 1
)
start "" http://localhost:8000/
echo ============================================
echo  PMP Quiz App - running at localhost:8000
echo  Close this window to stop the server.
echo ============================================
caddy.exe file-server --listen :8000 --root .
