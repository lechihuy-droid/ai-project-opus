@echo off
start "" "C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe" "C:\Users\HUY\AI\OPUS ANIMUS\opus-consilium\run_dashboard.py"
timeout /t 2 /nobreak > nul
start "" "http://localhost:8765"
