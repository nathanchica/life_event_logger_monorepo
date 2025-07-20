import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockGoogleTokenPayload } from '../../../auth/__mocks__/token.js';
import { verifyGoogleToken, generateJWT } from '../../../auth/token.js';
import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { createMockEventLabel } from '../../eventLabel/__mocks__/eventLabel.js';
import { createMockLoggableEventWithLabels } from '../../loggableEvent/__mocks__/loggableEvent.js';
import { createMockUser, createMockUserWithRelations } from '../__mocks__/user.js';

// Mock the auth token module
vi.mock('../../../auth/token.js', () => ({
    verifyGoogleToken: vi.fn(),
    generateJWT: vi.fn()
}));

describe('User GraphQL', () => {
    let client: TestGraphQLClient;

    beforeEach(() => {
        client = createTestClient();
        vi.clearAllMocks();
    });

    describe('Query.loggedInUser', () => {
        const LOGGED_IN_USER_QUERY = `
            query LoggedInUser {
                loggedInUser {
                    id
                    email
                    name
                    googleId
                    createdAt
                    updatedAt
                }
            }
        `;

        it('should return the logged in user', async () => {
            const mockUser = createMockUserWithRelations({
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User'
            });

            const { data, errors } = await client.request(
                LOGGED_IN_USER_QUERY,
                {},
                { user: mockUser, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.loggedInUser).toEqual({
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                googleId: mockUser.googleId,
                createdAt: mockUser.createdAt.toISOString(),
                updatedAt: mockUser.updatedAt.toISOString()
            });
        });

        it('should return authentication error when no user is logged in', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(LOGGED_IN_USER_QUERY, {}, { user: null, prisma: prismaMock });

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('UNAUTHORIZED');
            expect(data?.loggedInUser).toBeNull();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('googleOAuthLoginMutation', () => {
        const GOOGLE_LOGIN_MUTATION = `
            mutation GoogleLogin($input: GoogleOAuthLoginMutationInput!) {
                googleOAuthLoginMutation(input: $input) {
                    token
                    user {
                        id
                        email
                        name
                        googleId
                        createdAt
                        updatedAt
                    }
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should login successfully with existing user', async () => {
            const mockUser = createMockUser({
                id: 'user-123',
                googleId: 'google_123456',
                email: 'existing@example.com',
                name: 'Existing User'
            });

            const mockGooglePayload = createMockGoogleTokenPayload({
                sub: 'google_123456',
                email: 'existing@example.com',
                name: 'Existing User'
            });

            // Mock Google token verification
            vi.mocked(verifyGoogleToken).mockResolvedValue(mockGooglePayload);

            // Mock finding existing user
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            // Mock JWT generation
            vi.mocked(generateJWT).mockReturnValue('jwt-token-123');

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-google-token' } },
                { user: null, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: 'jwt-token-123',
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    googleId: mockUser.googleId,
                    createdAt: mockUser.createdAt.toISOString(),
                    updatedAt: mockUser.updatedAt.toISOString()
                },
                errors: []
            });

            // Verify mocks were called correctly
            expect(verifyGoogleToken).toHaveBeenCalledWith('valid-google-token');
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { googleId: 'google_123456' }
            });
            expect(prismaMock.user.create).not.toHaveBeenCalled();
            expect(generateJWT).toHaveBeenCalledWith({
                userId: mockUser.id,
                email: mockUser.email
            });
        });

        it('should create new user on first login', async () => {
            const mockGooglePayload = createMockGoogleTokenPayload({
                sub: 'google_789',
                email: 'newuser@example.com',
                name: 'New User'
            });

            const mockNewUser = createMockUser({
                id: 'user-789',
                googleId: 'google_789',
                email: 'newuser@example.com',
                name: 'New User'
            });

            // Mock Google token verification
            vi.mocked(verifyGoogleToken).mockResolvedValue(mockGooglePayload);

            // Mock no existing user found
            prismaMock.user.findUnique.mockResolvedValue(null);

            // Mock user creation
            prismaMock.user.create.mockResolvedValue(mockNewUser);

            // Mock JWT generation
            vi.mocked(generateJWT).mockReturnValue('jwt-token-456');

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-google-token' } },
                { user: null, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: 'jwt-token-456',
                user: {
                    id: mockNewUser.id,
                    email: mockNewUser.email,
                    name: mockNewUser.name,
                    googleId: mockNewUser.googleId,
                    createdAt: mockNewUser.createdAt.toISOString(),
                    updatedAt: mockNewUser.updatedAt.toISOString()
                },
                errors: []
            });

            // Verify mocks were called correctly
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { googleId: 'google_789' }
            });
            expect(prismaMock.user.create).toHaveBeenCalledWith({
                data: {
                    googleId: 'google_789',
                    email: 'newuser@example.com',
                    name: 'New User'
                }
            });
        });

        it('should return validation error for empty google token', async () => {
            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: '' } },
                { user: null, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation.token).toBeNull();
            expect(data.googleOAuthLoginMutation.user).toBeNull();
            expect(data.googleOAuthLoginMutation.errors).toEqual([
                {
                    code: 'VALIDATION_ERROR',
                    field: 'googleToken',
                    message: 'Google token is required'
                }
            ]);

            // Verify no auth operations were attempted
            expect(verifyGoogleToken).not.toHaveBeenCalled();
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
            expect(prismaMock.user.create).not.toHaveBeenCalled();
        });

        it('should handle invalid Google token', async () => {
            // Mock Google token verification returning null
            vi.mocked(verifyGoogleToken).mockResolvedValue(null);

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'invalid-token' } },
                { user: null, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: null,
                user: null,
                errors: [
                    {
                        code: 'INVALID_TOKEN',
                        field: 'googleToken',
                        message: 'Invalid Google token'
                    }
                ]
            });

            expect(verifyGoogleToken).toHaveBeenCalledWith('invalid-token');
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });

        it('should handle incomplete Google payload', async () => {
            const mockGooglePayload = createMockGoogleTokenPayload({
                sub: 'google_123',
                email: 'test@example.com',
                name: undefined
            });

            // Mock Google token verification with missing fields
            vi.mocked(verifyGoogleToken).mockResolvedValue(mockGooglePayload);

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-token' } },
                { user: null, prisma: prismaMock }
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: null,
                user: null,
                errors: [
                    {
                        code: 'INVALID_TOKEN',
                        field: 'googleToken',
                        message: 'Invalid Google token'
                    }
                ]
            });
        });

        it('should handle internal database errors', async () => {
            const mockGooglePayload = createMockGoogleTokenPayload({
                sub: 'google_123456',
                email: 'test@example.com',
                name: 'Test User'
            });

            vi.mocked(verifyGoogleToken).mockResolvedValue(mockGooglePayload);

            // Mock database error
            prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-token' } },
                { user: null, prisma: prismaMock }
            );

            // Should have GraphQL error (masked as "Unexpected error.")
            expect(errors).toBeDefined();
            expect(errors[0].message).toBe('Unexpected error.');
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('User field resolvers', () => {
        describe('User.loggableEvents', () => {
            const USER_WITH_EVENTS_QUERY = `
                query UserWithEvents {
                    loggedInUser {
                        id
                        loggableEvents {
                            id
                            name
                            labels {
                                id
                                name
                            }
                        }
                    }
                }
            `;

            it('should return user loggable events ordered by createdAt desc', async () => {
                const mockUser = createMockUserWithRelations({
                    id: 'user-123'
                });

                const mockLabel = createMockEventLabel({
                    id: 'label-1',
                    name: 'Test Label'
                });

                const mockEvent1 = createMockLoggableEventWithLabels({
                    id: 'event-1',
                    name: 'Event 1',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-01'),
                    labels: []
                });

                const mockEvent2 = createMockLoggableEventWithLabels({
                    id: 'event-2',
                    name: 'Event 2',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-02'),
                    labels: [mockLabel]
                });

                // Mock for User.loggableEvents field resolver
                prismaMock.loggableEvent.findMany.mockResolvedValue([mockEvent2, mockEvent1]);

                // Mock for LoggableEvent.labels field resolver (called for each event)
                prismaMock.eventLabel.findMany
                    .mockResolvedValueOnce([mockLabel]) // For event-2
                    .mockResolvedValueOnce([]); // For event-1

                const { data, errors } = await client.request(
                    USER_WITH_EVENTS_QUERY,
                    {},
                    { user: mockUser, prisma: prismaMock }
                );

                expect(errors).toBeUndefined();
                expect(data.loggedInUser.loggableEvents).toHaveLength(2);
                expect(data.loggedInUser.loggableEvents[0].id).toBe('event-2');
                expect(data.loggedInUser.loggableEvents[1].id).toBe('event-1');

                expect(prismaMock.loggableEvent.findMany).toHaveBeenCalledWith({
                    where: { userId: mockUser.id },
                    include: { labels: true },
                    orderBy: { createdAt: 'desc' }
                });
            });
        });

        describe('User.eventLabels', () => {
            const USER_WITH_LABELS_QUERY = `
                query UserWithLabels {
                    loggedInUser {
                        id
                        eventLabels {
                            id
                            name
                        }
                    }
                }
            `;

            it('should return user event labels ordered by createdAt asc', async () => {
                const mockUser = createMockUserWithRelations({
                    id: 'user-123'
                });

                const mockLabel1 = createMockEventLabel({
                    id: 'label-1',
                    name: 'Label 1',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-02')
                });

                const mockLabel2 = createMockEventLabel({
                    id: 'label-2',
                    name: 'Label 2',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-01')
                });

                // Mock for User.eventLabels field resolver
                prismaMock.eventLabel.findMany.mockResolvedValue([mockLabel2, mockLabel1]);

                const { data, errors } = await client.request(
                    USER_WITH_LABELS_QUERY,
                    {},
                    { user: mockUser, prisma: prismaMock }
                );

                expect(errors).toBeUndefined();
                expect(data.loggedInUser.eventLabels).toHaveLength(2);
                expect(data.loggedInUser.eventLabels[0].id).toBe('label-2');
                expect(data.loggedInUser.eventLabels[1].id).toBe('label-1');

                expect(prismaMock.eventLabel.findMany).toHaveBeenCalledWith({
                    where: { userId: mockUser.id },
                    orderBy: { createdAt: 'asc' }
                });
            });
        });
    });
});
