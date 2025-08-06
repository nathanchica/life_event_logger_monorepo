import { faker } from '@faker-js/faker';
import { EventLabel } from '@prisma/client';

export const createMockEventLabel = (overrides?: Partial<EventLabel>): EventLabel => {
    return {
        id: faker.database.mongodbObjectId(),
        name: faker.word.noun({ length: { min: 3, max: 20 } }),
        userId: faker.database.mongodbObjectId(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        loggableEventIds: [],
        ...overrides
    };
};
