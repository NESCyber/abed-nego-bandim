@echo off
title MP Website - Dr. Abed-Nego Lamangin Bandim

echo.
echo ====================================================
echo   Dr. Abed-Nego Lamangin Bandim - MP Website
echo ====================================================
echo.

:: Go to the backend folder (same folder as this script → backend)
cd /d "%~dp0backend"

:: Check if .env exists, if not copy from example
if not exist ".env" (
    echo [SETUP] Creating .env file from template...
    copy ".env.example" ".env"
    echo.
    echo  *** IMPORTANT: Open backend\.env and set your MySQL password ***
    echo  *** Then run this file again ***
    echo.
    pause
    exit /b
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [SETUP] Installing dependencies for the first time...
    echo         This may take a minute...
    npm install
    echo.
)

echo [INFO] Starting server...
echo.
echo  Website:  http://localhost:3000
echo  Admin:    http://localhost:3000/admin-login.html
echo  API Test: http://localhost:3000/api/health
echo.
echo  Press Ctrl+C to stop the server
echo.

:: Start the server
node server.js

pause
