@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0python\python.exe" (
    echo [ERROR] Bundled Python is missing. Extract the complete ZIP first.
    pause
    exit /b 1
)
"%~dp0python\python.exe" "%~dp0check-setup.py"
set "SYNC_CHECK_RESULT=%ERRORLEVEL%"
pause
exit /b %SYNC_CHECK_RESULT%
