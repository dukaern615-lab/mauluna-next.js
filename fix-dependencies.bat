@echo off
echo.
echo ========================================
echo   Fixing Dependencies
echo ========================================
echo.
echo Step 1: Removing old node_modules...
if exist node_modules rmdir /s /q node_modules
echo.
echo Step 2: Removing package-lock.json...
if exist package-lock.json del /q package-lock.json
echo.
echo Step 3: Installing fresh dependencies...
echo This may take a few minutes, please wait...
echo.
npm install
echo.
echo ========================================
echo   Dependencies Fixed!
echo ========================================
echo.
echo Now you can run: npm run dev
echo.
pause

