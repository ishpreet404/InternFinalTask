@echo off
echo 🚀 Skyfire Ascent - Vercel Deployment Script (Windows)
echo =============================================

:: Step 1: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Run this script from the project root.
    pause
    exit /b 1
)

echo ✅ Found package.json

:: Step 2: Check for required files
echo 📋 Checking project files...

if not exist "vite.config.js" (
    echo ❌ Missing vite.config.js
    pause
    exit /b 1
)

if not exist "vercel.json" (
    echo ❌ Missing vercel.json
    pause
    exit /b 1
)

echo ✅ Configuration files present

:: Step 3: Check critical assets
echo 🖼️ Checking critical assets...

if not exist "public\BG full.png" (
    echo ❌ Missing: public\BG full.png
    pause
    exit /b 1
)

if not exist "public\Blurred BG.png" (
    echo ❌ Missing: public\Blurred BG.png
    pause
    exit /b 1
)

if not exist "public\Psyger-0.png" (
    echo ❌ Missing: public\Psyger-0.png
    pause
    exit /b 1
)

if not exist "public\Cloud 1.png" (
    echo ❌ Missing: public\Cloud 1.png
    pause
    exit /b 1
)

echo ✅ Critical assets present

:: Step 4: Install dependencies
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ npm install failed
    pause
    exit /b 1
)

echo ✅ Dependencies installed

:: Step 5: Build the project
echo 🔨 Building project...
call npm run build

if errorlevel 1 (
    echo ❌ Build failed - check the errors above
    pause
    exit /b 1
)

echo ✅ Build successful

:: Step 6: Check if dist folder was created
if not exist "dist" (
    echo ❌ dist folder not created
    pause
    exit /b 1
)

echo ✅ dist folder created

:: Step 7: Test the build locally
echo 🧪 Testing build locally...
echo Starting preview server on http://localhost:3000
echo 💡 Open another terminal and run: npm run preview
echo Test your game, then come back here...
echo.

set /p answer="📋 Did the local preview work correctly? (y/N): "
if /i not "%answer%"=="y" (
    echo ❌ Please fix local preview issues before deploying
    pause
    exit /b 1
)

:: Step 8: Git operations
echo 📤 Preparing for deployment...

:: Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not initialized. Run: git init
    pause
    exit /b 1
)

:: Add all changes
git add .

:: Commit with timestamp
for /f "tokens=1-4 delims=/ " %%i in ('date /t') do set mydate=%%k-%%j-%%i
for /f "tokens=1-2 delims=: " %%i in ('time /t') do set mytime=%%i:%%j
set commit_message=Fix Vercel deployment - %mydate% %mytime%

git commit -m "%commit_message%"

:: Push to origin
echo 🚀 Pushing to repository...
git push origin main

if errorlevel 1 (
    echo ❌ Git push failed. Check your repository settings.
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS! Deployment script completed.
echo.
echo 📋 Next steps:
echo 1. Go to your Vercel dashboard
echo 2. Check the deployment status
echo 3. Open the deployed URL
echo 4. Check browser console for any asset loading errors
echo.
echo 🔍 If issues persist, check VERCEL_FIX_GUIDE.md
echo.
echo 🎮 Good luck with your game deployment!
pause
