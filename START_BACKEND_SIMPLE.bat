@echo off
title Backend Server - Port 3001
color 0A
echo.
echo ========================================
echo   Fleet Management Backend Server
echo ========================================
echo.
echo Starting backend on port 3001...
echo.

cd /d "%~dp0backend"
node simple-auth-server.js

echo.
echo ========================================
echo   Backend server stopped!
echo ========================================
echo.
pause
