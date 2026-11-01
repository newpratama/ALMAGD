@echo off
chcp 65001 >nul
title ALMAGD Biometric Sync - تثبيت خدمة المزامنة لجهاز الاستقبال

echo ====================================================================
echo     ALMAGD Biometric Sync Bridge - نظام مزامنة البصمة
echo ====================================================================
echo.

set SCRIPT_DIR=%~dp0
set PYTHONW_BIN=""
set PYTHON_BIN=""

REM 1. فحص بايثون المدمج في المجلد
if exist "%SCRIPT_DIR%python\pythonw.exe" (
    set PYTHONW_BIN="%SCRIPT_DIR%python\pythonw.exe"
    set PYTHON_BIN="%SCRIPT_DIR%python\python.exe"
    echo [✓] تم العثور على محرك بايثون المدمج المحمول داخل المجلد.
    goto SETUP_TASK
)

REM 2. فحص بايثون النظام
where pythonw >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHONW_BIN=pythonw
    set PYTHON_BIN=python
    echo [✓] تم العثور على بايثون النظام.
    goto SETUP_TASK
)

where python >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHONW_BIN=pythonw
    set PYTHON_BIN=python
    echo [✓] تم العثور على بايثون النظام.
    goto SETUP_TASK
)

echo [تنبيه] لم يتم العثور على بايثون. يرجى التأكد من وجود مجلد python داخل هذه الحزمة.
pause
exit /b 1

:SETUP_TASK
echo.
echo [1/3] إنشاء مشغل صامت بدون أي نوافذ (Silent Background Runner)...

REM إنشاء ملف VBS للتشغيل الخفي التام
set VBS_LAUNCHER=%SCRIPT_DIR%run-silent.vbs
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
echo WshShell.Run "%PYTHONW_BIN% ""%SCRIPT_DIR%sync.py""", 0, False
) > "%VBS_LAUNCHER%"

echo [2/3] تسجيل التشغيل التلقائي مع إقلاع ويندوز...

REM 1. محاولة التسجيل في Task Scheduler
schtasks /delete /tn "AlmagdBiometricSync" /f >nul 2>&1
schtasks /create /tn "AlmagdBiometricSync" /tr "wscript.exe \"%VBS_LAUNCHER%\"" /sc onlogon /f >nul 2>&1

REM 2. إضافة المشغل في مجلد بدء التشغيل التلقائي للمستخدم (Startup Folder) كضمان إضافي
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_DIR%" (
    copy /y "%VBS_LAUNCHER%" "%STARTUP_DIR%\AlmagdBiometricSync.vbs" >nul 2>&1
    echo [✓] تم إضافة الخدمة في مجلد بدء التشغيل التلقائي بنجاح.
)

echo [3/3] تشغيل خدمة المزامنة الآن فوراً في الخلفية...
wscript.exe "%VBS_LAUNCHER%"

echo.
echo ====================================================================
echo     تهانينا! تم تثبيت أداة المزامنة بنجاح تام!
echo     - الأداة تعمل الآن بصمت في الخلفية.
echo     - ستبدأ تلقائياً في كل مرة يشتغل فيها جهاز كمبيوتر الاستقبال.
echo     - تحفظ البصمات محلياً وترفعها فوراً لسحابة المجد.
echo ====================================================================
echo.
echo اضغط أي زر لإغلاق هذه النافذة.
pause >nul
