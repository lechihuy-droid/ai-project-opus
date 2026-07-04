@echo off
start "" "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" "C:\Users\HUY\workspace\ai-workspace\opus-animus\run_home.py"
timeout /t 2 /nobreak > nul
start "" "http://localhost:8765"
