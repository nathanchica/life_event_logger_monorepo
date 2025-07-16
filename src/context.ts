import { PrismaClient } from '@prisma/client';

import { verifyJWT } from './auth/token.js';
import { prisma } from './prisma/client.js';
import { UserParent } from './schema/user/index.js';

type RequestWithHeaders = {
    headers: {
        get: (key: string) => string | null;
    };
};

export interface GraphQLContext {
    user: UserParent | null;
    prisma: PrismaClient;
}

export async function createContext({ request }: { request: RequestWithHeaders }) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
        return { user: null, prisma };
    }

    // Verify JWT token
    const jwtPayload = verifyJWT(token);
    if (!jwtPayload || !jwtPayload.userId) {
        return { user: null, prisma };
    }

    // Find user by JWT payload
    const user = await prisma.user.findUnique({
        where: { id: jwtPayload.userId }
    });

    if (!user) {
        return { user: null, prisma };
    }

    return { user, prisma };
}
