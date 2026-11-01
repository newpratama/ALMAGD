@echo off
chcp 65001 >nul
title فحص الاتصال بجهاز البصمة
set SCRIPT_DIR=%~dp0

if exist "%SCRIPT_DIR%python\python.exe" (
    "%SCRIPT_DIR%python\python.exe" "%SCRIPT_DIR%test-device.py"
) else (
    python "%SCRIPT_DIR%test-device.py"
)

echo.
echo =======================================================
echo اضغط أي زر للإغلاق.
echo =======================================================
pause >nul
