#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you add environment variables to Vercel project

set -e

echo "=========================================="
echo "Vercel Environment Variables Setup"
echo "=========================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✓ Vercel CLI found"
echo ""

# Login to Vercel
echo "Logging in to Vercel..."
vercel login

echo ""
echo "=========================================="
echo "Adding Environment Variables"
echo "=========================================="
echo ""

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_description=$2
    
    echo "📝 $var_description"
    read -p "Enter value for $var_name: " var_value
    
    if [ -z "$var_value" ]; then
        echo "⚠️  Skipping $var_name (empty value)"
        return
    fi
    
    echo "$var_value" | vercel env add "$var_name" production
    echo "✓ Added $var_name to production"
    echo ""
}

# Auth0 Configuration
echo "--- Auth0 Configuration ---"
add_env_var "NEXT_PUBLIC_AUTH0_DOMAIN" "Auth0 Domain (e.g., your-tenant.auth0.com)"
add_env_var "NEXT_PUBLIC_AUTH0_CLIENT_ID" "Auth0 Client ID"
add_env_var "NEXT_PUBLIC_AUTH0_REDIRECT_URI" "Auth0 Redirect URI (e.g., https://your-app.vercel.app)"
add_env_var "NEXT_PUBLIC_AUTH0_AUDIENCE" "Auth0 API Audience"

# Convex Configuration
echo "--- Convex Configuration ---"
add_env_var "NEXT_PUBLIC_CONVEX_URL" "Convex Deployment URL (e.g., https://your-deployment.convex.cloud)"

# Cron Secret
echo "--- Cron Configuration ---"
echo "📝 Generating secure CRON_SECRET..."
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "$CRON_SECRET" | vercel env add "CRON_SECRET" production
echo "✓ Added CRON_SECRET to production"
echo "⚠️  Save this secret: $CRON_SECRET"
echo ""

# Webhook Configuration
echo "--- Webhook Configuration ---"
add_env_var "WEBHOOK_URL" "Webhook Server URL (e.g., https://your-vm-domain.com:5000)"
add_env_var "WEBHOOK_TOKEN" "Webhook Authentication Token"

echo ""
echo "=========================================="
echo "✓ Environment Variables Setup Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify variables: vercel env ls"
echo "2. Deploy to production: vercel --prod"
echo "3. Update Auth0 callback URLs with your Vercel URL"
echo "4. Test the deployment"
echo ""
