@echo off
setlocal
cd /d "%~dp0"
title Test Connection - ALMAGD Biometric Device
chcp 65001 >nul
set "PYTHONUTF8=1"
if not exist "%~dp0python\python.exe" (
    echo [ERROR] Bundled Python is missing. Extract the complete ZIP first.
    pause
    exit /b 1
)
"%~dp0python\python.exe" "%~dp0test-device.py"
set "SYNC_TEST_RESULT=%ERRORLEVEL%"
echo.
echo Press any key to close.
pause >nul
exit /b %SYNC_TEST_RESULT%
