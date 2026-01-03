#!/bin/bash

# Quick Deployment Script
# Deploys both Convex and Vercel to production

set -e

echo "=========================================="
echo "Production Deployment Script"
echo "=========================================="
echo ""

# Check if we're in the dashboard directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from dashboard directory"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✓ Prerequisites checked"
echo ""

# Step 1: Run tests
echo "=========================================="
echo "Step 1: Running Tests"
echo "=========================================="
echo ""

npm test -- --passWithNoTests

echo "✓ Tests passed"
echo ""

# Step 2: Build locally
echo "=========================================="
echo "Step 2: Building Locally"
echo "=========================================="
echo ""

npm run build

echo "✓ Build successful"
echo ""

# Step 3: Deploy Convex
echo "=========================================="
echo "Step 3: Deploying Convex"
echo "=========================================="
echo ""

npx convex deploy --prod

echo "✓ Convex deployed"
echo ""

# Step 4: Deploy Vercel
echo "=========================================="
echo "Step 4: Deploying Vercel"
echo "=========================================="
echo ""

vercel --prod

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test the production deployment"
echo "2. Verify Auth0 login works"
echo "3. Test sync functionality"
echo "4. Check cron jobs in Vercel dashboard"
echo ""
