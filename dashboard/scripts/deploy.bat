@echo off
REM Quick Deployment Script for Windows
REM Deploys both Convex and Vercel to production

echo ==========================================
echo Production Deployment Script
echo ==========================================
echo.

REM Check if we're in the dashboard directory
if not exist "package.json" (
    echo Error: Must run from dashboard directory
    exit /b 1
)

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
)

echo Prerequisites checked
echo.

REM Step 1: Run tests
echo ==========================================
echo Step 1: Running Tests
echo ==========================================
echo.

call npm test -- --passWithNoTests
if %ERRORLEVEL% NEQ 0 (
    echo Tests failed!
    exit /b 1
)

echo Tests passed
echo.

REM Step 2: Build locally
echo ==========================================
echo Step 2: Building Locally
echo ==========================================
echo.

call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b 1
)

echo Build successful
echo.

REM Step 3: Deploy Convex
echo ==========================================
echo Step 3: Deploying Convex
echo ==========================================
echo.

call npx convex deploy --prod
if %ERRORLEVEL% NEQ 0 (
    echo Convex deployment failed!
    exit /b 1
)

echo Convex deployed
echo.

REM Step 4: Deploy Vercel
echo ==========================================
echo Step 4: Deploying Vercel
echo ==========================================
echo.

call vercel --prod
if %ERRORLEVEL% NEQ 0 (
    echo Vercel deployment failed!
    exit /b 1
)

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Test the production deployment
echo 2. Verify Auth0 login works
echo 3. Test sync functionality
echo 4. Check cron jobs in Vercel dashboard
echo.

pause
