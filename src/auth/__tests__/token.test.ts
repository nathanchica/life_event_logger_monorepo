import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockUser } from '../../schema/user/__mocks__/user.js';
import { createMockGoogleTokenPayload } from '../__mocks__/token.js';
import { verifyGoogleToken, generateJWT, verifyJWT } from '../token.js';

// Mock the external dependencies
vi.mock('jsonwebtoken');
vi.mock('google-auth-library', () => {
    const OAuth2Client = vi.fn();
    OAuth2Client.prototype.verifyIdToken = vi.fn();
    return { OAuth2Client };
});
vi.mock('../../config/env.js', () => ({
    env: {
        GOOGLE_CLIENT_ID: 'mock-google-client-id',
        JWT_SECRET: 'mock-jwt-secret',
        NODE_ENV: 'test'
    }
}));

describe('Token utilities', () => {
    let mockOAuth2Client;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOAuth2Client = new OAuth2Client('mock-google-client-id');
    });

    describe('verifyGoogleToken', () => {
        it('should verify a valid Google token and return payload', async () => {
            const token = 'valid-google-token';
            const mockPayload = createMockGoogleTokenPayload({
                sub: 'google_123456789',
                email: 'test@example.com',
                name: 'Test User'
            });

            mockOAuth2Client.verifyIdToken.mockResolvedValue({
                getPayload: () => mockPayload
            });

            const result = await verifyGoogleToken(token);

            expect(result).toEqual(mockPayload);
            expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
                idToken: token,
                audience: 'mock-google-client-id'
            });
        });

        it('should return null when token verification fails', async () => {
            const token = 'invalid-google-token';
            mockOAuth2Client.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

            const result = await verifyGoogleToken(token);

            expect(result).toBeNull();
            expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
                idToken: token,
                audience: 'mock-google-client-id'
            });
        });

        it('should return null when token is expired', async () => {
            const token = 'expired-google-token';
            mockOAuth2Client.verifyIdToken.mockRejectedValue(new Error('Token used too late'));

            const result = await verifyGoogleToken(token);

            expect(result).toBeNull();
        });

        it('should return null when audience mismatch', async () => {
            const token = 'wrong-audience-token';
            mockOAuth2Client.verifyIdToken.mockRejectedValue(new Error('Token audience mismatch'));

            const result = await verifyGoogleToken(token);

            expect(result).toBeNull();
        });
    });

    describe('generateJWT', () => {
        it('should generate a JWT token with user payload', () => {
            const mockUser = createMockUser();
            const payload = {
                userId: mockUser.id,
                email: mockUser.email
            };
            const mockToken = 'mock.jwt.token';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(jwt.sign).mockReturnValue(mockToken as any);

            const result = generateJWT(payload);

            expect(result).toBe(mockToken);
            expect(jwt.sign).toHaveBeenCalledWith(payload, 'mock-jwt-secret', { expiresIn: '7d' });
        });

        it('should generate different tokens for different users', () => {
            const user1 = createMockUser({ id: 'user-1', email: 'user1@example.com' });
            const user2 = createMockUser({ id: 'user-2', email: 'user2@example.com' });

            vi.mocked(jwt.sign)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce('token1' as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce('token2' as any);

            const token1 = generateJWT({ userId: user1.id, email: user1.email });
            const token2 = generateJWT({ userId: user2.id, email: user2.email });

            expect(token1).not.toBe(token2);
            expect(jwt.sign).toHaveBeenCalledTimes(2);
        });
    });

    describe('verifyJWT', () => {
        it('should verify a valid JWT token and return payload', () => {
            const token = 'valid.jwt.token';
            const mockPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);

            const result = verifyJWT(token);

            expect(result).toEqual(mockPayload);
            expect(jwt.verify).toHaveBeenCalledWith(token, 'mock-jwt-secret');
        });

        it('should return null when token verification fails', () => {
            const token = 'invalid.jwt.token';
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = verifyJWT(token);

            expect(result).toBeNull();
            expect(jwt.verify).toHaveBeenCalledWith(token, 'mock-jwt-secret');
        });

        it('should return null when token is expired', () => {
            const token = 'expired.jwt.token';
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new jwt.TokenExpiredError('Token expired', new Date());
            });

            const result = verifyJWT(token);

            expect(result).toBeNull();
        });

        it('should return null when token has invalid signature', () => {
            const token = 'tampered.jwt.token';
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new jwt.JsonWebTokenError('Invalid signature');
            });

            const result = verifyJWT(token);

            expect(result).toBeNull();
        });

        it('should return null when token is malformed', () => {
            const token = 'not-a-jwt';
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new jwt.JsonWebTokenError('jwt malformed');
            });

            const result = verifyJWT(token);

            expect(result).toBeNull();
        });
    });

    describe('Integration scenarios', () => {
        it('should handle the full authentication flow', async () => {
            const googleToken = 'google-token';
            const mockGooglePayload = createMockGoogleTokenPayload({
                sub: 'google_123',
                email: 'user@example.com',
                name: 'Test User'
            });

            const mockTicket = {
                getPayload: vi.fn().mockReturnValue(mockGooglePayload)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockOAuth2Client.verifyIdToken.mockResolvedValue(mockTicket as any);

            // Verify Google token
            const googlePayload = await verifyGoogleToken(googleToken);
            expect(googlePayload).toBeTruthy();

            // Generate JWT
            const jwtPayload = {
                userId: 'user-123',
                email: googlePayload!.email!
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(jwt.sign).mockReturnValue('jwt.token' as any);
            const jwtToken = generateJWT(jwtPayload);

            // Verify JWT
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(jwt.verify).mockReturnValue(jwtPayload as any);
            const verifiedPayload = verifyJWT(jwtToken);

            expect(verifiedPayload).toEqual(jwtPayload);
        });
    });
});
