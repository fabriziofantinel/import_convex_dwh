# Sync Web Dashboard

Web dashboard per gestire configurazioni e lanciare sync Convex → SQL Server.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Required environment variables:

- **Auth0**: `NEXT_PUBLIC_AUTH0_DOMAIN`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`, `NEXT_PUBLIC_AUTH0_REDIRECT_URI`, `NEXT_PUBLIC_AUTH0_AUDIENCE`
- **Convex**: `NEXT_PUBLIC_CONVEX_URL`
- **Cron**: `CRON_SECRET`
- **Webhook**: `WEBHOOK_URL`, `WEBHOOK_TOKEN`

### 3. Setup Convex

1. Create a Convex account at [convex.dev](https://convex.dev)
2. Create a new project
3. Run `npx convex deploy` to deploy Convex functions
4. Copy the deployment URL to `NEXT_PUBLIC_CONVEX_URL` in `.env.local`

### 4. Setup Auth0

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create a new application (Single Page Application)
3. Configure Allowed Callback URLs: `http://localhost:3000`
4. Configure Allowed Logout URLs: `http://localhost:3000`
5. Copy the domain and client ID to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
dashboard/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page
├── components/            # React components
│   └── providers.tsx      # Auth0 and Convex providers
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── queries.ts         # Convex queries
│   ├── mutations.ts       # Convex mutations
│   └── actions.ts         # Convex actions
├── lib/                   # Utility libraries
│   ├── auth0.ts           # Auth0 configuration
│   └── convex.ts          # Convex client
└── .env.local             # Environment variables
```

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend**: Convex
- **Authentication**: Auth0
- **Deployment**: Vercel

## Features

- ✅ Auth0 authentication
- ✅ Convex database and backend
- 🚧 Dashboard UI (coming soon)
- 🚧 Sync configuration management (coming soon)
- 🚧 Manual sync triggering (coming soon)
- 🚧 Log visualization (coming soon)
- 🚧 Cron job scheduling (coming soon)

## Development

### Build

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting and Formatting

```bash
# Check code style
npm run lint

# Format code
npm run format
```

## Deployment

### Metodo Consigliato: Deploy via GitHub + Vercel

Vercel funziona meglio quando importi il progetto da GitHub per abilitare continuous deployment.

**Guida Rapida:**

1. **Push su GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TUO-USERNAME/TUO-REPO.git
   git push -u origin main
   ```

2. **Importa su Vercel**
   - Vai su https://vercel.com/new
   - Importa il repository GitHub
   - **IMPORTANTE**: Imposta Root Directory su `dashboard`
   - Aggiungi environment variables
   - Deploy

3. **Configura Post-Deploy**
   - Aggiorna Auth0 callback URLs
   - Deploy Convex: `npx convex deploy --prod`
   - Testa l'applicazione

**Vedi**: [DEPLOY_GITHUB_QUICKSTART.md](./DEPLOY_GITHUB_QUICKSTART.md) per la guida completa.

### Metodo Alternativo: Deploy Diretto (CLI)

Deploy both Convex and Vercel with one command:

```bash
npm run deploy
```

Or use the deployment scripts:

**Linux/Mac:**
```bash
cd dashboard
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows:**
```bash
cd dashboard
scripts\deploy.bat
```

### Manual Deployment

#### 1. Deploy Convex

```bash
npm run deploy:convex
```

This deploys your Convex functions to production. Copy the deployment URL.

#### 2. Deploy to Vercel

```bash
npm run deploy:vercel
```

This deploys your Next.js app to Vercel.

### Environment Variables Setup

Use the setup script to configure Vercel environment variables:

**Linux/Mac:**
```bash
chmod +x scripts/setup-vercel-env.sh
./scripts/setup-vercel-env.sh
```

**Windows:**
```bash
scripts\setup-vercel-env.bat
```

Or manually add them in Vercel Dashboard → Project Settings → Environment Variables.

### Deployment Documentation

For detailed deployment instructions, see:

- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete Vercel deployment guide
- **[CONVEX_DEPLOYMENT.md](./CONVEX_DEPLOYMENT.md)** - Convex backend deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre and post-deployment checklist

### Post-Deployment

After deploying:

1. Update Auth0 Allowed Callback URLs with your Vercel URL
2. Test login flow
3. Create a test sync app
4. Trigger a manual sync
5. Verify logs are visible
6. Test cron job execution

## Production Environment Variables

Required environment variables for production (add in Vercel Dashboard):

```bash
# Auth0
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-production-client-id
NEXT_PUBLIC_AUTH0_REDIRECT_URI=https://your-app.vercel.app
NEXT_PUBLIC_AUTH0_AUDIENCE=your-api-audience

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud

# Cron
CRON_SECRET=your-secure-random-secret

# Webhook
WEBHOOK_URL=https://your-vm-domain.com:5000
WEBHOOK_TOKEN=your-webhook-secret-token
```

See `.env.production.example` for a complete template.

## Monitoring

- **Vercel Dashboard**: Monitor deployments, analytics, and logs
- **Convex Dashboard**: Monitor database, functions, and usage
- **Auth0 Dashboard**: Monitor authentication and user activity

## Troubleshooting

### Build Fails

- Check all environment variables are set
- Verify dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run lint`

### Auth0 Issues

- Verify callback URLs match your deployment URL
- Check Auth0 domain and client ID are correct
- Ensure Auth0 application type is "Single Page Application"

### Convex Issues

- Verify Convex deployment URL is correct
- Check Convex functions are deployed: `npx convex dashboard`
- Ensure environment variables are set in Convex Dashboard

### Webhook Issues

- Verify webhook server is running and accessible
- Check webhook URL is publicly accessible
- Test webhook health: `curl $WEBHOOK_URL/health`
- Verify webhook token matches

## Support

For issues or questions:

- Check [SETUP.md](./SETUP.md) for setup instructions
- Check [QUICKSTART.md](./QUICKSTART.md) for quick start guide
- Review deployment guides in the docs folder
- Check Vercel, Convex, and Auth0 documentation

## License

MIT
