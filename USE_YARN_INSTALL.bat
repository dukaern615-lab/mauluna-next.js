@echo off
echo.
echo ========================================
echo   INSTALLING WITH YARN (Alternative)
echo ========================================
echo.
echo This uses Yarn instead of npm, which handles memory better.
echo.

REM Check if yarn is installed
where yarn >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Yarn is not installed. Installing yarn first...
    call npm install -g yarn
    echo.
)

REM Remove old files
echo Removing old node_modules...
if exist node_modules rmdir /s /q node_modules
if exist yarn.lock del /q yarn.lock
echo.

REM Install with yarn
echo Installing dependencies with Yarn...
echo This may take 5-10 minutes...
echo.
call yarn install

echo.
echo ========================================
echo   INSTALLATION COMPLETE!
echo ========================================
echo.
echo Now you can run: yarn dev
echo (or: npm run dev)
echo.
pause




