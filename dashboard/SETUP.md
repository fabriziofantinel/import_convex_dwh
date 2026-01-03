# Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Auth0 account
- Convex account

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Auth0

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new Application:
   - Type: Single Page Application
   - Name: Sync Web Dashboard
3. Configure Application Settings:
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Note down:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
5. Create an API (if not exists):
   - Name: Sync Dashboard API
   - Identifier: `https://sync-dashboard-api` (or your preferred identifier)
   - Note down the API Identifier (this is your audience)

### 3. Configure Convex

1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Create a new project:
   - Name: sync-web-dashboard
3. Run Convex deployment:
   ```bash
   npm run convex:deploy
   ```
4. Follow the prompts to authenticate and deploy
5. Note down the deployment URL (e.g., `https://your-deployment.convex.cloud`)

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in the values:

```env
# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_AUTH0_AUDIENCE=https://sync-dashboard-api

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Cron Secret (generate a random string)
CRON_SECRET=your-random-secret-string

# Webhook Configuration (VM Windows)
WEBHOOK_URL=http://your-vm-ip:5000
WEBHOOK_TOKEN=your-webhook-secret-token
```

### 5. Configure Convex Environment Variables

Create `.env.convex` file (for Convex backend):

```env
WEBHOOK_URL=http://your-vm-ip:5000
WEBHOOK_TOKEN=your-webhook-secret-token
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Configure environment variables in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`

### Deploy Convex Functions

```bash
npm run convex:deploy -- --prod
```

## Troubleshooting

### Auth0 Issues

- **Error: redirect_uri mismatch**: Make sure the callback URL in Auth0 matches your application URL
- **Error: audience is required**: Make sure you've created an API in Auth0 and set the audience

### Convex Issues

- **Error: NEXT_PUBLIC_CONVEX_URL is not set**: Make sure you've deployed Convex and set the URL in `.env.local`
- **Error: Convex functions not found**: Run `npm run convex:deploy` to deploy functions

### General Issues

- **Port 3000 already in use**: Change the port with `npm run dev -- -p 3001`
- **Module not found**: Run `npm install` to install dependencies

## Next Steps

After setup is complete, proceed to implement:
1. Convex schema and functions (Task 2)
2. Auth0 authentication (Task 3)
3. Dashboard UI (Task 4)
4. And more...

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Auth0 Documentation](https://auth0.com/docs)
