@echo off
title Start ALMAGD Biometric Sync
cd /d "%~dp0"
set "SCRIPT_DIR=%~dp0"
set "VBS_FILE=%SCRIPT_DIR%run-silent.vbs"

if not exist "%VBS_FILE%" (
    call "%SCRIPT_DIR%install-windows.bat"
) else (
    wscript.exe "%VBS_FILE%"
    echo =======================================================
    echo [OK] ALMAGD Biometric Sync started in background!
    echo =======================================================
    timeout /t 3 >nul
)
