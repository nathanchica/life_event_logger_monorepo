import { PrismaClient } from '@prisma/client';
import { User as UserModel } from '@prisma/client';
import { parse as parseCookie } from 'cookie';
import type { YogaInitialContext } from 'graphql-yoga';

import { verifyJWT } from './auth/token.js';
import { prisma } from './prisma/client.js';

export interface GraphQLContext extends YogaInitialContext {
    user: UserModel | null;
    prisma: PrismaClient;
    request: Request;
    response: {
        headers: Headers;
    };
    cookies: Record<string, string | undefined>;
}

export async function createContext({ request, ...rest }: YogaInitialContext): Promise<GraphQLContext> {
    // Parse cookies from request headers
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader ? parseCookie(cookieHeader) : {};

    // Create response object for setting headers/cookies
    const responseHeaders = new Headers();
    const response = { headers: responseHeaders };

    // Extract access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined;

    if (!token) {
        return {
            user: null,
            prisma,
            request,
            response,
            cookies,
            ...rest
        };
    }

    try {
        // Verify JWT token with better error handling
        const jwtPayload = verifyJWT(token);
        if (!jwtPayload || !jwtPayload.userId) {
            return {
                user: null,
                prisma,
                request,
                response,
                cookies,
                ...rest
            };
        }

        // Find user by JWT payload
        const user = await prisma.user.findUnique({
            where: { id: jwtPayload.userId }
        });

        if (!user) {
            return {
                user: null,
                prisma,
                request,
                response,
                cookies,
                ...rest
            };
        }

        return {
            user,
            prisma,
            request,
            response,
            cookies,
            ...rest
        };
    } catch {
        // Handle token verification errors (expired, invalid, etc)
        // Don't throw - just return null user to let directives handle auth
        return {
            user: null,
            prisma,
            request,
            response,
            cookies,
            ...rest
        };
    }
}
