import { createMockEventLabel, createMockEventLabelFragment } from './eventLabels';

import { LoggableEvent, LoggableEventFragment } from '../utils/types';

const mockLoggableEvent: LoggableEvent = {
    id: 'event-1',
    name: 'Test Event 1',
    timestamps: [new Date('2023-01-01T00:00:00Z')],
    warningThresholdInDays: 7,
    labelIds: [
        createMockEventLabel({ id: 'label-1', name: 'Work' }).id,
        createMockEventLabel({ id: 'label-2', name: 'Personal' }).id
    ]
};

export const createMockLoggableEvent = (overrides: Partial<LoggableEvent> = {}): LoggableEvent => {
    return {
        ...mockLoggableEvent,
        ...overrides
    };
};

const mockLoggableEventFragment: LoggableEventFragment = {
    __typename: 'LoggableEvent',
    id: 'event-1',
    name: 'Test Event 1',
    timestamps: ['2023-01-01T00:00:00Z'],
    warningThresholdInDays: 7,
    labels: [
        createMockEventLabelFragment({ id: 'label-1', name: 'Work' }),
        createMockEventLabelFragment({ id: 'label-2', name: 'Personal' })
    ]
};

export const createMockLoggableEventFragment = (
    overrides: Partial<LoggableEventFragment> = {}
): LoggableEventFragment => {
    return {
        ...mockLoggableEventFragment,
        ...overrides
    };
};
