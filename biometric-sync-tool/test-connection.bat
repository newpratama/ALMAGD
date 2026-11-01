@echo off
title Test Connection - ALMAGD Biometric Device
cd /d "%~dp0"
set "SCRIPT_DIR=%~dp0"

if exist "%SCRIPT_DIR%python\python.exe" (
    "%SCRIPT_DIR%python\python.exe" "%SCRIPT_DIR%test-device.py"
) else (
    python "%SCRIPT_DIR%test-device.py"
)

echo.
echo =======================================================
echo Press any key to close.
echo =======================================================
pause >nul
