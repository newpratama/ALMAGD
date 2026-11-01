@echo off
chcp 65001 >nul
echo =======================================================
echo     ALMAGD Biometric Sync Bridge - تثبيت خدمة المزامنة
echo =======================================================
echo.
echo [1/3] جاري فحص بيئة بايثون (Python)...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [تنبيه] لم يتم العثور على بايثون. يرجى تثبيت Python 3 من python.org
    echo وتأكد من تفعيل خيار "Add Python to PATH" أثناء التثبيت.
    pause
    exit /b 1
)

echo [2/3] جاري تثبيت مكتبة الاتصال بجهاز البصمة (pyzk)...
python -m pip install pyzk --quiet

echo [3/3] جاري تسجيل الخدمة لتعمل في الخلفية تلقائياً مع تشغيل الويندوز...
set SCRIPT_DIR=%~dp0
set PYTHONW_CMD=pythonw "%SCRIPT_DIR%sync.py"

REM حذف المهمة القديمة إن وجدت
schtasks /delete /tn "AlmagdBiometricSync" /f >nul 2>&1

REM إنشاء مهمة مجدولة تعمل عند تشغيل الويندوز بدون أي نوافذ سوداء
schtasks /create /tn "AlmagdBiometricSync" /tr "%PYTHONW_CMD%" /sc onstart /delay 0000:30 /ru SYSTEM /f >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo    تم التثبيت بنجاح! 
    echo    الخدمة تعمل الآن تلقائياً في الخلفية وبشكل صامت.
    echo =======================================================
) else (
    REM محاولة بديلة في حال عدم توفر صلاحيات المسؤول
    schtasks /create /tn "AlmagdBiometricSync" /tr "%PYTHONW_CMD%" /sc onlogon /f >nul 2>&1
    echo [نجاح] تم تسجيل الخدمة لتعمل تلقائياً عند تسجيل الدخول.
)

REM تشغيل الخدمة الآن فوراً
start "" %PYTHONW_CMD%

echo.
echo تم تشغيل المزامنة بنجاح! يمكنك إغلاق هذه النافذة الآن.
pause
