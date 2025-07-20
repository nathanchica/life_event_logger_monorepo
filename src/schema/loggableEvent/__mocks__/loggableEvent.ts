import { faker } from '@faker-js/faker';
import { LoggableEvent } from '@prisma/client';

import { EventLabelParent } from '../../eventLabel';

export const createMockLoggableEvent = (overrides?: Partial<LoggableEvent>): LoggableEvent => {
    return {
        id: faker.string.uuid(),
        name: faker.word.noun({ length: { min: 3, max: 20 } }),
        timestamps: [],
        warningThresholdInDays: faker.number.int({ min: 1, max: 365 }),
        userId: faker.string.uuid(),
        labelIds: [],
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        ...overrides
    };
};

export const createMockLoggableEventWithLabels = (
    overrides?: Partial<LoggableEvent> & { labels?: EventLabelParent[] }
) => {
    const { labels, ...eventOverrides } = overrides || {};
    const event = createMockLoggableEvent(eventOverrides);
    return {
        ...event,
        labels: labels || []
    };
};
