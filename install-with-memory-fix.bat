@echo off
echo.
echo ========================================
echo   Installing Dependencies (With Memory Fix)
echo ========================================
echo.
echo This will fix the memory error and install everything.
echo Please wait, this may take 5-10 minutes...
echo.

REM Set Node.js memory limit to 8GB
set NODE_OPTIONS=--max-old-space-size=8192

REM Remove old node_modules if exists
if exist node_modules (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)

REM Remove package-lock.json if exists
if exist package-lock.json (
    echo Removing old package-lock.json...
    del /q package-lock.json
)

echo.
echo Installing dependencies with increased memory...
echo.

REM Install with increased memory
npm install

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Now you can run: npm run dev
echo.
pause




