# Vercel Deployment Guide

This guide covers deploying the Sync Web Dashboard to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **Convex Deployment**: Ensure Convex backend is deployed (see CONVEX_DEPLOYMENT.md)
4. **Auth0 Configuration**: Auth0 application configured (see AUTH0_SETUP_GUIDE.md)
5. **Webhook Server**: VM Windows webhook server running and accessible

## Environment Variables

Configure these environment variables in Vercel project settings:

### Auth0 Configuration

```bash
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://your-app.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience
```

**How to get these values:**
1. Go to Auth0 Dashboard → Applications → Your Application
2. Copy Domain, Client ID
3. Set Redirect URI to your Vercel deployment URL
4. Set Audience to your API identifier

### Convex Configuration

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**How to get this value:**
1. Run `npx convex deploy --prod` in the dashboard directory
2. Copy the deployment URL from the output
3. Or find it in Convex Dashboard → Settings

### Cron Secret

```bash
CRON_SECRET=your-secure-random-secret
```

**How to generate:**
```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Webhook Configuration

```bash
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-secret-token
```

**Notes:**
- `WEBHOOK_URL`: Public URL of your VM Windows webhook server
- `WEBHOOK_TOKEN`: Shared secret for webhook authentication (must match webhook server)
- If using ngrok: `WEBHOOK_URL=https://abc123.ngrok.io`

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the `dashboard` directory as the root

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `dashboard`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables listed above
   - Set for Production, Preview, and Development environments

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Dashboard Directory**
   ```bash
   cd dashboard
   ```

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

5. **Add Environment Variables**
   ```bash
   # Add each variable
   vercel env add NEXT_PUBLIC_AUTH0_DOMAIN production
   vercel env add NEXT_PUBLIC_AUTH0_CLIENT_ID production
   vercel env add NEXT_PUBLIC_AUTH0_REDIRECT_URI production
   vercel env add NEXT_PUBLIC_AUTH0_AUDIENCE production
   vercel env add NEXT_PUBLIC_CONVEX_URL production
   vercel env add CRON_SECRET production
   vercel env add WEBHOOK_URL production
   vercel env add WEBHOOK_TOKEN production
   ```

6. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update Auth0 Allowed Callback URLs

1. Go to Auth0 Dashboard → Applications → Your Application
2. Add your Vercel URL to:
   - Allowed Callback URLs: `https://your-app.vercel.app`
   - Allowed Logout URLs: `https://your-app.vercel.app`
   - Allowed Web Origins: `https://your-app.vercel.app`

### 2. Update Convex Deployment URL

If you deployed Convex to production:
1. Update `NEXT_PUBLIC_CONVEX_URL` in Vercel environment variables
2. Redeploy: `vercel --prod`

### 3. Configure Webhook Server

Update webhook server environment variables to include Convex production URL:
```bash
CONVEX_WEBHOOK_URL=https://your-deployment.convex.site/api/sync-callback
```

### 4. Test Cron Jobs

Vercel Cron jobs are automatically configured via `vercel.json`. To test:

1. Check Cron logs in Vercel Dashboard → Deployments → Functions
2. Manually trigger: `curl -X POST https://your-app.vercel.app/api/cron/check-scheduled-syncs -H "Authorization: Bearer YOUR_CRON_SECRET"`

## Vercel Configuration Files

### vercel.json

Already configured with cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-scheduled-syncs",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs the sync checker every 5 minutes.

### next.config.ts

Already configured with:
- React Compiler enabled
- Image optimization for Auth0 avatars

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Add all required environment variables in Vercel project settings

**Error: Module not found**
- Solution: Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

### Runtime Errors

**Auth0 redirect loop**
- Check `NEXT_PUBLIC_AUTH0_REDIRECT_URI` matches your Vercel URL
- Verify Auth0 Allowed Callback URLs include your Vercel URL

**Convex connection fails**
- Verify `NEXT_PUBLIC_CONVEX_URL` is correct
- Check Convex deployment is running: `npx convex dashboard`

**Webhook calls fail**
- Verify `WEBHOOK_URL` is publicly accessible
- Check `WEBHOOK_TOKEN` matches webhook server configuration
- Test webhook: `curl -X POST $WEBHOOK_URL/health`

### Cron Jobs Not Running

- Verify `CRON_SECRET` is set in environment variables
- Check Vercel Dashboard → Deployments → Functions for cron logs
- Ensure `vercel.json` is in the root of the dashboard directory

## Monitoring

### Vercel Dashboard

Monitor your deployment:
- **Analytics**: View traffic and performance
- **Logs**: Real-time function logs
- **Deployments**: Build history and status

### Convex Dashboard

Monitor backend:
- **Functions**: Query/mutation execution logs
- **Database**: Data browser and queries
- **Logs**: Real-time backend logs

## Scaling Considerations

### Vercel Limits

- **Free Tier**: 100GB bandwidth, 100 hours serverless function execution
- **Pro Tier**: 1TB bandwidth, 1000 hours execution, 60s function timeout
- **Cron Jobs**: Available on all tiers

### Convex Limits

- **Free Tier**: 1GB storage, 1M function calls/month
- **Pro Tier**: 10GB storage, 10M function calls/month

## Security Checklist

- [ ] All environment variables set in Vercel
- [ ] Auth0 callback URLs updated with Vercel URL
- [ ] CRON_SECRET is a strong random value
- [ ] WEBHOOK_TOKEN matches webhook server
- [ ] Webhook server uses HTTPS (or ngrok tunnel)
- [ ] All sensitive data encrypted in Convex
- [ ] CORS configured correctly in Convex

## Continuous Deployment

Vercel automatically deploys on Git push:

1. **Production**: Deploys from `main` branch
2. **Preview**: Deploys from feature branches
3. **Environment Variables**: Use different values for preview/production

To disable auto-deploy:
- Go to Project Settings → Git → Ignored Build Step
- Add custom logic to skip builds

## Rollback

If deployment fails:

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Convex Docs**: [docs.convex.dev](https://docs.convex.dev)
- **Auth0 Docs**: [auth0.com/docs](https://auth0.com/docs)

## Next Steps

After deployment:
1. Test login flow
2. Create a test sync app
3. Trigger manual sync
4. Verify logs are visible
5. Test cron job execution
6. Configure email notifications
