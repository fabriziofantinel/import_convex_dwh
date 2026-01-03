# Deployment Checklist

Complete this checklist before and after deploying to production.

## Pre-Deployment

### 1. Code Preparation

- [ ] All tests passing: `npm test`
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] All dependencies up to date
- [ ] No console.log or debug code in production

### 2. Auth0 Configuration

- [ ] Auth0 application created
- [ ] Production callback URLs configured
- [ ] Auth0 domain and client ID ready
- [ ] Auth0 audience configured
- [ ] Test login flow in development

### 3. Convex Configuration

- [ ] Convex project created
- [ ] Schema deployed: `npx convex deploy --prod`
- [ ] Production URL obtained
- [ ] Environment variables set in Convex Dashboard:
  - [ ] `WEBHOOK_URL`
  - [ ] `WEBHOOK_TOKEN`
- [ ] Test queries/mutations in Convex Dashboard

### 4. Webhook Server

- [ ] Webhook server running on VM Windows
- [ ] Server accessible via public URL (ngrok or domain)
- [ ] Health check endpoint responding: `curl $WEBHOOK_URL/health`
- [ ] Webhook token configured
- [ ] Convex callback URL configured
- [ ] Test webhook manually

### 5. Environment Variables

- [ ] All variables documented in `.env.production.example`
- [ ] Secure secrets generated (CRON_SECRET, WEBHOOK_TOKEN)
- [ ] Production URLs ready (Auth0, Convex, Webhook)
- [ ] Variables ready to add to Vercel

## Deployment

### 6. Vercel Setup

- [ ] Vercel account created
- [ ] Project imported from Git
- [ ] Root directory set to `dashboard`
- [ ] Framework preset: Next.js
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`

### 7. Environment Variables in Vercel

Add these in Vercel Dashboard → Project Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_AUTH0_DOMAIN`
- [ ] `NEXT_PUBLIC_AUTH0_CLIENT_ID`
- [ ] `NEXT_PUBLIC_AUTH0_REDIRECT_URI`
- [ ] `NEXT_PUBLIC_AUTH0_AUDIENCE`
- [ ] `NEXT_PUBLIC_CONVEX_URL`
- [ ] `CRON_SECRET`
- [ ] `WEBHOOK_URL`
- [ ] `WEBHOOK_TOKEN`

Set for: Production, Preview, Development (as needed)

### 8. Deploy

- [ ] Deploy to Vercel: `vercel --prod` or via Dashboard
- [ ] Build completes successfully
- [ ] Deployment URL obtained
- [ ] No build errors or warnings

## Post-Deployment

### 9. Update External Services

- [ ] Update Auth0 Allowed Callback URLs with Vercel URL
- [ ] Update Auth0 Allowed Logout URLs with Vercel URL
- [ ] Update Auth0 Allowed Web Origins with Vercel URL
- [ ] Update webhook server `CONVEX_WEBHOOK_URL` if needed
- [ ] Verify DNS settings if using custom domain

### 10. Functional Testing

- [ ] Visit production URL
- [ ] Login with Auth0 works
- [ ] Dashboard loads correctly
- [ ] Create test sync app
- [ ] Edit sync app
- [ ] Delete sync app (with confirmation)
- [ ] Trigger manual sync
- [ ] View sync logs
- [ ] Configure SQL settings
- [ ] Configure email settings
- [ ] Test connection to SQL Server
- [ ] Logout works

### 11. Cron Jobs Testing

- [ ] Verify `vercel.json` deployed correctly
- [ ] Check cron logs in Vercel Dashboard → Functions
- [ ] Manually trigger cron: `curl -X POST https://your-app.vercel.app/api/cron/check-scheduled-syncs -H "Authorization: Bearer $CRON_SECRET"`
- [ ] Verify cron creates sync jobs
- [ ] Wait for scheduled cron to run
- [ ] Check sync job status updates

### 12. Integration Testing

- [ ] End-to-end sync flow works:
  1. Create app in dashboard
  2. Trigger sync
  3. Webhook receives request
  4. Sync executes on VM
  5. Callback updates Convex
  6. Dashboard shows updated status
- [ ] Email notifications work (if configured)
- [ ] Logs are visible and complete
- [ ] Error handling works correctly

### 13. Performance Testing

- [ ] Page load times acceptable
- [ ] API responses fast
- [ ] No console errors in browser
- [ ] Images load correctly
- [ ] Responsive design works on mobile/tablet

### 14. Security Verification

- [ ] All routes require authentication (except login)
- [ ] Passwords encrypted in Convex
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] No sensitive data in client-side code
- [ ] Webhook token validated
- [ ] Cron secret validated

### 15. Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Convex logs accessible
- [ ] Error tracking configured (optional: Sentry)
- [ ] Uptime monitoring configured (optional)
- [ ] Alert notifications configured

## Production Readiness

### 16. Documentation

- [ ] README.md updated with production info
- [ ] SETUP.md includes production steps
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available

### 17. Backup and Recovery

- [ ] Convex data backed up
- [ ] Backup schedule configured
- [ ] Recovery process tested
- [ ] Rollback procedure documented

### 18. Team Access

- [ ] Team members have Vercel access
- [ ] Team members have Convex access
- [ ] Team members have Auth0 access
- [ ] Credentials securely shared (1Password, etc.)

## Ongoing Maintenance

### 19. Regular Checks

- [ ] Monitor Vercel deployment logs weekly
- [ ] Check Convex usage and limits monthly
- [ ] Review Auth0 logs for suspicious activity
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly

### 20. Scaling Preparation

- [ ] Monitor Vercel bandwidth usage
- [ ] Monitor Convex function calls
- [ ] Plan for tier upgrades if needed
- [ ] Optimize slow queries
- [ ] Consider CDN for static assets

## Rollback Plan

If deployment fails or issues arise:

1. [ ] Identify the issue (check logs)
2. [ ] Decide: fix forward or rollback
3. [ ] If rollback:
   - [ ] Vercel: Promote previous deployment
   - [ ] Convex: `npx convex rollback --prod --to <deployment-id>`
4. [ ] Verify rollback successful
5. [ ] Communicate to team
6. [ ] Fix issue in development
7. [ ] Redeploy when ready

## Sign-Off

- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] Verified by: ________________
- [ ] Date: ________________

## Notes

Use this space to document any issues, workarounds, or special configurations:

```
[Add notes here]
```

## Support Contacts

- **Vercel Support**: support@vercel.com
- **Convex Support**: Discord community
- **Auth0 Support**: support.auth0.com
- **Team Lead**: [Name/Email]
- **DevOps**: [Name/Email]
