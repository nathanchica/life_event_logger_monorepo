# life_event_logger_api

### Project status: Launched

Target milestones reached. Will revisit again when I take on the future plans for the
[React App](https://github.com/nathanchica/life_event_logger).

Server deployed at Vercel https://life-event-logger-api.vercel.app/

## Overview

GraphQL API for Life Event Logger app

Built with:

- GraphQL Yoga server
- Prisma ORM for MongoDB Atlas database
- Vercel serverless
- TypeScript
- graphql-codegen for generating GQL types based on schema
- google-auth-library and jsonwebtoken for user authentication and session management
- Husky, Prettier, ESLint for maintaining code standards
- graphql-scalars for custom scalar types
- zod for form validation and env var validation
- npm for dependency management
- Vitest for testing framework

React App at https://github.com/nathanchica/life_event_logger

## Table of Contents

1. [Development Setup](#development-setup)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [GraphQL Security Directives](#graphql-security-directives)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Testing](#testing)
7. [ES Module Import Extensions](#es-module-import-extensions)

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm
- MongoDB Atlas account (for database)
- Google OAuth credentials (for authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/nathanchica/life_event_logger_api.git
cd life_event_logger_api
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Atlas connection string
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"

# JWT secret for token generation
JWT_SECRET="your-secret-key"

# Google OAuth Client ID
GOOGLE_CLIENT_ID="your-google-client-id"

# Node environment
NODE_ENV="development"
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

### Running the Development Server

1. Start the development server:

```bash
npm run dev
```

The GraphQL server will start at http://localhost:4000/api/graphql

2. Access GraphQL playground:
   Navigate to http://localhost:4000/api/graphql in your browser to access the GraphQL playground for testing queries and mutations.

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test eventLabel.test.ts
```

### Database Management

```bash
# Push schema changes to database
npm run prisma:push

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Format Prisma schema
npm run prisma:format
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code with Prettier
npm run format
```

### GraphQL Schema Management

```bash
# Generate TypeScript types from GraphQL schema
npm run generate

# Watch for schema changes and regenerate types
npm run generate:watch
```

## Architecture

```
src/
├── schema/
│   ├── eventLabel/
│   │   ├── index.ts                    # Resolver implementation
|   │   ├── eventLabel.graphql          # Schema file
│   │   ├── __tests__/
│   │   │   └── eventLabel.test.ts      # Test file
│   │   └── __mocks__/
│   │       └── eventLabel.ts           # Mock data factories
│   │
│   ├── root/                           # Schema root
│   └── index.ts                        # Schema merging (New resolvers and directives need to update this file)
|
├── directives/                         # GraphQL directives
├── auth/                               # OAuth and JWT handling
├── prisma/
|   ├── client.ts                       # Prisma client
│   └── __mocks__/
|        └── client.ts                  # Mock Prisma Client
├── mocks/                              # GraphQL Yoga client and context mocks for testing
├── codegen/                            # GraphQL autogenerated types
└── context.ts                          # GraphQL context

api/
└── graphql.ts                          # Vercel serverless function
```

## Authentication Flow

This API uses Google OAuth for user authentication with JWT tokens for session management.

### Login Process

1. **Frontend**: User signs in with Google and obtains Google OAuth ID token
2. **Frontend**: Sends Google OAuth token to `googleOAuthLoginMutation`
3. **Backend**: Verifies Google OAuth token using Google's auth library
4. **Backend**: Creates or finds user in database
5. **Backend**: Generates JWT token (7-day expiration) containing `userId` and `email`
6. **Backend**: Returns JWT token and user object to frontend
7. **Frontend**: Stores JWT token for subsequent requests

### Authenticated Requests

1. **Frontend**: Includes JWT token in `Authorization: Bearer <jwt>` header
2. **Backend**: Verifies JWT token in GraphQL context
3. **Backend**: Loads user from database using `userId` from JWT payload
4. **Backend**: Provides `user` object to resolvers via GraphQL context

### Example

```graphql
# Login mutation
mutation GoogleOAuthLogin($input: GoogleOAuthLoginMutationInput!) {
    googleOAuthLoginMutation(input: $input) {
        token # JWT token to store and use for authenticated requests
        user {
            id
            email
            name
        }
        errors {
            code
            message
        }
    }
}
```

```javascript
// React frontend usage with Apollo Client or similar
import { useMutation, useQuery } from '@apollo/client';

// Login
const [login] = useMutation(GOOGLE_OAUTH_LOGIN);
const handleLogin = async (googleToken) => {
    const { data } = await login({
        variables: { input: { googleToken } }
    });
    // Store JWT token in localStorage or secure storage
    localStorage.setItem('authToken', data.googleOAuthLoginMutation.token);
};

// Authenticated requests (token automatically included via Apollo Client context)
const { data } = useQuery(GET_LOGGED_IN_USER);
```

## GraphQL Security Directives

This API uses custom GraphQL directives to handle authentication and authorization declaratively.

### Available Directives

#### `@requireAuth`

Requires user authentication. Used for operations that need a logged-in user.

```graphql
type Query {
    loggedInUser: User @requireAuth
}

type Mutation {
    createLoggableEvent(input: CreateLoggableEventMutationInput!): CreateLoggableEventMutationPayload! @requireAuth
}
```

#### `@requireOwner(resource: String!)`

Requires user authentication AND ownership of the specified resource. Used for operations that modify user-owned data.

```graphql
type Mutation {
    updateLoggableEvent(input: UpdateLoggableEventMutationInput!): UpdateLoggableEventMutationPayload!
        @requireOwner(resource: "loggableEvent")
    deleteEventLabel(input: DeleteEventLabelMutationInput!): DeleteEventLabelMutationPayload!
        @requireOwner(resource: "eventLabel")
}
```

### Supported Resources

- `loggableEvent` - Validates ownership of LoggableEvent entities
- `eventLabel` - Validates ownership of EventLabel entities

### Error Handling

Directives return standardized GraphQL errors:

- **`UNAUTHORIZED`**: User not authenticated
- **`FORBIDDEN`**: User lacks permission for the resource
- **`NOT_FOUND`**: Requested resource doesn't exist
- **`VALIDATION_ERROR`**: Invalid input or missing resource ID

## Error Handling Patterns

This API uses three distinct patterns for error handling, each suited for different types of errors:

### 1. GraphQL Errors (Exceptions)

These are thrown and appear in the `errors` array of the GraphQL response. Used for:

- **Authentication failures** - When user is not logged in
- **Authorization failures** - When user lacks permission (e.g., trying to access another user's resources)
- **Resource not found** - When attempting operations on non-existent entities
- **Invalid cross-resource references** - When referencing labels/resources that don't belong to the user

**Example Response:**

```json
{
    "data": null,
    "errors": [
        {
            "message": "Some labels do not exist or do not belong to you",
            "extensions": {
                "code": "FORBIDDEN"
            }
        }
    ]
}
```

**Implementation:**

```typescript
// Thrown from resolvers or directives
throw new GraphQLError('Some labels do not exist or do not belong to you', {
    extensions: { code: 'FORBIDDEN' }
});
```

**Note:** GraphQL errors created with `GraphQLError` are not masked and their messages are sent to clients as-is.

### 2. API Errors (Result Pattern)

These are returned as part of the mutation payload in an `errors` field. Used for:

- **Validation errors** - Invalid input data (e.g., name too long, negative numbers)
- **Business logic errors** - Errors that users can fix by changing their input
- **Partial success scenarios** - When some information can still be returned

**Example Response:**

```json
{
    "data": {
        "createLoggableEvent": {
            "loggableEvent": null,
            "errors": [
                {
                    "code": "VALIDATION_ERROR",
                    "field": "name",
                    "message": "Name must be under 25 characters"
                }
            ]
        }
    }
}
```

**Implementation:**

```typescript
// Returned in mutation payloads
return {
    loggableEvent: null,
    errors: [
        {
            code: 'VALIDATION_ERROR',
            field: 'name',
            message: 'Name must be under 25 characters'
        }
    ]
};
```

### 3. Internal Errors (Masked Exceptions)

These are system/unexpected errors that get automatically masked by GraphQL Yoga for security. Used for:

- **Database failures** - Connection errors, query timeouts
- **Network issues** - External service failures
- **Unexpected errors** - Programming errors, null pointer exceptions
- **Any unhandled errors** - Errors not explicitly caught

**Example Response:**

```json
{
    "data": null,
    "errors": [
        {
            "message": "Unexpected error.",
            "extensions": {
                "code": "INTERNAL_SERVER_ERROR"
            },
            "path": ["updateEventLabel"]
        }
    ]
}
```

**Implementation:**

```typescript
// Any thrown Error (not GraphQLError) gets masked
throw new Error('Database connection failed: timeout after 30s');
// Client sees: "Unexpected error."

// In catch blocks for system errors
catch (error) {
    // Log full error server-side for debugging
    console.error('Database error:', error);
    // Throw generic error that gets masked
    throw new Error('Internal server error');
}
```

**Error Masking:** GraphQL Yoga automatically masks error messages from regular `Error` objects to prevent leaking sensitive information. The original error is logged server-side, but clients only see "Unexpected error." This is a security best practice recommended by [GraphQL Yoga documentation](https://the-guild.dev/graphql/yoga-server/docs/features/error-masking).

### When to Use Each Pattern

| Error Type          | Pattern        | Reason                                         |
| ------------------- | -------------- | ---------------------------------------------- |
| Auth failures       | GraphQL Error  | Security violations should interrupt execution |
| Invalid labelIds    | GraphQL Error  | Cross-resource authorization failure           |
| Name too long       | API Error      | User can fix by changing input                 |
| Invalid date format | API Error      | Validation that user can correct               |
| Database connection | Internal Error | System error - details should be hidden        |
| Null reference      | Internal Error | Programming error - mask for security          |

## Testing

This project uses Vitest instead of Jest as its testing framework since it natively supports ESM, is much faster, and
has minimal configuration needed compared to Jest.

See these blogs about Vitest vs Jest:

- https://www.prisma.io/blog/testing-series-1-8eRB5p0Y8o#why-vitest
- https://www.wisp.blog/blog/vitest-vs-jest-which-should-i-use-for-my-nextjs-app

\
As of 2025-07-20, tests coverage is 100%

```bash
Test Files  5 passed (5)
      Tests  78 passed (78)
   Start at  12:10:24
   Duration  1.03s (transform 324ms, setup 61ms, collect 2.37s, tests 182ms, environment 1ms, prepare 427ms)

 % Coverage report from v8
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |     100 |      100 |     100 |     100 |
 auth                 |     100 |      100 |     100 |     100 |
  token.ts            |     100 |      100 |     100 |     100 |
 config               |     100 |      100 |     100 |     100 |
  env.ts              |     100 |      100 |     100 |     100 |
 directives           |     100 |      100 |     100 |     100 |
  auth.ts             |     100 |      100 |     100 |     100 |
 mocks                |     100 |      100 |     100 |     100 |
  client.ts           |     100 |      100 |     100 |     100 |
  context.ts          |     100 |      100 |     100 |     100 |
 schema               |     100 |      100 |     100 |     100 |
  index.ts            |     100 |      100 |     100 |     100 |
 schema/eventLabel    |     100 |      100 |     100 |     100 |
  index.ts            |     100 |      100 |     100 |     100 |
 schema/loggableEvent |     100 |      100 |     100 |     100 |
  index.ts            |     100 |      100 |     100 |     100 |
 schema/user          |     100 |      100 |     100 |     100 |
  index.ts            |     100 |      100 |     100 |     100 |
 utils                |     100 |      100 |     100 |     100 |
  validation.ts       |     100 |      100 |     100 |     100 |
----------------------|---------|----------|---------|---------|-------------------
```

## ES Module Import Extensions

This project uses ES modules with `"type": "module"` in package.json. As a result, **all relative imports must include the `.js` file extension**, even when importing from `.ts` files.

See this [Reddit discussion](https://www.reddit.com/r/typescript/comments/1b87o96/esm_on_nodejs_file_extension_mandatory/)

### Why File Extensions Are Required

Node.js ES modules require explicit file extensions for several reasons:

1. **Official Node.js Standard** - [Node.js ES Modules documentation](https://nodejs.org/api/esm.html#mandatory-file-extensions) states: "A file extension must be provided when using the `import` keyword to resolve relative or absolute specifiers."

2. **Web Compatibility** - Browsers require exact file paths for ES module imports

3. **Performance** - No file system lookups for extension inference

4. **Clarity** - Makes imports explicit and unambiguous

### Examples in This Codebase

```typescript
// ✅ Correct - includes .js extension
import { env } from '../config/env.js';
import { createContext } from '../context.js';
import schema from '../schema/index.js';

// ❌ Incorrect - will cause runtime errors
import { env } from '../config/env';
import { createContext } from '../context';
import schema from '../schema';
```

### Why `.js` and Not `.ts`?

When TypeScript compiles to JavaScript, the imports reference the compiled `.js` files. The `.js` extension in the import statement tells Node.js to look for the compiled JavaScript file at runtime.
