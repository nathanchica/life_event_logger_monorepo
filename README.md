# Life Event Logger Monorepo

### Project status: In Development

Currently working on making the app more mobile-friendly and improving the user experience.

## Overview

React and GraphQL application for keeping track of various repeating life events by logging when they happen. Useful for
remembering the last time you did things that aren't typically tracked in a calendar app, such as cleaning your cats'
litter boxes, visiting the dentist, or getting boba. With this app, you can easily look up the last time these events
happened and stay on top of your routines.

Visually inspired by Google Keep and conceptually inspired by logging systems used to measure user interaction in apps.

## Features

- **Frontend**: React TypeScript app with Vite, Material UI, Apollo GraphQL, offline support via apollo3-cache-persist, and Vitest for testing
- **Backend**: GraphQL Yoga API with JWT authentication, Prisma ORM with MongoDB Atlas database, sqids for encoding IDs, and Vitest for testing
- **Authentication**: Google OAuth login with JWT tokens, secure cookie storage, and refresh token implementation

See individual app READMEs for detailed information:
- [Frontend Documentation](./apps/web/README.md)
- [Backend Documentation](./apps/api/README.md)

## Project History

This project started in 2022 before Create React App (CRA) was sunset. Picked this project back up in 2025 to learn new
tools and patterns, including:
- Apollo Cache
    - Using apollo3-cache-persist for offline support
    - Using apollo cache as data store for the frontend
    - Optimistic UI updates for a better user experience
- GraphQL Yoga
- Prisma
- Vitest
- Vercel
- AI coding tools like Github Copilot and Claude Code

This project was originally two separate repositories for the frontend and backend, but was restructured into a monorepo
to easily manage dependencies, share code between the two apps, and to learn about monorepos.

See frontend README for details on the authentication flow: [Authentication & Refresh Token Flow](./apps/web/README.md#authentication--refresh-token-flow).

The monorepo structure provides valuable benefits:

- **Simplified Development**: One repository to clone and set up
- **Coordinated Changes**: Frontend and backend updates can be reviewed and merged together
- **Shared Code**: Common utilities can be easily shared between apps
- **Contextual Awareness**: AI tools can easily understand the entire project context, improving planning

## Project Structure

```
life_event_logger_monorepo/
├── apps/
│   ├── web/          # React frontend (CRA)
│   │   └── vercel.json
│   └── api/          # GraphQL API (Yoga + Prisma)
│       └── vercel.json
├── packages/         # Shared packages
│   └── utils/        # Shared utility functions
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

See the individual apps' `.env.example` files for more details on required environment variables.
