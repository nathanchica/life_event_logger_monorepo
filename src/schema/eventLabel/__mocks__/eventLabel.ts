import { faker } from '@faker-js/faker';
import { EventLabel } from '@prisma/client';

export const createMockEventLabel = (overrides?: Partial<EventLabel>): EventLabel => {
    return {
        id: faker.string.uuid(),
        name: faker.word.noun({ length: { min: 3, max: 20 } }),
        userId: faker.string.uuid(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        loggableEventIds: [],
        ...overrides
    };
};

export const createMockEventLabelWithDefaults = (userId: string, overrides?: Partial<EventLabel>): EventLabel => {
    return createMockEventLabel({
        userId,
        ...overrides
    });
};
