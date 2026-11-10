@echo off
setlocal
cd /d "%~dp0"
title ALMAGD Biometric Sync Setup
echo ALMAGD Biometric Sync - Setup
if not exist "%~dp0python\python.exe" (
    echo [ERROR] Bundled Python is missing. Extract the complete ZIP first.
    goto failed
)
"%~dp0python\python.exe" "%~dp0check-setup.py"
if errorlevel 1 goto failed
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-startup.ps1"
if errorlevel 1 goto failed
schtasks /delete /tn "AlmagdBiometricSync" /f >nul 2>&1
cscript.exe //nologo "%~dp0run-silent.vbs"
if errorlevel 1 goto failed
echo [OK] Startup registered and background launch requested.
echo Verify actual device collection and uploads in sync.log.
echo Automatic startup begins when this Windows account signs in.
pause
exit /b 0
:failed
echo [ERROR] Setup was not completed. Fix the message above and try again.
pause
exit /b 1
