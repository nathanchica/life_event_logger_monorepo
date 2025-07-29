# Life Event Logger Monorepo

A unified monorepo for the Life Event Logger application, combining the React frontend and GraphQL API backend into a single deployable project.

## Overview

Life Event Logger helps you track recurring life events that don't fit into traditional calendar apps - like cleaning tasks, health appointments, or personal activities. Simply log when events happen and always know when you last did them.

## Why Monorepo?

This project was restructured as a monorepo to enable secure cookie-based authentication:

- **Single Domain Deployment**: Both frontend and API are served from the same Vercel domain
- **Secure Cookie Sharing**: HTTP-only cookies work seamlessly for refresh token authentication
- **No CORS Issues**: Same-origin requests eliminate cross-domain complexities
- **Cost Effective**: No need for a custom domain to enable cookie sharing between frontend and backend

## Project Structure

```
life_event_logger_monorepo/
├── apps/
│   ├── web/          # React frontend (CRA)
│   └── api/          # GraphQL API (Yoga + Prisma)
├── .husky/           # Git hooks for code quality
├── vercel.json       # Deployment configuration
└── package.json      # Monorepo scripts
```

## Quick Start

```bash
# Install dependencies for all apps
npm install
cd apps/web && yarn install
cd ../api && npm install

# Run both apps in development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Features

- **Frontend**: React app with Material UI, Apollo Client, and offline support
- **Backend**: GraphQL API with JWT authentication, Prisma ORM, and PostgreSQL
- **Shared Domain**: Frontend at `/`, API at `/api/*`
- **Type Safety**: Full TypeScript across both applications
- **Code Quality**: Automated linting, formatting, and type checking on commit

See individual app READMEs for detailed information:
- [Frontend Documentation](./apps/web/README.md)
- [Backend Documentation](./apps/api/README.md)
