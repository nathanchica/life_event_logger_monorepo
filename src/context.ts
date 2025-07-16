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
    console.log('Context: Starting context creation');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
        console.log('Context: No token found, returning unauthenticated context');
        return { user: null, prisma };
    }

    console.log('Context: Token found, verifying JWT');
    // Verify JWT token
    const jwtPayload = verifyJWT(token);
    if (!jwtPayload || !jwtPayload.userId) {
        console.log('Context: Invalid JWT token');
        return { user: null, prisma };
    }

    console.log('Context: JWT valid, finding user:', jwtPayload.userId);
    // Find user by JWT payload
    const user = await prisma.user.findUnique({
        where: { id: jwtPayload.userId }
    });

    if (!user) {
        console.log('Context: User not found');
        return { user: null, prisma };
    }

    console.log('Context: User found, returning authenticated context');
    return { user, prisma };
}
