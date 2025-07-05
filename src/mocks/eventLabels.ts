import { EventLabel, EventLabelFragment } from '../utils/types';

const mockEventLabel: EventLabel = {
    id: 'label-1',
    name: 'Work',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    isSynced: true
};

export const createMockEventLabel = (overrides: Partial<EventLabel> = {}): EventLabel => {
    return {
        ...mockEventLabel,
        ...overrides
    };
};

const mockEventLabelFragment: EventLabelFragment = {
    id: 'label-1',
    name: 'Work',
    createdAt: '2023-01-01T00:00:00Z'
};

export const createMockEventLabelFragment = (overrides: Partial<EventLabelFragment> = {}): EventLabelFragment => {
    return {
        ...mockEventLabelFragment,
        ...overrides
    };
};
