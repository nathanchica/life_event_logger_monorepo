import { faker } from '@faker-js/faker';
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

export const oAuth2Client = mockDeep<OAuth2Client>();
