@echo off
REM CS2 Skin Tracker - Secure Production Setup Launcher
REM This script runs the PowerShell setup in a way that secures key input

setlocal enabledelayedexpansion

echo.
echo ============================================
echo CS2 Skin Tracker - Production Setup
echo ============================================
echo.

cd /d "C:\Users\Arthur\Documents\Coding\CS2 Skin Tracker"

if not exist "setup-production-secrets.ps1" (
    echo ERROR: setup-production-secrets.ps1 not found
    echo Please ensure you're in the correct directory
    pause
    exit /b 1
)

REM Run PowerShell script with execution policy bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "setup-production-secrets.ps1"

if errorlevel 1 (
    echo.
    echo ERROR: Setup script failed
    echo Check the log file for details
    pause
    exit /b 1
)

echo.
echo ============================================
echo Setup Phase 1 Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Check the log file for any issues
echo 2. Wait for Vercel auto-deploy (check Vercel Dashboard)
echo 3. Run Phase 2: Vercel environment variables
echo.
pause
