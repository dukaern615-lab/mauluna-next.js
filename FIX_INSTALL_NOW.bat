@echo off
echo.
echo ========================================
echo   FIXING NPM INSTALLATION
echo ========================================
echo.
echo This will fix the memory error and install everything.
echo Please wait, this may take 5-10 minutes...
echo.

REM Step 1: Clear npm cache
echo Step 1: Clearing npm cache...
call npm cache clean --force
echo.

REM Step 2: Remove old files
echo Step 2: Removing old node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /q package-lock.json
echo.

REM Step 3: Set memory limit and install
echo Step 3: Installing with increased memory (4GB)...
echo This may take several minutes, please be patient...
echo.

REM Set Node.js memory limit to 8GB
set NODE_OPTIONS=--max-old-space-size=8192

REM Install with legacy peer deps to avoid conflicts
call npm install --legacy-peer-deps

echo.
echo ========================================
echo   INSTALLATION COMPLETE!
echo ========================================
echo.
echo Now you can run: npm run dev
echo.
pause

