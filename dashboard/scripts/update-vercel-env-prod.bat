@echo off
echo ======================================================================
echo Updating Vercel Environment Variables for Production
echo ======================================================================
echo.

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Vercel CLI not installed!
    echo.
    echo Please install Vercel CLI:
    echo   npm install -g vercel
    echo.
    pause
    exit /b 1
)

echo Setting production environment variables...
echo.

REM Auth0 Configuration
echo Setting Auth0 variables...
vercel env add NEXT_PUBLIC_AUTH0_DOMAIN production --value="dev-p1yt6g7gg8nydzcm.us.auth0.com" --force
vercel env add NEXT_PUBLIC_AUTH0_CLIENT_ID production --value="SwXAIYb2YJHF68iSJwdKLTE4zFByk6pL" --force
vercel env add NEXT_PUBLIC_AUTH0_REDIRECT_URI production --value="https://import-convex-dwh.vercel.app" --force
vercel env add NEXT_PUBLIC_AUTH0_AUDIENCE production --value="importconvexdwh" --force

REM Convex Configuration
echo Setting Convex variables...
vercel env add NEXT_PUBLIC_CONVEX_URL production --value="https://blissful-schnauzer-295.convex.cloud" --force
vercel env add CONVEX_DEPLOYMENT production --value="prod:blissful-schnauzer-295" --force

REM Webhook Configuration
echo Setting Webhook variables...
vercel env add NEXT_PUBLIC_WEBHOOK_URL production --value="https://complicative-unimplicitly-greta.ngrok-free.dev" --force
vercel env add NEXT_PUBLIC_WEBHOOK_TOKEN production --value="test-token-12345" --force

echo.
echo ======================================================================
echo Environment variables updated successfully!
echo ======================================================================
echo.
echo Next steps:
echo 1. Redeploy the application: vercel --prod
echo 2. Verify variables: vercel env ls
echo.
pause