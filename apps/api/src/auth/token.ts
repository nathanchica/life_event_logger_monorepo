import crypto from 'crypto';

import { DAY_IN_MILLISECONDS } from '@life-event-logger/utils';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Token configuration

export interface TokenPayload {
    userId: string;
    email: string;
}

export interface TokenMetadata {
    userAgent?: string;
    rememberMe?: boolean;
}

export interface RefreshTokenData {
    userId: string;
    tokenId: string;
}

/**
 * Verifies a Google ID token and extracts the payload.
 * @param token - The Google ID token to verify
 * @returns The token payload if valid, null if verification fails
 */
export async function verifyGoogleToken(token: string) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: env.GOOGLE_CLIENT_ID
        });
        return ticket.getPayload();
    } catch {
        return null;
    }
}

/**
 * Generates a JWT access token for a user.
 * @param payload - The token payload containing userId and email
 * @returns A signed JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN_SECONDS
    });
}

/**
 * Verifies a JWT access token and extracts the payload.
 * @param token - The JWT access token to verify
 * @returns The token payload if valid, null if verification fails
 */
export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Generates a cryptographically secure random refresh token.
 * @returns A base64url encoded random token string
 */
export function generateRefreshToken(): string {
    // Generate a cryptographically secure random token
    return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hashes a refresh token using SHA-256 for secure storage.
 * @param token - The refresh token to hash
 * @returns The SHA-256 hash of the token as a hex string
 */
export function hashRefreshToken(token: string): string {
    // Hash the token before storing in database
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a new refresh token for a user and stores it in the database.
 * @param prisma - The Prisma client instance
 * @param userId - The ID of the user to create the token for
 * @param metadata - Optional metadata containing userAgent
 * @returns The unhashed refresh token to be sent to the client
 */
export async function createRefreshToken(
    prisma: PrismaClient,
    userId: string,
    metadata?: TokenMetadata
): Promise<string> {
    const token = generateRefreshToken();
    const hashedToken = hashRefreshToken(token);

    const now = Date.now();
    const slidingWindowMs = env.REFRESH_TOKEN_SLIDING_DAYS * DAY_IN_MILLISECONDS;
    const absoluteMaxMs = env.REFRESH_TOKEN_ABSOLUTE_MAX_DAYS * DAY_IN_MILLISECONDS;

    // For "remember me", use full sliding window; otherwise use 1 day
    const expiresAt = new Date(now + (metadata?.rememberMe ? slidingWindowMs : DAY_IN_MILLISECONDS));
    const absoluteExpiresAt = new Date(now + absoluteMaxMs);

    await prisma.refreshToken.create({
        data: {
            token: hashedToken,
            userId,
            expiresAt,
            absoluteExpiresAt,
            isActive: true,
            userAgent: metadata?.userAgent
        }
    });

    return token;
}

/**
 * Validates a refresh token and returns the associated user data.
 * Automatically deletes expired tokens and updates last used timestamp.
 * @param prisma - The Prisma client instance
 * @param token - The refresh token to validate
 * @returns RefreshTokenData with userId and tokenId if valid, null otherwise
 */
export async function validateRefreshToken(prisma: PrismaClient, token: string): Promise<RefreshTokenData | null> {
    const hashedToken = hashRefreshToken(token);
    const now = new Date();

    const refreshToken = await prisma.refreshToken.findUnique({
        where: { token: hashedToken }
    });

    if (!refreshToken || !refreshToken.isActive) {
        return null;
    }

    // Check absolute expiration (cannot be extended)
    if (refreshToken.absoluteExpiresAt < now) {
        await prisma.refreshToken.delete({
            where: { id: refreshToken.id }
        });
        return null;
    }

    // Check sliding expiration
    if (refreshToken.expiresAt < now) {
        // Token expired due to inactivity
        await prisma.refreshToken.delete({
            where: { id: refreshToken.id }
        });
        return null;
    }

    // Extend sliding window
    const newExpiresAt = new Date(now.getTime() + env.REFRESH_TOKEN_SLIDING_DAYS * DAY_IN_MILLISECONDS);

    // Don't extend beyond absolute expiration
    const finalExpiresAt =
        newExpiresAt > refreshToken.absoluteExpiresAt ? refreshToken.absoluteExpiresAt : newExpiresAt;

    await prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: {
            lastUsedAt: now,
            expiresAt: finalExpiresAt
        }
    });

    return {
        userId: refreshToken.userId,
        tokenId: refreshToken.id
    };
}

/**
 * Rotates a refresh token by deleting the old one and creating a new one.
 * Implements token rotation for enhanced security.
 * @param prisma - The Prisma client instance
 * @param oldTokenId - The ID of the refresh token to rotate
 * @param metadata - Optional metadata containing userAgent
 * @returns The new unhashed refresh token
 * @throws Error if the old token is not found
 */
export async function rotateRefreshToken(
    prisma: PrismaClient,
    oldTokenId: string,
    metadata?: TokenMetadata
): Promise<string> {
    // Get the old token to preserve userId
    const oldToken = await prisma.refreshToken.findUnique({
        where: { id: oldTokenId }
    });

    if (!oldToken) {
        throw new Error('Refresh token not found');
    }

    // Delete old token (rotation)
    await prisma.refreshToken.delete({
        where: { id: oldTokenId }
    });

    // Create new token
    return createRefreshToken(prisma, oldToken.userId, metadata);
}

/**
 * Revokes a specific refresh token by removing it from the database.
 * @param prisma - The Prisma client instance
 * @param token - The refresh token to revoke
 * @returns Promise that resolves when the token is revoked
 */
export async function revokeRefreshToken(prisma: PrismaClient, token: string): Promise<void> {
    const hashedToken = hashRefreshToken(token);

    await prisma.refreshToken.deleteMany({
        where: { token: hashedToken }
    });
}

/**
 * Revokes all refresh tokens for a specific user.
 * Useful for logout from all devices or security incidents.
 * @param prisma - The Prisma client instance
 * @param userId - The ID of the user whose tokens should be revoked
 * @returns Promise that resolves when all tokens are revoked
 */
export async function revokeAllUserTokens(prisma: PrismaClient, userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
        where: { userId }
    });
}
