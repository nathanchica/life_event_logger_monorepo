import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import EventLabelAutocomplete from '../components/EventCards/EventLabelAutocomplete';
import { MAX_LABEL_LENGTH } from '../utils/validation';

const mockEventLabels = [
    { id: '1', name: 'Work' },
    { id: '2', name: 'Personal' },
    { id: '3', name: 'Fitness' }
];

const mockCreateEventLabel = jest.fn((name) => ({ id: Math.random().toString(), name }));

// Mock context hook for LoggableEventsProvider
jest.mock('../providers/LoggableEventsProvider', () => {
    const actual = jest.requireActual('../providers/LoggableEventsProvider');
    return {
        ...actual,
        useLoggableEventsContext: () => ({
            eventLabels: mockEventLabels,
            createEventLabel: mockCreateEventLabel
        })
    };
});

function TestEventLabelAutocomplete({ initialSelectedLabels = [] }) {
    const [selectedLabels, setSelectedLabels] = React.useState(initialSelectedLabels);
    return <EventLabelAutocomplete selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} />;
}

describe('EventLabelAutocomplete', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders label chips for selected labels', () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[mockEventLabels[0], mockEventLabels[1]]} />);
        expect(screen.getByText('Work')).toBeInTheDocument();
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('shows suggestions when typing', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'F');
        expect(await screen.findByText('Fitness')).toBeInTheDocument();
    });

    it('calls createEventLabel for new label', async () => {
        mockCreateEventLabel.mockClear();
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'NewLabel');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => {
            expect(mockCreateEventLabel).toHaveBeenCalledWith('NewLabel');
        });
    });

    it('selects a suggestion from the autocomplete', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'Fit');
        const suggestion = await screen.findByText('Fitness');
        await userEvent.click(suggestion);
        expect(screen.getByText('Fitness')).toBeInTheDocument();
    });

    it('shows error when label name is too long', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        const longLabel = 'A'.repeat(MAX_LABEL_LENGTH + 1);
        await userEvent.type(input, longLabel);
        expect(await screen.findByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
    });

    it('does not add a label that is already selected when pressing enter', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[mockEventLabels[0]]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'Work');
        await userEvent.keyboard('{Enter}');
        // The 'Work' label should only appear once in the document
        expect(screen.getAllByText('Work').length).toBe(1);
    });

    it('does not add a label with invalid name when pressing enter', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        // Use a name that is too long
        const invalidLabel = 'A'.repeat(MAX_LABEL_LENGTH + 1);
        await userEvent.type(input, invalidLabel);
        // Error message should be shown
        expect(await screen.findByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
        await userEvent.keyboard('{Enter}');
        // The invalid label should not be present as a chip or option
        expect(screen.queryByText(invalidLabel)).not.toBeInTheDocument();
    });

    it('skips adding already selected labels when multiple are selected', async () => {
        // Start with 'Work' selected, then try to select 'Work' and 'Personal' together
        render(<TestEventLabelAutocomplete initialSelectedLabels={[mockEventLabels[0]]} />);
        const input = screen.getByLabelText('Labels');
        // Simulate typing 'Personal' and selecting it
        await userEvent.type(input, 'Personal');
        const suggestion = await screen.findByText('Personal');
        await userEvent.click(suggestion);
        // Now try to type 'Work' again and press enter
        await userEvent.type(input, 'Work');
        await userEvent.keyboard('{Enter}');
        // Only one 'Work' chip should be present, and 'Personal' should be present
        expect(screen.getAllByText('Work').length).toBe(1);
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });
});
