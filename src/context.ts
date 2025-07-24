import { PrismaClient } from '@prisma/client';
import { User as UserModel } from '@prisma/client';
import type { YogaInitialContext } from 'graphql-yoga';

import { verifyJWT } from './auth/token.js';
import { prisma } from './prisma/client.js';

export interface GraphQLContext extends YogaInitialContext {
    user: UserModel | null;
    prisma: PrismaClient;
}

export async function createContext({ request, ...rest }: YogaInitialContext): Promise<GraphQLContext> {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
        return { user: null, prisma, request, ...rest };
    }

    // Verify JWT token
    const jwtPayload = verifyJWT(token);
    if (!jwtPayload || !jwtPayload.userId) {
        return { user: null, prisma, request, ...rest };
    }

    // Find user by JWT payload
    const user = await prisma.user.findUnique({
        where: { id: jwtPayload.userId }
    });

    if (!user) {
        return { user: null, prisma, request, ...rest };
    }

    return { user, prisma, request, ...rest };
}
