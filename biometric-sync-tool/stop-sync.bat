@echo off
title Stop ALMAGD Biometric Sync
cd /d "%~dp0"
echo Stopping ALMAGD Biometric Sync service...
taskkill /f /im pythonw.exe >nul 2>&1
echo =======================================================
echo [OK] Sync service stopped successfully.
echo =======================================================
pause
