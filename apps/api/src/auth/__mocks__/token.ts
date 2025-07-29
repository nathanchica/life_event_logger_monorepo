import { faker } from '@faker-js/faker';
import { TokenPayload } from 'google-auth-library';

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
