import crypto from 'crypto';

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import prismaMock from '../../prisma/__mocks__/client.js';
import { createMockUser } from '../../schema/user/__mocks__/user.js';
import { createMockGoogleTokenPayload } from '../__mocks__/token.js';
import {
    verifyGoogleToken,
    generateJWT,
    verifyJWT,
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    createRefreshToken,
    validateRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    extractTokenMetadata,
    type RequestWithHeaders
} from '../token.js';

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
        NODE_ENV: 'test',
        REFRESH_TOKEN_EXPIRES_IN_DAYS: 30,
        ACCESS_TOKEN_EXPIRES_IN_SECONDS: 900
    }
}));
vi.mock('crypto');

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

    describe('generateAccessToken', () => {
        it('should generate an access token with user payload', () => {
            const mockUser = createMockUser();
            const payload = {
                userId: mockUser.id,
                email: mockUser.email
            };
            const mockToken = 'mock.access.token';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(jwt.sign).mockReturnValue(mockToken as any);

            const result = generateAccessToken(payload);

            expect(result).toBe(mockToken);
            expect(jwt.sign).toHaveBeenCalledWith(payload, 'mock-jwt-secret', { expiresIn: 900 });
        });

        it('should generate different tokens for different users', () => {
            const user1 = createMockUser({ id: 'user-1', email: 'user1@example.com' });
            const user2 = createMockUser({ id: 'user-2', email: 'user2@example.com' });

            vi.mocked(jwt.sign)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce('token1' as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce('token2' as any);

            const token1 = generateAccessToken({ userId: user1.id, email: user1.email });
            const token2 = generateAccessToken({ userId: user2.id, email: user2.email });

            expect(token1).not.toBe(token2);
            expect(jwt.sign).toHaveBeenCalledTimes(2);
        });
    });

    describe('verifyAccessToken', () => {
        it('should verify a valid access token and return payload', () => {
            const token = 'valid.access.token';
            const mockPayload = {
                userId: 'user-123',
                email: 'user@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);

            const result = verifyAccessToken(token);

            expect(result).toEqual(mockPayload);
            expect(jwt.verify).toHaveBeenCalledWith(token, 'mock-jwt-secret');
        });

        it('should return null when token verification fails', () => {
            const token = 'invalid.access.token';
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = verifyAccessToken(token);

            expect(result).toBeNull();
            expect(jwt.verify).toHaveBeenCalledWith(token, 'mock-jwt-secret');
        });

        it('should return null when token is expired', () => {
            const token = 'expired.access.token';
            vi.mocked(jwt.verify).mockImplementation(() => {
                throw new jwt.TokenExpiredError('Token expired', new Date());
            });

            const result = verifyAccessToken(token);

            expect(result).toBeNull();
        });
    });

    describe('generateJWT (backward compatibility)', () => {
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
            expect(jwt.sign).toHaveBeenCalledWith(payload, 'mock-jwt-secret', { expiresIn: 900 });
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

    describe('verifyJWT (backward compatibility)', () => {
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

    describe('generateRefreshToken', () => {
        it('should generate a base64url encoded refresh token', () => {
            const mockBuffer = Buffer.from('mock-random-bytes-for-refresh-token');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer as any);

            const result = generateRefreshToken();

            expect(result).toBe(mockBuffer.toString('base64url'));
            expect(crypto.randomBytes).toHaveBeenCalledWith(32);
        });

        it('should generate unique tokens on each call', () => {
            const mockBuffer1 = Buffer.from('first-random-bytes');
            const mockBuffer2 = Buffer.from('second-random-bytes');

            vi.mocked(crypto.randomBytes)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce(mockBuffer1 as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce(mockBuffer2 as any);

            const token1 = generateRefreshToken();
            const token2 = generateRefreshToken();

            expect(token1).not.toBe(token2);
            expect(crypto.randomBytes).toHaveBeenCalledTimes(2);
        });
    });

    describe('hashRefreshToken', () => {
        it('should hash a refresh token using SHA256', () => {
            const token = 'test-refresh-token';
            const mockHash = 'mocked-hash-value';
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHash)
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            const result = hashRefreshToken(token);

            expect(result).toBe(mockHash);
            expect(crypto.createHash).toHaveBeenCalledWith('sha256');
            expect(mockHashInstance.update).toHaveBeenCalledWith(token);
            expect(mockHashInstance.digest).toHaveBeenCalledWith('hex');
        });

        it('should generate different hashes for different tokens', () => {
            const token1 = 'refresh-token-1';
            const token2 = 'refresh-token-2';
            const mockHash1 = 'hash-for-token-1';
            const mockHash2 = 'hash-for-token-2';

            const mockHashInstance1 = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHash1)
            };
            const mockHashInstance2 = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHash2)
            };

            vi.mocked(crypto.createHash)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce(mockHashInstance1 as any)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockReturnValueOnce(mockHashInstance2 as any);

            const result1 = hashRefreshToken(token1);
            const result2 = hashRefreshToken(token2);

            expect(result1).toBe(mockHash1);
            expect(result2).toBe(mockHash2);
            expect(result1).not.toBe(result2);
        });
    });

    describe('createRefreshToken', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should create a refresh token in the database', async () => {
            const userId = 'user-123';
            const mockToken = 'generated-refresh-token';
            const mockHashedToken = 'hashed-refresh-token';
            const expectedExpiresAt = new Date('2024-01-31T00:00:00Z'); // 30 days later

            // Mock token generation
            const mockBuffer = Buffer.from(mockToken);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer as any);

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            // Mock database create
            prismaMock.refreshToken.create.mockResolvedValue({
                id: 'token-id',
                token: mockHashedToken,
                userId,
                expiresAt: expectedExpiresAt,
                createdAt: new Date(),
                lastUsedAt: null,
                userAgent: null,
                ipAddress: null
            });

            const result = await createRefreshToken(prismaMock, userId);

            expect(result).toBe(mockBuffer.toString('base64url'));
            expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
                data: {
                    token: mockHashedToken,
                    userId,
                    expiresAt: expectedExpiresAt,
                    userAgent: undefined,
                    ipAddress: undefined
                }
            });
        });

        it('should create a refresh token with metadata', async () => {
            const userId = 'user-123';
            const metadata = {
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1'
            };
            const mockToken = 'generated-refresh-token';
            const mockHashedToken = 'hashed-refresh-token';

            // Mock token generation
            const mockBuffer = Buffer.from(mockToken);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer as any);

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            // Mock database create
            prismaMock.refreshToken.create.mockResolvedValue({
                id: 'token-id',
                token: mockHashedToken,
                userId,
                expiresAt: new Date('2024-01-31T00:00:00Z'),
                createdAt: new Date(),
                lastUsedAt: null,
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress
            });

            const result = await createRefreshToken(prismaMock, userId, metadata);

            expect(result).toBe(mockBuffer.toString('base64url'));
            expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
                data: {
                    token: mockHashedToken,
                    userId,
                    expiresAt: new Date('2024-01-31T00:00:00Z'),
                    userAgent: metadata.userAgent,
                    ipAddress: metadata.ipAddress
                }
            });
        });
    });

    describe('validateRefreshToken', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should validate a valid refresh token', async () => {
            const token = 'valid-refresh-token';
            const mockHashedToken = 'hashed-token';
            const mockRefreshToken = {
                id: 'token-123',
                token: mockHashedToken,
                userId: 'user-123',
                expiresAt: new Date('2024-02-01T00:00:00Z'), // Future date
                createdAt: new Date('2024-01-01T00:00:00Z'),
                lastUsedAt: null,
                userAgent: null,
                ipAddress: null
            };

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            prismaMock.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
            prismaMock.refreshToken.update.mockResolvedValue({
                ...mockRefreshToken,
                lastUsedAt: new Date()
            });

            const result = await validateRefreshToken(prismaMock, token);

            expect(result).toEqual({
                userId: 'user-123',
                tokenId: 'token-123'
            });
            expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
                where: { token: mockHashedToken }
            });
            expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
                where: { id: 'token-123' },
                data: { lastUsedAt: new Date() }
            });
        });

        it('should return null for non-existent token', async () => {
            const token = 'non-existent-token';
            const mockHashedToken = 'hashed-token';

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            prismaMock.refreshToken.findUnique.mockResolvedValue(null);

            const result = await validateRefreshToken(prismaMock, token);

            expect(result).toBeNull();
            expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
                where: { token: mockHashedToken }
            });
            expect(prismaMock.refreshToken.update).not.toHaveBeenCalled();
        });

        it('should delete and return null for expired token', async () => {
            const token = 'expired-refresh-token';
            const mockHashedToken = 'hashed-token';
            const mockRefreshToken = {
                id: 'token-123',
                token: mockHashedToken,
                userId: 'user-123',
                expiresAt: new Date('2024-01-01T00:00:00Z'), // Past date
                createdAt: new Date('2023-12-01T00:00:00Z'),
                lastUsedAt: null,
                userAgent: null,
                ipAddress: null
            };

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            prismaMock.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
            prismaMock.refreshToken.delete.mockResolvedValue(mockRefreshToken);

            const result = await validateRefreshToken(prismaMock, token);

            expect(result).toBeNull();
            expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({
                where: { id: 'token-123' }
            });
            expect(prismaMock.refreshToken.update).not.toHaveBeenCalled();
        });
    });

    describe('rotateRefreshToken', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should rotate refresh token successfully', async () => {
            const oldTokenId = 'old-token-123';
            const userId = 'user-123';
            const newToken = 'new-refresh-token';
            const newHashedToken = 'new-hashed-token';
            const metadata = {
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1'
            };

            const oldRefreshToken = {
                id: oldTokenId,
                token: 'old-hashed-token',
                userId,
                expiresAt: new Date('2024-02-01T00:00:00Z'),
                createdAt: new Date('2024-01-01T00:00:00Z'),
                lastUsedAt: new Date('2024-01-10T00:00:00Z'),
                userAgent: 'Old Browser',
                ipAddress: '10.0.0.1'
            };

            // Mock finding old token
            prismaMock.refreshToken.findUnique.mockResolvedValue(oldRefreshToken);

            // Mock deleting old token
            prismaMock.refreshToken.delete.mockResolvedValue(oldRefreshToken);

            // Mock creating new token
            const mockBuffer = Buffer.from(newToken);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer as any);

            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(newHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            prismaMock.refreshToken.create.mockResolvedValue({
                id: 'new-token-123',
                token: newHashedToken,
                userId,
                expiresAt: new Date('2024-02-14T00:00:00Z'),
                createdAt: new Date(),
                lastUsedAt: null,
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress
            });

            const result = await rotateRefreshToken(prismaMock, oldTokenId, metadata);

            expect(result).toBe(mockBuffer.toString('base64url'));
            expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
                where: { id: oldTokenId }
            });
            expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({
                where: { id: oldTokenId }
            });
            expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
                data: {
                    token: newHashedToken,
                    userId,
                    expiresAt: new Date('2024-02-14T00:00:00Z'),
                    userAgent: metadata.userAgent,
                    ipAddress: metadata.ipAddress
                }
            });
        });

        it('should throw error when old token not found', async () => {
            const oldTokenId = 'non-existent-token';

            prismaMock.refreshToken.findUnique.mockResolvedValue(null);

            await expect(rotateRefreshToken(prismaMock, oldTokenId)).rejects.toThrow('Refresh token not found');

            expect(prismaMock.refreshToken.delete).not.toHaveBeenCalled();
            expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
        });
    });

    describe('revokeRefreshToken', () => {
        it('should revoke a refresh token', async () => {
            const token = 'token-to-revoke';
            const mockHashedToken = 'hashed-token';

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

            await revokeRefreshToken(prismaMock, token);

            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { token: mockHashedToken }
            });
        });

        it('should handle revoking non-existent token gracefully', async () => {
            const token = 'non-existent-token';
            const mockHashedToken = 'hashed-token';

            // Mock token hashing
            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

            // Should not throw
            await expect(revokeRefreshToken(prismaMock, token)).resolves.toBeUndefined();

            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { token: mockHashedToken }
            });
        });
    });

    describe('revokeAllUserTokens', () => {
        it('should revoke all tokens for a user', async () => {
            const userId = 'user-123';

            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 5 });

            await revokeAllUserTokens(prismaMock, userId);

            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId }
            });
        });

        it('should handle revoking when user has no tokens', async () => {
            const userId = 'user-with-no-tokens';

            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

            // Should not throw
            await expect(revokeAllUserTokens(prismaMock, userId)).resolves.toBeUndefined();

            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId }
            });
        });
    });

    describe('extractTokenMetadata', () => {
        it('should extract user agent and IP from request headers', () => {
            const mockRequest: RequestWithHeaders = {
                headers: {
                    get: vi.fn((name: string) => {
                        const headers: Record<string, string> = {
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'x-forwarded-for': '192.168.1.1, 10.0.0.1'
                        };
                        return headers[name] || null;
                    })
                }
            };

            const result = extractTokenMetadata(mockRequest);

            expect(result).toEqual({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                ipAddress: '192.168.1.1'
            });
            expect(mockRequest.headers.get).toHaveBeenCalledWith('user-agent');
            expect(mockRequest.headers.get).toHaveBeenCalledWith('x-forwarded-for');
        });

        it('should extract IP from x-real-ip if x-forwarded-for not present', () => {
            const mockRequest: RequestWithHeaders = {
                headers: {
                    get: vi.fn((name: string) => {
                        const headers: Record<string, string> = {
                            'user-agent': 'Mozilla/5.0',
                            'x-real-ip': '172.16.0.1'
                        };
                        return headers[name] || null;
                    })
                }
            };

            const result = extractTokenMetadata(mockRequest);

            expect(result).toEqual({
                userAgent: 'Mozilla/5.0',
                ipAddress: '172.16.0.1'
            });
            expect(mockRequest.headers.get).toHaveBeenCalledWith('x-real-ip');
        });

        it('should handle missing headers gracefully', () => {
            const mockRequest: RequestWithHeaders = {
                headers: {
                    get: vi.fn(() => null)
                }
            };

            const result = extractTokenMetadata(mockRequest);

            expect(result).toEqual({
                userAgent: undefined,
                ipAddress: undefined
            });
        });

        it('should extract first IP from x-forwarded-for list', () => {
            const mockRequest: RequestWithHeaders = {
                headers: {
                    get: vi.fn((name: string) => {
                        if (name === 'x-forwarded-for') {
                            return '203.0.113.195, 70.41.3.18, 150.172.238.178';
                        }
                        return null;
                    })
                }
            };

            const result = extractTokenMetadata(mockRequest);

            expect(result.ipAddress).toBe('203.0.113.195');
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

        it('should handle refresh token lifecycle', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

            const userId = 'user-123';
            const metadata = {
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1'
            };

            // Create refresh token
            const mockToken = 'initial-refresh-token';
            const mockHashedToken = 'initial-hashed-token';
            const mockBuffer = Buffer.from(mockToken);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.randomBytes).mockReturnValue(mockBuffer as any);

            const mockHashInstance = {
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.createHash).mockReturnValue(mockHashInstance as any);

            const createdToken = {
                id: 'token-123',
                token: mockHashedToken,
                userId,
                expiresAt: new Date('2024-01-31T00:00:00Z'),
                createdAt: new Date(),
                lastUsedAt: null,
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress
            };

            prismaMock.refreshToken.create.mockResolvedValue(createdToken);

            const token = await createRefreshToken(prismaMock, userId, metadata);
            expect(token).toBe(mockBuffer.toString('base64url'));

            // Validate the token
            vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

            // Reset mocks for validation
            vi.mocked(crypto.createHash).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(mockHashedToken)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            prismaMock.refreshToken.findUnique.mockResolvedValue(createdToken);
            prismaMock.refreshToken.update.mockResolvedValue({
                ...createdToken,
                lastUsedAt: new Date()
            });

            const validationResult = await validateRefreshToken(prismaMock, token);
            expect(validationResult).toEqual({
                userId,
                tokenId: 'token-123'
            });

            // Rotate the token
            const newToken = 'new-refresh-token';
            const newHashedToken = 'new-hashed-token';
            const newMockBuffer = Buffer.from(newToken);

            prismaMock.refreshToken.findUnique.mockResolvedValue(createdToken);
            prismaMock.refreshToken.delete.mockResolvedValue(createdToken);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(crypto.randomBytes).mockReturnValue(newMockBuffer as any);
            vi.mocked(crypto.createHash).mockReturnValue({
                update: vi.fn().mockReturnThis(),
                digest: vi.fn().mockReturnValue(newHashedToken)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const newCreatedToken = {
                id: 'new-token-123',
                token: newHashedToken,
                userId,
                expiresAt: new Date('2024-02-14T00:00:00Z'),
                createdAt: new Date(),
                lastUsedAt: null,
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress
            };

            prismaMock.refreshToken.create.mockResolvedValue(newCreatedToken);

            const rotatedToken = await rotateRefreshToken(prismaMock, 'token-123', metadata);
            expect(rotatedToken).toBe(newMockBuffer.toString('base64url'));

            // Revoke all user tokens
            prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
            await revokeAllUserTokens(prismaMock, userId);
            expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
                where: { userId }
            });

            vi.useRealTimers();
        });
    });
});
