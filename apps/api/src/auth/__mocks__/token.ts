import { faker } from '@faker-js/faker';
import { RefreshToken } from '@prisma/client';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';

beforeEach(() => {
    mockReset(oAuth2Client);
});

export const createMockGoogleTokenPayload = (overrides?: Partial<TokenPayload>): TokenPayload => {
    return {
        sub: `google_${faker.string.alphanumeric(21)}`,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        iss: 'https://accounts.google.com',
        aud: 'https://your-app.com',
        iat: 1678901234,
        exp: 1678904834,
        ...overrides
    };
};

export const createMockRefreshToken = (overrides?: Partial<RefreshToken>): RefreshToken => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
        id: faker.database.mongodbObjectId(),
        token: faker.string.alphanumeric(64),
        userId: faker.database.mongodbObjectId(),
        expiresAt: sevenDaysFromNow,
        absoluteExpiresAt: thirtyDaysFromNow,
        isActive: true,
        createdAt: now,
        lastUsedAt: null,
        userAgent: faker.internet.userAgent(),
        ...overrides
    };
};

export const oAuth2Client = mockDeep<OAuth2Client>();
