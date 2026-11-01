@echo off
title ALMAGD Biometric Sync Setup
cd /d "%~dp0"

echo =======================================================
echo     ALMAGD Biometric Sync Bridge - Installation
echo =======================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "VBS_FILE=%SCRIPT_DIR%run-silent.vbs"

echo [1/2] Setting up auto-start with Windows...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AlmagdBiometricSync.lnk\"); $s.TargetPath = \"wscript.exe\"; $s.Arguments = \"`\"%~dp0run-silent.vbs`\"\"; $s.WorkingDirectory = \"`\"%~dp0`\"\"; $s.WindowStyle = 7; $s.Save()" >nul 2>&1

schtasks /delete /tn "AlmagdBiometricSync" /f >nul 2>&1
schtasks /create /tn "AlmagdBiometricSync" /tr "wscript.exe \"%VBS_FILE%\"" /sc onlogon /f >nul 2>&1

echo [2/2] Starting sync service in background now...
start "" wscript.exe "%VBS_FILE%"

echo.
echo =======================================================
echo [SUCCESS] ALMAGD Biometric Sync installed successfully!
echo Service is now running silently in the background.
echo It will start automatically whenever Windows boots.
echo =======================================================
echo.
echo Press any key to close this window.
pause >nul
