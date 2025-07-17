# life_event_logger_api

GraphQL API for Life Event Logger app

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

This API uses two distinct patterns for error handling, each suited for different types of errors:

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

### When to Use Each Pattern

| Error Type          | Pattern       | Reason                                         |
| ------------------- | ------------- | ---------------------------------------------- |
| Auth failures       | GraphQL Error | Security violations should interrupt execution |
| Invalid labelIds    | GraphQL Error | Cross-resource authorization failure           |
| Name too long       | API Error     | User can fix by changing input                 |
| Invalid date format | API Error     | Validation that user can correct               |
| Database connection | GraphQL Error | System error beyond user control               |

This dual approach provides:

- **Type safety** for expected errors via the API pattern
- **Security** by treating auth errors as exceptions
- **Consistency** with GraphQL best practices

## ES Module Import Extensions

This project uses ES modules with `"type": "module"` in package.json. As a result, **all relative imports must include the `.js` file extension**, even when importing from `.ts` files.

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

### Community Discussion

This requirement is widely discussed in the TypeScript community. See this [Reddit discussion](https://www.reddit.com/r/typescript/comments/1b87o96/esm_on_nodejs_file_extension_mandatory/) for more context on why this is the current standard.

The current approach with explicit `.js` extensions is the **official Node.js ESM standard** and is considered best practice for modern Node.js development.
