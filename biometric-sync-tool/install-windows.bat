@echo off
title ALMAGD Biometric Sync Setup
cd /d "%~dp0"

echo =======================================================
echo     ALMAGD Biometric Sync Bridge - Installation
echo =======================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "PYTHONW_BIN=%SCRIPT_DIR%python\pythonw.exe"

if not exist "%PYTHONW_BIN%" (
    where pythonw >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Python not found. Please ensure the python folder is present.
        pause
        exit /b 1
    )
    set "PYTHONW_BIN=pythonw"
)

echo [1/3] Creating background silent launcher...
set "VBS_FILE=%SCRIPT_DIR%run-silent.vbs"
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
echo WshShell.Run """%PYTHONW_BIN%"" ""%SCRIPT_DIR%sync.py""", 0, False
) > "%VBS_FILE%"

echo [2/3] Setting up auto-start with Windows...
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
if exist "%STARTUP_FOLDER%" (
    copy /y "%VBS_FILE%" "%STARTUP_FOLDER%\AlmagdBiometricSync.vbs" >nul
    echo [OK] Added to Windows Startup folder.
)

schtasks /delete /tn "AlmagdBiometricSync" /f >nul 2>&1
schtasks /create /tn "AlmagdBiometricSync" /tr "wscript.exe \"%VBS_FILE%\"" /sc onlogon /f >nul 2>&1

echo [3/3] Starting sync service in background now...
wscript.exe "%VBS_FILE%"

echo.
echo =======================================================
echo [SUCCESS] ALMAGD Biometric Sync installed successfully!
echo Service is now running silently in the background.
echo It will start automatically whenever Windows boots.
echo =======================================================
echo.
echo Press any key to close this window.
pause >nul
