@echo off
setlocal

REM Always run from this script directory
cd /d "%~dp0"

set "PORT=80"

echo ======================================
echo   GO88 Public Start (Cloudflare)
echo ======================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available.
    pause
    exit /b 1
)

where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [ERROR] cloudflared is not installed or not in PATH.
    echo Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

echo [INFO] Starting Cloudflare Tunnel...
echo [INFO] Copy public URL from tunnel window: https://*.trycloudflare.com
start "Cloudflare Tunnel" cmd /k cloudflared tunnel --url http://localhost:%PORT%
timeout /t 3 >nul

echo [INFO] Starting Node server on port %PORT%...
set "PORT=%PORT%"
npm start

echo.
echo [INFO] Server stopped.
pause
