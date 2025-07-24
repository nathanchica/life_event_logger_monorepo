import crypto from 'crypto';

import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// Token configuration
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface TokenPayload {
    userId: string;
    email: string;
}

export interface TokenMetadata {
    userAgent?: string;
    ipAddress?: string;
}

export interface RefreshTokenData {
    userId: string;
    tokenId: string;
}

export interface RequestWithHeaders {
    headers: {
        get: (name: string) => string | null;
    };
}

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

export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
}

export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

// Keep old functions for backward compatibility during migration
export function generateJWT(payload: { userId: string; email: string }) {
    return generateAccessToken(payload);
}

export function verifyJWT(token: string) {
    return verifyAccessToken(token);
}

export function generateRefreshToken(): string {
    // Generate a cryptographically secure random token
    return crypto.randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token: string): string {
    // Hash the token before storing in database
    return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(
    prisma: PrismaClient,
    userId: string,
    metadata?: TokenMetadata
): Promise<string> {
    const token = generateRefreshToken();
    const hashedToken = hashRefreshToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

    await prisma.refreshToken.create({
        data: {
            token: hashedToken,
            userId,
            expiresAt,
            userAgent: metadata?.userAgent,
            ipAddress: metadata?.ipAddress
        }
    });

    return token;
}

export async function validateRefreshToken(prisma: PrismaClient, token: string): Promise<RefreshTokenData | null> {
    const hashedToken = hashRefreshToken(token);

    const refreshToken = await prisma.refreshToken.findUnique({
        where: { token: hashedToken }
    });

    if (!refreshToken) {
        return null;
    }

    // Check if token is expired
    if (refreshToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({
            where: { id: refreshToken.id }
        });
        return null;
    }

    // Update last used timestamp
    await prisma.refreshToken.update({
        where: { id: refreshToken.id },
        data: { lastUsedAt: new Date() }
    });

    return {
        userId: refreshToken.userId,
        tokenId: refreshToken.id
    };
}

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

export async function revokeRefreshToken(prisma: PrismaClient, token: string): Promise<void> {
    const hashedToken = hashRefreshToken(token);

    await prisma.refreshToken.deleteMany({
        where: { token: hashedToken }
    });
}

export async function revokeAllUserTokens(prisma: PrismaClient, userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
        where: { userId }
    });
}

export function extractTokenMetadata(request: RequestWithHeaders): TokenMetadata {
    return {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            undefined
    };
}
