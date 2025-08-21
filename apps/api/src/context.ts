import { PrismaClient } from '@prisma/client';
import { User as UserModel } from '@prisma/client';
import { parse as parseCookie } from 'cookie';
import type { YogaInitialContext } from 'graphql-yoga';

import { verifyAccessToken } from './auth/token.js';
import { prisma } from './prisma/client.js';

export type RequestMetadata = {
    userAgent: string | undefined;
};

export interface GraphQLContext extends YogaInitialContext {
    user: UserModel | null;
    prisma: PrismaClient;
    request: Request;
    requestMetadata: RequestMetadata;
    response: {
        headers: Headers;
    };
    cookies: Record<string, string | undefined>;
}

export async function createContext({ request, ...rest }: YogaInitialContext): Promise<GraphQLContext> {
    const { headers: requestHeaders } = request;

    // Parse cookies from request headers
    const cookieHeader = requestHeaders.get('cookie');
    const cookies = cookieHeader ? parseCookie(cookieHeader) : {};

    // Create response object for setting headers/cookies
    const responseHeaders = new Headers();
    const response = { headers: responseHeaders };

    // Extract access token from Authorization header
    const authHeader = requestHeaders.get('authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

    const requestMetadata: RequestMetadata = {
        userAgent: requestHeaders.get('user-agent') || undefined
    };

    const contextValues = {
        prisma,
        request,
        requestMetadata,
        response,
        cookies,
        ...rest
    };

    if (!token) {
        return {
            user: null,
            ...contextValues
        };
    }

    try {
        // Verify JWT token with better error handling
        const jwtPayload = verifyAccessToken(token);
        if (!jwtPayload || !jwtPayload.userId) {
            return {
                user: null,
                ...contextValues
            };
        }

        // Find user by JWT payload
        const user = await prisma.user.findUnique({
            where: { id: jwtPayload.userId }
        });

        if (!user) {
            return {
                user: null,
                ...contextValues
            };
        }

        return {
            user,
            ...contextValues
        };
    } catch {
        // Handle token verification errors (expired, invalid, etc)
        // Don't throw - just return null user to let directives handle auth
        return {
            user: null,
            ...contextValues
        };
    }
}
