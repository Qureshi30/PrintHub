@echo off
echo PrintHub Server Startup Script
echo ===============================
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo Please edit .env file with your configuration before running the server.
    echo Required configurations:
    echo   - MongoDB connection string
    echo   - Cloudinary credentials 
    echo   - Clerk authentication keys
    echo.
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking if dependencies are installed...
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting PrintHub Server...
echo Server will be available at: http://localhost:3001
echo Health check: http://localhost:3001/health
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
