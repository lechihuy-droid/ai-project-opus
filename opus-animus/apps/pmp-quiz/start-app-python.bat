@echo off
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found on PATH.
    echo Install from https://www.python.org/downloads/ and tick
    echo "Add python.exe to PATH" during setup.
    pause
    exit /b 1
)
start "" http://localhost:8000/
echo ============================================
echo  PMP Quiz App - running at localhost:8000
echo  Close this window to stop the server.
echo ============================================
python -m http.server 8000
