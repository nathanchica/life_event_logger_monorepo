import { LoggableEvent, LoggableEventGQL } from '../utils/types';
import { createMockEventLabel, createMockEventLabelGQL } from './eventLabels';

const mockLoggableEvent: LoggableEvent = {
    id: 'event-1',
    name: 'Test Event 1',
    timestamps: [new Date('2023-01-01T00:00:00Z')],
    createdAt: new Date('2023-01-01T00:00:00Z'),
    warningThresholdInDays: 7,
    labelIds: [
        createMockEventLabel({ id: 'label-1', name: 'Work' }).id,
        createMockEventLabel({ id: 'label-2', name: 'Personal' }).id
    ],
    isSynced: true
};

export const createMockLoggableEvent = (overrides: Partial<LoggableEvent> = {}): LoggableEvent => {
    return {
        ...mockLoggableEvent,
        ...overrides
    };
};

const mockLoggableEventGQL: LoggableEventGQL = {
    id: 'event-1',
    name: 'Test Event 1',
    timestamps: ['2023-01-01T00:00:00Z'],
    createdAt: '2023-01-01T00:00:00Z',
    warningThresholdInDays: 7,
    labels: [
        createMockEventLabelGQL({ id: 'label-1', name: 'Work' }),
        createMockEventLabelGQL({ id: 'label-2', name: 'Personal' })
    ]
};

export const createMockLoggableEventGQL = (overrides: Partial<LoggableEventGQL> = {}): LoggableEventGQL => {
    return {
        ...mockLoggableEventGQL,
        ...overrides
    };
};
