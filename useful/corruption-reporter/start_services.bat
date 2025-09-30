@echo off
echo Starting Corruption Reporter Services...
echo.

echo Starting Frontend (Port 3000)...
cd /d "C:\Users\PC\Documents\Projects\sabiteck_main_website-main\corruption-reporter\web-admin"
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Starting Backend (Port 9000)...
cd /d "C:\Users\PC\Documents\Projects\sabiteck_main_website-main\corruption-reporter\backend"
start "Backend Server" cmd /k "php -S localhost:9000 -t public"

echo.
echo Both services are starting...
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:9000
echo.
echo Press any key to continue...
pause
