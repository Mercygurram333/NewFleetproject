@echo off
echo ========================================
echo Starting Fleet Management Application
echo ========================================
echo.
echo This will start both Backend and Frontend servers
echo.

REM Start Backend Server in a new window
start "Backend Server - Port 3001" cmd /k "cd /d C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project\backend && node simple-auth-server.js"

echo Backend server starting on port 3001...
timeout /t 3 /nobreak > nul

REM Start Frontend Server in a new window
start "Frontend Server - Port 5177" cmd /k "cd /d C:\Users\Mercy\OneDrive\Documents\Desktop\New-fleet-project && npm run dev"

echo Frontend server starting...
echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5177
echo.
echo Press any key to close this window...
pause > nul
