@echo off
REM Vercel Environment Variables Setup Script for Windows
REM This script helps you add environment variables to Vercel project

echo ==========================================
echo Vercel Environment Variables Setup
echo ==========================================
echo.

REM Check if vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
)

echo Vercel CLI found
echo.

REM Login to Vercel
echo Logging in to Vercel...
call vercel login

echo.
echo ==========================================
echo Adding Environment Variables
echo ==========================================
echo.

REM Auth0 Configuration
echo --- Auth0 Configuration ---
set /p AUTH0_DOMAIN="Enter Auth0 Domain (e.g., your-tenant.auth0.com): "
echo %AUTH0_DOMAIN% | vercel env add NEXT_PUBLIC_AUTH0_DOMAIN production

set /p AUTH0_CLIENT_ID="Enter Auth0 Client ID: "
echo %AUTH0_CLIENT_ID% | vercel env add NEXT_PUBLIC_AUTH0_CLIENT_ID production

set /p AUTH0_REDIRECT_URI="Enter Auth0 Redirect URI (e.g., https://your-app.vercel.app): "
echo %AUTH0_REDIRECT_URI% | vercel env add NEXT_PUBLIC_AUTH0_REDIRECT_URI production

set /p AUTH0_AUDIENCE="Enter Auth0 API Audience: "
echo %AUTH0_AUDIENCE% | vercel env add NEXT_PUBLIC_AUTH0_AUDIENCE production

echo.

REM Convex Configuration
echo --- Convex Configuration ---
set /p CONVEX_URL="Enter Convex Deployment URL (e.g., https://your-deployment.convex.cloud): "
echo %CONVEX_URL% | vercel env add NEXT_PUBLIC_CONVEX_URL production

echo.

REM Cron Secret
echo --- Cron Configuration ---
echo Generating secure CRON_SECRET...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set CRON_SECRET=%%i
echo %CRON_SECRET% | vercel env add CRON_SECRET production
echo Added CRON_SECRET to production
echo Save this secret: %CRON_SECRET%
echo.

REM Webhook Configuration
echo --- Webhook Configuration ---
set /p WEBHOOK_URL="Enter Webhook Server URL (e.g., https://your-vm-domain.com:5000): "
echo %WEBHOOK_URL% | vercel env add WEBHOOK_URL production

set /p WEBHOOK_TOKEN="Enter Webhook Authentication Token: "
echo %WEBHOOK_TOKEN% | vercel env add WEBHOOK_TOKEN production

echo.
echo ==========================================
echo Environment Variables Setup Complete
echo ==========================================
echo.
echo Next steps:
echo 1. Verify variables: vercel env ls
echo 2. Deploy to production: vercel --prod
echo 3. Update Auth0 callback URLs with your Vercel URL
echo 4. Test the deployment
echo.

pause
