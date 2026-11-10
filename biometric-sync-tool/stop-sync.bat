@echo off
setlocal
cd /d "%~dp0"
title Stop ALMAGD Biometric Sync
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop-sync.ps1"
set "SYNC_STOP_RESULT=%ERRORLEVEL%"
pause
exit /b %SYNC_STOP_RESULT%
