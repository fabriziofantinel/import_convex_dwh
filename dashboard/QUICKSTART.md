# Quick Start Guide

This guide will help you get the Sync Web Dashboard up and running quickly.

## Prerequisites

- Node.js 18 or higher
- npm package manager
- Auth0 account (free tier is fine)
- Convex account (free tier is fine)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and fill in your values (see SETUP.md for detailed instructions).

3. **Deploy Convex backend**:
   ```bash
   npm run convex:deploy
   ```
   
   Follow the prompts to authenticate and create a project.

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## What's Next?

After completing the setup:

1. **Task 2**: Implement Convex schema and functions
2. **Task 3**: Implement Auth0 authentication
3. **Task 4**: Build the Dashboard UI
4. **Task 5**: Implement application management
5. And more...

## Project Status

✅ **Task 1 Complete**: Project setup and configuration
- Next.js project created with TypeScript
- Convex configured
- Auth0 configured
- Environment variables setup

🚧 **In Progress**: Implementing Convex schema and backend functions

## Useful Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
- `npm run format` - Format code
- `npm run convex:dev` - Start Convex development mode
- `npm run convex:deploy` - Deploy Convex functions

## Troubleshooting

If you encounter issues:

1. Make sure all environment variables are set correctly
2. Check that Node.js version is 18 or higher: `node --version`
3. Clear Next.js cache: `rm -rf .next`
4. Reinstall dependencies: `rm -rf node_modules && npm install`

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (Vercel)       │
│  - React UI with Tailwind CSS           │
│  - Auth0 Authentication                 │
│  - Convex React Client                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Convex Backend                  │
│  - Database (sync_apps, sync_jobs, etc) │
│  - Queries, Mutations, Actions          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Flask Webhook Server (VM)          │
│  - Receives sync triggers               │
│  - Executes sync.py                     │
│  - Sends results back to Convex         │
└─────────────────────────────────────────┘
```

## Support

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Auth0 Documentation](https://auth0.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
