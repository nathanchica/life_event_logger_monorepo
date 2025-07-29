import { EventLabel, EventLabelFragment } from '../utils/types';

const mockEventLabel: EventLabel = {
    id: 'label-1',
    name: 'Work'
};

export const createMockEventLabel = (overrides: Partial<EventLabel> = {}): EventLabel => {
    return {
        ...mockEventLabel,
        ...overrides
    };
};

const mockEventLabelFragment: EventLabelFragment = {
    __typename: 'EventLabel',
    id: 'label-1',
    name: 'Work'
};

export const createMockEventLabelFragment = (overrides: Partial<EventLabelFragment> = {}): EventLabelFragment => {
    return {
        ...mockEventLabelFragment,
        ...overrides
    };
};
