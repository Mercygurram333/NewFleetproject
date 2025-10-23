@echo off
echo ========================================
echo Starting Fleet Management Backend Server
echo ========================================
echo.

cd /d "C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project\backend"

echo Installing dependencies (if needed)...
call npm install

echo.
echo Starting backend server on port 3001...
echo.

node simple-auth-server.js

pause
