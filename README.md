# Life Event Logger Monorepo

### Project status: In Development

Currently working on enhancing the authentication flow and security features.

## Overview

React and GraphQL application for keeping track of various repeating life events by logging when they happen. Useful for
remembering the last time you did things that aren't typically tracked in a calendar app, such as cleaning your cats'
litter boxes, visiting the dentist, or getting boba. With this app, you can easily look up the last time these events
happened and stay on top of your routines.

Visually inspired by Google Keep and conceptually inspired by logging systems used to measure user interaction in apps.

## Project History

This project started in 2022 before Create React App (CRA) was sunset. Picked this project back up in 2025 to learn new
tools and patterns, including:
- Apollo Cache
    - Using apollo3-cache-persist for offline support
    - Using apollo cache as data store for the frontend
- GraphQL Yoga
- Prisma
- Vitest
- Vercel
- AI coding tools like Github Copilot and Claude Code

This project was originally two separate repositories for the frontend and backend, but was restructured into a monorepo
with the original goal of deploying both apps as a single Vercel project, hoping to deploy both under the same domain
and enable secure cookie-based authentication. Now, we have both apps deployed as separate Vercel projects, but use
Vercel's rewrite rules to serve both applications from the same domain, achieving the original goal for secure cookie
sharing without CORS issues.

See frontend README for details on the authentication flow: [Authentication & Refresh Token Flow](./apps/web/README.md#authentication--refresh-token-flow).

Even though the apps are deployed separately, the monorepo structure provides valuable benefits:

- **Simplified Development**: One repository to clone and set up
- **Coordinated Changes**: Frontend and backend updates can be reviewed and merged together
- **Contextual Awareness**: AI tools can easily understand the entire project context, improving planning

## Project Structure

```
life_event_logger_monorepo/
├── apps/
│   ├── web/          # React frontend (CRA)
│   │   └── vercel.json
│   └── api/          # GraphQL API (Yoga + Prisma)
│       └── vercel.json
├── .husky/           # Git hooks for code quality
└── package.json      # Monorepo scripts
```

## Quick Start

```bash
# Install dependencies for all apps
npm install
# Note: `--legacy-peer-deps` is needed for CRA compatibility with some packages
cd apps/web && npm install --legacy-peer-deps --ignore-scripts
cd ../api && npm install

# Run both apps in development
npm start

# Build for production
npm run build
```

### Environment Variables

A Google OAuth client ID is required for authentication. Set the `GOOGLE_CLIENT_ID` environment variable in both apps'
`.env` files.

A MongoDB Atlas database is also required for the backend. Set the `DATABASE_URL` environment variable in the backend's
`.env` file.

See the individual app's `.env.example` files for more details on required environment variables.

## Features

- **Frontend**: React TypeScript app with Material UI, Apollo GraphQL, and offline support via apollo3-cache-persist
- **Backend**: GraphQL Yoga API with JWT authentication, Prisma ORM, and MongoDB Atlas database
- **Authentication**: Google OAuth login with JWT tokens, secure cookie storage, and refresh token implementation

See individual app READMEs for detailed information:
- [Frontend Documentation](./apps/web/README.md)
- [Backend Documentation](./apps/api/README.md)
