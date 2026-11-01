@echo off
title Start ALMAGD Biometric Sync
cd /d "%~dp0"
start "" wscript.exe "%~dp0run-silent.vbs"
echo =======================================================
echo [OK] ALMAGD Biometric Sync started in background!
echo =======================================================
timeout /t 2 >nul
