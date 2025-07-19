# Life Event Logger

### Project status: Launched
Target milestones achieved. Will continue again at a later date with the plans mentioned in
[Future plans](#future-plans) section below

Deployed to Vercel at https://life-event-logger.vercel.app/

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
- yarn for package dependency management
- Husky, ESLint, and Prettier for maintaining code standards
- React Testing Library for testing frontend components

## Architecture
- **index.ts** - starting point and renders App
- **App.ts** - renders all providers
- **EventLoggerPage.ts** - initializes apollo client and renders login view or the main view based on user authentication.
also sets up MUI theme
- **LoggableEventsGQL.ts** - fetches the main GQL query and renders the main view, determining its loading and error states.
the data fetched by the query is stored in cache automatically, and all child components can access the data by
useFragment. _each child that needs data from the cache defines their own fragments and parses their own fragments_
- **LoggableEventsView.ts** - renders the main view (sidebar, list of events, main query loading states and error
states)
- **LoggableEventsList.ts** - renders the list of loggable event cards
- **Sidebar.ts** - renders the sidebar (contains list of event labels)
- **src/mocks** - mock data factories for tests
- Tests located close to the components they are testing

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

## Development

### Note
This project uses Google OAuth for signing in with Google. You will need your own Google Client ID from Google Identity,
otherwise you can just use Offline Mode.

### Prerequisites
- Node.js 16+
- Yarn 3

### Setup
```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run tests
yarn test

# Run tests with coverage
yarn test --coverage

# Type checking
yarn typecheck

# Lint and format
yarn lint
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

## Test coverage
As of 2025-07-19, only client.ts remains uncovered. Will create tests for it in the future. types.ts only contains
common types.

See CLAUDE.md for testing philosophy.
```
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s          
-----------------------------|---------|----------|---------|---------|----------------------------
All files                    |   94.01 |    83.95 |   96.17 |    93.8 |                            
 src                         |     100 |      100 |     100 |     100 |                            
  App.tsx                    |     100 |      100 |     100 |     100 |                            
  index.tsx                  |     100 |      100 |     100 |     100 |                            
 src/apollo                  |   30.76 |    13.09 |   27.27 |   31.25 |                            
  cache.ts                   |     100 |      100 |     100 |     100 |                            
  client.ts                  |      25 |    13.09 |   11.11 |   25.42 | 17-24,32-39,62-251,262-263 
 src/components              |     100 |      100 |     100 |     100 |                            
  EventLoggerPage.tsx        |     100 |      100 |     100 |     100 |                            
  LoggableEventsGQL.tsx      |     100 |      100 |     100 |     100 |                            
  LoggableEventsList.tsx     |     100 |      100 |     100 |     100 |                            
  LoggableEventsView.tsx     |     100 |      100 |     100 |     100 |                            
  LoginView.tsx              |     100 |      100 |     100 |     100 |                            
  Sidebar.tsx                |     100 |      100 |     100 |     100 |                            
 src/components/EventCards   |     100 |      100 |     100 |     100 |                            
  CreateEventCard.tsx        |     100 |      100 |     100 |     100 |                            
  EditEventCard.tsx          |     100 |      100 |     100 |     100 |                            
  EventCard.tsx              |     100 |      100 |     100 |     100 |                            
  EventCardHeader.tsx        |     100 |      100 |     100 |     100 |                            
  EventCardLogActions.tsx    |     100 |      100 |     100 |     100 |                            
  EventDatepicker.tsx        |     100 |      100 |     100 |     100 |                            
  EventLabelAutocomplete.tsx |     100 |      100 |     100 |     100 |                            
  EventOptionsDropdown.tsx   |     100 |      100 |     100 |     100 |                            
  EventRecord.tsx            |     100 |      100 |     100 |     100 |                            
  LastEventDisplay.tsx       |     100 |      100 |     100 |     100 |                            
  LoggableEventCard.tsx      |     100 |      100 |     100 |     100 |                            
  WarningThresholdForm.tsx   |     100 |      100 |     100 |     100 |                            
 src/components/EventLabels  |     100 |      100 |     100 |     100 |                            
  CreateEventLabelForm.tsx   |     100 |      100 |     100 |     100 |                            
  EventLabel.tsx             |     100 |      100 |     100 |     100 |                            
  EventLabelList.tsx         |     100 |      100 |     100 |     100 |                            
 src/hooks                   |     100 |      100 |     100 |     100 |                            
  useEventLabels.ts          |     100 |      100 |     100 |     100 |                            
  useLoggableEvents.ts       |     100 |      100 |     100 |     100 |                            
 src/providers               |     100 |      100 |     100 |     100 |                            
  AuthProvider.tsx           |     100 |      100 |     100 |     100 |                            
  ViewOptionsProvider.tsx    |     100 |      100 |     100 |     100 |                            
 src/utils                   |     100 |      100 |     100 |     100 |                            
  time.ts                    |     100 |      100 |     100 |     100 |                            
  types.ts                   |       0 |        0 |       0 |       0 |                            
  useToggle.ts               |     100 |      100 |     100 |     100 |                            
  validation.ts              |     100 |      100 |     100 |     100 |                            
-----------------------------|---------|----------|---------|---------|----------------------------

Test Suites: 28 passed, 28 total
Tests:       380 passed, 380 total
Snapshots:   0 total
Time:        6.033 s
```

## Future plans
- migrate to Next.js since [create-react-app is deprecated and no longer being maintained](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- support different sorting options (alphabetical, creation date, last updated, etc.)
- support pagination
- support fuzzy search