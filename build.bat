@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ======================================================
echo          Website Build Tool
echo ======================================================
echo.

set /p VERSION="Version (default: 1.0.0): "
if "!VERSION!"=="" set VERSION=1.0.0

set /p BUILDER="Builder Name (default: Admin): "
if "!BUILDER!"=="" set BUILDER=Admin

echo.
echo Select Build Mode:
echo   1. user (normal)
echo   2. userdebug (debug)
echo.
set /p BUILD_MODE="Option (1 or 2): "

if "!BUILD_MODE!"=="1" (
    set BUILD_ENV=production
    set MODE=user
) else if "!BUILD_MODE!"=="2" (
    set BUILD_ENV=userdebug
    set MODE=userdebug
) else (
    echo Invalid option, using user mode
    set BUILD_ENV=production
    set MODE=user
)

echo.
echo ======================================================
echo Build Info:
echo   Version:   !VERSION!
echo   Builder:   !BUILDER!
echo   Mode:      !MODE!
echo   Env:       !BUILD_ENV!
echo ======================================================
echo.

set /p CONFIRM="Confirm build (Y/N): "
if /i not "!CONFIRM!"=="Y" (
    echo Build cancelled
    pause
    exit /b
)

echo.
echo Building...
echo.

if "!MODE!"=="user" (
    call npx cross-env VERSION=!VERSION! BUILDER=!BUILDER! BUILD_ENV=!BUILD_ENV! vite build
) else (
    call npx cross-env VERSION=!VERSION! BUILDER=!BUILDER! BUILD_ENV=!BUILD_ENV! vite build --mode userdebug
)

if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo Build Success!
    echo Output: dist\
    echo.
    echo Preview with:
    echo   npm run preview
    echo ======================================================
) else (
    echo.
    echo ======================================================
    echo Build Failed!
    echo ======================================================
)

echo.
pause
