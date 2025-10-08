@echo off
echo ========================================
echo PrintHub - Local Backend with ngrok
echo ========================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: ngrok is not installed!
    echo.
    echo Please install ngrok:
    echo 1. Download from: https://ngrok.com/download
    echo 2. Extract and add to PATH
    echo 3. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
    exit /b 1
)

echo Step 1: Checking if backend is running on port 3001...
netstat -ano | findstr :3001 >nul 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Backend is not running on port 3001!
    echo.
    echo Please start your backend first:
    echo   cd server
    echo   node src/index.js
    echo.
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo Backend detected on port 3001! ✓
echo.

echo Step 2: Starting ngrok tunnel...
echo.
echo ========================================
echo IMPORTANT: Copy the HTTPS URL below
echo Example: https://abc123.ngrok-free.app
echo ========================================
echo.
echo Add this URL to Vercel environment variables:
echo Variable: VITE_API_BASE_URL
echo Value: https://YOUR_NGROK_URL_HERE/api
echo.
echo Press Ctrl+C to stop ngrok when done.
echo.

REM Start ngrok
ngrok http 3001
