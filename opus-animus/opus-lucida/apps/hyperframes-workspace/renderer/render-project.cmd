@echo off
setlocal

if "%~1"=="" goto usage

set "PROJECT=%~1"
set "OUTPUT=%~2"
set "QUALITY=%~3"
if "%QUALITY%"=="" set "QUALITY=draft"

pushd "%~dp0.."
if "%OUTPUT%"=="" (
  node .\renderer\render-project.mjs --project "%PROJECT%" --quality "%QUALITY%" --workers 1
) else (
  node .\renderer\render-project.mjs --project "%PROJECT%" --output "%OUTPUT%" --quality "%QUALITY%" --workers 1
)
set "EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %EXIT_CODE%

:usage
echo Usage:
echo   renderer\render-project.cmd ^<project-dir^> [output-mp4] [quality]
echo.
echo Example:
echo   renderer\render-project.cmd generated\gpt56-work-ai-video-workflow
echo   Default output: D:\HyperFrames\output\gpt56-work-ai-video-workflow.mp4
exit /b 2
