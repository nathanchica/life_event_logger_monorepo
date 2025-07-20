import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'vitest-mock-extended';

import { GraphQLContext } from '../context.js';
import prismaMock from '../prisma/__mocks__/client.js';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const createMockContext = (overrides?: Partial<GraphQLContext>): GraphQLContext => {
    return {
        prisma: prismaMock,
        user: null,
        ...overrides
    };
};
