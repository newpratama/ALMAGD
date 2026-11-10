@echo off
setlocal
cd /d "%~dp0"
title Start ALMAGD Biometric Sync
if not exist "%~dp0python\python.exe" (
    echo [ERROR] Bundled Python is missing. Extract the complete ZIP first.
    goto failed
)
"%~dp0python\python.exe" "%~dp0check-setup.py"
if errorlevel 1 goto failed
cscript.exe //nologo "%~dp0run-silent.vbs"
if errorlevel 1 goto failed
echo [OK] Background launch requested. Verify collection and uploads in sync.log.
timeout /t 2 >nul
exit /b 0
:failed
echo [ERROR] Sync was not started. Fix setup first. See launcher.log if present.
pause
exit /b 1
