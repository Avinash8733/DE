@echo off
echo Starting Voice Email System Development Environment...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd voice-email-backend && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd voice-email-frontend && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
