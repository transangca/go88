@echo off
setlocal

REM Always run from the folder containing this .bat file
cd /d "%~dp0"

echo ======================================
echo   GO88 Auto Run Script
echo ======================================
echo.
set "PORT=80"

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js first: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

where cloudflared >nul 2>&1
if errorlevel 1 (
    echo [WARN] cloudflared not found. Running local server only.
    echo [WARN] Install cloudflared to get a public link:
    echo        https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo.
    echo [INFO] Starting local server...
    npm start
    goto :end
)

echo [INFO] Starting Cloudflare Tunnel on port %PORT%...
start "Cloudflare Tunnel" cmd /k cloudflared tunnel --url http://localhost:%PORT%
timeout /t 3 >nul

echo [INFO] Starting server on port %PORT%...
set "PORT=%PORT%"
npm start

:end
echo.
echo [INFO] Server stopped.
pause