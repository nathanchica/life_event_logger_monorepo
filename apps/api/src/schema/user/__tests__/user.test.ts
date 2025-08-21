import { serialize } from 'cookie';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockGoogleTokenPayload } from '../../../auth/__mocks__/token.js';
import {
    verifyGoogleToken,
    generateAccessToken,
    createRefreshToken,
    validateRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens
} from '../../../auth/token.js';
import { ClientType } from '../../../generated/graphql.js';
import { createTestClient, TestGraphQLClient } from '../../../mocks/client.js';
import { createMockContext } from '../../../mocks/context.js';
import prismaMock from '../../../prisma/__mocks__/client.js';
import { getIdEncoder } from '../../../utils/encoder.js';
import { createMockEventLabel } from '../../eventLabel/__mocks__/eventLabel.js';
import { createMockLoggableEvent } from '../../loggableEvent/__mocks__/loggableEvent.js';
import { createMockUser, createMockUserWithRelations } from '../__mocks__/user.js';

// Mock the auth token module
vi.mock('../../../auth/token.js', async () => {
    const originalModule = await vi.importActual<typeof import('../../../auth/token.js')>('../../../auth/token.js');
    return {
        ...originalModule,
        verifyGoogleToken: vi.fn(),
        generateAccessToken: vi.fn(),
        createRefreshToken: vi.fn(),
        validateRefreshToken: vi.fn(),
        rotateRefreshToken: vi.fn(),
        revokeRefreshToken: vi.fn(),
        revokeAllUserTokens: vi.fn()
    };
});

// Mock cookie serialization
vi.mock('cookie', () => ({
    serialize: vi.fn()
}));

// Helper to create mock context with spied headers
const createMockContextWithSpy = (overrides?: Parameters<typeof createMockContext>[0]) => {
    const mockContext = createMockContext(overrides);
    const headerSetSpy = vi.spyOn(mockContext.response.headers, 'set');
    return { mockContext, headerSetSpy };
};

// Helper to encode user ID for expected responses
const encodeUserId = (userId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(userId, 'user');
};

// Helper to encode event ID for expected responses
const encodeEventId = (eventId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(eventId, 'loggableEvent');
};

// Helper to encode label ID for expected responses
const encodeLabelId = (labelId: string): string => {
    const encoder = getIdEncoder();
    return encoder.encode(labelId, 'eventLabel');
};

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
                id: encodeUserId(mockUser.id),
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
                    accessToken
                    refreshToken
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

        it('should login successfully with existing user (web client)', async () => {
            const mockUser = createMockUser({
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
            vi.mocked(generateAccessToken).mockReturnValue('access-token-123');
            vi.mocked(createRefreshToken).mockResolvedValue('refresh-token-123');
            vi.mocked(serialize).mockReturnValue('refreshToken=refresh-token-123; HttpOnly');

            const { mockContext, headerSetSpy } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-google-token', clientType: ClientType.Web } },
                mockContext
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: 'access-token-123',
                accessToken: 'access-token-123',
                refreshToken: null, // Not returned for web clients
                user: {
                    id: encodeUserId(mockUser.id),
                    email: mockUser.email,
                    name: mockUser.name,
                    googleId: mockUser.googleId,
                    createdAt: mockUser.createdAt.toISOString(),
                    updatedAt: mockUser.updatedAt.toISOString()
                },
                errors: []
            });

            // Verify cookie was set
            expect(headerSetSpy).toHaveBeenCalledWith('Set-Cookie', 'refreshToken=refresh-token-123; HttpOnly');

            // Verify mocks were called correctly
            expect(verifyGoogleToken).toHaveBeenCalledWith('valid-google-token');
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { googleId: 'google_123456' }
            });
            expect(prismaMock.user.create).not.toHaveBeenCalled();
            expect(generateAccessToken).toHaveBeenCalledWith({
                userId: mockUser.id,
                email: mockUser.email
            });
            expect(createRefreshToken).toHaveBeenCalledWith(prismaMock, mockUser.id, {
                userAgent: 'mock-user-agent'
            });
        });

        it('should login successfully with existing user (mobile client)', async () => {
            const mockUser = createMockUser({
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
            vi.mocked(generateAccessToken).mockReturnValue('access-token-123');
            vi.mocked(createRefreshToken).mockResolvedValue('refresh-token-123');

            const { mockContext, headerSetSpy } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-google-token', clientType: ClientType.Mobile } },
                mockContext
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: 'access-token-123',
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123', // Returned for mobile clients
                user: {
                    id: encodeUserId(mockUser.id),
                    email: mockUser.email,
                    name: mockUser.name,
                    googleId: mockUser.googleId,
                    createdAt: mockUser.createdAt.toISOString(),
                    updatedAt: mockUser.updatedAt.toISOString()
                },
                errors: []
            });

            // Verify no cookie was set for mobile client
            expect(headerSetSpy).not.toHaveBeenCalled();
        });

        it('should create new user on first login', async () => {
            const mockGooglePayload = createMockGoogleTokenPayload({
                sub: 'google_789',
                email: 'newuser@example.com',
                name: 'New User'
            });

            const mockNewUser = createMockUser({
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
            vi.mocked(generateAccessToken).mockReturnValue('access-token-456');
            vi.mocked(createRefreshToken).mockResolvedValue('refresh-token-456');
            vi.mocked(serialize).mockReturnValue('refreshToken=refresh-token-456; HttpOnly');

            const { mockContext } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(
                GOOGLE_LOGIN_MUTATION,
                { input: { googleToken: 'valid-google-token' } },
                mockContext
            );

            expect(errors).toBeUndefined();
            expect(data.googleOAuthLoginMutation).toEqual({
                token: 'access-token-456',
                accessToken: 'access-token-456',
                refreshToken: null,
                user: {
                    id: encodeUserId(mockNewUser.id),
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
            expect(data.googleOAuthLoginMutation.accessToken).toBeNull();
            expect(data.googleOAuthLoginMutation.refreshToken).toBeNull();
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
                accessToken: null,
                refreshToken: null,
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
                accessToken: null,
                refreshToken: null,
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

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('refreshTokenMutation', () => {
        const REFRESH_TOKEN_MUTATION = `
            mutation RefreshToken($input: RefreshTokenMutationInput) {
                refreshTokenMutation(input: $input) {
                    accessToken
                    refreshToken
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should refresh token successfully for web client (token from cookie)', async () => {
            const mockUser = createMockUser({
                email: 'test@example.com',
                name: 'Test User'
            });

            // Mock token validation
            vi.mocked(validateRefreshToken).mockResolvedValue({
                userId: mockUser.id,
                tokenId: 'token-id-123'
            });

            // Mock user lookup
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            // Mock token generation
            vi.mocked(generateAccessToken).mockReturnValue('new-access-token');
            vi.mocked(rotateRefreshToken).mockResolvedValue('new-refresh-token');
            vi.mocked(serialize).mockReturnValue('refreshToken=new-refresh-token; HttpOnly');

            const { mockContext, headerSetSpy } = createMockContextWithSpy({
                user: null,
                prisma: prismaMock,
                cookies: { refreshToken: 'old-refresh-token' }
            });

            const { data, errors } = await client.request(REFRESH_TOKEN_MUTATION, {}, mockContext);

            expect(errors).toBeUndefined();
            expect(data.refreshTokenMutation).toEqual({
                accessToken: 'new-access-token',
                refreshToken: null, // Not returned for web clients
                errors: []
            });

            // Verify cookie was set
            expect(headerSetSpy).toHaveBeenCalledWith('Set-Cookie', 'refreshToken=new-refresh-token; HttpOnly');

            // Verify mocks
            expect(validateRefreshToken).toHaveBeenCalledWith(prismaMock, 'old-refresh-token');
            expect(rotateRefreshToken).toHaveBeenCalledWith(prismaMock, 'token-id-123', {
                userAgent: 'mock-user-agent'
            });
        });

        it('should refresh token successfully for mobile client (token from input)', async () => {
            const mockUser = createMockUser({
                email: 'test@example.com',
                name: 'Test User'
            });

            // Mock token validation
            vi.mocked(validateRefreshToken).mockResolvedValue({
                userId: mockUser.id,
                tokenId: 'token-id-123'
            });

            // Mock user lookup
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            // Mock token generation
            vi.mocked(generateAccessToken).mockReturnValue('new-access-token');
            vi.mocked(rotateRefreshToken).mockResolvedValue('new-refresh-token');

            const { mockContext, headerSetSpy } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(
                REFRESH_TOKEN_MUTATION,
                { input: { refreshToken: 'old-refresh-token' } },
                mockContext
            );

            expect(errors).toBeUndefined();
            expect(data.refreshTokenMutation).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token', // Returned for mobile clients
                errors: []
            });

            // Verify no cookie was set
            expect(headerSetSpy).not.toHaveBeenCalled();
        });

        it('should return error when no refresh token provided', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { mockContext } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(REFRESH_TOKEN_MUTATION, {}, mockContext);

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('UNAUTHENTICATED');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should return error for invalid refresh token', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock invalid token
            vi.mocked(validateRefreshToken).mockResolvedValue(null);

            const { mockContext } = createMockContextWithSpy({
                user: null,
                prisma: prismaMock,
                cookies: { refreshToken: 'invalid-token' }
            });

            const { data, errors } = await client.request(REFRESH_TOKEN_MUTATION, {}, mockContext);

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('UNAUTHENTICATED');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should return error when user not found', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock valid token but user not found
            vi.mocked(validateRefreshToken).mockResolvedValue({
                userId: 'user-123',
                tokenId: 'token-id-123'
            });

            prismaMock.user.findUnique.mockResolvedValue(null);

            const { mockContext } = createMockContextWithSpy({
                user: null,
                prisma: prismaMock,
                cookies: { refreshToken: 'valid-token' }
            });

            const { data, errors } = await client.request(REFRESH_TOKEN_MUTATION, {}, mockContext);

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('NOT_FOUND');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should handle database errors gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock database error
            vi.mocked(validateRefreshToken).mockRejectedValue(new Error('Database connection failed'));

            const { mockContext } = createMockContextWithSpy({
                user: null,
                prisma: prismaMock,
                cookies: { refreshToken: 'valid-token' }
            });

            const { data, errors } = await client.request(REFRESH_TOKEN_MUTATION, {}, mockContext);

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });
    });

    describe('logoutMutation', () => {
        const LOGOUT_MUTATION = `
            mutation Logout($input: LogoutMutationInput) {
                logoutMutation(input: $input) {
                    success
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should logout successfully for web client (token from cookie)', async () => {
            // Mock token revocation
            vi.mocked(revokeRefreshToken).mockResolvedValue();
            vi.mocked(serialize).mockReturnValue('refreshToken=; HttpOnly; Max-Age=0');

            const { mockContext, headerSetSpy } = createMockContextWithSpy({
                user: null,
                prisma: prismaMock,
                cookies: { refreshToken: 'refresh-token' }
            });

            const { data, errors } = await client.request(LOGOUT_MUTATION, {}, mockContext);

            expect(errors).toBeUndefined();
            expect(data.logoutMutation).toEqual({
                success: true,
                errors: []
            });

            // Verify token was revoked
            expect(revokeRefreshToken).toHaveBeenCalledWith(prismaMock, 'refresh-token');

            // Verify cookie was cleared
            expect(headerSetSpy).toHaveBeenCalledWith('Set-Cookie', 'refreshToken=; HttpOnly; Max-Age=0');
        });

        it('should logout successfully for mobile client (token from input)', async () => {
            // Mock token revocation
            vi.mocked(revokeRefreshToken).mockResolvedValue();

            const { mockContext, headerSetSpy } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(
                LOGOUT_MUTATION,
                { input: { refreshToken: 'refresh-token' } },
                mockContext
            );

            expect(errors).toBeUndefined();
            expect(data.logoutMutation).toEqual({
                success: true,
                errors: []
            });

            // Verify token was revoked
            expect(revokeRefreshToken).toHaveBeenCalledWith(prismaMock, 'refresh-token');

            // Verify no cookie operations for mobile
            expect(headerSetSpy).not.toHaveBeenCalled();
        });

        it('should handle logout with no token gracefully', async () => {
            const { mockContext, headerSetSpy } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(LOGOUT_MUTATION, {}, mockContext);

            expect(errors).toBeUndefined();
            expect(data.logoutMutation).toEqual({
                success: true,
                errors: []
            });

            // Verify no token revocation attempted
            expect(revokeRefreshToken).not.toHaveBeenCalled();
            expect(headerSetSpy).not.toHaveBeenCalled();
        });

        it('should handle token revocation errors', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock token revocation failure
            vi.mocked(revokeRefreshToken).mockRejectedValue(new Error('Database error'));

            const { mockContext } = createMockContextWithSpy({
                user: null,
                prisma: prismaMock,
                cookies: { refreshToken: 'refresh-token' }
            });

            const { data, errors } = await client.request(LOGOUT_MUTATION, {}, mockContext);

            expect(errors).toBeUndefined();
            expect(data.logoutMutation).toEqual({
                success: false,
                errors: [
                    {
                        code: 'INTERNAL_ERROR',
                        field: null,
                        message: 'Failed to logout'
                    }
                ]
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('logoutAllDevicesMutation', () => {
        const LOGOUT_ALL_DEVICES_MUTATION = `
            mutation LogoutAllDevices {
                logoutAllDevicesMutation {
                    success
                    errors {
                        code
                        field
                        message
                    }
                }
            }
        `;

        it('should logout from all devices successfully', async () => {
            const mockUser = createMockUserWithRelations({
                email: 'test@example.com'
            });

            // Mock token revocation
            vi.mocked(revokeAllUserTokens).mockResolvedValue();
            vi.mocked(serialize).mockReturnValue('refreshToken=; HttpOnly; Max-Age=0');

            const { mockContext, headerSetSpy } = createMockContextWithSpy({
                user: mockUser,
                prisma: prismaMock,
                cookies: { refreshToken: 'current-refresh-token' }
            });

            const { data, errors } = await client.request(LOGOUT_ALL_DEVICES_MUTATION, {}, mockContext);

            expect(errors).toBeUndefined();
            expect(data.logoutAllDevicesMutation).toEqual({
                success: true,
                errors: []
            });

            // Verify all tokens were revoked
            expect(revokeAllUserTokens).toHaveBeenCalledWith(prismaMock, mockUser.id);

            // Verify current session cookie was cleared
            expect(headerSetSpy).toHaveBeenCalledWith('Set-Cookie', 'refreshToken=; HttpOnly; Max-Age=0');
        });

        it('should return auth error when not authenticated', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const { mockContext } = createMockContextWithSpy({ user: null, prisma: prismaMock });

            const { data, errors } = await client.request(LOGOUT_ALL_DEVICES_MUTATION, {}, mockContext);

            expect(errors).toBeDefined();
            expect(errors[0].extensions.code).toBe('UNAUTHORIZED');
            expect(data).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        it('should handle revocation errors gracefully', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const mockUser = createMockUserWithRelations({
                email: 'test@example.com'
            });

            // Mock revocation failure
            vi.mocked(revokeAllUserTokens).mockRejectedValue(new Error('Database error'));

            const { mockContext } = createMockContextWithSpy({ user: mockUser, prisma: prismaMock });

            const { data, errors } = await client.request(LOGOUT_ALL_DEVICES_MUTATION, {}, mockContext);

            expect(errors).toBeUndefined();
            expect(data.logoutAllDevicesMutation).toEqual({
                success: false,
                errors: [
                    {
                        code: 'INTERNAL_ERROR',
                        field: null,
                        message: 'Failed to logout from all devices'
                    }
                ]
            });

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
                const mockUser = createMockUserWithRelations();

                const mockLabel = createMockEventLabel({
                    name: 'Test Label'
                });

                const mockEvent1 = createMockLoggableEvent({
                    name: 'Event 1',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-01')
                });

                const mockEvent2 = createMockLoggableEvent({
                    name: 'Event 2',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-02')
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
                expect(data.loggedInUser.loggableEvents[0].id).toBe(encodeEventId(mockEvent2.id));
                expect(data.loggedInUser.loggableEvents[1].id).toBe(encodeEventId(mockEvent1.id));

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
                const mockUser = createMockUserWithRelations();

                const mockLabel1 = createMockEventLabel({
                    name: 'Label 1',
                    userId: mockUser.id,
                    createdAt: new Date('2024-01-02')
                });

                const mockLabel2 = createMockEventLabel({
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
                expect(data.loggedInUser.eventLabels[0].id).toBe(encodeLabelId(mockLabel2.id));
                expect(data.loggedInUser.eventLabels[1].id).toBe(encodeLabelId(mockLabel1.id));

                expect(prismaMock.eventLabel.findMany).toHaveBeenCalledWith({
                    where: { userId: mockUser.id },
                    orderBy: { createdAt: 'asc' }
                });
            });
        });
    });
});
