@echo off
chcp 65001 >nul
title تشغيل مزامنة البصمة
set SCRIPT_DIR=%~dp0
set VBS_LAUNCHER=%SCRIPT_DIR%run-silent.vbs

if not exist "%VBS_LAUNCHER%" (
    call "%SCRIPT_DIR%install-windows.bat"
) else (
    wscript.exe "%VBS_LAUNCHER%"
    echo =======================================================
    echo  [✓] تم تشغيل أداة مزامنة البصمة في الخلفية بنجاح!
    echo =======================================================
    timeout /t 3 >nul
)
