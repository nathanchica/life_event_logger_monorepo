# Life Event Logger

## Overview

React application for keeping track of various repeating life events by logging when they happen. Useful for remembering
the last time you did things that aren't typically tracked in a calendar app, such as cleaning your cats' litter boxes,
visiting the dentist, or getting boba. With this app, you can easily look up the last time these events happened and
stay on top of your routines.

Visually inspired by Google Keep and conceptually inspired by logging systems used to measure user interaction in apps.

Built with:
- create-react-app for bootstrapping a React 18 application
- TypeScript for JS typing
- React hooks and Context API for state management
- GraphQL for fetching and persisting data
- Apollo Cache as data store
- apollo3-cache-persist for offline support
- Material UI for styled components
- Emotion CSS for custom CSS-in-JS styling
- npm for package dependency management
- Husky, ESLint, and Prettier for maintaining code standards
- React Testing Library for testing frontend components

## Architecture

### Component Structure
```
src/components/
├── EventCards/          # Card components for events
├── EventLabels/         # Label-related components
├── LoggableEvents/      # Main event list components
├── Sidebar/             # Sidebar components
├── Views/               # Top-level view components (Login, Error, LoggableEvents)
└── EventLoggerPage.tsx  # Main page component
```

### Key Components
- **index.tsx** - starting point and renders App
- **App.tsx** - renders all providers
- **EventLoggerPage.tsx** - initializes apollo client and renders login view or the main view based on user authentication.
also sets up MUI theme
- **LoggableEventsGQL.tsx** - fetches the main GQL query and renders the main view, determining its loading and error states.
the data fetched by the query is stored in cache automatically, and all child components can access the data by
useFragment. _each child that needs data from the cache defines their own fragments and parses their own fragments_
- **LoggableEventsView.tsx** - renders the main view (sidebar, list of events, main query loading states and error
states)
- **LoggableEventsList.tsx** - renders the list of loggable event cards
- **Sidebar.tsx** - renders the sidebar (contains list of event labels)

### Other Directories
- **src/mocks** - mock data factories for tests
- **src/apollo** - Apollo Client configuration, cache setup, token storage, and auth link for token management
- **src/hooks** - custom React hooks for managing states and mutations
- **src/providers** - React Context providers
- **src/utils** - utility functions
- Tests located close to the components they are testing in `__tests__` folders

## Features

### Optimistic Responses
This app utilizes optimistic responses (supported by Apollo) to keep the experience fluid. GQL Mutations are defined
with optimistic responses, which simulates a response from the server and updates the cache immediately. Components that
are subscribed to the data in cache using _useFragment_ will update immediately. When the mutation actually ends, Apollo
will update the cache with the real data.

### Offline Mode
This app allows users to use the app without signing in. The data will be persisted by apollo3-cache-persist, which uses
local storage. Offline Mode data is separate from data when signing in since data is tied to a user, and Offline Mode
uses its own user.

**src/apollo/client.ts** - contains the ApolloLink used to capture GQL mutations in offline mode and returns a response
that mimics a server response, allowing mutations to complete in offline mode.

### Authentication & Refresh Token Flow
The app uses JWT access tokens (15 min expiry) with refresh tokens (30 day expiry) for secure authentication:

1. **Login Flow**
   - User logs in with Google OAuth → Backend validates and returns access token
   - Access token stored in memory only (via `tokenStorage` service)
   - Refresh token stored in httpOnly cookie (secure, not accessible to JS)
   - User info stored in sessionStorage for UI persistence

2. **Request Flow**
   - Apollo auth link gets valid token via `tokenStorage.getValidAccessToken()`
   - Token automatically refreshed if expired (before request is made)
   - Fresh token added to Authorization header
   - Request proceeds with valid authentication

3. **Proactive Token Refresh**
   - Token expiry checked before each request (with 30s buffer)
   - If expired: Native `fetch` API calls refresh mutation
   - Uses httpOnly refresh token cookie automatically
   - Concurrent requests wait for single refresh to complete
   - On success: New token stored, request continues
   - On failure: Token cleared, returns null

4. **Error Handling**
   - If request still fails with UNAUTHORIZED (e.g., refresh token expired)
   - Error link clears all auth data
   - Redirects user to login page
   - No retry attempts (refresh already attempted proactively)

5. **Implementation Details**
   - `tokenStorage` service handles all token operations
   - Uses native `fetch` instead of Apollo Client (avoids circular dependencies)
   - Singleton pattern ensures consistent token state
   - Memory-only storage for access tokens (XSS protection)
   - Automatic expiry checking with configurable buffer

6. **Security Benefits**
   - No tokens in localStorage/sessionStorage (XSS protection)
   - Refresh tokens in httpOnly cookies (not accessible to JS)
   - Proactive refresh reduces failed requests
   - Short-lived access tokens minimize exposure
   - Centralized token management for consistency

## Development

### Note
This project uses Google OAuth for signing in with Google. You will need your own Google Client ID from Google Identity,
otherwise you can just use Offline Mode.

### Prerequisites
- Node.js 16+
- npm 7+

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Type checking
npm run typecheck

# Lint and format
npm run lint
```

### Environment variables
```bash
REACT_APP_GRAPHQL_URL=your-graphql-url
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## Migrations

#### Moment.js to date-fns (July 2025)

When this project started in 2022, Moment.js was the go-to date library. Then, Moment.js entered maintenance mode,
and the JavaScript world shifted away and found lighter alternatives like date-fns.

#### MUI v5 to v7 (July 2025)

Updated to get the most up-to-date styles and learn the new syntax

#### userEvent v13 to v14 (July 2025)

Greatly reduces console warnings in tests about updates to components not wrapped in act(), reducing noise

#### Yarn to npm (July 2025)

Migrated from Yarn 3 to npm for better monorepo standardization. The backend API already uses npm, so this 
migration simplifies tooling across the monorepo. This project was started in 2022 when Yarn was the standard for
web projects, but npm has since caught up.

## Test coverage
As of 2025-08-07, only client.ts and authLink.ts remains uncovered. Will create tests for them in the future.
types.ts only contains common types.

See CLAUDE.md for testing philosophy.
```
-------------------------------|---------|----------|---------|---------|--------------------
File                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s  
-------------------------------|---------|----------|---------|---------|--------------------
All files                      |   94.34 |    85.84 |   95.81 |   94.27 |                    
 src                           |     100 |      100 |     100 |     100 |                    
  App.tsx                      |     100 |      100 |     100 |     100 |                    
  index.tsx                    |     100 |      100 |     100 |     100 |                    
 src/apollo                    |   60.62 |    29.35 |   56.52 |    61.6 |                    
  authLink.ts                  |      40 |        0 |      50 |      40 | 12-13,27-31        
  cache.ts                     |     100 |      100 |     100 |     100 |                    
  client.ts                    |   34.32 |     8.97 |      20 |   35.38 | 18-25,33-40,63-252 
  tokenStorage.ts              |     100 |      100 |     100 |     100 |                    
 src/components                |     100 |      100 |     100 |     100 |                    
  EventLoggerPage.tsx          |     100 |      100 |     100 |     100 |                    
 src/components/EventCards     |     100 |      100 |     100 |     100 |                    
  CreateEventCard.tsx          |     100 |      100 |     100 |     100 |                    
  EditEventCard.tsx            |     100 |      100 |     100 |     100 |                    
  EventCard.tsx                |     100 |      100 |     100 |     100 |                    
  EventCardGridItem.tsx        |     100 |      100 |     100 |     100 |                    
  EventCardHeader.tsx          |     100 |      100 |     100 |     100 |                    
  EventCardLogActions.tsx      |     100 |      100 |     100 |     100 |                    
  EventCardShimmer.tsx         |     100 |      100 |     100 |     100 |                    
  EventDatepicker.tsx          |     100 |      100 |     100 |     100 |                    
  EventLabelAutocomplete.tsx   |     100 |      100 |     100 |     100 |                    
  EventOptionsDropdown.tsx     |     100 |      100 |     100 |     100 |                    
  EventRecord.tsx              |     100 |      100 |     100 |     100 |                    
  LastEventDisplay.tsx         |     100 |      100 |     100 |     100 |                    
  LoggableEventCard.tsx        |     100 |      100 |     100 |     100 |                    
  WarningThresholdForm.tsx     |     100 |      100 |     100 |     100 |                    
 src/components/EventLabels    |     100 |      100 |     100 |     100 |                    
  CreateEventLabelForm.tsx     |     100 |      100 |     100 |     100 |                    
  EventLabel.tsx               |     100 |      100 |     100 |     100 |                    
  EventLabelList.tsx           |     100 |      100 |     100 |     100 |                    
  EventLabelShimmer.tsx        |     100 |      100 |     100 |     100 |                    
 src/components/LoggableEvents |     100 |      100 |     100 |     100 |                    
  LoggableEventsGQL.tsx        |     100 |      100 |     100 |     100 |                    
  LoggableEventsList.tsx       |     100 |      100 |     100 |     100 |                    
 src/components/Sidebar        |     100 |      100 |     100 |     100 |                    
  Sidebar.tsx                  |     100 |      100 |     100 |     100 |                    
  SidebarActions.tsx           |     100 |      100 |     100 |     100 |                    
 src/components/Views          |     100 |      100 |     100 |     100 |                    
  ErrorView.tsx                |     100 |      100 |     100 |     100 |                    
  LoggableEventsView.tsx       |     100 |      100 |     100 |     100 |                    
  LoginView.tsx                |     100 |      100 |     100 |     100 |                    
 src/hooks                     |     100 |      100 |     100 |     100 |                    
  useAuthMutations.ts          |     100 |      100 |     100 |     100 |                    
  useEventLabels.ts            |     100 |      100 |     100 |     100 |                    
  useLoggableEvents.ts         |     100 |      100 |     100 |     100 |                    
  useMuiState.ts               |     100 |      100 |     100 |     100 |                    
 src/providers                 |     100 |      100 |     100 |     100 |                    
  AuthProvider.tsx             |     100 |      100 |     100 |     100 |                    
  ViewOptionsProvider.tsx      |     100 |      100 |     100 |     100 |                    
 src/utils                     |     100 |      100 |     100 |     100 |                    
  theme.ts                     |     100 |      100 |     100 |     100 |                    
  time.ts                      |     100 |      100 |     100 |     100 |                    
  types.ts                     |       0 |        0 |       0 |       0 |                    
  useToggle.ts                 |     100 |      100 |     100 |     100 |                    
  validation.ts                |     100 |      100 |     100 |     100 |                    
-------------------------------|---------|----------|---------|---------|--------------------

Test Suites: 35 passed, 35 total
Tests:       485 passed, 485 total
Snapshots:   0 total
Time:        5.954 s, estimated 11 s
Ran all test suites.
```

## Future plans
- migrate to Next.js since [create-react-app is deprecated and no longer being maintained](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- support different sorting options (alphabetical, creation date, last updated, etc.)
- support pagination
- support fuzzy search
