import { faker } from '@faker-js/faker';
import { User } from '@prisma/client';

export const createMockUser = (overrides?: Partial<User>): User => {
    return {
        id: faker.string.uuid(),
        googleId: `google_${faker.string.alphanumeric(21)}`,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        ...overrides
    };
};

export const createMockUserWithRelations = (overrides?: Partial<User>) => {
    return {
        ...createMockUser(overrides),
        loggableEvents: [],
        eventLabels: []
    };
};
