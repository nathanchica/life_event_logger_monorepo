import { vi } from 'vitest';

// Mock Prisma Client
vi.mock('./prisma/client.js', () => ({
    default: () => import('./prisma/__mocks__/client.js')
}));
