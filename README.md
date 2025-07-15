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
