import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockEventLabel } from '../../../mocks/eventLabels';
import { createMockLoggableEvent } from '../../../mocks/loggableEvent';
import { createMockViewOptionsContextValue } from '../../../mocks/providers';
import { ViewOptionsContext } from '../../../providers/ViewOptionsProvider';
import { MAX_EVENT_NAME_LENGTH } from '../../../utils/validation';
import EditEventCard from '../EditEventCard';

describe('EditEventCard', () => {
    const mockOnDismiss = jest.fn();
    const mockCreateLoggableEvent = jest.fn();
    const mockUpdateLoggableEventDetails = jest.fn();

    const mockEventLabels = [
        createMockEventLabel({ id: 'label-1', name: 'Work' }),
        createMockEventLabel({ id: 'label-2', name: 'Personal' })
    ];

    const mockEvent = createMockLoggableEvent({
        id: 'event-1',
        name: 'Existing Event',
        timestamps: [],
        warningThresholdInDays: 14,
        labelIds: ['label-1']
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderWithProviders = (component, options = {}) => {
        const { activeEventLabelId = null, theme = 'light' } = options;
        const mockViewOptionsValue = createMockViewOptionsContextValue({
            activeEventLabelId,
            theme
        });

        const muiTheme = createTheme({
            palette: {
                mode: theme
            }
        });

        return render(
            <ThemeProvider theme={muiTheme}>
                <ViewOptionsContext.Provider value={mockViewOptionsValue}>{component}</ViewOptionsContext.Provider>
            </ThemeProvider>
        );
    };

    describe('Rendering', () => {
        it.each([
            ['light', 'light'],
            ['dark', 'dark']
        ])('renders form with correct elements and theme styling in %s mode', (_, themeMode) => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, { theme: themeMode });

            expect(screen.getByLabelText('Event name')).toBeInTheDocument();
            expect(screen.getByLabelText('Enable warning')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Add labels' })).toBeInTheDocument();

            const createButton = screen.getByRole('button', { name: 'Create' });
            const cancelButton = screen.getByRole('button', { name: /Cancel/i });

            expect(createButton).toBeInTheDocument();
            expect(createButton).toBeDisabled();
            expect(cancelButton).toBeInTheDocument();
        });

        it.each([
            ['Create mode', null, 'Create'],
            ['Edit mode', 'event-1', 'Update']
        ])('renders correct button in %s', (_, eventIdToEdit, expectedButtonText) => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit={eventIdToEdit} />);
            expect(screen.getByRole('button', { name: expectedButtonText })).toBeInTheDocument();
        });
    });

    describe('Event name validation', () => {
        it.each([
            ['too long', 'a'.repeat(MAX_EVENT_NAME_LENGTH + 1), 'Event name is too long', null],
            ['duplicate', 'Existing Event', 'That event name already exists', mockEvent]
        ])('shows error and disables button for name %s', async (_, inputValue, expectedError, existingEvent) => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, {
                existingEvents: existingEvent ? [existingEvent] : []
            });

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, inputValue);

            expect(screen.getByText(expectedError)).toBeInTheDocument();
            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeDisabled();
        });

        it('enables button when valid name is entered', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            expect(createButton).toBeEnabled();
        });
    });

    describe('Warning threshold', () => {
        it('shows/hides threshold form based on switch state', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            // Form should be hidden initially
            expect(screen.queryByLabelText('Warning threshold number')).not.toBeVisible();
            expect(screen.queryByLabelText('Warning threshold time unit')).not.toBeVisible();

            // Enable warning threshold
            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            // Form should now be visible
            expect(screen.getByLabelText('Warning threshold number')).toBeVisible();
            expect(screen.getByLabelText('Warning threshold time unit')).toBeVisible();
        });

        it('preserves existing warning threshold when editing event', () => {
            const eventWithWarning = createMockLoggableEvent({
                ...mockEvent,
                warningThresholdInDays: 30
            });

            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [eventWithWarning]
            });

            // Warning should be enabled and form visible
            const warningSwitch = screen.getByLabelText('Enable warning');
            expect(warningSwitch).toBeChecked();
            expect(screen.getByLabelText('Warning threshold number')).toBeVisible();
        });

        it('handles warning threshold changes', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            // Enable warning threshold
            const warningSwitch = screen.getByLabelText('Enable warning');
            await userEvent.click(warningSwitch);

            // Change the warning threshold value
            const numberInput = screen.getByLabelText('Warning threshold number');
            await userEvent.clear(numberInput);
            await userEvent.type(numberInput, '5');

            // Verify the value changed
            expect(numberInput).toHaveValue(5);
        });
    });

    describe('Labels', () => {
        it('shows label input when Add labels is clicked', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const addLabelsButton = screen.getByRole('button', { name: 'Add labels' });
            await userEvent.click(addLabelsButton);

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
        });

        it('pre-populates selected labels when creating new event with active label', () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, {
                eventLabels: mockEventLabels,
                activeEventLabelId: 'label-1'
            });

            expect(screen.getByLabelText('Labels')).toBeInTheDocument();
            expect(screen.getByText('Work')).toBeInTheDocument();
        });

        it('filters and pre-populates labels when editing event with existing labels', () => {
            const existingEvent = createMockLoggableEvent({
                ...mockEvent,
                labelIds: ['label-1']
            });

            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [existingEvent],
                eventLabels: mockEventLabels
            });

            expect(screen.getByText('Work')).toBeInTheDocument();
            expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        });

        it('handles event with no labelIds when editing', () => {
            const existingEvent = createMockLoggableEvent({
                ...mockEvent,
                labelIds: null
            });

            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [existingEvent],
                eventLabels: mockEventLabels
            });

            expect(screen.queryByText('Work')).not.toBeInTheDocument();
            expect(screen.queryByText('Personal')).not.toBeInTheDocument();
        });
    });

    describe('Form submission', () => {
        it('dismisses form when Cancel button is clicked', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const cancelButton = screen.getByRole('button', { name: /Cancel/i });
            await userEvent.click(cancelButton);

            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('creates event and dismisses form when Create button is clicked with valid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            await userEvent.click(createButton);

            expect(mockCreateLoggableEvent).toHaveBeenCalledWith('Test Event', 0, []);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('creates event and dismisses form when Enter key is pressed with valid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event{enter}');

            expect(mockCreateLoggableEvent).toHaveBeenCalledWith('Test Event', 0, []);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('creates event with selected labels', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />, {
                eventLabels: mockEventLabels,
                activeEventLabelId: 'label-1'
            });

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, 'Test Event');

            const createButton = screen.getByRole('button', { name: 'Create' });
            await userEvent.click(createButton);

            expect(mockCreateLoggableEvent).toHaveBeenCalledWith('Test Event', 0, ['label-1']);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not create event when Enter is pressed with invalid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} />);

            const input = screen.getByLabelText('Event name');
            await userEvent.type(input, '{enter}');

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockCreateLoggableEvent).not.toHaveBeenCalled();
        });
    });

    describe('Edit mode', () => {
        it('updates existing event with labels', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [mockEvent],
                eventLabels: mockEventLabels
            });

            const input = screen.getByLabelText('Event name');
            expect(input.value).toBe('Existing Event');
            expect(screen.getByText('Work')).toBeInTheDocument();

            await userEvent.clear(input);
            await userEvent.type(input, 'Updated Event Name');

            const updateButton = screen.getByRole('button', { name: 'Update' });
            await userEvent.click(updateButton);

            expect(mockUpdateLoggableEventDetails).toHaveBeenCalledWith({
                ...mockEvent,
                name: 'Updated Event Name',
                warningThresholdInDays: 14,
                labelIds: ['label-1']
            });
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('only updates event when event name is valid', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [{ ...mockEvent, labelIds: [] }]
            });

            const input = screen.getByLabelText('Event name');
            const updateButton = screen.getByRole('button', { name: 'Update' });

            await userEvent.clear(input);
            expect(updateButton).toBeDisabled();

            await userEvent.type(input, 'Valid Event Name');
            expect(updateButton).toBeEnabled();

            await userEvent.click(updateButton);
            expect(mockUpdateLoggableEventDetails).toHaveBeenCalledTimes(1);
            expect(mockOnDismiss).toHaveBeenCalledTimes(1);
        });

        it('does not update event when Enter is pressed with invalid name', async () => {
            renderWithProviders(<EditEventCard onDismiss={mockOnDismiss} eventIdToEdit="event-1" />, {
                existingEvents: [{ ...mockEvent, labelIds: [] }]
            });

            const input = screen.getByLabelText('Event name');
            await userEvent.clear(input);
            await userEvent.type(input, '{enter}');

            expect(mockOnDismiss).not.toHaveBeenCalled();
            expect(mockUpdateLoggableEventDetails).not.toHaveBeenCalled();
        });
    });
});
