# Life Event Logger Monorepo

### Project status: In Development

Integrating frontend and backend apps into a single monorepo to deploy both on Vercel under the same domain, allowing
secure cookie-based authentication.

## Overview

A unified monorepo for the Life Event Logger application, combining the React frontend and GraphQL API backend into a single deployable project.
Life Event Logger helps you track recurring life events that don't fit into traditional calendar apps - like cleaning tasks, health appointments, or personal activities. Simply log when events happen and always know when you last did them.

## Why Monorepo?

This project was restructured as a monorepo to enable secure cookie-based authentication in a single Vercel project:

- **Cost Effective**: No need for a custom domain to let two separate Vercel projects use the same domain
- **Secure Cookie Sharing**: HTTP-only cookies work seamlessly for refresh token authentication
- **No CORS Issues**: Same-origin requests eliminate cross-domain complexities

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
cd apps/web && npm install
cd ../api && npm install

# Run both apps in development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Features

- **Frontend**: React TypeScript app with Material UI, Apollo GraphQL, and offline support via apollo3-cache-persist
- **Backend**: GraphQL Yoga API with JWT authentication, Prisma ORM, and MongoDB Atlas database
- **Authentication**: Google OAuth login with JWT tokens, secure cookie storage, and refresh token implementation

See individual app READMEs for detailed information:
- [Frontend Documentation](./apps/web/README.md)
- [Backend Documentation](./apps/api/README.md)
