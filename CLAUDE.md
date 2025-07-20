# GraphQL Resolver Testing Guidelines

This guide documents the testing patterns and best practices established in this project for testing GraphQL resolvers with Vitest, Prisma mocks, and GraphQL Yoga.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Mock Setup](#mock-setup)
3. [Testing Patterns](#testing-patterns)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)
6. [Complete Example](#complete-example)

## Test Structure

### File Organization

```
src/
├── schema/
│   ├── eventLabel/
│   │   ├── index.ts                    # Resolver implementation
│   │   ├── __tests__/
│   │   │   └── eventLabel.test.ts      # Test file
│   │   └── __mocks__/
│   │       └── eventLabel.ts           # Mock data factories
```

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { createMockEventLabel } from '../__mocks__/factory.js';
import { createMockUserWithRelations } from '../../user/__mocks__/factory.js';

describe('EventLabel GraphQL', () => {
    let client: TestGraphQLClient;

    beforeEach(() => {
        client = createTestClient();
    });

    describe('createEventLabel mutation', () => {
        const CREATE_EVENT_LABEL = `
            mutation CreateEventLabel($input: CreateEventLabelMutationInput!) {
                createEventLabel(input: $input) {
                    tempID
                    eventLabel {
                        id
                        name
                        user {
                            id
                            name
                            email
                        }
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should create a new event label successfully', async () => {
            // Test implementation
        });
    });
});
```

## Mock Setup

### 1. Prisma Mock (Already Set Up)

Located at `src/prisma/__mocks__/client.ts`:

```typescript
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@prisma/client';

beforeEach(() => {
    mockReset(prisma);
});

const prisma = mockDeep<PrismaClient>();
export default prisma;
```

### 2. Mock Data Factories

Create factories in `__mocks__/factory.ts` within each schema directory:

```typescript
import { faker } from '@faker-js/faker';
import { EventLabel } from '@prisma/client';

export const createMockEventLabel = (overrides?: Partial<EventLabel>): EventLabel => {
    return {
        id: faker.string.uuid(),
        name: faker.word.noun({ length: { min: 3, max: 20 } }),
        userId: faker.string.uuid(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        loggableEventIds: [],
        ...overrides
    };
};
```

### 3. Test Client

The test client returns the full GraphQL response (data + errors):

```typescript
const { data, errors } = await client.request(GRAPHQL_OPERATION, variables, contextOverrides);
```

## Testing Patterns

### 1. Successful Operations

```typescript
it('should create a new event label successfully', async () => {
    const mockUser = createMockUserWithRelations({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
    });
    const mockLabel = createMockEventLabel({
        id: 'label-123',
        name: 'Work',
        userId: mockUser.id
    });

    // Mock database calls
    prismaMock.eventLabel.findFirst.mockResolvedValue(null);
    prismaMock.eventLabel.create.mockResolvedValue(mockLabel);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const { data, errors } = await client.request(
        CREATE_EVENT_LABEL,
        { input: { id: 'temp-123', name: 'Work' } },
        { user: mockUser, prisma: prismaMock }
    );

    // Assert no GraphQL errors
    expect(errors).toBeUndefined();

    // Assert mutation response
    expect(data.createEventLabel).toEqual({
        tempID: 'temp-123',
        eventLabel: {
            id: 'label-123',
            name: 'Work',
            createdAt: mockLabel.createdAt.toISOString(),
            updatedAt: mockLabel.updatedAt.toISOString(),
            user: {
                id: 'user-123',
                name: 'Test User',
                email: 'test@example.com'
            }
        },
        errors: []
    });

    // Verify database calls
    expect(prismaMock.eventLabel.create).toHaveBeenCalledWith({
        data: { name: 'Work', userId: 'user-123' }
    });
});
```

### 2. Validation Errors (API Errors)

Use `it.each` for multiple validation scenarios:

```typescript
it.each([
    {
        scenario: 'empty name',
        name: '',
        expectedError: {
            code: 'VALIDATION_ERROR',
            field: 'name',
            message: 'Name cannot be empty'
        }
    },
    {
        scenario: 'name too long',
        name: 'a'.repeat(26),
        expectedError: {
            code: 'VALIDATION_ERROR',
            field: 'name',
            message: 'Name must be under 25 characters'
        }
    }
])('should return validation error for $scenario', async ({ name, expectedError }) => {
    const mockUser = createMockUserWithRelations({ id: 'user-123' });

    const { data, errors } = await client.request(
        CREATE_EVENT_LABEL,
        { input: { id: 'temp-123', name } },
        { user: mockUser, prisma: prismaMock }
    );

    // No GraphQL errors for validation
    expect(errors).toBeUndefined();

    // Validation errors in mutation response
    expect(data.createEventLabel.errors).toEqual([expectedError]);
    expect(data.createEventLabel.eventLabel).toBeNull();

    // Verify no database operation
    expect(prismaMock.eventLabel.create).not.toHaveBeenCalled();
});
```

### 3. Authorization Errors (GraphQL Errors)

```typescript
it('should return auth error when trying to update label owned by another user', async () => {
    const mockUser = createMockUserWithRelations({ id: 'user-123' });
    const otherUserLabel = createMockEventLabel({
        id: 'label-456',
        userId: 'other-user-456'
    });

    prismaMock.eventLabel.findUnique.mockResolvedValue(otherUserLabel);

    // Suppress expected console errors
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { data, errors } = await client.request(
        UPDATE_EVENT_LABEL,
        { input: { id: 'label-456', name: 'NewName' } },
        { user: mockUser, prisma: prismaMock }
    );

    // GraphQL error for authorization
    expect(errors).toBeDefined();
    expect(errors[0].extensions.code).toBe('FORBIDDEN');
    expect(data).toBeNull();

    // Verify operation wasn't attempted
    expect(prismaMock.eventLabel.update).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
});
```

### 4. Internal/Database Errors (Masked GraphQL Errors)

```typescript
it('should return internal error when database fails', async () => {
    const mockUser = createMockUserWithRelations({ id: 'user-123' });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock database failure
    prismaMock.eventLabel.findFirst.mockRejectedValue(new Error('Database connection failed'));

    const { data, errors } = await client.request(
        CREATE_EVENT_LABEL,
        { input: { id: 'temp-123', name: 'Work' } },
        { user: mockUser, prisma: prismaMock }
    );

    // Masked error in GraphQL response
    expect(errors).toBeDefined();
    expect(errors[0].message).toBe('Unexpected error.');
    expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
    expect(data).toBeNull();

    consoleErrorSpy.mockRestore();
});
```

### 5. Field Resolver Errors

When a field resolver throws an error, GraphQL returns partial data:

```typescript
it('should handle field resolver errors with partial data', async () => {
    const mockUser = createMockUserWithRelations({ id: 'user-123' });
    const mockLabel = createMockEventLabel({ userId: mockUser.id });

    prismaMock.eventLabel.create.mockResolvedValue(mockLabel);
    // User not found - field resolver will throw
    prismaMock.user.findUnique.mockResolvedValue(null);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { data, errors } = await client.request(
        CREATE_EVENT_LABEL_WITH_USER,
        { input: { name: 'Work' } },
        { user: mockUser, prisma: prismaMock }
    );

    // Error for the field
    expect(errors).toBeDefined();
    expect(errors[0].extensions.code).toBe('NOT_FOUND');
    expect(errors[0].path).toEqual(['createEventLabel', 'eventLabel', 'user']);

    // Partial data returned
    expect(data.createEventLabel.tempID).toBe('temp-123');
    expect(data.createEventLabel.eventLabel).toBeNull(); // Parent nullified

    consoleErrorSpy.mockRestore();
});
```

## Error Handling

### Error Types and Testing Approach

| Error Type        | Where it Appears       | How to Test                            | Example Code                                                            |
| ----------------- | ---------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| Validation Errors | `data.mutation.errors` | Check error array in mutation response | `expect(data.createEventLabel.errors[0].code).toBe('VALIDATION_ERROR')` |
| Auth Errors       | `errors` array         | Check GraphQL errors                   | `expect(errors[0].extensions.code).toBe('FORBIDDEN')`                   |
| Not Found         | `errors` array         | Check GraphQL errors                   | `expect(errors[0].extensions.code).toBe('NOT_FOUND')`                   |
| Internal Errors   | `errors` array         | Check masked message                   | `expect(errors[0].message).toBe('Unexpected error.')`                   |

### Console Error Suppression

For tests expecting errors, suppress console output:

```typescript
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code ...
consoleErrorSpy.mockRestore();
```

## Best Practices

### 1. Mock Data Consistency

Always use factories with predictable overrides:

```typescript
const mockLabel = createMockEventLabel({
    id: 'label-123', // Predictable ID for assertions
    name: 'Work', // Specific name for test case
    userId: mockUser.id, // Maintain relationships
    createdAt: new Date('2024-01-01'), // Fixed dates for assertions
    updatedAt: new Date('2024-01-01')
});
```

### 2. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names that explain the scenario
- Place GraphQL queries/mutations as constants at the top of each describe block

### 3. Assertion Order

1. Check for GraphQL errors first (`expect(errors).toBeUndefined()`)
2. Assert the main response structure
3. Verify database calls were made correctly
4. Check that certain operations were NOT called when appropriate

### 4. Testing All Paths

Ensure complete coverage by testing:

- ✅ Happy path (successful operations)
- ✅ Validation errors (each validation rule)
- ✅ Business logic errors (duplicate names, etc.)
- ✅ Authorization failures
- ✅ Database/system failures
- ✅ Field resolver errors

### 5. Context Overrides

Use context overrides to simulate different scenarios:

```typescript
// No user (not authenticated)
await client.request(MUTATION, variables, { user: null, prisma: prismaMock });

// Different user
await client.request(MUTATION, variables, { user: otherUser, prisma: prismaMock });
```

### 6. Documenting Mock Usage

Add comments to clarify which part of the resolver flow each Prisma mock is handling:

```typescript
// Mock for checking if event name already exists
prismaMock.loggableEvent.findFirst.mockResolvedValue(null);

// Mock for validateLabelOwnership - checking if labels belong to user
prismaMock.eventLabel.findMany.mockResolvedValueOnce([{ id: 'label-456' } as any]);

// Mock for creating the event
prismaMock.loggableEvent.create.mockResolvedValue(mockEvent);

// Mock for LoggableEvent.user field resolver
prismaMock.user.findUnique.mockResolvedValue(mockUser);

// Mock for LoggableEvent.labels field resolver
prismaMock.eventLabel.findMany.mockResolvedValueOnce([mockLabel]);
```

This is especially important when:

- Multiple mocks of the same type are used (e.g., multiple `findMany` calls)
- The mock's purpose isn't immediately obvious from the test context
- The mock is for a directive (like `@requireOwner`) or field resolver
- The mock represents a specific validation or business logic check

## Complete Example

Here's a complete test file structure following all best practices:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { createMockResource } from '../__mocks__/factory.js';
import { createMockUserWithRelations } from '../../user/__mocks__/factory.js';

describe('Resource GraphQL', () => {
    let client: TestGraphQLClient;

    beforeEach(() => {
        client = createTestClient();
    });

    describe('createResource mutation', () => {
        const CREATE_RESOURCE = `
            mutation CreateResource($input: CreateResourceInput!) {
                createResource(input: $input) {
                    resource { id, name }
                    errors { code, field, message }
                }
            }
        `;

        // Success case
        it('should create resource successfully', async () => {
            // Setup mocks...
            // Make request...
            // Assert success...
        });

        // Validation errors
        it.each([
            /* validation cases */
        ])('should validate $scenario', async () => {
            // Test validation...
        });

        // Business logic error
        it('should prevent duplicates', async () => {
            // Test duplicate prevention...
        });

        // Internal error
        it('should handle database errors', async () => {
            // Test error handling...
        });
    });

    describe('updateResource mutation', () => {
        // Similar structure...
    });

    describe('deleteResource mutation', () => {
        // Similar structure...
    });
});
```

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test eventLabel.test.ts
```

## Debugging Tips

1. **Use console.log** in tests to inspect actual vs expected values
2. **Check mock call arguments**: `console.log(prismaMock.eventLabel.create.mock.calls)`
3. **Inspect full error objects**: Remove error suppression temporarily
4. **Use .only**: Focus on a single test with `it.only('test name', ...)`

Remember: The goal is to achieve high coverage while maintaining readable, maintainable tests that accurately reflect real-world usage patterns.
