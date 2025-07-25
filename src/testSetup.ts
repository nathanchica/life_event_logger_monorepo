import { vi } from 'vitest';

// Mock Prisma Client
vi.mock('./prisma/client.js', async () => {
    const prismaMock = await import('./prisma/__mocks__/client.js');
    return {
        prisma: prismaMock.default
    };
});
