@echo off
setlocal

echo Starting PrintHub Application...
echo.
echo This script will start both frontend and backend servers in separate windows.
echo Frontend: http://localhost:8080
echo Backend: http://localhost:3001
echo.
echo Press any key to stop both servers when you're done.
echo.

REM === Check for package.json in root ===
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the PrintHub root directory.
    pause
    exit /b 1
)

REM === Check for package.json in server directory ===
if not exist "server\package.json" (
    echo Error: server\package.json not found. Please ensure the server directory exists.
    pause
    exit /b 1
)

REM === Start Frontend and get PID ===
echo Starting frontend server...
powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"%CD%\" && npm run dev' -WindowStyle Normal -PassThru | ForEach-Object { $_.Id }" > tmp_frontend.pid

REM === Start Backend and get PID ===
echo Starting backend server...
powershell -Command "Start-Process cmd -ArgumentList '/k cd /d \"%CD%\server\" && npm run dev' -WindowStyle Normal -PassThru | ForEach-Object { $_.Id }" > tmp_backend.pid

REM === Read PIDs ===
set /p FRONTEND_PID=<tmp_frontend.pid
set /p BACKEND_PID=<tmp_backend.pid

REM === Clean up temp files ===
del tmp_frontend.pid
del tmp_backend.pid

timeout /t 3 >nul

REM === Open frontend in browser ===
start "" http://localhost:8080

echo.
echo Both servers are starting in their own Command Prompt windows...
echo Press any key to stop them.
pause >nul

REM === Kill both processes ===
echo Terminating servers...
taskkill /PID %FRONTEND_PID% /T /F >nul 2>&1
taskkill /PID %BACKEND_PID% /T /F >nul 2>&1

echo Servers terminated.
endlocal
pause
