# Deployment Quick Reference

Quick commands and links for deploying the Sync Web Dashboard.

## 🚀 Quick Deploy

```bash
cd dashboard
npm run deploy
```

This runs tests, builds, deploys Convex, and deploys to Vercel.

## 📋 Environment Variables

### Required for Vercel

```bash
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://your-app.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CRON_SECRET=your-secure-secret
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-token
```

### Setup Script

```bash
# Linux/Mac
./scripts/setup-vercel-env.sh

# Windows
scripts\setup-vercel-env.bat
```

## 🔧 Individual Commands

### Deploy Convex Only

```bash
npm run deploy:convex
```

### Deploy Vercel Only

```bash
npm run deploy:vercel
```

### Run Tests

```bash
npm test
```

### Build Locally

```bash
npm run build
```

## 🔗 Important Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Convex Dashboard**: https://dashboard.convex.dev
- **Auth0 Dashboard**: https://manage.auth0.com

## 📚 Documentation

- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Full Vercel guide
- **[CONVEX_DEPLOYMENT.md](./CONVEX_DEPLOYMENT.md)** - Full Convex guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete checklist

## ✅ Post-Deployment Checklist

1. [ ] Update Auth0 callback URLs
2. [ ] Test login at production URL
3. [ ] Create test sync app
4. [ ] Trigger manual sync
5. [ ] Verify logs visible
6. [ ] Test cron job
7. [ ] Check email notifications

## 🐛 Quick Troubleshooting

### Build Fails
```bash
npm install
npm run build
```

### Auth0 Issues
- Check callback URLs in Auth0 Dashboard
- Verify environment variables

### Convex Issues
```bash
npx convex dashboard
```

### Webhook Issues
```bash
curl $WEBHOOK_URL/health
```

## 🔄 Rollback

### Vercel
1. Go to Vercel Dashboard → Deployments
2. Find previous deployment
3. Click "..." → "Promote to Production"

### Convex
```bash
npx convex rollback --prod --to <deployment-id>
```

## 📞 Support

- Vercel: support@vercel.com
- Convex: Discord community
- Auth0: support.auth0.com

## 🔐 Security Reminders

- [ ] All secrets are strong random values
- [ ] HTTPS enforced everywhere
- [ ] Auth0 callback URLs restricted
- [ ] Webhook token matches server
- [ ] Passwords encrypted in Convex

## 📊 Monitoring

- **Vercel**: Dashboard → Analytics & Logs
- **Convex**: Dashboard → Functions & Logs
- **Auth0**: Dashboard → Logs

---

**Need more details?** See the full deployment guides in the documentation.
