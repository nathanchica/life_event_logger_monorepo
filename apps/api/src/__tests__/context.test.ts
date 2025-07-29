import { YogaInitialContext } from 'graphql-yoga';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { verifyAccessToken } from '../auth/token.js';
import { createContext } from '../context.js';
import prismaMock from '../prisma/__mocks__/client.js';
import { createMockUserWithRelations } from '../schema/user/__mocks__/user.js';

// Mock the dependencies
vi.mock('../auth/token.js', () => ({
    verifyAccessToken: vi.fn()
}));

describe('createContext', () => {
    let mockRequest: Request;
    let mockYogaContext: YogaInitialContext;

    beforeEach(() => {
        // Create a mock request
        mockRequest = new Request('http://localhost:4000/graphql', {
            headers: new Headers()
        });

        // Create mock Yoga context
        mockYogaContext = {
            request: mockRequest,
            params: {},
            waitUntil: vi.fn()
        };

        // Reset all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('when no authorization header is provided', () => {
        it('should return context with null user and empty cookies', async () => {
            const context = await createContext(mockYogaContext);

            expect(context.user).toBeNull();
            expect(context.prisma).toBe(prismaMock);
            expect(context.request).toBe(mockRequest);
            expect(context.response).toBeDefined();
            expect(context.response.headers).toBeInstanceOf(Headers);
            expect(context.cookies).toEqual({});
        });
    });

    describe('when cookies are provided', () => {
        it('should parse cookies correctly', async () => {
            mockRequest.headers.set('cookie', 'sessionId=abc123; theme=dark');

            const context = await createContext(mockYogaContext);

            expect(context.cookies).toEqual({
                sessionId: 'abc123',
                theme: 'dark'
            });
        });

        it('should handle empty cookie header', async () => {
            mockRequest.headers.set('cookie', '');

            const context = await createContext(mockYogaContext);

            expect(context.cookies).toEqual({});
        });

        it('should handle malformed cookies gracefully', async () => {
            mockRequest.headers.set('cookie', 'invalid=cookie=value; valid=value');

            const context = await createContext(mockYogaContext);

            expect(context.cookies.valid).toBe('value');
        });
    });

    describe('when authorization header is provided', () => {
        const mockUser = createMockUserWithRelations({
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User'
        });

        beforeEach(() => {
            mockRequest.headers.set('authorization', 'Bearer valid-token');
        });

        it('should return user when token is valid and user exists', async () => {
            vi.mocked(verifyAccessToken).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com'
            });
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const context = await createContext(mockYogaContext);

            expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
            expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'user-123' }
            });
            expect(context.user).toEqual(mockUser);
        });

        it('should return null user when JWT payload is missing userId', async () => {
            vi.mocked(verifyAccessToken).mockReturnValue({
                email: 'test@example.com'
                // Missing userId
            } as ReturnType<typeof verifyAccessToken>);

            const context = await createContext(mockYogaContext);

            expect(context.user).toBeNull();
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });

        it('should return null user when JWT verification returns null', async () => {
            vi.mocked(verifyAccessToken).mockReturnValue(null);

            const context = await createContext(mockYogaContext);

            expect(context.user).toBeNull();
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });

        it('should return null user when user is not found in database', async () => {
            vi.mocked(verifyAccessToken).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com'
            });
            prismaMock.user.findUnique.mockResolvedValue(null);

            const context = await createContext(mockYogaContext);

            expect(context.user).toBeNull();
        });

        it('should return null user when JWT verification throws error', async () => {
            vi.mocked(verifyAccessToken).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const context = await createContext(mockYogaContext);

            expect(context.user).toBeNull();
            expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
        });
    });

    describe('response object', () => {
        it('should create a fresh response headers object for each context', async () => {
            const context1 = await createContext(mockYogaContext);
            const context2 = await createContext(mockYogaContext);

            expect(context1.response.headers).not.toBe(context2.response.headers);
            expect(context1.response.headers).toBeInstanceOf(Headers);
            expect(context2.response.headers).toBeInstanceOf(Headers);
        });
    });

    describe('request metadata', () => {
        it('should extract user agent and IP address from request headers', async () => {
            mockRequest.headers.set('user-agent', 'mock-user-agent');
            mockRequest.headers.set('x-forwarded-for', '127.0.0.1');

            const context = await createContext(mockYogaContext);

            expect(context.requestMetadata.userAgent).toBe('mock-user-agent');
            expect(context.requestMetadata.ipAddress).toBe('127.0.0.1');
        });

        it('should extract IP from x-real-ip if x-forwarded-for not present', async () => {
            mockRequest.headers.set('x-real-ip', '192.168.1.1');

            const context = await createContext(mockYogaContext);

            expect(context.requestMetadata.ipAddress).toBe('192.168.1.1');
        });
    });

    describe('edge cases', () => {
        it('should handle authorization header without Bearer prefix', async () => {
            mockRequest.headers.set('authorization', 'just-a-token');

            const context = await createContext(mockYogaContext);

            // Token without Bearer prefix should not be processed
            expect(verifyAccessToken).not.toHaveBeenCalled();
            expect(context.user).toBeNull();
        });

        it('should handle case-insensitive Bearer prefix', async () => {
            mockRequest.headers.set('authorization', 'bearer valid-token');
            vi.mocked(verifyAccessToken).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com'
            });

            const context = await createContext(mockYogaContext);

            // Case-insensitive 'bearer' should not be processed (must be 'Bearer')
            expect(verifyAccessToken).not.toHaveBeenCalled();
            expect(context.user).toBeNull();
        });

        it('should properly extract token with Bearer prefix', async () => {
            mockRequest.headers.set('authorization', 'Bearer valid-token');
            const mockUser = createMockUserWithRelations({ id: 'user-123' });
            vi.mocked(verifyAccessToken).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com'
            });
            prismaMock.user.findUnique.mockResolvedValue(mockUser);

            const context = await createContext(mockYogaContext);

            // Should extract token without the Bearer prefix
            expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
            expect(context.user).toEqual(mockUser);
        });

        it('should handle database errors gracefully', async () => {
            mockRequest.headers.set('authorization', 'Bearer valid-token');
            vi.mocked(verifyAccessToken).mockReturnValue({
                userId: 'user-123',
                email: 'test@example.com'
            });
            prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'));

            // Database errors are caught and result in null user
            const context = await createContext(mockYogaContext);

            expect(context.user).toBeNull();
            expect(prismaMock.user.findUnique).toHaveBeenCalled();
        });
    });
});
