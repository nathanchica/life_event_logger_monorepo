import { useState } from 'react';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useEventLabels } from '../../../hooks/useEventLabels';
import { createMockEventLabel } from '../../../mocks/eventLabels';
import { MAX_LABEL_LENGTH } from '../../../utils/validation';
import EventLabelAutocomplete from '../EventLabelAutocomplete';

jest.mock('../../../hooks/useEventLabels');

describe('EventLabelAutocomplete', () => {
    const mockCreateEventLabel = jest.fn();
    const mockEventLabels = [
        createMockEventLabel({ id: '1', name: 'Work' }),
        createMockEventLabel({ id: '2', name: 'Personal' }),
        createMockEventLabel({ id: '3', name: 'Fitness' })
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateEventLabel.mockImplementation(({ input, onCompleted }) => {
            const mockLabel = createMockEventLabel({ name: input.name });
            if (onCompleted) {
                onCompleted({
                    createEventLabel: {
                        eventLabel: mockLabel
                    }
                });
            }
        });
        useEventLabels.mockReturnValue({
            createEventLabel: mockCreateEventLabel
        });
    });

    function TestEventLabelAutocomplete({ initialSelectedLabels = [] }) {
        const [selectedLabels, setSelectedLabels] = useState(initialSelectedLabels);
        return (
            <EventLabelAutocomplete
                selectedLabels={selectedLabels}
                setSelectedLabels={setSelectedLabels}
                existingLabels={mockEventLabels}
            />
        );
    }

    it.each([['light'], ['dark']])('renders label chips for selected labels in %s mode', (themeMode) => {
        const theme = createTheme({
            palette: {
                mode: themeMode
            }
        });
        render(
            <ThemeProvider theme={theme}>
                <TestEventLabelAutocomplete initialSelectedLabels={[mockEventLabels[0], mockEventLabels[1]]} />
            </ThemeProvider>
        );
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
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'NewLabel');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => {
            expect(mockCreateEventLabel).toHaveBeenCalledWith({
                input: { name: 'NewLabel' },
                onCompleted: expect.any(Function)
            });
        });
    });

    it('calls createEventLabel when clicking "Create new label"', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'NewLabel');
        await userEvent.click(screen.getByText('Create new label: NewLabel'));
        await waitFor(() => {
            expect(mockCreateEventLabel).toHaveBeenCalledWith({
                input: { name: 'NewLabel' },
                onCompleted: expect.any(Function)
            });
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
        expect(screen.getAllByText('Work').length).toBe(1);
    });

    it('does not add a label with invalid name when pressing enter', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[]} />);
        const input = screen.getByLabelText('Labels');
        const invalidLabel = 'A'.repeat(MAX_LABEL_LENGTH + 1);
        await userEvent.type(input, invalidLabel);
        expect(await screen.findByText(`Max ${MAX_LABEL_LENGTH} characters`)).toBeInTheDocument();
        await userEvent.keyboard('{Enter}');
        expect(screen.queryByText(invalidLabel)).not.toBeInTheDocument();
    });

    it('skips adding already selected labels when multiple are selected', async () => {
        render(<TestEventLabelAutocomplete initialSelectedLabels={[mockEventLabels[0]]} />);
        const input = screen.getByLabelText('Labels');
        await userEvent.type(input, 'Personal');
        const suggestion = await screen.findByText('Personal');
        await userEvent.click(suggestion);
        await userEvent.type(input, 'Work');
        await userEvent.keyboard('{Enter}');
        expect(screen.getAllByText('Work').length).toBe(1);
        expect(screen.getByText('Personal')).toBeInTheDocument();
    });
});
