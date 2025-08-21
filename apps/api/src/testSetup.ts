import { vi } from 'vitest';

// Set up test environment variables before importing any modules
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS = '30';
process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS = '900';

// Mock Prisma Client
vi.mock('./prisma/client.js', async () => {
    const prismaMock = await import('./prisma/__mocks__/client.js');
    return {
        prisma: prismaMock.default
    };
});

// Mock Google Auth Library
vi.mock('google-auth-library', async () => {
    const oAuth2ClientMock = (await import('./auth/__mocks__/token.js')).oAuth2Client;
    return {
        OAuth2Client: vi.fn().mockImplementation(() => oAuth2ClientMock)
    };
});
